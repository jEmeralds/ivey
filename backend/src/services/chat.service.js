// backend/src/services/chat.service.js
// Manages real-time support chat via Socket.io + Telegram

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

// ── Send message to Telegram ──────────────────────────────────────────────────
export async function notifyTelegram(sessionId, message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

  const text =
    `💬 *New Support Message*\n` +
    `🆔 Session: \`${sessionId.slice(0, 8)}\`\n\n` +
    `${message}\n\n` +
    `_Reply with:_ \`/reply ${sessionId.slice(0, 8)} your message here\``;

  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'Markdown',
    }),
  });
}

// ── Save message to Supabase ──────────────────────────────────────────────────
export async function saveMessage(sessionId, sender, message) {
  // Upsert conversation
  await supabase
    .from('support_conversations')
    .upsert({ session_id: sessionId, updated_at: new Date().toISOString() }, { onConflict: 'session_id' });

  // Get conversation id
  const { data: conv } = await supabase
    .from('support_conversations')
    .select('id')
    .eq('session_id', sessionId)
    .single();

  if (!conv) return null;

  // Insert message
  const { data: msg } = await supabase
    .from('support_messages')
    .insert({ conversation_id: conv.id, session_id: sessionId, sender, message })
    .select()
    .single();

  return msg;
}

// ── Load message history ──────────────────────────────────────────────────────
export async function loadHistory(sessionId) {
  const { data } = await supabase
    .from('support_messages')
    .select('sender, message, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  return data || [];
}

// ── Parse Telegram reply command ──────────────────────────────────────────────
// You reply in Telegram with: /reply abc12345 your message here
export function parseReplyCommand(text) {
  const match = text?.match(/^\/reply\s+([a-f0-9\-]+)\s+(.+)$/is);
  if (!match) return null;
  return { sessionPrefix: match[1].toLowerCase(), replyText: match[2].trim() };
}

// ── Find session by prefix ────────────────────────────────────────────────────
export async function findSessionByPrefix(prefix) {
  const { data } = await supabase
    .from('support_conversations')
    .select('session_id')
    .ilike('session_id', `${prefix}%`)
    .limit(1)
    .single();

  return data?.session_id || null;
}