// frontend/src/components/DesignTemplates.jsx
// Design Templates — pick a template, auto-fill content, export as PNG
// Uses html2canvas (install: npm install html2canvas)

import { useState, useRef, useEffect } from 'react';

// ── Template definitions ──────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'instagram_post',
    name: 'Instagram Post',
    icon: '◈',
    platform: 'Instagram',
    width: 400, height: 400,
    description: '1:1 square',
  },
  {
    id: 'instagram_story',
    name: 'Instagram Story',
    icon: '◈',
    platform: 'Instagram',
    width: 225, height: 400,
    description: '9:16 vertical',
  },
  {
    id: 'youtube_thumb',
    name: 'YouTube Thumbnail',
    icon: '▶',
    platform: 'YouTube',
    width: 400, height: 225,
    description: '16:9 landscape',
  },
  {
    id: 'twitter_post',
    name: 'Twitter / X Post',
    icon: '✕',
    platform: 'Twitter',
    width: 400, height: 225,
    description: '16:9 landscape',
  },
  {
    id: 'banner_ad',
    name: 'Banner Ad',
    icon: '◻',
    platform: 'Web',
    width: 400, height: 150,
    description: 'Leaderboard',
  },
  {
    id: 'flyer',
    name: 'Flyer / Poster',
    icon: '❐',
    platform: 'Print',
    width: 280, height: 400,
    description: 'A5 portrait',
  },
];

const THEMES = [
  { id: 'emerald',  label: 'Emerald',  bg: '#0a1a14', accent: '#10b981', text: '#f0fdf4', sub: '#6ee7b7' },
  { id: 'midnight', label: 'Midnight', bg: '#0f172a', accent: '#6366f1', text: '#f8fafc', sub: '#a5b4fc' },
  { id: 'amber',    label: 'Amber',    bg: '#1c0f00', accent: '#f59e0b', text: '#fffbeb', sub: '#fcd34d' },
  { id: 'rose',     label: 'Rose',     bg: '#1a0010', accent: '#f43f5e', text: '#fff1f2', sub: '#fda4af' },
  { id: 'ocean',    label: 'Ocean',    bg: '#030d1a', accent: '#0ea5e9', text: '#f0f9ff', sub: '#7dd3fc' },
  { id: 'pure',     label: 'White',    bg: '#ffffff', accent: '#111827', text: '#111827', sub: '#4b5563' },
];

