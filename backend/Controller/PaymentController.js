import AppSuccessful from '../Middleware/AppSuccessful.js';
import User from '../Model/UserSchema.js';
import {
  createAIPremiumPaymentSource,
  confirmAIPremiumPaymentSource,
  verifyAIPremiumPaymentLink,
} from '../Services/Payment.service.js';

export const createAIPremiumPayment = async (req, res, next) => {
  try {
    // Pass the incoming request so the service can derive a frontend origin
    // for PayMongo redirects (keeps localStorage on the same origin).
    const result = await createAIPremiumPaymentSource(req.user.id, req);
    return res.success(
      new AppSuccessful('PayMongo payment source created successfully', 200, result)
    );
  } catch (err) {
    next(err);
  }
};

export const confirmAIPremiumPayment = async (req, res, next) => {
  try {
    const sourceId =
      req.query.sourceId ||
      req.query.source ||
      req.query.source_id ||
      req.query.id ||
      null;
    const result = await confirmAIPremiumPaymentSource(req.user.id, sourceId);
    return res.success(
      new AppSuccessful('AI Premium access confirmed', 200, result)
    );
  } catch (err) {
    next(err);
  }
};

export const getLastAIPaymentSource = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await (await import('../Model/UserSchema.js')).default.findById(userId).select('lastAIPaymentSource');
    return res.success(new AppSuccessful('Last AI payment source retrieved', 200, { lastAIPaymentSource: user?.lastAIPaymentSource || null }));
  } catch (err) {
    next(err);
  }
};

export const getAIPremiumStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('premiumAIAccess lastAIPaymentSource');

    if (user?.premiumAIAccess) {
      return res.success(new AppSuccessful('AI premium status retrieved', 200, { premiumAIAccess: true }));
    }

    if (user?.lastAIPaymentSource) {
      const result = await verifyAIPremiumPaymentLink(userId, user.lastAIPaymentSource);
      return res.success(new AppSuccessful('AI premium status retrieved', 200, { premiumAIAccess: result.premiumAIAccess, status: result.status }));
    }

    return res.success(new AppSuccessful('AI premium status retrieved', 200, { premiumAIAccess: false }));
  } catch (err) {
    next(err);
  }
};

// PayMongo webhook handler - public endpoint. When PayMongo posts events,
// mark the corresponding user premium if the source/payment succeeded.
export const paymongoWebhookHandler = async (req, res) => {
  try {
    const event = req.body || {};
    console.log('Received PayMongo webhook event:', event?.data?.id || event?.id || '(no id)');

    // Try to extract a source id and status from common shapes
    const sourceId = event?.data?.id || event?.data?.attributes?.source || event?.data?.attributes?.payment || null;
    const status = event?.data?.attributes?.status || event?.data?.attributes?.payment_status || event?.data?.attributes?.type || null;

    // If event contains nested resource
    const nestedId = event?.data?.attributes?.id;
    if (!sourceId && nestedId) {
      // prefer nested id
    }

    const finalSourceId = sourceId || nestedId;
    const successfulStatuses = ['chargeable', 'captured', 'paid', 'consumed'];

    if (finalSourceId && (successfulStatuses.includes(status) || String(status).toLowerCase() === 'paid')) {
      // Prefer explicit metadata mapping if available
      const metadataUserId = event?.data?.attributes?.metadata?.userId || event?.data?.attributes?.metadata?.user_id || null;
      if (metadataUserId) {
        const user = await (await import('../Model/UserSchema.js')).default.findByIdAndUpdate(metadataUserId, { premiumAIAccess: true }, { new: true });
        if (user) {
          console.log('PayMongo webhook: enabled premium for user via metadata', user._id.toString());
        } else {
          console.log('PayMongo webhook: metadata user id not found', metadataUserId);
        }
      } else {
        // Find any user with this pending source and enable premium
        const user = await (await import('../Model/UserSchema.js')).default.findOneAndUpdate(
          { lastAIPaymentSource: finalSourceId },
          { premiumAIAccess: true },
          { new: true }
        );

        if (user) {
          console.log('PayMongo webhook: enabled premium for user', user._id.toString());
        } else {
          console.log('PayMongo webhook: no user found with source', finalSourceId);
        }
      }
    } else {
      console.log('PayMongo webhook: ignored event for source', finalSourceId, 'status', status);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('PayMongo webhook handler error', err);
    return res.status(500).json({ error: 'webhook handler failed' });
  }
};
