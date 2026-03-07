// AI Service - Handles all AI provider integrations
import fetch from 'node-fetch';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const BRAVE_SEARCH_API_KEY = process.env.BRAVE_SEARCH_API_KEY; // Optional

const MARKDOWN_SYSTEM_INSTRUCTION = `You are an expert marketing strategist. Format ALL responses using clean, beautiful markdown:
- Use ## for main section headers
- Use ### for sub-headers
- Use **bold** for key terms, important points, and emphasis
- Use *italics* for supporting details or secondary emphasis
- Use bullet points (-) for unordered lists
- Use numbered lists (1. 2. 3.) for steps, rankings, or sequences
- Use > blockquotes for important callouts, insights, or highlighted recommendations
- Add a blank line between sections for readability
- Use --- for section dividers where appropriate
- Never output raw asterisks like ***text*** without proper markdown context
- Structure content so it is easy to scan and read at a glance
Your output will be rendered in a markdown viewer, so make it visually rich, well-structured, and professional.`;

// Search the web for market intelligence
async function searchMarketData(campaignData) {
  const { name, product_description, target_audience, output_formats } = campaignData;
  
  console.log('🔍 Searching web for market intelligence...');
  
  const searches = [];
  
  try {
    const benchmarkQuery = `${product_description || name} marketing benchmarks engagement rates 2024`;
    searches.push(searchWeb(benchmarkQuery, 'benchmarks'));
    
    const audienceQuery = `${target_audience} demographics behavior online platforms 2024`;
    searches.push(searchWeb(audienceQuery, 'audience'));
    
    const competitorQuery = `${product_description || name} successful marketing campaigns examples`;
    searches.push(searchWeb(competitorQuery, 'competitors'));
    
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
    return null;
  }
}

async function searchWeb(query, type) {
  console.log(`  Searching: ${query.substring(0, 60)}...`);
  
  if (BRAVE_SEARCH_API_KEY) {
    return await searchBrave(query);
  }
  
  return await searchDuckDuckGo(query);
}

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

