// backend/src/routes/social.routes.js
// Social OAuth + posting + upload + analytics
// npm install twitter-api-v2 multer (backend)

import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { auth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://ivey-steel.vercel.app';
const BACKEND_URL  = process.env.BACKEND_URL  || 'https://ivey-production.up.railway.app';

const oauthStateStore = new Map();

// ── helpers ───────────────────────────────────────────────────────────────────
async function logPost({ userId, campaignId, platform, contentText, mediaUrls, caption, platformPostId, platformUrl, postType, source, status, errorMessage }) {
  try {
    await supabase.from('social_posts').insert({
      user_id: userId,
      campaign_id: campaignId || null,
      platform,
      content_text: contentText || null,
      media_urls: mediaUrls || null,
      caption: caption || null,
      platform_post_id: platformPostId || null,
      platform_url: platformUrl || null,
      post_type: postType || 'text',
      source: source || 'ivey',
      status: status || 'published',
      error_message: errorMessage || null,
      posted_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Failed to log post:', e.message);
  }
}

async function getTwitterClient(userId) {
  const { data: conn } = await supabase
    .from('social_connections')
    .select('access_token, refresh_token, token_expiry')
    .eq('user_id', userId)
    .eq('platform', 'twitter')
    .single();
  if (!conn) return null;
  const { TwitterApi } = await import('twitter-api-v2');
  let accessToken = conn.access_token;
  if (conn.token_expiry && new Date(conn.token_expiry) < new Date() && conn.refresh_token) {
    const base = new TwitterApi({ clientId: process.env.TWITTER_CLIENT_ID, clientSecret: process.env.TWITTER_CLIENT_SECRET });
    const refreshed = await base.refreshOAuth2Token(conn.refresh_token);
    accessToken = refreshed.accessToken;
    await supabase.from('social_connections').update({
      access_token: refreshed.accessToken,
      refresh_token: refreshed.refreshToken,
      token_expiry: refreshed.expiresIn ? new Date(Date.now() + refreshed.expiresIn * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId).eq('platform', 'twitter');
  }
  return new TwitterApi(accessToken);
}

// ── GET /api/social/connections ───────────────────────────────────────────────
router.get('/connections', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('social_connections')
    .select('id, platform, platform_username, platform_name, platform_avatar, connected_at, token_expiry')
    .eq('user_id', req.userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ connections: data || [] });
});

// ── DELETE /api/social/disconnect/:platform ───────────────────────────────────
router.delete('/disconnect/:platform', auth, async (req, res) => {
  const { error } = await supabase
    .from('social_connections')
    .delete()
    .eq('user_id', req.userId)
    .eq('platform', req.params.platform);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: `Disconnected from ${req.params.platform}` });
});

// ════════════════════════════════════════════════════════════════════════════════
// TWITTER OAUTH
// ════════════════════════════════════════════════════════════════════════════════
router.get('/twitter/connect', auth, async (req, res) => {
  try {
    const { TwitterApi } = await import('twitter-api-v2');
    const client = new TwitterApi({ clientId: process.env.TWITTER_CLIENT_ID, clientSecret: process.env.TWITTER_CLIENT_SECRET });
    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
      `${BACKEND_URL}/api/social/twitter/callback`,
      { scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] }
    );
    oauthStateStore.set(state, { userId: req.userId, codeVerifier, platform: 'twitter' });
    setTimeout(() => oauthStateStore.delete(state), 10 * 60 * 1000);
    res.json({ url });
  } catch (err) {
    console.error('Twitter connect error:', err);
    res.status(500).json({ error: 'Failed to initiate Twitter OAuth' });
  }
});

