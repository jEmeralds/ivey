// backend/src/routes/library.routes.js
// ─────────────────────────────────────────────────────────────────────────────
// Library — user's personal vault of videos
// Gallery toggle — user can request public display, admin approves
// Archive — raw assets from campaigns and brands
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

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'kenyanjohnson254@gmail.com';
const SENDGRID_KEY   = process.env.SENDGRID_API_KEY;
const FRONTEND_URL   = process.env.FRONTEND_URL   || 'https://ivey-steel.vercel.app';

// ── Email helper ──────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  if (!SENDGRID_KEY) return;
  try {
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${SENDGRID_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: 'noreply@ivey.app', name: 'IVey' },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });
  } catch (e) {
    console.warn('Email send failed:', e.message);
  }
};

// ── GET /api/library ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
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
        show_in_gallery: false,
        gallery_status:  'private',
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

// ── PUT /api/library/:id/gallery-toggle ───────────────────────────────────────
// User toggles public gallery visibility
// ON  → sets gallery_status to 'pending', notifies admin by email
// OFF → sets gallery_status to 'private' instantly (no approval needed)
router.put('/:id/gallery-toggle', async (req, res) => {
  try {
    const { show } = req.body; // true = request to show, false = hide

    const { data: item, error: itemErr } = await supabase
      .from('library_items')
      .select('*, users!library_items_user_id_fkey(name, email)')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (itemErr || !item) return res.status(404).json({ error: 'Item not found' });
    if (item.type !== 'video') return res.status(400).json({ error: 'Only videos can be shown in gallery' });

    if (!show) {
      // Turn OFF — instant, no approval needed
      const { data, error } = await supabase
        .from('library_items')
        .update({ show_in_gallery: false, gallery_status: 'private' })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;

      // Also remove from gallery_submissions if pending
      await supabase
        .from('gallery_submissions')
        .delete()
        .eq('library_item_id', req.params.id)
        .eq('status', 'pending');

      return res.json({ item: data, message: 'Removed from public gallery' });
    }

    // Turn ON — set to pending, notify admin
    if (item.gallery_status === 'pending') {
      return res.status(400).json({ error: 'Already pending admin approval' });
    }

    const { data, error } = await supabase
      .from('library_items')
      .update({ show_in_gallery: true, gallery_status: 'pending' })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Create gallery submission record
    await supabase.from('gallery_submissions').upsert({
      user_id:         req.userId,
      library_item_id: req.params.id,
      campaign_id:     item.campaign_id,
      title:           item.title,
      video_url:       item.video_url,
      thumbnail_url:   item.thumbnail_url,
      content_type:    'video',
      status:          'pending',
      submitted_at:    new Date().toISOString(),
    }, { onConflict: 'library_item_id' });

    // Email admin
    const userName  = item.users?.name  || 'A user';
    const userEmail = item.users?.email || '';
    await sendEmail({
      to:      ADMIN_EMAIL,
      subject: `🎬 IVey: New gallery submission — "${item.title}"`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px;">
          <h2 style="color: #10b981;">New Gallery Submission</h2>
          <p><strong>${userName}</strong> (${userEmail}) has requested to show their video in the public gallery.</p>
          <table style="width:100%; border-collapse:collapse; margin: 16px 0;">
            <tr><td style="padding:8px; color:#6b7280;">Title</td><td style="padding:8px; font-weight:bold;">${item.title}</td></tr>
            <tr style="background:#f9fafb;"><td style="padding:8px; color:#6b7280;">Video URL</td><td style="padding:8px;"><a href="${item.video_url}">${item.video_url}</a></td></tr>
          </table>
          <a href="${FRONTEND_URL}/dashboard?section=admin" style="display:inline-block; background:#10b981; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold;">
            Review in Admin Dashboard →
          </a>
          <p style="color:#9ca3af; font-size:12px; margin-top:24px;">IVey Admin Notifications</p>
        </div>
      `,
    });

    console.log(`📬 Gallery toggle request: ${item.title} by ${userEmail}`);
    res.json({ item: data, message: 'Submitted for admin approval — you will be notified.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/library/submissions ──────────────────────────────────────────────
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

// ── GET /api/library/admin/submissions ────────────────────────────────────────
router.get('/admin/submissions', requireAdmin, async (req, res) => {
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
// Admin approves or rejects a submission
router.put('/admin/submissions/:id', requireAdmin, async (req, res) => {
  try {
    const { action, note } = req.body;
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
      .update({ status, admin_note: note || null, reviewed_at: new Date().toISOString(), reviewed_by: req.userId })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Update library item gallery_status
    const galleryStatus = action === 'approve' ? 'approved' : 'rejected';
    const showInGallery = action === 'approve';

    await supabase
      .from('library_items')
      .update({ gallery_status: galleryStatus, show_in_gallery: showInGallery })
      .eq('id', sub.library_item_id);

    // If approved — add to public gallery_items table
    if (action === 'approve' && sub.video_url) {
      await supabase.from('gallery_items').upsert({
        user_id:    sub.user_id,
        campaign_id: sub.campaign_id,
        url:        sub.video_url,
        caption:    sub.title,
        brand_name: sub.title,
        platform:   'video',
        approved:   true,
        removed:    false,
      }, { onConflict: 'id' });
    }

    // Notify user by email
    const { data: user } = await supabase.from('users').select('email, name').eq('id', sub.user_id).single();
    if (user?.email) {
      await sendEmail({
        to:      user.email,
        subject: action === 'approve'
          ? `✅ Your video "${sub.title}" is now in the IVey public gallery!`
          : `❌ Your gallery submission "${sub.title}" was not approved`,
        html: action === 'approve'
          ? `<div style="font-family:sans-serif;"><h2 style="color:#10b981;">🎉 You're in the gallery!</h2><p>Hi ${user.name || 'there'},</p><p>Your video <strong>"${sub.title}"</strong> has been approved and is now visible in the IVey public gallery.</p><a href="${FRONTEND_URL}/gallery" style="display:inline-block;background:#10b981;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">View Gallery →</a></div>`
          : `<div style="font-family:sans-serif;"><h2 style="color:#ef4444;">Gallery Submission Update</h2><p>Hi ${user.name || 'there'},</p><p>Your video <strong>"${sub.title}"</strong> was not approved for the public gallery${note ? `: ${note}` : '.'}</p><p>You can edit your content and submit again from your Library.</p></div>`,
      });
    }

    console.log(`👑 Admin ${action}d submission ${req.params.id}`);
    res.json({ submission: data, message: `Submission ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/library/archive ──────────────────────────────────────────────────
router.get('/archive', async (req, res) => {
  try {
    const { source, type } = req.query;
    let query = supabase
      .from('archive_items')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (source) query = query.eq('source', source);
    if (type)   query = query.eq('type', type);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ items: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/library/archive ─────────────────────────────────────────────────
router.post('/archive', async (req, res) => {
  try {
    const { name, url, type, size_bytes, source, source_id } = req.body;
    if (!name || !url || !type) return res.status(400).json({ error: 'name, url and type required' });

    const { data, error } = await supabase
      .from('archive_items')
      .insert({
        user_id:    req.userId,
        name,
        url,
        type:       type || 'image',
        size_bytes: size_bytes || null,
        source:     source || 'upload',
        source_id:  source_id || null,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ item: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/library/archive/:id ──────────────────────────────────────────
router.delete('/archive/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('archive_items')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/library/:id/submit (legacy) ─────────────────────────────────────
router.post('/:id/submit', async (req, res) => {
  // Redirect to new toggle endpoint
  req.body.show = true;
  req.params.id = req.params.id;
  return res.redirect(307, `/api/library/${req.params.id}/gallery-toggle`);
});

export default router;