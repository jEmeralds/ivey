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

function parseUrl(url) {
  if (!url) return { platform: 'link', embedId: null };
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    return { platform: 'youtube', embedId: match?.[1] || null };
  }
  if (url.includes('tiktok.com')) {
    const match = url.match(/video\/(\d+)/);
    return { platform: 'tiktok', embedId: match?.[1] || null };
  }
  if (url.includes('instagram.com')) {
    const match = url.match(/\/p\/([^/]+)/);
    return { platform: 'instagram', embedId: match?.[1] || null };
  }
  if (url.includes('facebook.com') || url.includes('fb.com')) {
    return { platform: 'facebook', embedId: null };
  }
  return { platform: 'link', embedId: null };
}

router.get('/', async (req, res) => {
  const { platform, limit = 12, offset = 0 } = req.query;
  let query = supabase
    .from('gallery_items')
    .select('*')
    .eq('approved', true)
    .eq('removed', false)
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);
  if (platform && platform !== 'all') query = query.eq('platform', platform);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ items: data || [] });
});

router.get('/mine', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('gallery_items')
    .select('*')
    .eq('user_id', req.userId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ items: data || [] });
});

router.post('/', auth, async (req, res) => {
  const userId = req.userId;

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

router.delete('/:id', auth, requireAdmin, async (req, res) => {
  const { error } = await supabase
    .from('gallery_items')
    .update({ removed: true })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Item removed from gallery.' });
});

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