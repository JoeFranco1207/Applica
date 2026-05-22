import express from "express";
import { protection, restrictTo } from '../Controller/ProtectionController.js'; 
import { acceptEmployerController, deleteEmployerController, getAllEmployersController, getPendingEmployersController, rejectEmployerController, registerAdmin, loginAdmin, getUserSessionsController, revokeUserSessionController } from "../Controller/AdminController.js";

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/employers/pending", protection, getPendingEmployersController);
router.get("/employers", getAllEmployersController);
router.post("/employers/:id/accept", acceptEmployerController);
router.post("/employers/:id/reject", rejectEmployerController);
router.delete("/employers/:id/delete", deleteEmployerController);
router.get('/users/:id/sessions', protection, restrictTo('admin'), getUserSessionsController);
router.delete('/users/:id/sessions/:sessionId', protection, restrictTo('admin'), revokeUserSessionController);

export default router;