// ═══════════════════════════════════════════════════════════════════════════════
// IVey AI Engine — v2.0
// Video-first. Viral-aware. Brand-intelligent. Provider-flexible.
//
// Architecture:
//   1. PROVIDER LAYER   — routes to correct AI, free/paid tier aware
//   2. RESEARCH LAYER   — web intelligence for every campaign
//   3. BRAND LAYER      — injects brand identity into every prompt
//   4. INTELLIGENCE     — bracket selection, hook angle
//   5. GENERATION       — scripts, captions, strategies, hook variants
//   6. SCORING          — viral score every script automatically
//
// Single source of truth. Replaces:
//   - ai.service.comprehensive.js
//   - ideaGeneration.service.js
//   - multiFormatGenerator.service.js
//   - viralScoring.service.js
//   - aiProvider.service.js (provider logic absorbed here)
// ═══════════════════════════════════════════════════════════════════════════════

import fetch from 'node-fetch';

// ── Environment ───────────────────────────────────────────────────────────────
const GEMINI_API_KEY       = process.env.GEMINI_API_KEY;
const ANTHROPIC_API_KEY    = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY       = process.env.OPENAI_API_KEY;
const BRAVE_SEARCH_API_KEY = process.env.BRAVE_SEARCH_API_KEY;

// ── Provider Registry ─────────────────────────────────────────────────────────
// tier: 'free'  — available on all plans including development
// tier: 'paid'  — unlocked for Pro/Enterprise users
// Adding a new provider in future = add one entry here + one case in callAI()
export const PROVIDERS = {
  GEMINI:        { id: 'gemini',        tier: 'free', name: 'Gemini 2.5 Flash'  },
  CLAUDE_HAIKU:  { id: 'claude-haiku',  tier: 'free', name: 'Claude Haiku'      },
  CLAUDE_SONNET: { id: 'claude',        tier: 'paid', name: 'Claude Sonnet'     },
  GPT4O:         { id: 'openai',        tier: 'paid', name: 'GPT-4o'            },
  GPT4O_MINI:    { id: 'openai-mini',   tier: 'paid', name: 'GPT-4o Mini'       },
  GROK:          { id: 'grok',          tier: 'paid', name: 'Grok (xAI)'        },
  MISTRAL:       { id: 'mistral',       tier: 'paid', name: 'Mistral Large'     },
};

// Default provider per task — all free tier
const DEFAULTS = {
  strategy: 'gemini',
  script:   'gemini',
  caption:  'gemini',
  scoring:  'gemini',
  bracket:  'gemini',
  hook:     'gemini',
};

const SYSTEM = `You are an expert marketing strategist and viral video content creator. Be specific, creative, and actionable.`;

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 1 — PROVIDER LAYER
// ═══════════════════════════════════════════════════════════════════════════════

// Main entry point for all AI calls
// provider: string — provider id e.g. 'gemini', 'claude', 'openai'
// userPlan: 'free' | 'pro' | 'enterprise'
export async function callAI(provider = 'gemini', prompt, userPlan = 'free') {
  const resolved = resolveProvider(provider, userPlan);
  console.log(`   🤖 ${resolved}`);
  try {
    switch (resolved) {
      case 'gemini':       return await _gemini(prompt);
      case 'claude':       return await _claude(prompt, 'claude-3-5-sonnet-20241022');
      case 'claude-haiku': return await _claude(prompt, 'claude-3-haiku-20240307');
      case 'openai':       return await _openai(prompt, 'gpt-4o');
      case 'openai-mini':  return await _openai(prompt, 'gpt-4o-mini');
      case 'grok':         return await _grok(prompt);
      case 'mistral':      return await _mistral(prompt);
      default:             return await _gemini(prompt);
    }
  } catch (err) {
    if (resolved !== 'gemini') {
      console.warn(`   ⚠️  ${resolved} failed — falling back to Gemini`);
      return await _gemini(prompt);
    }
    throw err;
  }
}

