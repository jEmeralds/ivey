import { supabaseAdmin } from '../config/supabase.js';

// ── Helper: fetch brand profile for a campaign ────────────────────────────────
const getBrandForCampaign = async (campaign, userId) => {
  if (campaign.brand_profile_id) {
    const { data } = await supabaseAdmin
      .from('brand_profiles')
      .select('*')
      .eq('id', campaign.brand_profile_id)
      .eq('user_id', userId)
      .single();
    if (data) return data;
  }
  const { data } = await supabaseAdmin
    .from('brand_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single();
  return data || null;
};

// Get all campaigns
export const getCampaigns = async (req, res) => {
  try {
    const userId = req.userId;
    const { data: campaigns, error } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Failed to fetch campaigns' });

    res.json({ campaigns: (campaigns || []).map(c => ({
      id:              c.id,
      name:            c.name || '',
      description:     typeof c.product_description === 'string' ? c.product_description : String(c.product_description || ''),
      target_audience: c.target_audience || '',
      ai_provider:     c.ai_provider || 'openai',
      output_formats:  Array.isArray(c.output_formats) ? c.output_formats : [],
      status:          c.status || '',
      created_at:      c.created_at,
      updated_at:      c.updated_at,
      brand_profile_id: c.brand_profile_id || null,
    }))});
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single campaign
export const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .select(`*, generated_ideas (*)`)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) return res.status(404).json({ error: 'Campaign not found' });

    res.json({ campaign: {
      id:               campaign.id,
      name:             campaign.name,
      description:      campaign.product_description,
      target_audience:  campaign.target_audience,
      ai_provider:      campaign.ai_provider,
      output_formats:   campaign.output_formats,
      status:           campaign.status,
      created_at:       campaign.created_at,
      updated_at:       campaign.updated_at,
      brand_profile_id: campaign.brand_profile_id || null,
      generated_content: campaign.generated_ideas || [],
    }});
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Create campaign
export const createCampaign = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, description, targetAudience, aiProvider, outputFormats, brandName, websiteUrl, brandProfileId } = req.body;

    if (!name || !description || !targetAudience || !outputFormats || outputFormats.length === 0) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    let resolvedBrandName = brandName || name;
    if (brandProfileId) {
      const { data: bp } = await supabaseAdmin.from('brand_profiles').select('brand_name').eq('id', brandProfileId).eq('user_id', userId).single();
      if (bp?.brand_name) resolvedBrandName = bp.brand_name;
    }

    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .insert([{
        user_id:             userId,
        name,
        brand_name:          resolvedBrandName,
        website_url:         websiteUrl || null,
        product_description: description,
        target_audience:     targetAudience,
        ai_provider:         aiProvider || 'openai',
        output_formats:      outputFormats,
        brand_profile_id:    brandProfileId || null,
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: 'Failed to create campaign' });
    res.status(201).json({ message: 'Campaign created successfully', campaign });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Update campaign
export const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { name, description, targetAudience, aiProvider, outputFormats } = req.body;

    const updateData = { updated_at: new Date().toISOString() };
    if (name)          updateData.name                = name;
    if (description)   updateData.product_description = description;
    if (targetAudience) updateData.target_audience    = targetAudience;
    if (aiProvider)    updateData.ai_provider         = aiProvider;
    if (outputFormats) updateData.output_formats      = outputFormats;

    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns').update(updateData).eq('id', id).eq('user_id', userId).select().single();

    if (error) return res.status(500).json({ error: 'Failed to update campaign' });
    res.json({ message: 'Campaign updated successfully', campaign: {
      id: campaign.id, name: campaign.name, description: campaign.product_description,
      target_audience: campaign.target_audience, ai_provider: campaign.ai_provider,
      output_formats: campaign.output_formats, status: campaign.status,
      created_at: campaign.created_at, updated_at: campaign.updated_at,
    }});
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete campaign
export const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('campaigns').delete().eq('id', id).eq('user_id', req.userId);
    if (error) return res.status(500).json({ error: 'Failed to delete campaign' });
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ── Generate images (main generation endpoint) ────────────────────────────────
export const generateIdeas = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns').select('*').eq('id', id).eq('user_id', userId).single();

    if (campaignError || !campaign) return res.status(404).json({ error: 'Campaign not found' });

    const brand = await getBrandForCampaign(campaign, userId);
    if (brand) console.log(`🎨 Brand: ${brand.brand_name}`);
    else       console.log('⚠️  No brand profile — generating without brand context');

    // Get any uploaded media to use as reference
    const { data: media } = await supabaseAdmin
      .from('campaign_media').select('*').eq('campaign_id', id);

    const referenceImageUrl = media
      ?.find(m => m.file_type?.startsWith('image/'))
      ? `${process.env.SUPABASE_URL}/storage/v1/object/public/campaign-media/${media.find(m => m.file_type?.startsWith('image/')).file_path}`
      : null;

    const { generateImagesAI } = await import('../services/ai.service.js');

    const generatedContent = await generateImagesAI({
      name:                campaign.name,
      product_description: campaign.product_description,
      target_audience:     campaign.target_audience,
      output_formats:      campaign.output_formats,
      ai_provider:         campaign.ai_provider || 'openai',
      brand,
    }, referenceImageUrl);

    res.json({ message: 'Images generated successfully', generatedContent });
  } catch (error) {
    console.error('Generate images error:', error);
    if (error.message?.includes('API key not configured')) {
      return res.status(503).json({ error: 'OpenAI API key required for image generation.' });
    }
    if (error.message?.includes('billing') || error.message?.includes('quota')) {
      return res.status(402).json({ error: 'OpenAI billing limit reached.' });
    }
    if (error.message?.includes('content_policy') || error.message?.includes('safety')) {
      return res.status(422).json({ error: 'Image blocked by content policy. Try rephrasing your description.' });
    }
    res.status(500).json({ error: error.message || 'Failed to generate images' });
  }
};

