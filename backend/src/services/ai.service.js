// AI Service - COMPREHENSIVE VERSION WITHOUT WEB SEARCH
import fetch from 'node-fetch';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Generate marketing strategy using AI (COMPREHENSIVE - NO WEB SEARCH)
export const generateMarketingStrategyAI = async (campaignData) => {
  const { name, product_description, target_audience, output_formats, ai_provider } = campaignData;
  
  console.log(`\n🤖 Generating comprehensive AI strategy for: ${name}`);
  console.log(`   Provider: ${ai_provider}`);

  // Build comprehensive prompt (WITHOUT web search)
  const prompt = `You are an expert marketing strategist with deep industry knowledge.

Campaign Details:
- Campaign Name: ${name}
- Product/Service: ${product_description || 'Not specified'}
- Target Audience: ${target_audience}
- Distribution Channels: ${output_formats?.join(', ') || 'Multiple platforms'}

Generate a comprehensive, data-driven marketing strategy that includes:

1. CAMPAIGN OBJECTIVES
   - 3-5 specific, measurable goals based on industry benchmarks
   - Primary objective with clear success criteria
   - Secondary objectives supporting brand building

2. TARGET AUDIENCE ANALYSIS
   - Demographics and psychographics
   - Pain points and desires
   - Media consumption habits and preferred platforms
   - Decision-making factors and purchase triggers
   - Audience personas with specific characteristics

3. KEY MESSAGES & VALUE PROPOSITIONS
   - Primary value proposition (unique selling point)
   - 3-5 core messages for different audience segments
   - Emotional appeals and rational benefits
   - Brand positioning statement
   - Competitive differentiation points

4. CONTENT STRATEGY
   - Content pillars with 40/30/20/10 breakdown:
     * 40% Educational/Value-driven content
     * 30% Behind-the-scenes/Brand storytelling
     * 20% Product-focused content
     * 10% User-generated content/Community
   - Content themes and messaging calendar
   - Optimal posting frequency for each platform
   - Content formats most effective for target audience

5. DISTRIBUTION PLAN
   - Platform-specific tactics for: ${output_formats?.slice(0, 5).join(', ')}
   - Organic strategy with content optimization
   - Paid advertising approach with budget allocation
   - Cross-promotion and synergy tactics
   - Influencer collaboration opportunities
   - Email marketing integration

6. BUDGET RECOMMENDATIONS
   - Allocation percentages: 60% paid ads, 25% content creation, 10% tools, 5% influencers
   - Cost-effective approaches for maximum ROI
   - Scaling strategies based on performance
   - Resource allocation across platforms

7. SUCCESS METRICS & KPIs
   - Primary metrics: Conversion rate, ROAS, engagement rate
   - Secondary metrics: Brand awareness, reach, share of voice
   - Platform-specific KPIs with realistic benchmarks:
     * Social media: 2-5% engagement rate target
     * Email: 20-25% open rate, 3-5% click rate
     * Paid ads: 2-4% CTR, $10-50 CPA depending on industry
   - Attribution and tracking methodology

8. TIMELINE & MILESTONES
   - Week 1-2: Campaign launch and initial optimization
   - Week 3-4: Scale successful elements, pause underperformers
   - Month 2: Mid-campaign analysis and strategy refinement
   - Month 3: Full optimization and preparation for next phase
   - Key milestones and checkpoint reviews

9. COMPETITIVE INSIGHTS
   - Competitive landscape analysis
   - Gaps in competitor strategies to exploit
   - Differentiation opportunities
   - Market positioning advantages

10. OPTIMIZATION RECOMMENDATIONS
    - A/B testing ideas for ads, content, and landing pages
    - Continuous improvement tactics
    - Performance monitoring schedule
    - Scaling strategies for successful campaigns

Be specific, actionable, and data-driven. Provide realistic industry benchmarks and concrete next steps.`;

  try {
    let strategy;

    switch (ai_provider) {
      case 'gemini':
        strategy = await callGeminiAPI(prompt);
        break;
      case 'claude':
        strategy = await callClaudeAPI(prompt);
        break;
      case 'openai':
        strategy = await callOpenAIAPI(prompt);
        break;
      default:
        throw new Error(`Unsupported AI provider: ${ai_provider}`);
    }

    console.log('✅ Comprehensive strategy generated successfully\n');
    return strategy;
  } catch (error) {
    console.error('AI strategy generation error:', error);
    throw error;
  }
};

