import express from 'express';
import { protection } from '../Controller/ProtectionController.js';
import {
  getNotificationsController,
  getUnreadCountController,
  markAsReadController,
  deleteNotificationController,
  createConnectController,
  acceptConnectionController,
} from '../Controller/NotificationController.js';

const router = express.Router();

// All notification routes require authentication
router.use(protection);

router.get('/unread/count', getUnreadCountController);
router.get('/', getNotificationsController);
router.patch('/:notificationId/read', markAsReadController);
router.post('/connect', createConnectController);
router.post('/connect/:notificationId/accept', acceptConnectionController);
router.delete('/:notificationId', deleteNotificationController);

export default router;
