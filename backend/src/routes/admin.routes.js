// backend/src/routes/admin.routes.js
// ─────────────────────────────────────────────────────────────────────────────
// Admin-only API — user management, plan overrides, revenue monitoring
// Protected by requireAdmin middleware — role='admin' in users table
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { auth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import { saveMessage } from '../services/chat.service.js';

const router = express.Router();
let adminIO = null;
export const setAdminIO = (io) => { adminIO = io; };

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// All admin routes require auth + admin role
router.use(auth, requireAdmin);

// ── GET /api/admin/users ──────────────────────────────────────────────────────
// List all users with plan, usage, activity
router.get('/users', async (req, res) => {
  try {
    const { search, plan, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select('id, name, email, role, plan, plan_expires_at, trial_used, videos_used, posts_used, created_at, payment_provider', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (plan && plan !== 'all') {
      query = query.eq('plan', plan);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ users: data || [], total: count || 0, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/users/:id ──────────────────────────────────────────────────
router.get('/users/:id', async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });

    // Get their campaigns count
    const { count: campaigns } = await supabase
      .from('campaigns')
      .select('id', { count: 'exact' })
      .eq('user_id', req.params.id);

    // Get their payment history
    const { data: payments } = await supabase
      .from('payment_refs')
      .select('*')
      .eq('user_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get their social posts count
    const { count: posts } = await supabase
      .from('social_posts')
      .select('id', { count: 'exact' })
      .eq('user_id', req.params.id);

    const { password: _, ...safeUser } = user;
    res.json({
      user: safeUser,
      stats: { campaigns: campaigns || 0, posts: posts || 0 },
      payments: payments || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/admin/users/:id/plan ─────────────────────────────────────────────
// Override user plan — the core admin action
// Body: { plan, expires_at, reset_usage }
router.put('/users/:id/plan', async (req, res) => {
  try {
    const { plan, expires_at, reset_usage = false, note } = req.body;

    const validPlans = ['free', 'trial', 'starter', 'creator', 'studio'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ error: `Invalid plan. Must be one of: ${validPlans.join(', ')}` });
    }

    const updates = {
      plan,
      plan_expires_at: expires_at || null,
    };

    if (reset_usage) {
      updates.videos_used    = 0;
      updates.posts_used     = 0;
      updates.usage_reset_at = new Date().toISOString();
    }

    // If setting trial, mark trial fields
    if (plan === 'trial') {
      updates.trial_started_at = new Date().toISOString();
      updates.trial_used       = true;
      if (!expires_at) {
        const exp = new Date();
        exp.setDate(exp.getDate() + 7);
        updates.plan_expires_at = exp.toISOString();
      }
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, email, plan, plan_expires_at')
      .single();

    if (error) throw error;

    // Log the admin action
    await supabase.from('admin_actions').insert({
      admin_id:   req.userId,
      target_id:  req.params.id,
      action:     'plan_override',
      details:    { plan, expires_at, reset_usage, note: note || null },
      created_at: new Date().toISOString(),
    }).catch(() => {});

    console.log(`👑 Admin plan override: user ${req.params.id} → ${plan} by admin ${req.userId}`);
    res.json({ success: true, user: data, message: `Plan updated to ${plan}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/admin/users/:id/activate ─────────────────────────────────────────
// Activate or deactivate a user account
router.put('/users/:id/activate', async (req, res) => {
  try {
    const { active, reason } = req.body;
    const role = active ? 'user' : 'suspended';

    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', req.params.id)
      .select('id, email, role')
      .single();

    if (error) throw error;

    await supabase.from('admin_actions').insert({
      admin_id:   req.userId,
      target_id:  req.params.id,
      action:     active ? 'activate' : 'deactivate',
      details:    { reason: reason || null },
      created_at: new Date().toISOString(),
    }).catch(() => {});

    res.json({ success: true, user: data, message: active ? 'Account activated' : 'Account suspended' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/users/:id/waiver ─────────────────────────────────────────
// Issue a waiver — extend plan, add credits, reset limits
router.post('/users/:id/waiver', async (req, res) => {
  try {
    const { type, value, note } = req.body;
    // type: 'extend_plan' | 'reset_videos' | 'reset_posts' | 'add_videos' | 'add_posts'

    const updates = {};

    if (type === 'extend_plan') {
      const { data: user } = await supabase.from('users').select('plan_expires_at').eq('id', req.params.id).single();
      const base = user?.plan_expires_at ? new Date(user.plan_expires_at) : new Date();
      base.setDate(base.getDate() + Number(value));
      updates.plan_expires_at = base.toISOString();
    } else if (type === 'reset_videos') {
      updates.videos_used = 0;
    } else if (type === 'reset_posts') {
      updates.posts_used = 0;
    } else if (type === 'reset_all') {
      updates.videos_used = 0;
      updates.posts_used  = 0;
      updates.usage_reset_at = new Date().toISOString();
    } else {
      return res.status(400).json({ error: 'Invalid waiver type' });
    }

    const { error } = await supabase.from('users').update(updates).eq('id', req.params.id);
    if (error) throw error;

    await supabase.from('admin_actions').insert({
      admin_id:   req.userId,
      target_id:  req.params.id,
      action:     'waiver',
      details:    { type, value, note: note || null },
      created_at: new Date().toISOString(),
    }).catch(() => {});

    res.json({ success: true, message: `Waiver issued: ${type}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
// Revenue and usage overview
router.get('/stats', async (req, res) => {
  try {
    const [usersRes, plansRes, paymentsRes, postsRes] = await Promise.all([
      supabase.from('users').select('id, plan, created_at', { count: 'exact' }),
      supabase.from('users').select('plan').neq('plan', 'free'),
      supabase.from('payment_refs').select('amount, currency, status, created_at').eq('status', 'completed'),
      supabase.from('social_posts').select('id', { count: 'exact' }),
    ]);

    const users    = usersRes.data || [];
    const payments = paymentsRes.data || [];

    // Plan breakdown
    const planBreakdown = { free: 0, trial: 0, starter: 0, creator: 0, studio: 0 };
    users.forEach(u => { if (planBreakdown[u.plan] !== undefined) planBreakdown[u.plan]++; });

    // MRR calculation
    const PLAN_MRR = { starter: 19, creator: 49, studio: 99 };
    const mrr = users.reduce((sum, u) => sum + (PLAN_MRR[u.plan] || 0), 0);

    // Signups last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSignups = users.filter(u => new Date(u.created_at) > thirtyDaysAgo).length;

    // Revenue total
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    res.json({
      totalUsers:    usersRes.count || 0,
      recentSignups,
      planBreakdown,
      mrr,
      totalRevenue,
      totalPosts:    postsRes.count || 0,
      paidUsers:     (planBreakdown.starter + planBreakdown.creator + planBreakdown.studio),
      trialUsers:    planBreakdown.trial,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/actions ────────────────────────────────────────────────────
// Audit log of all admin actions
router.get('/actions', async (req, res) => {
  try {
    const { data } = await supabase
      .from('admin_actions')
      .select('*, users!admin_actions_target_id_fkey(email, name)')
      .order('created_at', { ascending: false })
      .limit(100);
    res.json({ actions: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/payments ───────────────────────────────────────────────────
router.get('/payments', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payment_refs')
      .select('*, users!payment_refs_user_id_fkey(email, name)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    res.json({ payments: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Keep existing chat/support routes ─────────────────────────────────────────
router.get('/conversations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('support_conversations')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ conversations: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/conversations/:sessionId/messages', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('session_id', req.params.sessionId)
      .order('created_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ messages: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/conversations/:sessionId/reply', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message required' });
    const saved = await saveMessage(req.params.sessionId, 'admin', message.trim());
    if (adminIO) {
      adminIO.to(req.params.sessionId).emit('admin_message', {
        sender: 'admin', message: message.trim(),
        created_at: saved?.created_at || new Date().toISOString(),
      });
    }
    res.json({ success: true, message: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;