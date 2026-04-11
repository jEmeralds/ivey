// backend/src/routes/heygen.routes.js
// ─────────────────────────────────────────────────────────────────────────────
// HeyGen API integration — fully automated video production
// Flow: submit script → poll status → download MP4 → store in Supabase → notify frontend
// Gate: HEYGEN_API_KEY env var — if not set, returns 503 with setup instructions
// Plan gate: Creator or Studio plan required
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import { checkVideoLimit, incrementVideoUsage, getUserPlan } from '../middleware/plan.middleware.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
router.use(auth);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const HEYGEN_BASE    = 'https://api.heygen.com';
const HEYGEN_KEY     = () => process.env.HEYGEN_API_KEY;
const BACKEND_URL    = process.env.BACKEND_URL || 'https://ivey-production.up.railway.app';

// ── Key gate ──────────────────────────────────────────────────────────────────
const checkKey = (res) => {
  if (!HEYGEN_KEY()) {
    res.status(503).json({
      error:      'HeyGen not configured',
      message:    'Add HEYGEN_API_KEY to Railway environment variables to enable automated video production.',
      configured: false,
      setup: [
        'Sign up at app.heygen.com',
        'Go to Settings → API → Generate API Key',
        'Add HEYGEN_API_KEY to Railway environment variables',
        'Railway auto-restarts — video generation works immediately',
      ],
    });
    return false;
  }
  return true;
};

// ── HeyGen API helper ─────────────────────────────────────────────────────────
const heygen = async (method, endpoint, body = null) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key':    HEYGEN_KEY(),
    },
  };
  if (body) options.body = JSON.stringify(body);
  const res  = await fetch(`${HEYGEN_BASE}${endpoint}`, options);
  const data = await res.json();
  if (!res.ok) {
    console.error('HeyGen full error:', JSON.stringify(data));
    throw new Error(data.message || data.error || data?.data?.message || `HeyGen error: ${res.status}`);
  }
  return data;
};

// ── GET /api/heygen/status ────────────────────────────────────────────────────
router.get('/status', (req, res) => {
  if (!HEYGEN_KEY()) {
    return res.json({
      configured: false,
      message:    'Add HEYGEN_API_KEY to Railway environment variables.',
    });
  }
  res.json({ configured: true });
});

