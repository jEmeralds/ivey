// ═══════════════════════════════════════════════════════════════════════════════
// IVey AI Engine — v4.0  (2-Call Architecture)
// ───────────────────────────────────────────────────────────────────────────────
//
//  CALL 1 — Intelligence Brief  (~15s)
//    Audience psychology (8 questions)
//    Competitive gap analysis
//    Narrative arc design
//    5 hooks scored and ranked
//    Bracket selection (30/45/60s)
//    All in ONE prompt — one API call
//
//  CALL 2 — Script Construction  (~20s)
//    Writes the complete production script
//    Uses everything from Call 1
//    Scores the script (viral score, features)
//    Returns final result
//
//  Total: 2 API calls, ~35-45 seconds, same intelligence depth
//
//  Provider registry — all main providers open, Grok/Mistral paid only
//  Adding a provider = 1 entry in PROVIDERS + 1 case in callAI()
// ═══════════════════════════════════════════════════════════════════════════════

import fetch from 'node-fetch';

// ── Environment ───────────────────────────────────────────────────────────────
const GEMINI_API_KEY       = process.env.GEMINI_API_KEY;
const ANTHROPIC_API_KEY    = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY       = process.env.OPENAI_API_KEY;
const BRAVE_SEARCH_API_KEY = process.env.BRAVE_SEARCH_API_KEY;

// ── Model config — override via Railway env vars to swap models without redeploy
const MODELS = {
  gemini:       process.env.GEMINI_MODEL        || 'gemini-2.5-flash',
  claude:       process.env.CLAUDE_MODEL        || 'claude-3-haiku-20240307',
  claudeHaiku:  process.env.CLAUDE_HAIKU_MODEL  || 'claude-3-haiku-20240307',
  openai:       process.env.OPENAI_MODEL        || 'gpt-4o',
  openaiMini:   process.env.OPENAI_MINI_MODEL   || 'gpt-4o-mini',
};

// ── Script duration cap — override via env var
const MAX_SCRIPT_SECONDS = parseInt(process.env.MAX_SCRIPT_SECONDS || '45');

// ── Provider registry ─────────────────────────────────────────────────────────
export const PROVIDERS = {
  GEMINI:        { id: 'gemini',       tier: 'free', name: 'Gemini 2.5 Flash' },
  CLAUDE_HAIKU:  { id: 'claude-haiku', tier: 'free', name: 'Claude Haiku'     },
  CLAUDE_SONNET: { id: 'claude',       tier: 'free', name: 'Claude Sonnet'    },
  GPT4O:         { id: 'openai',       tier: 'free', name: 'GPT-4o'           },
  GPT4O_MINI:    { id: 'openai-mini',  tier: 'free', name: 'GPT-4o Mini'      },
  GROK:          { id: 'grok',         tier: 'paid', name: 'Grok (xAI)'       },
  MISTRAL:       { id: 'mistral',      tier: 'paid', name: 'Mistral Large'    },
};

const SYSTEM = `You are an expert viral marketing strategist and world-class video scriptwriter.
Be specific, creative, and deeply psychological in your approach.
Always respond with valid JSON when asked. Never add markdown fences around JSON.`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function extractJSON(raw, fallback = {}) {
  try {
    const clean = raw.trim().replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(clean);
  } catch {
    try {
      const match = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (match) return JSON.parse(match[0]);
    } catch {}
  }
  return fallback;
}

// ── Provider router with smart fallback ───────────────────────────────────────
// Fallback order based on what keys are available
function _getFallbackChain(preferred) {
  const all = ['claude', 'gemini', 'claude-haiku', 'openai', 'openai-mini'];
  const chain = [preferred, ...all.filter(p => p !== preferred)];
  // Filter to only providers we have keys for
  return chain.filter(p => {
    if (p === 'gemini')       return !!GEMINI_API_KEY;
    if (p === 'claude')       return !!ANTHROPIC_API_KEY;
    if (p === 'claude-haiku') return !!ANTHROPIC_API_KEY;
    if (p === 'openai')       return !!OPENAI_API_KEY;
    if (p === 'openai-mini')  return !!OPENAI_API_KEY;
    return false;
  });
}

async function _tryProvider(provider, prompt) {
  switch (provider) {
    case 'gemini':       return await _gemini(prompt);
    case 'claude':       return await _claude(prompt, MODELS.claude);
    case 'claude-haiku': return await _claude(prompt, MODELS.claudeHaiku);
    case 'openai':       return await _openai(prompt, MODELS.openai);
    case 'openai-mini':  return await _openai(prompt, MODELS.openaiMini);
    case 'grok':         return await _grok(prompt);
    case 'mistral':      return await _mistral(prompt);
    default:             return await _gemini(prompt);
  }
}

export async function callAI(provider = 'gemini', prompt, userPlan = 'free') {
  const chain = _getFallbackChain(provider);
  if (!chain.length) throw new Error('No AI providers configured — check API keys in Railway environment variables');

  console.log(`   🤖 ${provider} (chain: ${chain.join(' → ')})`);

  for (let i = 0; i < chain.length; i++) {
    const p = chain[i];
    try {
      const result = await _tryProvider(p, prompt);
      if (i > 0) console.log(`   ✅ Used ${p} (fallback from ${chain[0]})`);
      return result;
    } catch (err) {
      const isRateLimit = err.message?.includes('quota') || err.message?.includes('rate') ||
                          err.message?.includes('429')   || err.message?.includes('exceeded') ||
                          err.message?.includes('limit');
      const isKeyError  = err.message?.includes('API key') || err.message?.includes('not configured') ||
                          err.message?.includes('401') || err.message?.includes('403');

      if (isKeyError) {
        console.warn(`   ⚠️  ${p} — key error, skipping`);
        continue;
      }
      if (isRateLimit && i < chain.length - 1) {
        console.warn(`   ⚠️  ${p} rate limited — trying ${chain[i + 1]}`);
        await sleep(1500);
        continue;
      }
      if (i === chain.length - 1) {
        // Last provider — wait and retry once
        if (isRateLimit) {
          console.warn(`   ⏳ All providers busy — waiting 20s then retrying ${chain[0]}`);
          await sleep(20000);
          return await _tryProvider(chain[0], prompt);
        }
        throw err;
      }
      throw err;
    }
  }
}

