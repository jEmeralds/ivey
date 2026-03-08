// backend/src/routes/chat.routes.js
// Telegram webhook endpoint for receiving your replies

import express from 'express';
import {
  parseReplyCommand,
  findSessionByPrefix,
  saveMessage,
} from '../services/chat.service.js';

const router = express.Router();

// This will be set by server.js after Socket.io is initialized
let _io = null;
export function setIO(io) { _io = io; }

// ── POST /api/chat/webhook ────────────────────────────────────────────────────
// Telegram calls this when you send a message to the bot
router.post('/webhook', async (req, res) => {
  res.sendStatus(200); // Always respond 200 to Telegram immediately

  const update = req.body;
  const text = update?.message?.text;
  if (!text) return;

  console.log('📨 Telegram webhook received:', text);

  const parsed = parseReplyCommand(text);
  if (!parsed) {
    console.log('ℹ️ Not a /reply command, ignoring');
    return;
  }

  const { sessionPrefix, replyText } = parsed;

  // Find the full session ID
  const sessionId = await findSessionByPrefix(sessionPrefix);
  if (!sessionId) {
    console.warn(`⚠️ No session found for prefix: ${sessionPrefix}`);
    return;
  }

  // Save reply to Supabase
  await saveMessage(sessionId, 'support', replyText);

  // Push reply to user via Socket.io
  if (_io) {
    _io.to(sessionId).emit('support_message', {
      sender: 'support',
      message: replyText,
      created_at: new Date().toISOString(),
    });
    console.log(`✅ Reply pushed to session: ${sessionId.slice(0, 8)}`);
  }
});

// ── GET /api/chat/history/:sessionId ─────────────────────────────────────────
router.get('/history/:sessionId', async (req, res) => {
  const { loadHistory } = await import('../services/chat.service.js');
  const history = await loadHistory(req.params.sessionId);
  res.json({ history });
});

export default router;