import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
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
import { getSocketIdByUser, registerSocketUser, unregisterSocketById, setIo, setUserPresence } from './Services/SocketIO.service.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
  origin: "http://localhost:5173",
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
app.use('/api/notifications', NotificationRouter);
app.use('/api/chat', ChatRouter);

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