// Enforce plan-based provider access
function resolveProvider(requested, userPlan = 'free') {
  const entry = Object.values(PROVIDERS).find(p => p.id === requested);
  if (!entry) return DEFAULTS.strategy;
  if (entry.tier === 'paid' && userPlan === 'free') {
    console.log(`   ℹ️  ${entry.name} requires paid plan — using Gemini`);
    return 'gemini';
  }
  return entry.id;
}

// Return available providers for a plan — used by frontend provider selector
export function getAvailableProviders(userPlan = 'free') {
  return Object.values(PROVIDERS)
    .filter(p => userPlan !== 'free' || p.tier === 'free')
    .map(p => ({
      id:        p.id,
      name:      p.name,
      tier:      p.tier,
      available: _isConfigured(p.id),
    }));
}

function _isConfigured(id) {
  if (id === 'gemini')                       return !!GEMINI_API_KEY;
  if (id === 'claude' || id === 'claude-haiku') return !!ANTHROPIC_API_KEY;
  if (id === 'openai' || id === 'openai-mini')  return !!OPENAI_API_KEY;
  return !!process.env[`${id.toUpperCase().replace('-','_')}_API_KEY`];
}

// ── Raw provider implementations ──────────────────────────────────────────────

async function _gemini(prompt) {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
    }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(`Gemini: ${e.error?.message}`); }
  const d = await res.json();
  if (!d.candidates?.[0]?.content?.parts?.length) {
    if (d.promptFeedback?.blockReason) throw new Error(`Gemini blocked: ${d.promptFeedback.blockReason}`);
    throw new Error('Gemini returned empty response');
  }
  return d.candidates[0].content.parts[0].text;
}

async function _claude(prompt, model = 'claude-3-5-sonnet-20241022') {
  if (!ANTHROPIC_API_KEY) throw new Error('Anthropic API key not configured');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: 8192, system: SYSTEM, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(`Claude: ${e.error?.message}`); }
  return (await res.json()).content[0].text;
}

async function _openai(prompt, model = 'gpt-4o-mini') {
  if (!OPENAI_API_KEY) throw new Error('OpenAI API key not configured');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }], max_tokens: 8192, temperature: 0.7 }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(`OpenAI: ${e.error?.message}`); }
  return (await res.json()).choices[0].message.content;
}

// Grok — ready when GROK_API_KEY is added to Railway env
async function _grok(prompt) {
  const key = process.env.GROK_API_KEY;
  if (!key) throw new Error('Grok API key not configured');
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'grok-2-latest', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }], max_tokens: 8192, temperature: 0.7 }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(`Grok: ${e.error?.message}`); }
  return (await res.json()).choices[0].message.content;
}

// Mistral — ready when MISTRAL_API_KEY is added to Railway env
async function _mistral(prompt) {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) throw new Error('Mistral API key not configured');
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'mistral-large-latest', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }], max_tokens: 8192, temperature: 0.7 }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(`Mistral: ${e.error?.message}`); }
  return (await res.json()).choices[0].message.content;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 2 — RESEARCH LAYER
// ═══════════════════════════════════════════════════════════════════════════════

async function _searchWeb(query) {
  if (BRAVE_SEARCH_API_KEY) {
    try {
      const res = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
        { headers: { Accept: 'application/json', 'X-Subscription-Token': BRAVE_SEARCH_API_KEY } }
      );
      if (res.ok) return (await res.json()).web?.results?.slice(0,5).map(r => r.description).filter(Boolean) || [];
    } catch (e) { console.warn('Brave:', e.message); }
  }
  try {
    const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
    if (res.ok) {
      const d = await res.json();
      const r = [];
      if (d.AbstractText) r.push(d.AbstractText);
      d.RelatedTopics?.slice(0,4).forEach(t => { if (t.Text) r.push(t.Text); });
      return r;
    }
  } catch (e) { console.warn('DDG:', e.message); }
  return [];
}

