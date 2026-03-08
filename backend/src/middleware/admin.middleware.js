// backend/src/middleware/admin.middleware.js
// Protects routes — only users with role='admin' can access

import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

export const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.userId || decoded.id || decoded.sub;
    console.log('🔐 Admin check for userId:', userId);

    // Query your custom users table explicitly
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    console.log('👤 User found:', user, 'Error:', error?.message);

    if (error || !user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.role !== 'admin') {
      console.log('🚫 Not admin, role is:', user.role);
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('🔐 Auth error:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};