// Gemini API call - FIXED MODEL NAME
async function callGeminiAPI(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192, // Keep high for comprehensive strategies
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();

  console.log('Gemini API response received');
  console.log('Response structure check:');
  console.log('  - Has candidates:', !!data.candidates);
  console.log('  - Has candidates[0]:', !!data.candidates?.[0]);
  console.log('  - Has content:', !!data.candidates?.[0]?.content);
  console.log('  - Has parts:', !!data.candidates?.[0]?.content?.parts);
  console.log('  - Parts length:', data.candidates?.[0]?.content?.parts?.length);

  // Validate response structure
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    console.error('Invalid Gemini response structure:', JSON.stringify(data, null, 2));
    throw new Error('Invalid response from Gemini API');
  }

  if (!data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
    console.error('Gemini response has no parts (content may be blocked)');
    console.error('Full response:', JSON.stringify(data, null, 2));

    // Check if content was blocked by safety filters
    if (data.promptFeedback?.blockReason) {
      throw new Error(`Gemini blocked content: ${data.promptFeedback.blockReason}`);
    }

    throw new Error('Gemini response missing content parts - content may have been filtered');
  }

  return data.candidates[0].content.parts[0].text;
}

// Claude API call
async function callClaudeAPI(prompt) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Claude API key not configured. Please add your Anthropic API key.');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Claude API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// OpenAI API call
async function callOpenAIAPI(prompt) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please add your OpenAI API key.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 4096,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Generate content ideas - COMPREHENSIVE VERSION
export const generateContentIdeasAI = async (campaignData, mediaUrls = []) => {
  const { name, product_description, target_audience, output_formats, ai_provider } = campaignData;
  
  console.log(`\n🎨 Generating comprehensive content for: ${name}`);
  console.log(`   Formats: ${output_formats?.length || 0} selected`);
  console.log(`   Provider: ${ai_provider}`);

  // Build media context if images/videos are uploaded
  let mediaContext = '';
  if (mediaUrls && mediaUrls.length > 0) {
    mediaContext = `\n\nUPLOADED MEDIA:\nThe campaign has ${mediaUrls.length} media file(s) uploaded (product images/videos). Consider these visuals when creating content - reference the product's appearance, colors, and key visual elements in your content suggestions.\n`;
  }

  // Create comprehensive prompts for each format
  const formatPrompts = {
    'tiktok_script': `Create a viral 30-second TikTok script for "${name}".
Product: ${product_description}
Target: ${target_audience}${mediaContext}

Format as:
HOOK (0-3 sec): [Attention-grabbing opening]
BODY (3-25 sec): [Main content with product showcase]
CTA (25-30 sec): [Call to action]

Include: Trending sound suggestions, visual cues, text overlays, hashtags.`,

    'instagram_caption': `Write an engaging Instagram caption for "${name}".
Product: ${product_description}
Target: ${target_audience}${mediaContext}

Include:
- Compelling hook (first line)
- Story/value proposition (2-3 lines)
- Call to action
- 15-20 relevant hashtags
- Emoji usage for engagement

Keep it authentic and conversational.`,

    'youtube_video_ad': `Create a 60-second YouTube video ad script for "${name}".
Product: ${product_description}
Target: ${target_audience}${mediaContext}

Format as:
0-5 SEC: Hook (grab attention immediately)
5-15 SEC: Problem (pain point audience faces)
15-40 SEC: Solution (how product solves it)
40-50 SEC: Social proof/features
50-60 SEC: Strong CTA

Include visual directions and key selling points.`,

    'facebook_post': `Write a Facebook post for "${name}".
Product: ${product_description}
Target: ${target_audience}${mediaContext}

Requirements:
- Conversational tone
- Story-driven (2-3 paragraphs)
- Clear value proposition
- Engaging question or CTA
- 3-5 relevant hashtags
- Emoji for personality

Make it shareable and comment-worthy.`,

    'twitter_post': `Create 3 Twitter/X post variations for "${name}".
Product: ${product_description}
Target: ${target_audience}${mediaContext}

Each tweet should:
- Be under 280 characters
- Have a clear hook
- Include relevant hashtags (2-3)
- Have strong CTA
- Be punchy and engaging

Provide 3 different angles/approaches.`,

    'linkedin_post': `Write a professional LinkedIn post for "${name}".
Product: ${product_description}
Target: ${target_audience}${mediaContext}

Format:
- Professional but engaging hook
- Industry insight or problem statement
- How product addresses this
- Call to action for professionals
- 3-5 relevant professional hashtags

Keep it valuable and shareable in professional circles.`,

    'youtube_shorts': `Create a YouTube Shorts script (60 seconds) for "${name}".
Product: ${product_description}
Target: ${target_audience}${mediaContext}

Structure:
0-3 SEC: Hook (stop the scroll)
3-45 SEC: Fast-paced content delivery
45-60 SEC: CTA + follow prompt

Include visual cues, text overlays, pacing notes. Make it addictive and re-watchable.`,

    'banner_ad': `Design a banner ad copy for "${name}".
Product: ${product_description}
Target: ${target_audience}${mediaContext}

Provide:
- Main headline (5-7 words, powerful)
- Subheadline (10-15 words, benefit-focused)
- Call to action button text (2-4 words)
- Design suggestions (colors, imagery style)
- Size variations: 728x90, 300x250, 160x600

Keep it clean, clear, and conversion-focused.`,

    'google_search_ad': `Write Google Search Ad copy for "${name}".
Product: ${product_description}
Target: ${target_audience}${mediaContext}

Provide 3 ad variations, each with:
- Headline 1 (30 chars max)
- Headline 2 (30 chars max)
- Headline 3 (30 chars max)
- Description 1 (90 chars max)
- Description 2 (90 chars max)
- Display URL path suggestions

Focus on keywords, benefits, and clear CTAs.`,

    'flyer_text': `Create flyer content for "${name}".
Product: ${product_description}
Target: ${target_audience}${mediaContext}

Include:
- Main headline (attention-grabbing)
- 3-5 key benefits/features
- Special offer/promotion text
- Contact information placeholder
- Call to action
- Design layout suggestions

Keep it scannable and impactful for print.`,

    'print_ad': `Write print advertisement copy for "${name}".
Product: ${product_description}
Target: ${target_audience}${mediaContext}

Provide:
- Main headline (powerful, memorable)
- Body copy (3-4 sentences, benefit-focused)
- Tagline/slogan
- Call to action
- Visual concept description
- Layout suggestions (headline placement, image areas)

Make it magazine-quality and brand-building.`,

    'email_campaign': `Create an email marketing campaign for "${name}".
Product: ${product_description}
Target: ${target_audience}${mediaContext}

Include:
- Subject line (50 chars, high open rate)
- Preview text (100 chars)
- Email body (personalized, scannable)
- 2-3 section headers
- Clear CTA buttons (text suggestions)
- P.S. line for urgency

Focus on value and conversion.`
  };

  try {
    const generatedContent = [];

    // Generate content for each selected format
    for (const format of output_formats || []) {
      const formatKey = format.toLowerCase();
      const prompt = formatPrompts[formatKey];

      if (!prompt) {
        console.log(`⚠️  No prompt template for format: ${format}`);
        continue;
      }

      console.log(`  Generating: ${format}...`);

      // REDUCED delay to avoid rate limiting but keep comprehensive content
      if (generatedContent.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay instead of 2
      }

      let content;
      switch (ai_provider) {
        case 'gemini':
          content = await callGeminiAPI(prompt);
          break;
        case 'claude':
          content = await callClaudeAPI(prompt);
          break;
        case 'openai':
          content = await callOpenAIAPI(prompt);
          break;
        default:
          throw new Error(`Unsupported AI provider: ${ai_provider}`);
      }

      generatedContent.push({
        format: format,
        content: content,
        generated_at: new Date().toISOString()
      });
    }

    console.log(`✅ Generated ${generatedContent.length} comprehensive pieces of content\n`);
    return generatedContent;

  } catch (error) {
    console.error('Content generation error:', error);
    throw error;
  }
};