router.get('/twitter/callback', async (req, res) => {
  const { state, code } = req.query;
  const stored = oauthStateStore.get(state);
  if (!stored) return res.redirect(`${FRONTEND_URL}/dashboard?oauth=error&platform=twitter&reason=state_mismatch`);
  oauthStateStore.delete(state);
  try {
    const { TwitterApi } = await import('twitter-api-v2');
    const client = new TwitterApi({ clientId: process.env.TWITTER_CLIENT_ID, clientSecret: process.env.TWITTER_CLIENT_SECRET });
    const { accessToken, refreshToken, expiresIn, client: authed } = await client.loginWithOAuth2({
      code, codeVerifier: stored.codeVerifier,
      redirectUri: `${BACKEND_URL}/api/social/twitter/callback`,
    });
    const { data: me } = await authed.v2.me({ 'user.fields': ['profile_image_url', 'name', 'username'] });
    await supabase.from('social_connections').upsert({
      user_id: stored.userId, platform: 'twitter',
      access_token: accessToken, refresh_token: refreshToken || null,
      token_expiry: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
      platform_user_id: me.id, platform_username: me.username,
      platform_name: me.name, platform_avatar: me.profile_image_url || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' });
    res.redirect(`${FRONTEND_URL}/dashboard?oauth=success&platform=twitter&username=${me.username}`);
  } catch (err) {
    console.error('Twitter callback error:', err);
    res.redirect(`${FRONTEND_URL}/dashboard?oauth=error&platform=twitter`);
  }
});

// ── POST /api/social/twitter/post — text tweet ────────────────────────────────
router.post('/twitter/post', auth, async (req, res) => {
  const { text, campaignId } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'text is required' });
  let status = 'failed'; let platformPostId = null; let platformUrl = null; let errorMessage = null;
  try {
    const client = await getTwitterClient(req.userId);
    if (!client) return res.status(404).json({ error: 'Twitter not connected' });
    const tweet = await client.v2.tweet(text.slice(0, 280));
    platformPostId = tweet.data.id;
    platformUrl = `https://twitter.com/i/web/status/${tweet.data.id}`;
    status = 'published';
    res.json({ success: true, tweet_id: tweet.data.id, url: platformUrl });
  } catch (err) {
    errorMessage = err.message;
    res.status(500).json({ error: err.message || 'Failed to post tweet' });
  } finally {
    await logPost({ userId: req.userId, campaignId, platform: 'twitter', contentText: text, postType: 'text', source: 'ivey', status, platformPostId, platformUrl, errorMessage });
  }
});

