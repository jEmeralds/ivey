// ═══════════════════════════════════════════════════════════════════════════════
// IVey AI Engine — v3.0  (Phase 1 — Foundation Intelligence)
// ───────────────────────────────────────────────────────────────────────────────
// 5 layers run before a word of script is written:
//
//  L1  Audience Excavation    — 8 psychological questions, JSON profile
//  L2  Competitive Landscape  — web research, gap identification
//  L3  Narrative Architecture — custom 7-stage emotional arc
//  L4  Hook Laboratory        — 5 formulas, scored, top selected
//  L5  Script Construction    — 3 drafts (Emotional/Direct/Narrative), auto-scored
//
// Provider registry — free tier default, paid tier unlocked per plan.
// Adding a new provider = 1 entry in PROVIDERS + 1 case in callAI().
// ═══════════════════════════════════════════════════════════════════════════════

import fetch from 'node-fetch';

// ── Environment ───────────────────────────────────────────────────────────────
const GEMINI_API_KEY       = process.env.GEMINI_API_KEY;
const ANTHROPIC_API_KEY    = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY       = process.env.OPENAI_API_KEY;
const BRAVE_SEARCH_API_KEY = process.env.BRAVE_SEARCH_API_KEY;

// ── Provider registry ─────────────────────────────────────────────────────────
export const PROVIDERS = {
  GEMINI:        { id: 'gemini',        tier: 'free', name: 'Gemini 2.5 Flash'  },
  CLAUDE_HAIKU:  { id: 'claude-haiku',  tier: 'free', name: 'Claude Haiku'      },
  CLAUDE_SONNET: { id: 'claude',        tier: 'paid', name: 'Claude Sonnet'     },
  GPT4O:         { id: 'openai',        tier: 'paid', name: 'GPT-4o'            },
  GPT4O_MINI:    { id: 'openai-mini',   tier: 'paid', name: 'GPT-4o Mini'       },
  GROK:          { id: 'grok',          tier: 'paid', name: 'Grok (xAI)'        },
  MISTRAL:       { id: 'mistral',       tier: 'paid', name: 'Mistral Large'     },
};

const SYSTEM = `You are an expert viral marketing strategist and world-class video scriptwriter. 
Be specific, creative, and deeply psychological in your approach.`;

// ── Provider router ───────────────────────────────────────────────────────────
export async function callAI(provider = 'gemini', prompt, userPlan = 'free') {
  const resolved = _resolveProvider(provider, userPlan);
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

function _resolveProvider(requested, userPlan = 'free') {
  const entry = Object.values(PROVIDERS).find(p => p.id === requested);
  if (!entry) return 'gemini';
  if (entry.tier === 'paid' && userPlan === 'free') {
    console.log(`   ℹ️  ${entry.name} requires paid plan — using Gemini`);
    return 'gemini';
  }
  return entry.id;
}

export function getAvailableProviders(userPlan = 'free') {
  return Object.values(PROVIDERS)
    .filter(p => userPlan !== 'free' || p.tier === 'free')
    .map(p => ({ id: p.id, name: p.name, tier: p.tier }));
}

// ── Raw provider implementations ──────────────────────────────────────────────
async function _gemini(prompt) {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.75, maxOutputTokens: 8192 },
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
    body: JSON.stringify({ model, messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }], max_tokens: 8192, temperature: 0.75 }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(`OpenAI: ${e.error?.message}`); }
  return (await res.json()).choices[0].message.content;
}

async function _grok(prompt) {
  const key = process.env.GROK_API_KEY;
  if (!key) throw new Error('Grok API key not configured');
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'grok-2-latest', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }], max_tokens: 8192, temperature: 0.75 }),
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
    body: JSON.stringify({ model: 'mistral-large-latest', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }], max_tokens: 8192, temperature: 0.75 }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(`Mistral: ${e.error?.message}`); }
  return (await res.json()).choices[0].message.content;
}

