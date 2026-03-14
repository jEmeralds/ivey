// frontend/src/components/DesignTemplates.jsx
// Requires: npm install html2canvas  (run in /frontend)

import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

const TEMPLATES = [
  { id: 'instagram_post',  name: 'Instagram Post',      icon: '📸', platform: 'Instagram', width: 400, height: 400,  desc: '1:1 Square' },
  { id: 'instagram_story', name: 'Instagram Story',     icon: '📱', platform: 'Instagram', width: 225, height: 400,  desc: '9:16 Vertical' },
  { id: 'youtube_thumb',   name: 'YouTube Thumbnail',   icon: '▶️',  platform: 'YouTube',   width: 400, height: 225,  desc: '16:9 Landscape' },
  { id: 'twitter_post',    name: 'Twitter / X Post',    icon: '🐦', platform: 'Twitter',   width: 400, height: 225,  desc: '16:9 Landscape' },
  { id: 'banner_ad',       name: 'Banner Ad',           icon: '📢', platform: 'Web',       width: 400, height: 150,  desc: 'Leaderboard' },
  { id: 'flyer',           name: 'Flyer / Poster',      icon: '🗒️', platform: 'Print',     width: 280, height: 400,  desc: 'A5 Portrait' },
];

const THEMES = [
  { id: 'emerald',  label: 'Emerald',  bg: '#0a1a14', accent: '#10b981', text: '#f0fdf4', sub: '#6ee7b7' },
  { id: 'midnight', label: 'Midnight', bg: '#0f172a', accent: '#6366f1', text: '#f8fafc', sub: '#a5b4fc' },
  { id: 'amber',    label: 'Amber',    bg: '#1c0f00', accent: '#f59e0b', text: '#fffbeb', sub: '#fcd34d' },
  { id: 'rose',     label: 'Rose',     bg: '#1a0010', accent: '#f43f5e', text: '#fff1f2', sub: '#fda4af' },
  { id: 'ocean',    label: 'Ocean',    bg: '#030d1a', accent: '#0ea5e9', text: '#f0f9ff', sub: '#7dd3fc' },
  { id: 'white',    label: 'White',    bg: '#ffffff', accent: '#111827', text: '#111827', sub: '#4b5563' },
];

