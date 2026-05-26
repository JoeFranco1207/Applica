import AppSuccessful from '../Middleware/AppSuccessful.js';
import User from '../Model/UserSchema.js';
import {
  createAIPremiumPaymentSource,
  confirmAIPremiumPaymentSource,
  verifyAIPremiumPaymentSource,
  getSupportedPaymongoMethods,
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
    const user = await User.findById(userId).select('premiumAIAccess lastAIPaymentSource premiumPlan lastAIPaymentPlan');

    if (user?.premiumAIAccess) {
      return res.success(
        new AppSuccessful('AI premium status retrieved', 200, {
          premiumAIAccess: true,
          premiumPlan: user.premiumPlan || user.lastAIPaymentPlan || null,
          status: 'paid',
        })
      );
    }

    if (user?.lastAIPaymentSource) {
      const result = await verifyAIPremiumPaymentSource(userId, user.lastAIPaymentSource);
      return res.success(
        new AppSuccessful('AI premium status retrieved', 200, {
          premiumAIAccess: result.premiumAIAccess,
          status: result.status,
          premiumPlan: result.premiumPlan || user.lastAIPaymentPlan || null,
          paymentMethod: result.paymentMethod || undefined,
        })
      );
    }

    return res.success(
      new AppSuccessful('AI premium status retrieved', 200, {
        premiumAIAccess: false,
        status: 'pending',
      })
    );
  } catch (err) {
    next(err);
  }
};

export const getAIPremiumPaymentMethods = async (req, res, next) => {
  try {
    const methods = getSupportedPaymongoMethods();
    return res.success(new AppSuccessful('Supported AI premium payment methods retrieved', 200, { methods }));
  } catch (err) {
    next(err);
  }
};

export const attachGCashPhone = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { sourceId, phone } = req.body || {};
    if (!phone) {
      return next(new Error('Phone is required'));
    }

    const update = { lastAIPaymentPhone: phone };
    if (sourceId) update.lastAIPaymentSource = sourceId;
    const user = await User.findByIdAndUpdate(userId, update, { new: true });
    return res.success(new AppSuccessful('GCash phone attached', 200, { phone: user?.lastAIPaymentPhone || phone }));
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
    const metadata = event?.data?.attributes?.metadata || {};
    const planFromMetadata = metadata?.plan || metadata?.premiumPlan || null;

    const nestedId = event?.data?.attributes?.id;
    const finalSourceId = sourceId || nestedId;
    const normalizedStatus = String(status || '').toLowerCase();
    const successfulStatuses = ['chargeable', 'captured', 'paid', 'consumed', 'succeeded'];

    if (finalSourceId && successfulStatuses.includes(normalizedStatus)) {
      const metadataUserId = metadata?.userId || metadata?.user_id || null;
      const update = {
        premiumAIAccess: true,
      };
      if (planFromMetadata) {
        update.premiumPlan = planFromMetadata;
        update.lastAIPaymentPlan = planFromMetadata;
      }

      if (metadataUserId) {
        const user = await (await import('../Model/UserSchema.js')).default.findByIdAndUpdate(metadataUserId, update, { new: true });
        if (user) {
          console.log('PayMongo webhook: enabled premium for user via metadata', user._id.toString());
        } else {
          console.log('PayMongo webhook: metadata user id not found', metadataUserId);
        }
      } else {
        const user = await (await import('../Model/UserSchema.js')).default.findOneAndUpdate(
          { lastAIPaymentSource: finalSourceId },
          update,
          { new: true }
        );

        if (user) {
          console.log('PayMongo webhook: enabled premium for user', user._id.toString());
        } else {
          console.log('PayMongo webhook: no user found with source', finalSourceId);
        }
      }
    } else {
      console.log('PayMongo webhook: ignored event for source', finalSourceId, 'status', normalizedStatus);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('PayMongo webhook handler error', err);
    return res.status(500).json({ error: 'webhook handler failed' });
  }
};

export const confirmAIPremiumPaymentPublic = async (req, res, next) => {
  try {
    const sourceId = req.query.sourceId || req.query.source || req.query.id || null;
    if (!sourceId) {
      return res.status(400).json({ success: false, message: 'sourceId is required' });
    }

    console.log('Public confirm called for sourceId=', sourceId);
    const result = await (await import('../Services/Payment.service.js')).confirmPaymentBySourceId(sourceId);
    console.log('Public confirm result for', sourceId, '=', result);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('Public confirm error', err);
    return res.status(500).json({ success: false, message: 'confirm failed' });
  }
};
