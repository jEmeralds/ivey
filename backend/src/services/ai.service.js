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
  if (brand.brand_name)    lines.push(`Brand Name: ${brand.brand_name}`);
  if (brand.tagline)       lines.push(`Tagline: "${brand.tagline}"`);
  if (brand.industry)      lines.push(`Industry: ${brand.industry}`);
  if (brand.brand_story)   lines.push(`Brand Story: ${brand.brand_story}`);
  if (brand.brand_colors?.length)    lines.push(`Brand Colors: ${brand.brand_colors.join(', ')} — use these throughout`);
  if (brand.photography_style)       lines.push(`Photography Style: ${brand.photography_style} — apply this aesthetic to all visuals`);
  if (brand.visual_mood?.length)     lines.push(`Visual Mood: ${brand.visual_mood.join(', ')} — this is the feeling all content should evoke`);
  if (brand.brand_voice)             lines.push(`Brand Voice: ${brand.brand_voice}`);
  if (brand.words_always?.length)    lines.push(`Words to always use: ${brand.words_always.join(', ')}`);
  if (brand.words_never?.length)     lines.push(`Words to never use: ${brand.words_never.join(', ')}`);
  if (brand.target_personas)         lines.push(`Primary Audience: ${brand.target_personas}`);
  if (brand.pain_points)             lines.push(`Audience Pain Points: ${brand.pain_points}`);
  if (brand.audience_desires)        lines.push(`Audience Desires: ${brand.audience_desires}`);
  if (lines.length === 0) return '';
  return `\n--- BRAND PROFILE ---\n${lines.join('\n')}\nIMPORTANT: Every piece of content must reflect this brand identity. Use the brand voice, colors, and aesthetic consistently. Address the audience's pain points and speak to their desires.\n--- END BRAND PROFILE ---\n`;
}

