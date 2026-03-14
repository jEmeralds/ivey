// frontend/src/components/DesignEditor.jsx
// Full drag-and-drop design editor with asset upload, palettes, business details, PNG export
// Requires: npm install html2canvas (in /frontend)

import { useState, useEffect, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';

// ── Canvas templates ──────────────────────────────────────────────────────────
const TEMPLATES = [
  { id: 'instagram_post',  name: 'Instagram Post',    icon: '📸', w: 400, h: 400,  desc: '1:1' },
  { id: 'instagram_story', name: 'Story',             icon: '📱', w: 225, h: 400,  desc: '9:16' },
  { id: 'youtube_thumb',   name: 'YT Thumbnail',      icon: '▶',  w: 400, h: 225,  desc: '16:9' },
  { id: 'twitter_post',    name: 'Twitter / X',       icon: '✕',  w: 400, h: 225,  desc: '16:9' },
  { id: 'banner_ad',       name: 'Banner Ad',         icon: '◻',  w: 400, h: 150,  desc: 'Wide' },
  { id: 'flyer',           name: 'Flyer',             icon: '❐',  w: 280, h: 400,  desc: 'A5' },
  { id: 'facebook_cover',  name: 'Facebook Cover',    icon: '𝐟',  w: 400, h: 150,  desc: '820×312' },
  { id: 'linkedin_post',   name: 'LinkedIn Post',     icon: 'in', w: 400, h: 300,  desc: '4:3' },
];

// ── Color palettes ────────────────────────────────────────────────────────────
const PALETTES = [
  { id: 'emerald',    name: 'Emerald Night',   bg: '#071a0f', accent: '#10b981', text: '#ecfdf5', sub: '#6ee7b7', card: '#0d2818' },
  { id: 'midnight',   name: 'Midnight',        bg: '#0c1220', accent: '#6366f1', text: '#f8fafc', sub: '#a5b4fc', card: '#131d33' },
  { id: 'amber',      name: 'Amber Glow',      bg: '#180e00', accent: '#f59e0b', text: '#fffbeb', sub: '#fcd34d', card: '#261500' },
  { id: 'rose',       name: 'Rose Quartz',     bg: '#18030d', accent: '#f43f5e', text: '#fff1f2', sub: '#fda4af', card: '#260614' },
  { id: 'ocean',      name: 'Deep Ocean',      bg: '#020d1a', accent: '#0ea5e9', text: '#f0f9ff', sub: '#7dd3fc', card: '#05182a' },
  { id: 'violet',     name: 'Violet Storm',    bg: '#0d0520', accent: '#a855f7', text: '#faf5ff', sub: '#d8b4fe', card: '#160a30' },
  { id: 'coral',      name: 'Coral Sunset',    bg: '#1a0800', accent: '#f97316', text: '#fff7ed', sub: '#fdba74', card: '#2a0f00' },
  { id: 'teal',       name: 'Teal Mist',       bg: '#011a18', accent: '#14b8a6', text: '#f0fdfa', sub: '#5eead4', card: '#052a26' },
  { id: 'gold',       name: 'Gold Rush',       bg: '#100c00', accent: '#eab308', text: '#fefce8', sub: '#fde047', card: '#1c1500' },
  { id: 'crimson',    name: 'Crimson',         bg: '#120004', accent: '#dc2626', text: '#fff5f5', sub: '#fca5a5', card: '#1e0006' },
  { id: 'forest',     name: 'Forest Deep',     bg: '#051008', accent: '#16a34a', text: '#f0fdf4', sub: '#86efac', card: '#0a1f0e' },
  { id: 'slate',      name: 'Slate Pro',       bg: '#0f1117', accent: '#64748b', text: '#f1f5f9', sub: '#94a3b8', card: '#1a1f2e' },
  { id: 'pink',       name: 'Neon Pink',       bg: '#12001a', accent: '#ec4899', text: '#fdf2f8', sub: '#f9a8d4', card: '#1e0028' },
  { id: 'lime',       name: 'Lime Punch',      bg: '#0a1200', accent: '#84cc16', text: '#f7fee7', sub: '#bef264', card: '#121e00' },
  { id: 'pure_white', name: 'Clean White',     bg: '#ffffff', accent: '#111827', text: '#111827', sub: '#4b5563', card: '#f3f4f6' },
  { id: 'warm_white', name: 'Warm Paper',      bg: '#fdf6ec', accent: '#92400e', text: '#1c0a00', sub: '#78350f', card: '#fef3c7' },
  { id: 'cool_gray',  name: 'Cool Gray',       bg: '#f8fafc', accent: '#3b82f6', text: '#0f172a', sub: '#334155', card: '#e2e8f0' },
  { id: 'charcoal',   name: 'Charcoal',        bg: '#1c1c1e', accent: '#ffffff', text: '#ffffff', sub: '#ebebf5cc', card: '#2c2c2e' },
];

function extractSnippet(generatedContent, templateId) {
  if (!generatedContent?.length) return { headline: '', body: '' };
  const map = {
    instagram_post:  ['INSTAGRAM_CAPTION', 'SOCIAL_POST'],
    instagram_story: ['INSTAGRAM_STORY', 'INSTAGRAM_CAPTION'],
    youtube_thumb:   ['YOUTUBE_TITLE', 'VIDEO_SCRIPT'],
    twitter_post:    ['TWITTER_POST', 'SOCIAL_POST'],
    banner_ad:       ['BANNER_AD', 'GOOGLE_SEARCH_AD'],
    flyer:           ['FLYER_TEXT', 'PRINT_AD'],
    facebook_cover:  ['SOCIAL_POST', 'INSTAGRAM_CAPTION'],
    linkedin_post:   ['LINKEDIN_POST', 'SOCIAL_POST'],
  };
  const order = map[templateId] || [];
  let match = null;
  for (const fmt of order) { match = generatedContent.find(i => i.format === fmt); if (match) break; }
  if (!match) match = generatedContent[0];
  const raw = (match?.content || '').replace(/#+\s*/g, '').replace(/\*{1,2}/g, '').trim();
  const sents = raw.match(/[^.!?\n]+[.!?\n]*/g) || [raw];
  return {
    headline: sents[0]?.trim().slice(0, 72) || '',
    body:     sents.slice(1, 3).join(' ').trim().slice(0, 130) || '',
  };
}

// ── Draggable layer wrapper ───────────────────────────────────────────────────
function DragLayer({ id, x, y, onDrag, children, selected, onSelect }) {
  const ref = useRef(null);
  const dragging = useRef(false);
  const origin = useRef({ mx: 0, my: 0, ex: 0, ey: 0 });

  const onMouseDown = (e) => {
    e.stopPropagation();
    onSelect(id);
    dragging.current = true;
    origin.current = { mx: e.clientX, my: e.clientY, ex: x, ey: y };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = useCallback((e) => {
    if (!dragging.current) return;
    const dx = e.clientX - origin.current.mx;
    const dy = e.clientY - origin.current.my;
    onDrag(id, origin.current.ex + dx, origin.current.ey + dy);
  }, [id, onDrag]);

  const onMouseUp = useCallback(() => {
    dragging.current = false;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }, [onMouseMove]);

  return (
    <div
      ref={ref}
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        left: x, top: y,
        cursor: 'grab',
        userSelect: 'none',
        outline: selected ? '2px dashed rgba(99,102,241,0.8)' : 'none',
        outlineOffset: 3,
        zIndex: selected ? 10 : 1,
      }}
    >
      {children}
    </div>
  );
}

// ── Canvas renderer ───────────────────────────────────────────────────────────
function DesignCanvas({ template, palette: p, layers, selectedLayer, onDragLayer, onSelectLayer, canvasRef, photoBg, photoBgOpacity }) {
  const bgPhotoSrc = layers.find(l => l.id === 'photo')?.src;
  return (
    <div
      ref={canvasRef}
      style={{
        width: template.w, height: template.h,
        background: p.bg,
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        fontFamily: "'Syne', 'DM Sans', -apple-system, sans-serif",
      }}
      onClick={() => onSelectLayer(null)}
    >
      {/* Full-bleed background photo */}
      {photoBg && bgPhotoSrc && (
        <>
          <img src={bgPhotoSrc} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, background: p.bg, opacity: photoBgOpacity, pointerEvents: 'none' }} />
        </>
      )}
      {!photoBg && <>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: p.accent, opacity: 0.08, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 140, height: 140, borderRadius: '50%', background: p.accent, opacity: 0.05, pointerEvents: 'none' }} />
      </>}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${p.accent}, transparent)`, pointerEvents: 'none' }} />
      {layers.map(layer => {
        if (!layer.visible) return null;
        if (photoBg && layer.id === 'photo') return null;
        return (
          <DragLayer key={layer.id} id={layer.id} x={layer.x} y={layer.y} onDrag={onDragLayer} selected={selectedLayer === layer.id} onSelect={onSelectLayer}>
            <LayerRenderer layer={layer} palette={p} />
          </DragLayer>
        );
      })}
    </div>
  );
}

// ── Render each layer type ────────────────────────────────────────────────────
function LayerRenderer({ layer, palette: p }) {
  if (layer.type === 'text') {
    return (
      <div style={{
        fontSize: layer.fontSize, fontWeight: layer.fontWeight || 700,
        color: layer.color || p.text,
        maxWidth: layer.maxWidth || 300,
        lineHeight: layer.lineHeight || 1.25,
        letterSpacing: layer.letterSpacing || '-0.01em',
        whiteSpace: layer.wrap ? 'normal' : 'nowrap',
        textTransform: layer.uppercase ? 'uppercase' : 'none',
      }}>
        {layer.content || layer.placeholder}
      </div>
    );
  }
  if (layer.type === 'image') {
    return layer.src
      ? <img src={layer.src} alt="" style={{ width: layer.w, height: layer.h, objectFit: layer.fit || 'cover', borderRadius: layer.radius || 0, display: 'block' }} />
      : <div style={{ width: layer.w, height: layer.h, background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: layer.radius || 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{layer.label || 'Image'}</div>;
  }
  if (layer.type === 'logo') {
    return layer.src
      ? <img src={layer.src} alt="logo" style={{ width: layer.w, height: layer.h, objectFit: 'contain', borderRadius: layer.radius || 0, display: 'block' }} />
      : <div style={{ width: layer.w, height: layer.h, background: p.accent, borderRadius: layer.radius || 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: layer.h * 0.45, fontWeight: 900, color: p.bg }}>
          {(layer.fallback || 'I')}
        </div>;
  }
  if (layer.type === 'badge') {
    return (
      <div style={{ padding: '3px 9px', borderRadius: 20, background: p.accent + '22', border: `1px solid ${p.accent}44`, fontSize: layer.fontSize || 9, fontWeight: 800, color: p.accent, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {layer.content || 'Label'}
      </div>
    );
  }
  if (layer.type === 'divider') {
    return <div style={{ width: layer.w || 120, height: 2, background: `linear-gradient(90deg, ${p.accent}, transparent)`, borderRadius: 2 }} />;
  }
  if (layer.type === 'cta') {
    return (
      <div style={{ padding: '7px 16px', borderRadius: 8, background: p.accent, fontSize: layer.fontSize || 11, fontWeight: 800, color: p.bg, letterSpacing: '0.04em' }}>
        {layer.content || 'Learn More'}
      </div>
    );
  }
  if (layer.type === 'contact') {
    return (
      <div style={{ fontSize: layer.fontSize || 9, color: p.sub, lineHeight: 1.7, opacity: 0.85 }}>
        {layer.items?.filter(i => i.value).map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ opacity: 0.6 }}>{item.icon}</span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// ── Build default layers for a template ──────────────────────────────────────
function buildLayers(template, snippet, business) {
  const { w, h } = template;
  const isWide = w > h * 1.3;
  const isTall = h > w * 1.2;

  return [
    // Product image (background-ish)
    { id: 'photo', type: 'image', label: 'Product Photo', x: isWide ? w - 160 : w - 130, y: isWide ? 0 : 40, w: isWide ? 160 : 120, h: isWide ? h : 120, fit: 'cover', radius: 0, src: null, visible: true },
    // Logo
    { id: 'logo', type: 'logo', x: 14, y: 12, w: 32, h: 32, radius: 8, fallback: (business.name || 'I').charAt(0).toUpperCase(), src: null, visible: true },
    // Brand name
    { id: 'brand', type: 'text', x: 54, y: 18, content: business.name || 'Brand Name', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', uppercase: true, placeholder: 'Brand Name', visible: true },
    // Badge/category
    { id: 'badge', type: 'badge', x: 14, y: isWide ? h - 100 : h - 140, content: business.category || 'Marketing', fontSize: 9, visible: true },
    // Headline
    { id: 'headline', type: 'text', x: 14, y: isWide ? h - 82 : h - 118, content: snippet.headline, fontSize: isWide ? 16 : isTall ? 20 : 19, fontWeight: 900, maxWidth: isWide ? w - 180 : w - 28, wrap: true, placeholder: 'Your headline', visible: true },
    // Body
    { id: 'body', type: 'text', x: 14, y: isWide ? h - 46 : h - 64, content: snippet.body, fontSize: isWide ? 10 : 11, fontWeight: 400, maxWidth: isWide ? w - 180 : w - 28, wrap: true, lineHeight: 1.5, placeholder: 'Supporting text...', visible: !isWide },
    // Divider
    { id: 'divider', type: 'divider', x: 14, y: h - 22, w: isWide ? 80 : 100, visible: true },
    // Website CTA
    { id: 'website', type: 'text', x: isWide ? 24 : 14, y: h - 18, content: business.website || 'ivey.app', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', uppercase: true, placeholder: 'yoursite.com', visible: true },
    // Contact block
    { id: 'contact', type: 'contact', x: isWide ? w - 155 : 14, y: isWide ? h - 38 : -200, fontSize: 8, visible: isWide,
      items: [
        { icon: '📞', value: business.phone || '' },
        { icon: '✉', value: business.email || '' },
      ]
    },
    // CTA button (optional)
    { id: 'cta', type: 'cta', x: w - 100, y: h - 36, content: business.cta || 'Learn More', fontSize: 10, visible: !isWide },
  ];
}

// ── Sidebar panels ────────────────────────────────────────────────────────────
const inputStyle = { width: '100%', background: '#1e293b', border: '1px solid #2d3f55', borderRadius: 7, padding: '7px 10px', fontSize: 11, color: '#f1f5f9', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const labelStyle = { fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 3 };
const sectionHead = { fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, marginTop: 16, borderBottom: '1px solid #1e293b', paddingBottom: 5 };

function PalettePanel({ palette, onChange }) {
  return (
    <div>
      <div style={sectionHead}>Color Palettes</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {PALETTES.map(p => (
          <button key={p.id} onClick={() => onChange(p)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', borderRadius: 8, background: palette.id === p.id ? '#1e293b' : 'transparent', border: palette.id === p.id ? `1px solid ${p.accent}` : '1px solid #1e293b', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: p.bg, border: `2px solid ${p.accent}`, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: palette.id === p.id ? '#f1f5f9' : '#64748b', fontWeight: palette.id === p.id ? 700 : 400 }}>{p.name}</span>
          </button>
        ))}
      </div>

      <div style={sectionHead}>Custom Colors</div>
      {[
        { key: 'bg',     label: 'Background' },
        { key: 'accent', label: 'Accent' },
        { key: 'text',   label: 'Text' },
        { key: 'sub',    label: 'Subtext' },
      ].map(({ key, label }) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <input type="color" value={palette[key]} onChange={e => onChange({ ...palette, id: 'custom', name: 'Custom', ...{ [key]: e.target.value } })}
            style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #2d3f55', cursor: 'pointer', padding: 2, background: 'transparent' }} />
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{label}</span>
          <span style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace', marginLeft: 'auto' }}>{palette[key]}</span>
        </div>
      ))}
    </div>
  );
}

function BusinessPanel({ business, onChange }) {
  const fields = [
    { key: 'name',     label: 'Business Name',  placeholder: 'Acme Co.' },
    { key: 'tagline',  label: 'Tagline',         placeholder: 'Just do it.' },
    { key: 'category', label: 'Category / Niche',placeholder: 'Health & Wellness' },
    { key: 'website',  label: 'Website',         placeholder: 'acme.co' },
    { key: 'email',    label: 'Email',           placeholder: 'hello@acme.co' },
    { key: 'phone',    label: 'Phone',           placeholder: '+254 700 000 000' },
    { key: 'address',  label: 'Address',         placeholder: 'Nairobi, Kenya' },
    { key: 'instagram',label: 'Instagram',       placeholder: '@acmeco' },
    { key: 'twitter',  label: 'Twitter / X',     placeholder: '@acmeco' },
    { key: 'tiktok',   label: 'TikTok',          placeholder: '@acmeco' },
    { key: 'cta',      label: 'CTA Button Text', placeholder: 'Shop Now' },
  ];
  return (
    <div>
      <div style={sectionHead}>Business Details</div>
      {fields.map(({ key, label, placeholder }) => (
        <div key={key} style={{ marginBottom: 9 }}>
          <label style={labelStyle}>{label}</label>
          <input value={business[key] || ''} onChange={e => onChange({ ...business, [key]: e.target.value })}
            placeholder={placeholder} style={inputStyle} />
        </div>
      ))}
    </div>
  );
}

function AssetsPanel({ layers, onLogoUpload, onPhotoUpload, onLayerToggle, onLayerDelete, onClearLogo, onClearPhoto, photoBg, onPhotoBgToggle, photoBgOpacity, onPhotoBgOpacity }) {
  const logoRef  = useRef();
  const photoRef = useRef();
  const hasLogo  = !!layers.find(l => l.id === 'logo')?.src;
  const hasPhoto = !!layers.find(l => l.id === 'photo')?.src;

  const handleFile = (e, cb) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => cb(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div style={sectionHead}>Assets</div>

      {/* Logo */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Logo</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: '#1e293b', border: '1px solid #2d3f55', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {hasLogo
              ? <img src={layers.find(l => l.id === 'logo').src} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : <span style={{ fontSize: 18, opacity: 0.3 }}>🏷</span>}
          </div>
          <button onClick={() => logoRef.current.click()} style={{ flex: 1, padding: '8px 0', background: '#1e293b', border: '1px dashed #334155', borderRadius: 8, color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>
            {hasLogo ? 'Replace Logo' : 'Upload Logo'}
          </button>
          {hasLogo && (
            <button onClick={onClearLogo} title="Remove logo" style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 14, cursor: 'pointer', flexShrink: 0 }}>✕</button>
          )}
        </div>
        <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e, onLogoUpload)} />
      </div>

      {/* Product Photo */}
      <div style={{ marginBottom: 6 }}>
        <label style={labelStyle}>Product Photo</label>
        <div style={{ width: '100%', height: 90, borderRadius: 8, background: '#1e293b', border: '1px dashed #334155', overflow: 'hidden', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {hasPhoto
            ? <>
                <img src={layers.find(l => l.id === 'photo').src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={onClearPhoto} title="Remove photo" style={{ position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: 6, background: 'rgba(239,68,68,0.85)', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>✕</button>
              </>
            : <span style={{ fontSize: 28, opacity: 0.2 }}>📷</span>}
        </div>
        <button onClick={() => photoRef.current.click()} style={{ width: '100%', padding: '8px 0', background: '#1e293b', border: '1px dashed #334155', borderRadius: 8, color: '#94a3b8', fontSize: 11, cursor: 'pointer', marginBottom: 8 }}>
          {hasPhoto ? 'Replace Photo' : 'Upload Product Photo'}
        </button>
        <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e, onPhotoUpload)} />

        {/* Use as background toggle */}
        {hasPhoto && (
          <div style={{ background: '#131c2a', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: photoBg ? 10 : 0 }}>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Use as full background</span>
              <button onClick={onPhotoBgToggle}
                style={{ width: 32, height: 18, borderRadius: 9, background: photoBg ? '#6366f1' : '#1e293b', border: photoBg ? 'none' : '1px solid #334155', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: photoBg ? 16 : 2, transition: 'left 0.2s' }} />
              </button>
            </div>
            {photoBg && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: '#64748b' }}>Overlay opacity</span>
                  <span style={{ fontSize: 10, color: '#6366f1', fontWeight: 700 }}>{Math.round(photoBgOpacity * 100)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={photoBgOpacity} onChange={e => onPhotoBgOpacity(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                  <span style={{ fontSize: 9, color: '#334155' }}>Photo only</span>
                  <span style={{ fontSize: 9, color: '#334155' }}>Full overlay</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Layer visibility + delete */}
      <div style={sectionHead}>Layers</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {layers.map(layer => (
          <div key={layer.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 7, background: '#131c2a' }}>
            <span style={{ flex: 1, fontSize: 11, color: layer.visible ? '#94a3b8' : '#334155', textTransform: 'capitalize' }}>{layer.id}</span>
            {/* toggle */}
            <button onClick={() => onLayerToggle(layer.id)}
              style={{ width: 28, height: 16, borderRadius: 8, background: layer.visible ? '#10b981' : '#1e293b', border: layer.visible ? 'none' : '1px solid #334155', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: layer.visible ? 14 : 2, transition: 'left 0.2s' }} />
            </button>
            {/* delete */}
            <button onClick={() => onLayerDelete(layer.id)} title="Delete layer"
              style={{ width: 22, height: 22, borderRadius: 5, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', fontSize: 10, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContentPanel({ layers, onLayerContent }) {
  const textLayers = layers.filter(l => l.type === 'text' || l.type === 'badge' || l.type === 'cta');
  return (
    <div>
      <div style={sectionHead}>Edit Text Layers</div>
      {textLayers.map(layer => (
        <div key={layer.id} style={{ marginBottom: 10 }}>
          <label style={labelStyle}>{layer.id}</label>
          <textarea
            value={layer.content || ''}
            onChange={e => onLayerContent(layer.id, e.target.value)}
            rows={layer.type === 'text' && layer.id === 'body' ? 3 : 2}
            style={{ ...inputStyle, resize: 'vertical' }}
            placeholder={layer.placeholder || ''}
          />
        </div>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DesignEditor({ generatedContent, campaignName, onClose }) {
  const [step,        setStep]        = useState('pick'); // 'pick' | 'edit'
  const [template,    setTemplate]    = useState(null);
  const [palette,     setPalette]     = useState(PALETTES[0]);
  const [layers,      setLayers]      = useState([]);
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [activeTab,   setActiveTab]   = useState('content'); // content | assets | palette | business
  const [business,    setBusiness]    = useState({ name: campaignName || '', tagline: '', category: '', website: '', email: '', phone: '', address: '', instagram: '', twitter: '', tiktok: '', cta: 'Learn More' });
  const [exporting,   setExporting]   = useState(false);
  const [exported,    setExported]    = useState(false);
  const [photoBg,     setPhotoBg]     = useState(false);
  const [photoBgOpacity, setPhotoBgOpacity] = useState(0.45);
  const canvasRef = useRef(null);

  const initLayers = (tmpl) => {
    const snippet = extractSnippet(generatedContent, tmpl.id);
    setLayers(buildLayers(tmpl, snippet, business));
  };

  const pickTemplate = (tmpl) => {
    setTemplate(tmpl);
    initLayers(tmpl);
    setStep('edit');
  };

  const dragLayer = useCallback((id, x, y) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, x, y } : l));
  }, []);

  const toggleLayer  = (id) => setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  const deleteLayer  = (id) => setLayers(prev => prev.filter(l => l.id !== id));
  const clearLogo    = () => setLayers(prev => prev.map(l => l.id === 'logo'  ? { ...l, src: null } : l));
  const clearPhoto   = () => { setLayers(prev => prev.map(l => l.id === 'photo' ? { ...l, src: null } : l)); setPhotoBg(false); };

  const setLayerContent = (id, val) => setLayers(prev => prev.map(l => l.id === id ? { ...l, content: val } : l));

  const setLogo  = (src) => setLayers(prev => prev.map(l => l.id === 'logo'  ? { ...l, src } : l));
  const setPhoto = (src) => setLayers(prev => prev.map(l => l.id === 'photo' ? { ...l, src } : l));

  // Sync business name → brand layer + logo fallback
  useEffect(() => {
    setLayers(prev => prev.map(l => {
      if (l.id === 'brand')   return { ...l, content: business.name || 'Brand Name' };
      if (l.id === 'logo')    return { ...l, fallback: (business.name || 'I').charAt(0).toUpperCase() };
      if (l.id === 'badge')   return { ...l, content: business.category || l.content };
      if (l.id === 'website') return { ...l, content: business.website || 'ivey.app' };
      if (l.id === 'cta')     return { ...l, content: business.cta || 'Learn More' };
      if (l.id === 'contact') return { ...l, items: [{ icon: '📞', value: business.phone || '' }, { icon: '✉', value: business.email || '' }, { icon: '📍', value: business.address || '' }].filter(i => i.value) };
      return l;
    }));
  }, [business]);

  const handleExport = async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    setSelectedLayer(null); // hide selection outlines
    await new Promise(r => setTimeout(r, 80)); // let outline disappear
    try {
      const canvas = await html2canvas(canvasRef.current, { scale: 2, useCORS: true, backgroundColor: palette.bg, logging: false });
      const link = document.createElement('a');
      link.download = `ivey-${template.id}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setExported(true);
      setTimeout(() => setExported(false), 2500);
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setExporting(false);
    }
  };

  // ── Template picker ──────────────────────────────────────────────────────────
  if (step === 'pick') return (
    <div style={{ background: '#080e1a', border: '1px solid #1e293b', borderRadius: 16, overflow: 'hidden', marginTop: 24 }}>
      <div style={{ padding: '16px 22px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>🎨</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9' }}>Design Editor</div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>Choose a canvas size to start</div>
          </div>
        </div>
        {onClose && <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#475569', fontSize: 18, cursor: 'pointer' }}>✕</button>}
      </div>
      <div style={{ padding: '20px 22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
        {TEMPLATES.map(t => (
          <button key={t.id} onClick={() => pickTemplate(t)}
            style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '18px 14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s', outline: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = '#111827'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.background = '#0f172a'; }}
          >
            {/* Mini aspect ratio preview */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
              <div style={{ width: Math.min(60, 60 * t.w / Math.max(t.w, t.h)), height: Math.min(60, 60 * t.h / Math.max(t.w, t.h)), background: 'linear-gradient(135deg,#1e293b,#334155)', borderRadius: 4, border: '1px solid #334155' }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', marginBottom: 3 }}>{t.name}</div>
            <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 600 }}>{t.desc}</div>
            <div style={{ fontSize: 10, color: '#334155', marginTop: 1 }}>{t.w}×{t.h}</div>
          </button>
        ))}
      </div>
    </div>
  );

  // ── Editor ───────────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'content',  label: 'Text',     icon: '✏️' },
    { id: 'assets',   label: 'Assets',   icon: '🖼' },
    { id: 'palette',  label: 'Colors',   icon: '🎨' },
    { id: 'business', label: 'Business', icon: '🏢' },
  ];

  return (
    <div style={{ background: '#080e1a', border: '1px solid #1e293b', borderRadius: 16, overflow: 'hidden', marginTop: 24 }}>

      {/* Top bar */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setStep('pick')} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 7, padding: '5px 12px', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>← Templates</button>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{template.name}</span>
          <span style={{ fontSize: 10, color: '#334155' }}>{template.w}×{template.h} · Drag elements to reposition</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => initLayers(template)} style={{ padding: '7px 14px', borderRadius: 8, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>↺ Reset</button>
          <button onClick={handleExport} disabled={exporting}
            style={{ padding: '7px 18px', borderRadius: 8, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: exporting ? 'not-allowed' : 'pointer', background: exported ? '#10b981' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', opacity: exporting ? 0.7 : 1, transition: 'all 0.2s' }}>
            {exporting ? '⏳ Exporting...' : exported ? '✅ Saved!' : '⬇ Export PNG'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', minHeight: 480 }}>

        {/* Canvas area */}
        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#04080f', gap: 14, borderRight: '1px solid #1e293b' }}>
          {/* Palette quick-select dots */}
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'center' }}>
            {PALETTES.slice(0, 9).map(p => (
              <button key={p.id} onClick={() => setPalette(p)} title={p.name}
                style={{ width: 20, height: 20, borderRadius: '50%', background: p.accent, border: palette.id === p.id ? '3px solid #f1f5f9' : '2px solid transparent', cursor: 'pointer', transition: 'transform 0.15s', transform: palette.id === p.id ? 'scale(1.35)' : 'scale(1)', outline: 'none' }} />
            ))}
            <button onClick={() => setActiveTab('palette')} title="More palettes"
              style={{ width: 20, height: 20, borderRadius: '50%', background: '#1e293b', border: '1px solid #334155', cursor: 'pointer', fontSize: 9, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          </div>

          <div style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.7)', borderRadius: 6 }}>
            <DesignCanvas
              template={template}
              palette={palette}
              layers={layers}
              selectedLayer={selectedLayer}
              onDragLayer={dragLayer}
              onSelectLayer={setSelectedLayer}
              canvasRef={canvasRef}
              photoBg={photoBg}
              photoBgOpacity={photoBgOpacity}
            />
          </div>

          <p style={{ fontSize: 10, color: '#1e293b', textAlign: 'center' }}>Click an element to select · Drag to reposition · Export at 2×</p>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid #1e293b' }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ flex: 1, padding: '10px 4px', background: activeTab === tab.id ? '#0f172a' : 'transparent', border: 'none', borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent', color: activeTab === tab.id ? '#f1f5f9' : '#475569', fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 14 }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 20px' }}>
            {activeTab === 'content'  && <ContentPanel  layers={layers} onLayerContent={setLayerContent} />}
            {activeTab === 'assets'   && <AssetsPanel   layers={layers} onLogoUpload={setLogo} onPhotoUpload={setPhoto} onLayerToggle={toggleLayer} onLayerDelete={deleteLayer} onClearLogo={clearLogo} onClearPhoto={clearPhoto} photoBg={photoBg} onPhotoBgToggle={() => setPhotoBg(v => !v)} photoBgOpacity={photoBgOpacity} onPhotoBgOpacity={setPhotoBgOpacity} />}
            {activeTab === 'palette'  && <PalettePanel  palette={palette} onChange={setPalette} />}
            {activeTab === 'business' && <BusinessPanel business={business} onChange={setBusiness} />}
          </div>
        </div>
      </div>
    </div>
  );
}