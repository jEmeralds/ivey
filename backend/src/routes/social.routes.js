// backend/src/routes/social.routes.js
// Social OAuth — Twitter/X (fully functional), Meta + TikTok (connect flow)
// npm install twitter-api-v2 (in backend)

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { auth } from '../middleware/auth.middleware.js';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://ivey-steel.vercel.app';
const BACKEND_URL  = process.env.BACKEND_URL  || 'https://ivey-production.up.railway.app';

// ── In-memory store for OAuth state (use Redis in prod) ───────────────────────
const oauthStateStore = new Map(); // state -> { userId, platform, codeVerifier? }

// ── GET /api/social/connections — list user's connections ─────────────────────
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
// TWITTER / X  (OAuth 2.0 PKCE — fully functional)
// ════════════════════════════════════════════════════════════════════════════════

// GET /api/social/twitter/connect
router.get('/twitter/connect', auth, async (req, res) => {
  try {
    const { TwitterApi } = await import('twitter-api-v2');
    const client = new TwitterApi({
      clientId:     process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    });
    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
      `${BACKEND_URL}/api/social/twitter/callback`,
      { scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] }
    );
    oauthStateStore.set(state, { userId: req.userId, codeVerifier, platform: 'twitter' });
    setTimeout(() => oauthStateStore.delete(state), 10 * 60 * 1000); // 10min TTL
    res.json({ url });
  } catch (err) {
    console.error('Twitter connect error:', err);
    res.status(500).json({ error: 'Failed to initiate Twitter OAuth' });
  }
});

// GET /api/social/twitter/callback
router.get('/twitter/callback', async (req, res) => {
  const { state, code } = req.query;
  const stored = oauthStateStore.get(state);
  if (!stored) return res.redirect(`${FRONTEND_URL}/dashboard?oauth=error&platform=twitter&reason=state_mismatch`);
  oauthStateStore.delete(state);
  try {
    const { TwitterApi } = await import('twitter-api-v2');
    const client = new TwitterApi({
      clientId:     process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    });
    const { accessToken, refreshToken, expiresIn, client: authedClient } = await client.loginWithOAuth2({
      code,
      codeVerifier: stored.codeVerifier,
      redirectUri: `${BACKEND_URL}/api/social/twitter/callback`,
    });
    const { data: me } = await authedClient.v2.me({ 'user.fields': ['profile_image_url', 'name', 'username'] });
    const expiry = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;
    await supabase.from('social_connections').upsert({
      user_id: stored.userId,
      platform: 'twitter',
      access_token: accessToken,
      refresh_token: refreshToken || null,
      token_expiry: expiry,
      platform_user_id: me.id,
      platform_username: me.username,
      platform_name: me.name,
      platform_avatar: me.profile_image_url || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' });
    res.redirect(`${FRONTEND_URL}/dashboard?oauth=success&platform=twitter&username=${me.username}`);
  } catch (err) {
    console.error('Twitter callback error:', err);
    res.redirect(`${FRONTEND_URL}/dashboard?oauth=error&platform=twitter`);
  }
});

// POST /api/social/twitter/post — post a tweet
router.post('/twitter/post', auth, async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'text is required' });
  const { data: conn, error } = await supabase
    .from('social_connections')
    .select('access_token, refresh_token, token_expiry')
    .eq('user_id', req.userId)
    .eq('platform', 'twitter')
    .single();
  if (error || !conn) return res.status(404).json({ error: 'Twitter not connected' });
  try {
    const { TwitterApi } = await import('twitter-api-v2');
    let client = new TwitterApi(conn.access_token);
    // Refresh token if expired
    if (conn.token_expiry && new Date(conn.token_expiry) < new Date() && conn.refresh_token) {
      const baseClient = new TwitterApi({ clientId: process.env.TWITTER_CLIENT_ID, clientSecret: process.env.TWITTER_CLIENT_SECRET });
      const { accessToken, refreshToken, expiresIn } = await baseClient.refreshOAuth2Token(conn.refresh_token);
      await supabase.from('social_connections').update({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expiry: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      }).eq('user_id', req.userId).eq('platform', 'twitter');
      client = new TwitterApi(accessToken);
    }
    const tweet = await client.v2.tweet(text.slice(0, 280));
    res.json({ success: true, tweet_id: tweet.data.id, url: `https://twitter.com/i/web/status/${tweet.data.id}` });
  } catch (err) {
    console.error('Twitter post error:', err);
    res.status(500).json({ error: err.message || 'Failed to post tweet' });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// FACEBOOK / INSTAGRAM (Meta OAuth 2.0)
// ════════════════════════════════════════════════════════════════════════════════

router.get('/facebook/connect', auth, async (req, res) => {
  const state = Math.random().toString(36).slice(2) + Date.now();
  oauthStateStore.set(state, { userId: req.userId, platform: 'facebook' });
  setTimeout(() => oauthStateStore.delete(state), 10 * 60 * 1000);
  const params = new URLSearchParams({
    client_id:     process.env.FACEBOOK_APP_ID,
    redirect_uri:  `${BACKEND_URL}/api/social/facebook/callback`,
    scope:         'public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish',
    response_type: 'code',
    state,
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
    // Exchange code for token
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(`${BACKEND_URL}/api/social/facebook/callback`)}&client_secret=${process.env.FACEBOOK_APP_SECRET}&code=${code}`);
    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error.message);
    // Get user info
    const meRes  = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name,picture&access_token=${tokenData.access_token}`);
    const meData = await meRes.json();
    await supabase.from('social_connections').upsert({
      user_id: stored.userId,
      platform: 'facebook',
      access_token: tokenData.access_token,
      token_expiry: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
      platform_user_id: meData.id,
      platform_name: meData.name,
      platform_avatar: meData.picture?.data?.url || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' });
    res.redirect(`${FRONTEND_URL}/dashboard?oauth=success&platform=facebook&username=${encodeURIComponent(meData.name)}`);
  } catch (err) {
    console.error('Facebook callback error:', err);
    res.redirect(`${FRONTEND_URL}/dashboard?oauth=error&platform=facebook`);
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// TIKTOK (OAuth 2.0)
// ════════════════════════════════════════════════════════════════════════════════

router.get('/tiktok/connect', auth, async (req, res) => {
  const state = Math.random().toString(36).slice(2) + Date.now();
  oauthStateStore.set(state, { userId: req.userId, platform: 'tiktok' });
  setTimeout(() => oauthStateStore.delete(state), 10 * 60 * 1000);
  const params = new URLSearchParams({
    client_key:    process.env.TIKTOK_CLIENT_KEY,
    scope:         'user.info.basic,video.publish',
    response_type: 'code',
    redirect_uri:  `${BACKEND_URL}/api/social/tiktok/callback`,
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
      body: new URLSearchParams({
        client_key:    process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code,
        grant_type:    'authorization_code',
        redirect_uri:  `${BACKEND_URL}/api/social/tiktok/callback`,
      }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error_description);
    // Get user info
    const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userData = await userRes.json();
    const user = userData.data?.user || {};
    await supabase.from('social_connections').upsert({
      user_id: stored.userId,
      platform: 'tiktok',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_expiry: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
      platform_user_id: user.open_id,
      platform_username: user.display_name,
      platform_name: user.display_name,
      platform_avatar: user.avatar_url || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' });
    res.redirect(`${FRONTEND_URL}/dashboard?oauth=success&platform=tiktok&username=${encodeURIComponent(user.display_name || 'user')}`);
  } catch (err) {
    console.error('TikTok callback error:', err);
    res.redirect(`${FRONTEND_URL}/dashboard?oauth=error&platform=tiktok`);
  }
});

export default router;