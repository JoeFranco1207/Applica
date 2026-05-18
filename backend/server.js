import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
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

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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

// Map to store user socket connections
const userSockets = new Map();

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Register user when they connect
  socket.on('register', (userId) => {
    userSockets.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  // Listen for notifications
  socket.on('notification', (data) => {
    console.log('Notification received:', data);
  });

  socket.on('disconnect', () => {
    // Find and remove user from map
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Export function to emit notifications to specific user
export const sendNotificationToUser = (userId, notification) => {
  const socketId = userSockets.get(userId.toString());
  if (socketId) {
    io.to(socketId).emit('notification', notification);
    console.log(`Notification sent to user ${userId}`);
  }
};

httpServer.listen(PORT, () => {
  connectDB();
  console.log(`Listening on port ${PORT}`);
});