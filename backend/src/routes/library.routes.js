// backend/src/routes/library.routes.js
// ─────────────────────────────────────────────────────────────────────────────
// Library — user's personal vault of scripts and videos
// Gallery submissions — user flags content for public gallery
// Admin approves/rejects submissions
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
router.use(auth);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// ── GET /api/library ──────────────────────────────────────────────────────────
// Get all library items for current user
router.get('/', async (req, res) => {
  try {
    const { type } = req.query; // optional filter: 'script' | 'video'
    let query = supabase
      .from('library_items')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (type) query = query.eq('type', type);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ items: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/library ─────────────────────────────────────────────────────────
// Save a script or video to library
router.post('/', async (req, res) => {
  try {
    const { type, title, content, video_url, thumbnail_url, duration_sec, source, campaign_id, metadata } = req.body;

    if (!type || !title) return res.status(400).json({ error: 'type and title required' });
    if (!['script', 'video'].includes(type)) return res.status(400).json({ error: 'type must be script or video' });

    const { data, error } = await supabase
      .from('library_items')
      .insert({
        user_id:       req.userId,
        campaign_id:   campaign_id || null,
        type,
        title,
        content:       content || null,
        video_url:     video_url || null,
        thumbnail_url: thumbnail_url || null,
        duration_sec:  duration_sec || null,
        source:        source || 'manual',
        metadata:      metadata || {},
        created_at:    new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ item: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/library/:id ───────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('library_items')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/library/:id/submit ──────────────────────────────────────────────
// Submit a library item for gallery review
router.post('/:id/submit', async (req, res) => {
  try {
    const { description } = req.body;

    // Get the library item
    const { data: item, error: itemErr } = await supabase
      .from('library_items')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (itemErr || !item) return res.status(404).json({ error: 'Item not found' });

    // Check not already submitted
    const { data: existing } = await supabase
      .from('gallery_submissions')
      .select('id, status')
      .eq('library_item_id', req.params.id)
      .single();

    if (existing) {
      return res.status(400).json({
        error: `Already submitted — status: ${existing.status}`,
        status: existing.status,
      });
    }

    const { data, error } = await supabase
      .from('gallery_submissions')
      .insert({
        user_id:         req.userId,
        library_item_id: req.params.id,
        campaign_id:     item.campaign_id,
        title:           item.title,
        description:     description || null,
        video_url:       item.video_url,
        thumbnail_url:   item.thumbnail_url,
        content_type:    item.type,
        status:          'pending',
        submitted_at:    new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ submission: data, message: 'Submitted for review!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/library/submissions ──────────────────────────────────────────────
// Get user's own submissions
router.get('/submissions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('gallery_submissions')
      .select('*')
      .eq('user_id', req.userId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    res.json({ submissions: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN ONLY — gallery submission management
// ══════════════════════════════════════════════════════════════════════════════

// ── GET /api/library/admin/submissions ────────────────────────────────────────
router.get('/admin/submissions', auth, requireAdmin, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    let query = supabase
      .from('gallery_submissions')
      .select('*, users!gallery_submissions_user_id_fkey(email, name)')
      .order('submitted_at', { ascending: false });

    if (status !== 'all') query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ submissions: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/library/admin/submissions/:id ────────────────────────────────────
// Approve or reject a submission
router.put('/admin/submissions/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { action, note } = req.body; // action: 'approve' | 'reject'
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be approve or reject' });
    }

    const { data: sub, error: subErr } = await supabase
      .from('gallery_submissions')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (subErr || !sub) return res.status(404).json({ error: 'Submission not found' });

    const status = action === 'approve' ? 'approved' : 'rejected';

    const { data, error } = await supabase
      .from('gallery_submissions')
      .update({
        status,
        admin_note:  note || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: req.userId,
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // If approved — add to public gallery table
    if (action === 'approve' && sub.video_url) {
      await supabase.from('gallery').insert({
        user_id:      sub.user_id,
        campaign_id:  sub.campaign_id,
        title:        sub.title,
        description:  sub.description,
        video_url:    sub.video_url,
        content_type: sub.content_type,
        source:       'submission',
        created_at:   new Date().toISOString(),
      }).catch(() => {}); // Non-fatal if gallery table doesn't exist yet
    }

    console.log(`👑 Admin ${action}d submission ${req.params.id}`);
    res.json({ submission: data, message: `Submission ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;