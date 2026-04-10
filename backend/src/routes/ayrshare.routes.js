// backend/src/routes/ayrshare.routes.js
// ─────────────────────────────────────────────────────────────────────────────
// Ayrshare multi-platform video distribution
// Gate: if AYRSHARE_API_KEY is not set, endpoints return 503 with clear message
// When key is added to Railway env vars, everything works immediately — no redeploy
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
router.use(auth);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const AYRSHARE_BASE = 'https://app.ayrshare.com/api';

// ── Key gate ──────────────────────────────────────────────────────────────────
const getKey = () => process.env.AYRSHARE_API_KEY;

const checkKey = (res) => {
  if (!getKey()) {
    res.status(503).json({
      error:       'Ayrshare not configured',
      message:     'Add AYRSHARE_API_KEY to Railway environment variables to enable multi-platform distribution.',
      configured:  false,
    });
    return false;
  }
  return true;
};

// ── Ayrshare API helper ───────────────────────────────────────────────────────
const ayrshare = async (method, endpoint, body = null) => {
  const options = {
    method,
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${getKey()}`,
    },
  };
  if (body) options.body = JSON.stringify(body);
  const res  = await fetch(`${AYRSHARE_BASE}${endpoint}`, options);
  const data = await res.json();
  if (!res.ok) {
    // Log full Ayrshare response so we can see the real error in Railway logs
    console.error('Ayrshare full error response:', JSON.stringify(data));
    const msg = data.message || data.error || data.errors?.[0]?.message || data.detail || JSON.stringify(data);
    throw new Error(msg);
  }
  return data;
};

// ── Log post to social_posts table ───────────────────────────────────────────
const logPost = async ({ userId, campaignId, platform, contentText, mediaUrls, caption, platformPostId, platformUrl, postType, status, errorMessage, scheduledAt }) => {
  try {
    await supabase.from('social_posts').insert({
      user_id:          userId,
      campaign_id:      campaignId   || null,
      platform,
      content_text:     contentText  || null,
      media_urls:       mediaUrls    || null,
      caption:          caption      || null,
      platform_post_id: platformPostId || null,
      platform_url:     platformUrl  || null,
      post_type:        postType     || 'video',
      source:           'ayrshare',
      status:           status       || 'published',
      error_message:    errorMessage || null,
      posted_at:        scheduledAt  || new Date().toISOString(),
    });
  } catch (e) { console.error('Failed to log post:', e.message); }
};

// ── GET /api/ayrshare/status ──────────────────────────────────────────────────
router.get('/status', (req, res) => {
  if (!getKey()) {
    return res.json({
      configured: false,
      message:    'Add AYRSHARE_API_KEY to Railway environment variables to enable multi-platform distribution.',
    });
  }
  res.json({ configured: true });
});

// ── GET /api/ayrshare/profiles ────────────────────────────────────────────────
router.get('/profiles', async (req, res) => {
  if (!checkKey(res)) return;
  try {
    const data = await ayrshare('GET', '/profiles');
    res.json({ profiles: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/ayrshare/post ───────────────────────────────────────────────────
// Posts a video immediately to selected platforms
// Body: { videoUrl, caption, platforms, campaignId }
router.post('/post', async (req, res) => {
  if (!checkKey(res)) return;

  const { videoUrl, caption, platforms, campaignId } = req.body;
  if (!videoUrl?.trim())  return res.status(400).json({ error: 'videoUrl is required' });
  if (!platforms?.length) return res.status(400).json({ error: 'platforms array is required' });
  if (!caption?.trim())   return res.status(400).json({ error: 'caption is required' });

  console.log(`📤 Ayrshare post → [${platforms.join(', ')}]`);

  try {
    const data = await ayrshare('POST', '/post', {
      post:      caption,
      platforms: platforms.map(p => p.toLowerCase()),
      mediaUrls: [videoUrl],
      isVideo:   true,
    });

    for (const result of (data.postIds || [])) {
      await logPost({
        userId: req.userId, campaignId,
        platform:       result.platform,
        contentText:    caption,
        mediaUrls:      [videoUrl],
        caption,
        platformPostId: result.id       || null,
        platformUrl:    result.postUrl  || null,
        postType:       'video',
        status:         result.status === 'success' ? 'published' : 'failed',
        errorMessage:   result.errors?.[0]?.message || null,
      });
    }

    res.json({
      success: true,
      results: data.postIds || [],
      message: `Posted to ${platforms.length} platform${platforms.length !== 1 ? 's' : ''}`,
    });
  } catch (err) {
    console.error('Ayrshare post error:', err.message);
    for (const platform of platforms) {
      await logPost({
        userId: req.userId, campaignId, platform,
        contentText: caption, mediaUrls: [videoUrl], caption,
        postType: 'video', status: 'failed', errorMessage: err.message,
      });
    }
    res.status(500).json({ error: err.message || 'Failed to post' });
  }
});

// ── POST /api/ayrshare/schedule ───────────────────────────────────────────────
// Schedules a video post for a future time
// Body: { videoUrl, caption, platforms, scheduleDate, campaignId }
router.post('/schedule', async (req, res) => {
  if (!checkKey(res)) return;

  const { videoUrl, caption, platforms, scheduleDate, campaignId } = req.body;
  if (!videoUrl?.trim())  return res.status(400).json({ error: 'videoUrl is required' });
  if (!platforms?.length) return res.status(400).json({ error: 'platforms array is required' });
  if (!caption?.trim())   return res.status(400).json({ error: 'caption is required' });
  if (!scheduleDate)      return res.status(400).json({ error: 'scheduleDate is required' });

  const scheduledAt = new Date(scheduleDate);
  if (isNaN(scheduledAt) || scheduledAt < new Date()) {
    return res.status(400).json({ error: 'scheduleDate must be a valid future date' });
  }

  console.log(`⏰ Ayrshare schedule → [${platforms.join(', ')}] at ${scheduleDate}`);

  try {
    const data = await ayrshare('POST', '/post', {
      post:         caption,
      platforms:    platforms.map(p => p.toLowerCase()),
      mediaUrls:    [videoUrl],
      isVideo:      true,
      scheduleDate: scheduledAt.toISOString(),
    });

    for (const result of (data.postIds || [])) {
      await logPost({
        userId: req.userId, campaignId,
        platform:       result.platform,
        contentText:    caption,
        mediaUrls:      [videoUrl],
        caption,
        platformPostId: result.id || null,
        postType:       'video',
        status:         'scheduled',
        scheduledAt:    scheduledAt.toISOString(),
      });
    }

    res.json({
      success:     true,
      scheduledAt: scheduledAt.toISOString(),
      results:     data.postIds || [],
      message:     `Scheduled for ${scheduledAt.toLocaleString()}`,
    });
  } catch (err) {
    console.error('Ayrshare schedule error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to schedule' });
  }
});

// ── GET /api/ayrshare/history ─────────────────────────────────────────────────
router.get('/history', async (req, res) => {
  if (!checkKey(res)) return;
  try {
    const { data: posts } = await supabase
      .from('social_posts')
      .select('*')
      .eq('user_id', req.userId)
      .eq('source', 'ayrshare')
      .order('posted_at', { ascending: false })
      .limit(50);
    res.json({ posts: posts || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/ayrshare/post/:postId ─────────────────────────────────────────
router.delete('/post/:postId', async (req, res) => {
  if (!checkKey(res)) return;
  try {
    await ayrshare('DELETE', '/post', { id: req.params.postId });
    await supabase.from('social_posts')
      .update({ status: 'deleted' })
      .eq('platform_post_id', req.params.postId)
      .eq('user_id', req.userId);
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;