async function gatherIntelligence({ name, productDescription, targetAudience }) {
  console.log('   🔍 Researching market...');
  try {
    const [market, audience, viral] = await Promise.all([
      _searchWeb(`${productDescription || name} marketing 2025`),
      _searchWeb(`${targetAudience} content preferences video 2025`),
      _searchWeb(`${name} viral video campaign examples`),
    ]);
    const all = [...market, ...audience, ...viral].filter(Boolean);
    if (!all.length) return '';
    return `\n--- MARKET INTELLIGENCE ---\n${all.map(s => `• ${s}`).join('\n')}\n---\n`;
  } catch { return ''; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 3 — BRAND LAYER
// ═══════════════════════════════════════════════════════════════════════════════

export function buildBrandContext(brand) {
  if (!brand) return '';
  const lines = [];
  if (brand.brand_name)          lines.push(`Brand: ${brand.brand_name}`);
  if (brand.tagline)             lines.push(`Tagline: "${brand.tagline}"`);
  if (brand.industry)            lines.push(`Industry: ${brand.industry}`);
  if (brand.brand_story)         lines.push(`Story: ${brand.brand_story}`);
  if (brand.brand_voice)         lines.push(`Voice: ${brand.brand_voice}`);
  if (brand.visual_mood?.length) lines.push(`Mood: ${brand.visual_mood.join(', ')}`);
  if (brand.words_always?.length)lines.push(`Always say: ${brand.words_always.join(', ')}`);
  if (brand.words_never?.length) lines.push(`Never say: ${brand.words_never.join(', ')}`);
  if (brand.target_personas)     lines.push(`Audience: ${brand.target_personas}`);
  if (brand.pain_points)         lines.push(`Pain points: ${brand.pain_points}`);
  if (brand.audience_desires)    lines.push(`Desires: ${brand.audience_desires}`);
  if (!lines.length) return '';
  return `\n--- BRAND ---\n${lines.join('\n')}\nAll content must reflect this brand consistently.\n---\n`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 4 — INTELLIGENCE LAYER
// ═══════════════════════════════════════════════════════════════════════════════

// Select video bracket — 30 / 45 / 60 seconds
export const selectVideoBracketAI = async ({
  campaignName, productDescription, targetAudience,
  brand, ai_provider = 'gemini', userPlan = 'free'
}) => {
  const prompt = `Choose the ideal video duration for this campaign.
Choose ONLY: 30, 45, or 60 seconds.

Campaign: ${campaignName}
Product: ${productDescription}
Audience: ${targetAudience}
${buildBrandContext(brand)}

- 30s: Single benefit, impulse product, aware audience
- 45s: 2-3 benefits, needs context, lifestyle/service
- 60s: Complex, new category, premium, needs demonstration

Respond ONLY with JSON:
{"seconds": 45, "reason": "one sentence"}`;

  try {
    const raw = await callAI(ai_provider || DEFAULTS.bracket, prompt, userPlan);
    const match = raw.match(/\{[\s\S]*"seconds"[\s\S]*\}/);
    if (!match) throw new Error('No JSON');
    const p = JSON.parse(match[0]);
    const s = [30,45,60].includes(Number(p.seconds)) ? Number(p.seconds) : 60;
    console.log(`   🎯 Bracket: ${s}s — ${p.reason}`);
    return { seconds: s, reason: p.reason || '' };
  } catch (e) {
    console.warn('   ⚠️  Bracket fallback 60s:', e.message);
    return { seconds: 60, reason: 'Default' };
  }
};

// Identify best hook angle for a campaign
export const selectHookAngleAI = async ({
  campaignName, productDescription, targetAudience,
  brand, ai_provider = 'gemini', userPlan = 'free'
}) => {
  const prompt = `Choose the single best hook angle for this video campaign.

Campaign: ${campaignName}
Product: ${productDescription}
Audience: ${targetAudience}
${buildBrandContext(brand)}

ANGLES: pain | curiosity | controversy | transformation | social_proof | humor | awe | identity

Pick the ONE angle that will stop the scroll hardest for this specific audience.
Write the exact opening line using that angle.

Respond ONLY with JSON:
{"angle": "pain", "hook": "Exact first spoken line of the video", "reason": "why this wins"}`;

  try {
    const raw = await callAI(ai_provider || DEFAULTS.hook, prompt, userPlan);
    const match = raw.match(/\{[\s\S]*"angle"[\s\S]*\}/);
    if (!match) throw new Error('No JSON');
    const p = JSON.parse(match[0]);
    console.log(`   🎣 Hook: ${p.angle} — "${p.hook?.slice(0,60)}"`);
    return { angle: p.angle || 'curiosity', hook: p.hook || '', reason: p.reason || '' };
  } catch (e) {
    console.warn('   ⚠️  Hook angle failed:', e.message);
    return { angle: 'curiosity', hook: '', reason: '' };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 5 — SCORING LAYER
// ═══════════════════════════════════════════════════════════════════════════════

export const scoreContentAI = async ({
  script, hook, platform = 'tiktok', seconds,
  ai_provider = 'gemini', userPlan = 'free'
}) => {
  const prompt = `Score this ${seconds}s ${platform} video script for viral potential.

HOOK: "${hook || script?.slice(0,100)}"
SCRIPT: "${script?.slice(0,600)}"

Score each (0-10):
- hook_strength: Stops scroll in under 2 seconds?
- emotion_curve: Builds → peaks → pays off?
- clarity: Message crystal clear?
- platform_fit: Optimized for ${platform}?
- cta_strength: CTA compels action?

Benchmarks: 0-30=<10K | 31-50=10K-100K | 51-70=100K-1M | 71-85=1M-10M | 86-100=10M+

Respond ONLY with JSON:
{
  "score": 72,
  "predicted_views": "1M–10M",
  "features": {"hook_strength":8,"emotion_curve":7,"clarity":8,"platform_fit":7,"cta_strength":6},
  "strengths": ["strength 1","strength 2"],
  "improvements": ["improvement 1","improvement 2"],
  "optimized_hook": "A stronger version of the hook"
}`;

  try {
    const raw = await callAI(ai_provider || DEFAULTS.scoring, prompt, userPlan);
    const match = raw.match(/\{[\s\S]*"score"[\s\S]*\}/);
    if (!match) throw new Error('No JSON');
    const p = JSON.parse(match[0]);
    return {
      score:           Math.min(100, Math.max(0, p.score || 50)),
      predicted_views: p.predicted_views || 'Unknown',
      features:        p.features || {},
      strengths:       p.strengths || [],
      improvements:    p.improvements || [],
      optimized_hook:  p.optimized_hook || '',
    };
  } catch (e) {
    console.warn('   ⚠️  Scoring failed:', e.message);
    return { score: 50, predicted_views: 'Unknown', features: {}, strengths: [], improvements: [], optimized_hook: '' };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 6 — GENERATION LAYER
// ═══════════════════════════════════════════════════════════════════════════════

// ── Marketing Strategy ────────────────────────────────────────────────────────
export const generateMarketingStrategyAI = async (campaignData, userPlan = 'free') => {
  const { name, product_description, target_audience, output_formats, ai_provider, brand } = campaignData;
  console.log(`\n📊 Strategy: ${name}`);

  const [brandCtx, research] = await Promise.all([
    Promise.resolve(buildBrandContext(brand)),
    gatherIntelligence({ name, productDescription: product_description, targetAudience: target_audience }),
  ]);

  const prompt = `Generate a video-first marketing strategy.
${brandCtx}${research}

Campaign: ${name}
Product: ${product_description}
Audience: ${target_audience}
Formats: ${output_formats?.join(', ') || 'video, social'}

## 1. CAMPAIGN INTELLIGENCE
Key market insight and opportunity.

## 2. VIDEO CONTENT STRATEGY
Primary approach — hook angle, emotional arc, bracket recommendation (30/45/60s).

## 3. TARGET AUDIENCE DEEP DIVE
Who they are, what they fear, what they desire, what makes them share.

## 4. CONTENT PILLARS
3-4 themes with % split and rationale.

## 5. PLATFORM DISTRIBUTION
Where to post, when, how often. Platform-specific tactics.

## 6. VIRAL TRIGGERS
Specific elements to include that drive shares, comments, saves.

## 7. SUCCESS METRICS
Realistic KPIs based on campaign type.

## 8. 30-DAY ACTION PLAN
Week by week execution roadmap.

Be specific and actionable. Use the market intelligence above.`;

  const strategy = await callAI(ai_provider || DEFAULTS.strategy, prompt, userPlan);
  console.log('   ✅ Strategy done');
  return strategy;
};

// ── Video Script — core IVey output ──────────────────────────────────────────
export const generateVideoScriptAI = async ({
  campaignName, productDescription, targetAudience,
  durationSeconds, brand, ai_provider = 'gemini', userPlan = 'free'
}) => {
  const MAX = 60;
  const brandCtx = buildBrandContext(brand);

  // Determine bracket
  let secs         = durationSeconds ? Math.min(Number(durationSeconds), MAX) : null;
  let bracketReason = '';

  if (secs) {
    // Snap to valid bracket
    secs = secs <= 30 ? 30 : secs <= 45 ? 45 : 60;
  }

  // Run bracket + hook selection in parallel
  const [bracketResult, hookResult] = await Promise.all([
    secs
      ? Promise.resolve({ seconds: secs, reason: 'Manually selected' })
      : selectVideoBracketAI({ campaignName, productDescription, targetAudience, brand, ai_provider, userPlan }),
    selectHookAngleAI({ campaignName, productDescription, targetAudience, brand, ai_provider, userPlan }),
  ]);

  secs          = bracketResult.seconds;
  bracketReason = bracketResult.reason;
  const hook    = hookResult;

  const structures = {
    30: `STRUCTURE — 30 seconds:
[0:00–0:04] HOOK (${hook.angle}): "${hook.hook || 'powerful opener'}"
[0:04–0:22] CORE: ONE benefit, total clarity, zero filler
[0:22–0:30] CTA: Single specific action, make it urgent`,

    45: `STRUCTURE — 45 seconds:
[0:00–0:05] HOOK (${hook.angle}): "${hook.hook || 'powerful opener'}"
[0:05–0:18] CONTEXT: Build the desire or name the pain
[0:18–0:38] SOLUTION: Product delivering real transformation
[0:38–0:45] CTA: Clear, specific, urgent`,

    60: `STRUCTURE — 60 seconds:
[0:00–0:06] HOOK (${hook.angle}): "${hook.hook || 'powerful opener'}"
[0:06–0:20] PROBLEM: Make the audience feel the pain or desire
[0:20–0:42] SOLUTION: Full demonstration, features, transformation
[0:42–0:52] PROOF: One result, number, or credibility moment
[0:52–1:00] CTA: Exact next step, where to go, why now`,
  };

  const brandVoice = brand
    ? `Voice: ${brand.brand_voice || 'direct'} | Mood: ${brand.visual_mood?.join(', ') || 'energetic'} | Use: ${brand.words_always?.join(', ') || 'none'} | Avoid: ${brand.words_never?.join(', ') || 'none'}`
    : '';

  const prompt = `Write a complete ${secs}-second video script for HeyGen.

Campaign: ${campaignName}
Product: ${productDescription}
Audience: ${targetAudience}
Duration: EXACTLY ${secs} seconds
Hook angle: ${hook.angle} — reason: ${hook.reason}
${brandCtx}${brandVoice ? `\n${brandVoice}\n` : ''}

${structures[secs]}

FORMAT — use exactly this for each scene:
[0:00–0:05]
(VISUAL: what the camera shows — movement, subject, mood)
Spoken words here. Short sentences.

RULES:
— Every word the presenter speaks
— Short sentences — written for ears not eyes
— Natural rhythm — how people actually talk
— Zero filler — every second earns its place
— Hook lands in first 2 seconds
— CTA names exactly what to do

This goes directly into HeyGen. A voice AI reads every word.
Start with [0:00] now.`;

  console.log(`\n🎬 Script: ${secs}s — ${campaignName}`);
  const script = await callAI(ai_provider || DEFAULTS.script, prompt, userPlan);

  // Auto-score every script
  console.log('   📊 Scoring...');
  const score = await scoreContentAI({ script, hook: hook.hook, platform: 'tiktok', seconds: secs, ai_provider, userPlan });
  console.log(`   ✅ Done — Score: ${score.score}/100 | ${score.predicted_views}`);

  return {
    script,
    seconds:        secs,
    bracketReason,
    hookAngle:      hook.angle,
    hookLine:       hook.hook,
    viralScore:     score.score,
    predictedViews: score.predicted_views,
    scoreFeatures:  score.features,
    improvements:   score.improvements,
    optimizedHook:  score.optimized_hook,
  };
};

// ── Caption Generation ────────────────────────────────────────────────────────
export const generateCaptionAI = async ({
  campaignName, productDescription, targetAudience,
  format, platform, brand, ai_provider = 'gemini', userPlan = 'free'
}) => {
  const rules = {
    twitter:   'Max 280 chars. Punchy hook. 2-3 hashtags. One CTA.',
    instagram: '150-300 chars. Emoji-friendly. 10-15 hashtags.',
    facebook:  '2-3 sentences. Story-driven. End with a question.',
    linkedin:  'Professional. Insight-led. 3-5 hashtags.',
    tiktok:    'Short and punchy. Trending hashtags. Call to duet/stitch.',
    youtube:   '100-150 chars. Curiosity-driven. Include keywords.',
  };

  const brandCtx = buildBrandContext(brand);
  const voice    = brand?.brand_voice ? `Voice: ${brand.brand_voice}. Use: ${brand.words_always?.join(', ') || 'none'}. Avoid: ${brand.words_never?.join(', ') || 'none'}.` : '';

  const prompt = `Write a ${platform} caption.
${brandCtx}${voice ? `\n${voice}\n` : ''}
Rules: ${rules[platform] || 'Engaging, clear CTA, hashtags'}
Campaign: ${campaignName}
Product: ${productDescription}
Audience: ${targetAudience}
Format: ${format}

Output ONLY the final caption. No explanation. No options. Ready to copy-paste.`;

  console.log(`\n💬 Caption: ${platform} / ${format}`);
  const caption = await callAI(ai_provider || DEFAULTS.caption, prompt, userPlan);
  console.log('   ✅ Caption done');
  return caption;
};

// ── Hook Variants — 3 angles for A/B testing ──────────────────────────────────
export const generateHookVariantsAI = async ({
  campaignName, productDescription, targetAudience,
  seconds, brand, ai_provider = 'gemini', userPlan = 'free'
}) => {
  const prompt = `Generate 3 hook variants for a ${seconds}s video. Each uses a different angle.
${buildBrandContext(brand)}

Campaign: ${campaignName}
Product: ${productDescription}
Audience: ${targetAudience}

One hook per angle — pain, curiosity, transformation.
Each is the exact first spoken line (1-2 sentences).

Respond ONLY with JSON:
[
  {"angle":"pain","hook":"exact spoken line","visual_note":"what camera shows"},
  {"angle":"curiosity","hook":"exact spoken line","visual_note":"what camera shows"},
  {"angle":"transformation","hook":"exact spoken line","visual_note":"what camera shows"}
]`;

  try {
    const raw   = await callAI(ai_provider || DEFAULTS.hook, prompt, userPlan);
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON array');
    const variants = JSON.parse(match[0]);
    console.log(`   ✅ ${variants.length} hook variants`);
    return variants;
  } catch (e) {
    console.warn('   ⚠️  Hook variants failed:', e.message);
    return [];
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// LEGACY COMPATIBILITY
// Keeps existing campaign.controller.js working without any changes
// ═══════════════════════════════════════════════════════════════════════════════

// Image generation — disabled (DALL-E removed, IVey is video-first)
// Will be re-enabled with free-tier tools (Pollinations.ai) for paid users
export const generateImagesAI = async () => {
  console.log('   ℹ️  Image generation paused — IVey is video-first');
  return [];
};

export const generateVisualAI = generateImagesAI;

// Legacy alias used in some controllers
export { generateMarketingStrategyAI as generateStrategyAI };