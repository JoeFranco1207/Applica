import express from 'express';
import {Register , Login, sendVerificationCode, verifyCode} from '../Controller/UserController.js'
const router = express.Router();

router.post("/Register", Register);
router.post("/Login", Login);
router.post("/sendVerificationCode", sendVerificationCode);
router.put("/verifyCode", verifyCode);

export default router;