// ── Build DALL-E visual style from brand ─────────────────────────────────────
function buildVisualStyleFromBrand(brand) {
  if (!brand) return '';
  const parts = [];
  const photoStyleMap = {
    lifestyle:    'lifestyle photography, natural light, real people and environments, warm and authentic',
    studio:       'studio photography, controlled lighting, clean backgrounds, precise and polished',
    documentary:  'documentary style, candid shots, raw and authentic, photojournalistic',
    bold_graphic: 'bold graphic design, strong geometric shapes, flat design aesthetic, high contrast',
    minimalist:   'minimalist photography, generous white space, simple composition, refined and elegant',
  };
  if (brand.photography_style && photoStyleMap[brand.photography_style]) {
    parts.push(photoStyleMap[brand.photography_style]);
  }
  const moodMap = {
    Warm: 'warm golden tones, inviting atmosphere', Cool: 'cool blue tones, fresh and crisp',
    Minimal: 'minimal composition, clean and uncluttered', Vibrant: 'vibrant saturated colors, energetic',
    Dark: 'dark moody atmosphere, dramatic shadows', Earthy: 'earthy natural tones, organic materials',
    Luxurious: 'luxury aesthetic, premium materials, opulent', Playful: 'playful and fun, bright colors, dynamic',
    Bold: 'bold strong visuals, commanding presence', Soft: 'soft pastel tones, gentle and delicate',
    Industrial: 'industrial aesthetic, raw materials, urban', Natural: 'natural organic feel, nature-inspired',
  };
  brand.visual_mood?.forEach(mood => { if (moodMap[mood]) parts.push(moodMap[mood]); });
  return parts.join(', ');
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
export const generateImagesAI = async (campaignData, referenceImageUrl = null) => {
  if (!OPENAI_API_KEY) throw new Error('OpenAI API key not configured');

  const { name, product_description, target_audience, output_formats, brand } = campaignData;
  console.log(`\n🎨 Generating images: ${name}`);
  console.log(`   Formats: ${output_formats?.join(', ')}`);

  const brandContext     = buildBrandContext(brand);
  const brandColorHint   = brand?.brand_colors?.length ? `Use brand colors: ${brand.brand_colors.join(', ')}.` : '';
  const brandVisualStyle = buildVisualStyleFromBrand(brand);

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
      brandVisualStyle ? `Brand visual style: ${brandVisualStyle}.` : '',
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
export const generateCaptionAI = async ({ campaignName, productDescription, targetAudience, format, platform, brand, ai_provider = 'gemini' }) => {
  const brandContext = buildBrandContext(brand);

  const platformGuides = {
    twitter:   'Twitter/X: max 280 characters, punchy hook, 2-3 hashtags, clear CTA',
    instagram: 'Instagram: 150-300 chars, emoji-friendly, 10-15 hashtags, conversational tone',
    facebook:  'Facebook: 2-3 sentences, story-driven, end with a question to boost comments, 3-5 hashtags',
    linkedin:  'LinkedIn: professional tone, insight-led, 3-5 hashtags, thought leadership angle',
    tiktok:    'TikTok: short punchy text, energetic, trending hashtags, call to duet or stitch',
  };

  const guide      = platformGuides[platform] || 'Social media: engaging, clear CTA, relevant hashtags';
  const brandVoice = brand?.brand_voice
    ? `\nBrand Voice: ${brand.brand_voice}. Words to use: ${brand.words_always?.join(', ') || 'none'}. Words to avoid: ${brand.words_never?.join(', ') || 'none'}.`
    : '';

  const prompt = `Write a social media caption.
${brandContext}${brandVoice}
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

// ── Select video bracket — AI decides 30 / 45 / 60 based on campaign ─────────
// Returns: { seconds: 30|45|60, reason: string }
export const selectVideoBracketAI = async ({ campaignName, productDescription, targetAudience, brand, ai_provider = 'gemini' }) => {
  const brandCtx = buildBrandContext(brand);

  const prompt = `You are an expert short-form video strategist.

Analyze this campaign and determine the ideal video duration. You must choose ONLY one of: 30, 45, or 60 seconds. No other duration is valid.

Campaign: ${campaignName}
Product/Service: ${productDescription}
Target Audience: ${targetAudience}
${brandCtx}

BRACKET GUIDE:
- 30 seconds: Simple, single-benefit product. Impulse purchase. Very clear value proposition. Audience already familiar with the category. Best for: flash deals, simple apps, single-feature products.
- 45 seconds: Moderate complexity. Two or three key benefits. Needs context but not a full demo. Best for: lifestyle products, service introductions, brand awareness.
- 60 seconds: Complex product, new category, needs demonstration or education. Multiple benefits. Premium pricing that requires justification. Best for: SaaS, health products, luxury goods, new innovations.

Respond ONLY with a valid JSON object and nothing else — no explanation before or after:
{"seconds": 30, "reason": "one concise sentence explaining why"}`;

  try {
    const raw    = await callAI(ai_provider, prompt);
    const match  = raw.match(/\{[\s\S]*"seconds"[\s\S]*\}/);
    if (!match)  throw new Error('No JSON in response');
    const parsed = JSON.parse(match[0]);
    const secs   = [30, 45, 60].includes(Number(parsed.seconds)) ? Number(parsed.seconds) : 60;
    console.log(`🎯 Bracket selected: ${secs}s — ${parsed.reason}`);
    return { seconds: secs, reason: parsed.reason || '' };
  } catch (e) {
    console.warn('⚠️  Bracket selection failed, defaulting to 60s:', e.message);
    return { seconds: 60, reason: 'Default — campaign complexity could not be assessed' };
  }
};

// ── Generate video script — IVey selects bracket, max 60 seconds ──────────────
// If durationSeconds is passed, it's capped at 60. If not passed, AI selects.
export const generateVideoScriptAI = async ({ campaignName, productDescription, targetAudience, durationSeconds, brand, ai_provider = 'gemini' }) => {
  const MAX_SECONDS = 60;
  const brandContext = buildBrandContext(brand);

  // Determine bracket
  let selectedSeconds = durationSeconds ? Math.min(Number(durationSeconds), MAX_SECONDS) : null;
  let bracketReason   = '';

  // Snap to nearest valid bracket if passed manually
  if (selectedSeconds) {
    if (selectedSeconds <= 30)      selectedSeconds = 30;
    else if (selectedSeconds <= 45) selectedSeconds = 45;
    else                            selectedSeconds = 60;
  } else {
    // AI selects the bracket
    const bracket   = await selectVideoBracketAI({ campaignName, productDescription, targetAudience, brand, ai_provider });
    selectedSeconds = bracket.seconds;
    bracketReason   = bracket.reason;
  }

  const durationLabel = `${selectedSeconds} seconds`;

  // Structure per bracket — gives AI clear guidance without hardcoding word counts
  const structureMap = {
    30: `Structure for 30 seconds:
- Hook [0:00–0:04]: Explosive opener. Bold visual statement or provocative question. Must stop the scroll in the first second.
- Core Message [0:04–0:22]: ONE key benefit, delivered with total clarity and conviction. No fluff.
- CTA [0:22–0:30]: Single specific action. Make it urgent and easy.`,

    45: `Structure for 45 seconds:
- Hook [0:00–0:05]: Grab attention immediately — show the problem or the desire
- Context [0:05–0:20]: Build the story — who this is for and why it matters right now
- Solution [0:20–0:38]: Show the product or service delivering real transformation
- CTA [0:38–0:45]: Clear, specific, urgent call to action`,

    60: `Structure for 60 seconds:
- Hook [0:00–0:06]: Stop the scroll — bold opening that creates immediate curiosity or urgency
- Problem [0:06–0:20]: Make the audience feel the pain point or desire deeply
- Solution [0:20–0:42]: Demonstrate the product — show the transformation, features, and benefits
- Proof [0:42–0:52]: Quick credibility moment — a result, a number, a testimonial, or social proof
- CTA [0:52–1:00]: Exact next step — where to go, what to do, and why right now`,
  };

  const brandVoiceGuide = brand ? `
Brand Voice: ${brand.brand_voice || 'conversational and direct'}
Mood: ${brand.visual_mood?.join(', ') || 'not specified'}
Words to always use: ${brand.words_always?.join(', ') || 'none'}
Words to never use: ${brand.words_never?.join(', ') || 'none'}
Audience Pain Points: ${brand.pain_points || 'not specified'}
Audience Desires: ${brand.audience_desires || 'not specified'}` : '';

  const prompt = `You are a world-class short-form video scriptwriter specializing in viral social content.

Write a complete, production-ready ${durationLabel} video script for HeyGen.

Campaign: ${campaignName}
Product/Service: ${productDescription}
Target Audience: ${targetAudience}
Duration: EXACTLY ${durationLabel}
${brandContext}${brandVoiceGuide}

${structureMap[selectedSeconds]}

SCRIPT FORMAT RULES:
- Write every single word the presenter or narrator will speak
- Format each scene exactly like this:

[0:00–0:05]
(VISUAL: Describe what the camera shows — movement, subject, mood)
The spoken words go here on a new line. Keep it punchy.

- Short sentences. Real spoken language. How people actually talk.
- No bullet points inside the spoken text
- No markdown headers inside the script
- Every second earns its place — cut anything that doesn't serve the message
- The hook must land in the first 2 seconds
- End with a CTA that tells them EXACTLY what to do — specific platform, link, or action

CRITICAL: This script goes directly into HeyGen. A voice AI will read every word. Write for ears, not eyes. Rhythm and natural flow matter more than perfect grammar.

Start immediately with [0:00]. Write the complete script now.`;

  console.log(`\n🎬 Generating ${durationLabel} video script: ${campaignName}${bracketReason ? ` (${bracketReason})` : ''}`);
  const script = await callAI(ai_provider, prompt);
  console.log('✅ Video script done\n');

  return { script, seconds: selectedSeconds, bracketReason };
};