// ── GET /api/heygen/avatars ───────────────────────────────────────────────────
// Returns available HeyGen avatars for the user to pick from
router.get('/avatars', async (req, res) => {
  if (!checkKey(res)) return;
  try {
    const data = await heygen('GET', '/v2/avatars');
    res.json({ avatars: data.data?.avatars || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/heygen/voices ────────────────────────────────────────────────────
router.get('/voices', async (req, res) => {
  if (!checkKey(res)) return;
  try {
    const data = await heygen('GET', '/v2/voices');
    res.json({ voices: data.data?.voices || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/heygen/generate ─────────────────────────────────────────────────
// Submits a video generation job to HeyGen
// Body: { campaignId, script, avatarId, voiceId, aspectRatio, caption }
// Returns: { videoId, status: 'processing' }
router.post('/generate', checkVideoLimit, async (req, res) => {
  if (!checkKey(res)) return;

  const {
    campaignId,
    script,
    avatarId,
    voiceId,
    aspectRatio = '9:16',  // vertical by default for social
    caption     = false,
    title,
  } = req.body;

  if (!script?.trim()) return res.status(400).json({ error: 'script is required' });
  if (!avatarId)       return res.status(400).json({ error: 'avatarId is required' });
  if (!voiceId)        return res.status(400).json({ error: 'voiceId is required' });

  console.log(`🎬 HeyGen generate | campaign: ${campaignId} | avatar: ${avatarId}`);

  try {
    // Submit video generation to HeyGen v2 API
    const payload = {
      video_inputs: [{
        character: {
          type:      'avatar',
          avatar_id: avatarId,
          avatar_style: 'normal',
        },
        voice: {
          type:     'text',
          voice_id: voiceId,
          input_text: script,
        },
        background: {
          type:  'color',
          value: '#000000',
        },
      }],
      aspect_ratio: aspectRatio,
      caption,
      title: title || `IVey Video — ${new Date().toISOString().slice(0, 10)}`,
      test: false,  // set to true during development to save credits
    };

    const data = await heygen('POST', '/v2/video/generate', payload);
    const videoId = data.data?.video_id;

    if (!videoId) throw new Error('HeyGen did not return a video_id');

    // Store job in Supabase so we can track status
    await supabase.from('heygen_jobs').insert({
      user_id:     req.userId,
      campaign_id: campaignId || null,
      video_id:    videoId,
      status:      'processing',
      script:      script.slice(0, 2000),
      avatar_id:   avatarId,
      voice_id:    voiceId,
      aspect_ratio: aspectRatio,
      created_at:  new Date().toISOString(),
    }).catch(e => console.warn('Failed to log HeyGen job:', e.message));

    // Increment video usage counter
    await incrementVideoUsage(req.userId);

    res.json({
      success:  true,
      videoId,
      status:   'processing',
      message:  'Video generation started. Check status with GET /api/heygen/video/:videoId',
      eta:      '5-10 minutes',
    });
  } catch (err) {
    console.error('HeyGen generate error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to start video generation' });
  }
});

// ── GET /api/heygen/video/:videoId ────────────────────────────────────────────
// Polls HeyGen for video status
// Returns: { status, videoUrl, thumbnailUrl } when complete
router.get('/video/:videoId', async (req, res) => {
  if (!checkKey(res)) return;

  try {
    const data    = await heygen('GET', `/v1/video_status.get?video_id=${req.params.videoId}`);
    const video   = data.data;
    const status  = video?.status; // processing | completed | failed

    if (status === 'completed') {
      const videoUrl     = video.video_url     || video.video_url_caption || null;
      const thumbnailUrl = video.thumbnail_url || null;

      // If completed, auto-download and store in Supabase
      if (videoUrl) {
        await storeVideoInSupabase(req.userId, req.params.videoId, videoUrl, thumbnailUrl);
      }

      // Update job status in DB
      await supabase.from('heygen_jobs')
        .update({ status: 'completed', video_url: videoUrl, thumbnail_url: thumbnailUrl, completed_at: new Date().toISOString() })
        .eq('video_id', req.params.videoId)
        .eq('user_id', req.userId)
        .catch(() => {});

      return res.json({ status: 'completed', videoUrl, thumbnailUrl });
    }

    if (status === 'failed') {
      await supabase.from('heygen_jobs')
        .update({ status: 'failed', error: video.error || 'Unknown error' })
        .eq('video_id', req.params.videoId)
        .eq('user_id', req.userId)
        .catch(() => {});

      return res.json({ status: 'failed', error: video.error || 'Video generation failed' });
    }

    // Still processing
    res.json({ status: 'processing', progress: video.progress || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/heygen/jobs ──────────────────────────────────────────────────────
// Returns all HeyGen jobs for the current user
router.get('/jobs', async (req, res) => {
  try {
    const { data: jobs } = await supabase
      .from('heygen_jobs')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .limit(20);
    res.json({ jobs: jobs || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/heygen/jobs/:campaignId ──────────────────────────────────────────
// Returns HeyGen jobs for a specific campaign
router.get('/jobs/:campaignId', async (req, res) => {
  try {
    const { data: jobs } = await supabase
      .from('heygen_jobs')
      .select('*')
      .eq('user_id', req.userId)
      .eq('campaign_id', req.params.campaignId)
      .order('created_at', { ascending: false });
    res.json({ jobs: jobs || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/heygen/webhook ──────────────────────────────────────────────────
// HeyGen calls this when a video is ready
// Webhook URL to set in HeyGen: https://ivey-production.up.railway.app/api/heygen/webhook
router.post('/webhook', express.json(), async (req, res) => {
  console.log('🎬 HeyGen webhook received:', JSON.stringify(req.body).slice(0, 200));

  try {
    const { event_type, event_data } = req.body;

    if (event_type === 'avatar_video.success') {
      const videoId     = event_data?.video_id;
      const videoUrl    = event_data?.url || event_data?.video_url;
      const thumbnailUrl = event_data?.thumbnail_url || null;

      if (!videoId || !videoUrl) {
        return res.json({ received: true });
      }

      // Find the job in our DB
      const { data: job } = await supabase
        .from('heygen_jobs')
        .select('*')
        .eq('video_id', videoId)
        .single();

      if (job) {
        // Download and store in Supabase storage
        const supabaseUrl = await storeVideoInSupabase(job.user_id, videoId, videoUrl, thumbnailUrl);

        // Update job record
        await supabase.from('heygen_jobs').update({
          status:        'completed',
          video_url:     supabaseUrl || videoUrl,
          thumbnail_url: thumbnailUrl,
          completed_at:  new Date().toISOString(),
        }).eq('video_id', videoId);

        // If campaign attached, log to social_posts as a "ready to distribute" entry
        if (job.campaign_id) {
          await supabase.from('social_posts').insert({
            user_id:      job.user_id,
            campaign_id:  job.campaign_id,
            platform:     'heygen',
            content_text: job.script?.slice(0, 500) || null,
            media_urls:   [supabaseUrl || videoUrl],
            post_type:    'video',
            source:       'heygen',
            status:       'ready',
            posted_at:    new Date().toISOString(),
          }).catch(() => {});
        }

        console.log(`✅ HeyGen video ready: ${videoId} → stored in Supabase`);
      }
    }

    if (event_type === 'avatar_video.fail') {
      const videoId = event_data?.video_id;
      if (videoId) {
        await supabase.from('heygen_jobs').update({
          status: 'failed',
          error:  event_data?.error || 'Generation failed',
        }).eq('video_id', videoId);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('HeyGen webhook error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Helper: download video from HeyGen and store in Supabase storage ──────────
const storeVideoInSupabase = async (userId, videoId, videoUrl, thumbnailUrl) => {
  try {
    console.log(`📥 Downloading HeyGen video: ${videoId}`);

    const response = await fetch(videoUrl);
    if (!response.ok) throw new Error('Failed to fetch video from HeyGen');

    const buffer      = Buffer.from(await response.arrayBuffer());
    const storagePath = `heygen-videos/${userId}/${videoId}.mp4`;

    const { error: uploadError } = await supabase.storage
      .from('ivey-media')
      .upload(storagePath, buffer, { contentType: 'video/mp4', upsert: true });

    if (uploadError) throw new Error(uploadError.message);

    const { data: { publicUrl } } = supabase.storage
      .from('ivey-media')
      .getPublicUrl(storagePath);

    // Also store thumbnail if available
    if (thumbnailUrl) {
      try {
        const thumbRes    = await fetch(thumbnailUrl);
        const thumbBuffer = Buffer.from(await thumbRes.arrayBuffer());
        const thumbPath   = `heygen-videos/${userId}/${videoId}-thumb.jpg`;
        await supabase.storage.from('ivey-media').upload(thumbPath, thumbBuffer, { contentType: 'image/jpeg', upsert: true });
      } catch (e) { console.warn('Thumbnail store failed:', e.message); }
    }

    console.log(`✅ Video stored: ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    console.error('Video storage failed:', err.message);
    return null; // Return null — original HeyGen URL still usable
  }
};

export default router;