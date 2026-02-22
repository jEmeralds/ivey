import express from 'express';
// import { signup, login } from '../controllers/auth.controller.js';  // TEMPORARILY DISABLED

const router = express.Router();

// SUPER SIMPLE TEST ROUTE - No validation, no controllers, just basic response
router.post('/login', (req, res) => {
  console.log('Login route hit!');
  console.log('Request body:', req.body);
  
  // Manually add CORS headers
  res.header('Access-Control-Allow-Origin', 'https://ivey-steel.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.json({
    message: 'Login route working!',
    timestamp: new Date().toISOString(),
    body: req.body
  });
});

router.post('/signup', (req, res) => {
  console.log('Signup route hit!');
  
  // Manually add CORS headers  
  res.header('Access-Control-Allow-Origin', 'https://ivey-steel.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.json({
    message: 'Signup route working!',
    timestamp: new Date().toISOString(),
    body: req.body
  });
});

export default router;