export function getAvailableProviders(userPlan = 'free') {
  return Object.values(PROVIDERS)
    .filter(p => userPlan !== 'free' || p.tier === 'free')
    .map(p => ({ id: p.id, name: p.name, tier: p.tier }));
}

// ── Raw provider implementations ──────────────────────────────────────────────
async function _gemini(prompt) {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.gemini}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.75, maxOutputTokens: 4096 },
    }),
  });
  if (!res.ok) {
    const e = await res.json();
    throw new Error(`Gemini: ${e.error?.message || res.statusText}`);
  }
  const d = await res.json();
  if (!d.candidates?.[0]?.content?.parts?.length) {
    if (d.promptFeedback?.blockReason) throw new Error(`Gemini blocked: ${d.promptFeedback.blockReason}`);
    throw new Error('Gemini returned empty response');
  }
  return d.candidates[0].content.parts[0].text;
}

async function _claude(prompt, model = MODELS.claude) {
  if (!ANTHROPIC_API_KEY) throw new Error('Anthropic API key not configured');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model, max_tokens: 4096, system: SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const e = await res.json();
    throw new Error(`Claude: ${e.error?.message || res.statusText}`);
  }
  return (await res.json()).content[0].text;
}

async function _openai(prompt, model = 'gpt-4o-mini') {
  if (!OPENAI_API_KEY) throw new Error('OpenAI API key not configured');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }],
      max_tokens: 4096, temperature: 0.75,
    }),
  });
  if (!res.ok) {
    const e = await res.json();
    throw new Error(`OpenAI: ${e.error?.message || res.statusText}`);
  }
  return (await res.json()).choices[0].message.content;
}

async function _grok(prompt) {
  const key = process.env.GROK_API_KEY;
  if (!key) throw new Error('Grok API key not configured');
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'grok-2-latest',
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }],
      max_tokens: 4096, temperature: 0.75,
    }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(`Grok: ${e.error?.message}`); }
  return (await res.json()).choices[0].message.content;
}

async function _mistral(prompt) {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) throw new Error('Mistral API key not configured');
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'mistral-large-latest',
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }],
      max_tokens: 4096, temperature: 0.75,
    }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(`Mistral: ${e.error?.message}`); }
  return (await res.json()).choices[0].message.content;
}