// Extract the most relevant content snippet from generated content
function extractSnippet(generatedContent, templateId) {
  if (!generatedContent || generatedContent.length === 0) return null;

  const preferredFormats = {
    instagram_post:  ['INSTAGRAM_CAPTION', 'INSTAGRAM_POST', 'SOCIAL_POST'],
    instagram_story: ['INSTAGRAM_STORY', 'INSTAGRAM_CAPTION', 'SOCIAL_POST'],
    youtube_thumb:   ['YOUTUBE_TITLE', 'YOUTUBE_DESCRIPTION', 'VIDEO_SCRIPT'],
    twitter_post:    ['TWITTER_POST', 'SOCIAL_POST', 'INSTAGRAM_CAPTION'],
    banner_ad:       ['BANNER_AD', 'GOOGLE_SEARCH_AD', 'TAGLINE'],
    flyer:           ['FLYER_TEXT', 'PRINT_AD', 'EMAIL_SUBJECT'],
  };

  const preferred = preferredFormats[templateId] || [];
  let match = null;
  for (const fmt of preferred) {
    match = generatedContent.find(i => i.format === fmt);
    if (match) break;
  }
  if (!match) match = generatedContent[0];

  // Pull first 2 sentences / 120 chars as headline, rest as body
  const raw = match?.content || '';
  const clean = raw.replace(/#+\s*/g, '').replace(/\*\*/g, '').replace(/\*/g, '').trim();
  const sentences = clean.match(/[^.!?\n]+[.!?\n]*/g) || [clean];
  const headline = sentences[0]?.trim().slice(0, 80) || '';
  const body = sentences.slice(1, 3).join(' ').trim().slice(0, 140) || '';
  return { headline, body, format: match?.format };
}

// ── Template renderer ─────────────────────────────────────────────────────────
function TemplateCanvas({ template, theme, headline, body, brandName, tagline, logoText, imageUrl }) {
  const { width, height } = template;
  const t = theme;
  const isTall = height > width;
  const isWide = width > height * 1.5;
  const isSquare = Math.abs(width - height) < 60;

  const containerStyle = {
    width, height,
    background: t.bg,
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Inter', -apple-system, sans-serif",
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    boxSizing: 'border-box',
  };

  const headlineSz = isWide ? 18 : isTall ? 20 : isSquare ? 22 : 16;
  const bodySz     = isWide ? 11 : 12;

  return (
    <div style={containerStyle} data-template-canvas="true">

      {/* Background image if provided */}
      {imageUrl && (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.35 }} />
      )}

      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg, ${t.bg}ee 0%, ${t.bg}55 50%, ${t.bg}ee 100%)` }} />

      {/* Accent shape */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: t.accent, opacity: 0.12 }} />
      <div style={{ position: 'absolute', top: 10, right: 10, width: 60, height: 3, background: t.accent, borderRadius: 2 }} />

      {/* Brand badge */}
      <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: t.bg }}>
          {logoText ? logoText.charAt(0).toUpperCase() : 'I'}
        </div>
        {brandName && <span style={{ fontSize: 10, fontWeight: 700, color: t.sub, letterSpacing: '0.04em' }}>{brandName}</span>}
      </div>

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 2, padding: isWide ? '14px 20px' : '20px', paddingTop: 4 }}>

        {tagline && (
          <div style={{ fontSize: 9, fontWeight: 800, color: t.accent, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6, opacity: 0.9 }}>
            {tagline}
          </div>
        )}

        <div style={{ fontSize: headlineSz, fontWeight: 900, color: t.text, lineHeight: 1.2, marginBottom: 8, letterSpacing: '-0.01em' }}>
          {headline || 'Your headline here'}
        </div>

        {body && !isWide && (
          <div style={{ fontSize: bodySz, color: t.sub, lineHeight: 1.5, marginBottom: 10, opacity: 0.85 }}>
            {body}
          </div>
        )}

        {/* CTA bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <div style={{ height: 2, flex: 1, background: `linear-gradient(90deg, ${t.accent}, transparent)`, borderRadius: 2 }} />
          <div style={{ marginLeft: 10, fontSize: 9, fontWeight: 700, color: t.accent, letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>
            ivey.app
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Editor panel ──────────────────────────────────────────────────────────────
function EditorPanel({ fields, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[
        { key: 'headline', label: 'Headline', multiline: true, rows: 2 },
        { key: 'body',     label: 'Body text', multiline: true, rows: 3 },
        { key: 'brandName',label: 'Brand name', multiline: false },
        { key: 'tagline',  label: 'Tagline / category', multiline: false },
        { key: 'logoText', label: 'Logo letter', multiline: false },
      ].map(({ key, label, multiline, rows }) => (
        <div key={key}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>{label}</label>
          {multiline
            ? <textarea value={fields[key] || ''} onChange={e => onChange(key, e.target.value)} rows={rows} style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#f1f5f9', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            : <input value={fields[key] || ''} onChange={e => onChange(key, e.target.value)} style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }} />
          }
        </div>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DesignTemplates({ generatedContent, campaignName, imageUrl }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedTheme, setSelectedTheme]       = useState(THEMES[0]);
  const [exporting, setExporting]               = useState(false);
  const [exported, setExported]                 = useState(false);
  const [fields, setFields]                     = useState({ headline: '', body: '', brandName: campaignName || '', tagline: '', logoText: '' });
  const canvasRef = useRef(null);

  // Auto-fill when template selected
  useEffect(() => {
    if (!selectedTemplate) return;
    const snippet = extractSnippet(generatedContent, selectedTemplate.id);
    if (snippet) {
      setFields(f => ({
        ...f,
        headline: snippet.headline || f.headline,
        body:     snippet.body     || f.body,
      }));
    }
  }, [selectedTemplate]);

  const handleField = (key, val) => setFields(f => ({ ...f, [key]: val }));

  const handleExport = async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.esm.js')).default;
      const canvas = await html2canvas(canvasRef.current, { scale: 2, useCORS: true, backgroundColor: null });
      const link = document.createElement('a');
      link.download = `ivey-${selectedTemplate.id}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setExported(true);
      setTimeout(() => setExported(false), 2500);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (!selectedTemplate) {
    // ── Template picker ──
    return (
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, overflow: 'hidden', marginTop: 24 }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🎨</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9' }}>Design Templates</div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>Pick a format — your content auto-fills</div>
          </div>
        </div>
        <div style={{ padding: '18px 22px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => setSelectedTemplate(t)}
                style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '14px 12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = '#1e2a3a'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.background = '#1e293b'; }}
              >
                <div style={{ fontSize: 22, marginBottom: 8 }}>{t.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', marginBottom: 3 }}>{t.name}</div>
                <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 600, marginBottom: 2 }}>{t.platform}</div>
                <div style={{ fontSize: 10, color: '#475569' }}>{t.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Editor view ──
  return (
    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, overflow: 'hidden', marginTop: 24 }}>

      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setSelectedTemplate(null)} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '5px 10px', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>← Templates</button>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{selectedTemplate.name}</span>
          <span style={{ fontSize: 10, color: '#475569' }}>{selectedTemplate.description}</span>
        </div>
        <button onClick={handleExport} disabled={exporting}
          style={{ padding: '8px 18px', borderRadius: 10, background: exported ? '#10b981' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: exporting ? 'not-allowed' : 'pointer', opacity: exporting ? 0.7 : 1, transition: 'all 0.2s' }}>
          {exporting ? '⏳ Exporting...' : exported ? '✅ Downloaded!' : '⬇️ Export PNG'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 0 }}>

        {/* Preview area */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, borderRight: '1px solid #1e293b', background: '#080f1a' }}>

          {/* Theme picker */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {THEMES.map(th => (
              <button key={th.id} onClick={() => setSelectedTheme(th)} title={th.label}
                style={{ width: 22, height: 22, borderRadius: '50%', background: th.accent, border: selectedTheme.id === th.id ? '2px solid #f1f5f9' : '2px solid transparent', cursor: 'pointer', transition: 'transform 0.15s', transform: selectedTheme.id === th.id ? 'scale(1.25)' : 'scale(1)' }}
              />
            ))}
          </div>

          {/* Canvas preview */}
          <div ref={canvasRef} style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.6)', borderRadius: 4 }}>
            <TemplateCanvas
              template={selectedTemplate}
              theme={selectedTheme}
              headline={fields.headline}
              body={fields.body}
              brandName={fields.brandName}
              tagline={fields.tagline}
              logoText={fields.logoText}
              imageUrl={imageUrl}
            />
          </div>

          <p style={{ fontSize: 10, color: '#334155', textAlign: 'center' }}>
            Preview at {selectedTemplate.width}×{selectedTemplate.height}px · Exported at 2×
          </p>
        </div>

        {/* Editor sidebar */}
        <div style={{ padding: 18, overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Edit Content</div>
          <EditorPanel fields={fields} onChange={handleField} />

          <div style={{ marginTop: 16, padding: '10px 12px', background: '#1e293b', borderRadius: 10, fontSize: 10, color: '#475569', lineHeight: 1.6 }}>
            💡 Content was auto-filled from your generated campaign. Edit freely above.
          </div>
        </div>
      </div>
    </div>
  );
}