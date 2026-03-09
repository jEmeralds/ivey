// backend/src/middleware/admin.middleware.js
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
    console.log('🔐 Admin check — userId:', userId, 'role in token:', decoded.role);

    // If role is in token, use it directly (fast path)
    if (decoded.role === 'admin') {
      req.user = { id: userId, role: 'admin' };
      return next();
    }

    // Fallback — check DB (for old tokens without role)
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    console.log('👤 DB user:', user?.email, 'role:', user?.role, 'error:', error?.message);

    if (error || !user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('🔐 Auth error:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};