async function searchDuckDuckGo(query) {
  try {
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
    
    if (!response.ok) throw new Error('DuckDuckGo search failed');
    
    const data = await response.json();
    const results = [];
    
    if (data.AbstractText) {
      results.push({
        title: data.Heading || 'Overview',
        snippet: data.AbstractText,
        url: data.AbstractURL
      });
    }
    
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
  
  const marketData = await searchMarketData(campaignData);
  
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

  const prompt = `You are an expert marketing strategist with access to current market research.

${researchContext}

Campaign Details:
- Campaign Name: ${name}
- Product/Service: ${product_description || 'Not specified'}
- Target Audience: ${target_audience}
- Distribution Channels: ${output_formats?.join(', ') || 'Multiple platforms'}

IMPORTANT: Use the market research data above to inform your recommendations. When suggesting metrics, KPIs, or benchmarks, reference actual data from the research whenever possible. If the research provides specific numbers, use those. Otherwise, provide realistic industry-standard estimates.

Generate a comprehensive, data-driven marketing strategy that includes:

## 1. CAMPAIGN OBJECTIVES
- 3-5 specific, measurable goals based on industry benchmarks from the research

## 2. TARGET AUDIENCE ANALYSIS
- Demographics and psychographics (use research data)
- Pain points and desires
- Media consumption habits (reference platform data from research)

## 3. KEY MESSAGES & VALUE PROPOSITIONS
- 3-5 core messages
- Unique selling points
- Emotional appeals

## 4. CONTENT STRATEGY
- Content pillars with percentage breakdown
- Posting frequency based on platform best practices
- Optimal posting times

## 5. DISTRIBUTION PLAN
- Platform-specific tactics for: ${output_formats?.slice(0, 5).join(', ')}
- Organic vs paid strategy informed by research
- Cross-promotion tactics

## 6. BUDGET RECOMMENDATIONS
- Allocation percentages based on industry standards
- Cost-effective approaches

## 7. SUCCESS METRICS & KPIs
- Primary metrics with realistic benchmarks from research
- Target numbers based on similar campaigns
- Tools for measurement

## 8. TIMELINE & MILESTONES
- Week-by-week action plan
- Key milestones

## 9. COMPETITIVE INSIGHTS
- Analysis of competitor strategies from research
- Differentiation opportunities

## 10. OPTIMIZATION RECOMMENDATIONS
- A/B testing ideas
- Continuous improvement tactics

Be specific, actionable, and data-driven. Use proper markdown formatting throughout with headers, bold text, bullet points, and numbered lists.`;

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
      systemInstruction: {
        parts: [{ text: MARKDOWN_SYSTEM_INSTRUCTION }]
      },
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
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
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    console.error('Invalid Gemini response structure:', JSON.stringify(data, null, 2));
    throw new Error('Invalid response from Gemini API');
  }
  
  if (!data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
    console.error('Gemini response has no parts (content may be blocked)');
    console.error('Full response:', JSON.stringify(data, null, 2));
    
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

  const formattedPrompt = `${MARKDOWN_SYSTEM_INSTRUCTION}\n\n${prompt}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content: formattedPrompt
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
      messages: [
        {
          role: 'system',
          content: MARKDOWN_SYSTEM_INSTRUCTION
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 8192,
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

// Generate content ideas
export const generateContentIdeasAI = async (campaignData, mediaUrls = []) => {
  const { name, product_description, target_audience, output_formats, ai_provider } = campaignData;

  console.log(`\n🎨 Generating content for: ${name}`);
  console.log(`   Formats: ${output_formats?.length || 0} selected`);
  console.log(`   Provider: ${ai_provider}`);

  let mediaContext = '';
  if (mediaUrls && mediaUrls.length > 0) {
    mediaContext = `\n\nUPLOADED MEDIA:\nThe campaign has ${mediaUrls.length} media file(s) uploaded (product images/videos). Consider these visuals when creating content - reference the product's appearance, colors, and key visual elements in your content suggestions.\n`;
  }

  const formatPrompts = {
    'TIKTOK': `Create a viral 30-second TikTok script for **"${name}"**.

**Product:** ${product_description}
**Target Audience:** ${target_audience}${mediaContext}

Structure your response as follows:

## Hook (0-3 sec)
[Attention-grabbing opening line]

## Body (3-25 sec)
[Main content with product showcase - include visual cues and text overlay suggestions]

## CTA (25-30 sec)
[Strong call to action]

---

## Production Notes
- **Trending sound suggestions**
- **Visual cues and transitions**
- **Text overlays**
- **Recommended hashtags**`,

    'INSTAGRAM_CAPTION': `Write an engaging Instagram caption for **"${name}"**.

**Product:** ${product_description}
**Target Audience:** ${target_audience}${mediaContext}

## Caption
[Write the full caption here with hook, body, and CTA]

## Hashtags
[List 15-20 relevant hashtags]

## Posting Tips
- Best time to post
- Suggested image/video style`,

    'YOUTUBE_VIDEO_AD': `Create a 60-second YouTube video ad script for **"${name}"**.

**Product:** ${product_description}
**Target Audience:** ${target_audience}${mediaContext}

## Script

**0-5 SEC — Hook**
[Grab attention immediately]

**5-15 SEC — Problem**
[Pain point the audience faces]

**15-40 SEC — Solution**
[How the product solves it with visual directions]

**40-50 SEC — Social Proof**
[Features and credibility]

**50-60 SEC — CTA**
[Strong call to action]

---

## Key Selling Points
[List the main product benefits to highlight]`,

    'FACEBOOK_POST': `Write a Facebook post for **"${name}"**.

**Product:** ${product_description}
**Target Audience:** ${target_audience}${mediaContext}

## Post Content
[Write the full post - conversational, story-driven, 2-3 paragraphs]

## Hashtags
[3-5 relevant hashtags]

## Engagement Tips
- Suggested question to boost comments
- Best time to post`,

    'TWITTER_POST': `Create 3 Twitter/X post variations for **"${name}"**.

**Product:** ${product_description}
**Target Audience:** ${target_audience}${mediaContext}

## Variation 1 — Direct Benefit
[Tweet under 280 characters]

## Variation 2 — Problem/Solution
[Tweet under 280 characters]

## Variation 3 — Social Proof / FOMO
[Tweet under 280 characters]

---

> Each tweet includes relevant hashtags (2-3) and a clear CTA.`,

    'LINKEDIN_POST': `Write a professional LinkedIn post for **"${name}"**.

**Product:** ${product_description}
**Target Audience:** ${target_audience}${mediaContext}

## Post Content
[Professional but engaging hook, industry insight, solution, CTA]

## Hashtags
[3-5 professional hashtags]

## Engagement Strategy
- Best time to post on LinkedIn
- Suggested follow-up comment to pin`,

    'YOUTUBE_SHORTS': `Create a YouTube Shorts script (60 seconds) for **"${name}"**.

**Product:** ${product_description}
**Target Audience:** ${target_audience}${mediaContext}

## Script

**0-3 SEC — Hook**
[Stop the scroll — bold opening]

**3-45 SEC — Content**
[Fast-paced delivery with visual cues and text overlays]

**45-60 SEC — CTA**
[Subscribe prompt + call to action]

---

## Production Notes
- Pacing and editing style
- Text overlay suggestions
- Music/sound recommendation`,

    'BANNER_AD': `Design banner ad copy for **"${name}"**.

**Product:** ${product_description}
**Target Audience:** ${target_audience}${mediaContext}

## Ad Copy

**Main Headline** *(5-7 words)*
[Powerful headline]

**Subheadline** *(10-15 words)*
[Benefit-focused subheadline]

**CTA Button Text** *(2-4 words)*
[Action-oriented button text]

---

## Design Suggestions
- **Color palette:** [suggestions]
- **Imagery style:** [suggestions]
- **Font style:** [suggestions]

## Size Variations
- 728x90 (Leaderboard)
- 300x250 (Medium Rectangle)
- 160x600 (Wide Skyscraper)`,

    'GOOGLE_SEARCH_AD': `Write Google Search Ad copy for **"${name}"**.

**Product:** ${product_description}
**Target Audience:** ${target_audience}${mediaContext}

## Ad Variation 1
- **Headline 1** *(max 30 chars):*
- **Headline 2** *(max 30 chars):*
- **Headline 3** *(max 30 chars):*
- **Description 1** *(max 90 chars):*
- **Description 2** *(max 90 chars):*

## Ad Variation 2
- **Headline 1** *(max 30 chars):*
- **Headline 2** *(max 30 chars):*
- **Headline 3** *(max 30 chars):*
- **Description 1** *(max 90 chars):*
- **Description 2** *(max 90 chars):*

## Ad Variation 3
- **Headline 1** *(max 30 chars):*
- **Headline 2** *(max 30 chars):*
- **Headline 3** *(max 30 chars):*
- **Description 1** *(max 90 chars):*
- **Description 2** *(max 90 chars):*

---

## Display URL Suggestions
- [path1/path2 suggestions]`,

    'FLYER_TEXT': `Create flyer content for **"${name}"**.

**Product:** ${product_description}
**Target Audience:** ${target_audience}${mediaContext}

## Headline
[Attention-grabbing main headline]

## Key Benefits
1. [Benefit 1]
2. [Benefit 2]
3. [Benefit 3]
4. [Benefit 4]
5. [Benefit 5]

## Special Offer
[Promotion or offer text]

## Call to Action
[Clear next step]

## Contact / Location
[Placeholder for contact info]

---

## Layout Suggestions
- [Design and placement recommendations]`,

    'PRINT_AD': `Write print advertisement copy for **"${name}"**.

**Product:** ${product_description}
**Target Audience:** ${target_audience}${mediaContext}

## Headline
[Powerful, memorable headline]

## Body Copy
[3-4 sentences, benefit-focused, magazine-quality]

## Tagline
[Memorable brand slogan]

## Call to Action
[Clear next step]

---

## Visual Concept
- **Image area:** [description]
- **Layout:** [headline placement, image balance]
- **Tone:** [visual style guidance]`,

    'EMAIL_MARKETING': `Create an email marketing campaign for **"${name}"**.

**Product:** ${product_description}
**Target Audience:** ${target_audience}${mediaContext}

## Email Details

**Subject Line** *(max 50 chars):*
[High open-rate subject line]

**Preview Text** *(max 100 chars):*
[Compelling preview text]

---

## Email Body

### Opening
[Personalized, engaging hook]

### Main Value Section
[Core message and product benefit]

### Social Proof / Features
[Credibility and key features]

### Call to Action
**[CTA Button Text]** → [URL placeholder]

---

*P.S. [Urgency or bonus line]*

---

## Campaign Notes
- Best send time
- A/B test suggestion for subject line`
  };

  try {
    const generatedContent = [];

    for (const format of output_formats || []) {
      const formatKey = format;
      const prompt = formatPrompts[formatKey];

      if (!prompt) {
        console.log(`⚠️  No prompt template for format: ${format}`);
        continue;
      }

      console.log(`  Generating: ${format}...`);

      if (generatedContent.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
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
// ─── REPLACE the existing generateVisualAI function in ai.service.js ─────────
// Find: "export const generateVisualAI = async"
// Replace the entire function with this:

export const generateVisualAI = async ({ campaignName, productDescription, targetAudience, format, adCopy, referenceImageUrl }) => {
  if (!OPENAI_API_KEY) throw new Error('OpenAI API key not configured. DALL-E requires an OpenAI key.');

  console.log(`\n🎨 Generating visual for: ${campaignName} — ${format}`);

  const formatStyles = {
    'TIKTOK':     'vertical social media video thumbnail, bold colors, Gen-Z aesthetic, energetic and dynamic',
    'INSTAGRAM_CAPTION': 'square social media post, lifestyle photography style, Instagram aesthetic, vibrant',
    'FACEBOOK_POST':     'social media post visual, engaging, community-focused, warm and approachable',
    'TWITTER_POST':      'social media graphic, clean minimal design, bold statement visual',
    'LINKEDIN_POST':     'professional business visual, corporate aesthetic, clean and authoritative',
    'YOUTUBE_VIDEO_AD':  'YouTube video thumbnail, bold text overlay, high contrast, cinematic',
    'YOUTUBE_SHORTS':    'vertical video thumbnail, bold colors, dynamic composition, modern',
    'BANNER_AD':         'professional digital banner advertisement, wide horizontal format, bold typography, clean modern design',
    'PRINT_AD':          'high-quality print advertisement, magazine-style layout, professional photography aesthetic',
    'FLYER_TEXT':        'eye-catching promotional flyer, vibrant colors, clear hierarchy, modern graphic design',
    'GOOGLE_SEARCH_AD':  'clean minimal digital ad visual, professional, corporate style',
    'EMAIL_MARKETING':    'email header graphic, professional, clean layout, business aesthetic',
    'SMS_MESSAGE': `Write 3 SMS marketing message variations for **"${name}"**.

**Product:** ${product_description}
**Target Audience:** ${target_audience}${mediaContext}

## Variation 1 — Direct Offer
[Under 160 characters with CTA]

## Variation 2 — Urgency
[Under 160 characters with deadline]

## Variation 3 — Curiosity
[Under 160 characters with intrigue]

---

> Each SMS includes opt-out reminder placeholder: "Reply STOP to unsubscribe"`,
  };

  const styleGuide = formatStyles[format?.toLowerCase()] || 'professional marketing visual, clean modern design';

  const copySnippet = adCopy
    ? adCopy.replace(/[#*>\-]/g, '').split('\n').find(l => l.trim().length > 10)?.trim().slice(0, 80) || ''
    : '';

  // ── Step 1: If reference image provided, use GPT-4o Vision to describe it ──
  let productVisualDescription = '';
  if (referenceImageUrl) {
    console.log('   🔍 Analyzing reference image with GPT-4o Vision...');
    try {
      const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: referenceImageUrl, detail: 'low' }
              },
              {
                type: 'text',
                text: 'Describe this product/image in 2-3 sentences focusing on: colors, visual style, key elements, and aesthetic. Be specific and concise. This description will be used to generate a marketing visual that matches this product.'
              }
            ]
          }]
        })
      });

      if (visionResponse.ok) {
        const visionData = await visionResponse.json();
        productVisualDescription = visionData.choices?.[0]?.message?.content || '';
        console.log(`   ✅ Vision description: ${productVisualDescription.slice(0, 80)}...`);
      }
    } catch (err) {
      console.warn('   ⚠️ Vision analysis failed, proceeding without reference:', err.message);
    }
  }

  // ── Step 2: Build DALL-E prompt ────────────────────────────────────────────
  const dallePrompt = [
    `${styleGuide} for a marketing campaign called "${campaignName}".`,
    `Product/service: ${productDescription?.slice(0, 100) || campaignName}.`,
    `Target audience: ${targetAudience?.slice(0, 60) || 'general audience'}.`,
    copySnippet ? `Key message: "${copySnippet}".` : '',
    productVisualDescription ? `Product visual reference: ${productVisualDescription}` : '',
    'Style: photorealistic, high quality, commercial advertising aesthetic. No text or typography in the image. Professional lighting.'
  ].filter(Boolean).join(' ');

  console.log(`   Prompt: ${dallePrompt.slice(0, 100)}...`);

  // ── Step 3: Call DALL-E 3 ─────────────────────────────────────────────────
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: dallePrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`DALL-E error: ${error.error?.message || 'Image generation failed'}`);
  }

  const data = await response.json();
  console.log('✅ Visual generated successfully');

  return {
    imageUrl:      data.data[0].url,
    revisedPrompt: data.data[0].revised_prompt,
    usedReference: !!productVisualDescription,
    format,
    generatedAt:   new Date().toISOString()
  };
};