import { supabase } from '../config/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { scoreIdea as scoreIdeaService, explainScore as explainScoreService } from '../services/viralScoring.service.js';

export const scoreIdea = async (req, res) => {
  const { script, hook, platform = 'tiktok', target_audience = {}, emotion = 'neutral' } = req.body;

  if (!script || !hook) {
    throw new AppError('Script and hook are required', 400);
  }

  const score = await scoreIdeaService({
    script,
    hook,
    platform,
    targetAudience: target_audience,
    emotion
  });

  res.json({ success: true, data: score });
};

export const explainScore = async (req, res) => {
  const { id } = req.params;

  const { data: idea, error } = await supabase
    .from('generated_ideas')
    .select(`*, campaigns!inner (user_id)`)
    .eq('id', id)
    .single();

  if (error || !idea) {
    throw new AppError('Idea not found', 404);
  }

  if (idea.campaigns.user_id !== req.user.id) {
    throw new AppError('Unauthorized', 403);
  }

  const explanation = await explainScoreService({
    virality_score: idea.virality_score,
    predicted_views: idea.predicted_views,
    features: idea.features,
    script: idea.full_script,
    hook: idea.hook_script
  });

  res.json({
    success: true,
    data: {
      idea_id: id,
      explanation,
      score_data: {
        virality_score: idea.virality_score,
        predicted_views: idea.predicted_views,
        features: idea.features
      }
    }
  });
};