// ── Generate marketing strategy ───────────────────────────────────────────────
export const generateMarketingStrategy = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns').select('*').eq('id', id).eq('user_id', userId).single();

    if (campaignError || !campaign) return res.status(404).json({ error: 'Campaign not found' });

    const brand = await getBrandForCampaign(campaign, userId);
    const { generateMarketingStrategyAI } = await import('../services/ai.service.js');

    const strategy = await generateMarketingStrategyAI({
      name:                campaign.name,
      product_description: campaign.product_description,
      target_audience:     campaign.target_audience,
      output_formats:      campaign.output_formats,
      ai_provider:         campaign.ai_provider || 'gemini',
      brand,
    });

    res.json({ message: 'Strategy generated successfully', strategy });
  } catch (error) {
    console.error('Generate strategy error:', error);
    if (error.message?.includes('API key not configured')) {
      return res.status(503).json({ error: 'AI service not configured.' });
    }
    res.status(500).json({ error: error.message || 'Failed to generate strategy' });
  }
};

// ── Generate caption at share time ───────────────────────────────────────────
// POST /api/campaigns/:id/caption
// Body: { format, platform, ai_provider }
export const generateCaption = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { format, platform, ai_provider } = req.body;

    if (!format || !platform) return res.status(400).json({ error: 'format and platform are required' });

    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns').select('*').eq('id', id).eq('user_id', userId).single();

    if (campaignError || !campaign) return res.status(404).json({ error: 'Campaign not found' });

    const brand = await getBrandForCampaign(campaign, userId);
    const { generateCaptionAI } = await import('../services/ai.service.js');

    const caption = await generateCaptionAI({
      campaignName:       campaign.name,
      productDescription: campaign.product_description,
      targetAudience:     campaign.target_audience,
      format,
      platform,
      brand,
      ai_provider:        ai_provider || campaign.ai_provider || 'gemini',
    });

    res.json({ caption });
  } catch (error) {
    console.error('Generate caption error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate caption' });
  }
};

// ── Generate visual (single image, legacy endpoint) ───────────────────────────
export const generateVisual = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { format, adCopy, referenceMediaId, isThumbnail } = req.body;

    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns').select('*').eq('id', id).eq('user_id', userId).single();

    if (campaignError || !campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (!format) return res.status(400).json({ error: 'Format is required' });

    let referenceImageUrl = null;
    if (referenceMediaId) {
      const { data: mediaItem } = await supabaseAdmin
        .from('campaign_media').select('file_path, file_type').eq('id', referenceMediaId).single();
      if (mediaItem?.file_type?.startsWith('image/')) {
        referenceImageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/campaign-media/${mediaItem.file_path}`;
      }
    }

    const { generateVisualAI } = await import('../services/ai.service.js');

    const result = await generateVisualAI({
      campaignName:       campaign.name,
      productDescription: campaign.product_description,
      targetAudience:     campaign.target_audience,
      format,
      adCopy:             adCopy || '',
      referenceImageUrl,
      isThumbnail:        isThumbnail || false,
    });

    res.json({
      message:       'Visual generated successfully',
      imageUrl:      result.imageUrl,
      revisedPrompt: result.revisedPrompt,
      usedReference: result.usedReference,
      format:        result.format,
      generatedAt:   result.generatedAt,
    });
  } catch (error) {
    console.error('Generate visual error:', error);
    if (error.message?.includes('API key not configured')) return res.status(503).json({ error: 'OpenAI API key required.' });
    if (error.message?.includes('billing') || error.message?.includes('quota')) return res.status(402).json({ error: 'OpenAI billing limit reached.' });
    if (error.message?.includes('content_policy') || error.message?.includes('safety')) return res.status(422).json({ error: 'Image blocked by content policy.' });
    res.status(500).json({ error: error.message || 'Failed to generate visual' });
  }
};