// ── POST /api/social/twitter/upload — tweet with media ───────────────────────
router.post('/twitter/upload', auth, upload.array('media', 4), async (req, res) => {
  const { caption, campaignId } = req.body;
  const files = req.files || [];
  let status = 'failed'; let platformPostId = null; let platformUrl = null; let errorMessage = null;
  try {
    const client = await getTwitterClient(req.userId);
    if (!client) return res.status(404).json({ error: 'Twitter not connected' });
    const mediaIds = [];
    for (const file of files) {
      const mediaId = await client.v1.uploadMedia(file.buffer, { mimeType: file.mimetype });
      mediaIds.push(mediaId);
    }
    const tweetPayload = { text: (caption || '').slice(0, 280) };
    if (mediaIds.length) tweetPayload.media = { media_ids: mediaIds };
    const tweet = await client.v2.tweet(tweetPayload);
    platformPostId = tweet.data.id;
    platformUrl = `https://twitter.com/i/web/status/${tweet.data.id}`;
    status = 'published';
    res.json({ success: true, tweet_id: tweet.data.id, url: platformUrl });
  } catch (err) {
    errorMessage = err.message;
    res.status(500).json({ error: err.message || 'Failed to upload' });
  } finally {
    await logPost({ userId: req.userId, campaignId, platform: 'twitter', contentText: caption, postType: files.length ? 'image' : 'text', source: 'upload', status, platformPostId, platformUrl, errorMessage });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// FACEBOOK OAUTH
// ════════════════════════════════════════════════════════════════════════════════
router.get('/facebook/connect', auth, async (req, res) => {
  const state = Math.random().toString(36).slice(2) + Date.now();
  oauthStateStore.set(state, { userId: req.userId, platform: 'facebook' });
  setTimeout(() => oauthStateStore.delete(state), 10 * 60 * 1000);
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID,
    redirect_uri: `${BACKEND_URL}/api/social/facebook/callback`,
    scope: 'public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish',
    response_type: 'code', state,
  });
  res.json({ url: `https://www.facebook.com/v19.0/dialog/oauth?${params}` });
});

router.get('/facebook/callback', async (req, res) => {
  const { code, state, error: fbError } = req.query;
  if (fbError) return res.redirect(`${FRONTEND_URL}/dashboard?oauth=error&platform=facebook&reason=${fbError}`);
  const stored = oauthStateStore.get(state);
  if (!stored) return res.redirect(`${FRONTEND_URL}/dashboard?oauth=error&platform=facebook&reason=state_mismatch`);
  oauthStateStore.delete(state);
  try {
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(`${BACKEND_URL}/api/social/facebook/callback`)}&client_secret=${process.env.FACEBOOK_APP_SECRET}&code=${code}`);
    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error.message);
    const meRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name,picture&access_token=${tokenData.access_token}`);
    const meData = await meRes.json();
    await supabase.from('social_connections').upsert({
      user_id: stored.userId, platform: 'facebook',
      access_token: tokenData.access_token,
      token_expiry: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
      platform_user_id: meData.id, platform_name: meData.name,
      platform_avatar: meData.picture?.data?.url || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' });
    res.redirect(`${FRONTEND_URL}/dashboard?oauth=success&platform=facebook&username=${encodeURIComponent(meData.name)}`);
  } catch (err) {
    res.redirect(`${FRONTEND_URL}/dashboard?oauth=error&platform=facebook`);
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// TIKTOK OAUTH
// ════════════════════════════════════════════════════════════════════════════════
router.get('/tiktok/connect', auth, async (req, res) => {
  const state = Math.random().toString(36).slice(2) + Date.now();
  oauthStateStore.set(state, { userId: req.userId, platform: 'tiktok' });
  setTimeout(() => oauthStateStore.delete(state), 10 * 60 * 1000);
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY,
    scope: 'user.info.basic,video.publish',
    response_type: 'code',
    redirect_uri: `${BACKEND_URL}/api/social/tiktok/callback`,
    state,
  });
  res.json({ url: `https://www.tiktok.com/v2/auth/authorize?${params}` });
});

router.get('/tiktok/callback', async (req, res) => {
  const { code, state, error: ttError } = req.query;
  if (ttError) return res.redirect(`${FRONTEND_URL}/dashboard?oauth=error&platform=tiktok&reason=${ttError}`);
  const stored = oauthStateStore.get(state);
  if (!stored) return res.redirect(`${FRONTEND_URL}/dashboard?oauth=error&platform=tiktok&reason=state_mismatch`);
  oauthStateStore.delete(state);
  try {
    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_key: process.env.TIKTOK_CLIENT_KEY, client_secret: process.env.TIKTOK_CLIENT_SECRET, code, grant_type: 'authorization_code', redirect_uri: `${BACKEND_URL}/api/social/tiktok/callback` }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error_description);
    const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url', { headers: { Authorization: `Bearer ${tokenData.access_token}` } });
    const userData = await userRes.json();
    const user = userData.data?.user || {};
    await supabase.from('social_connections').upsert({
      user_id: stored.userId, platform: 'tiktok',
      access_token: tokenData.access_token, refresh_token: tokenData.refresh_token || null,
      token_expiry: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
      platform_user_id: user.open_id, platform_username: user.display_name,
      platform_name: user.display_name, platform_avatar: user.avatar_url || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' });
    res.redirect(`${FRONTEND_URL}/dashboard?oauth=success&platform=tiktok&username=${encodeURIComponent(user.display_name || 'user')}`);
  } catch (err) {
    res.redirect(`${FRONTEND_URL}/dashboard?oauth=error&platform=tiktok`);
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// ANALYTICS — user's own posts
// ════════════════════════════════════════════════════════════════════════════════
router.get('/posts', auth, async (req, res) => {
  const { platform, limit = 50, offset = 0 } = req.query;
  let query = supabase
    .from('social_posts')
    .select('*', { count: 'exact' })
    .eq('user_id', req.userId)
    .order('posted_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);
  if (platform && platform !== 'all') query = query.eq('platform', platform);
  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ posts: data || [], total: count || 0 });
});

router.get('/posts/stats', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('social_posts')
    .select('platform, status, post_type, posted_at')
    .eq('user_id', req.userId);
  if (error) return res.status(500).json({ error: error.message });
  const posts = data || [];
  const byPlatform = {};
  const byDay = {};
  posts.forEach(p => {
    byPlatform[p.platform] = (byPlatform[p.platform] || 0) + 1;
    const day = p.posted_at?.slice(0, 10);
    if (day) byDay[day] = (byDay[day] || 0) + 1;
  });
  res.json({
    total: posts.length,
    published: posts.filter(p => p.status === 'published').length,
    failed: posts.filter(p => p.status === 'failed').length,
    byPlatform,
    byDay: Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0])).slice(-30),
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// ADMIN — all users' posts
// ════════════════════════════════════════════════════════════════════════════════
router.get('/admin/posts', auth, requireAdmin, async (req, res) => {
  const { platform, limit = 100, offset = 0 } = req.query;
  let query = supabase
    .from('social_posts')
    .select('*, users(name, email)', { count: 'exact' })
    .order('posted_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);
  if (platform && platform !== 'all') query = query.eq('platform', platform);
  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ posts: data || [], total: count || 0 });
});

router.get('/admin/stats', auth, requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('social_posts')
    .select('platform, status, post_type, posted_at, user_id');
  if (error) return res.status(500).json({ error: error.message });
  const posts = data || [];
  const byPlatform = {};
  const byDay = {};
  const byUser = {};
  posts.forEach(p => {
    byPlatform[p.platform] = (byPlatform[p.platform] || 0) + 1;
    const day = p.posted_at?.slice(0, 10);
    if (day) byDay[day] = (byDay[day] || 0) + 1;
    byUser[p.user_id] = (byUser[p.user_id] || 0) + 1;
  });
  res.json({
    total: posts.length,
    published: posts.filter(p => p.status === 'published').length,
    failed: posts.filter(p => p.status === 'failed').length,
    uniqueUsers: Object.keys(byUser).length,
    byPlatform,
    byDay: Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0])).slice(-30),
    topUsers: Object.entries(byUser).sort((a, b) => b[1] - a[1]).slice(0, 10),
  });
});

export default router;