// ── JSON extractor helper ─────────────────────────────────────────────────────
function extractJSON(raw, fallback = {}) {
  try {
    // Try direct parse first
    const clean = raw.trim().replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(clean);
  } catch {
    try {
      // Extract first JSON object or array
      const match = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (match) return JSON.parse(match[0]);
    } catch {}
  }
  return fallback;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESEARCH LAYER
// ═══════════════════════════════════════════════════════════════════════════════

async function _searchWeb(query) {
  if (BRAVE_SEARCH_API_KEY) {
    try {
      const res = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
        { headers: { Accept: 'application/json', 'X-Subscription-Token': BRAVE_SEARCH_API_KEY } }
      );
      if (res.ok) return (await res.json()).web?.results?.slice(0, 5).map(r => r.description).filter(Boolean) || [];
    } catch {}
  }
  try {
    const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
    if (res.ok) {
      const d = await res.json();
      const r = [];
      if (d.AbstractText) r.push(d.AbstractText);
      d.RelatedTopics?.slice(0, 4).forEach(t => { if (t.Text) r.push(t.Text); });
      return r;
    }
  } catch {}
  return [];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BRAND CONTEXT BUILDER
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
  return `\n--- BRAND PROFILE ---\n${lines.join('\n')}\nAll content must reflect this brand consistently.\n---\n`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 1 — AUDIENCE EXCAVATION
// ═══════════════════════════════════════════════════════════════════════════════
// Returns structured audience psychology profile as JSON

export async function excavateAudienceAI({ campaignName, productDescription, targetAudience, brand, ai_provider = 'gemini', userPlan = 'free' }) {
  const brandCtx = buildBrandContext(brand);

  const prompt = `You are a deep consumer psychologist and viral marketing strategist.

Before any script is written, you must answer 8 excavation questions about this specific audience.
This profile will guide every decision in the campaign — hook selection, narrative arc, script tone.

Campaign: ${campaignName}
Product/Service: ${productDescription}
Target Audience: ${targetAudience}
${brandCtx}

Answer all 8 questions with SPECIFICITY. Not generic marketing answers — real psychological insight.

1. THE 2AM THOUGHT: What does this audience say to themselves at 2am when they cannot sleep? What specific worry, regret, or longing keeps them awake?

2. THE SECRET DESIRE: What transformation do they secretly want but would not admit to their friends or family? What do they dream about having or becoming?

3. THE SOCIAL FEAR: What do they fear their peers, colleagues, or family think of them? What judgment are they most trying to avoid?

4. THE FAILED ATTEMPT: What have they already tried that did not work? What solution disappointed them before this one?

5. THEIR EXACT LANGUAGE: What specific words, phrases, and expressions do they actually use? Not marketing language — the words they type into Google at midnight.

6. THE IDENTITY STATEMENT: How do they see themselves? What tribe do they belong to? What values or beliefs define them?

7. THE PERMISSION BLOCK: What specific guilt, fear, or objection is stopping them from taking action right now?

8. THE AFTER STATE: Describe EXACTLY how their daily life looks, feels, sounds, and smells after they have this product or experience. Be cinematically specific.

Respond ONLY with valid JSON — no text before or after:
{
  "two_am_thought": "specific answer",
  "secret_desire": "specific answer",
  "social_fear": "specific answer",
  "failed_attempt": "specific answer",
  "their_language": ["phrase1", "phrase2", "phrase3", "phrase4", "phrase5"],
  "identity_statement": "specific answer",
  "permission_block": "specific answer",
  "after_state": "cinematically specific description",
  "hook_insight": "one sentence: the single most powerful emotional lever for this audience"
}`;

  console.log('   🧠 L1: Excavating audience psychology...');
  try {
    const raw = await callAI(ai_provider, prompt, userPlan);
    const profile = extractJSON(raw, {});
    if (!profile.two_am_thought) throw new Error('Incomplete profile');
    console.log(`   ✅ L1: Hook insight — "${profile.hook_insight?.slice(0, 60)}..."`);
    return profile;
  } catch (e) {
    console.warn('   ⚠️  L1 failed, using fallback:', e.message);
    return {
      two_am_thought: `Whether investing in ${productDescription} is the right decision`,
      secret_desire: `To transform their life through ${productDescription}`,
      social_fear: 'Making the wrong choice and being judged for it',
      failed_attempt: 'Generic solutions that overpromised and underdelivered',
      their_language: ['is it worth it', 'does it actually work', 'real results', 'honest review'],
      identity_statement: `Someone who makes thoughtful decisions and values quality`,
      permission_block: 'Uncertainty about whether this will actually work for them specifically',
      after_state: `Their life is meaningfully improved by ${productDescription}`,
      hook_insight: `This audience needs to feel understood before they will believe any solution`,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 2 — COMPETITIVE LANDSCAPE
// ═══════════════════════════════════════════════════════════════════════════════
// Returns competitive analysis and gap identification

export async function analyzeCompetitiveLandscapeAI({ campaignName, productDescription, targetAudience, audienceProfile, ai_provider = 'gemini', userPlan = 'free' }) {
  console.log('   🔍 L2: Researching competitive landscape...');

  // Parallel web research
  const [marketResults, audienceResults, trendResults] = await Promise.all([
    _searchWeb(`${productDescription} marketing video examples viral 2025`),
    _searchWeb(`${targetAudience} what they want pain points 2025`),
    _searchWeb(`${campaignName} ${productDescription} competitors advertising`),
  ]);

  const researchData = [...marketResults, ...audienceResults, ...trendResults]
    .filter(Boolean).slice(0, 12).join('\n• ');

  const audienceCtx = audienceProfile ? `
Audience psychology already excavated:
- They say at 2am: "${audienceProfile.two_am_thought}"
- Secret desire: "${audienceProfile.secret_desire}"
- Their language: ${audienceProfile.their_language?.join(', ')}
` : '';

  const prompt = `You are a competitive intelligence analyst for viral video marketing.

Campaign: ${campaignName}
Product: ${productDescription}
Audience: ${targetAudience}
${audienceCtx}

Market research gathered:
• ${researchData || 'No external data — use your knowledge of this market'}

Analyze the competitive landscape and identify the EMOTIONAL GAP — the territory competitors are ignoring.

Respond ONLY with valid JSON:
{
  "saturated_angles": ["angle competitors are overusing 1", "angle 2", "angle 3"],
  "emotional_gap": "The specific emotional territory nobody is owning in this space",
  "competitor_weakness": "The most common failure point in competitor messaging",
  "trending_hooks": ["hook style that is working in this category right now", "another"],
  "audience_language_gap": "The words the audience uses that competitors never use",
  "positioning_opportunity": "One sentence: the unique position IVey should claim for this campaign",
  "avoid": ["what to avoid in the script — overused phrase or angle 1", "avoid 2"]
}`;

  try {
    const raw = await callAI(ai_provider, prompt, userPlan);
    const gap = extractJSON(raw, {});
    console.log(`   ✅ L2: Gap found — "${gap.emotional_gap?.slice(0, 60)}..."`);
    return gap;
  } catch (e) {
    console.warn('   ⚠️  L2 failed, using fallback:', e.message);
    return {
      saturated_angles: ['generic benefit claims', 'price-focused messaging', 'feature lists'],
      emotional_gap: 'The personal transformation and identity shift the product enables',
      competitor_weakness: 'Talking about the product instead of the audience',
      trending_hooks: ['transformation stories', 'before/after reveals', 'behind the scenes authenticity'],
      audience_language_gap: 'Real unfiltered language vs polished marketing speak',
      positioning_opportunity: `${campaignName} as the choice that matches who they truly are`,
      avoid: ['corporate language', 'generic superlatives', 'feature-first framing'],
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 3 — NARRATIVE ARCHITECTURE
// ═══════════════════════════════════════════════════════════════════════════════
// Designs the custom emotional arc for this specific campaign

export async function designNarrativeArcAI({ campaignName, productDescription, targetAudience, seconds, audienceProfile, competitiveGap, brand, ai_provider = 'gemini', userPlan = 'free' }) {
  const brandCtx = buildBrandContext(brand);

  const audienceCtx = audienceProfile ? `
AUDIENCE PSYCHOLOGY:
- 2am thought: "${audienceProfile.two_am_thought}"
- Secret desire: "${audienceProfile.secret_desire}"
- Social fear: "${audienceProfile.social_fear}"
- Their language: ${audienceProfile.their_language?.join(', ')}
- Permission block: "${audienceProfile.permission_block}"
- After state: "${audienceProfile.after_state}"
- Hook insight: "${audienceProfile.hook_insight}"
` : '';

  const gapCtx = competitiveGap ? `
COMPETITIVE POSITIONING:
- Emotional gap to own: "${competitiveGap.emotional_gap}"
- Competitor weakness to exploit: "${competitiveGap.competitor_weakness}"
- Positioning opportunity: "${competitiveGap.positioning_opportunity}"
- What to avoid: ${competitiveGap.avoid?.join(', ')}
` : '';

  const prompt = `You are a narrative architect for viral short-form video.

Design the custom emotional journey for this EXACT campaign.
This is NOT a template — it is a scene-by-scene psychological roadmap specific to this audience.

Campaign: ${campaignName}
Product: ${productDescription}
Audience: ${targetAudience}
Duration: ${seconds} seconds
${brandCtx}${audienceCtx}${gapCtx}

Design the 7-stage Narrative Stack for this specific campaign.
Each stage must be customised to this audience's psychology — not generic descriptions.

The 7 stages:
1. PATTERN INTERRUPT (0-${Math.round(seconds*0.08)}s): Something unexpected that breaks autopilot
2. TENSION BUILD (${Math.round(seconds*0.08)}-${Math.round(seconds*0.25)}s): Amplify the desire or pain from the audience profile
3. IDENTIFICATION (${Math.round(seconds*0.25)}-${Math.round(seconds*0.42)}s): The viewer thinks "this knows me exactly"
4. REVELATION (${Math.round(seconds*0.42)}-${Math.round(seconds*0.67)}s): The solution is revealed
5. PROOF (${Math.round(seconds*0.67)}-${Math.round(seconds*0.83)}s): One specific, credible result
6. PERMISSION (${Math.round(seconds*0.83)}-${Math.round(seconds*0.92)}s): Remove the guilt/fear blocking action
7. ACTION (${Math.round(seconds*0.92)}-${seconds}s): The exact next step

Respond ONLY with valid JSON:
{
  "arc_name": "A memorable name for this narrative approach",
  "stages": [
    {
      "stage": "PATTERN INTERRUPT",
      "timing": "0-${Math.round(seconds*0.08)}s",
      "what_happens": "Specific description of what this scene does emotionally",
      "example_line": "An actual example line the presenter might say",
      "visual_note": "What the camera should show"
    }
  ],
  "emotional_throughline": "The single emotional thread that runs through every stage",
  "key_tension": "The specific tension that keeps viewers watching until the end"
}`;

  console.log('   🎭 L3: Designing narrative architecture...');
  try {
    const raw = await callAI(ai_provider, prompt, userPlan);
    const arc = extractJSON(raw, {});
    console.log(`   ✅ L3: Arc — "${arc.arc_name}" | "${arc.emotional_throughline?.slice(0, 50)}..."`);
    return arc;
  } catch (e) {
    console.warn('   ⚠️  L3 failed, using default arc:', e.message);
    return {
      arc_name: 'The Transformation Arc',
      stages: [
        { stage: 'PATTERN INTERRUPT', timing: `0-${Math.round(seconds*0.08)}s`, what_happens: 'Bold visual or statement that stops the scroll', example_line: 'Everything you think you know about this is wrong.', visual_note: 'Close-up, unexpected angle' },
        { stage: 'TENSION BUILD', timing: `${Math.round(seconds*0.08)}-${Math.round(seconds*0.25)}s`, what_happens: 'Name the pain the audience knows intimately', example_line: 'You keep waiting for the right moment.', visual_note: 'Relatable scene, real environment' },
        { stage: 'IDENTIFICATION', timing: `${Math.round(seconds*0.25)}-${Math.round(seconds*0.42)}s`, what_happens: 'Mirror their exact internal experience', example_line: 'You know exactly what I am talking about.', visual_note: 'Direct camera address' },
        { stage: 'REVELATION', timing: `${Math.round(seconds*0.42)}-${Math.round(seconds*0.67)}s`, what_happens: 'The product is revealed as the answer', example_line: 'That is exactly why we built this.', visual_note: 'Product reveal with context' },
        { stage: 'PROOF', timing: `${Math.round(seconds*0.67)}-${Math.round(seconds*0.83)}s`, what_happens: 'One specific credible result', example_line: 'In 30 days, everything changed.', visual_note: 'Real result or testimonial' },
        { stage: 'PERMISSION', timing: `${Math.round(seconds*0.83)}-${Math.round(seconds*0.92)}s`, what_happens: 'Remove the guilt of taking action', example_line: 'You deserve this.', visual_note: 'Warm, direct' },
        { stage: 'ACTION', timing: `${Math.round(seconds*0.92)}-${seconds}s`, what_happens: 'Exact single next step', example_line: 'Link in bio. Start today.', visual_note: 'Clear CTA graphic' },
      ],
      emotional_throughline: 'From stuck and frustrated to transformed and proud',
      key_tension: 'Will they finally take the step they have been postponing?',
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 4 — HOOK LABORATORY
// ═══════════════════════════════════════════════════════════════════════════════
// Generates 5 hooks, scores each, returns all + top pick

export async function runHookLaboratoryAI({ campaignName, productDescription, targetAudience, seconds, audienceProfile, competitiveGap, brand, ai_provider = 'gemini', userPlan = 'free' }) {
  const brandCtx = buildBrandContext(brand);

  const audienceCtx = audienceProfile ? `
Audience psychology:
- Hook insight: "${audienceProfile.hook_insight}"
- 2am thought: "${audienceProfile.two_am_thought}"
- Secret desire: "${audienceProfile.secret_desire}"
- Their language: ${audienceProfile.their_language?.join(', ')}
` : '';

  const gapCtx = competitiveGap ? `
Competitive gap: "${competitiveGap.emotional_gap}"
Avoid: ${competitiveGap.avoid?.join(', ')}
` : '';

  const prompt = `You are a viral hook specialist. Generate 5 hooks for this ${seconds}s video, each using a different formula.

Campaign: ${campaignName}
Product: ${productDescription}
Audience: ${targetAudience}
${brandCtx}${audienceCtx}${gapCtx}

THE 5 HOOK FORMULAS (use one each):
1. BROKEN PROMISE: Challenge a belief they hold. "Everything you have been told about X is wrong"
2. DRAMATIC RESULT: Lead with transformation. "I went from X to Y in Z days"  
3. CURIOSITY GAP: Open a loop they must close. "The one thing [authority] does not want you to know"
4. TRIBAL CALL: Speak to their identity. "If you are the kind of person who [specific identity]..."
5. PATTERN BREAK: Start mid-action, no context. No introduction. Drop them into a moment.

SCORING each hook (be honest and critical):
- pattern_interrupt_score (0-10): How unexpected is this? Will it break autopilot?
- audience_match_score (0-10): Does this directly speak to the excavated psychology?
- gap_score (0-10): Does this occupy territory competitors are NOT using?
- total: sum of three scores

The hook must be the EXACT first spoken line — 1-2 sentences maximum.
The visual_note is what the camera shows in that first moment.

Respond ONLY with valid JSON array:
[
  {
    "formula": "BROKEN PROMISE",
    "hook": "The exact first spoken line",
    "visual_note": "What the camera shows",
    "why_it_works": "One sentence psychological explanation",
    "pattern_interrupt_score": 8,
    "audience_match_score": 9,
    "gap_score": 7,
    "total": 24
  }
]`;

  console.log('   🎣 L4: Running Hook Laboratory...');
  try {
    const raw = await callAI(ai_provider, prompt, userPlan);
    let hooks = extractJSON(raw, []);
    if (!Array.isArray(hooks) || hooks.length === 0) throw new Error('No hooks returned');

    // Sort by total score
    hooks = hooks.sort((a, b) => (b.total || 0) - (a.total || 0));
    const winner = hooks[0];
    console.log(`   ✅ L4: Winner — ${winner.formula} (${winner.total}/30) — "${winner.hook?.slice(0, 50)}..."`);
    return { hooks, winner };
  } catch (e) {
    console.warn('   ⚠️  L4 failed, using fallback hook:', e.message);
    const fallback = {
      formula: 'CURIOSITY GAP',
      hook: `What if everything you thought you knew about ${productDescription} was wrong?`,
      visual_note: 'Close-up shot, direct eye contact, unexpected setting',
      why_it_works: 'Opens an information gap that the brain is compelled to close',
      pattern_interrupt_score: 7, audience_match_score: 7, gap_score: 7, total: 21,
    };
    return { hooks: [fallback], winner: fallback };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 5 — SCRIPT CONSTRUCTION
// ═══════════════════════════════════════════════════════════════════════════════
// Writes 3 drafts, scores each, returns all + winner

async function writeScriptDraft({ draftType, campaignName, productDescription, targetAudience, seconds, audienceProfile, competitiveGap, narrativeArc, winnerHook, brand, ai_provider, userPlan }) {
  const brandCtx = buildBrandContext(brand);

  const draftInstructions = {
    emotional: `DRAFT TYPE: EMOTIONAL
Lead with feeling. Every line is written from inside the audience's emotional world.
Minimal product mention until the revelation stage. Maximum empathy and identification.
The viewer should feel deeply understood before they hear about any solution.`,

    direct: `DRAFT TYPE: DIRECT
Bold, confident, no-nonsense. Lead with the result.
Strong declarative statements. Minimal setup, maximum punch.
For an audience already aware of the category who just needs a reason to choose this.`,

    narrative: `DRAFT TYPE: NARRATIVE
Story-driven. Follow a specific character the audience identifies with.
Use a before/after journey. The product is the turning point.
Best for complex products that need demonstration and emotional investment.`,
  };

  const audienceCtx = audienceProfile ? `
AUDIENCE PSYCHOLOGY (use this in every line):
- 2am thought: "${audienceProfile.two_am_thought}"
- Secret desire: "${audienceProfile.secret_desire}"
- Their language: ${audienceProfile.their_language?.join(', ')}
- After state: "${audienceProfile.after_state}"
- Permission block: "${audienceProfile.permission_block}"
` : '';

  const arcCtx = narrativeArc ? `
NARRATIVE ARC: ${narrativeArc.arc_name}
Emotional throughline: "${narrativeArc.emotional_throughline}"
Key tension: "${narrativeArc.key_tension}"
Follow this arc stage by stage:
${narrativeArc.stages?.map(s => `[${s.timing}] ${s.stage}: ${s.what_happens}`).join('\n')}
` : '';

  const hookCtx = winnerHook ? `
OPENING HOOK (use this exact opening):
Hook formula: ${winnerHook.formula}
First line: "${winnerHook.hook}"
Opening visual: ${winnerHook.visual_note}
` : '';

  const prompt = `You are a world-class short-form video scriptwriter. Write a complete ${seconds}-second video script.

${draftInstructions[draftType]}

Campaign: ${campaignName}
Product: ${productDescription}
Audience: ${targetAudience}
Duration: EXACTLY ${seconds} seconds
${brandCtx}${audienceCtx}${arcCtx}${hookCtx}

SCRIPT RULES (non-negotiable):
— Write EVERY word the presenter speaks
— Short sentences — written for ears, not eyes
— Natural rhythm — how people actually talk
— Zero filler — every second earns its place
— At least 2 sensory details per 30 seconds
— ONE CTA only — asking for multiple actions gets zero
— Visual note per scene in (parentheses) format
— No marketing clichés: no revolutionary, game-changing, limited time offer
— The hook must land in the first 2 seconds

FORMAT — use exactly this for each scene:
[0:00–0:05]
(VISUAL: what the camera shows — movement, subject, mood)
Spoken words here. Short sentences.

This script goes directly into HeyGen. A voice AI reads every word.
Write for ears. Rhythm matters more than grammar.

Start with [0:00] now. Write the complete script.`;

  const script = await callAI(ai_provider, prompt, userPlan);
  return script;
}

async function scoreScript({ script, hook, seconds, platform = 'tiktok', ai_provider = 'gemini', userPlan = 'free' }) {
  const prompt = `Score this ${seconds}s ${platform} video script for viral potential. Be honest and critical.

HOOK: "${hook || script?.slice(0, 100)}"
SCRIPT EXCERPT: "${script?.slice(0, 600)}"

Score each dimension honestly (0-10):
- hook_strength: Does it stop the scroll in under 2 seconds? (be harsh)
- emotion_curve: Does it build tension, peak, and pay off correctly?
- specificity: Are there concrete, sensory details — or vague generalities?
- audience_match: Does it feel written FOR this specific person, not a crowd?
- platform_fit: Is pacing and structure right for short-form video?
- cta_strength: Does the CTA compel exactly ONE clear action?
- shareability: Would someone share this? What is the specific trigger?

VIEW BENCHMARKS: 0-30=<10K | 31-50=10K-100K | 51-70=100K-1M | 71-85=1M-10M | 86-100=10M+

Respond ONLY with JSON:
{
  "score": 72,
  "predicted_views": "1M–10M",
  "features": {
    "hook_strength": 8,
    "emotion_curve": 7,
    "specificity": 8,
    "audience_match": 8,
    "platform_fit": 7,
    "cta_strength": 6,
    "shareability": 7
  },
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["specific improvement 1", "specific improvement 2"],
  "optimized_hook": "A stronger version of the opening line"
}`;

  try {
    const raw = await callAI(ai_provider, prompt, userPlan);
    const scored = extractJSON(raw, {});
    return {
      score:           Math.min(100, Math.max(0, scored.score || 50)),
      predicted_views: scored.predicted_views || 'Unknown',
      features:        scored.features || {},
      strengths:       scored.strengths || [],
      improvements:    scored.improvements || [],
      optimized_hook:  scored.optimized_hook || '',
    };
  } catch {
    return { score: 50, predicted_views: 'Unknown', features: {}, strengths: [], improvements: [], optimized_hook: '' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BRACKET SELECTOR (used before Layer 3 if no duration specified)
// ═══════════════════════════════════════════════════════════════════════════════

export async function selectVideoBracketAI({ campaignName, productDescription, targetAudience, brand, audienceProfile, ai_provider = 'gemini', userPlan = 'free' }) {
  const insightCtx = audienceProfile?.hook_insight
    ? `Audience insight: "${audienceProfile.hook_insight}"`
    : '';

  const prompt = `Choose the ideal video duration for this campaign.
Choose ONLY one of: 30, 45, or 60 seconds.

Campaign: ${campaignName}
Product: ${productDescription}
Audience: ${targetAudience}
${insightCtx}

- 30s: Single benefit, impulse product, audience already aware of category
- 45s: 2-3 benefits, needs some context, lifestyle or service product
- 60s: Complex product, new category, premium pricing, needs full story arc

Respond ONLY with JSON: {"seconds": 45, "reason": "one sentence"}`;

  try {
    const raw = await callAI(ai_provider, prompt, userPlan);
    const p = extractJSON(raw, {});
    const s = [30, 45, 60].includes(Number(p.seconds)) ? Number(p.seconds) : 60;
    console.log(`   🎯 Bracket: ${s}s — ${p.reason}`);
    return { seconds: s, reason: p.reason || '' };
  } catch {
    return { seconds: 60, reason: 'Default — complex campaign' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ENTRY — generateVideoScriptAI
// Orchestrates all 5 layers and returns the complete intelligence package
// ═══════════════════════════════════════════════════════════════════════════════

export const generateVideoScriptAI = async ({
  campaignName, productDescription, targetAudience,
  durationSeconds, brand, ai_provider = 'gemini', userPlan = 'free'
}) => {
  const MAX = 60;
  console.log(`\n⚡ IVey Engine v3 — "${campaignName}"`);
  console.log(`   Provider: ${ai_provider} | Plan: ${userPlan}`);

  // ── L1: Audience Excavation ────────────────────────────────────────────────
  const audienceProfile = await excavateAudienceAI({
    campaignName, productDescription, targetAudience,
    brand, ai_provider, userPlan,
  });

  // ── L2: Competitive Landscape ──────────────────────────────────────────────
  const competitiveGap = await analyzeCompetitiveLandscapeAI({
    campaignName, productDescription, targetAudience,
    audienceProfile, ai_provider, userPlan,
  });

  // ── Bracket selection (uses L1 insight) ────────────────────────────────────
  let secs = durationSeconds ? Math.min(Number(durationSeconds), MAX) : null;
  if (secs) {
    secs = secs <= 30 ? 30 : secs <= 45 ? 45 : 60;
  }
  let bracketReason = '';
  if (!secs) {
    const bracket = await selectVideoBracketAI({
      campaignName, productDescription, targetAudience,
      brand, audienceProfile, ai_provider, userPlan,
    });
    secs = bracket.seconds;
    bracketReason = bracket.reason;
  }

  // ── L3: Narrative Architecture ─────────────────────────────────────────────
  const narrativeArc = await designNarrativeArcAI({
    campaignName, productDescription, targetAudience,
    seconds: secs, audienceProfile, competitiveGap,
    brand, ai_provider, userPlan,
  });

  // ── L4: Hook Laboratory ────────────────────────────────────────────────────
  const { hooks, winner: winnerHook } = await runHookLaboratoryAI({
    campaignName, productDescription, targetAudience,
    seconds: secs, audienceProfile, competitiveGap,
    brand, ai_provider, userPlan,
  });

  // ── L5: Write 3 drafts in parallel ────────────────────────────────────────
  console.log('   ✍️  L5: Writing 3 script drafts...');
  const draftArgs = { campaignName, productDescription, targetAudience, seconds: secs, audienceProfile, competitiveGap, narrativeArc, winnerHook, brand, ai_provider, userPlan };

  const [emotionalDraft, directDraft, narrativeDraft] = await Promise.all([
    writeScriptDraft({ draftType: 'emotional',  ...draftArgs }),
    writeScriptDraft({ draftType: 'direct',     ...draftArgs }),
    writeScriptDraft({ draftType: 'narrative',  ...draftArgs }),
  ]);

  // ── Score all 3 drafts in parallel ────────────────────────────────────────
  console.log('   📊 Scoring all 3 drafts...');
  const [emotionalScore, directScore, narrativeScore] = await Promise.all([
    scoreScript({ script: emotionalDraft,  hook: winnerHook?.hook, seconds: secs, ai_provider, userPlan }),
    scoreScript({ script: directDraft,     hook: winnerHook?.hook, seconds: secs, ai_provider, userPlan }),
    scoreScript({ script: narrativeDraft,  hook: winnerHook?.hook, seconds: secs, ai_provider, userPlan }),
  ]);

  // ── Pick winner ────────────────────────────────────────────────────────────
  const drafts = [
    { type: 'emotional',  label: 'Emotional',  script: emotionalDraft,  ...emotionalScore  },
    { type: 'direct',     label: 'Direct',     script: directDraft,     ...directScore     },
    { type: 'narrative',  label: 'Narrative',  script: narrativeDraft,  ...narrativeScore  },
  ];
  drafts.sort((a, b) => b.score - a.score);
  const primaryDraft = drafts[0];

  console.log(`\n✅ IVey Engine v3 complete — "${campaignName}"`);
  console.log(`   📺 ${secs}s | 🏆 ${primaryDraft.label} draft wins (${primaryDraft.score}/100) | ${primaryDraft.predicted_views} views`);
  console.log(`   🎣 Hook: ${winnerHook?.formula} | 🧠 Arc: ${narrativeArc.arc_name}`);

  return {
    // Primary script (highest scoring)
    script:          primaryDraft.script,
    seconds:         secs,
    bracketReason,

    // Winning draft info
    winningDraft:    primaryDraft.type,
    viralScore:      primaryDraft.score,
    predictedViews:  primaryDraft.predicted_views,
    scoreFeatures:   primaryDraft.features,
    strengths:       primaryDraft.strengths,
    improvements:    primaryDraft.improvements,
    optimizedHook:   primaryDraft.optimized_hook,

    // All 3 drafts for user to browse
    drafts: drafts.map(d => ({
      type:           d.type,
      label:          d.label,
      script:         d.script,
      score:          d.score,
      predicted_views: d.predicted_views,
      strengths:      d.strengths,
      improvements:   d.improvements,
    })),

    // Intelligence layers — surfaced to UI
    audienceProfile,
    competitiveGap,
    narrativeArc,
    hooks,
    winnerHook,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// MARKETING STRATEGY
// ═══════════════════════════════════════════════════════════════════════════════

export const generateMarketingStrategyAI = async (campaignData, userPlan = 'free') => {
  const { name, product_description, target_audience, output_formats, ai_provider, brand } = campaignData;
  console.log(`\n📊 Strategy: ${name}`);

  const [brandCtx, research] = await Promise.all([
    Promise.resolve(buildBrandContext(brand)),
    (async () => {
      const results = await Promise.all([
        _searchWeb(`${product_description || name} marketing 2025`),
        _searchWeb(`${target_audience} content preferences video 2025`),
      ]);
      const all = [...results[0], ...results[1]].filter(Boolean);
      return all.length ? `\n--- MARKET RESEARCH ---\n${all.map(s => `• ${s}`).join('\n')}\n---\n` : '';
    })(),
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
3-4 themes with percentage split and rationale.

## 5. PLATFORM DISTRIBUTION
Where to post, when, how often. Platform-specific tactics.

## 6. VIRAL TRIGGERS
Specific elements to include that drive shares, comments, saves.

## 7. SUCCESS METRICS
Realistic KPIs based on campaign type.

## 8. 30-DAY ACTION PLAN
Week by week execution roadmap.

Be specific, actionable, and reference the market research above.`;

  const strategy = await callAI(ai_provider || 'gemini', prompt, userPlan);
  console.log('   ✅ Strategy done');
  return strategy;
};

// ═══════════════════════════════════════════════════════════════════════════════
// CAPTION GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

export const generateCaptionAI = async ({ campaignName, productDescription, targetAudience, format, platform, brand, ai_provider = 'gemini', userPlan = 'free' }) => {
  const rules = {
    twitter:   'Max 280 chars. Punchy hook. 2-3 hashtags. One clear CTA.',
    instagram: '150-300 chars. Emoji-friendly. 10-15 hashtags.',
    facebook:  '2-3 sentences. Story-driven. End with a question.',
    linkedin:  'Professional. Insight-led. 3-5 hashtags.',
    tiktok:    'Short and punchy. Trending hashtags. Call to duet/stitch.',
    youtube:   '100-150 chars. Curiosity-driven. Include keywords.',
  };
  const brandCtx = buildBrandContext(brand);
  const voice = brand?.brand_voice ? `Voice: ${brand.brand_voice}. Use: ${brand.words_always?.join(', ') || 'none'}. Avoid: ${brand.words_never?.join(', ') || 'none'}.` : '';

  const prompt = `Write a ${platform} caption.
${brandCtx}${voice ? `\n${voice}\n` : ''}
Rules: ${rules[platform] || 'Engaging, clear CTA, hashtags'}
Campaign: ${campaignName}
Product: ${productDescription}
Audience: ${targetAudience}
Format: ${format}

Output ONLY the final caption. No explanation. No options. Ready to copy-paste.`;

  const caption = await callAI(ai_provider || 'gemini', prompt, userPlan);
  return caption;
};

// ── Legacy compatibility exports ──────────────────────────────────────────────
export const generateImagesAI = async () => {
  console.log('   ℹ️  Image generation paused — IVey is video-first');
  return [];
};
export const generateVisualAI = generateImagesAI;
export { generateMarketingStrategyAI as generateStrategyAI };