// ── Web search (optional enrichment) ─────────────────────────────────────────
async function _searchWeb(query) {
  if (BRAVE_SEARCH_API_KEY) {
    try {
      const res = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=4`,
        { headers: { Accept: 'application/json', 'X-Subscription-Token': BRAVE_SEARCH_API_KEY } }
      );
      if (res.ok) {
        const data = await res.json();
        return data.web?.results?.slice(0, 4).map(r => r.description).filter(Boolean).join(' | ') || '';
      }
    } catch {}
  }
  return '';
}

// ── Context builders ──────────────────────────────────────────────────────────
export function buildBrandContext(brand) {
  if (!brand) return '';
  const lines = [];

  // ── Core identity ──────────────────────────────────────────────────────────
  if (brand.brand_name)           lines.push(`Brand name: ${brand.brand_name}`);
  if (brand.tagline)              lines.push(`Tagline: "${brand.tagline}"`);
  if (brand.industry)             lines.push(`Industry: ${brand.industry}`);
  if (brand.brand_story)          lines.push(`Brand story: ${brand.brand_story}`);
  if (brand.brand_voice)          lines.push(`Voice/tone: ${brand.brand_voice}`);

  // ── Visual identity — HeyGen needs these exact values ─────────────────────
  const vi = brand.visual_identity || {};
  const primaryColor   = vi.primary_color   || brand.brand_colors?.[0] || null;
  const secondaryColor = vi.secondary_color || brand.brand_colors?.[1] || null;
  const logoDesc       = vi.logo_description || null;
  const visualStyle    = vi.visual_style || null;
  const moodWords      = vi.mood_words?.length ? vi.mood_words : brand.visual_mood || [];

  lines.push('');
  lines.push('VISUAL IDENTITY (inject these into every scene visual note):');
  if (logoDesc)          lines.push(`  Logo description: ${logoDesc}`);
  if (brand.logo_url)    lines.push(`  Logo URL: ${brand.logo_url}`);
  if (primaryColor)      lines.push(`  Primary color: ${primaryColor}`);
  if (secondaryColor)    lines.push(`  Secondary color: ${secondaryColor}`);
  if (visualStyle)       lines.push(`  Visual style: ${visualStyle}`);
  if (moodWords.length)  lines.push(`  Mood: ${moodWords.join(', ')}`);
  if (brand.script_visual_notes)
                         lines.push(`  Visual directions: ${brand.script_visual_notes}`);

  // ── Voice rules ────────────────────────────────────────────────────────────
  if (brand.words_always?.length || brand.words_never?.length) {
    lines.push('');
    lines.push('BRAND VOICE RULES:');
    if (brand.words_always?.length) lines.push(`  Always say: ${brand.words_always.join(', ')}`);
    if (brand.words_never?.length)  lines.push(`  Never say: ${brand.words_never.join(', ')}`);
  }

  // ── Audience ───────────────────────────────────────────────────────────────
  if (brand.target_personas || brand.pain_points || brand.audience_desires || brand.key_offerings?.length) {
    lines.push('');
    lines.push('BRAND AUDIENCE:');
    if (brand.target_personas)       lines.push(`  Personas: ${brand.target_personas}`);
    if (brand.pain_points)           lines.push(`  Pain points: ${brand.pain_points}`);
    if (brand.audience_desires)      lines.push(`  Desires: ${brand.audience_desires}`);
    if (brand.key_offerings?.length) lines.push(`  Key offerings: ${brand.key_offerings.join(', ')}`);
  }

  if (lines.filter(l => l.trim()).length === 0) return '';
  return `\nBRAND PROFILE:\n${lines.join('\n')}\n`;
}

export function buildProductionContext(brief) {
  if (!brief) return '';
  const lines = [];

  const formatLabels = {
    single_narrator: 'Single narrator speaking directly to camera',
    two_character:   'Two-character conversation/dialogue — label speakers [CHARACTER A] and [CHARACTER B]',
    multi_character: 'Multi-character ensemble scene — assign distinct roles to each character',
    voiceover:       'Voiceover narration only — no on-screen presenter, rich visual storytelling',
    interview:       'Interview format — HOST asks questions, GUEST answers',
  };

  lines.push('PRODUCTION BRIEF (every field below must appear in script visual notes):');
  if (brief.videoFormat)
    lines.push(`  Video format: ${formatLabels[brief.videoFormat] || brief.videoFormat}`);

  // Narrator — HeyGen needs exact presenter description for avatar selection
  const isNarrator = ['single_narrator', 'interview'].includes(brief.videoFormat);
  const isVoiceover = brief.videoFormat === 'voiceover';
  if (isNarrator) {
    const parts = [brief.narratorGender, brief.narratorAge, brief.narratorEthnicity]
      .filter(v => v && v !== 'Either' && v !== 'Any' && v !== 'Not specified');
    if (parts.length) {
      lines.push(`  Presenter: ${parts.join(', ')}`);
      lines.push(`  → HeyGen avatar should match this description exactly`);
    }
  }
  if (isVoiceover) {
    lines.push('  No on-screen presenter — camera tells the visual story');
  }

  // Market and setting — be extremely specific
  if (brief.primaryMarket && brief.primaryMarket !== 'Global') {
    lines.push(`  Market: ${brief.primaryMarket}`);
    lines.push(`  → All locations, names, references, and cultural cues must be specific to ${brief.primaryMarket}`);
  }
  if (brief.settingStyle)
    lines.push(`  Setting style: ${brief.settingStyle}`);

  // Combine market + setting into a specific location instruction
  if (brief.primaryMarket && brief.settingStyle) {
    const settingExample = {
      'Urban':               `${brief.primaryMarket} city streets, modern buildings, busy atmosphere`,
      'Rural':               `${brief.primaryMarket} countryside, natural landscape, open space`,
      'Corporate / Office':  `${brief.primaryMarket} modern office, professional environment`,
      'Lifestyle / Home':    `${brief.primaryMarket} home interior, warm domestic setting`,
      'Nature / Outdoors':   `${brief.primaryMarket} natural outdoor environment, landscape`,
      'Studio / Clean':      'Clean studio background, minimal, professional',
      'Luxury':              `High-end ${brief.primaryMarket} environment, premium aesthetic`,
      'Street / Market':     `${brief.primaryMarket} street market, local atmosphere, authentic`,
    };
    const example = settingExample[brief.settingStyle] || `${brief.primaryMarket} ${brief.settingStyle}`;
    lines.push(`  → Location example: "${example}"`);
  }

  // Energy and tone
  if (brief.energyLevel)
    lines.push(`  Energy/Tone: ${brief.energyLevel}`);

  // Music — HeyGen supports background music tracks
  if (brief.musicMood && brief.musicMood !== 'No music specified') {
    lines.push(`  Music: ${brief.musicMood} style, -18dB background, does not compete with voice`);
    lines.push(`  → Specify in first scene visual note: music begins, fades under dialogue`);
  }

  // Logo
  if (brief.logoUrl)
    lines.push(`  Logo URL for HeyGen overlay: ${brief.logoUrl}`);

  if (lines.length <= 1) return '';
  return `\nPRODUCTION CONTEXT:\n${lines.join('\n')}\n`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALL 1 — INTELLIGENCE BRIEF
// ═══════════════════════════════════════════════════════════════════════════════
// One prompt that does all the thinking:
// audience psychology + competitive gap + narrative arc + 5 hooks + bracket

async function generateIntelligenceBrief({
  campaignName, productDescription, targetAudience,
  brand, productionBrief, ai_provider, userPlan,
  webResearch = '',
}) {
  const brandCtx = buildBrandContext(brand);
  const prodCtx  = buildProductionContext(productionBrief);
  const format   = productionBrief?.videoFormat || 'single_narrator';

  const prompt = `You are a viral marketing strategist, consumer psychologist, and narrative architect.

Complete ALL sections below for this campaign. Be specific — not generic marketing language.

CAMPAIGN: ${campaignName}
PRODUCT: ${productDescription}
AUDIENCE: ${targetAudience}
${brandCtx}${prodCtx}${webResearch ? `\nMARKET RESEARCH:\n${webResearch}\n` : ''}

═══ SECTION 1: AUDIENCE PSYCHOLOGY ═══
Answer these 8 questions about the SPECIFIC audience above:
1. 2am thought: What keeps them awake at night — specific worry or longing?
2. Secret desire: What transformation do they secretly want but won't admit?
3. Social fear: What judgment from peers are they trying to avoid?
4. Failed attempt: What solution have they tried that disappointed them?
5. Their language: 5 exact phrases they use (not marketing speak — real words)
6. Identity: How do they see themselves? What tribe/values define them?
7. Permission block: What specific guilt or fear stops them acting?
8. After state: Exactly how does life look/feel/sound after they have this?

═══ SECTION 2: COMPETITIVE GAP ═══
1. Saturated angles: 3 emotional approaches competitors overuse
2. Emotional gap: The territory nobody is owning in this space
3. Competitor weakness: The most common failure in competitor messaging
4. Positioning opportunity: One sentence — the unique position to claim

═══ SECTION 3: BRACKET & NARRATIVE ARC ═══
1. Choose duration: 30 or ${MAX_SCRIPT_SECONDS} seconds only. Max is ${MAX_SCRIPT_SECONDS} seconds.
2. Bracket reason: One sentence why
3. Design the 7-stage arc for this SPECIFIC campaign:
   - PATTERN INTERRUPT (0-8% of duration): What unexpected thing stops the scroll?
   - TENSION BUILD (8-25%): How do we amplify their specific pain/desire?
   - IDENTIFICATION (25-42%): What makes them think "this knows me exactly"?
   - REVELATION (42-67%): How is the product revealed as the answer?
   - PROOF (67-83%): One specific credible result
   - PERMISSION (83-92%): What removes their guilt/fear to act?
   - ACTION (92-100%): The exact single next step

═══ SECTION 4: HOOK LABORATORY ═══
Generate 5 hooks — one per formula. Each is the exact first spoken line (1-2 sentences max).
Score each: pattern_interrupt (0-10) + audience_match (0-10) + gap_score (0-10) = total

Formulas:
1. BROKEN PROMISE: Challenge a belief they hold
2. DRAMATIC RESULT: Lead with transformation (from X to Y in Z time)
3. CURIOSITY GAP: Open a loop they must close
4. TRIBAL CALL: Speak directly to their identity
5. PATTERN BREAK: Start mid-action, no context, no introduction

Respond with ONLY this JSON — no text before or after, no markdown:
{
  "bracket": {
    "seconds": ${MAX_SCRIPT_SECONDS},
    "reason": "one sentence"
  },
  "audience": {
    "two_am_thought": "specific",
    "secret_desire": "specific",
    "social_fear": "specific",
    "failed_attempt": "specific",
    "their_language": ["phrase1","phrase2","phrase3","phrase4","phrase5"],
    "identity": "specific",
    "permission_block": "specific",
    "after_state": "cinematically specific",
    "hook_insight": "single most powerful emotional lever"
  },
  "competitive": {
    "saturated_angles": ["angle1","angle2","angle3"],
    "emotional_gap": "specific gap",
    "competitor_weakness": "specific weakness",
    "positioning": "one sentence"
  },
  "arc": {
    "name": "memorable arc name",
    "emotional_throughline": "the thread connecting every stage",
    "stages": [
      {"stage":"PATTERN INTERRUPT","timing":"0-5s","direction":"specific instruction","example":"actual example line","visual":"camera direction"},
      {"stage":"TENSION BUILD","timing":"5-15s","direction":"specific instruction","example":"actual example line","visual":"camera direction"},
      {"stage":"IDENTIFICATION","timing":"15-25s","direction":"specific instruction","example":"actual example line","visual":"camera direction"},
      {"stage":"REVELATION","timing":"25-40s","direction":"specific instruction","example":"actual example line","visual":"camera direction"},
      {"stage":"PROOF","timing":"40-50s","direction":"specific instruction","example":"actual example line","visual":"camera direction"},
      {"stage":"PERMISSION","timing":"50-56s","direction":"specific instruction","example":"actual example line","visual":"camera direction"},
      {"stage":"ACTION","timing":"56-60s","direction":"specific instruction","example":"actual example line","visual":"camera direction"}
    ]
  },
  "hooks": [
    {"formula":"BROKEN PROMISE","hook":"exact first line","visual":"opening camera note","why":"one sentence","pattern_interrupt":8,"audience_match":9,"gap_score":7,"total":24},
    {"formula":"DRAMATIC RESULT","hook":"exact first line","visual":"opening camera note","why":"one sentence","pattern_interrupt":7,"audience_match":8,"gap_score":8,"total":23},
    {"formula":"CURIOSITY GAP","hook":"exact first line","visual":"opening camera note","why":"one sentence","pattern_interrupt":9,"audience_match":7,"gap_score":8,"total":24},
    {"formula":"TRIBAL CALL","hook":"exact first line","visual":"opening camera note","why":"one sentence","pattern_interrupt":7,"audience_match":9,"gap_score":7,"total":23},
    {"formula":"PATTERN BREAK","hook":"exact first line","visual":"opening camera note","why":"one sentence","pattern_interrupt":9,"audience_match":8,"gap_score":8,"total":25}
  ]
}`;

  console.log('   🧠 Call 1: Intelligence Brief...');
  const raw    = await callAI(ai_provider, prompt, userPlan);
  const brief  = extractJSON(raw, null);

  if (!brief?.bracket || !brief?.hooks) {
    console.warn('   ⚠️  Intelligence brief incomplete — using fallback structure');
    return _fallbackBrief(campaignName, productDescription, targetAudience);
  }

  // Sort hooks by total score, pick winner
  brief.hooks = brief.hooks.sort((a, b) => (b.total || 0) - (a.total || 0));
  brief.winnerHook = brief.hooks[0];

  console.log(`   ✅ Call 1 done — ${brief.bracket.seconds}s | Arc: "${brief.arc?.name}" | Hook: ${brief.winnerHook?.formula} (${brief.winnerHook?.total}/30)`);
  return brief;
}

function _fallbackBrief(campaignName, productDescription, targetAudience) {
  return {
    bracket: { seconds: MAX_SCRIPT_SECONDS, reason: 'Default bracket' },
    audience: {
      two_am_thought: `Whether ${productDescription} is the right choice`,
      secret_desire: `A meaningful transformation through ${productDescription}`,
      social_fear: 'Making the wrong decision and being judged for it',
      failed_attempt: 'Generic solutions that overpromised',
      their_language: ['does it work', 'is it worth it', 'real results', 'honest review', 'what happened'],
      identity: 'Someone who makes thoughtful, quality decisions',
      permission_block: 'Uncertainty about whether this will work for them specifically',
      after_state: `Life is meaningfully better with ${productDescription}`,
      hook_insight: 'This audience needs to feel understood before they trust any solution',
    },
    competitive: {
      saturated_angles: ['generic benefit claims', 'price messaging', 'feature lists'],
      emotional_gap: 'The personal identity shift the product enables',
      competitor_weakness: 'Talking about the product instead of the audience',
      positioning: `${campaignName} as the choice that matches who they truly are`,
    },
    arc: {
      name: 'The Transformation Arc',
      emotional_throughline: 'From stuck and frustrated to transformed and proud',
      stages: [
        { stage: 'PATTERN INTERRUPT', timing: '0-5s',  direction: 'Bold unexpected opening', example: 'Stop. Before you scroll past this.', visual: 'Close-up, unexpected angle' },
        { stage: 'TENSION BUILD',     timing: '5-15s', direction: 'Name their pain', example: 'You have tried everything.', visual: 'Relatable scene' },
        { stage: 'IDENTIFICATION',    timing: '15-25s',direction: 'Mirror their experience', example: 'I know exactly how that feels.', visual: 'Direct address' },
        { stage: 'REVELATION',        timing: '25-40s',direction: 'Reveal the solution', example: 'That is why we built this.', visual: 'Product reveal' },
        { stage: 'PROOF',             timing: '40-50s',direction: 'One specific result', example: 'In 30 days, everything changed.', visual: 'Real result shown' },
        { stage: 'PERMISSION',        timing: '50-56s',direction: 'Remove the guilt', example: 'You deserve this.', visual: 'Warm, direct' },
        { stage: 'ACTION',            timing: '56-60s',direction: 'Single next step', example: 'Link in bio. Start today.', visual: 'Clear CTA' },
      ],
    },
    hooks: [
      { formula: 'CURIOSITY GAP', hook: `What if everything you know about ${productDescription} is wrong?`, visual: 'Close-up, direct eye contact', why: 'Opens a compelling loop', pattern_interrupt: 8, audience_match: 7, gap_score: 8, total: 23 },
    ],
    winnerHook: { formula: 'CURIOSITY GAP', hook: `What if everything you know about ${productDescription} is wrong?`, visual: 'Close-up, direct eye contact', why: 'Opens a compelling loop', pattern_interrupt: 8, audience_match: 7, gap_score: 8, total: 23 },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALL 2 — SCRIPT CONSTRUCTION + SCORING
// ═══════════════════════════════════════════════════════════════════════════════
// Writes the complete production-ready script using the intelligence brief
// Scores it in the same response — no separate scoring call

async function generateScriptAndScore({
  campaignName, productDescription, targetAudience,
  brief, brand, productionBrief, ai_provider, userPlan,
}) {
  const brandCtx = buildBrandContext(brand);
  const prodCtx  = buildProductionContext(productionBrief);
  const secs     = brief.bracket.seconds;
  const arc      = brief.arc;
  const hook     = brief.winnerHook;
  const audience = brief.audience;
  const format   = productionBrief?.videoFormat || 'single_narrator';

  const formatInstructions = {
    single_narrator: 'One presenter speaks directly to camera. Write every spoken word.',
    two_character:   'Two characters in conversation. Label every line [CHARACTER A] or [CHARACTER B]. IVey assigns roles: Character A is the audience member (has the problem), Character B is the knowledgeable guide (has the solution). Dialogue must feel natural — not scripted.',
    multi_character: 'Multiple characters in a scene. Assign roles from the audience profile. Label each speaker. Keep it cinematic.',
    voiceover:       'Voiceover narration — no on-screen presenter. Write the narration text only. Make visual notes rich and cinematic — the visuals carry the emotion.',
    interview:       'Interview format. HOST asks short punchy questions. GUEST gives authentic answers. HOST is curious/skeptical. GUEST is the transformed customer.',
  };

  const prompt = `You are a world-class short-form video scriptwriter. Write a complete ${secs}-second production-ready script and score it.

CAMPAIGN: ${campaignName}
PRODUCT: ${productDescription}
AUDIENCE: ${targetAudience}
${brandCtx}${prodCtx}

FORMAT INSTRUCTION: ${formatInstructions[format] || formatInstructions.single_narrator}

INTELLIGENCE BRIEF (from deep analysis — use every detail):

AUDIENCE PSYCHOLOGY:
- 2am thought: "${audience.two_am_thought}"
- Secret desire: "${audience.secret_desire}"
- Social fear: "${audience.social_fear}"
- Their language: ${audience.their_language?.join(', ')}
- Permission block: "${audience.permission_block}"
- After state: "${audience.after_state}"
- Hook insight: "${audience.hook_insight}"

OPENING HOOK — use this EXACTLY as the first line:
Formula: ${hook?.formula}
"${hook?.hook}"
Opening visual: ${hook?.visual}

NARRATIVE ARC — follow this stage by stage:
${arc?.stages?.map(s => `[${s.timing}] ${s.stage}: ${s.direction}\nExample: "${s.example}"\nVisual: ${s.visual}`).join('\n\n')}

COMPETITIVE POSITIONING:
- Gap to own: "${brief.competitive?.emotional_gap}"
- Avoid: ${brief.competitive?.saturated_angles?.join(', ')}

SCRIPT RULES (non-negotiable):
— Write EVERY word spoken — nothing implied
— Short sentences — written for ears not eyes
— Natural rhythm — how people actually talk
— Zero filler — every second earns its place
— ONE CTA only — one action at the end
— No clichés: no revolutionary, game-changing, limited time

VISUAL NOTE RULES — this is the most important section:
Every single (VISUAL:) note MUST contain ALL of the following elements. No exceptions.
Do not write a generic visual note. Use the exact brand details provided above.

1. PRESENTER — always name the presenter using the narrator profile:
   e.g. "Female, 30s, East African presenter, warm confident energy, direct eye contact"
   If voiceover format — describe what the camera sees instead, no presenter.

2. SETTING — use the exact market and setting style from the production brief:
   e.g. "Nairobi urban street at golden hour" / "Kenyan savanna, red earth, wide shot"
   Never write "modern setting" or "urban environment" — be specific to the market.

3. BRAND VISUALS — inject the brand into every scene:
   - Logo: use the exact logo description from brand profile
     e.g. "MOONRALDS SAFARIS emerald green circular logo, bottom-right corner, 70% opacity"
   - Colors: name the exact primary and secondary colors from brand profile
     e.g. "emerald green (#10b981) overlay fades in" / "amber (#f59e0b) CTA text"
   - Visual style and mood from brand profile — reference them directly

4. CAMERA — be specific about shot type and movement:
   e.g. "close-up, slow push in" / "wide establishing shot, camera drifts right"
   Never write "show the presenter" or "cut to product"

5. MUSIC — first scene only, specify the music direction:
   e.g. "warm Afrobeats instrumental begins, -18dB, builds through scene"

FORMAT each scene EXACTLY like this — no shortcuts:
[0:00–0:05]
(VISUAL: [Camera shot + movement]. [Presenter description + energy]. [Specific setting — market + environment]. [Brand logo placement + color overlay]. [Music direction — first scene only].)
Spoken words here.

EXAMPLE of a correctly formatted visual note:
(VISUAL: Slow push-in, medium close-up. Female, 30s, East African presenter, warm confident energy, direct eye contact, slight smile. Nairobi urban rooftop at golden hour, city skyline behind her. MOONRALDS SAFARIS emerald green circular logo bottom-right corner 70% opacity. Warm Afrobeats instrumental begins -18dB.)

EXAMPLE of an INCORRECTLY formatted visual note — never do this:
(VISUAL: Show the presenter speaking to camera in a modern setting.)

TIMING RULE: This script must run for EXACTLY ${secs} seconds when performed at a natural pace.
Account for: pauses between scenes, character transitions${productionBrief?.videoFormat === 'two_character' || productionBrief?.videoFormat === 'multi_character' ? ', natural dialogue gaps between speakers' : ''}, music intro/outro if specified.
When in doubt — write LESS. A tight ${secs}s script is better than an overlong one.
Do NOT pad with extra lines to fill time. Every line must earn its place.

Write the complete script now. Then append a HeyGen setup block. Then provide the score.

After the script, append this block EXACTLY (fill in the values from the brand and production context above):

---HEYGEN SETUP---
Avatar: [describe the exact presenter — gender, age, ethnicity, energy — so the user knows which HeyGen avatar to select]
Background: [exact setting description — location, time of day, atmosphere]
Brand kit primary color: [exact hex code]
Brand kit secondary color: [exact hex code]
Logo placement: [position, opacity, timing — e.g. bottom-right corner, 70% opacity, throughout]
Music: [exact music style and volume — e.g. Afrobeats instrumental, -18dB, begins at 0:00]
Lower third: [brand name, timing — e.g. "MOONRALDS SAFARIS" appears at 0:03, fades at 0:08]
CTA overlay: [CTA text, timing — e.g. "Link in bio" at 0:37]
Export format: 1080x1920 (9:16) for TikTok/Reels
---END HEYGEN SETUP---

After the HeyGen setup block, respond with this JSON on a new line (no markdown):
SCORE_JSON:{"score":72,"predicted_views":"1M-10M","features":{"hook_strength":8,"emotion_curve":7,"specificity":8,"audience_match":8,"platform_fit":7,"cta_strength":7,"shareability":7},"strengths":["strength1","strength2"],"improvements":["improvement1","improvement2"]}`;

  console.log('   ✍️  Call 2: Writing script...');
  const raw = await callAI(ai_provider, prompt, userPlan);

  // Split script from score JSON
  const scoreMarker = raw.indexOf('SCORE_JSON:');
  let script = raw;
  let scoring = { score: 65, predicted_views: 'Unknown', features: {}, strengths: [], improvements: [] };

  if (scoreMarker !== -1) {
    script  = raw.slice(0, scoreMarker).trim();
    const scoreRaw = raw.slice(scoreMarker + 'SCORE_JSON:'.length).trim();
    const parsed   = extractJSON(scoreRaw, {});
    if (parsed.score) scoring = parsed;
  }

  // Extract HeyGen setup block from script
  let heygenSetup = null;
  const heygenStart = script.indexOf('---HEYGEN SETUP---');
  const heygenEnd   = script.indexOf('---END HEYGEN SETUP---');
  if (heygenStart !== -1 && heygenEnd !== -1) {
    const setupRaw = script.slice(heygenStart + '---HEYGEN SETUP---'.length, heygenEnd).trim();
    heygenSetup    = {};
    setupRaw.split('\n').forEach(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) return;
      const key = line.slice(0, colonIdx).trim().toLowerCase().replace(/\s+/g, '_');
      const val = line.slice(colonIdx + 1).trim();
      if (key && val) heygenSetup[key] = val;
    });
    // Remove setup block from script — keep script clean for HeyGen paste
    script = (script.slice(0, heygenStart) + script.slice(heygenEnd + '---END HEYGEN SETUP---'.length)).trim();
  }

  console.log(`   ✅ Call 2 done — Script: ${script.length} chars | Score: ${scoring.score}/100 | ${scoring.predicted_views} views`);

  return { script, heygenSetup, ...scoring };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ENTRY — generateVideoScriptAI
// ═══════════════════════════════════════════════════════════════════════════════

export const generateVideoScriptAI = async ({
  campaignName, productDescription, targetAudience,
  durationSeconds, brand, productionBrief,
  ai_provider = 'gemini', userPlan = 'free',
}) => {
  console.log(`\n⚡ IVey Engine v4 — "${campaignName}"`);
  console.log(`   Provider: ${ai_provider} | Plan: ${userPlan} | Format: ${productionBrief?.videoFormat || 'single_narrator'}`);

  // Optional: quick web research (non-blocking, no API call if Brave not configured)
  let webResearch = '';
  try {
    const results = await Promise.all([
      _searchWeb(`${productDescription} marketing ${productionBrief?.primaryMarket || ''} 2025`),
      _searchWeb(`${targetAudience} desires pain points`),
    ]);
    webResearch = results.filter(Boolean).join('\n');
    if (webResearch) console.log('   🔍 Web research: found context');
  } catch {}

  // ── CALL 1: Intelligence Brief ────────────────────────────────────────────
  const brief = await generateIntelligenceBrief({
    campaignName, productDescription, targetAudience,
    brand, productionBrief, ai_provider, userPlan, webResearch,
  });

  // Override bracket if user specified duration
  if (durationSeconds) {
    const capped = Math.min(Number(durationSeconds), MAX_SCRIPT_SECONDS);
    brief.bracket.seconds = capped <= 30 ? 30 : MAX_SCRIPT_SECONDS;
    brief.bracket.reason  = 'User specified duration';
  }

  // ── CALL 2: Script + Score ────────────────────────────────────────────────
  const result = await generateScriptAndScore({
    campaignName, productDescription, targetAudience,
    brief, brand, productionBrief, ai_provider, userPlan,
  });

  console.log(`\n✅ IVey Engine v4 complete — "${campaignName}"`);
  console.log(`   📺 ${brief.bracket.seconds}s | 🏆 Score: ${result.score}/100 | ${result.predicted_views}`);
  console.log(`   🎣 Hook: ${brief.winnerHook?.formula} | 🎭 Arc: ${brief.arc?.name}`);

  return {
    // Primary output
    script:         result.script,
    seconds:        brief.bracket.seconds,
    bracketReason:  brief.bracket.reason,

    // Scores
    viralScore:     result.score,
    predictedViews: result.predicted_views,
    scoreFeatures:  result.features,
    strengths:      result.strengths,
    improvements:   result.improvements,

    // Intelligence — surfaced to UI
    audienceProfile:  brief.audience,
    competitiveGap:   brief.competitive,
    narrativeArc:     brief.arc,
    hooks:            brief.hooks,
    winnerHook:       brief.winnerHook,
    productionBrief,

    // No multi-draft in v4 — single best script
    drafts: [{
      type:            'primary',
      label:           'IVey Script',
      script:          result.script,
      score:           result.score,
      predicted_views: result.predicted_views,
      strengths:       result.strengths,
      improvements:    result.improvements,
    }],
    winningDraft:   'primary',
    optimizedHook:  brief.winnerHook?.hook || '',
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// MARKETING STRATEGY
// ═══════════════════════════════════════════════════════════════════════════════

export const generateMarketingStrategyAI = async (campaignData, userPlan = 'free') => {
  const { name, product_description, target_audience, output_formats, ai_provider, brand } = campaignData;
  console.log(`\n📊 Strategy: ${name}`);

  const brandCtx = buildBrandContext(brand);
  const research = await _searchWeb(`${product_description} marketing strategy 2025`);

  const prompt = `Generate a video-first marketing strategy.
${brandCtx}${research ? `\nMARKET RESEARCH:\n${research}\n` : ''}
Campaign: ${name}
Product: ${product_description}
Audience: ${target_audience}
Formats: ${output_formats?.join(', ') || 'video, social'}

Cover:
## 1. CAMPAIGN INTELLIGENCE — key insight and opportunity
## 2. VIDEO CONTENT STRATEGY — hook angle, emotional arc, bracket recommendation
## 3. TARGET AUDIENCE DEEP DIVE — fears, desires, language, shareability triggers
## 4. CONTENT PILLARS — 3-4 themes with percentage split
## 5. PLATFORM DISTRIBUTION — where, when, how often
## 6. VIRAL TRIGGERS — specific elements that drive shares
## 7. SUCCESS METRICS — realistic KPIs
## 8. 30-DAY ACTION PLAN — week by week

Be specific and actionable.`;

  const strategy = await callAI(ai_provider || 'gemini', prompt, userPlan);
  console.log('   ✅ Strategy done');
  return strategy;
};

// ═══════════════════════════════════════════════════════════════════════════════
// CAPTION GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

export const generateCaptionAI = async ({
  campaignName, productDescription, targetAudience,
  format, platform, brand, ai_provider = 'gemini', userPlan = 'free',
}) => {
  const rules = {
    twitter:   'Max 280 chars. Punchy hook. 2-3 hashtags. One clear CTA.',
    instagram: '150-300 chars. Emoji-friendly. 10-15 hashtags.',
    facebook:  '2-3 sentences. Story-driven. End with a question.',
    linkedin:  'Professional. Insight-led. 3-5 hashtags.',
    tiktok:    'Short and punchy. Trending hashtags. Call to duet/stitch.',
    youtube:   '100-150 chars. Curiosity-driven. Include keywords.',
  };
  const brandCtx = buildBrandContext(brand);

  const prompt = `Write a ${platform} caption. Output ONLY the caption — no explanation.
${brandCtx}
Rules: ${rules[platform] || 'Engaging, clear CTA, hashtags'}
Campaign: ${campaignName}
Product: ${productDescription}
Audience: ${targetAudience}
Format: ${format}`;

  return await callAI(ai_provider || 'gemini', prompt, userPlan);
};


// ═══════════════════════════════════════════════════════════════════════════════
// BRAND URL ANALYZER
// Fetches website, extracts visual identity, runs Claude Vision on logo
// ═══════════════════════════════════════════════════════════════════════════════

export async function analyzeBrandUrlAI(websiteUrl, ai_provider = 'claude') {
  console.log(`\n🔍 Brand URL Analysis: ${websiteUrl}`);

  // ── Step 1: Fetch website HTML ──────────────────────────────────────────────
  let html = '';
  let finalUrl = websiteUrl;
  try {
    const res = await fetch(websiteUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IVeyBot/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    html = await res.text();
    finalUrl = res.url;
    console.log('   ✅ Website fetched:', html.length, 'chars');
  } catch (e) {
    console.warn('   ⚠️  Could not fetch website:', e.message);
  }

  // ── Step 2: Extract meta tags and assets ────────────────────────────────────
  const extract = (pattern, fallback = '') => {
    const m = html.match(pattern);
    return m ? m[1].trim() : fallback;
  };

  const urlObj    = new URL(websiteUrl);
  const origin    = urlObj.origin;
  const hostname  = urlObj.hostname;

  // Logo candidates — ordered by quality
  const ogImage     = extract(/og:image[^>]*content="([^"]+)"/i) ||
                      extract(/property="og:image"[^>]*content="([^"]+)"/i) ||
                      extract(/content="([^"]+)"[^>]*og:image/i);
  const appleTouchIcon = extract(/apple-touch-icon[^>]*href="([^"]+)"/i);
  const favicon192  = extract(/icon[^>]*sizes="192x192"[^>]*href="([^"]+)"/i);
  const favicon     = extract(/rel="icon"[^>]*href="([^"]+)"/i) ||
                      extract(/rel="shortcut icon"[^>]*href="([^"]+)"/i);

  // Resolve relative URLs
  const resolveUrl = (u) => {
    if (!u) return null;
    if (u.startsWith('http')) return u;
    if (u.startsWith('//')) return `https:${u}`;
    if (u.startsWith('/')) return `${origin}${u}`;
    return `${origin}/${u}`;
  };

  // Pick best logo — prefer OG image (usually largest), then apple touch icon
  const logoUrl = resolveUrl(ogImage) ||
                  resolveUrl(appleTouchIcon) ||
                  resolveUrl(favicon192) ||
                  `https://www.google.com/s2/favicons?domain=${hostname}&sz=256`;

  // Meta content
  const title       = extract(/<title>([^<]+)<\/title>/i) ||
                      extract(/og:title[^>]*content="([^"]+)"/i) ||
                      hostname;
  const description = extract(/og:description[^>]*content="([^"]+)"/i) ||
                      extract(/name="description"[^>]*content="([^"]+)"/i) ||
                      extract(/content="([^"]+)"[^>]*name="description"/i);
  const themeColor  = extract(/name="theme-color"[^>]*content="([^"]+)"/i) ||
                      extract(/content="([^"]+)"[^>]*name="theme-color"/i);

  // Extract visible text from hero/header area (first 3000 chars of body)
  const bodyText = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 3000)
    .trim();

  console.log(`   📋 Title: ${title}`);
  console.log(`   🖼️  Logo: ${logoUrl}`);
  console.log(`   🎨 Theme color: ${themeColor || 'not found'}`);

  // ── Step 3: Vision analysis of logo + brand copy ────────────────────────────
  const visionPrompt = `Analyze this brand's visual identity and extract structured intelligence for video script generation.

Website: ${websiteUrl}
Page title: ${title}
Meta description: ${description || 'not available'}
Theme color: ${themeColor || 'not specified'}
Homepage copy excerpt: "${bodyText.slice(0, 1500)}"
Logo URL: ${logoUrl}

Based on everything above, provide a complete brand intelligence profile.
Focus on what a video scriptwriter needs: visual details, tone, audience, and identity.

Respond ONLY with valid JSON — no text before or after:
{
  "brand_name": "extracted or inferred brand name",
  "tagline": "extracted tagline or slogan",
  "industry": "industry category",
  "brand_voice": "tone description — e.g. bold and confident, warm and nurturing",
  "visual_identity": {
    "primary_color": "#hexcode or color name",
    "secondary_color": "#hexcode or color name",
    "logo_description": "detailed visual description of the logo — shape, colors, style, mood",
    "visual_style": "clean minimal / bold graphic / luxury / playful / corporate / natural",
    "mood_words": ["word1", "word2", "word3"]
  },
  "brand_story": "2-3 sentence brand story inferred from the copy",
  "key_offerings": ["main product/service 1", "main product/service 2"],
  "target_audience": "description of who this brand serves",
  "pain_points": "what problems this brand solves",
  "audience_desires": "what the audience wants",
  "script_visual_notes": "specific instructions for video visual notes — e.g. always show logo bottom-right, use emerald green overlays, outdoor natural settings",
  "words_always": ["brand language to always use"],
  "words_never": ["language that conflicts with brand voice"]
}`;

  try {
    // Try with vision if we have a logo image
    let analysisRaw;
    if (logoUrl && ANTHROPIC_API_KEY) {
      try {
        // Fetch logo as base64 for vision
        const imgRes = await fetch(logoUrl, { signal: AbortSignal.timeout(5000) });
        if (imgRes.ok) {
          const imgBuffer = await imgRes.arrayBuffer();
          const base64    = Buffer.from(imgBuffer).toString('base64');
          const mimeType  = imgRes.headers.get('content-type')?.split(';')[0] || 'image/png';

          // Only use image if it's actually an image type
          if (mimeType.startsWith('image/') && base64.length > 100) {
            console.log(`   👁️  Running vision analysis on logo (${mimeType})...`);
            const visionRes = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 2048,
                messages: [{
                  role: 'user',
                  content: [
                    { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
                    { type: 'text', text: visionPrompt },
                  ],
                }],
              }),
            });
            if (visionRes.ok) {
              const visionData = await visionRes.json();
              analysisRaw = visionData.content?.[0]?.text;
              console.log('   ✅ Vision analysis complete');
            }
          }
        }
      } catch (visionErr) {
        console.warn('   ⚠️  Vision failed, falling back to text analysis:', visionErr.message);
      }
    }

    // Fallback: text-only analysis if vision failed
    if (!analysisRaw) {
      console.log('   📝 Running text-only brand analysis...');
      analysisRaw = await callAI(ai_provider, visionPrompt);
    }

    const intelligence = extractJSON(analysisRaw, null);
    if (!intelligence?.brand_name) throw new Error('Incomplete brand analysis');

    // Merge extracted metadata with AI analysis
    if (themeColor && !intelligence.visual_identity?.primary_color) {
      intelligence.visual_identity = intelligence.visual_identity || {};
      intelligence.visual_identity.primary_color = themeColor;
    }
    intelligence.logo_url   = logoUrl;
    intelligence.website_url = websiteUrl;

    console.log(`   ✅ Brand Intelligence: "${intelligence.brand_name}" | ${intelligence.visual_identity?.visual_style} | ${intelligence.brand_voice}`);
    return intelligence;

  } catch (e) {
    console.warn('   ⚠️  Brand analysis failed:', e.message);
    // Return basic fallback with what we could extract
    return {
      brand_name:       title || hostname,
      tagline:          description || '',
      industry:         '',
      brand_voice:      'professional and engaging',
      visual_identity:  {
        primary_color:    themeColor || '',
        logo_description: `Logo from ${hostname}`,
        visual_style:     'professional',
        mood_words:       ['professional', 'trustworthy'],
      },
      brand_story:      description || '',
      key_offerings:    [],
      target_audience:  '',
      pain_points:      '',
      audience_desires: '',
      script_visual_notes: `Show ${title} branding throughout`,
      words_always:     [],
      words_never:      [],
      logo_url:         logoUrl,
      website_url:      websiteUrl,
    };
  }
}

// ── Legacy stubs ──────────────────────────────────────────────────────────────
export const generateImagesAI = async () => [];
export const generateVisualAI = async () => ({ imageUrl: null });
export { generateMarketingStrategyAI as generateStrategyAI };