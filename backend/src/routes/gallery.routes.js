// backend/src/routes/gallery.routes.js

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { auth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

const GALLERY_MAX = 20;

// ── URL parser ────────────────────────────────────────────────────────────────
function parseUrl(url) {
  if (!url) return { platform: 'link', embedId: null };
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const match = url.match(/(?:v=|youtu\.be\/|shorts\/)([^&?/]+)/);
    return { platform: 'youtube', embedId: match?.[1] || null };
  }
  if (url.includes('tiktok.com')) {
    const match = url.match(/video\/(\d+)/);
    return { platform: 'tiktok', embedId: match?.[1] || null };
  }
  if (url.includes('instagram.com')) {
    const match = url.match(/\/(?:p|reel)\/([^/]+)/);
    return { platform: 'instagram', embedId: match?.[1] || null };
  }
  if (url.includes('facebook.com') || url.includes('fb.com')) {
    return { platform: 'facebook', embedId: null };
  }
  return { platform: 'link', embedId: null };
}

// ── Score formula for autodrop ────────────────────────────────────────────────
// Score = (views * 0.5) + (likes * 0.3) + (recency_days_remaining * 0.2)
// Lowest score gets dropped when gallery hits 21 items
function parseMetric(val) {
  if (!val || val === '—') return 0;
  const s = String(val).trim().toUpperCase();
  if (s.endsWith('M')) return parseFloat(s) * 1_000_000;
  if (s.endsWith('K')) return parseFloat(s) * 1_000;
  return parseFloat(s) || 0;
}

function scoreItem(item) {
  const views = parseMetric(item.views);
  const likes = parseMetric(item.likes);
  // Recency: items decay over 90 days (0 = 90+ days old, 90 = just posted)
  const ageMs = Date.now() - new Date(item.created_at).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const recency = Math.max(0, 90 - ageDays);
  return (views * 0.5) + (likes * 0.3) + (recency * 0.2);
}

// ── GET /api/gallery — public ─────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { platform } = req.query;

  let query = supabase
    .from('gallery_items')
    .select('*')
    .eq('approved', true)
    .eq('removed', false)
    .order('created_at', { ascending: false })
    .limit(GALLERY_MAX);

  if (platform && platform !== 'all') query = query.eq('platform', platform);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ items: data || [] });
});

// ── GET /api/gallery/mine ─────────────────────────────────────────────────────
router.get('/mine', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('gallery_items')
    .select('*')
    .eq('user_id', req.userId)
    .eq('removed', false)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ items: data || [] });
});

// ── POST /api/gallery ─────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  const userId = req.userId;

  // Must have a campaign
  const { data: campaignCheck, error: checkError } = await supabase
    .from('campaigns')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (checkError) {
    console.error('Campaign check error:', checkError.message);
  } else if (!campaignCheck || campaignCheck.length === 0) {
    return res.status(403).json({ error: 'You need to create a campaign before submitting to the gallery.' });
  }

  const { url, caption, brand_name, format, campaign_id, views, likes } = req.body;
  if (!url || !caption || !brand_name) {
    return res.status(400).json({ error: 'url, caption and brand_name are required.' });
  }

  const { platform, embedId } = parseUrl(url);

  // ── Autodrop: check current count ──────────────────────────────────────────
  const { data: allItems, error: countError } = await supabase
    .from('gallery_items')
    .select('id, views, likes, created_at')
    .eq('approved', true)
    .eq('removed', false);

  if (!countError && allItems && allItems.length >= GALLERY_MAX) {
    // Score every item and find the lowest
    const scored = allItems.map(item => ({ id: item.id, score: scoreItem(item) }));
    scored.sort((a, b) => a.score - b.score);
    const toDrop = scored[0];

    console.log(`🗑 Gallery at ${allItems.length}/${GALLERY_MAX} — dropping item ${toDrop.id} (score: ${toDrop.score.toFixed(2)})`);

    const { error: dropError } = await supabase
      .from('gallery_items')
      .update({ removed: true })
      .eq('id', toDrop.id);

    if (dropError) console.error('Autodrop error:', dropError.message);
  }

  // ── Insert new item ─────────────────────────────────────────────────────────
  const { data, error } = await supabase
    .from('gallery_items')
    .insert({
      user_id: userId,
      url,
      platform,
      embed_id: embedId,
      caption: caption.trim(),
      brand_name: brand_name.trim(),
      format: format?.trim() || null,
      campaign_id: campaign_id || null,
      views: views?.trim() || '—',
      likes: likes?.trim() || '—',
      approved: true,
      removed: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Gallery insert error:', error.message);
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json({ item: data, message: 'Added to gallery!' });
});

// ── DELETE /api/gallery/:id — admin ──────────────────────────────────────────
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  const { error } = await supabase
    .from('gallery_items')
    .update({ removed: true })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Item removed from gallery.' });
});

// ── DELETE /api/gallery/:id/mine — user removes own ──────────────────────────
router.delete('/:id/mine', auth, async (req, res) => {
  const { error } = await supabase
    .from('gallery_items')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Removed from gallery.' });
});

export default router;