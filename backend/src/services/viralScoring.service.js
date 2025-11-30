import { anthropic, CLAUDE_MODEL, MAX_TOKENS } from '../config/anthropic.js';

export const scoreIdea = async ({
  script,
  hook,
  platform = 'tiktok',
  targetAudience = {},
  emotion = 'neutral'
}) => {
  
  const prompt = `You are a viral content analyst with data from 10,000+ viral campaigns. Analyze this ${platform} script and provide a virality score.

**SCRIPT TO ANALYZE:**
Hook (first 3 seconds): "${hook}"
Full Script: "${script}"
Platform: ${platform}

**EVALUATE THESE FEATURES (0-10 each):**
1. Hook Strength - Does it stop the scroll?
2. Emotion Curve - Surprise → peak → payoff?
3. Shareability - Would people share this?
4. Meme Potential - Can people remix this?
5. Platform Fit - Optimized for ${platform}?

**SCORING BENCHMARKS:**
- 0-30: Under 10K views
- 31-50: 10K-100K views
- 51-70: 100K-1M views
- 71-85: 1M-10M views
- 86-100: 10M+ views (rare)

**OUTPUT FORMAT:**
Return ONLY valid JSON:

{
  "virality_score": number,
  "predicted_views": number,
  "predicted_shares": number,
  "features": {
    "hook_strength": number,
    "emotion_curve": number,
    "shareability": number,
    "meme_potential": number,
    "platform_fit": number
  },
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "optimization_tips": ["tip1", "tip2", "tip3"]
}

Be honest and data-driven. Output ONLY JSON:`;

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    });

    const rawContent = response.content[0].text;
    let jsonContent = rawContent.trim();
    
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '');
    }
    
    const scoreData = JSON.parse(jsonContent.trim());
    
    return {
      virality_score: Math.max(0, Math.min(100, scoreData.virality_score || 0)),
      predicted_views: scoreData.predicted_views || 0,
      predicted_shares: scoreData.predicted_shares || 0,
      features: scoreData.features || {},
      strengths: scoreData.strengths || [],
      weaknesses: scoreData.weaknesses || [],
      optimization_tips: scoreData.optimization_tips || []
    };
    
  } catch (error) {
    console.error('Scoring error:', error);
    throw new Error(`Failed to score idea: ${error.message}`);
  }
};

export const explainScore = async (scoreData) => {
  const prompt = `You are a viral marketing educator. Explain this virality score in simple terms for a marketing agency.

**SCORE DATA:**
${JSON.stringify(scoreData, null, 2)}

**EXPLAIN:**
1. Overall assessment (2-3 sentences)
2. Why this score was given
3. What the numbers mean (views, shares, ROI)
4. Top 3 things to improve
5. Top 3 things working well

Be conversational and actionable.`;

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    return response.content[0].text;
    
  } catch (error) {
    console.error('Explanation error:', error);
    throw new Error(`Failed to explain score: ${error.message}`);
  }
};

export default { scoreIdea, explainScore };