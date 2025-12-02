import { supabaseAdmin } from '../config/supabase.js';

// Get all campaigns for a user
export const getCampaigns = async (req, res) => {
  try {
    const userId = req.userId;

    // Filter campaigns by user_id
    const { data: campaigns, error } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get campaigns error:', error);
      return res.status(500).json({ error: 'Failed to fetch campaigns' });
    }

    // Map database columns to expected frontend format
    const formattedCampaigns = (campaigns || []).map(campaign => ({
      id: campaign.id,
      name: campaign.name || '',
      description: typeof campaign.product_description === 'string' 
        ? campaign.product_description 
        : String(campaign.product_description || ''),
      target_audience: campaign.target_audience || '',
      ai_provider: campaign.ai_provider || 'claude',
      output_formats: Array.isArray(campaign.output_formats) ? campaign.output_formats : [],
      status: campaign.status || '',
      created_at: campaign.created_at,
      updated_at: campaign.updated_at
    }));

    console.log('Returning campaigns for user:', userId, 'count:', formattedCampaigns.length);

    res.json({ campaigns: formattedCampaigns });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get a single campaign by ID
export const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .select(`
        *,
        generated_ideas (*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Get campaign error:', error);
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Format the response
    const formattedCampaign = {
      id: campaign.id,
      name: campaign.name,
      description: campaign.product_description,
      target_audience: campaign.target_audience,
      ai_provider: campaign.ai_provider,
      output_formats: campaign.output_formats,
      status: campaign.status,
      created_at: campaign.created_at,
      updated_at: campaign.updated_at,
      generated_content: campaign.generated_ideas || []
    };

    res.json({ campaign: formattedCampaign });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create a new campaign
export const createCampaign = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, description, targetAudience, aiProvider, outputFormats, brandName } = req.body;

    console.log('Creating campaign for user:', userId);

    // Validate input
    if (!name || !description || !targetAudience || !outputFormats || outputFormats.length === 0) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Create campaign with user_id
    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .insert([
        {
          user_id: userId,
          name: name,
          brand_name: brandName || name,
          product_description: description,
          target_audience: targetAudience,
          ai_provider: aiProvider || 'claude',
          output_formats: outputFormats
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Create campaign error:', error);
      return res.status(500).json({ error: 'Failed to create campaign' });
    }

    res.status(201).json({ 
      message: 'Campaign created successfully',
      campaign 
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update a campaign
export const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { name, description, targetAudience, aiProvider, outputFormats } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.product_description = description;
    if (targetAudience) updateData.target_audience = targetAudience;
    if (aiProvider) updateData.ai_provider = aiProvider;
    if (outputFormats) updateData.output_formats = outputFormats;
    updateData.updated_at = new Date().toISOString();

    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update campaign error:', error);
      return res.status(500).json({ error: 'Failed to update campaign' });
    }

    // Format the response
    const formattedCampaign = {
      id: campaign.id,
      name: campaign.name,
      description: campaign.product_description,
      target_audience: campaign.target_audience,
      ai_provider: campaign.ai_provider,
      output_formats: campaign.output_formats,
      status: campaign.status,
      created_at: campaign.created_at,
      updated_at: campaign.updated_at
    };

    res.json({ 
      message: 'Campaign updated successfully',
      campaign: formattedCampaign 
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete a campaign
export const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const { error } = await supabaseAdmin
      .from('campaigns')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Delete campaign error:', error);
      return res.status(500).json({ error: 'Failed to delete campaign' });
    }

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Generate AI content for a campaign
export const generateIdeas = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Get campaign details and verify ownership
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (campaignError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get uploaded media for this campaign
    const { data: media, error: mediaError } = await supabaseAdmin
      .from('campaign_media')
      .select('*')
      .eq('campaign_id', id);

    // Build media URLs
    const mediaUrls = media?.map(m => ({
      type: m.file_type,
      url: `${process.env.SUPABASE_URL}/storage/v1/object/public/campaign-media/${m.file_path}`
    })) || [];

    // Import AI service
    const { generateContentIdeasAI } = await import('../services/ai.service.js');

    // Generate content using AI
    const generatedContent = await generateContentIdeasAI({
      name: campaign.name,
      product_description: campaign.product_description,
      target_audience: campaign.target_audience,
      output_formats: campaign.output_formats,
      ai_provider: campaign.ai_provider || 'gemini'
    }, mediaUrls);

    res.json({ 
      message: 'Content generated successfully',
      generatedContent: generatedContent
    });
  } catch (error) {
    console.error('Generate ideas error:', error);
    
    // Return user-friendly error messages
    if (error.message.includes('API key not configured')) {
      return res.status(503).json({ 
        error: 'AI service not configured. Please contact administrator or add your own API key.' 
      });
    }
    
    res.status(500).json({ error: error.message || 'Failed to generate content' });
  }
};

// Generate marketing strategy
export const generateMarketingStrategy = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Get campaign details and verify ownership
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (campaignError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Import AI service
    const { generateMarketingStrategyAI } = await import('../services/ai.service.js');

    // Generate strategy using AI
    const strategy = await generateMarketingStrategyAI({
      name: campaign.name,
      product_description: campaign.product_description,
      target_audience: campaign.target_audience,
      output_formats: campaign.output_formats,
      ai_provider: campaign.ai_provider || 'gemini'
    });

    res.json({
      message: 'Strategy generated successfully',
      strategy: strategy
    });
  } catch (error) {
    console.error('Generate strategy error:', error);
    
    // Return user-friendly error messages
    if (error.message.includes('API key not configured')) {
      return res.status(503).json({ 
        error: 'AI service not configured. Please contact administrator or add your own API key.' 
      });
    }
    
    res.status(500).json({ error: error.message || 'Failed to generate strategy' });
  }
};