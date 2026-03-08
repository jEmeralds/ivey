// backend/src/server.js
// Full server with Socket.io for real-time support chat

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import saveRoutes from './routes/save.routes.js';
import authRoutes from './routes/auth.routes.js';
import campaignRoutes from './routes/campaigns.routes.js';
import mediaRoutes from './routes/media.routes.js';
import contactRoutes from './routes/contact.routes.js';
import chatRoutes, { setIO } from './routes/chat.routes.js';
import {
  setupHelmet,
  apiLimiter,
  aiLimiter,
  securityLogger,
  checkEnvironment
} from './config/security.config.js';
import { saveMessage, notifyTelegram, loadHistory } from './services/chat.service.js';

dotenv.config();

const app = express();
const httpServer = createServer(app); // Wrap express in http server for Socket.io
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

checkEnvironment();

// ── CORS options ──────────────────────────────────────────────────────────────
const allowedOrigins = [
  'https://ivey-steel.vercel.app',
  'https://ivey.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all for now
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Pass io to chat routes so webhook can emit to users
setIO(io);

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // User joins their session room
  socket.on('join_session', async (sessionId) => {
    socket.join(sessionId);
    console.log(`📥 Session joined: ${sessionId.slice(0, 8)}`);

    // Send history
    const history = await loadHistory(sessionId);
    socket.emit('chat_history', history);
  });

  // User sends a message
  socket.on('user_message', async ({ sessionId, message }) => {
    if (!sessionId || !message?.trim()) return;

    console.log(`💬 User [${sessionId.slice(0, 8)}]: ${message}`);

    // Save to Supabase
    const saved = await saveMessage(sessionId, 'user', message.trim());

    // Echo back to user's socket
    socket.emit('user_message_saved', {
      sender: 'user',
      message: message.trim(),
      created_at: saved?.created_at || new Date().toISOString(),
    });

    // Notify you on Telegram
    await notifyTelegram(sessionId, message.trim());
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ── Middleware ────────────────────────────────────────────────────────────────
setupHelmet(app);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(securityLogger);

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api/', apiLimiter);
app.use('/api/campaigns/:id/generate', aiLimiter);
app.use('/api/campaigns/:id/generate-strategy', aiLimiter);
app.use('/api/campaigns/:id/generate-visual', aiLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    socketio: 'enabled',
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/contact', contactRoutes);
app.use('/api/chat',    chatRoutes);
app.use('/api/auth',      authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/media',     mediaRoutes);
app.use('/api',           saveRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE')  return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ error: 'Too many files. Maximum is 5 files per upload.' });
  }
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Start — use httpServer not app.listen ─────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`🚀 IVey Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`⚡ Socket.io enabled`);
});

export default app;