import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { protection } from '../Controller/ProtectionController.js';
import {
  getConnectionsController,
  getMessagesController,
  createMessageController,
  removeConnectionController,
  removeMessageController,
} from '../Controller/ChatController.js';

const router = express.Router();

const uploadDirectory = path.join(process.cwd(), 'uploads', 'chat');
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${timestamp}_${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

router.use(protection);

router.get('/connections', getConnectionsController);
router.delete('/connections/:otherId', removeConnectionController);
router.get('/:otherId/messages', getMessagesController);
router.post('/:otherId/messages', upload.single('attachment'), createMessageController);
router.delete('/:otherId/messages/:messageId', removeMessageController);

export default router;
