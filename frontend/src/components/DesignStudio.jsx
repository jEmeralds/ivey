// frontend/src/components/DesignStudio.jsx
// Full-screen design modal — triggered from a content card with content pre-loaded.
// Shows 3 instant design variations. User picks, tweaks, exports.
// Requires: html2canvas already installed

import { useState, useEffect, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
function isLight(hex) {
  if (!hex || hex.length < 4) return false;
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  } catch { return false; }
}

// Clean markdown from AI content
function cleanText(raw = '', maxLen = 80) {
  return raw
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/>\s*/g, '')
    .replace(/---+/g, '')
    .replace(/\[\s*[^\]]*\s*\]/g, '')
    .replace(/\d+\.\s+/g, '')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 4 && !l.startsWith('http') && !l.startsWith('**') && l !== '---')
    .join(' ')
    .slice(0, maxLen)
    .trim();
}

// Extract meaningful headline + body from any format's content
function parseContent(rawContent, format) {
  if (!rawContent) return { headline: '', body: '', hook: '' };

  const lines = rawContent
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/>\s*/g, '')
    .replace(/---+/g, '')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 6 && !l.startsWith('http') && !l.match(/^\[.*\]$/));

  // For video formats, look for hook specifically
  const hookLine = lines.find(l =>
    l.toLowerCase().includes('hook') ||
    l.toLowerCase().includes('attention') ||
    l.toLowerCase().includes('stop')
  );

  // Find the most compelling short line for headline (not a section header)
  const headlineCandidates = lines.filter(l =>
    l.length > 10 &&
    l.length < 90 &&
    !l.match(/^\d+[\.\)]\s/) && // not a numbered list
    !l.endsWith(':')             // not a section header
  );

  const headline = (headlineCandidates[0] || lines[0] || '').slice(0, 80);
  const body     = lines.slice(1, 4).filter(l => l !== headline).join(' ').slice(0, 160);
  const hook     = hookLine ? hookLine.slice(0, 80) : headline;

  return { headline, body, hook };
}

// Map format keys to canvas template types
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
  instagram: { w: 400, h: 400,  label: '1:1' },
  story:     { w: 225, h: 400,  label: '9:16' },
  youtube:   { w: 400, h: 225,  label: '16:9' },
  twitter:   { w: 400, h: 225,  label: '16:9' },
  linkedin:  { w: 400, h: 300,  label: '4:3' },
  facebook:  { w: 400, h: 210,  label: '1.91:1' },
  banner:    { w: 400, h: 150,  label: 'Banner' },
  flyer:     { w: 280, h: 400,  label: 'Flyer' },
  email:     { w: 400, h: 160,  label: 'Email' },
};

// ── Design Variations ─────────────────────────────────────────────────────────
// Each variation is a named design style. Given the same content + palette,
// they produce distinctly different layouts.

