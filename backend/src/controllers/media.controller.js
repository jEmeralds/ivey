import { supabaseAdmin } from '../config/supabase.js';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { uploadSecurity } from '../config/security.config.js';

// Configure multer with security settings
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  ...uploadSecurity
});

// Upload media file
export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { campaignId } = req.body;
    if (!campaignId) {
      return res.status(400).json({ error: 'Campaign ID is required' });
    }

    const file = req.file;
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${campaignId}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('campaign-media')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload file to storage' });
    }

    // Save metadata to database
    const { data: mediaData, error: dbError } = await supabaseAdmin
      .from('campaign_media')
      .insert([
        {
          campaign_id: campaignId,
          file_name: file.originalname,
          file_path: filePath,
          file_type: file.mimetype,
          file_size: file.size
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // Try to delete the uploaded file
      await supabaseAdmin.storage.from('campaign-media').remove([filePath]);
      return res.status(500).json({ error: 'Failed to save file metadata' });
    }

    res.status(201).json({
      message: 'File uploaded successfully',
      media: mediaData
    });
  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

// Get all media for a campaign
export const getCampaignMedia = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const { data: media, error } = await supabaseAdmin
      .from('campaign_media')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Get campaign media error:', error);
      return res.status(500).json({ error: 'Failed to fetch media' });
    }

    res.json({ media: media || [] });
  } catch (error) {
    console.error('Get campaign media error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete media file
export const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;

    // Get media metadata
    const { data: media, error: fetchError } = await supabaseAdmin
      .from('campaign_media')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('campaign-media')
      .remove([media.file_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabaseAdmin
      .from('campaign_media')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('Database delete error:', dbError);
      return res.status(500).json({ error: 'Failed to delete media' });
    }

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};