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

// Employer pricing is higher — values are in cents (PHP * 100)
const EMPLOYER_PREMIUM_PLAN_AMOUNTS = {
  monthly: 49900,
  halfYearly: 249900,
  annual: 499900,
};

const ALL_PAYMENT_METHODS = {
  qrph: {
    id: 'qrph',
    label: 'QRPH',
    description: 'Scan the code from your banking app or any QR payment app available in the Philippines.',
  },
  gcash: {
    id: 'gcash',
    label: 'GCash',
    description: 'Pay instantly with GCash and finish the purchase inside Applica.',
  },
  maya: {
    id: 'maya',
    label: 'Maya',
    description: 'Use your Maya wallet to pay directly from the app.',
  },
  card: {
    id: 'card',
    label: 'Card',
    description: 'Pay securely with your debit or credit card.',
  },
};

const SUPPORTED_PAYMENT_METHOD_IDS = (process.env.PAYMONGO_SUPPORTED_METHODS || 'gcash').split(',').map((m) => m.trim()).filter(Boolean);

const PAYMENT_METHOD_TYPE_MAP = {
  qrph: 'qris',
  gcash: 'gcash',
  maya: 'maya',
  card: 'card',
};

export const getSupportedPaymongoMethods = () =>
  SUPPORTED_PAYMENT_METHOD_IDS.map((id) => ALL_PAYMENT_METHODS[id]).filter(Boolean);

const isPaymentMethodSupported = (method) =>
  SUPPORTED_PAYMENT_METHOD_IDS.includes(method);

const getPaymongoAuth = () => {
  if (!PAYMONGO_KEY) {
    throw new AppError('PayMongo secret key is not configured.', 500);
  }
  return {
    username: PAYMONGO_KEY,
    password: '',
  };
};

const getPremiumAmountForPlan = (plan, role = 'jobseeker') => {
  // normalize plan ids like 'employer_monthly' -> 'monthly'
  let normalized = plan || '';
  if (normalized.startsWith('employer_')) {
    normalized = normalized.replace(/^employer_/, '');
    role = 'employer';
  }

  const source = role === 'employer' ? EMPLOYER_PREMIUM_PLAN_AMOUNTS : PREMIUM_PLAN_AMOUNTS;
  const amount = source[normalized];
  if (!amount) {
    throw new AppError('Invalid premium plan selected.', 400);
  }
  return amount;
};

const getPaymongoSourceType = (method) => {
  const sourceType = PAYMENT_METHOD_TYPE_MAP[method];
  if (!sourceType) {
    throw new AppError('Unsupported payment method selected.', 400);
  }
  return sourceType;
};

