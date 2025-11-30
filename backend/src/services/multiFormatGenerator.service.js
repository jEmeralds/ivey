import { generateWithAI } from './aiProvider.service.js';
import { OUTPUT_FORMATS, OUTPUT_FORMAT_LABELS } from '../constants/outputFormats.js';

/**
 * Generate prompts for different output formats
 */
const getFormatPrompt = (format, brandName, productDescription, targetAudience, desiredEmotion) => {
  const baseContext = `
Brand: ${brandName}
Product: ${productDescription}
Target Audience: ${targetAudience}
Desired Emotion: ${desiredEmotion}
`;

  const prompts = {
    [OUTPUT_FORMATS.TIKTOK_SCRIPT]: `${baseContext}

Create a viral TikTok/Reels script (15-60 seconds).

Requirements:
- Hook in first 3 seconds that stops the scroll
- Visual directions in [brackets]
- Conversational, authentic tone
- Clear call-to-action
- Optimized for virality

Format:
HOOK (0-3s): [what happens]
BODY (3-45s): [main content]
CTA (45-60s): [call to action]`,

    [OUTPUT_FORMATS.YOUTUBE_SHORTS]: `${baseContext}

Create a YouTube Shorts script (60 seconds max).

Requirements:
- Strong opening hook
- Fast-paced content
- Visual cues in [brackets]
- Educational or entertaining angle
- Subscribe reminder

Format:
HOOK (0-5s): [opening]
CONTENT (5-50s): [main points]
CTA (50-60s): [subscribe + next steps]`,

    [OUTPUT_FORMATS.INSTAGRAM_CAPTION]: `${baseContext}

Write an engaging Instagram caption.

Requirements:
- Attention-grabbing first line
- 3-5 relevant hashtags
- Emoji usage (tasteful)
- Clear CTA
- 150-300 characters

Format:
[Opening hook]
[Body text]
[Call to action]
[Hashtags]`,

    [OUTPUT_FORMATS.TWITTER_POST]: `${baseContext}

Write a Twitter/X post (max 280 characters).

Requirements:
- Punchy and concise
- 1-2 relevant hashtags
- Hook in first line
- Clear value proposition
- Optional thread starter`,

    [OUTPUT_FORMATS.FACEBOOK_POST]: `${baseContext}

Write a Facebook post.

Requirements:
- Community-focused tone
- Storytelling approach
- Conversational language
- Engaging question or CTA
- 100-250 words`,

    [OUTPUT_FORMATS.EMAIL_MARKETING]: `${baseContext}

Write email marketing copy.

Requirements:
- Compelling subject line (50 characters max)
- Personalized greeting
- Clear value proposition
- Scannable format (bullets/short paragraphs)
- Strong CTA button text
- P.S. line with urgency

Format:
SUBJECT: [subject line]
PREVIEW: [preview text]
BODY: [email content]
CTA: [button text]
P.S.: [urgency message]`,

    [OUTPUT_FORMATS.SMS_MESSAGE]: `${baseContext}

Write an SMS/WhatsApp message (160 characters max).

Requirements:
- Ultra-concise
- Clear offer
- Urgency element
- Link or code
- Friendly tone`,

    [OUTPUT_FORMATS.FLYER_TEXT]: `${baseContext}

Write flyer/poster text.

Requirements:
- Bold headline (5-10 words)
- Subheadline explaining benefit
- 3-5 bullet points
- Contact info placeholder
- Special offer if applicable

Format:
HEADLINE: [main headline]
SUBHEADLINE: [benefit statement]
BULLETS: [key points]
CTA: [action to take]`,

    [OUTPUT_FORMATS.BANNER_AD]: `${baseContext}

Write banner ad copy.

Requirements:
- Headline (5-8 words max)
- Subtext (10-15 words)
- CTA button text (2-3 words)
- Ultra-concise
- Attention-grabbing`,

    [OUTPUT_FORMATS.PRINT_AD]: `${baseContext}

Write full print advertisement copy.

Requirements:
- Main headline
- Supporting subheadline
- Body copy (100-150 words)
- Visual description suggestions
- Call to action
- Contact/website info

Format:
HEADLINE: [main headline]
SUBHEADLINE: [supporting line]
BODY: [ad copy]
VISUAL NOTES: [suggested images/layout]
CTA: [call to action]`,

    [OUTPUT_FORMATS.LINKEDIN_POST]: `${baseContext}

Write a professional LinkedIn post.

Requirements:
- Thought leadership angle
- Professional but authentic tone
- Industry insights
- Personal story/experience
- 3-5 relevant hashtags
- Encourages discussion

Format:
HOOK: [opening line]
STORY/INSIGHT: [main content]
TAKEAWAY: [key lesson]
CTA: [discussion prompt]
HASHTAGS: [professional tags]`,

    [OUTPUT_FORMATS.YOUTUBE_AD]: `${baseContext}

Write a YouTube pre-roll ad script (15-30 seconds).

Requirements:
- Attention hook in first 5 seconds
- Skip button consideration
- Problem → Solution format
- Strong CTA with urgency
- Visual directions

Format:
HOOK (0-5s): [grab attention before skip]
PROBLEM (5-15s): [pain point]
SOLUTION (15-25s): [your product]
CTA (25-30s): [urgent call to action]`,

    [OUTPUT_FORMATS.GOOGLE_AD]: `${baseContext}

Write Google Search Ad copy.

Requirements:
- 3 headlines (30 characters each)
- 2 descriptions (90 characters each)
- Include keywords naturally
- Clear value proposition
- Strong CTA

Format:
HEADLINE 1: [30 chars]
HEADLINE 2: [30 chars]
HEADLINE 3: [30 chars]
DESCRIPTION 1: [90 chars]
DESCRIPTION 2: [90 chars]
URL: [display URL]`,
  };

  return prompts[format] || prompts[OUTPUT_FORMATS.TIKTOK_SCRIPT];
};

/**
 * Generate content for multiple formats
 */
export const generateMultiFormatContent = async ({
  brandName,
  productDescription,
  targetAudience,
  desiredEmotion,
  outputFormats = [OUTPUT_FORMATS.TIKTOK_SCRIPT],
  aiProvider = 'claude',
  numberOfIdeas = 5,
}) => {
  const results = {};

  for (const format of outputFormats) {
    try {
      const prompt = getFormatPrompt(format, brandName, productDescription, targetAudience, desiredEmotion);
      
      const fullPrompt = `${prompt}

Generate ${numberOfIdeas} different variations. Return ONLY valid JSON array:

[
  {
    "title": "Concept title",
    "content": "Full content for this format",
    "virality_score": 75,
    "notes": "Why this will work"
  }
]`;

      const response = await generateWithAI(fullPrompt, aiProvider);
      
      // Parse response
      let content = response.trim();
      if (content.startsWith('```json')) {
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      
      const ideas = JSON.parse(content);
      
      results[format] = {
        format,
        formatLabel: OUTPUT_FORMAT_LABELS[format],
        ideas: ideas.map((idea, index) => ({
          ...idea,
          rank: index + 1,
          output_format: format,
        })),
      };
    } catch (error) {
      console.error(`Failed to generate ${format}:`, error.message);
      results[format] = {
        format,
        formatLabel: OUTPUT_FORMAT_LABELS[format],
        error: error.message,
        ideas: [],
      };
    }
  }

  return results;
};

export default { generateMultiFormatContent };