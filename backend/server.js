import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import connectDB from "./config/ApplicaDB.js"
import Router from "./Routes/UserRouter.js"
import User from "./Model/UserSchema.js";
import Job from "./Model/JobSchema.js";
import JobseekerRouter from "./Routes/JobseekerRouter.js";
import EmployerRouter from "./Routes/EmployerRouter.js";
import JobsRouter from "./Routes/JobsRouter.js";
import AdminRouter from "./Routes/AdminRouter.js";
import PostRouter from './Routes/PostRouter.js';
import NotificationRouter from './Routes/NotificationRouter.js';
import ChatRouter from './Routes/ChatRouter.js';
import PaymentRouter from './Routes/PaymentRouter.js';
import InterviewRouter from './Routes/InterviewRouter.js';
import Interview from './Model/InterviewSchema.js';
import { getSocketIdByUser, registerSocketUser, unregisterSocketById, setIo, setUserPresence } from './Services/SocketIO.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || 'https://libretranslate.com';
const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve uploaded files (resumes, images)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use("/api/admin", AdminRouter);

app.use((req, res, next) => {
  res.success = (appSuccessful) => {
    return res.status(appSuccessful.statusCode).json({
      status: appSuccessful.status,
      message: appSuccessful.message,
      data: appSuccessful.data
    });
  };
  next();
});

app.use("/api/auth", Router);
app.use("/api/jobs", JobsRouter);
app.use("/api/jobseeker", JobseekerRouter);
app.use("/api/employer", EmployerRouter);
app.use('/api/posts', PostRouter);
app.use('/api/payments', PaymentRouter);
app.use('/api/notifications', NotificationRouter);
app.use('/api/chat', ChatRouter);
app.use('/api/interviews', InterviewRouter);

const translateText = async (text, source, target) => {
  const response = await axios.post(
    `${LIBRETRANSLATE_URL}/translate`,
    {
      q: text,
      source,
      target,
      format: 'text',
      api_key: process.env.LIBRETRANSLATE_KEY || ''
    },
    {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    }
  );
  return response.data?.translatedText || '';
};

