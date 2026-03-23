// AI Service — Image-first. Generates DALL-E visuals per format.
// Captions are generated at share time via generateCaptionAI, not at campaign creation.
import fetch from 'node-fetch';

const GEMINI_API_KEY       = process.env.GEMINI_API_KEY;
const ANTHROPIC_API_KEY    = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY       = process.env.OPENAI_API_KEY;
const BRAVE_SEARCH_API_KEY = process.env.BRAVE_SEARCH_API_KEY;

// ── Format config — mirrors outputFormats.js ──────────────────────────────────
const FORMAT_CONFIG = {
  BANNER_AD:         { size: '1792x1024', style: 'wide horizontal digital banner advertisement, bold composition, high contrast, clean modern design, landscape' },
  POSTER:            { size: '1024x1792', style: 'tall portrait promotional poster, dramatic composition, bold visual, professional print quality, portrait' },
  FLYER:             { size: '1024x1792', style: 'compact promotional flyer, vibrant eye-catching design, clear visual hierarchy, modern graphic design, portrait' },
  INSTAGRAM_POST:    { size: '1024x1024', style: 'square Instagram feed post, lifestyle photography aesthetic, vibrant and scroll-stopping, social media optimized' },
  INSTAGRAM_STORY:   { size: '1024x1792', style: 'vertical Instagram Story, full-bleed bold visual, mobile-first design, energetic and immersive, portrait' },
  YOUTUBE_THUMBNAIL: { size: '1792x1024', style: 'YouTube video thumbnail, bold high-contrast cinematic composition, click-worthy, landscape' },
};

const MARKDOWN_SYSTEM = `You are an expert marketing strategist. Format responses using clean markdown with ## headers, **bold**, bullet points, and > blockquotes. Be specific and actionable.`;

// ── Brand context builder ─────────────────────────────────────────────────────
function buildBrandContext(brand) {
  if (!brand) return '';
  const lines = [];
  if (brand.brand_name)        lines.push(`Brand Name: ${brand.brand_name}`);
  if (brand.tagline)           lines.push(`Tagline: "${brand.tagline}"`);
  if (brand.industry)          lines.push(`Industry: ${brand.industry}`);
  if (brand.target_personas)   lines.push(`Brand Audience: ${brand.target_personas}`);
  if (brand.brand_colors?.length) lines.push(`Brand Colors: ${brand.brand_colors.join(', ')}`);
  return lines.length ? `\nBRAND PROFILE:\n${lines.join('\n')}\n` : '';
}

