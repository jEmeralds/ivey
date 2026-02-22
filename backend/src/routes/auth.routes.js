import express from 'express';
import { signup, login } from '../controllers/auth.controller.js';
import { authValidation } from '../config/security.config.js';
import { validationResult } from 'express-validator';

const router = express.Router();

// Fixed validation middleware with CORS headers
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // ADD CORS HEADERS TO ERROR RESPONSES
    res.header('Access-Control-Allow-Origin', 'https://ivey-steel.vercel.app');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array() 
    });
  }
  next();
};

// Auth routes with fixed validation
router.post('/signup', authValidation, validate, signup);
router.post('/login', authValidation, validate, login);

export default router;