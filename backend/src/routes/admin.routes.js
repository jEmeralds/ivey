// backend/src/routes/admin.routes.js
// Admin-only routes for support dashboard

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import { saveMessage } from '../services/chat.service.js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// io instance set from server.js
let _io = null;
export function setAdminIO(io) { _io = io; }

// ── GET /api/admin/conversations ──────────────────────────────────────────────
// Returns all conversations with last message preview
router.get('/conversations', requireAdmin, async (req, res) => {
  const { data: conversations, error } = await supabase
    .from('support_conversations')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // Get last message for each conversation
  const enriched = await Promise.all(
    conversations.map(async (conv) => {
      const { data: messages } = await supabase
        .from('support_messages')
        .select('sender, message, created_at')
        .eq('session_id', conv.session_id)
        .order('created_at', { ascending: false })
        .limit(1);

      const { count } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', conv.session_id)
        .eq('sender', 'user');

      return {
        ...conv,
        last_message: messages?.[0] || null,
        message_count: count || 0,
      };
    })
  );

  res.json({ conversations: enriched });
});

// ── GET /api/admin/conversations/:sessionId/messages ──────────────────────────
router.get('/conversations/:sessionId/messages', requireAdmin, async (req, res) => {
  const { sessionId } = req.params;

  const { data: messages, error } = await supabase
    .from('support_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  res.json({ messages });
});

// ── POST /api/admin/conversations/:sessionId/reply ────────────────────────────
// Admin sends a reply — goes to user's widget via Socket.io
router.post('/conversations/:sessionId/reply', requireAdmin, async (req, res) => {
  const { sessionId } = req.params;
  const { message } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Save to Supabase
  await saveMessage(sessionId, 'support', message.trim());

  // Push to user's widget via Socket.io
  if (_io) {
    _io.to(sessionId).emit('support_message', {
      sender: 'support',
      message: message.trim(),
      created_at: new Date().toISOString(),
    });
  }

  res.json({ success: true });
});

// ── DELETE /api/admin/conversations/:sessionId ────────────────────────────────
router.delete('/conversations/:sessionId', requireAdmin, async (req, res) => {
  const { sessionId } = req.params;

  await supabase
    .from('support_messages')
    .delete()
    .eq('session_id', sessionId);

  await supabase
    .from('support_conversations')
    .delete()
    .eq('session_id', sessionId);

  res.json({ success: true });
});

export default router;