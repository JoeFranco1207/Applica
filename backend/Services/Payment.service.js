import axios from 'axios';
import AppError from '../Middleware/AppError.js';
import User from '../Model/UserSchema.js';

const PAYMONGO_KEY = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_BASE_URL = process.env.PAYMONGO_BASE_URL || 'https://api.paymongo.com/v1';
const PREMIUM_AMOUNT = parseInt(process.env.AI_PREMIUM_AMOUNT || '19900', 10); // ₱199.00 in cents

const getPaymongoAuth = () => {
  if (!PAYMONGO_KEY) {
    throw new AppError('PayMongo secret key is not configured.', 500);
  }
  return {
    username: PAYMONGO_KEY,
    password: '',
  };
};

export const createAIPremiumPaymentSource = async (userId, req) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  // Determine frontend origin from the incoming request so redirects land
  // on the same origin where `localStorage` was written.
  const deriveFrontendOrigin = () => {
    // Prefer explicit env override
    if (process.env.PAYMONGO_SUCCESS_URL && process.env.PAYMONGO_FAILED_URL) {
      return {
        success: process.env.PAYMONGO_SUCCESS_URL,
        failed: process.env.PAYMONGO_FAILED_URL,
      };
    }

    // Try to read Origin header (most reliable for SPA requests)
    try {
      const origin = req?.headers?.origin || req?.get?.('origin') || null;
      if (origin) {
        return {
          success: `${origin.replace(/\/$/, '')}/ai-premium/success`,
          failed: `${origin.replace(/\/$/, '')}/ai-premium/failed`,
        };
      }

      // Fallback to Referer header and extract origin
      const referer = req?.headers?.referer || req?.get?.('referer') || null;
      if (referer) {
        try {
          const url = new URL(referer);
          return {
            success: `${url.origin}/ai-premium/success`,
            failed: `${url.origin}/ai-premium/failed`,
          };
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }

    // Last resort defaults (keep previous defaults)
    return {
      success: process.env.PAYMONGO_SUCCESS_URL || 'http://localhost:5177/ai-premium/success',
      failed: process.env.PAYMONGO_FAILED_URL || 'http://localhost:5177/ai-premium/failed',
    };
  };

  const { success: successUrl, failed: failedUrl } = deriveFrontendOrigin();

  // Allow caller to specify payment method (e.g. 'gcash' or 'card').
  const paymentType = (req?.body?.method || req?.query?.method || 'gcash').toString().toLowerCase();

  const payload = {
    data: {
      attributes: {
        type: paymentType,
        amount: PREMIUM_AMOUNT,
        currency: 'PHP',
        redirect: {
          success: successUrl,
          failed: failedUrl,
        },
        billing: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        },
        description: 'Applica AI Premium Access',
        // Include user id so webhooks (when they fire) can map events to users
        metadata: {
          userId: String(user._id),
        },
      },
    },
  };

  try {
    const response = await axios.post(
      `${PAYMONGO_BASE_URL}/sources`,
      payload,
      {
        auth: getPaymongoAuth(),
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    const source = response.data?.data;
    const checkoutUrl = source?.attributes?.redirect?.checkout_url;
    console.log('PayMongo create source response:', { id: source?.id, status: source?.attributes?.status });
    if (!checkoutUrl) {
      throw new AppError('PayMongo checkout URL was not returned.', 502);
    }

    // Persist the most-recent source id on the user document so redirects
    // that omit query params can still be confirmed.
    try {
      await User.findByIdAndUpdate(userId, { lastAIPaymentSource: source.id });
    } catch (e) {
      console.warn('Failed to save lastAIPaymentSource on user:', e?.message || e);
    }

    return {
      paymentUrl: checkoutUrl,
      sourceId: source.id,
    };
  } catch (err) {
    console.error('PayMongo API Response Status:', err?.response?.status);
    console.error('PayMongo API Response Data:', err?.response?.data);
    console.error('PayMongo Error Message:', err?.message);
    const errorDetail = err?.response?.data?.errors?.[0]?.detail || err?.message || 'Unknown error';
    throw new AppError(`Failed to create PayMongo payment source: ${errorDetail}`, 502);
  }
};

export const confirmAIPremiumPaymentSource = async (userId, sourceId) => {
  // If sourceId wasn't provided (redirect omitted it), try the last saved source
  if (!sourceId) {
    const user = await User.findById(userId).select('lastAIPaymentSource');
    if (user && user.lastAIPaymentSource) {
      sourceId = user.lastAIPaymentSource;
    }
  }

  if (!sourceId) {
    throw new AppError('Source ID is required to confirm payment.', 400);
  }

  try {
    console.log('Confirming PayMongo source:', sourceId, 'for user', userId);
    const response = await axios.get(
      `${PAYMONGO_BASE_URL}/sources/${sourceId}`,
      {
        auth: getPaymongoAuth(),
        timeout: 20000,
      }
    );

    const source = response.data?.data;
    console.log('PayMongo source lookup result:', source?.id, source?.attributes?.status);
    const status = source?.attributes?.status;
    if (!source || !status) {
      throw new AppError('Unable to verify PayMongo payment source.', 502);
    }

    const successfulStatuses = ['chargeable', 'captured', 'paid', 'consumed'];
    if (!successfulStatuses.includes(status)) {
      throw new AppError('Payment has not been completed yet.', 400);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { premiumAIAccess: true },
      { new: true }
    );

    if (!updatedUser) {
      throw new AppError('User not found.', 404);
    }

    return {
      premiumAIAccess: true,
      status,
    };
  } catch (err) {
    console.error('PayMongo confirm error', err?.response?.data || err?.message || err);
    throw err;
  }
};
