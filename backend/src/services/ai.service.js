// AI Service - Handles all AI provider integrations
import fetch from 'node-fetch';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const BRAVE_SEARCH_API_KEY = process.env.BRAVE_SEARCH_API_KEY; // Optional

// Search the web for market intelligence
async function searchMarketData(campaignData) {
  const { name, product_description, target_audience, output_formats } = campaignData;
  
  console.log('🔍 Searching web for market intelligence...');
  
  const searches = [];
  
  try {
    // Search 1: Industry benchmarks
    const benchmarkQuery = `${product_description || name} marketing benchmarks engagement rates 2024`;
    searches.push(searchWeb(benchmarkQuery, 'benchmarks'));
    
    // Search 2: Target audience insights
    const audienceQuery = `${target_audience} demographics behavior online platforms 2024`;
    searches.push(searchWeb(audienceQuery, 'audience'));
    
    // Search 3: Competitor campaigns
    const competitorQuery = `${product_description || name} successful marketing campaigns examples`;
    searches.push(searchWeb(competitorQuery, 'competitors'));
    
    // Search 4: Platform-specific trends
    const platformQuery = `${output_formats?.[0] || 'social media'} marketing trends best practices 2024`;
    searches.push(searchWeb(platformQuery, 'platforms'));
    
    const results = await Promise.all(searches);
    
    return {
      benchmarks: results[0],
      audience: results[1],
      competitors: results[2],
      platforms: results[3]
    };
  } catch (error) {
    console.error('Web search error:', error);
    return null; // Return null if search fails, AI will work without it
  }
}

// Perform web search
async function searchWeb(query, type) {
  console.log(`  Searching: ${query.substring(0, 60)}...`);
  
  // Try Brave Search API first
  if (BRAVE_SEARCH_API_KEY) {
    return await searchBrave(query);
  }
  
  // Fallback to DuckDuckGo HTML scraping (no API key needed)
  return await searchDuckDuckGo(query);
}

// Brave Search API (requires API key)
async function searchBrave(query) {
  try {
    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': BRAVE_SEARCH_API_KEY
      }
    });
    
    if (!response.ok) throw new Error('Brave search failed');
    
    const data = await response.json();
    return data.web?.results?.slice(0, 5).map(r => ({
      title: r.title,
      snippet: r.description,
      url: r.url
    })) || [];
  } catch (error) {
    console.error('Brave search error:', error.message);
    return [];
  }
}

// DuckDuckGo Instant Answer API (Free, no key needed)
async function searchDuckDuckGo(query) {
  try {
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
    
    if (!response.ok) throw new Error('DuckDuckGo search failed');
    
    const data = await response.json();
    const results = [];
    
    // Extract relevant info
    if (data.AbstractText) {
      results.push({
        title: data.Heading || 'Overview',
        snippet: data.AbstractText,
        url: data.AbstractURL
      });
    }
    
    // Add related topics
    if (data.RelatedTopics) {
      data.RelatedTopics.slice(0, 4).forEach(topic => {
        if (topic.Text) {
          results.push({
            title: topic.Text.split(' - ')[0],
            snippet: topic.Text,
            url: topic.FirstURL
          });
        }
      });
    }
    
    return results;
  } catch (error) {
    console.error('DuckDuckGo search error:', error.message);
    return [];
  }
}

