import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();
router.use(auth);

// ── GET /api/brand — get all brands for user ──────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('brand_profiles')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ brands: data || [] });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/brand/default — get default brand ────────────────────────────────
router.get('/default', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('brand_profiles')
      .select('*')
      .eq('user_id', req.userId)
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });

    // Fallback: return first brand if no default
    if (!data) {
      const { data: first } = await supabaseAdmin
        .from('brand_profiles')
        .select('*')
        .eq('user_id', req.userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
      return res.json({ brand: first || null });
    }

    res.json({ brand: data });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/brand — create new brand ───────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const userId = req.userId;
    const {
      brand_name, tagline, industry, brand_story,
      brand_colors, photography_style, visual_mood,
      brand_voice, words_always, words_never,
      target_personas, pain_points, audience_desires,
      default_video_length, preferred_platforms, is_default,
    } = req.body;

    if (!brand_name?.trim()) return res.status(400).json({ error: 'Brand name is required' });

    // If this is set as default, unset all others
    if (is_default) {
      await supabaseAdmin
        .from('brand_profiles')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data, error } = await supabaseAdmin
      .from('brand_profiles')
      .insert([{
        user_id:              userId,
        brand_name:           brand_name.trim(),
        tagline:              tagline?.trim()        || null,
        industry:             industry               || null,
        brand_story:          brand_story?.trim()    || null,
        brand_colors:         brand_colors           || [],
        photography_style:    photography_style      || null,
        visual_mood:          visual_mood            || [],
        brand_voice:          brand_voice            || null,
        words_always:         words_always           || [],
        words_never:          words_never            || [],
        target_personas:      target_personas?.trim()|| null,
        pain_points:          pain_points?.trim()    || null,
        audience_desires:     audience_desires?.trim()|| null,
        default_video_length: default_video_length   ?? 60,
        preferred_platforms:  preferred_platforms    || [],
        is_default:           is_default             ?? false,
        updated_at:           new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ brand: data, message: 'Brand profile created' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /api/brand/:id — update brand ────────────────────────────────────────
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
    } = req.body;

    if (!brand_name?.trim()) return res.status(400).json({ error: 'Brand name is required' });

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('brand_profiles').select('id').eq('id', id).eq('user_id', userId).single();
    if (!existing) return res.status(404).json({ error: 'Brand not found' });

    // If setting as default, unset others
    if (is_default) {
      await supabaseAdmin
        .from('brand_profiles')
        .update({ is_default: false })
        .eq('user_id', userId)
        .neq('id', id);
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
        default_video_length: default_video_length    ?? 60,
        preferred_platforms:  preferred_platforms     || [],
        is_default:           is_default              ?? false,
        updated_at:           new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ brand: data, message: 'Brand profile updated' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE /api/brand/:id — delete brand ─────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('brand_profiles')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Brand profile deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;