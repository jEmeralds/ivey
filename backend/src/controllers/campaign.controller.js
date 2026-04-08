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
      id:               c.id,
      name:             c.name || '',
      description:      typeof c.product_description === 'string' ? c.product_description : String(c.product_description || ''),
      target_audience:  c.target_audience || '',
      ai_provider:      c.ai_provider || 'gemini',
      output_formats:   Array.isArray(c.output_formats) ? c.output_formats : [],
      status:           c.status || '',
      created_at:       c.created_at,
      updated_at:       c.updated_at,
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
      id:                campaign.id,
      name:              campaign.name,
      description:       campaign.product_description,
      target_audience:   campaign.target_audience,
      ai_provider:       campaign.ai_provider,
      output_formats:    campaign.output_formats,
      status:            campaign.status,
      created_at:        campaign.created_at,
      updated_at:        campaign.updated_at,
      brand_profile_id:  campaign.brand_profile_id || null,
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
    const { name, description, targetAudience, aiProvider, outputFormats, brandName, websiteUrl, brandProfileId, videoDuration, productionBrief, brandIntelligence } = req.body;

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
        ai_provider:         aiProvider || 'gemini',
        output_formats:      outputFormats,
        brand_profile_id:    brandProfileId || null,
        video_duration:      videoDuration || null,
        production_brief:    productionBrief || null,
        brand_intelligence:  brandIntelligence || null,
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
    if (name)           updateData.name                = name;
    if (description)    updateData.product_description = description;
    if (targetAudience) updateData.target_audience     = targetAudience;
    if (aiProvider)     updateData.ai_provider         = aiProvider;
    if (outputFormats)  updateData.output_formats      = outputFormats;

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

// ── Generate images (legacy — returns empty, IVey is video-first) ─────────────
export const generateIdeas = async (req, res) => {
  res.json({ message: 'IVey is video-first. Use /generate-script instead.', generatedContent: [] });
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
    res.status(500).json({ error: error.message || 'Failed to generate strategy' });
  }
};

// ── Generate caption at share time ───────────────────────────────────────────
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

// ── Generate visual (legacy stub) ─────────────────────────────────────────────
export const generateVisual = async (req, res) => {
  res.json({ message: 'Visual generation paused — IVey is video-first.', imageUrl: null });
};

// ── Generate video script — 5-layer intelligence engine ──────────────────────
// POST /api/campaigns/:id/generate-script
// Returns: script, all 3 drafts, audience profile, competitive gap,
//          narrative arc, all hooks, viral scores
export const generateVideoScript = async (req, res) => {
  try {
    const { id }     = req.params;
    const userId     = req.userId;
    const { duration_seconds, ai_provider } = req.body;

    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns').select('*').eq('id', id).eq('user_id', userId).single();

    if (campaignError || !campaign) return res.status(404).json({ error: 'Campaign not found' });

    const brand = await getBrandForCampaign(campaign, userId);

    const requestedDuration = duration_seconds
      ? Number(duration_seconds)
      : (campaign.video_duration || brand?.default_video_length || null);

    const { generateVideoScriptAI } = await import('../services/ai.service.js');

    // Merge brand profile with URL-extracted intelligence
    // URL intelligence fills in visual details the brand profile may lack
    const mergedBrand = brand ? { ...brand } : {};
    const urlIntelligence = campaign.brand_intelligence;
    if (urlIntelligence) {
      if (!mergedBrand.logo_url && urlIntelligence.logo_url)
        mergedBrand.logo_url = urlIntelligence.logo_url;
      if (!mergedBrand.visual_identity && urlIntelligence.visual_identity)
        mergedBrand.visual_identity = urlIntelligence.visual_identity;
      if (!mergedBrand.script_visual_notes && urlIntelligence.script_visual_notes)
        mergedBrand.script_visual_notes = urlIntelligence.script_visual_notes;
      if (!mergedBrand.brand_voice && urlIntelligence.brand_voice)
        mergedBrand.brand_voice = urlIntelligence.brand_voice;
      if (!mergedBrand.tagline && urlIntelligence.tagline)
        mergedBrand.tagline = urlIntelligence.tagline;
      if (!mergedBrand.key_offerings?.length && urlIntelligence.key_offerings?.length)
        mergedBrand.key_offerings = urlIntelligence.key_offerings;
    }

    const result = await generateVideoScriptAI({
      campaignName:       campaign.name,
      productDescription: campaign.product_description,
      targetAudience:     campaign.target_audience,
      durationSeconds:    requestedDuration,
      brand:              mergedBrand,
      productionBrief:    campaign.production_brief || null,
      ai_provider:        ai_provider || campaign.ai_provider || 'gemini',
    });

    // Return the full intelligence package to the frontend
    res.json({
      // Primary output
      script:         result.script,
      seconds:        result.seconds,
      bracket:        `${result.seconds}s`,
      bracketReason:  result.bracketReason || '',

      // Winning draft info
      winningDraft:   result.winningDraft,
      viralScore:     result.viralScore,
      predictedViews: result.predictedViews,
      scoreFeatures:  result.scoreFeatures,
      strengths:      result.strengths,
      improvements:   result.improvements,
      optimizedHook:  result.optimizedHook,

      // All 3 drafts for user to browse
      drafts:         result.drafts,

      // Intelligence layers
      audienceProfile:  result.audienceProfile,
      competitiveGap:   result.competitiveGap,
      narrativeArc:     result.narrativeArc,
      hooks:            result.hooks,
      winnerHook:       result.winnerHook,
      productionBrief:  result.productionBrief,

      // HeyGen production setup — extracted from script
      heygenSetup:      result.heygenSetup   || null,
      heygenPrompt:     result.heygenPrompt  || null,
    });
  } catch (error) {
    console.error('Generate script error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate script' });
  }
};