// backend/src/routes/brand.routes.js
// Multi-brand version — full CRUD

import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// ── GET /api/brand ─────────────────────────────────────────────────────────────
// Returns ALL brands for the user
router.get('/', auth, async (req, res) => {
  const userId = req.userId;

  const { data, error } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  res.json({ brands: data || [] });
});

// ── GET /api/brand/default ─────────────────────────────────────────────────────
// Returns the default brand (used by AI injection)
router.get('/default', auth, async (req, res) => {
  const userId = req.userId;

  const { data, error } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    return res.status(500).json({ error: error.message });
  }

  res.json({ brand: data || null });
});

// ── POST /api/brand ────────────────────────────────────────────────────────────
// Create a new brand profile
router.post('/', auth, async (req, res) => {
  const userId = req.userId;
  const { brand_name, tagline, industry, brand_colors, target_personas } = req.body;

  if (!brand_name?.trim()) {
    return res.status(400).json({ error: 'Brand name is required' });
  }

  // Check how many brands user already has
  const { count } = await supabase
    .from('brand_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // First brand is always default
  const isFirst = (count || 0) === 0;

  const { data, error } = await supabase
    .from('brand_profiles')
    .insert({
      user_id:         userId,
      brand_name:      brand_name.trim(),
      tagline:         tagline?.trim() || null,
      industry:        industry?.trim() || null,
      brand_colors:    brand_colors || [],
      target_personas: target_personas?.trim() || null,
      is_default:      isFirst,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json({ brand: data, message: 'Brand created.' });
});

// ── PUT /api/brand/:id ─────────────────────────────────────────────────────────
// Update an existing brand profile
router.put('/:id', auth, async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { brand_name, tagline, industry, brand_colors, target_personas } = req.body;

  if (!brand_name?.trim()) {
    return res.status(400).json({ error: 'Brand name is required' });
  }

  const { data, error } = await supabase
    .from('brand_profiles')
    .update({
      brand_name:      brand_name.trim(),
      tagline:         tagline?.trim() || null,
      industry:        industry?.trim() || null,
      brand_colors:    brand_colors || [],
      target_personas: target_personas?.trim() || null,
      updated_at:      new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)  // ownership check
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json({ brand: data, message: 'Brand updated.' });
});

// ── DELETE /api/brand/:id ──────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  // Don't allow deleting the only brand
  const { count } = await supabase
    .from('brand_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if ((count || 0) <= 1) {
    return res.status(400).json({ error: 'Cannot delete your only brand profile.' });
  }

  // Check if this is the default brand
  const { data: target } = await supabase
    .from('brand_profiles')
    .select('is_default')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  const { error } = await supabase
    .from('brand_profiles')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) return res.status(500).json({ error: error.message });

  // If deleted brand was the default, promote the oldest remaining brand
  if (target?.is_default) {
    const { data: remaining } = await supabase
      .from('brand_profiles')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1);

    if (remaining?.[0]) {
      await supabase
        .from('brand_profiles')
        .update({ is_default: true })
        .eq('id', remaining[0].id);
    }
  }

  res.json({ message: 'Brand deleted.' });
});

// ── PATCH /api/brand/:id/set-default ──────────────────────────────────────────
// Sets one brand as default, clears default on all others
router.patch('/:id/set-default', auth, async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  // Clear all defaults for this user
  await supabase
    .from('brand_profiles')
    .update({ is_default: false })
    .eq('user_id', userId);

  // Set the new default
  const { data, error } = await supabase
    .from('brand_profiles')
    .update({ is_default: true })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json({ brand: data, message: 'Default brand updated.' });
});

export default router;