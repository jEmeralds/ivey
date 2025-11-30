import { generateWithAI, AI_PROVIDERS } from './aiProvider.service.js';

export const generateViralIdeas = async ({
  brandName,
  productDescription,
  targetAudience,
  desiredEmotion,
  budgetRange,
  platform = 'tiktok',
  numberOfIdeas = 10,
  aiProvider = AI_PROVIDERS.CLAUDE
}) => {
  
  const prompt = buildIdeaGenerationPrompt({
    brandName,
    productDescription,
    targetAudience,
    desiredEmotion,
    budgetRange,
    platform,
    numberOfIdeas
  });

  try {
    const rawContent = await generateWithAI(prompt, aiProvider);
    return parseIdeasFromResponse(rawContent);
  } catch (error) {
    console.error(`${aiProvider} API error:`, error);
    throw new Error(`Failed to generate ideas: ${error.message}`);
  }
};

const buildIdeaGenerationPrompt = ({
  brandName,
  productDescription,
  targetAudience,
  desiredEmotion,
  budgetRange,
  platform,
  numberOfIdeas
}) => {
  return `You are a viral marketing genius who has studied campaigns like Dollar Shave Club, Old Spice, and the ALS Ice Bucket Challenge. Generate ${numberOfIdeas} viral ${platform} campaign concepts.

**BRAND BRIEF:**
- Brand: ${brandName}
- Product: ${productDescription}
- Target Audience: ${JSON.stringify(targetAudience)}
- Desired Emotion: ${desiredEmotion}
- Budget: ${budgetRange}
- Platform: ${platform}

**YOUR TASK:**
Generate ${numberOfIdeas} campaign concepts. Each must include:
1. concept_title (5-10 words, punchy)
2. hook (First 3 seconds - must STOP the scroll)
3. full_script (15-60 seconds, complete script)
4. viral_explanation (Why it will go viral)
5. estimated_score (0-100, realistic)

**VIRAL PRINCIPLES:**
- Pattern interrupt in first 0.8 seconds
- Emotional curve: surprise → peak → payoff
- Shareability: identity, status, humor, awe
- Meme-ability: can people remix this?

**OUTPUT FORMAT:**
Return ONLY a valid JSON array:

[
  {
    "concept_title": "string",
    "hook": "string",
    "full_script": "string",
    "viral_explanation": "string",
    "estimated_score": number
  }
]

Be BOLD and CREATIVE. No generic corporate speak. Output ONLY the JSON array:`;
};

const parseIdeasFromResponse = (rawContent) => {
  try {
    let jsonContent = rawContent.trim();
    
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '');
    }
    
    const ideas = JSON.parse(jsonContent.trim());
    
    if (!Array.isArray(ideas)) {
      throw new Error('Response is not an array');
    }
    
    return ideas.map((idea, index) => ({
      concept_title: idea.concept_title || `Campaign Idea ${index + 1}`,
      hook: idea.hook || '',
      full_script: idea.full_script || '',
      viral_explanation: idea.viral_explanation || '',
      estimated_score: Math.max(0, Math.min(100, idea.estimated_score || 50)),
      rank: index + 1
    }));
    
  } catch (error) {
    console.error('Failed to parse ideas:', error);
    throw new Error('Failed to parse AI response');
  }
};

export const enhanceIdea = async (idea, aiProvider = AI_PROVIDERS.CLAUDE) => {
  const prompt = `You are a viral content director. Create a detailed breakdown for this campaign:

**CONCEPT:**
Title: ${idea.concept_title}
Hook: ${idea.hook_script || idea.hook}
Script: ${idea.full_script}

**CREATE:**
1. Shot-by-shot storyboard (5-10 key frames)
2. Enhanced script with timing
3. Music/sound recommendations
4. Visual style guide

Return as JSON:
{
  "storyboard": [{"second": 0, "description": "..."}],
  "enhanced_script": "...",
  "music_style": "...",
  "visual_style": "..."
}`;

  try {
    const rawContent = await generateWithAI(prompt, aiProvider);
    let jsonContent = rawContent.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    return JSON.parse(jsonContent.trim());
  } catch (error) {
    console.error('Failed to enhance idea:', error);
    throw new Error(`Failed to enhance idea: ${error.message}`);
  }
};

export default { generateViralIdeas, enhanceIdea };