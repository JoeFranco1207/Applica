import express from "express";
import { protection, restrictTo } from '../Controller/ProtectionController.js';
import {
	acceptEmployerController,
	deleteEmployerController,
	getAllEmployersController,
	getPendingEmployersController,
	rejectEmployerController,
	registerAdmin,
	loginAdmin,
	adminAccessLoginController,
	getUserSessionsController,
	revokeUserSessionController,
	getPremiumStatsController,
	getAdminOverviewController,
	getAdminsController,
	updateAdminPermissionsController,
	getVerifiedEmployersController,
	getReportsController,
	resolveReportController,
	takeReportActionController,
	getFraudAlertsController,
	suspendUserController,
	unsuspendUserController,
	getPremiumSubscribersController,
	revokePremiumAccessController,
	refundSubscriptionController,
	broadcastNotificationController,
	getFlaggedMessagesController,
	deleteMessageController,
	getMaintenanceModeController,
	setMaintenanceModeController,
} from "../Controller/AdminController.js";
import { getModerationQueueController, restrictPostController, clearPostRestrictionController, getBlocklistController, addBlocklistController, removeBlocklistController } from '../Controller/ModerationController.js';
import { generateAdminPathController, validateAdminPathController, revokeAdminPathController } from '../Controller/AdminAccessController.js';

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.post("/direct-login", adminAccessLoginController);
router.get("/employers/pending", protection, restrictTo('admin'), getPendingEmployersController);
router.get("/employers", protection, restrictTo('admin'), getAllEmployersController);
router.get('/employers/verified', protection, restrictTo('admin'), getVerifiedEmployersController);
router.post("/employers/:id/accept", protection, restrictTo('admin'), acceptEmployerController);
router.post("/employers/:id/reject", protection, restrictTo('admin'), rejectEmployerController);
router.delete("/employers/:id/delete", protection, restrictTo('admin'), deleteEmployerController);
router.get('/admins', protection, restrictTo('admin'), getAdminsController);
router.patch('/admins/:id/permissions', protection, restrictTo('admin'), updateAdminPermissionsController);
router.get('/users/:id/sessions', protection, restrictTo('admin'), getUserSessionsController);
router.delete('/users/:id/sessions/:sessionId', protection, restrictTo('admin'), revokeUserSessionController);
router.post('/users/:id/suspend', protection, restrictTo('admin'), suspendUserController);
router.post('/users/:id/unsuspend', protection, restrictTo('admin'), unsuspendUserController);

// Moderation endpoints (admin only)
router.get('/moderation/queue', protection, restrictTo('admin'), getModerationQueueController);
router.post('/moderation/posts/:id/restrict', protection, restrictTo('admin'), restrictPostController);
router.post('/moderation/posts/:id/clear', protection, restrictTo('admin'), clearPostRestrictionController);
router.get('/moderation/blocklist', protection, restrictTo('admin'), getBlocklistController);
router.post('/moderation/blocklist', protection, restrictTo('admin'), addBlocklistController);
router.delete('/moderation/blocklist/:id', protection, restrictTo('admin'), removeBlocklistController);

// Premium stats
router.get('/stats/premium', protection, restrictTo('admin'), getPremiumStatsController);
router.get('/stats/overview', protection, restrictTo('admin'), getAdminOverviewController);
router.get('/stats/fraud-alerts', protection, restrictTo('admin'), getFraudAlertsController);
router.get('/reports', protection, restrictTo('admin'), getReportsController);
router.post('/reports/:id/resolve', protection, restrictTo('admin'), resolveReportController);
router.post('/reports/:id/action', protection, restrictTo('admin'), takeReportActionController);
router.get('/subscriptions', protection, restrictTo('admin'), getPremiumSubscribersController);
router.post('/subscriptions/:id/revoke', protection, restrictTo('admin'), revokePremiumAccessController);
router.post('/subscriptions/:id/refund', protection, restrictTo('admin'), refundSubscriptionController);
router.post('/notifications/broadcast', protection, restrictTo('admin'), broadcastNotificationController);
router.get('/messages/flagged', protection, restrictTo('admin'), getFlaggedMessagesController);
router.delete('/messages/:id', protection, restrictTo('admin'), deleteMessageController);
router.get('/maintenance', protection, restrictTo('admin'), getMaintenanceModeController);
router.post('/maintenance', protection, restrictTo('admin'), setMaintenanceModeController);

// Admin access token endpoints
router.post('/path/generate', generateAdminPathController);
router.get('/path/validate/:token', validateAdminPathController);
router.delete('/path/:token', protection, restrictTo('admin'), revokeAdminPathController);

export default router;