export const createAIPremiumPaymentSource = async (userId, req) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const plan = (req?.body?.plan || req?.query?.plan || 'monthly').toString();
  const paymentMethod = (req?.body?.paymentMethod || req?.query?.paymentMethod || 'gcash').toString();
  const role = (req?.body?.role || req?.query?.role || (user.role || 'user')).toString();
  if (!isPaymentMethodSupported(paymentMethod)) {
    throw new AppError(
      `The selected payment method '${paymentMethod}' is not available. Please choose one of: ${SUPPORTED_PAYMENT_METHOD_IDS.join(', ')}.`,
      400
    );
  }

  const amount = getPremiumAmountForPlan(plan, role === 'employer' ? 'employer' : 'jobseeker');
  const sourceType = getPaymongoSourceType(paymentMethod);
  const cardData = req?.body?.card || {};

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

  const buildSourceAttributes = () => {
    const baseAttributes = {
      amount,
      currency: 'PHP',
      type: sourceType,
      source_type: sourceType,
      billing: {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      },
      metadata: {
        userId: String(user._id),
        plan,
        paymentMethod,
        role: role || user.role || 'user',
      },
      redirect: {
        success: successUrl,
        failed: failedUrl,
      },
    };

    if (sourceType === 'card') {
      if (!cardData.number || !cardData.expMonth || !cardData.expYear || !cardData.cvc) {
        throw new AppError('Complete card information is required for card payments.', 400);
      }

      return {
        ...baseAttributes,
        card: {
          number: cardData.number,
          exp_month: cardData.expMonth,
          exp_year: cardData.expYear,
          cvc: cardData.cvc,
          name: cardData.name || `${user.firstName} ${user.lastName}`,
        },
      };
    }

    return baseAttributes;
  };

  const createPayload = {
    data: {
      attributes: buildSourceAttributes(),
    },
  };

  try {
    const response = await axios.post(
      `${PAYMONGO_BASE_URL}/sources`,
      createPayload,
      {
        auth: getPaymongoAuth(),
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    const source = response.data?.data;
    if (!source || !source.id) {
      throw new AppError('PayMongo source creation failed to return a source id.', 502);
    }

    const attributes = source.attributes || {};
    await User.findByIdAndUpdate(userId, {
      lastAIPaymentSource: source.id,
      lastAIPaymentPlan: plan,
      lastAIPaymentMethod: paymentMethod,
    });

    return {
      sourceId: source.id,
      status: attributes.status || 'pending',
      paymentMethod,
      premiumPlan: plan,
      qrCode: attributes.qr_code || null,
      sourceAttributes: attributes,
      checkoutUrl: attributes.redirect?.checkout_url || null,
    };
  } catch (err) {
    console.error('PayMongo API Response Status:', err?.response?.status);
    console.error('PayMongo API Response Data:', err?.response?.data);
    console.error('PayMongo Error Message:', err?.message);
    const errorDetail = err?.response?.data?.errors?.[0]?.detail || err?.message || 'Unknown error';
    const unsupportedMessage =
      errorDetail.includes('source_type passed')
        ? `${errorDetail} This payment method is currently unavailable for your PayMongo setup.`
        : errorDetail;
    throw new AppError(`Failed to create PayMongo payment source: ${unsupportedMessage}`, 502);
  }
};

const getPaymongoSource = async (sourceId) => {
  if (!sourceId) {
    throw new AppError('Source id is required.', 400);
  }
  const response = await axios.get(
    `${PAYMONGO_BASE_URL}/sources/${sourceId}`,
    {
      auth: getPaymongoAuth(),
      timeout: 20000,
    }
  );

  return response.data?.data;
};

export const confirmPaymentBySourceId = async (sourceId) => {
  const source = await getPaymongoSource(sourceId);
  const status = source?.attributes?.status || source?.attributes?.payment_status || null;
  const normalizedStatus = String(status || '').toLowerCase();
  const metadata = source?.attributes?.metadata || {};
  const planFromMetadata = metadata?.plan || metadata?.premiumPlan || null;

  const paidStatuses = ['chargeable', 'captured', 'paid', 'consumed', 'succeeded'];
  if (!paidStatuses.includes(normalizedStatus)) {
    return { premiumAIAccess: false, status: normalizedStatus || 'pending' };
  }

  const update = { premiumAIAccess: true };
  if (planFromMetadata) {
    update.premiumPlan = planFromMetadata;
    update.lastAIPaymentPlan = planFromMetadata;
  }

  const metadataUserId = metadata?.userId || metadata?.user_id || null;
  let user = null;
  if (metadataUserId) {
    user = await User.findByIdAndUpdate(metadataUserId, update, { new: true });
  } else {
    user = await User.findOneAndUpdate({ lastAIPaymentSource: sourceId }, update, { new: true });
  }

  if (!user) {
    return { premiumAIAccess: false, status: normalizedStatus || 'pending' };
  }

  return {
    premiumAIAccess: true,
    status: normalizedStatus || 'paid',
    premiumPlan: user.premiumPlan || planFromMetadata || user.lastAIPaymentPlan || null,
    userId: user._id.toString(),
  };
};

export const verifyAIPremiumPaymentSource = async (userId, sourceId) => {
  const source = await getPaymongoSource(sourceId);
  const status = source?.attributes?.status || source?.attributes?.payment_status || null;
  const normalizedStatus = String(status || '').toLowerCase();
  const metadata = source?.attributes?.metadata || {};
  const planFromMetadata = metadata?.plan || metadata?.premiumPlan || null;

  const paidStatuses = ['chargeable', 'captured', 'paid', 'consumed', 'succeeded'];
  const failureStatuses = ['failed', 'cancelled', 'canceled', 'expired', 'voided'];

  if (paidStatuses.includes(normalizedStatus)) {
    const user = await User.findById(userId).select('lastAIPaymentPlan');
    const planToSave = planFromMetadata || user?.lastAIPaymentPlan || '';

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        premiumAIAccess: true,
        premiumPlan: planToSave,
        lastAIPaymentPlan: planToSave,
      },
      { new: true }
    );

    return {
      premiumAIAccess: true,
      status: normalizedStatus || 'paid',
      premiumPlan: updatedUser?.premiumPlan || planToSave || null,
      paymentMethod: metadata?.paymentMethod || null,
    };
  }

  return {
    premiumAIAccess: false,
    status: normalizedStatus || 'pending',
    paymentMethod: metadata?.paymentMethod || null,
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