function extractSnippet(generatedContent, templateId) {
  if (!generatedContent || generatedContent.length === 0) return { headline: '', body: '' };
  const preferred = {
    instagram_post:  ['INSTAGRAM_CAPTION', 'INSTAGRAM_POST', 'SOCIAL_POST'],
    instagram_story: ['INSTAGRAM_STORY',   'INSTAGRAM_CAPTION'],
    youtube_thumb:   ['YOUTUBE_TITLE',     'YOUTUBE_DESCRIPTION', 'VIDEO_SCRIPT'],
    twitter_post:    ['TWITTER_POST',      'SOCIAL_POST', 'INSTAGRAM_CAPTION'],
    banner_ad:       ['BANNER_AD',         'GOOGLE_SEARCH_AD'],
    flyer:           ['FLYER_TEXT',        'PRINT_AD'],
  };
  const order = preferred[templateId] || [];
  let match = null;
  for (const fmt of order) { match = generatedContent.find(i => i.format === fmt); if (match) break; }
  if (!match) match = generatedContent[0];
  const raw = (match?.content || '').replace(/#+\s*/g, '').replace(/\*\*/g, '').replace(/\*/g, '').trim();
  const sentences = raw.match(/[^.!?\n]+[.!?\n]*/g) || [raw];
  return {
    headline: sentences[0]?.trim().slice(0, 80)  || '',
    body:     sentences.slice(1, 3).join(' ').trim().slice(0, 140) || '',
  };
}

// ── The actual design canvas (this gets screenshotted) ────────────────────────
function TemplateCanvas({ template, theme: t, headline, body, brandName, tagline, logoText }) {
  const { width, height } = template;
  const isWide   = width > height * 1.4;
  const isTall   = height > width * 1.3;
  const headlineSz = isWide ? 16 : isTall ? 21 : 20;

  return (
    <div style={{
      width, height,
      background: t.bg,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      boxSizing: 'border-box',
      flexShrink: 0,
    }}>
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: t.accent, opacity: 0.1 }} />
      <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: t.accent, opacity: 0.07 }} />

      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${t.accent}, transparent)` }} />

      {/* Brand badge top-left */}
      <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: t.bg, flexShrink: 0 }}>
          {(logoText || brandName || 'I').charAt(0).toUpperCase()}
        </div>
        {brandName && (
          <span style={{ fontSize: 10, fontWeight: 700, color: t.sub, letterSpacing: '0.05em' }}>
            {brandName.toUpperCase().slice(0, 18)}
          </span>
        )}
      </div>

      {/* Main text block */}
      <div style={{ position: 'relative', zIndex: 2, padding: isWide ? '12px 18px 14px' : '18px 18px 20px' }}>
        {tagline && (
          <div style={{ fontSize: 9, fontWeight: 800, color: t.accent, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 7, opacity: 0.9 }}>
            {tagline}
          </div>
        )}
        <div style={{ fontSize: headlineSz, fontWeight: 900, color: t.text, lineHeight: 1.22, marginBottom: body && !isWide ? 8 : 0, letterSpacing: '-0.01em' }}>
          {headline || 'Your headline here'}
        </div>
        {body && !isWide && (
          <div style={{ fontSize: 11, color: t.sub, lineHeight: 1.55, opacity: 0.85, marginBottom: 10 }}>
            {body}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <div style={{ height: 2, flex: 1, background: `linear-gradient(90deg, ${t.accent}, transparent)`, borderRadius: 2 }} />
          <span style={{ fontSize: 8, fontWeight: 700, color: t.accent, letterSpacing: '0.1em', textTransform: 'uppercase' }}>ivey.app</span>
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function DesignTemplates({ generatedContent, campaignName }) {
  const [selected,  setSelected]  = useState(null);
  const [theme,     setTheme]     = useState(THEMES[0]);
  const [exporting, setExporting] = useState(false);
  const [exported,  setExported]  = useState(false);
  const [fields,    setFields]    = useState({
    headline: '', body: '', brandName: campaignName || '', tagline: '', logoText: '',
  });
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!selected) return;
    const s = extractSnippet(generatedContent, selected.id);
    setFields(f => ({ ...f, headline: s.headline, body: s.body }));
  }, [selected]);

  const set = (k, v) => setFields(f => ({ ...f, [k]: v }));

  const handleExport = async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `ivey-${selected.id}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setExported(true);
      setTimeout(() => setExported(false), 2500);
    } catch (e) {
      console.error('Export error:', e);
      alert('Export failed — check console for details.');
    } finally {
      setExporting(false);
    }
  };

  // ── Template picker ──────────────────────────────────────────────────────────
  if (!selected) return (
    <div style={{ marginTop: 24, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '16px 22px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🎨</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9' }}>Design Templates</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>Turn your generated content into a ready-to-post graphic — export as PNG</div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: '18px 22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 12 }}>
        {TEMPLATES.map(t => (
          <button key={t.id} onClick={() => setSelected(t)}
            style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '16px 14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s', outline: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = '#1e2a42'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.background = '#1e293b'; }}
          >
            <div style={{ fontSize: 24, marginBottom: 10 }}>{t.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', marginBottom: 3 }}>{t.name}</div>
            <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 600, marginBottom: 2 }}>{t.platform}</div>
            <div style={{ fontSize: 10, color: '#475569' }}>{t.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );

  // ── Editor ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ marginTop: 24, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, overflow: 'hidden' }}>

      {/* Editor header */}
      <div style={{ padding: '12px 18px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setSelected(null)}
            style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '5px 12px', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
            ← Templates
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{selected.name}</span>
          <span style={{ fontSize: 11, color: '#475569' }}>{selected.desc}</span>
        </div>
        <button onClick={handleExport} disabled={exporting}
          style={{ padding: '8px 20px', borderRadius: 10, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: exporting ? 'not-allowed' : 'pointer', opacity: exporting ? 0.6 : 1, background: exported ? '#10b981' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', transition: 'all 0.2s' }}>
          {exporting ? '⏳ Exporting...' : exported ? '✅ Downloaded!' : '⬇️ Export PNG'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px' }}>

        {/* Preview */}
        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, borderRight: '1px solid #1e293b', background: '#080e1a' }}>

          {/* Theme dots */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {THEMES.map(th => (
              <button key={th.id} onClick={() => setTheme(th)} title={th.label}
                style={{ width: 22, height: 22, borderRadius: '50%', background: th.accent, border: theme.id === th.id ? '3px solid #f1f5f9' : '2px solid transparent', cursor: 'pointer', transition: 'transform 0.15s', transform: theme.id === th.id ? 'scale(1.3)' : 'scale(1)', outline: 'none' }} />
            ))}
          </div>

          {/* Canvas */}
          <div ref={canvasRef} style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.6)', borderRadius: 4, display: 'inline-block' }}>
            <TemplateCanvas
              template={selected}
              theme={theme}
              headline={fields.headline}
              body={fields.body}
              brandName={fields.brandName}
              tagline={fields.tagline}
              logoText={fields.logoText}
            />
          </div>

          <p style={{ fontSize: 10, color: '#334155', textAlign: 'center' }}>
            {selected.width}×{selected.height}px preview · Exports at 2×
          </p>
        </div>

        {/* Sidebar editor */}
        <div style={{ padding: 18, overflowY: 'auto', maxHeight: 520 }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Edit Content</p>

          {[
            { key: 'headline',  label: 'Headline',             multi: true,  rows: 2 },
            { key: 'body',      label: 'Body text',            multi: true,  rows: 3 },
            { key: 'brandName', label: 'Brand name',           multi: false },
            { key: 'tagline',   label: 'Tagline / category',   multi: false },
            { key: 'logoText',  label: 'Logo letter override', multi: false },
          ].map(({ key, label, multi, rows }) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>{label}</label>
              {multi
                ? <textarea value={fields[key] || ''} onChange={e => set(key, e.target.value)} rows={rows}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#f1f5f9', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                : <input value={fields[key] || ''} onChange={e => set(key, e.target.value)}
                    style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }} />
              }
            </div>
          ))}

          <div style={{ marginTop: 14, padding: '10px 12px', background: '#1e293b', borderRadius: 10, fontSize: 10, color: '#475569', lineHeight: 1.6 }}>
            💡 Content was auto-filled from your campaign. Edit freely, then export as PNG.
          </div>
        </div>
      </div>
    </div>
  );
}