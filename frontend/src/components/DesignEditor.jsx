// frontend/src/components/DesignEditor.jsx
// Rebuilt: template-first design system, brand-aware, content-smart
// Requires: npm install html2canvas (in /frontend)

import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

// ── Content extractor ─────────────────────────────────────────────────────────
function extractContent(generatedContent, hint) {
  if (!generatedContent?.length) return { headline: '', body: '', cta: 'Learn More' };
  const priorities = {
    instagram: ['INSTAGRAM_CAPTION', 'FACEBOOK_POST', 'TWITTER_POST'],
    story:     ['INSTAGRAM_CAPTION', 'TIKTOK', 'TWITTER_POST'],
    youtube:   ['YOUTUBE_VIDEO_AD', 'YOUTUBE_SHORTS', 'INSTAGRAM_CAPTION'],
    twitter:   ['TWITTER_POST', 'INSTAGRAM_CAPTION', 'LINKEDIN_POST'],
    banner:    ['BANNER_AD', 'GOOGLE_SEARCH_AD', 'INSTAGRAM_CAPTION'],
    flyer:     ['FLYER_TEXT', 'PRINT_AD', 'INSTAGRAM_CAPTION'],
    facebook:  ['FACEBOOK_POST', 'INSTAGRAM_CAPTION', 'LINKEDIN_POST'],
    linkedin:  ['LINKEDIN_POST', 'FACEBOOK_POST', 'INSTAGRAM_CAPTION'],
    email:     ['EMAIL_MARKETING', 'INSTAGRAM_CAPTION', 'FACEBOOK_POST'],
    print:     ['PRINT_AD', 'FLYER_TEXT', 'BANNER_AD'],
  };
  const order = priorities[hint] || priorities.instagram;
  let match = null;
  for (const fmt of order) { match = generatedContent.find(i => i.format === fmt); if (match) break; }
  if (!match) match = generatedContent[0];
  const raw = (match?.content || '')
    .replace(/#{1,6}\s*/g, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
    .replace(/>\s*/g, '').replace(/---+/g, '').replace(/\[\s*.*?\s*\]/g, '').trim();
  const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 8 && !l.startsWith('http'));
  return { headline: (lines[0] || '').slice(0, 80), body: lines.slice(1, 3).join(' ').slice(0, 160), cta: 'Learn More' };
}

