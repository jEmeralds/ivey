import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import authRoutes from './routes/auth.routes.js';
import campaignRoutes from './routes/campaigns.routes.js';
import mediaRoutes from './routes/media.routes.js';
import {
  setupHelmet,
  apiLimiter,
  authLimiter,
  aiLimiter,
  securityLogger,
  checkEnvironment
} from './config/security.config.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// Check environment variables
checkEnvironment();

// Security headers
setupHelmet(app);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security logging
app.use(securityLogger);

// Explicit CORS handling to fix login preflight issues
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://ivey-steel.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/campaigns/:id/generate', aiLimiter);
app.use('/api/campaigns/:id/generate-strategy', aiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/media', mediaRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 5 files per upload.' });
    }
  }
  
  // Handle other errors
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 IVey Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;