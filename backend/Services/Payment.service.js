import axios from 'axios';
import AppError from '../Middleware/AppError.js';
import User from '../Model/UserSchema.js';

const PAYMONGO_KEY = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_BASE_URL = process.env.PAYMONGO_BASE_URL || 'https://api.paymongo.com/v1';

const PREMIUM_PLAN_AMOUNTS = {
  monthly: 6900,
  halfYearly: 45000,
  annual: 79900,
};

const getPaymongoAuth = () => {
  if (!PAYMONGO_KEY) {
    throw new AppError('PayMongo secret key is not configured.', 500);
  }
  return {
    username: PAYMONGO_KEY,
    password: '',
  };
};

const getPremiumAmountForPlan = (plan) => {
  const amount = PREMIUM_PLAN_AMOUNTS[plan];
  if (!amount) {
    throw new AppError('Invalid premium plan selected.', 400);
  }
  return amount;
};

export const createAIPremiumPaymentSource = async (userId, req) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const plan = (req?.body?.plan || req?.query?.plan || 'monthly').toString();
  const amount = getPremiumAmountForPlan(plan);

  // Determine frontend origin from the incoming request so redirects land
  // on the same origin where the SPA wrote localStorage.
  const deriveFrontendOrigin = () => {
    if (process.env.PAYMONGO_SUCCESS_URL && process.env.PAYMONGO_FAILED_URL) {
      return {
        success: process.env.PAYMONGO_SUCCESS_URL,
        failed: process.env.PAYMONGO_FAILED_URL,
      };
    }

    try {
      const origin = req?.headers?.origin || req?.get?.('origin') || null;
      if (origin) {
        return {
          success: `${origin.replace(/\/$/, '')}/ai-premium/success`,
          failed: `${origin.replace(/\/$/, '')}/ai-premium/failed`,
        };
      }

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

    return {
      success: process.env.PAYMONGO_SUCCESS_URL || 'http://localhost:5173/ai-premium/success',
      failed: process.env.PAYMONGO_FAILED_URL || 'http://localhost:5173/ai-premium/failed',
    };
  };

  const { success: successUrl, failed: failedUrl } = deriveFrontendOrigin();

  const createPayload = () => {
    return {
      amount,
      currency: 'PHP',
      description: `Applica AI Premium (${plan})`,
      redirect: {
        success: successUrl,
        failed: failedUrl,
      },
      billing: {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      },
      metadata: {
        userId: String(user._id),
        plan,
      },
    };
  };

  const sendPaymentLinkRequest = async (payloadToSend) => {
    return axios.post(
      `${PAYMONGO_BASE_URL}/payment_links`,
      payloadToSend,
      {
        auth: getPaymongoAuth(),
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );
  };

  try {
    const response = await sendPaymentLinkRequest(createPayload());

    const link = response.data?.data;
    const checkoutUrl =
      link?.attributes?.checkout_url ||
      link?.attributes?.url ||
      link?.url;
    console.log('PayMongo create payment link response:', {
      id: link?.id,
      status: link?.attributes?.status || link?.status,
      checkoutUrl,
    });
    if (!checkoutUrl) {
      throw new AppError('PayMongo checkout URL was not returned.', 502);
    }

    await User.findByIdAndUpdate(userId, {
      lastAIPaymentSource: link.id,
    });

    return {
      paymentUrl: checkoutUrl,
      checkoutId: link.id,
    };
  } catch (err) {
    console.error('PayMongo API Response Status:', err?.response?.status);
    console.error('PayMongo API Response Data:', err?.response?.data);
    console.error('PayMongo Error Message:', err?.message);
    const errorDetail = err?.response?.data?.errors?.[0]?.detail || err?.message || 'Unknown error';
    throw new AppError(`Failed to create PayMongo payment source: ${errorDetail}`, 502);
  }
};

const getPaymongoPaymentLink = async (paymentLinkId) => {
  if (!paymentLinkId) {
    throw new AppError('Payment link id is required.', 400);
  }

  const response = await axios.get(
    `${PAYMONGO_BASE_URL}/payment_links/${paymentLinkId}`,
    {
      auth: getPaymongoAuth(),
      timeout: 20000,
    }
  );

  return response.data?.data;
};

export const verifyAIPremiumPaymentLink = async (userId, paymentLinkId) => {
  const link = await getPaymongoPaymentLink(paymentLinkId);
  // Primary status might be on the link attributes, but some PayMongo flows
  // attach status to nested payment objects. Check both.
  const linkStatus = link?.attributes?.status || link?.attributes?.payment_status || null;
  const normalizedLinkStatus = String(linkStatus || '').toLowerCase();

  // Look for nested payments on the link and check their statuses as fallback.
  const payments = Array.isArray(link?.attributes?.payments) ? link.attributes.payments : [];
  let foundPaid = false;
  let foundStatus = normalizedLinkStatus || null;

  const paidStatuses = ['paid', 'completed', 'succeeded', 'captured'];

  if (paidStatuses.includes(normalizedLinkStatus)) {
    foundPaid = true;
  }

  if (!foundPaid && payments.length > 0) {
    for (const p of payments) {
      const pStatus = p?.attributes?.status || p?.attributes?.payment_status || null;
      const normalizedPStatus = String(pStatus || '').toLowerCase();
      if (!foundStatus && normalizedPStatus) foundStatus = normalizedPStatus;
      if (paidStatuses.includes(normalizedPStatus)) {
        foundPaid = true;
        break;
      }
    }
  }

  if (foundPaid) {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { premiumAIAccess: true },
      { new: true }
    );
    return {
      premiumAIAccess: !!updatedUser?.premiumAIAccess,
      status: foundStatus || 'paid',
    };
  }

  return {
    premiumAIAccess: false,
    status: foundStatus || (normalizedLinkStatus || ''),
  };
};

export const confirmAIPremiumPaymentSource = async (userId, sourceId) => {
  if (!sourceId) {
    const user = await User.findById(userId).select('premiumAIAccess lastAIPaymentSource');
    if (user?.premiumAIAccess) {
      return {
        premiumAIAccess: true,
        status: 'paid',
      };
    }

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