function isLight(hex) {
  if (!hex || hex.length < 4) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

// ── Palettes ──────────────────────────────────────────────────────────────────
const PALETTES = [
  { id: 'midnight', name: 'Midnight',  bg: '#0c1220', accent: '#6366f1', text: '#f8fafc', sub: '#a5b4fc' },
  { id: 'noir',     name: 'Noir',      bg: '#0a0a0a', accent: '#ffffff', text: '#ffffff', sub: '#888888' },
  { id: 'forest',   name: 'Forest',    bg: '#0d1f0f', accent: '#22c55e', text: '#f0fdf4', sub: '#86efac' },
  { id: 'ocean',    name: 'Ocean',     bg: '#020d1a', accent: '#38bdf8', text: '#f0f9ff', sub: '#7dd3fc' },
  { id: 'ember',    name: 'Ember',     bg: '#130800', accent: '#f97316', text: '#fff7ed', sub: '#fdba74' },
  { id: 'violet',   name: 'Violet',    bg: '#0d0520', accent: '#a855f7', text: '#faf5ff', sub: '#d8b4fe' },
  { id: 'rose',     name: 'Rose',      bg: '#18030d', accent: '#f43f5e', text: '#fff1f2', sub: '#fda4af' },
  { id: 'gold',     name: 'Gold',      bg: '#0f0900', accent: '#eab308', text: '#fefce8', sub: '#fde047' },
  { id: 'arctic',   name: 'Arctic',    bg: '#f8fafc', accent: '#0ea5e9', text: '#0f172a', sub: '#475569' },
  { id: 'cream',    name: 'Cream',     bg: '#fdf6ec', accent: '#92400e', text: '#1c0a00', sub: '#78350f' },
  { id: 'concrete', name: 'Concrete',  bg: '#f1f5f9', accent: '#111827', text: '#111827', sub: '#4b5563' },
  { id: 'teal',     name: 'Teal',      bg: '#011a18', accent: '#14b8a6', text: '#f0fdfa', sub: '#5eead4' },
];

// ── Templates ─────────────────────────────────────────────────────────────────
const TEMPLATES = [
  { id: 'instagram', name: 'Instagram Post',   w: 400, h: 400, aspect: '1:1',    hint: 'instagram' },
  { id: 'story',     name: 'Story / Reel',     w: 225, h: 400, aspect: '9:16',   hint: 'story'     },
  { id: 'youtube',   name: 'YT Thumbnail',     w: 400, h: 225, aspect: '16:9',   hint: 'youtube'   },
  { id: 'twitter',   name: 'Twitter / X',      w: 400, h: 225, aspect: '16:9',   hint: 'twitter'   },
  { id: 'linkedin',  name: 'LinkedIn Post',    w: 400, h: 300, aspect: '4:3',    hint: 'linkedin'  },
  { id: 'facebook',  name: 'Facebook Post',    w: 400, h: 210, aspect: '1.91:1', hint: 'facebook'  },
  { id: 'banner',    name: 'Banner Ad',        w: 400, h: 150, aspect: '728×90', hint: 'banner'    },
  { id: 'flyer',     name: 'Flyer / Print',    w: 280, h: 400, aspect: 'A5',     hint: 'flyer'     },
  { id: 'email',     name: 'Email Header',     w: 400, h: 160, aspect: '2.5:1',  hint: 'email'     },
];

const TEMPLATE_LAYOUTS = {
  instagram: ['magazine', 'fullbleed', 'bold'],
  story:     ['fullbleed', 'bold', 'magazine'],
  youtube:   ['bold', 'minimal', 'fullbleed'],
  twitter:   ['minimal', 'bold'],
  linkedin:  ['bold', 'minimal', 'magazine'],
  facebook:  ['bold', 'fullbleed', 'minimal'],
  banner:    ['minimal', 'bold'],
  flyer:     ['magazine', 'bold', 'fullbleed'],
  email:     ['minimal', 'bold'],
};

const LAYOUT_LABELS = { bold: 'Split', fullbleed: 'Full Bleed', minimal: 'Minimal', magazine: 'Magazine' };

// ── Template renders ──────────────────────────────────────────────────────────
function TemplateBold({ d, p, photo, logo }) {
  const { w, h } = d.tpl;
  const isWide = w > h;
  return (
    <div style={{ width: w, height: h, background: p.bg, position: 'relative', overflow: 'hidden', fontFamily: "'DM Sans','Segoe UI',sans-serif", display: 'flex' }}>
      <div style={{ flex: 1, padding: isWide ? '20px 24px' : '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {logo ? <img src={logo} style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain' }} />
            : <div style={{ width: 28, height: 28, borderRadius: 6, background: p.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: p.bg }}>{(d.brandName||'I')[0]}</div>}
          <span style={{ fontSize: 10, fontWeight: 800, color: p.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{d.brandName||'Brand'}</span>
        </div>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: p.accent, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6, opacity: 0.8 }}>{d.badge||'Marketing'}</div>
          <div style={{ fontSize: isWide ? 16 : 22, fontWeight: 900, color: p.text, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 8 }}>{d.headline||'Your headline here'}</div>
          {!isWide && <div style={{ fontSize: 11, color: p.sub, lineHeight: 1.6 }}>{d.body}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ padding: '6px 14px', borderRadius: 20, background: p.accent, fontSize: 10, fontWeight: 800, color: p.bg }}>{d.cta||'Learn More'}</div>
          {d.website && <span style={{ fontSize: 9, color: p.sub, opacity: 0.6 }}>{d.website}</span>}
        </div>
      </div>
      {photo
        ? <div style={{ width: isWide ? '45%' : '40%', position: 'relative', flexShrink: 0 }}>
            <img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to right, ${p.bg}, transparent)` }} />
          </div>
        : <div style={{ width: isWide ? '38%' : '33%', background: p.accent+'15', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 28, opacity: 0.12 }}>📸</span>
          </div>}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: p.accent }} />
    </div>
  );
}

function TemplateFullBleed({ d, p, photo, logo }) {
  const { w, h } = d.tpl;
  return (
    <div style={{ width: w, height: h, position: 'relative', overflow: 'hidden', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      {photo
        ? <img src={photo} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${p.bg} 0%, ${p.accent}50 100%)` }} />}
      <div style={{ position: 'absolute', inset: 0, background: photo ? `linear-gradient(to top, ${p.bg}f2 0%, ${p.bg}88 55%, transparent 100%)` : 'transparent' }} />
      <div style={{ position: 'absolute', inset: 0, padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {logo ? <img src={logo} style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'contain', background: 'rgba(255,255,255,0.1)', padding: 2 }} />
            : <div style={{ width: 30, height: 30, borderRadius: 8, background: p.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: p.bg }}>{(d.brandName||'I')[0]}</div>}
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>{d.brandName||'Brand'}</span>
        </div>
        <div>
          <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, background: p.accent, fontSize: 9, fontWeight: 800, color: p.bg, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{d.badge||'Marketing'}</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 6, textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>{d.headline||'Your headline here'}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5, marginBottom: 12 }}>{d.body}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: '6px 16px', borderRadius: 20, background: p.accent, fontSize: 10, fontWeight: 800, color: p.bg }}>{d.cta||'Learn More'}</div>
            {d.website && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>{d.website}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateMinimal({ d, p, photo, logo }) {
  const { w, h } = d.tpl;
  const isWide = w > h * 1.5;
  return (
    <div style={{ width: w, height: h, background: p.bg, position: 'relative', overflow: 'hidden', fontFamily: "'DM Sans','Segoe UI',sans-serif", padding: isWide ? '18px 22px' : '16px 20px', boxSizing: 'border-box', display: 'flex', flexDirection: isWide ? 'row' : 'column', alignItems: isWide ? 'center' : 'flex-start', gap: isWide ? 20 : 0, justifyContent: 'space-between' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: p.accent }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {logo ? <img src={logo} style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6 }} />
          : <div style={{ width: 32, height: 32, borderRadius: 6, background: p.accent+'20', border: `1.5px solid ${p.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: p.accent }}>{(d.brandName||'I')[0]}</div>}
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: p.text, letterSpacing: '0.05em' }}>{d.brandName||'Brand'}</div>
          {d.tagline && <div style={{ fontSize: 9, color: p.sub, marginTop: 1 }}>{d.tagline}</div>}
        </div>
      </div>
      {isWide
        ? <div style={{ flex: 1, padding: '0 20px' }}><div style={{ fontSize: 15, fontWeight: 900, color: p.text, lineHeight: 1.2, letterSpacing: '-0.01em' }}>{d.headline||'Your headline'}</div></div>
        : <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: p.accent, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 5 }}>{d.badge||'Marketing'}</div>
            <div style={{ fontSize: 19, fontWeight: 900, color: p.text, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 6 }}>{d.headline||'Your headline'}</div>
            <div style={{ fontSize: 11, color: p.sub, lineHeight: 1.55 }}>{d.body}</div>
          </div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ padding: '6px 14px', borderRadius: 6, background: p.accent, fontSize: 10, fontWeight: 800, color: p.bg }}>{d.cta||'Learn More'}</div>
        {isWide && d.website && <span style={{ fontSize: 9, color: p.sub }}>{d.website}</span>}
      </div>
    </div>
  );
}

function TemplateMagazine({ d, p, photo, logo }) {
  const { w, h } = d.tpl;
  return (
    <div style={{ width: w, height: h, background: p.bg, position: 'relative', overflow: 'hidden', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <div style={{ height: '52%', position: 'relative', overflow: 'hidden' }}>
        {photo
          ? <img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${p.accent}30, ${p.accent}10)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 36, opacity: 0.15 }}>📸</span></div>}
        <div style={{ position: 'absolute', top: 12, left: 14 }}>
          <div style={{ padding: '3px 10px', borderRadius: 20, background: p.accent, fontSize: 9, fontWeight: 800, color: p.bg, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{d.badge||'Marketing'}</div>
        </div>
      </div>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '48%', boxSizing: 'border-box' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 900, color: p.text, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 5 }}>{d.headline||'Your headline'}</div>
          <div style={{ fontSize: 10, color: p.sub, lineHeight: 1.5 }}>{d.body}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {logo ? <img src={logo} style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'contain' }} />
              : <div style={{ width: 22, height: 22, borderRadius: 5, background: p.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: p.bg }}>{(d.brandName||'I')[0]}</div>}
            <span style={{ fontSize: 9, fontWeight: 700, color: p.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d.brandName||'Brand'}</span>
          </div>
          <div style={{ padding: '5px 13px', borderRadius: 20, background: p.accent, fontSize: 9, fontWeight: 800, color: p.bg }}>{d.cta||'Learn More'}</div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: p.accent }} />
    </div>
  );
}

function RenderTemplate({ layoutId, d, p, photo, logo }) {
  const props = { d, p, photo, logo };
  switch (layoutId) {
    case 'bold':      return <TemplateBold      {...props} />;
    case 'fullbleed': return <TemplateFullBleed {...props} />;
    case 'minimal':   return <TemplateMinimal   {...props} />;
    case 'magazine':  return <TemplateMagazine  {...props} />;
    default:          return <TemplateBold      {...props} />;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DesignEditor({ generatedContent, campaignName }) {
  const [step,        setStep]        = useState('pick');
  const [template,    setTemplate]    = useState(null);
  const [layout,      setLayout]      = useState('bold');
  const [paletteId,   setPaletteId]   = useState('midnight');
  const [brandPalette,setBrandPalette]= useState(null);
  const [photo,       setPhoto]       = useState(null);
  const [logo,        setLogo]        = useState(null);
  const [exporting,   setExporting]   = useState(false);
  const [exported,    setExported]    = useState(false);
  const [data, setData] = useState({ brandName: campaignName||'', tagline:'', badge:'Marketing', headline:'', body:'', cta:'Learn More', website:'' });
  const canvasRef = useRef(null);
  const photoRef  = useRef(null);
  const logoRef   = useRef(null);

  // Load default brand profile
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE}/brand/default`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(res => {
        const brand = res.brand;
        if (!brand) return;
        const colors = brand.brand_colors || [];
        if (colors.length >= 2) {
          const bg = colors[0], accent = colors[1];
          setBrandPalette({ id: 'brand', name: `${brand.brand_name} Colors`, bg, accent, text: isLight(bg) ? '#0f172a' : '#f8fafc', sub: isLight(bg) ? '#475569' : '#94a3b8' });
        }
        setData(prev => ({ ...prev, brandName: brand.brand_name||prev.brandName, tagline: brand.tagline||prev.tagline, badge: brand.industry||prev.badge }));
      }).catch(() => {});
  }, []);

  const activePalette = paletteId === 'brand' && brandPalette ? brandPalette : (PALETTES.find(p => p.id === paletteId) || PALETTES[0]);

  const pickTemplate = (tmpl) => {
    setTemplate(tmpl);
    const layouts = TEMPLATE_LAYOUTS[tmpl.id] || ['bold'];
    setLayout(layouts[0]);
    const extracted = extractContent(generatedContent, tmpl.hint);
    setData(prev => ({ ...prev, headline: extracted.headline||prev.headline, body: extracted.body||prev.body, cta: 'Learn More' }));
    setPhoto(null);
    setExported(false);
    setStep('edit');
  };

  const handleFile = (e, setter) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setter(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleExport = async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    await new Promise(r => setTimeout(r, 60));
    try {
      const canvas = await html2canvas(canvasRef.current, { scale: 2, useCORS: true, backgroundColor: activePalette.bg, logging: false, allowTaint: true });
      const link = document.createElement('a');
      link.download = `ivey-${template.id}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (e) { console.error('Export failed:', e); }
    finally { setExporting(false); }
  };

  // ── Template picker ──────────────────────────────────────────────────────────
  if (step === 'pick') return (
    <div style={{ background: '#080e1a', border: '1px solid #1e293b', borderRadius: 16, overflow: 'hidden', marginTop: 24 }}>
      <div style={{ padding: '18px 22px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🎨</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9' }}>Design Studio</div>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>Turn your generated content into a ready-to-post visual</div>
        </div>
      </div>
      <div style={{ padding: '20px 22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
        {TEMPLATES.map(t => (
          <button key={t.id} onClick={() => pickTemplate(t)}
            style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '16px 14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s', outline: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = '#111827'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
              <div style={{ width: Math.min(56, 56*t.w/Math.max(t.w,t.h)), height: Math.min(56, 56*t.h/Math.max(t.w,t.h)), background: 'linear-gradient(135deg,#1e293b,#334155)', borderRadius: 4, border: '1px solid #334155' }} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>{t.name}</div>
            <div style={{ fontSize: 9, color: '#6366f1', fontWeight: 600 }}>{t.aspect}</div>
          </button>
        ))}
      </div>
    </div>
  );

  // ── Editor ───────────────────────────────────────────────────────────────────
  const layouts = TEMPLATE_LAYOUTS[template.id] || ['bold'];
  const templateData = { ...data, tpl: template };

  return (
    <div style={{ background: '#080e1a', border: '1px solid #1e293b', borderRadius: 16, overflow: 'hidden', marginTop: 24 }}>
      {/* Top bar */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setStep('pick')} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 7, padding: '5px 12px', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>← Templates</button>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{template.name}</span>
          <span style={{ fontSize: 10, color: '#475569' }}>{template.w}×{template.h}px</span>
        </div>
        <button onClick={handleExport} disabled={exporting}
          style={{ padding: '7px 18px', borderRadius: 8, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: exporting ? 'not-allowed' : 'pointer', background: exported ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', opacity: exporting ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 0 20px rgba(99,102,241,0.25)' }}>
          {exporting ? '⏳ Exporting...' : exported ? '✅ Downloaded!' : '⬇ Export PNG'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', minHeight: 500 }}>
        {/* Canvas */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, background: '#04080f', borderRight: '1px solid #1e293b' }}>
          {/* Layout switcher */}
          {layouts.length > 1 && (
            <div style={{ display: 'flex', gap: 6 }}>
              {layouts.map(l => (
                <button key={l} onClick={() => setLayout(l)}
                  style={{ padding: '5px 12px', borderRadius: 20, fontSize: 10, fontWeight: 700, cursor: 'pointer', border: `1px solid ${layout===l?'#6366f1':'#1e293b'}`, background: layout===l?'#6366f1':'transparent', color: layout===l?'#fff':'#475569', transition: 'all 0.15s' }}>
                  {LAYOUT_LABELS[l]||l}
                </button>
              ))}
            </div>
          )}
          {/* Canvas render */}
          <div ref={canvasRef} style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.8)', borderRadius: 4, flexShrink: 0 }}>
            <RenderTemplate layoutId={layout} d={templateData} p={activePalette} photo={photo} logo={logo} />
          </div>
          {/* Palette dots */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 420 }}>
            {brandPalette && (
              <button onClick={() => setPaletteId('brand')} title={brandPalette.name}
                style={{ width: 22, height: 22, borderRadius: '50%', background: brandPalette.accent, border: paletteId==='brand'?'3px solid #f1f5f9':'2px solid transparent', cursor: 'pointer', transform: paletteId==='brand'?'scale(1.3)':'scale(1)', transition: 'all 0.15s', outline: 'none', flexShrink: 0 }} />
            )}
            {PALETTES.map(pp => (
              <button key={pp.id} onClick={() => setPaletteId(pp.id)} title={pp.name}
                style={{ width: 22, height: 22, borderRadius: '50%', background: pp.accent, border: paletteId===pp.id?'3px solid #f1f5f9':'2px solid transparent', cursor: 'pointer', transform: paletteId===pp.id?'scale(1.3)':'scale(1)', transition: 'all 0.15s', outline: 'none', flexShrink: 0 }} />
            ))}
          </div>
          <p style={{ fontSize: 10, color: '#1e293b', textAlign: 'center' }}>Switch layouts above · Change colors with the dots · Export at 2×</p>
        </div>

        {/* Sidebar */}
        <div style={{ overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Photos */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #1e293b' }}>Photos & Logo</div>
            {/* Product photo */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>Product Photo</div>
              <div onClick={() => photoRef.current.click()}
                style={{ width: '100%', height: 76, borderRadius: 8, background: '#0f172a', border: '1px dashed #334155', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                {photo ? <img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 11, color: '#334155' }}>Click to upload</span>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => photoRef.current.click()} style={{ flex: 1, padding: '6px', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', fontSize: 10, cursor: 'pointer' }}>{photo?'🔄 Replace':'📸 Upload'}</button>
                {photo && <button onClick={() => setPhoto(null)} style={{ padding: '6px 10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, color: '#ef4444', fontSize: 10, cursor: 'pointer' }}>✕</button>}
              </div>
              <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e, setPhoto)} />
            </div>
            {/* Logo */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>Logo</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, background: '#0f172a', border: '1px solid #1e293b', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {logo ? <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 20, opacity: 0.1 }}>🏷</span>}
                </div>
                <button onClick={() => logoRef.current.click()} style={{ flex: 1, padding: '8px', background: '#1e293b', border: '1px dashed #334155', borderRadius: 6, color: '#94a3b8', fontSize: 10, cursor: 'pointer' }}>{logo?'Replace Logo':'Upload Logo'}</button>
                {logo && <button onClick={() => setLogo(null)} style={{ padding: '8px 10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, color: '#ef4444', fontSize: 10, cursor: 'pointer' }}>✕</button>}
              </div>
              <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e, setLogo)} />
            </div>
          </div>

          {/* Text */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #1e293b' }}>Text Content</div>
            {[
              { k: 'brandName', label: 'Brand Name',      rows: 1 },
              { k: 'tagline',   label: 'Tagline',          rows: 1 },
              { k: 'badge',     label: 'Badge / Category', rows: 1 },
              { k: 'headline',  label: 'Headline',         rows: 2 },
              { k: 'body',      label: 'Body Text',        rows: 3 },
              { k: 'cta',       label: 'CTA Button',       rows: 1 },
              { k: 'website',   label: 'Website',          rows: 1 },
            ].map(({ k, label, rows }) => (
              <div key={k} style={{ marginBottom: 9 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
                <textarea value={data[k]||''} onChange={e => setData(p => ({ ...p, [k]: e.target.value }))} rows={rows}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 7, padding: '7px 10px', fontSize: 11, color: '#f1f5f9', outline: 'none', resize: rows>1?'vertical':'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5, transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = '#1e293b'}
                />
              </div>
            ))}
          </div>

          {/* Active palette info */}
          <div style={{ padding: '10px 12px', background: '#0f172a', borderRadius: 10, border: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: activePalette.bg, border: `2px solid ${activePalette.accent}`, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#f1f5f9' }}>{activePalette.name}</div>
              <div style={{ fontSize: 9, color: '#475569', marginTop: 1 }}>Use dots above to change palette</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}