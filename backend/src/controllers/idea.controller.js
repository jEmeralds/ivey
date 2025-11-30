import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { enhanceIdea } from '../services/ideaGeneration.service.js';

export const getIdeasByCampaign = async (req, res) => {
  const { campaignId } = req.params;

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .eq('user_id', req.user.id)
    .single();

  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }

  const { data: ideas, error } = await supabase
    .from('generated_ideas')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('rank', { ascending: true });

  if (error) {
    throw new AppError('Failed to fetch ideas', 500);
  }

  res.json({ success: true, data: ideas });
};

export const getIdeaById = async (req, res) => {
  const { id } = req.params;

  const { data: idea, error } = await supabase
    .from('generated_ideas')
    .select(`*, campaigns!inner (user_id, brand_name, platform)`)
    .eq('id', id)
    .single();

  if (error || !idea) {
    throw new AppError('Idea not found', 404);
  }

  if (idea.campaigns.user_id !== req.user.id) {
    throw new AppError('Unauthorized', 403);
  }

  res.json({ success: true, data: idea });
};

export const regenerateIdea = async (req, res) => {
  const { id } = req.params;

  const { data: idea, error } = await supabase
    .from('generated_ideas')
    .select(`*, campaigns!inner (user_id, brand_name, platform)`)
    .eq('id', id)
    .single();

  if (error || !idea) {
    throw new AppError('Idea not found', 404);
  }

  if (idea.campaigns.user_id !== req.user.id) {
    throw new AppError('Unauthorized', 403);
  }

  const enhancement = await enhanceIdea(idea);

  const { data: updatedIdea, error: updateError } = await supabase
    .from('generated_ideas')
    .update({
      full_script: enhancement.enhanced_script || idea.full_script,
      features: {
        ...idea.features,
        storyboard: enhancement.storyboard,
        music_style: enhancement.music_style,
        visual_style: enhancement.visual_style
      }
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    throw new AppError('Failed to update idea', 500);
  }

  res.json({ success: true, data: updatedIdea });
};

export const trackAnalytics = async (req, res) => {
  const { id } = req.params;
  const { action, actual_views, actual_roi } = req.body;

  const validActions = ['viewed', 'exported', 'launched', 'reported_results'];
  
  if (!action || !validActions.includes(action)) {
    throw new AppError(`Action must be one of: ${validActions.join(', ')}`, 400);
  }

  const { data: analytics, error } = await supabase
    .from('idea_analytics')
    .insert({
      idea_id: id,
      user_id: req.user.id,
      action,
      actual_views: actual_views || null,
      actual_roi: actual_roi || null
    })
    .select()
    .single();

  if (error) {
    throw new AppError('Failed to track analytics', 500);
  }

  res.json({ success: true, data: analytics });
};