const translateWithMyMemory = async (text, source, target) => {
  const encoded = encodeURIComponent(text);
  const candidates = [];

  if (source === 'auto') {
    candidates.push('tl|en', 'ceb|en', 'tl-PH|en', 'en|en');
  } else {
    candidates.push(`${source}|${target}`);
  }

  for (const pair of candidates) {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${pair}`;
      const response = await axios.get(url, { timeout: 15000 });
      const result = response.data?.responseData?.translatedText;
      if (result && result.trim()) {
        return result.trim();
      }
    } catch (err) {
      // ignore and try next fallback
    }
  }

  throw new Error('MyMemory translation failed');
};

const autoCorrectText = (text) => {
  let corrected = text.trim().replace(/\s+/g, ' ');
  corrected = corrected.replace(/\s*([.,!?;:])\s*/g, '$1 ');
  corrected = corrected.replace(/\bi\b/g, 'I');
  corrected = corrected.replace(/\s+([.,!?;:])/g, '$1');
  corrected = corrected.replace(/(^|[.!?]\s+)([a-z])/g, (match, prefix, char) => `${prefix}${char.toUpperCase()}`);
  corrected = corrected.replace(/\s+([?.!])$/g, '$1');
  if (!/[.!?]$/.test(corrected)) corrected += '.';
  return corrected;
};

const rephraseText = (text, style = 'professional', round = 1) => {
  const rules = [
    { regex: /\bI have\b/gi, value: 'My experience includes' },
    { regex: /\bI would like to\b/gi, value: 'I am eager to' },
    { regex: /\bI am a\b/gi, value: 'As a' },
    { regex: /\bI am an\b/gi, value: 'As an' },
    { regex: /\bI'm a\b/gi, value: 'As a' },
    { regex: /\bI'm an\b/gi, value: 'As an' },
    { regex: /\bI'm\b/gi, value: 'I am' },
    { regex: /\bI want to\b/gi, value: 'I seek to' },
    { regex: /\bIn my previous role\b/gi, value: 'Previously,' },
    { regex: /\bhelped\b/gi, value: 'supported' },
    { regex: /\bworked on\b/gi, value: 'contributed to' },
    { regex: /\bbuilt\b/gi, value: 'developed' },
    { regex: /\bcreated\b/gi, value: 'developed' },
    { regex: /\bresponsible for\b/gi, value: 'accountable for' },
    { regex: /\bmanage(?:d|s|r)?\b/gi, value: 'oversee' },
    { regex: /\bexperience with\b/gi, value: 'experience in' },
    { regex: /\bgood\b/gi, value: 'strong' },
    { regex: /\bgreat\b/gi, value: 'excellent' },
    { regex: /\bbest\b/gi, value: 'strongest' },
    { regex: /\bvery\b/gi, value: 'extremely' },
    { regex: /\busing\b/gi, value: 'leveraging' },
    { regex: /\buse\b/gi, value: 'leverage' },
    { regex: /\bsuccessfully\b/gi, value: 'effectively' },
    { regex: /\bstrong\b/gi, value: 'proven' },
    { regex: /\bI am applying\b/gi, value: 'I am submitting this application' },
    { regex: /\bI apply\b/gi, value: 'I submit' },
    { regex: /\bI love\b/gi, value: 'I am passionate about' }
  ];

  if (style === 'formal') {
    rules.push(
      { regex: /\bI would like to\b/gi, value: 'I respectfully wish to' },
      { regex: /\bI want to\b/gi, value: 'I aspire to' },
      { regex: /\bI have\b/gi, value: 'I possess' },
      { regex: /\bplease\b/gi, value: 'kindly' }
    );
  }

  let result = autoCorrectText(text);
  rules.forEach(({ regex, value }) => {
    result = result.replace(regex, value);
  });

  if (round >= 2) {
    result = result.replace(/\bI am\b/gi, 'I am currently');
    result = result.replace(/\bMy experience includes\b/gi, 'With experience in');
    result = result.replace(/\bI seek to\b/gi, 'I am looking to');
    result = result.replace(/\bI am passionate about\b/gi, 'I take pride in');
    result = result.replace(/\bAs a\b/gi, 'In the role of a');
  }

  if (round >= 3) {
    result = result.replace(/\bPreviously,\b/gi, 'Previously, in my prior role,');
    result = result.replace(/\bI am eager to\b/gi, 'I look forward to');
    result = result.replace(/\bI am submitting this application\b/gi, 'I submit this application');
    result = result.replace(/\bI am an\b/gi, 'In the capacity of an');
  }

  if (round >= 4) {
    result = result.replace(/\bI am currently\b/gi, 'I currently');
    result = result.replace(/\bIn the role of a\b/gi, 'As a dedicated');
    result = result.replace(/\bWith experience in\b/gi, 'With a background in');
  }

  result = result.replace(/\s+/g, ' ').trim();
  result = result.replace(/\s+([.,!?;:])/g, '$1');
  result = result.replace(/(^|[.!?]\s+)([a-z])/g, (match, prefix, char) => `${prefix}${char.toUpperCase()}`);
  if (!/[.!?]$/.test(result)) result += '.';
  return result;
};

const translateWithFallback = async (text, source, target) => {
  try {
    return await translateText(text, source, target);
  } catch (err) {
    console.warn('LibreTranslate failed, falling back to MyMemory:', err?.response?.data || err.message || err);
    return await translateWithMyMemory(text, source, target);
  }
};

app.post('/api/translate/cover-letter', async (req, res) => {
  const { text, action, style, rephraseRound = 1, translateRound = 1 } = req.body || {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ status: 'error', message: 'Text is required.' });
  }

  try {
    if (action === 'translate') {
      const translatedText = await translateWithFallback(text.trim(), 'auto', 'en');
      const finalText = Number(translateRound) > 1
        ? rephraseText(translatedText, 'professional', Number(translateRound))
        : translatedText;
      return res.status(200).json({ status: 'success', message: 'Cover letter translated into English.', data: finalText });
    }

    if (action === 'correct') {
      try {
        const firstPass = await translateWithFallback(text.trim(), 'auto', 'fr');
        const roundTrip = await translateWithFallback(firstPass, 'fr', 'en');
        return res.status(200).json({ status: 'success', message: 'Cover letter corrected.', data: roundTrip || autoCorrectText(text) });
      } catch (err) {
        return res.status(200).json({ status: 'success', message: 'Cover letter corrected using fallback.', data: autoCorrectText(text) });
      }
    }

    if (action === 'rephrase') {
      try {
        let intermediateLang = 'es';
        if (style === 'formal') intermediateLang = 'fr';
        if (style === 'professional') intermediateLang = 'de';

        const firstPass = await translateWithFallback(text.trim(), 'auto', intermediateLang);
        const roundTrip = await translateWithFallback(firstPass, intermediateLang, 'en');
        const baseText = roundTrip || text;
        const finalText = rephraseText(baseText, style, Number(rephraseRound) || 1);
        return res.status(200).json({ status: 'success', message: 'Cover letter rephrased.', data: finalText });
      } catch (err) {
        return res.status(200).json({ status: 'success', message: 'Cover letter rephrased using fallback.', data: rephraseText(text, style, Number(rephraseRound) || 1) });
      }
    }

    return res.status(400).json({ status: 'error', message: 'Unknown action.' });
  } catch (error) {
    console.error('Translate endpoint failure:', error?.response?.data || error.message || error);
    return res.status(502).json({ status: 'error', message: 'Unable to transform cover letter. Please try again later.' });
  }
});

// Debug endpoint to verify the server is reachable and receives POSTs
app.post('/api/debug/post-test', (req, res) => {
  return res.status(200).json({
    ok: true,
    received: {
      headers: req.headers,
      body: req.body,
    },
  });
});

app.get('/', async(req,res)=>{
  const user = await User.find();
  res.json(user);
})

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    status: err.status || "error",
    message: err.message,
  });
});


// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
export const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

setIo(io);

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Register user when they connect
  socket.on('register', (userId) => {
    if (!userId) return;
    socket.userId = String(userId);
    registerSocketUser(socket.userId, socket.id);
    console.log(`User ${socket.userId} registered with socket ${socket.id}`);
  });

  // Listen for notifications
  socket.on('notification', (data) => {
    console.log('Notification received:', data);
  });

  // Listen for presence change requests from clients
  socket.on('presence:set', (data) => {
    try {
      const mode = data?.mode;
      const userId = socket.userId || data?.userId;
      if (!userId || !mode) return;
      setUserPresence(userId, mode);
    } catch (err) {
      console.error('Error handling presence:set', err);
    }
  });

  socket.on('call:request', (data) => {
    if (!data?.to) return;
    const targetSocketId = getSocketIdByUser(data.to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call:request', {
        ...data,
        from: socket.userId,
      });
    }
  });

  socket.on('call:signal', (data) => {
    if (!data?.to) return;
    const targetSocketId = getSocketIdByUser(data.to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call:signal', {
        ...data,
        from: socket.userId,
      });
    }
  });

  socket.on('call:end', (data) => {
    if (!data?.to) return;
    const targetSocketId = getSocketIdByUser(data.to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call:end', {
        ...data,
        from: socket.userId,
      });
    }
  });

  socket.on('call:reject', (data) => {
    if (!data?.to) return;
    const targetSocketId = getSocketIdByUser(data.to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call:reject', {
        ...data,
        from: socket.userId,
      });
    }
  });

  // Interview events: create via socket (alternative to HTTP endpoint)
  socket.on('interview:create', async (data) => {
    try {
      const { employer, title, description, participants = [], scheduledAt, location } = data || {};
      if (!employer || !scheduledAt || !participants.length) return;
      const roomId = `interview_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
      const interview = await Interview.create({ employer, title, description, participants, scheduledAt: new Date(scheduledAt), location, roomId, status: 'scheduled' });

      // notify participants via sockets
      for (const p of participants) {
        const userId = p.user || p;
        const targetSocketId = getSocketIdByUser(userId);
        if (targetSocketId) {
          io.to(targetSocketId).emit('interview:invited', {
            _id: interview._id,
            title: interview.title,
            scheduledAt: interview.scheduledAt,
            roomId: interview.roomId,
            employer: interview.employer
          });
        }
      }

      // reply to creator
      socket.emit('interview:created', interview);
    } catch (err) {
      console.error('Error creating interview via socket:', err?.message || err);
      socket.emit('interview:error', { message: 'Unable to create interview' });
    }
  });

  socket.on('interview:join', (data) => {
    try {
      const { roomId } = data || {};
      if (!roomId) return;
      socket.join(roomId);
      io.to(roomId).emit('interview:participant-joined', { userId: socket.userId, roomId });
    } catch (err) {
      console.error('interview:join error', err?.message || err);
    }
  });

  socket.on('interview:leave', (data) => {
    try {
      const { roomId } = data || {};
      if (!roomId) return;
      socket.leave(roomId);
      io.to(roomId).emit('interview:participant-left', { userId: socket.userId, roomId });
    } catch (err) {
      console.error('interview:leave error', err?.message || err);
    }
  });

  socket.on('disconnect', () => {
    unregisterSocketById(socket.id);
    console.log(`Socket ${socket.id} disconnected`);
  });
});

export { sendNotificationToUser, sendChatMessageToUser } from './Services/SocketIO.service.js';

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the existing backend process or set a different PORT value before restarting.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

httpServer.listen(PORT, () => {
  connectDB();
  console.log(`Listening on port ${PORT}`);
});