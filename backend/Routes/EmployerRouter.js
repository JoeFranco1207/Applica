import express from "express";
import { protection } from "../Controller/ProtectionController.js";
import { employerProfile } from "../Controller/EmployerProfileController.js";

const router = express.Router();

router.put('/profile', protection, employerProfile);

export default router;