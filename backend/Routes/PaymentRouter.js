import express from 'express';
import { protection } from '../Controller/ProtectionController.js';
import {
  createAIPremiumPayment,
  confirmAIPremiumPayment,
  getAIPremiumStatus,
  getLastAIPaymentSource,
  paymongoWebhookHandler,
} from '../Controller/PaymentController.js';

const router = express.Router();

router.post('/ai-premium', protection, createAIPremiumPayment);
router.get('/ai-premium/confirm', protection, confirmAIPremiumPayment);
router.get('/ai-premium/status', protection, getAIPremiumStatus);
router.get('/ai-premium/debug-source', protection, getLastAIPaymentSource);
// Public webhook endpoint for PayMongo to notify payment events
router.post('/paymongo/webhook', express.json(), paymongoWebhookHandler);

export default router;
