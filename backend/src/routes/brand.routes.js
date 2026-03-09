// backend/src/routes/brand.routes.js

import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// ── GET /api/brand ─────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  const userId = req.userId;

  const { data, error } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    return res.status(500).json({ error: error.message });
  }

  res.json({ brand: data || null });
});

// ── POST /api/brand ────────────────────────────────────────────────────────────
// Upsert — creates or updates brand profile
router.post('/', auth, async (req, res) => {
  const userId = req.userId;
  const { brand_name, tagline, industry, brand_colors, target_personas } = req.body;

  const { data, error } = await supabase
    .from('brand_profiles')
    .upsert({
      user_id: userId,
      brand_name: brand_name?.trim() || null,
      tagline: tagline?.trim() || null,
      industry: industry?.trim() || null,
      brand_colors: brand_colors || [],
      target_personas: target_personas?.trim() || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json({ brand: data, message: 'Brand profile saved.' });
});

export default router;