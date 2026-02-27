import { supabaseAdmin } from '../config/supabase.js';
import crypto from 'crypto';

// Save content (strategy section or generated content piece)
export const saveContent = async (req, res) => {
  try {
    const userId = req.userId;
    const { campaign_id, title, content, content_type, format } = req.body;

    if (!title || !content || !content_type) {
      return res.status(400).json({ error: 'title, content, and content_type are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('saved_content')
      .insert([{
        user_id: userId,
        campaign_id: campaign_id || null,
        title,
        content,
        content_type,
        format: format || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Save content error:', error);
      return res.status(500).json({ error: 'Failed to save content' });
    }

    res.status(201).json({
      message: 'Content saved successfully',
      saved: data
    });
  } catch (error) {
    console.error('Save content error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all saved content for a user
export const getSavedContent = async (req, res) => {
  try {
    const userId = req.userId;
    const { campaign_id, content_type } = req.query;

    let query = supabaseAdmin
      .from('saved_content')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (campaign_id) query = query.eq('campaign_id', campaign_id);
    if (content_type) query = query.eq('content_type', content_type);

    const { data, error } = await query;

    if (error) {
      console.error('Get saved content error:', error);
      return res.status(500).json({ error: 'Failed to fetch saved content' });
    }

    res.json({ saved_content: data || [] });
  } catch (error) {
    console.error('Get saved content error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete saved content
export const deleteSavedContent = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('saved_content')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Delete saved content error:', error);
      return res.status(500).json({ error: 'Failed to delete saved content' });
    }

    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Delete saved content error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create a public share link
export const createShareLink = async (req, res) => {
  try {
    const userId = req.userId;
    const { saved_content_id, title, content, expires_in_days } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'title and content are required' });
    }

    const shareToken = crypto.randomBytes(16).toString('hex');

    let expiresAt = null;
    if (expires_in_days) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + expires_in_days);
      expiresAt = expiry.toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('shared_links')
      .insert([{
        user_id: userId,
        saved_content_id: saved_content_id || null,
        share_token: shareToken,
        title,
        content,
        is_active: true,
        expires_at: expiresAt
      }])
      .select()
      .single();

    if (error) {
      console.error('Create share link error:', error);
      return res.status(500).json({ error: 'Failed to create share link' });
    }

    const shareUrl = `${process.env.FRONTEND_URL || 'https://ivey-steel.vercel.app'}/shared/${shareToken}`;

    res.status(201).json({
      message: 'Share link created successfully',
      share_token: shareToken,
      share_url: shareUrl,
      shared: data
    });
  } catch (error) {
    console.error('Create share link error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all share links for a user
export const getShareLinks = async (req, res) => {
  try {
    const userId = req.userId;

    const { data, error } = await supabaseAdmin
      .from('shared_links')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get share links error:', error);
      return res.status(500).json({ error: 'Failed to fetch share links' });
    }

    res.json({ share_links: data || [] });
  } catch (error) {
    console.error('Get share links error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Deactivate a share link
export const deactivateShareLink = async (req, res) => {
  try {
    const userId = req.userId;
    const { token } = req.params;

    const { error } = await supabaseAdmin
      .from('shared_links')
      .update({ is_active: false })
      .eq('share_token', token)
      .eq('user_id', userId);

    if (error) {
      console.error('Deactivate share link error:', error);
      return res.status(500).json({ error: 'Failed to deactivate share link' });
    }

    res.json({ message: 'Share link deactivated successfully' });
  } catch (error) {
    console.error('Deactivate share link error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// PUBLIC - Get shared content by token (no auth required)
export const getSharedContent = async (req, res) => {
  try {
    const { token } = req.params;

    const { data, error } = await supabaseAdmin
      .from('shared_links')
      .select('*')
      .eq('share_token', token)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Shared content not found or link is inactive' });
    }

    // Check if link has expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return res.status(410).json({ error: 'This share link has expired' });
    }

    res.json({
      title: data.title,
      content: data.content,
      created_at: data.created_at,
      expires_at: data.expires_at
    });
  } catch (error) {
    console.error('Get shared content error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};