// Variation A: Bold typographic — large headline, accent strip, minimal photo
function VariationBold({ d, p, photo, logo, size }) {
  const { w, h } = size;
  const isWide = w > h * 1.2;
  const isTall = h > w * 1.2;

  return (
    <div style={{ width: w, height: h, background: p.bg, position: 'relative', overflow: 'hidden', fontFamily: "'DM Sans','Segoe UI',sans-serif", display: 'flex', flexDirection: isWide ? 'row' : 'column' }}>
      {/* Accent strip */}
      <div style={{ position: 'absolute', [isWide ? 'left' : 'top']: 0, [isWide ? 'top' : 'left']: 0, [isWide ? 'bottom' : 'right']: 0, [isWide ? 'width' : 'height']: 4, background: `linear-gradient(${isWide ? '180deg' : '90deg'}, ${p.accent}, ${p.accent}88)` }} />

      {/* Content */}
      <div style={{ flex: 1, padding: isWide ? '18px 20px 18px 24px' : isTall ? '16px 16px' : '14px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 2 }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {logo
            ? <img src={logo} style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'contain' }} />
            : <div style={{ width: 26, height: 26, borderRadius: 6, background: p.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: p.bg, flexShrink: 0 }}>{(d.brandName||'I')[0]}</div>}
          <span style={{ fontSize: 9, fontWeight: 800, color: p.accent, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{d.brandName||'Brand'}</span>
        </div>

        {/* Main content */}
        <div>
          <div style={{ fontSize: 8, fontWeight: 700, color: p.accent, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 5, opacity: 0.75 }}>{d.badge||'Marketing'}</div>
          <div style={{ fontSize: isWide ? 15 : isTall ? 21 : 19, fontWeight: 900, color: p.text, lineHeight: 1.1, letterSpacing: '-0.025em', marginBottom: isWide ? 0 : 6 }}>{d.headline||'Your headline here'}</div>
          {!isWide && d.body && <div style={{ fontSize: isTall ? 11 : 10, color: p.sub, lineHeight: 1.55, marginTop: 4 }}>{d.body.slice(0, isTall ? 130 : 90)}</div>}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ padding: '5px 13px', borderRadius: 20, background: p.accent, fontSize: 9, fontWeight: 800, color: p.bg, letterSpacing: '0.02em' }}>{d.cta||'Learn More'}</div>
          {d.website && <span style={{ fontSize: 8, color: p.sub, opacity: 0.55 }}>{d.website}</span>}
        </div>
      </div>

      {/* Photo panel */}
      {photo
        ? <div style={{ [isWide ? 'width' : 'height']: isWide ? '42%' : '38%', position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
            <img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(${isWide ? 'to right' : 'to bottom'}, ${p.bg}cc, transparent)` }} />
          </div>
        : <div style={{ [isWide ? 'width' : 'height']: isWide ? '35%' : '30%', background: p.accent+'12', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 22, opacity: 0.1 }}>✦</span>
          </div>}

      {/* Subtle background shape */}
      <div style={{ position: 'absolute', bottom: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: p.accent, opacity: 0.04, pointerEvents: 'none' }} />
    </div>
  );
}

// Variation B: Full bleed photo with gradient overlay
function VariationFullBleed({ d, p, photo, logo, size }) {
  const { w, h } = size;
  const isTall = h > w * 1.1;

  return (
    <div style={{ width: w, height: h, position: 'relative', overflow: 'hidden', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      {/* Background */}
      {photo
        ? <img src={photo} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 70% 30%, ${p.accent}55 0%, ${p.bg} 65%)` }} />}

      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: photo
        ? `linear-gradient(to top, ${p.bg}f5 0%, ${p.bg}99 45%, ${p.bg}44 75%, transparent 100%)`
        : 'transparent'
      }} />

      {/* Content */}
      <div style={{ position: 'absolute', inset: 0, padding: isTall ? '16px 18px' : '14px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* Brand top */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, alignSelf: 'flex-start' }}>
          {logo
            ? <img src={logo} style={{ width: 28, height: 28, borderRadius: 7, objectFit: 'contain', background: 'rgba(255,255,255,0.12)', padding: 2 }} />
            : <div style={{ width: 28, height: 28, borderRadius: 7, background: p.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: p.bg }}>{(d.brandName||'I')[0]}</div>}
          <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>{d.brandName||'Brand'}</span>
        </div>

        {/* Bottom content */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 20, background: p.accent, fontSize: 8, fontWeight: 800, color: p.bg, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{d.badge||'Marketing'}</div>
          <div style={{ fontSize: isTall ? 20 : 17, fontWeight: 900, color: '#fff', lineHeight: 1.12, letterSpacing: '-0.02em', marginBottom: 5, textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}>{d.headline||'Your headline here'}</div>
          {isTall && d.body && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: 10 }}>{d.body.slice(0, 120)}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: isTall ? 0 : 4 }}>
            <div style={{ padding: '5px 14px', borderRadius: 20, background: p.accent, fontSize: 9, fontWeight: 800, color: p.bg }}>{d.cta||'Learn More'}</div>
            {d.website && <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>{d.website}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// Variation C: Editorial / magazine — clean grid with photo in upper section
function VariationEditorial({ d, p, photo, logo, size }) {
  const { w, h } = size;
  const isWide = w > h * 1.3;
  const photoH = isWide ? h : Math.round(h * 0.48);

  return (
    <div style={{ width: w, height: h, background: p.bg, position: 'relative', overflow: 'hidden', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      {isWide ? (
        // Wide: left content, right photo
        <div style={{ display: 'flex', height: '100%' }}>
          <div style={{ flex: 1, padding: '14px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {logo ? <img src={logo} style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'contain' }} />
                : <div style={{ width: 22, height: 22, borderRadius: 5, background: p.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: p.bg }}>{(d.brandName||'I')[0]}</div>}
              <span style={{ fontSize: 8, fontWeight: 800, color: p.sub, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{d.brandName}</span>
            </div>
            {/* Content */}
            <div>
              <div style={{ fontSize: 7, fontWeight: 700, color: p.accent, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4 }}>{d.badge}</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: p.text, lineHeight: 1.15, letterSpacing: '-0.02em' }}>{d.headline}</div>
            </div>
            {/* CTA */}
            <div style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: 5, background: p.accent, fontSize: 8, fontWeight: 800, color: p.bg, alignSelf: 'flex-start' }}>{d.cta||'Learn More'}</div>
          </div>
          {/* Photo */}
          <div style={{ width: '44%', position: 'relative', flexShrink: 0 }}>
            {photo ? <img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: p.accent+'18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 24, opacity: 0.12 }}>✦</span></div>}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: p.accent }} />
          </div>
        </div>
      ) : (
        // Portrait / square: photo top, content bottom
        <>
          {/* Photo section */}
          <div style={{ height: photoH, position: 'relative', overflow: 'hidden' }}>
            {photo ? <img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${p.accent}22, ${p.accent}08)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 32, opacity: 0.1 }}>✦</span></div>}
            {/* Badge on photo */}
            <div style={{ position: 'absolute', top: 10, left: 14, padding: '2px 9px', borderRadius: 20, background: p.accent, fontSize: 8, fontWeight: 800, color: p.bg, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{d.badge||'Marketing'}</div>
          </div>

          {/* Accent line */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${p.accent}, ${p.accent}44)` }} />

          {/* Content section */}
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: h - photoH - 3, boxSizing: 'border-box' }}>
            <div>
              <div style={{ fontSize: h > w * 1.3 ? 18 : 15, fontWeight: 900, color: p.text, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 4 }}>{d.headline||'Your headline'}</div>
              {d.body && <div style={{ fontSize: 10, color: p.sub, lineHeight: 1.5 }}>{d.body.slice(0, 100)}</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {logo ? <img src={logo} style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'contain' }} />
                  : <div style={{ width: 20, height: 20, borderRadius: 4, background: p.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, color: p.bg }}>{(d.brandName||'I')[0]}</div>}
                <span style={{ fontSize: 8, fontWeight: 700, color: p.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d.brandName||'Brand'}</span>
              </div>
              <div style={{ padding: '4px 12px', borderRadius: 20, background: p.accent, fontSize: 8, fontWeight: 800, color: p.bg }}>{d.cta||'Learn More'}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Variation renderer ────────────────────────────────────────────────────────
const VARIATIONS = [
  { id: 'bold',      label: 'Bold',      desc: 'Strong typography' },
  { id: 'fullbleed', label: 'Full Bleed', desc: 'Immersive photo' },
  { id: 'editorial', label: 'Editorial', desc: 'Magazine style' },
];

function RenderVariation({ variationId, d, p, photo, logo, size }) {
  const props = { d, p, photo, logo, size };
  switch (variationId) {
    case 'bold':      return <VariationBold      {...props} />;
    case 'fullbleed': return <VariationFullBleed {...props} />;
    case 'editorial': return <VariationEditorial {...props} />;
    default:          return <VariationBold      {...props} />;
  }
}

// ── Main DesignStudio Modal ───────────────────────────────────────────────────
export default function DesignStudio({ isOpen, onClose, contentItem, campaignName, allContent }) {
  const [brand,       setBrand]       = useState(null);
  const [paletteIdx,  setPaletteIdx]  = useState(0);
  const [customPalette, setCustomPalette] = useState(null);
  const [photo,       setPhoto]       = useState(null);
  const [logo,        setLogo]        = useState(null);
  const [selected,    setSelected]    = useState('bold');
  const [exporting,   setExporting]   = useState(null); // variationId being exported
  const [exported,    setExported]    = useState(null);
  const [editing,     setEditing]     = useState(false);
  const [data,        setData]        = useState({ brandName: '', tagline: '', badge: '', headline: '', body: '', cta: 'Learn More', website: '' });

  const canvasRefs = {
    bold:      useRef(null),
    fullbleed: useRef(null),
    editorial: useRef(null),
  };
  const photoRef = useRef(null);
  const logoRef  = useRef(null);

  // ── Palettes ─────────────────────────────────────────────────────────────────
  const PALETTES = [
    { id: 'midnight', name: 'Midnight',  bg: '#0c1220', accent: '#6366f1', text: '#f8fafc', sub: '#a5b4fc' },
    { id: 'noir',     name: 'Noir',      bg: '#0a0a0a', accent: '#ffffff', text: '#ffffff', sub: '#999999' },
    { id: 'forest',   name: 'Forest',    bg: '#0d1f0f', accent: '#22c55e', text: '#f0fdf4', sub: '#86efac' },
    { id: 'ocean',    name: 'Ocean',     bg: '#020d1a', accent: '#38bdf8', text: '#f0f9ff', sub: '#7dd3fc' },
    { id: 'ember',    name: 'Ember',     bg: '#130800', accent: '#f97316', text: '#fff7ed', sub: '#fdba74' },
    { id: 'violet',   name: 'Violet',    bg: '#0d0520', accent: '#a855f7', text: '#faf5ff', sub: '#d8b4fe' },
    { id: 'rose',     name: 'Rose',      bg: '#18030d', accent: '#f43f5e', text: '#fff1f2', sub: '#fda4af' },
    { id: 'gold',     name: 'Gold',      bg: '#0f0900', accent: '#eab308', text: '#fefce8', sub: '#fde047' },
    { id: 'arctic',   name: 'Arctic',    bg: '#f8fafc', accent: '#0ea5e9', text: '#0f172a', sub: '#475569' },
    { id: 'teal',     name: 'Teal',      bg: '#011a18', accent: '#14b8a6', text: '#f0fdfa', sub: '#5eead4' },
  ];

  const activePalette = (() => {
    if (customPalette) return customPalette;
    if (brand?.paletteOverride) return brand.paletteOverride;
    return PALETTES[paletteIdx] || PALETTES[0];
  })();

  // ── Load brand + parse content on open ───────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !contentItem) return;

    // Parse content
    const parsed = parseContent(contentItem.content, contentItem.format);
    setData(prev => ({
      ...prev,
      headline: parsed.headline || prev.headline,
      body:     parsed.body     || prev.body,
      brandName: campaignName   || prev.brandName,
      badge:    'Marketing',
      cta:      'Learn More',
    }));
    setPhoto(null);
    setExported(null);
    setEditing(false);

    // Fetch brand profile
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
        // Build brand palette if 2+ colors set
        const colors = b.brand_colors || [];
        if (colors.length >= 2) {
          const bg = colors[0], accent = colors[1];
          const brandPal = {
            id: 'brand', name: `${b.brand_name} Brand`,
            bg, accent,
            text: isLight(bg) ? '#0f172a' : '#f8fafc',
            sub:  isLight(bg) ? '#475569' : '#94a3b8',
          };
          setCustomPalette(brandPal);
        }
      })
      .catch(() => {});
  }, [isOpen, contentItem]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleFile = (e, setter) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setter(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleExport = async (variationId) => {
    const ref = canvasRefs[variationId];
    if (!ref?.current) return;
    setExporting(variationId);
    await new Promise(r => setTimeout(r, 60));
    try {
      const canvas = await html2canvas(ref.current, {
        scale: 2, useCORS: true,
        backgroundColor: activePalette.bg,
        logging: false, allowTaint: true,
      });
      const link = document.createElement('a');
      const formatSlug = contentItem?.format?.toLowerCase() || 'design';
      link.download = `ivey-${formatSlug}-${variationId}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setExported(variationId);
      setTimeout(() => setExported(null), 2500);
    } catch (e) { console.error('Export failed:', e); }
    finally { setExporting(null); }
  };

  if (!isOpen || !contentItem) return null;

  const templateType = formatToTemplate(contentItem.format);
  const size = CANVAS_SIZES[templateType] || CANVAS_SIZES.instagram;
  const formatName = contentItem.format?.replace(/_/g, ' ') || 'Content';

  // Scale canvas for display (max ~280px wide in the cards)
  const maxDisplayW = 260;
  const scale = Math.min(1, maxDisplayW / size.w);
  const displayW = Math.round(size.w * scale);
  const displayH = Math.round(size.h * scale);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✦</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9' }}>Design Studio</div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>{formatName} · {size.w}×{size.h}px · {size.label}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>✕</button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Three variations side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
            {VARIATIONS.map(v => (
              <div key={v.id}
                onClick={() => setSelected(v.id)}
                style={{
                  borderRadius: 14,
                  border: `2px solid ${selected === v.id ? '#6366f1' : 'rgba(255,255,255,0.06)'}`,
                  background: selected === v.id ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                  overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: selected === v.id ? '0 0 0 1px #6366f1, 0 8px 32px rgba(99,102,241,0.2)' : 'none',
                }}>

                {/* Variation label */}
                <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: selected === v.id ? '#818cf8' : '#64748b' }}>{v.label}</span>
                    <span style={{ fontSize: 10, color: '#334155', marginLeft: 6 }}>{v.desc}</span>
                  </div>
                  {selected === v.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }} />}
                </div>

                {/* Canvas preview */}
                <div style={{ padding: '14px', display: 'flex', justifyContent: 'center', background: '#04080f' }}>
                  <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: size.w, height: size.h, flexShrink: 0 }}
                    ref={canvasRefs[v.id]}>
                    <RenderVariation variationId={v.id} d={data} p={activePalette} photo={photo} logo={logo} size={size} />
                  </div>
                  {/* Invisible spacer to make container correct size */}
                  <div style={{ width: displayW, height: displayH, flexShrink: 0, marginLeft: -(size.w) }} />
                </div>

                {/* Export button */}
                <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button
                    onClick={e => { e.stopPropagation(); handleExport(v.id); }}
                    disabled={!!exporting}
                    style={{
                      width: '100%', padding: '8px', borderRadius: 8, border: 'none',
                      background: exported === v.id ? 'linear-gradient(135deg,#10b981,#059669)' : selected === v.id ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.05)',
                      color: selected === v.id || exported === v.id ? '#fff' : '#475569',
                      fontSize: 11, fontWeight: 700, cursor: exporting ? 'wait' : 'pointer',
                      transition: 'all 0.2s',
                    }}>
                    {exporting === v.id ? '⏳ Exporting...' : exported === v.id ? '✅ Downloaded!' : '⬇ Export PNG'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Controls row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>

            {/* Palette selector */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Color Palette</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {/* Brand palette dot (if available) */}
                {brand?.brand_colors?.length >= 2 && (
                  <button
                    onClick={() => { setCustomPalette({ id:'brand', name:`${brand.brand_name} Brand`, bg: brand.brand_colors[0], accent: brand.brand_colors[1], text: isLight(brand.brand_colors[0]) ? '#0f172a' : '#f8fafc', sub: isLight(brand.brand_colors[0]) ? '#475569' : '#94a3b8' }); }}
                    title={`${brand.brand_name} Brand Colors`}
                    style={{ width: 26, height: 26, borderRadius: '50%', background: brand.brand_colors[1], border: customPalette?.id === 'brand' ? '3px solid #f1f5f9' : '2px solid rgba(255,255,255,0.1)', cursor: 'pointer', transform: customPalette?.id === 'brand' ? 'scale(1.25)' : 'scale(1)', transition: 'all 0.15s', position: 'relative', outline: 'none' }}>
                    <span style={{ position: 'absolute', bottom: -14, left: '50%', transform: 'translateX(-50%)', fontSize: 7, color: '#475569', whiteSpace: 'nowrap' }}>Brand</span>
                  </button>
                )}
                {PALETTES.map((pp, i) => (
                  <button key={pp.id} onClick={() => { setCustomPalette(null); setPaletteIdx(i); }} title={pp.name}
                    style={{ width: 26, height: 26, borderRadius: '50%', background: pp.accent, border: !customPalette && paletteIdx === i ? '3px solid #f1f5f9' : '2px solid rgba(255,255,255,0.08)', cursor: 'pointer', transform: !customPalette && paletteIdx === i ? 'scale(1.25)' : 'scale(1)', transition: 'all 0.15s', outline: 'none', flexShrink: 0 }} />
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 11, color: '#475569' }}>
                Active: <span style={{ color: '#94a3b8', fontWeight: 600 }}>{activePalette.name}</span>
              </div>
            </div>

            {/* Photo & logo upload */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Photos & Logo</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {/* Photo */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: '#475569', marginBottom: 5, fontWeight: 600 }}>Product Photo</div>
                  <div onClick={() => photoRef.current?.click()} style={{ height: 60, borderRadius: 8, background: '#0f172a', border: '1px dashed #1e293b', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 5 }}>
                    {photo ? <img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 10, color: '#1e293b' }}>Click to upload</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => photoRef.current?.click()} style={{ flex: 1, padding: '5px', background: '#1e293b', border: '1px solid #334155', borderRadius: 5, color: '#94a3b8', fontSize: 9, cursor: 'pointer' }}>{photo ? '🔄' : '📸 Upload'}</button>
                    {photo && <button onClick={() => setPhoto(null)} style={{ padding: '5px 7px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 5, color: '#ef4444', fontSize: 9, cursor: 'pointer' }}>✕</button>}
                  </div>
                  <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e, setPhoto)} />
                </div>
                {/* Logo */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: '#475569', marginBottom: 5, fontWeight: 600 }}>Logo</div>
                  <div onClick={() => logoRef.current?.click()} style={{ height: 60, borderRadius: 8, background: '#0f172a', border: '1px dashed #1e293b', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 5 }}>
                    {logo ? <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} /> : <span style={{ fontSize: 10, color: '#1e293b' }}>Click to upload</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => logoRef.current?.click()} style={{ flex: 1, padding: '5px', background: '#1e293b', border: '1px solid #334155', borderRadius: 5, color: '#94a3b8', fontSize: 9, cursor: 'pointer' }}>{logo ? '🔄' : '🏷 Upload'}</button>
                    {logo && <button onClick={() => setLogo(null)} style={{ padding: '5px 7px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 5, color: '#ef4444', fontSize: 9, cursor: 'pointer' }}>✕</button>}
                  </div>
                  <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e, setLogo)} />
                </div>
              </div>
            </div>

            {/* Text tweaks */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Text</div>
                <button onClick={() => setEditing(v => !v)} style={{ fontSize: 9, fontWeight: 700, color: editing ? '#6366f1' : '#475569', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  {editing ? '✓ Done' : '✏️ Edit'}
                </button>
              </div>
              {editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { k: 'headline', label: 'Headline', rows: 2 },
                    { k: 'body',     label: 'Body',     rows: 2 },
                    { k: 'cta',      label: 'CTA',      rows: 1 },
                    { k: 'website',  label: 'Website',  rows: 1 },
                  ].map(({ k, label, rows }) => (
                    <div key={k}>
                      <div style={{ fontSize: 8, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{label}</div>
                      <textarea value={data[k]||''} onChange={e => setData(p => ({ ...p, [k]: e.target.value }))} rows={rows}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 6, padding: '6px 8px', fontSize: 11, color: '#f1f5f9', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.4 }}
                        onFocus={e => e.target.style.borderColor = '#6366f1'}
                        onBlur={e => e.target.style.borderColor = '#1e293b'}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 11, color: '#f1f5f9', fontWeight: 600, lineHeight: 1.3 }}>{data.headline || '—'}</div>
                  {data.body && <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.4 }}>{data.body.slice(0, 80)}...</div>}
                  <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                    {data.cta && <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 20, background: activePalette.accent+'22', color: activePalette.accent, fontWeight: 700 }}>{data.cta}</span>}
                    {data.website && <span style={{ fontSize: 9, color: '#334155' }}>{data.website}</span>}
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