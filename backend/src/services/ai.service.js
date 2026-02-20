// AI Service - OPTIMIZED FOR SPEED
// This is a fast version for testing. The comprehensive version with web search is available as backup.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Generate marketing strategy using AI (FAST VERSION)
export const generateMarketingStrategyAI = async (campaignData) => {
  const { name, product_description, target_audience, output_formats, ai_provider } = campaignData;
  
  console.log(`\n🚀 Generating FAST AI strategy for: ${name}`);
  console.log(`   Provider: ${ai_provider}`);

  // Build streamlined prompt (no web search)
  const prompt = `You are an expert marketing strategist. Generate a comprehensive marketing strategy for:

Campaign: ${name}
Product/Service: ${product_description || 'Not specified'}
Target Audience: ${target_audience}
Channels: ${output_formats?.join(', ') || 'Multiple platforms'}

Provide a complete strategy with:

1. CAMPAIGN OBJECTIVES (3 specific, measurable goals)

2. TARGET AUDIENCE ANALYSIS 
   - Key demographics & psychographics
   - Pain points and desires
   - Preferred platforms

3. KEY MESSAGES (3-5 core value propositions)

4. CONTENT STRATEGY
   - Content types with 40/30/20/10 breakdown
   - Optimal posting schedule

5. PLATFORM-SPECIFIC TACTICS for: ${output_formats?.slice(0, 3).join(', ')}
   - Organic strategies
   - Paid advertising approach

6. SUCCESS METRICS & KPIS
   - Primary KPIs with realistic targets
   - Tracking methods

7. 30-DAY ACTION PLAN
   - Week-by-week milestones

Make it actionable and specific with realistic industry benchmarks.`;

  try {
    let strategy;

    switch (ai_provider) {
      case 'gemini':
        strategy = await callGeminiFastAPI(prompt);
        break;
      case 'claude':
        strategy = await callClaudeFastAPI(prompt);
        break;
      case 'openai':
        strategy = await callOpenAIFastAPI(prompt);
        break;
      default:
        throw new Error(`Unsupported AI provider: ${ai_provider}`);
    }

    console.log('✅ FAST Strategy generated in ~30 seconds\n');
    return strategy;
  } catch (error) {
    console.error('AI strategy generation error:', error);
    throw error;
  }
};

// OPTIMIZED Gemini API call for speed
async function callGeminiFastAPI(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  // Use FASTEST Gemini model
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
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
        temperature: 0.8, // Slightly higher for creativity but still fast
        maxOutputTokens: 4096, // Reduced from 8192 for speed
        topK: 40,
        topP: 0.95
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();

  // Validate response
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    console.error('Invalid Gemini response structure:', JSON.stringify(data, null, 2));
    throw new Error('Invalid response from Gemini API');
  }

  return data.candidates[0].content.parts[0].text;
}

// OPTIMIZED Claude API call for speed
async function callClaudeFastAPI(prompt) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Claude API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307', // FASTEST Claude model
      max_tokens: 3000, // Reduced for speed
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

// OPTIMIZED OpenAI API call for speed
async function callOpenAIFastAPI(prompt) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo', // FASTEST OpenAI model  
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 3000, // Reduced for speed
      temperature: 0.8
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// FAST content generation (reduced delays)
export const generateContentIdeasAI = async (campaignData, mediaUrls = []) => {
  const { name, product_description, target_audience, output_formats, ai_provider } = campaignData;
  
  console.log(`\n🎨 Generating FAST content for: ${name}`);
  console.log(`   Formats: ${output_formats?.length || 0} selected`);

  // Build media context
  let mediaContext = '';
  if (mediaUrls && mediaUrls.length > 0) {
    mediaContext = `\n\nUploaded media: ${mediaUrls.length} file(s) available. Reference product visuals in content.\n`;
  }

  // STREAMLINED format prompts (shorter for speed)
  const formatPrompts = {
    'tiktok_script': `Create a viral 30-second TikTok script for "${name}":
Product: ${product_description}
Target: ${target_audience}${mediaContext}

Format: HOOK (0-3s) | BODY (3-25s) | CTA (25-30s)
Include: trending sounds, hashtags, visual cues.`,

    'instagram_caption': `Write an Instagram caption for "${name}":
${product_description} | Target: ${target_audience}${mediaContext}

Include: hook, story, CTA, 15 hashtags, emojis.`,

    'youtube_video_ad': `60-second YouTube ad script for "${name}":
${product_description} | Target: ${target_audience}${mediaContext}

Structure: Hook (0-5s) | Problem (5-15s) | Solution (15-40s) | Proof (40-50s) | CTA (50-60s)`,

    'facebook_post': `Facebook post for "${name}":
${product_description} | Target: ${target_audience}${mediaContext}

Requirements: conversational, story-driven, shareable, 3-5 hashtags.`,

    'twitter_post': `3 Twitter variations for "${name}":
${product_description} | Target: ${target_audience}${mediaContext}

Each under 280 chars with hashtags and CTA.`,

    'linkedin_post': `Professional LinkedIn post for "${name}":
${product_description} | Target: ${target_audience}${mediaContext}

Professional tone, industry insight, 3-5 hashtags.`,

    'youtube_shorts': `YouTube Shorts script for "${name}":
${product_description} | Target: ${target_audience}${mediaContext}

60s format: Hook (0-3s) | Content (3-45s) | CTA (45-60s)`,

    'banner_ad': `Banner ad copy for "${name}":
${product_description} | Target: ${target_audience}${mediaContext}

Provide: headline, subheadline, CTA button, design notes.`,

    'google_search_ad': `Google Ad copy for "${name}":
${product_description} | Target: ${target_audience}${mediaContext}

3 variations with headlines (30 chars) and descriptions (90 chars).`,

    'flyer_text': `Flyer content for "${name}":
${product_description} | Target: ${target_audience}${mediaContext}

Include: headline, 3-5 benefits, offer, CTA, layout tips.`,

    'print_ad': `Print ad copy for "${name}":
${product_description} | Target: ${target_audience}${mediaContext}

Headline, body copy, tagline, CTA, visual concept.`,

    'email_campaign': `Email campaign for "${name}":
${product_description} | Target: ${target_audience}${mediaContext}

Subject line, preview text, body, CTA, P.S. line.`
  };

  try {
    const generatedContent = [];

    // Generate content with REDUCED delays
    for (const format of output_formats || []) {
      const formatKey = format.toLowerCase();
      const prompt = formatPrompts[formatKey];

      if (!prompt) {
        console.log(`⚠️ No template for: ${format}`);
        continue;
      }

      console.log(`  Generating: ${format}...`);

      // REDUCED delay: 500ms instead of 2000ms
      if (generatedContent.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      let content;
      switch (ai_provider) {
        case 'gemini':
          content = await callGeminiFastAPI(prompt);
          break;
        case 'claude':
          content = await callClaudeFastAPI(prompt);
          break;
        case 'openai':
          content = await callOpenAIFastAPI(prompt);
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

    console.log(`✅ Generated ${generatedContent.length} pieces in ~60 seconds\n`);
    return generatedContent;

  } catch (error) {
    console.error('Content generation error:', error);
    throw error;
  }
};