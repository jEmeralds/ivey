import express from 'express';
import { signup, login } from '../controllers/auth.controller.js';
import { authValidation } from '../config/security.config.js';
import { validationResult } from 'express-validator';

const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array() 
    });
  }
  next();
};

// Auth routes with validation
router.post('/signup', authValidation, validate, signup);
router.post('/login', authValidation, validate, login);

export default router;