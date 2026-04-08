import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();
router.use(auth);

// ── GET /api/brand ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('brand_profiles')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ brands: data || [] });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ── GET /api/brand/default ────────────────────────────────────────────────────
router.get('/default', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('brand_profiles').select('*')
      .eq('user_id', req.userId).eq('is_default', true).single();
    if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
    if (!data) {
      const { data: first } = await supabaseAdmin
        .from('brand_profiles').select('*').eq('user_id', req.userId)
        .order('created_at', { ascending: true }).limit(1).single();
      return res.json({ brand: first || null });
    }
    res.json({ brand: data });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ── GET /api/brand/:id ────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('brand_profiles')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();
    if (error) return res.status(404).json({ error: 'Brand not found' });
    res.json({ brand: data });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ── POST /api/brand/analyze-url ───────────────────────────────────────────────
router.post('/analyze-url', async (req, res) => {
  try {
    const { url, ai_provider } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    let parsed;
    try { parsed = new URL(url); }
    catch { return res.status(400).json({ error: 'Invalid URL' }); }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'URL must be http or https' });
    }
    const { analyzeBrandUrlAI } = await import('../services/ai.service.js');
    const intelligence = await analyzeBrandUrlAI(url, ai_provider || 'claude');
    res.json({ intelligence });
  } catch (e) {
    console.error('Brand URL analysis error:', e);
    res.status(500).json({ error: e.message || 'Failed to analyze URL' });
  }
});

// ── POST /api/brand ───────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const userId = req.userId;
    const {
      brand_name, tagline, industry, brand_story,
      brand_colors, photography_style, visual_mood,
      brand_voice, words_always, words_never,
      target_personas, pain_points, audience_desires,
      default_video_length, preferred_platforms, is_default,
      logo_url, visual_identity, script_visual_notes,
    } = req.body;

    if (!brand_name?.trim()) return res.status(400).json({ error: 'Brand name is required' });
    if (is_default) {
      await supabaseAdmin.from('brand_profiles')
        .update({ is_default: false }).eq('user_id', userId);
    }

    const { data, error } = await supabaseAdmin
      .from('brand_profiles')
      .insert([{
        user_id:              userId,
        brand_name:           brand_name.trim(),
        tagline:              tagline?.trim()         || null,
        industry:             industry                || null,
        brand_story:          brand_story?.trim()     || null,
        brand_colors:         brand_colors            || [],
        photography_style:    photography_style       || null,
        visual_mood:          visual_mood             || [],
        brand_voice:          brand_voice             || null,
        words_always:         words_always            || [],
        words_never:          words_never             || [],
        target_personas:      target_personas?.trim() || null,
        pain_points:          pain_points?.trim()     || null,
        audience_desires:     audience_desires?.trim()|| null,
        default_video_length: default_video_length    ?? 45,
        preferred_platforms:  preferred_platforms     || [],
        is_default:           is_default              ?? false,
        logo_url:             logo_url                || null,
        visual_identity:      visual_identity         || null,
        script_visual_notes:  script_visual_notes     || null,
        updated_at:           new Date().toISOString(),
      }])
      .select().single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ brand: data, message: 'Brand profile created' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ── PUT /api/brand/:id ────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const {
      brand_name, tagline, industry, brand_story,
      brand_colors, photography_style, visual_mood,
      brand_voice, words_always, words_never,
      target_personas, pain_points, audience_desires,
      default_video_length, preferred_platforms, is_default,
      logo_url, visual_identity, script_visual_notes,
    } = req.body;

    if (!brand_name?.trim()) return res.status(400).json({ error: 'Brand name is required' });

    const { data: existing } = await supabaseAdmin
      .from('brand_profiles').select('id').eq('id', id).eq('user_id', userId).single();
    if (!existing) return res.status(404).json({ error: 'Brand not found' });

    if (is_default) {
      await supabaseAdmin.from('brand_profiles')
        .update({ is_default: false }).eq('user_id', userId).neq('id', id);
    }

    const { data, error } = await supabaseAdmin
      .from('brand_profiles')
      .update({
        brand_name:           brand_name.trim(),
        tagline:              tagline?.trim()         || null,
        industry:             industry                || null,
        brand_story:          brand_story?.trim()     || null,
        brand_colors:         brand_colors            || [],
        photography_style:    photography_style       || null,
        visual_mood:          visual_mood             || [],
        brand_voice:          brand_voice             || null,
        words_always:         words_always            || [],
        words_never:          words_never             || [],
        target_personas:      target_personas?.trim() || null,
        pain_points:          pain_points?.trim()     || null,
        audience_desires:     audience_desires?.trim()|| null,
        default_video_length: default_video_length    ?? 45,
        preferred_platforms:  preferred_platforms     || [],
        is_default:           is_default              ?? false,
        logo_url:             logo_url                || null,
        visual_identity:      visual_identity         || null,
        script_visual_notes:  script_visual_notes     || null,
        updated_at:           new Date().toISOString(),
      })
      .eq('id', id).eq('user_id', userId)
      .select().single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ brand: data, message: 'Brand profile updated' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ── DELETE /api/brand/:id ─────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('brand_profiles').delete().eq('id', id).eq('user_id', req.userId);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Brand profile deleted' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

export default router;