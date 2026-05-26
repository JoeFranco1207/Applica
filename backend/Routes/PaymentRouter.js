import express from 'express';
import { protection } from '../Controller/ProtectionController.js';
import {
  createAIPremiumPayment,
  confirmAIPremiumPayment,
  getAIPremiumStatus,
  getLastAIPaymentSource,
  getAIPremiumPaymentMethods,
  paymongoWebhookHandler,
  confirmAIPremiumPaymentPublic,
  attachGCashPhone,
} from '../Controller/PaymentController.js';

const router = express.Router();

router.post('/ai-premium', protection, createAIPremiumPayment);
router.get('/ai-premium/confirm', protection, confirmAIPremiumPayment);
router.get('/ai-premium/status', protection, getAIPremiumStatus);
router.get('/ai-premium/methods', protection, getAIPremiumPaymentMethods);
router.get('/ai-premium/debug-source', protection, getLastAIPaymentSource);
// Public webhook endpoint for PayMongo to notify payment events
router.post('/paymongo/webhook', express.json(), paymongoWebhookHandler);
// Attach GCash phone to user's payment (protected)
router.post('/gcash/attach-phone', protection, express.json(), attachGCashPhone);
// Public confirm endpoint (used after PayMongo redirects) — intentionally public
router.get('/ai-premium/confirm-public', confirmAIPremiumPaymentPublic);

export default router;