// ── Web search ────────────────────────────────────────────────────────────────
async function searchWeb(query) {
  if (BRAVE_SEARCH_API_KEY) {
    try {
      const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`, {
        headers: { Accept: 'application/json', 'X-Subscription-Token': BRAVE_SEARCH_API_KEY }
      });
      if (res.ok) {
        const d = await res.json();
        return d.web?.results?.slice(0,5).map(r => ({ snippet: r.description })) || [];
      }
    } catch(e) { console.warn('Brave search error:', e.message); }
  }
  try {
    const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
    if (res.ok) {
      const d = await res.json();
      const results = [];
      if (d.AbstractText) results.push({ snippet: d.AbstractText });
      d.RelatedTopics?.slice(0,4).forEach(t => { if (t.Text) results.push({ snippet: t.Text }); });
      return results;
    }
  } catch(e) { console.warn('DDG error:', e.message); }
  return [];
}

// ── AI provider calls ─────────────────────────────────────────────────────────
async function callGemini(prompt) {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: MARKDOWN_SYSTEM }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
    })
  });
  if (!res.ok) { const e = await res.json(); throw new Error(`Gemini error: ${e.error?.message}`); }
  const data = await res.json();
  if (!data.candidates?.[0]?.content?.parts?.length) throw new Error('Gemini returned no content');
  return data.candidates[0].content.parts[0].text;
}

async function callClaude(prompt) {
  if (!ANTHROPIC_API_KEY) throw new Error('Anthropic API key not configured');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', max_tokens: 8192, system: MARKDOWN_SYSTEM, messages: [{ role: 'user', content: prompt }] })
  });
  if (!res.ok) { const e = await res.json(); throw new Error(`Claude error: ${e.error?.message}`); }
  const data = await res.json();
  return data.content[0].text;
}

async function callOpenAI(prompt) {
  if (!OPENAI_API_KEY) throw new Error('OpenAI API key not configured');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: MARKDOWN_SYSTEM }, { role: 'user', content: prompt }], max_tokens: 8192, temperature: 0.7 })
  });
  if (!res.ok) { const e = await res.json(); throw new Error(`OpenAI error: ${e.error?.message}`); }
  const data = await res.json();
  return data.choices[0].message.content;
}

function callAI(provider, prompt) {
  switch (provider) {
    case 'claude': return callClaude(prompt);
    case 'openai': return callOpenAI(prompt);
    default:       return callGemini(prompt);
  }
}

// ── Generate marketing strategy ───────────────────────────────────────────────
export const generateMarketingStrategyAI = async (campaignData) => {
  const { name, product_description, target_audience, output_formats, ai_provider, brand } = campaignData;
  console.log(`\n📊 Strategy: ${name} (${ai_provider})`);

  const [benchmarks, audience] = await Promise.all([
    searchWeb(`${product_description || name} visual marketing benchmarks 2024`),
    searchWeb(`${target_audience} visual content preferences platforms 2024`),
  ]);

  const brandContext = buildBrandContext(brand);
  let researchContext = '';
  if (benchmarks?.length || audience?.length) {
    researchContext = '\nMARKET RESEARCH:\n';
    if (benchmarks?.length) researchContext += `Benchmarks:\n${benchmarks.map(r => `- ${r.snippet}`).join('\n')}\n\n`;
    if (audience?.length)   researchContext += `Audience:\n${audience.map(r => `- ${r.snippet}`).join('\n')}\n`;
  }

  const prompt = `You are an expert visual marketing strategist.
${brandContext}${researchContext}

Campaign: ${name}
Product: ${product_description}
Audience: ${target_audience}
Visual Formats: ${output_formats?.join(', ')}

Generate a comprehensive visual marketing strategy:

## 1. CAMPAIGN OBJECTIVES
3-5 measurable goals tied to visual content

## 2. TARGET AUDIENCE ANALYSIS
Demographics, psychographics, visual content preferences, platform behavior

## 3. VISUAL BRAND DIRECTION
Color palette, photography style, mood and tone, typography direction

## 4. FORMAT STRATEGY
For each format (${output_formats?.join(', ')}): key message, visual composition, primary CTA

## 5. CONTENT CALENDAR
Posting frequency, campaign phases, timing

## 6. SUCCESS METRICS
Engagement benchmarks, click-through targets, brand awareness KPIs

## 7. DISTRIBUTION PLAN
Platform tactics, paid vs organic, audience targeting

Focus entirely on visual content strategy. Be specific and actionable.`;

  const strategy = await callAI(ai_provider, prompt);
  console.log('✅ Strategy done\n');
  return strategy;
};

// ── Generate images — PRIMARY FUNCTION ───────────────────────────────────────
// One DALL-E image per selected format. Replaces generateContentIdeasAI.
export const generateImagesAI = async (campaignData, referenceImageUrl = null) => {
  if (!OPENAI_API_KEY) throw new Error('OpenAI API key not configured');

  const { name, product_description, target_audience, output_formats, brand } = campaignData;
  console.log(`\n🎨 Generating images: ${name}`);
  console.log(`   Formats: ${output_formats?.join(', ')}`);

  const brandContext = buildBrandContext(brand);
  const brandColorHint = brand?.brand_colors?.length ? `Use brand colors: ${brand.brand_colors.join(', ')}.` : '';

  // Analyse reference image if provided
  let productVisualDescription = '';
  if (referenceImageUrl) {
    console.log('   🔍 Analysing reference image...');
    try {
      const vRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o', max_tokens: 200,
          messages: [{ role: 'user', content: [
            { type: 'image_url', image_url: { url: referenceImageUrl, detail: 'low' } },
            { type: 'text', text: 'Describe this product in 2-3 sentences: colors, visual style, key elements, aesthetic. Be specific.' }
          ]}]
        })
      });
      if (vRes.ok) {
        const vd = await vRes.json();
        productVisualDescription = vd.choices?.[0]?.message?.content || '';
        console.log(`   ✅ Vision: ${productVisualDescription.slice(0, 60)}...`);
      }
    } catch(e) { console.warn('   ⚠️ Vision failed:', e.message); }
  }

  const results = [];

  for (const format of output_formats || []) {
    const config = FORMAT_CONFIG[format];
    if (!config) { console.warn(`⚠️ No config for: ${format}`); continue; }

    console.log(`   Generating ${format} (${config.size})...`);
    if (results.length > 0) await new Promise(r => setTimeout(r, 1500));

    const dallePrompt = [
      `${config.style}.`,
      `Marketing campaign: "${name}".`,
      `Product: ${product_description?.slice(0, 120) || name}.`,
      `Audience: ${target_audience?.slice(0, 80) || 'general'}.`,
      brand?.brand_name ? `Brand: ${brand.brand_name}.` : '',
      brandColorHint,
      productVisualDescription ? `Product visual reference: ${productVisualDescription}.` : '',
      'Photorealistic, high quality, commercial advertising aesthetic. No text, no words, no typography in the image. Professional lighting.',
    ].filter(Boolean).join(' ');

    try {
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({ model: 'dall-e-3', prompt: dallePrompt, n: 1, size: config.size, quality: 'standard', response_format: 'url' })
      });
      if (!res.ok) {
        const err = await res.json();
        console.error(`   ✗ ${format}:`, err.error?.message);
        results.push({ format, error: err.error?.message || 'Generation failed' });
        continue;
      }
      const data = await res.json();
      console.log(`   ✅ ${format} done`);
      results.push({ format, imageUrl: data.data[0].url, revisedPrompt: data.data[0].revised_prompt, size: config.size, generatedAt: new Date().toISOString() });
    } catch(e) {
      console.error(`   ✗ ${format}:`, e.message);
      results.push({ format, error: e.message });
    }
  }

  console.log(`✅ ${results.filter(r => r.imageUrl).length}/${output_formats?.length} images done\n`);
  return results;
};

// ── Generate caption — called at share time ───────────────────────────────────
// platform: 'twitter' | 'instagram' | 'facebook' | 'linkedin' | 'tiktok'
export const generateCaptionAI = async ({ campaignName, productDescription, targetAudience, format, platform, brand, ai_provider = 'gemini' }) => {
  const brandContext = buildBrandContext(brand);

  const platformGuides = {
    twitter:   'Twitter/X: max 280 characters, punchy hook, 2-3 hashtags, clear CTA',
    instagram: 'Instagram: 150-300 chars, emoji-friendly, 10-15 hashtags, conversational tone',
    facebook:  'Facebook: 2-3 sentences, story-driven, end with a question to boost comments, 3-5 hashtags',
    linkedin:  'LinkedIn: professional tone, insight-led, 3-5 hashtags, thought leadership angle',
    tiktok:    'TikTok: short punchy text, energetic, trending hashtags, call to duet or stitch',
  };

  const guide = platformGuides[platform] || 'Social media: engaging, clear CTA, relevant hashtags';

  const prompt = `Write a social media caption.
${brandContext}
Platform rules: ${guide}
Campaign: ${campaignName}
Product/Service: ${productDescription}
Target Audience: ${targetAudience}
Visual format this caption accompanies: ${format}

Output ONLY the caption text ready to copy and paste. No explanations, no options, no markdown headers. Just the caption and hashtags.`;

  console.log(`\n💬 Generating ${platform} caption for ${format}...`);
  const caption = await callAI(ai_provider, prompt);
  console.log('✅ Caption done\n');
  return caption;
};

// ── generateVisualAI — kept for legacy /generate-visual endpoint ──────────────
export const generateVisualAI = async ({ campaignName, productDescription, targetAudience, format, adCopy, referenceImageUrl, isThumbnail }) => {
  if (!OPENAI_API_KEY) throw new Error('OpenAI API key not configured');

  console.log(`\n🎨 Visual: ${campaignName} — ${format}`);

  const config = FORMAT_CONFIG[format] || { size: '1024x1024', style: 'professional marketing visual, clean modern design' };

  let productVisualDescription = '';
  if (referenceImageUrl) {
    try {
      const vRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({ model: 'gpt-4o', max_tokens: 300, messages: [{ role: 'user', content: [
          { type: 'image_url', image_url: { url: referenceImageUrl, detail: 'low' } },
          { type: 'text', text: 'Describe this product in 2-3 sentences: colors, style, key elements.' }
        ]}]})
      });
      if (vRes.ok) { const vd = await vRes.json(); productVisualDescription = vd.choices?.[0]?.message?.content || ''; }
    } catch(e) { console.warn('Vision failed:', e.message); }
  }

  const copySnippet = adCopy ? adCopy.replace(/[#*>\-]/g,'').split('\n').find(l => l.trim().length > 10)?.trim().slice(0,80) || '' : '';

  const dallePrompt = [
    isThumbnail ? 'YouTube thumbnail, bold high-contrast cinematic, landscape.' : `${config.style}.`,
    `Campaign: "${campaignName}". Product: ${productDescription?.slice(0,100) || campaignName}.`,
    `Audience: ${targetAudience?.slice(0,60) || 'general'}.`,
    copySnippet ? `Context: "${copySnippet}".` : '',
    productVisualDescription ? `Product visual: ${productVisualDescription}.` : '',
    'Photorealistic, commercial advertising. No text or typography. Professional lighting.',
  ].filter(Boolean).join(' ');

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({ model: 'dall-e-3', prompt: dallePrompt, n: 1, size: isThumbnail ? '1792x1024' : config.size, quality: 'standard', response_format: 'url' })
  });

  if (!res.ok) { const e = await res.json(); throw new Error(`DALL-E error: ${e.error?.message}`); }
  const data = await res.json();
  console.log('✅ Visual done');

  return { imageUrl: data.data[0].url, revisedPrompt: data.data[0].revised_prompt, usedReference: !!productVisualDescription, format, generatedAt: new Date().toISOString() };
};

// ── Generate video script ─────────────────────────────────────────────────────
// duration_seconds: how long the video should be
// brand: full brand profile with voice, tone, style etc.
export const generateVideoScriptAI = async ({ campaignName, productDescription, targetAudience, durationSeconds, brand, ai_provider = 'gemini' }) => {
  const wordCount = Math.round(durationSeconds * 130 / 60);
  const duration  = durationSeconds < 60
    ? `${durationSeconds} seconds`
    : `${Math.floor(durationSeconds / 60)} minute${Math.floor(durationSeconds / 60) > 1 ? 's' : ''}${durationSeconds % 60 > 0 ? ` ${durationSeconds % 60} seconds` : ''}`;

  const brandContext = buildBrandContext(brand);

  // Build structure based on duration
  let structure = '';
  if (durationSeconds <= 30) {
    structure = `Structure:
- Hook (0–3s): Immediately grab attention — bold statement, question, or surprising visual
- CTA (3–${durationSeconds}s): Drive one clear action`;
  } else if (durationSeconds <= 90) {
    structure = `Structure:
- Hook (0–5s): Stop the scroll immediately
- Problem (5–30s): Name the pain point your audience feels
- Solution (30–${Math.round(durationSeconds * 0.8)}s): Show how ${campaignName} solves it
- CTA (${Math.round(durationSeconds * 0.8)}–${durationSeconds}s): One clear call to action`;
  } else if (durationSeconds <= 180) {
    structure = `Structure:
- Hook (0–10s): Bold opening that stops the viewer
- Problem (10–40s): Build the pain point with empathy
- Solution (40–${Math.round(durationSeconds * 0.7)}s): Demonstrate the product clearly
- Social Proof (${Math.round(durationSeconds * 0.7)}–${Math.round(durationSeconds * 0.88)}s): Credibility and results
- CTA (${Math.round(durationSeconds * 0.88)}–${durationSeconds}s): Clear next step`;
  } else if (durationSeconds <= 300) {
    structure = `Structure:
- Hook (0–15s): Compelling opening
- Problem (15–60s): Deep dive into audience pain points
- Solution (60–${Math.round(durationSeconds * 0.65)}s): Full product demonstration
- Social Proof (${Math.round(durationSeconds * 0.65)}–${Math.round(durationSeconds * 0.85)}s): Results and testimonials
- CTA (${Math.round(durationSeconds * 0.85)}–${durationSeconds}s): Offer and next steps`;
  } else {
    structure = `Structure:
- Hook & Promise (0–30s): Bold statement of what the viewer will gain
- Context (30–120s): Background, problem, and why it matters
- Core Content (120–${Math.round(durationSeconds * 0.65)}s): Main value, chapters, demonstration
- Proof (${Math.round(durationSeconds * 0.65)}–${Math.round(durationSeconds * 0.85)}s): Evidence, testimonials, data
- CTA (${Math.round(durationSeconds * 0.85)}–${durationSeconds}s): Clear next steps and offer`;
  }

  const brandVoiceGuide = brand ? `
Brand Voice: ${brand.brand_voice || 'conversational'}
Words to use: ${brand.words_always?.join(', ') || 'none specified'}
Words to avoid: ${brand.words_never?.join(', ') || 'none specified'}
Photography/visual style: ${brand.photography_style || 'lifestyle'}` : '';

  const prompt = `You are an expert video scriptwriter. Write a complete, production-ready video script.

Campaign: ${campaignName}
Product/Service: ${productDescription}
Target Audience: ${targetAudience}
Duration: ${duration} (exactly ${durationSeconds} seconds)
Target word count: ~${wordCount} words (spoken at 130 words/minute)
${brandContext}${brandVoiceGuide}

${structure}

SCRIPT FORMAT RULES:
- Write every word that will be SPOKEN by the presenter/narrator
- Each scene starts with a timestamp e.g. [0:00–0:05]
- After the timestamp, add a brief VISUAL NOTE in (parentheses) — what the camera shows
- Then write the exact spoken words on a new line
- Keep sentences short and punchy — this is spoken, not read
- No markdown headers, no bullet points in the spoken text
- The spoken words must flow naturally when read aloud
- End with a strong, specific CTA — tell them exactly what to do

Write the full script now. Start immediately with [0:00].`;

  console.log(`\n🎬 Generating ${duration} video script for: ${campaignName}`);
  const script = await callAI(ai_provider, prompt);
  console.log('✅ Video script done\n');
  return script;
};