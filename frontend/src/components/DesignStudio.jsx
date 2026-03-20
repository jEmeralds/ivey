// frontend/src/components/DesignStudio.jsx
// Full-screen design modal — 3 instant variations, 40+ palettes, smart content parsing
// Triggered per content card from CampaignDetail

import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

// ── Utilities ─────────────────────────────────────────────────────────────────
function isLight(hex) {
  if (!hex || hex.length < 4) return false;
  try {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0,2), 16);
    const g = parseInt(h.slice(2,4), 16);
    const b = parseInt(h.slice(4,6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  } catch { return false; }
}

// Smart content parser — format-aware, skips structure, pulls real copy
function parseContent(raw = '', format = '') {
  if (!raw) return { headline: '', body: '', cta: 'Learn More' };

  // ── Video/Script formats: special extraction ─────────────────────────────
  // TikTok, YouTube shorts/ads have Hook/Body/CTA sections with (VISUAL:) directions
  const isVideoFormat = ['TIKTOK', 'YOUTUBE_VIDEO_AD', 'YOUTUBE_SHORTS'].includes(format);

  if (isVideoFormat) {
    // Remove all (VISUAL: ...) and (AUDIO: ...) stage directions
    const stripped = raw
      .replace(/\(VISUAL:[^)]*\)/gi, '')
      .replace(/\(AUDIO:[^)]*\)/gi, '')
      .replace(/\(TEXT OVERLAY:[^)]*\)/gi, '')
      .replace(/\(SCENE:[^)]*\)/gi, '')
      .replace(/\[[^\]]*\]/g, '')       // [placeholder]
      .replace(/#{1,6}\s+/g, '\n')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/---+/g, '\n')
      .trim();

    // Find the actual hook text — the line AFTER "Hook (0-3 sec)" header
    const hookMatch = stripped.match(/hook[^:\n]*[\n:]+\s*([^\n]{10,120})/i);
    // Find CTA text — line after CTA section header
    const ctaMatch  = stripped.match(/cta[^:\n]*[\n:]+\s*([^\n]{3,60})/i);
    // Find product/key message line — look for lines mentioning brand/product
    const brandName = stripped.match(/["']([^"']{5,40})["']/)?.[1]; // quoted text

    // Get all real spoken lines (not headers, not directions)
    const spokenLines = stripped
      .split('\n')
      .map(l => l.trim())
      .filter(l => {
        if (l.length < 10) return false;
        if (/^(hook|body|cta|intro|outro|sec|production|hashtag|note|visual|audio)/i.test(l)) return false;
        if (l.endsWith(':')) return false;
        if (/^\d+-\d+\s*sec/i.test(l)) return false;  // "0-3 sec"
        if (/^\d+\s*sec/i.test(l)) return false;        // "30 sec"
        return true;
      });

    const headline = (hookMatch?.[1] || spokenLines[0] || brandName || '').trim().slice(0, 80);
    const body = spokenLines
      .filter(l => l !== headline)
      .slice(0, 2)
      .join(' ')
      .slice(0, 160);
    const cta = (ctaMatch?.[1] || 'Watch Now').trim().slice(0, 40);

    return { headline, body, cta };
  }

  // ── Clean markdown for all other formats ────────────────────────────────
  const cleaned = raw
    .replace(/#{1,6}\s+/g, '\n')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/>\s*/g, '')
    .replace(/---+/g, '\n')
    .replace(/\[[^\]]*\]/g, '')    // [placeholder text]
    .replace(/\([^)]{0,30}\)/g, '') // short parentheticals like (max 30 chars)
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^[-•]\s+/gm, '')
    .trim();

  // Skip patterns — document structure, not copy
  const skipPatterns = [
    /^\d+-second/i,
    /^script:/i,
    /^video (title|script|ad)/i,
    /^hook\s*[\d(]/i,
    /^body\s*[\d(]/i,
    /^cta\s*[\d(]/i,
    /^(intro|outro|section)\s*[:(\d]/i,
    /^(post|caption|headline|subject line|preview text)\s*:/i,
    /^(variation|version)\s*\d/i,
    /^ad (copy|variation|text)/i,
    /^\d+-\d+\s*sec/i,
    /^(production notes|hashtags|posting tips|engagement strategy)/i,
    /^(main headline|subheadline|cta button text)/i,
    /^(ad variation|display url)/i,
    /^(trending sound|visual cue|text overlay)/i,
    /^recommended hashtag/i,
  ];

  const lines = cleaned
    .split('\n')
    .map(l => l.trim())
    .filter(l => {
      if (l.length < 8) return false;
      if (l.startsWith('http')) return false;
      if (l.endsWith(':') && l.length < 50) return false;
      if (skipPatterns.some(p => p.test(l))) return false;
      return true;
    });

  // Twitter: short punchy single line
  if (format === 'TWITTER_POST') {
    const tweet = lines.find(l => l.length > 10 && l.length < 240 && !l.includes(':'));
    return { headline: (tweet || lines[0] || '').slice(0, 80), body: '', cta: 'Follow Us' };
  }

  // Email: subject line is typically the first short line
  if (format === 'EMAIL_MARKETING') {
    const subject = lines.find(l => l.length > 5 && l.length < 65);
    const body = lines.filter(l => l !== subject).slice(0, 2).join(' ');
    return { headline: (subject || '').slice(0, 80), body: body.slice(0, 160), cta: 'Read More' };
  }

  // Banner/Google ads: find the headline (short, punchy)
  if (['BANNER_AD', 'GOOGLE_SEARCH_AD'].includes(format)) {
    const short = lines.find(l => l.length >= 8 && l.length <= 40);
    const med   = lines.find(l => l !== short && l.length > 20 && l.length <= 90);
    return { headline: (short || lines[0] || '').slice(0, 40), body: (med || '').slice(0, 90), cta: 'Learn More' };
  }

  // General: best short line as headline
  const headlineCandidates = lines.filter(l =>
    l.length >= 10 && l.length <= 85 && !l.includes(':')
  );

  const headline = (headlineCandidates[0] || lines[0] || '').slice(0, 80);
  const body = lines
    .filter(l => l !== headline && l.length > 12)
    .slice(0, 3)
    .join(' ')
    .slice(0, 180);

  return { headline, body, cta: 'Learn More' };
}

// Format key → canvas template type
function formatToTemplate(format) {
  const map = {
    INSTAGRAM_CAPTION: 'instagram',
    FACEBOOK_POST:     'facebook',
    TWITTER_POST:      'twitter',
    LINKEDIN_POST:     'linkedin',
    YOUTUBE_VIDEO_AD:  'youtube',
    YOUTUBE_SHORTS:    'story',
    TIKTOK:            'story',
    BANNER_AD:         'banner',
    GOOGLE_SEARCH_AD:  'banner',
    FLYER_TEXT:        'flyer',
    PRINT_AD:          'flyer',
    EMAIL_MARKETING:   'email',
  };
  return map[format] || 'instagram';
}

const CANVAS_SIZES = {
  instagram: { w: 400, h: 400,  label: '1:1'    },
  story:     { w: 225, h: 400,  label: '9:16'   },
  youtube:   { w: 400, h: 225,  label: '16:9'   },
  twitter:   { w: 400, h: 225,  label: '16:9'   },
  linkedin:  { w: 400, h: 300,  label: '4:3'    },
  facebook:  { w: 400, h: 210,  label: '1.91:1' },
  banner:    { w: 400, h: 150,  label: 'Banner' },
  flyer:     { w: 280, h: 400,  label: 'Flyer'  },
  email:     { w: 400, h: 160,  label: 'Email'  },
};

// ── 40+ Colour Palettes ───────────────────────────────────────────────────────
const PALETTES = [
  // Dark palettes
  { id: 'midnight',   name: 'Midnight',       bg: '#0c1220', accent: '#6366f1', text: '#f8fafc', sub: '#a5b4fc', tag: 'dark' },
  { id: 'noir',       name: 'Noir',           bg: '#0a0a0a', accent: '#ffffff', text: '#ffffff', sub: '#999999', tag: 'dark' },
  { id: 'obsidian',   name: 'Obsidian',       bg: '#111111', accent: '#f59e0b', text: '#fafafa', sub: '#d4a017', tag: 'dark' },
  { id: 'deep_space', name: 'Deep Space',     bg: '#04040f', accent: '#38bdf8', text: '#e0f2fe', sub: '#7dd3fc', tag: 'dark' },
  { id: 'forest',     name: 'Forest',         bg: '#0d1f0f', accent: '#22c55e', text: '#f0fdf4', sub: '#86efac', tag: 'dark' },
  { id: 'dark_jade',  name: 'Dark Jade',      bg: '#011a14', accent: '#10b981', text: '#ecfdf5', sub: '#6ee7b7', tag: 'dark' },
  { id: 'ocean',      name: 'Ocean',          bg: '#020d1a', accent: '#38bdf8', text: '#f0f9ff', sub: '#7dd3fc', tag: 'dark' },
  { id: 'ember',      name: 'Ember',          bg: '#130800', accent: '#f97316', text: '#fff7ed', sub: '#fdba74', tag: 'dark' },
  { id: 'volcano',    name: 'Volcano',        bg: '#140300', accent: '#ef4444', text: '#fff5f5', sub: '#fca5a5', tag: 'dark' },
  { id: 'violet',     name: 'Violet',         bg: '#0d0520', accent: '#a855f7', text: '#faf5ff', sub: '#d8b4fe', tag: 'dark' },
  { id: 'electric',   name: 'Electric',       bg: '#080028', accent: '#818cf8', text: '#eef2ff', sub: '#c7d2fe', tag: 'dark' },
  { id: 'rose_dark',  name: 'Dark Rose',      bg: '#18030d', accent: '#f43f5e', text: '#fff1f2', sub: '#fda4af', tag: 'dark' },
  { id: 'magenta',    name: 'Magenta',        bg: '#150010', accent: '#e879f9', text: '#fdf4ff', sub: '#f0abfc', tag: 'dark' },
  { id: 'gold',       name: 'Gold',           bg: '#0f0900', accent: '#eab308', text: '#fefce8', sub: '#fde047', tag: 'dark' },
  { id: 'teal',       name: 'Teal',           bg: '#011a18', accent: '#14b8a6', text: '#f0fdfa', sub: '#5eead4', tag: 'dark' },
  { id: 'lime_dark',  name: 'Lime Night',     bg: '#081000', accent: '#84cc16', text: '#f7fee7', sub: '#bef264', tag: 'dark' },
  { id: 'cyan_dark',  name: 'Cyan Night',     bg: '#001416', accent: '#06b6d4', text: '#ecfeff', sub: '#67e8f9', tag: 'dark' },
  { id: 'charcoal',   name: 'Charcoal',       bg: '#1c1c1e', accent: '#f1f5f9', text: '#ffffff', sub: '#94a3b8', tag: 'dark' },
  { id: 'slate_dark', name: 'Slate',          bg: '#0f172a', accent: '#64748b', text: '#f1f5f9', sub: '#94a3b8', tag: 'dark' },
  { id: 'bronze',     name: 'Bronze',         bg: '#0c0800', accent: '#cd7f32', text: '#fdf8f0', sub: '#d4a26a', tag: 'dark' },
  { id: 'neon_green', name: 'Neon Green',     bg: '#010f00', accent: '#39ff14', text: '#f0fff0', sub: '#90ee90', tag: 'dark' },
  { id: 'neon_blue',  name: 'Neon Blue',      bg: '#00010f', accent: '#00c8ff', text: '#f0f8ff', sub: '#87ceeb', tag: 'dark' },
  { id: 'crimson',    name: 'Crimson',        bg: '#120004', accent: '#dc2626', text: '#fff5f5', sub: '#fca5a5', tag: 'dark' },
  { id: 'military',   name: 'Military',       bg: '#0a0c00', accent: '#4d5a00', text: '#f5f5e8', sub: '#8a9a00', tag: 'dark' },
  { id: 'mocha',      name: 'Mocha',          bg: '#120800', accent: '#a0522d', text: '#fdf5ec', sub: '#c87941', tag: 'dark' },
  // Light palettes
  { id: 'arctic',     name: 'Arctic',         bg: '#f8fafc', accent: '#0ea5e9', text: '#0f172a', sub: '#475569', tag: 'light' },
  { id: 'cream',      name: 'Cream',          bg: '#fdf6ec', accent: '#92400e', text: '#1c0a00', sub: '#78350f', tag: 'light' },
  { id: 'concrete',   name: 'Concrete',       bg: '#f1f5f9', accent: '#111827', text: '#111827', sub: '#4b5563', tag: 'light' },
  { id: 'rose_light', name: 'Rose Light',     bg: '#fff1f2', accent: '#e11d48', text: '#0f172a', sub: '#6b7280', tag: 'light' },
  { id: 'mint',       name: 'Mint',           bg: '#f0fdf4', accent: '#16a34a', text: '#0f172a', sub: '#4b5563', tag: 'light' },
  { id: 'lavender',   name: 'Lavender',       bg: '#f5f3ff', accent: '#7c3aed', text: '#0f172a', sub: '#6b7280', tag: 'light' },
  { id: 'peach',      name: 'Peach',          bg: '#fff7ed', accent: '#ea580c', text: '#1c1917', sub: '#57534e', tag: 'light' },
  { id: 'sky',        name: 'Sky',            bg: '#f0f9ff', accent: '#0284c7', text: '#0c4a6e', sub: '#475569', tag: 'light' },
  { id: 'sand',       name: 'Sand',           bg: '#fefce8', accent: '#ca8a04', text: '#1c1917', sub: '#78716c', tag: 'light' },
  { id: 'blush',      name: 'Blush',          bg: '#fdf2f8', accent: '#db2777', text: '#0f172a', sub: '#6b7280', tag: 'light' },
  { id: 'paper',      name: 'Paper',          bg: '#fffbeb', accent: '#b45309', text: '#1c0a00', sub: '#78350f', tag: 'light' },
  { id: 'fog',        name: 'Fog',            bg: '#f8fafc', accent: '#334155', text: '#0f172a', sub: '#64748b', tag: 'light' },
  { id: 'spring',     name: 'Spring',         bg: '#f7fee7', accent: '#65a30d', text: '#1a2e05', sub: '#4b5563', tag: 'light' },
  { id: 'ice',        name: 'Ice',            bg: '#ecfeff', accent: '#0891b2', text: '#083344', sub: '#475569', tag: 'light' },
  { id: 'cotton',     name: 'Cotton',         bg: '#fff0f6', accent: '#be185d', text: '#0f172a', sub: '#6b7280', tag: 'light' },
  { id: 'clay',       name: 'Clay',           bg: '#fef3c7', accent: '#92400e', text: '#1c0a00', sub: '#78350f', tag: 'light' },
  { id: 'pearl',      name: 'Pearl',          bg: '#fafafa', accent: '#1e293b', text: '#0f172a', sub: '#64748b', tag: 'light' },
];

const PALETTE_TAGS = ['all', 'dark', 'light'];

// ── Canvas Variations ─────────────────────────────────────────────────────────

function VariationBold({ d, p, photo, logo, size }) {
  const { w, h } = size;
  const isWide = w > h * 1.2;
  const isTall = h > w * 1.2;
  const headFS = isWide ? 14 : isTall ? 22 : 20;

  return (
    <div style={{ width: w, height: h, background: p.bg, position: 'relative', overflow: 'hidden', fontFamily: "'DM Sans','Segoe UI',sans-serif", display: 'flex', flexDirection: isWide ? 'row' : 'column' }}>
      <div style={{ position: 'absolute', [isWide?'left':'top']: 0, [isWide?'top':'left']: 0, [isWide?'bottom':'right']: 0, [isWide?'width':'height']: 4, background: `linear-gradient(${isWide?'180':'90'}deg, ${p.accent}, ${p.accent}66)` }} />
      <div style={{ flex: 1, padding: isWide ? '16px 18px 16px 22px' : '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {logo
            ? <img src={logo} style={{ width: 24, height: 24, borderRadius: 5, objectFit: 'contain', flexShrink: 0 }} />
            : <div style={{ width: 24, height: 24, borderRadius: 5, background: p.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: p.bg, flexShrink: 0 }}>{(d.brandName||'I')[0].toUpperCase()}</div>}
          <span style={{ fontSize: 9, fontWeight: 800, color: p.accent, textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: isWide ? 90 : 160 }}>{d.brandName||'Brand'}</span>
        </div>
        <div>
          <div style={{ fontSize: 8, fontWeight: 700, color: p.accent, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 5, opacity: 0.75 }}>{d.badge||'Marketing'}</div>
          <div style={{ fontSize: headFS, fontWeight: 900, color: p.text, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 5, maxWidth: isWide ? 180 : '100%' }}>{d.headline||'Your headline'}</div>
          {!isWide && d.body && <div style={{ fontSize: isTall ? 11 : 10, color: p.sub, lineHeight: 1.55 }}>{d.body.slice(0, isTall ? 140 : 90)}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ padding: '5px 12px', borderRadius: 20, background: p.accent, fontSize: 9, fontWeight: 800, color: p.bg }}>{d.cta||'Learn More'}</div>
          {d.website && <span style={{ fontSize: 8, color: p.sub, opacity: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{d.website}</span>}
        </div>
      </div>
      {photo
        ? <div style={{ [isWide?'width':'height']: isWide?'42%':'36%', position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
            <img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(${isWide?'to right':'to bottom'}, ${p.bg}cc, transparent 60%)` }} />
          </div>
        : <div style={{ [isWide?'width':'height']: isWide?'36%':'28%', background: p.accent+'10', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${p.accent}30` }} />
          </div>}
      <div style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: p.accent, opacity: 0.05 }} />
    </div>
  );
}

function VariationFullBleed({ d, p, photo, logo, size }) {
  const { w, h } = size;
  const isTall = h > w;
  const headFS = isTall ? 21 : w > h * 1.5 ? 14 : 18;

  return (
    <div style={{ width: w, height: h, position: 'relative', overflow: 'hidden', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      {photo
        ? <img src={photo} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 65% 25%, ${p.accent}60 0%, ${p.bg} 65%)` }} />}
      <div style={{ position: 'absolute', inset: 0, background: photo
        ? `linear-gradient(to top, ${p.bg}f8 0%, ${p.bg}bb 40%, ${p.bg}44 70%, transparent 100%)`
        : 'transparent' }} />
      <div style={{ position: 'absolute', inset: 0, padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, alignSelf: 'flex-start' }}>
          {logo
            ? <img src={logo} style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'contain', background: 'rgba(255,255,255,0.15)', padding: 2 }} />
            : <div style={{ width: 26, height: 26, borderRadius: 6, background: p.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: p.bg }}>{(d.brandName||'I')[0].toUpperCase()}</div>}
          <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>{d.brandName||'Brand'}</span>
        </div>
        <div>
          <div style={{ display: 'inline-flex', padding: '2px 9px', borderRadius: 20, background: p.accent, fontSize: 8, fontWeight: 800, color: p.bg, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{d.badge||'Marketing'}</div>
          <div style={{ fontSize: headFS, fontWeight: 900, color: '#fff', lineHeight: 1.12, letterSpacing: '-0.02em', marginBottom: 6, textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}>{d.headline||'Your headline'}</div>
          {isTall && d.body && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5, marginBottom: 10 }}>{d.body.slice(0, 130)}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: isTall ? 0 : 4 }}>
            <div style={{ padding: '5px 14px', borderRadius: 20, background: p.accent, fontSize: 9, fontWeight: 800, color: p.bg }}>{d.cta||'Learn More'}</div>
            {d.website && <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>{d.website}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function VariationEditorial({ d, p, photo, logo, size }) {
  const { w, h } = size;
  const isWide = w > h * 1.3;
  const photoH = isWide ? h : Math.round(h * 0.48);

  return (
    <div style={{ width: w, height: h, background: p.bg, position: 'relative', overflow: 'hidden', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      {isWide ? (
        <div style={{ display: 'flex', height: '100%' }}>
          <div style={{ flex: 1, padding: '13px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {logo ? <img src={logo} style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'contain', flexShrink: 0 }} />
                : <div style={{ width: 20, height: 20, borderRadius: 4, background: p.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, color: p.bg, flexShrink: 0 }}>{(d.brandName||'I')[0].toUpperCase()}</div>}
              <span style={{ fontSize: 7, fontWeight: 800, color: p.sub, textTransform: 'uppercase', letterSpacing: '0.1em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.brandName}</span>
            </div>
            <div>
              <div style={{ fontSize: 7, fontWeight: 700, color: p.accent, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4 }}>{d.badge}</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: p.text, lineHeight: 1.15, letterSpacing: '-0.02em' }}>{d.headline}</div>
            </div>
            <div style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 5, background: p.accent, fontSize: 7, fontWeight: 800, color: p.bg }}>{d.cta||'Learn More'}</div>
          </div>
          <div style={{ width: '44%', position: 'relative', flexShrink: 0 }}>
            {photo ? <img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: p.accent+'15' }} />}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: p.accent }} />
          </div>
        </div>
      ) : (
        <>
          <div style={{ height: photoH, position: 'relative', overflow: 'hidden' }}>
            {photo ? <img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${p.accent}20, ${p.accent}08)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', border: `2px solid ${p.accent}40` }} />
                </div>}
            <div style={{ position: 'absolute', top: 9, left: 12, padding: '2px 8px', borderRadius: 20, background: p.accent, fontSize: 7, fontWeight: 800, color: p.bg, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{d.badge||'Marketing'}</div>
          </div>
          <div style={{ height: 3, background: `linear-gradient(90deg, ${p.accent}, ${p.accent}44)` }} />
          <div style={{ padding: '11px 13px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: h - photoH - 3, boxSizing: 'border-box' }}>
            <div>
              <div style={{ fontSize: h > w * 1.3 ? 17 : 14, fontWeight: 900, color: p.text, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 4 }}>{d.headline||'Your headline'}</div>
              {d.body && <div style={{ fontSize: 9, color: p.sub, lineHeight: 1.5 }}>{d.body.slice(0, 100)}</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {logo ? <img src={logo} style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'contain' }} />
                  : <div style={{ width: 18, height: 18, borderRadius: 4, background: p.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 900, color: p.bg }}>{(d.brandName||'I')[0].toUpperCase()}</div>}
                <span style={{ fontSize: 7, fontWeight: 700, color: p.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d.brandName||'Brand'}</span>
              </div>
              <div style={{ padding: '3px 10px', borderRadius: 20, background: p.accent, fontSize: 7, fontWeight: 800, color: p.bg }}>{d.cta||'Learn More'}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const VARIATIONS = [
  { id: 'bold',      label: 'Bold',      desc: 'Strong & direct' },
  { id: 'fullbleed', label: 'Full Bleed', desc: 'Photo-first' },
  { id: 'editorial', label: 'Editorial', desc: 'Magazine clean' },
];

function RenderVariation({ id, d, p, photo, logo, size }) {
  const props = { d, p, photo, logo, size };
  switch (id) {
    case 'bold':      return <VariationBold      {...props} />;
    case 'fullbleed': return <VariationFullBleed {...props} />;
    case 'editorial': return <VariationEditorial {...props} />;
    default:          return <VariationBold      {...props} />;
  }
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DesignStudio({ isOpen, onClose, contentItem, campaignName }) {
  const [brand,        setBrand]        = useState(null);
  const [paletteId,    setPaletteId]    = useState('midnight');
  const [paletteFilter,setPaletteFilter]= useState('all');
  const [photo,        setPhoto]        = useState(null);
  const [logo,         setLogo]         = useState(null);
  const [selected,     setSelected]     = useState('bold');
  const [exporting,    setExporting]    = useState(null);
  const [exported,     setExported]     = useState(null);
  const [editing,      setEditing]      = useState(false);
  const [showPalettes, setShowPalettes] = useState(false);
  const [data, setData] = useState({
    brandName: '', tagline: '', badge: '',
    headline: '', body: '', cta: 'Learn More', website: '',
  });

  const refs = {
    bold:      useRef(null),
    fullbleed: useRef(null),
    editorial: useRef(null),
  };
  const photoRef = useRef(null);
  const logoRef  = useRef(null);

  const activePalette = PALETTES.find(p => p.id === paletteId) || PALETTES[0];
  const filteredPalettes = paletteFilter === 'all' ? PALETTES : PALETTES.filter(p => p.tag === paletteFilter);

  // Load brand + parse content on open
  useEffect(() => {
    if (!isOpen || !contentItem) return;

    const parsed = parseContent(contentItem.content || '', contentItem.format || '');
    setData(prev => ({
      ...prev,
      headline:  parsed.headline,
      body:      parsed.body,
      cta:       'Learn More',
      brandName: campaignName || prev.brandName,
      badge:     'Marketing',
    }));
    setPhoto(null);
    setExported(null);
    setEditing(false);
    setShowPalettes(false);

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    fetch(`${API_BASE}/brand/default`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(res => {
        const b = res.brand;
        if (!b) return;
        setBrand(b);
        setData(prev => ({
          ...prev,
          brandName: b.brand_name || prev.brandName,
          tagline:   b.tagline    || '',
          badge:     b.industry   || 'Marketing',
          website:   b.website    || '',
        }));
        // Auto-set brand palette if colors available
        const colors = b.brand_colors || [];
        if (colors.length >= 2) {
          const bg = colors[0], accent = colors[1];
          // Inject as a dynamic palette
          setPaletteId('__brand__');
          setBrand(prev => ({ ...prev, _palette: {
            id: '__brand__', name: `${b.brand_name} Brand`,
            bg, accent,
            text: isLight(bg) ? '#0f172a' : '#f8fafc',
            sub:  isLight(bg) ? '#475569' : '#94a3b8',
            tag: 'dark',
          }}));
        }
      })
      .catch(() => {});
  }, [isOpen, contentItem, campaignName]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const getActivePalette = () => {
    if (paletteId === '__brand__' && brand?._palette) return brand._palette;
    return PALETTES.find(p => p.id === paletteId) || PALETTES[0];
  };

  const p = getActivePalette();

  const handleFile = (e, setter) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setter(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleExport = async (varId) => {
    const ref = refs[varId];
    if (!ref?.current) return;
    setExporting(varId);
    await new Promise(r => setTimeout(r, 80));
    try {
      const canvas = await html2canvas(ref.current, {
        scale: 2.5, useCORS: true,
        backgroundColor: p.bg,
        logging: false, allowTaint: true,
      });
      const link = document.createElement('a');
      const slug = (contentItem?.format || 'design').toLowerCase();
      link.download = `ivey-${slug}-${varId}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setExported(varId);
      setTimeout(() => setExported(null), 2500);
    } catch (e) { console.error('Export failed:', e); }
    finally { setExporting(null); }
  };

  if (!isOpen || !contentItem) return null;

  const templateType = formatToTemplate(contentItem.format || '');
  const size = CANVAS_SIZES[templateType] || CANVAS_SIZES.instagram;
  const formatName = (contentItem.format || '').replace(/_/g, ' ');
  const maxW = 240;
  const scale = Math.min(1, maxW / size.w);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(2,4,12,0.97)',
      backdropFilter: 'blur(12px)',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
    }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>✦</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9' }}>Design Studio</div>
            <div style={{ fontSize: 10, color: '#334155' }}>{formatName} · {size.w}×{size.h} · {size.label}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#64748b', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '18px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* ── 3 Variations ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {VARIATIONS.map(v => (
              <div key={v.id} onClick={() => setSelected(v.id)}
                style={{
                  borderRadius: 14, cursor: 'pointer', overflow: 'hidden',
                  border: `2px solid ${selected === v.id ? '#6366f1' : 'rgba(255,255,255,0.05)'}`,
                  background: selected === v.id ? 'rgba(99,102,241,0.07)' : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.2s',
                  boxShadow: selected === v.id ? '0 0 0 1px #6366f1, 0 8px 32px rgba(99,102,241,0.18)' : 'none',
                }}>

                {/* Label */}
                <div style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: selected === v.id ? '#818cf8' : '#475569' }}>{v.label}</span>
                  <span style={{ fontSize: 9, color: '#1e293b' }}>{v.desc}</span>
                </div>

                {/* Canvas */}
                <div style={{ padding: '12px', background: '#030811', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: Math.round(size.h * scale) + 24 }}>
                  <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
                    ref={refs[v.id]}>
                    <RenderVariation id={v.id} d={data} p={p} photo={photo} logo={logo} size={size} />
                  </div>
                </div>

                {/* Export */}
                <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <button
                    onClick={e => { e.stopPropagation(); handleExport(v.id); }}
                    disabled={!!exporting}
                    style={{
                      width: '100%', padding: '7px', borderRadius: 7, border: 'none', cursor: exporting ? 'wait' : 'pointer',
                      background: exported === v.id
                        ? 'linear-gradient(135deg,#10b981,#059669)'
                        : selected === v.id
                          ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                          : 'rgba(255,255,255,0.04)',
                      color: selected === v.id || exported === v.id ? '#fff' : '#334155',
                      fontSize: 11, fontWeight: 700, transition: 'all 0.2s',
                    }}>
                    {exporting === v.id ? '⏳ Exporting...' : exported === v.id ? '✅ Downloaded!' : '⬇ Export PNG'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Controls ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>

            {/* Palette */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '13px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Palette</div>
                <button onClick={() => setShowPalettes(v => !v)} style={{ fontSize: 9, fontWeight: 700, color: showPalettes ? '#6366f1' : '#334155', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPalettes ? 'Collapse ▲' : `Show all (${PALETTES.length}) ▼`}
                </button>
              </div>

              {/* Filter tabs */}
              {showPalettes && (
                <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                  {PALETTE_TAGS.map(t => (
                    <button key={t} onClick={() => setPaletteFilter(t)}
                      style={{ padding: '3px 10px', borderRadius: 20, fontSize: 9, fontWeight: 700, cursor: 'pointer', border: `1px solid ${paletteFilter === t ? '#6366f1' : 'rgba(255,255,255,0.08)'}`, background: paletteFilter === t ? '#6366f100' : 'transparent', color: paletteFilter === t ? '#818cf8' : '#334155', textTransform: 'capitalize' }}>
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {/* Palette dots grid */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: showPalettes ? 7 : 6 }}>
                {/* Brand palette dot */}
                {brand?._palette && (
                  <button onClick={() => setPaletteId('__brand__')} title={brand._palette.name}
                    style={{ width: showPalettes ? 28 : 22, height: showPalettes ? 28 : 22, borderRadius: '50%', background: brand._palette.accent, border: paletteId === '__brand__' ? '3px solid #f1f5f9' : '2px solid rgba(255,255,255,0.1)', cursor: 'pointer', transform: paletteId === '__brand__' ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.15s', outline: 'none', flexShrink: 0, position: 'relative' }}>
                    {showPalettes && paletteId === '__brand__' && <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid #f1f5f9' }} />}
                  </button>
                )}
                {(showPalettes ? filteredPalettes : PALETTES.slice(0, 18)).map(pp => (
                  <button key={pp.id} onClick={() => setPaletteId(pp.id)} title={pp.name}
                    style={{ width: showPalettes ? 28 : 22, height: showPalettes ? 28 : 22, borderRadius: '50%', background: pp.accent, border: paletteId === pp.id ? '3px solid #f1f5f9' : '2px solid rgba(255,255,255,0.07)', cursor: 'pointer', transform: paletteId === pp.id ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.15s', outline: 'none', flexShrink: 0 }} />
                ))}
              </div>

              {/* Active palette info */}
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: 5, background: p.bg, border: `2px solid ${p.accent}`, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#64748b' }}>{p.name}</span>
              </div>
            </div>

            {/* Photos & Logo */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '13px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Photos & Logo</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {/* Photo */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: '#334155', marginBottom: 5, fontWeight: 600 }}>Product Photo</div>
                  <div onClick={() => photoRef.current?.click()}
                    style={{ height: 64, borderRadius: 8, background: '#0a0f1a', border: '1px dashed #1e293b', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 5 }}>
                    {photo ? <img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 9, color: '#1e293b' }}>Upload</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => photoRef.current?.click()} style={{ flex: 1, padding: '5px', background: '#1e293b', border: '1px solid #334155', borderRadius: 5, color: '#64748b', fontSize: 9, cursor: 'pointer' }}>{photo ? '🔄' : '📸'}</button>
                    {photo && <button onClick={() => setPhoto(null)} style={{ padding: '5px 7px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 5, color: '#ef4444', fontSize: 9, cursor: 'pointer' }}>✕</button>}
                  </div>
                  <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e, setPhoto)} />
                </div>
                {/* Logo */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: '#334155', marginBottom: 5, fontWeight: 600 }}>Logo</div>
                  <div onClick={() => logoRef.current?.click()}
                    style={{ height: 64, borderRadius: 8, background: '#0a0f1a', border: '1px dashed #1e293b', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 5 }}>
                    {logo ? <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} /> : <span style={{ fontSize: 9, color: '#1e293b' }}>Upload</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => logoRef.current?.click()} style={{ flex: 1, padding: '5px', background: '#1e293b', border: '1px solid #334155', borderRadius: 5, color: '#64748b', fontSize: 9, cursor: 'pointer' }}>{logo ? '🔄' : '🏷'}</button>
                    {logo && <button onClick={() => setLogo(null)} style={{ padding: '5px 7px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 5, color: '#ef4444', fontSize: 9, cursor: 'pointer' }}>✕</button>}
                  </div>
                  <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e, setLogo)} />
                </div>
              </div>
            </div>

            {/* Text editor */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '13px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Text</div>
                <button onClick={() => setEditing(v => !v)} style={{ fontSize: 9, fontWeight: 700, color: editing ? '#6366f1' : '#475569', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {editing ? '✓ Done' : '✏️ Edit'}
                </button>
              </div>
              {editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[
                    { k: 'brandName', label: 'Brand',    rows: 1 },
                    { k: 'badge',     label: 'Badge',    rows: 1 },
                    { k: 'headline',  label: 'Headline', rows: 2 },
                    { k: 'body',      label: 'Body',     rows: 2 },
                    { k: 'cta',       label: 'CTA',      rows: 1 },
                    { k: 'website',   label: 'Website',  rows: 1 },
                  ].map(({ k, label, rows }) => (
                    <div key={k}>
                      <div style={{ fontSize: 8, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{label}</div>
                      <textarea value={data[k]||''} onChange={e => setData(prev => ({ ...prev, [k]: e.target.value }))} rows={rows}
                        style={{ width: '100%', background: '#0a0f1a', border: '1px solid #1e293b', borderRadius: 5, padding: '5px 7px', fontSize: 11, color: '#f1f5f9', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.4, transition: 'border-color 0.2s' }}
                        onFocus={e => e.target.style.borderColor = '#6366f1'}
                        onBlur={e => e.target.style.borderColor = '#1e293b'}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ fontSize: 12, color: '#f1f5f9', fontWeight: 700, lineHeight: 1.3 }}>{data.headline || '—'}</div>
                  {data.body && <div style={{ fontSize: 10, color: '#334155', lineHeight: 1.4 }}>{data.body.slice(0, 100)}{data.body.length > 100 ? '…' : ''}</div>}
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 3 }}>
                    {data.badge && <span style={{ fontSize: 8, padding: '2px 7px', borderRadius: 20, background: p.accent+'22', color: p.accent, fontWeight: 700 }}>{data.badge}</span>}
                    {data.cta && <span style={{ fontSize: 8, padding: '2px 7px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: '#64748b' }}>{data.cta}</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}