// Security Configuration for IVey Backend
// Add to server.js

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';

// 1. Security Headers (Helmet)
export const setupHelmet = (app) => {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));
};

// 2. Rate Limiting
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit AI generation to 20 per hour per IP
  message: 'AI generation limit reached. Please try again later.',
});

// 3. Input Validation Rules
export const campaignValidation = [
  body('name')
    .trim()
    .escape()
    .notEmpty().withMessage('Campaign name is required')
    .isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  
  body('description')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 500 }).withMessage('Description must be under 500 characters'),
  
  body('targetAudience')
    .trim()
    .escape()
    .notEmpty().withMessage('Target audience is required')
    .isLength({ max: 200 }).withMessage('Target audience must be under 200 characters'),
  
  body('aiProvider')
    .isIn(['claude', 'openai', 'gemini', 'grok']).withMessage('Invalid AI provider'),
  
  body('outputFormats')
    .isArray({ min: 1 }).withMessage('At least one output format required')
];

export const authValidation = [
  body('email')
    .trim()
    .normalizeEmail()
    .isEmail().withMessage('Invalid email address'),
  
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Password must contain a number')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
];

// 4. CORS Configuration
export const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};

// 5. File Upload Security
export const uploadSecurity = {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Max 5 files per upload
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm'
    ];
    
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only images and videos allowed.'));
    }
    
    // Check file extension matches mime type
    const ext = file.originalname.split('.').pop().toLowerCase();
    const validExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm'];
    
    if (!validExts.includes(ext)) {
      return cb(new Error('Invalid file extension.'));
    }
    
    cb(null, true);
  }
};

// 6. Security Logger
export const securityLogger = (req, res, next) => {
  // Skip OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') {
    return next();
  }

  // Log suspicious activity
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /\.\.\//i, // Path traversal (fixed pattern)
  ];

  const checkData = JSON.stringify(req.body) + JSON.stringify(req.query);
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(checkData)) {
      console.warn(`⚠️  SECURITY: Suspicious request detected from ${req.ip}`);
      console.warn(`   Path: ${req.path}`);
      console.warn(`   Method: ${req.method}`);
      console.warn(`   User-Agent: ${req.get('user-agent')}`);
      break;
    }
  }
  
  next();
};

// 7. Environment Check
export const checkEnvironment = () => {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'JWT_SECRET',
    'GEMINI_API_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    process.exit(1);
  }
  
  // Check JWT secret strength
  if (process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters');
  }
  
  console.log('✅ Environment variables validated');
};