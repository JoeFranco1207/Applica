import express from 'express';
import { protection } from '../Controller/ProtectionController.js';
import {
  getNotificationsController,
  getUnreadCountController,
  markAsReadController,
  deleteNotificationController,
} from '../Controller/NotificationController.js';

const router = express.Router();

// All notification routes require authentication
router.use(protection);

router.get('/unread/count', getUnreadCountController);
router.get('/', getNotificationsController);
router.patch('/:notificationId/read', markAsReadController);
router.delete('/:notificationId', deleteNotificationController);

export default router;
