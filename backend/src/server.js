import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import saveRoutes from './routes/save.routes.js';
import authRoutes from './routes/auth.routes.js';
import campaignRoutes from './routes/campaigns.routes.js';
import mediaRoutes from './routes/media.routes.js';
import {
  setupHelmet,
  apiLimiter,
  aiLimiter,
  securityLogger,
  checkEnvironment
} from './config/security.config.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

checkEnvironment();

// ── 1. CORS first — before everything including Helmet ────────────────────────
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    const allowed = [
      'https://ivey-steel.vercel.app',
      'https://ivey.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
    ];
    if (allowed.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all for now — tighten after testing
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight for ALL routes explicitly
app.options('*', cors(corsOptions));

// ── 2. Helmet after CORS ──────────────────────────────────────────────────────
setupHelmet(app);

// ── 3. Body parsers ───────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── 4. Security logging ───────────────────────────────────────────────────────
app.use(securityLogger);

// ── 5. Rate limiting ──────────────────────────────────────────────────────────
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
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
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

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 IVey Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;