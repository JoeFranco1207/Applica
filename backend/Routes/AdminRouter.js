import express from "express";
import { protection } from '../Controller/ProtectionController.js'; 
import { acceptEmployerController, deleteEmployerController, getAllEmployersController, getPendingEmployersController, rejectEmployerController, registerAdmin, loginAdmin } from "../Controller/AdminController.js";

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/employers/pending", protection, getPendingEmployersController);
router.get("/employers", getAllEmployersController);
router.post("/employers/:id/accept", acceptEmployerController);
router.post("/employers/:id/reject", rejectEmployerController);
router.delete("/employers/:id/delete", deleteEmployerController);

export default router;