// Generate marketing strategy using AI
export const generateMarketingStrategyAI = async (campaignData) => {
  const { name, product_description, target_audience, output_formats, ai_provider } = campaignData;

  console.log(`\n🤖 Generating AI strategy for: ${name}`);
  console.log(`   Provider: ${ai_provider}`);
  
  // Step 1: Search the web for real market data
  const marketData = await searchMarketData(campaignData);
  
  // Step 2: Build research-backed prompt
  let researchContext = '';
  
  if (marketData && Object.values(marketData).some(data => data?.length > 0)) {
    researchContext = `\n\n--- MARKET RESEARCH DATA ---\n\n`;
    
    if (marketData.benchmarks?.length > 0) {
      researchContext += `INDUSTRY BENCHMARKS:\n${marketData.benchmarks.map(r => `- ${r.snippet}`).join('\n')}\n\n`;
    }
    
    if (marketData.audience?.length > 0) {
      researchContext += `TARGET AUDIENCE INSIGHTS:\n${marketData.audience.map(r => `- ${r.snippet}`).join('\n')}\n\n`;
    }
    
    if (marketData.competitors?.length > 0) {
      researchContext += `COMPETITOR CAMPAIGNS & EXAMPLES:\n${marketData.competitors.map(r => `- ${r.snippet}`).join('\n')}\n\n`;
    }
    
    if (marketData.platforms?.length > 0) {
      researchContext += `PLATFORM TRENDS & BEST PRACTICES:\n${marketData.platforms.map(r => `- ${r.snippet}`).join('\n')}\n\n`;
    }
    
    researchContext += `--- END RESEARCH DATA ---\n\n`;
    console.log('✅ Market research gathered successfully');
  } else {
    console.log('⚠️  No market data found, proceeding with general strategy');
  }

  // Build comprehensive prompt
  const prompt = `You are an expert marketing strategist with access to current market research.

${researchContext}

Campaign Details:
- Campaign Name: ${name}
- Product/Service: ${product_description || 'Not specified'}
- Target Audience: ${target_audience}
- Distribution Channels: ${output_formats?.join(', ') || 'Multiple platforms'}

IMPORTANT: Use the market research data above to inform your recommendations. When suggesting metrics, KPIs, or benchmarks, reference actual data from the research whenever possible. If the research provides specific numbers, use those. Otherwise, provide realistic industry-standard estimates.

Generate a comprehensive, data-driven marketing strategy that includes:

1. CAMPAIGN OBJECTIVES
   - 3-5 specific, measurable goals based on industry benchmarks from the research

2. TARGET AUDIENCE ANALYSIS
   - Demographics and psychographics (use research data)
   - Pain points and desires
   - Media consumption habits (reference platform data from research)

3. KEY MESSAGES & VALUE PROPOSITIONS
   - 3-5 core messages
   - Unique selling points
   - Emotional appeals

4. CONTENT STRATEGY
   - Content pillars with percentage breakdown
   - Posting frequency based on platform best practices
   - Optimal posting times

5. DISTRIBUTION PLAN
   - Platform-specific tactics for: ${output_formats?.slice(0, 5).join(', ')}
   - Organic vs paid strategy informed by research
   - Cross-promotion tactics

6. BUDGET RECOMMENDATIONS
   - Allocation percentages based on industry standards
   - Cost-effective approaches

7. SUCCESS METRICS & KPIs
   - Primary metrics with realistic benchmarks from research
   - Target numbers based on similar campaigns
   - Tools for measurement

8. TIMELINE & MILESTONES
   - Week-by-week action plan
   - Key milestones

9. COMPETITIVE INSIGHTS
   - Analysis of competitor strategies from research
   - Differentiation opportunities

10. OPTIMIZATION RECOMMENDATIONS
    - A/B testing ideas
    - Continuous improvement tactics

Be specific, actionable, and data-driven. When providing metrics or benchmarks, cite whether they come from the research data or are industry estimates.`;

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

    console.log('✅ Strategy generated successfully\n');
    return strategy;
  } catch (error) {
    console.error('AI strategy generation error:', error);
    throw error;
  }
};

// Gemini API call
async function callGeminiAPI(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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
        maxOutputTokens: 8192, // Increased for Gemini 2.5's thinking tokens
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

// Claude API call (placeholder - implement when needed)
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
      max_tokens: 2048,
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

// OpenAI API call (placeholder - implement when needed)
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
      max_tokens: 2048,
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

// Generate content ideas (for later implementation)
export const generateContentIdeasAI = async (campaignData, mediaUrls = []) => {
  const { name, product_description, target_audience, output_formats, ai_provider } = campaignData;

  console.log(`\n🎨 Generating content for: ${name}`);
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

      // Add delay to avoid rate limiting (especially for Gemini free tier)
      if (generatedContent.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
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

    console.log(`✅ Generated ${generatedContent.length} pieces of content\n`);
    return generatedContent;

  } catch (error) {
    console.error('Content generation error:', error);
    throw error;
  }
};