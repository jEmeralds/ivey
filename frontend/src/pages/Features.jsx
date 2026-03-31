import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import GallerySection from '../components/GallerySection';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

const PLATFORM_META = {
  youtube:   { color: '#FF0000', label: 'YouTube',   icon: '▶' },
  tiktok:    { color: '#69C9D0', label: 'TikTok',    icon: '♫' },
  instagram: { color: '#E1306C', label: 'Instagram', icon: '◈' },
  facebook:  { color: '#1877F2', label: 'Facebook',  icon: 'f' },
  link:      { color: '#94a3b8', label: 'Link',       icon: '⬡' },
};

function getEmbedUrl(item) {
  const { platform, embed_id, url } = item;
  if (platform === 'youtube'   && embed_id) return `https://www.youtube.com/embed/${embed_id}?autoplay=1&rel=0`;
  if (platform === 'tiktok'    && embed_id) return `https://www.tiktok.com/embed/v2/${embed_id}`;
  if (platform === 'instagram' && embed_id) return `https://www.instagram.com/p/${embed_id}/embed/`;
  if (platform === 'facebook')              return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=true`;
  return null;
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
const Lightbox = ({ item, onClose }) => {
  const meta     = PLATFORM_META[item.platform] || PLATFORM_META.link;
  const embedUrl = getEmbedUrl(item);
  const thumb    = item.platform === 'youtube' && item.embed_id
    ? `https://img.youtube.com/vi/${item.embed_id}/hqdefault.jpg`
    : null;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl w-full max-w-2xl">
        {/* Close */}
        <button onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-gray-800/90 hover:bg-gray-700 border border-gray-600 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        {/* Platform badge */}
        <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-xs font-black text-gray-900 dark:text-white" style={{background: meta.color}}>
          {meta.label.toUpperCase()}
        </div>
        {/* Media */}
        <div className="relative w-full" style={{paddingTop:'56.25%', background:'#0f172a'}}>
          {embedUrl ? (
            <iframe src={embedUrl} className="absolute inset-0 w-full h-full border-none" allow="autoplay; fullscreen; encrypted-media" allowFullScreen/>
          ) : thumb ? (
            <img src={thumb} alt={item.caption} className="absolute inset-0 w-full h-full object-cover"/>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="text-5xl" style={{color: meta.color}}>{meta.icon}</div>
              <a href={item.url} target="_blank" rel="noreferrer" className="px-5 py-2 rounded-xl text-sm font-bold text-gray-900 dark:text-white border border-white/20 hover:bg-white/10 transition-all">Open Link ↗</a>
            </div>
          )}
        </div>
        {/* Info */}
        <div className="px-5 py-4">
          <p className="text-gray-900 dark:text-white font-semibold text-sm mb-1">{item.caption}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{item.brand_name}</span>
            <div className="flex items-center gap-3">
              {item.views !== '—' && <span className="text-xs text-gray-500">👁 {item.views}</span>}
              {item.likes !== '—' && <span className="text-xs text-gray-500">♥ {item.likes}</span>}
              {item.format && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">⚡ {item.format}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Gallery Mini Panel ───────────────────────────────────────────────────────
const GalleryMiniPanel = () => {
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/gallery`)
      .then(r => r.json())
      .then(d => { setItems(d.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const platforms = [...new Set(items.map(i => i.platform))];
  const filtered  = filter === 'all' ? items : items.filter(i => i.platform === filter);
  const displayed = filtered.slice(0, 6);

  return (
    <>
      {lightbox && <Lightbox item={lightbox} onClose={() => setLightbox(null)} />}

      <div className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700 bg-gray-900">
          <div className="w-3 h-3 rounded-full bg-red-500/70"/>
          <div className="w-3 h-3 rounded-full bg-yellow-500/70"/>
          <div className="w-3 h-3 rounded-full bg-green-500/70"/>
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-500">IVey — Gallery</span>
          <span className="ml-auto text-xs text-emerald-400 font-semibold">🏆 Community</span>
        </div>
        <div className="p-4 space-y-3">
          {/* Platform filters */}
          <div className="flex gap-1.5 flex-wrap">
            {['all', ...platforms].map(p => {
              const meta  = p === 'all' ? { color: '#10b981', label: 'All' } : PLATFORM_META[p];
              const count = p === 'all' ? items.length : items.filter(i => i.platform === p).length;
              const active = filter === p;
              return (
                <button key={p} onClick={() => setFilter(p)}
                  className="text-xs px-3 py-1 rounded-full border font-semibold transition-all"
                  style={{ borderColor: active ? meta.color+'80' : 'rgba(255,255,255,0.1)', background: active ? meta.color+'18' : 'transparent', color: active ? meta.color : '#6b7280' }}>
                  {meta?.label || p} ({count})
                </button>
              );
            })}
          </div>
          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-3 gap-2">
              {[...Array(6)].map((_,i) => <div key={i} className="aspect-video rounded-xl bg-gray-700 animate-pulse"/>)}
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No items yet</div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {displayed.map(item => {
                const meta  = PLATFORM_META[item.platform] || PLATFORM_META.link;
                const thumb = item.platform === 'youtube' && item.embed_id
                  ? `https://img.youtube.com/vi/${item.embed_id}/mqdefault.jpg`
                  : null;
                return (
                  <div key={item.id} onClick={() => setLightbox(item)}
                    className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group border border-white/5 hover:border-white/20 transition-all hover:-translate-y-0.5 hover:shadow-xl"
                    style={{background:'#0f172a'}}>
                    {thumb ? (
                      <img src={thumb} alt={item.caption} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"/>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{background: meta.color+'12'}}>
                        <span className="text-xl" style={{color: meta.color}}>{meta.icon}</span>
                        <span className="text-xs font-bold" style={{color: meta.color}}>{meta.label}</span>
                      </div>
                    )}
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-white font-black leading-none" style={{background: meta.color, fontSize:'8px'}}>
                      {meta.label.toUpperCase()}
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-1.5 px-2">
                      <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                      <p className="text-white text-xs font-semibold text-center leading-tight line-clamp-2">{item.caption}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-gray-600">{filtered.length} campaign{filtered.length !== 1 ? 's' : ''}</span>
            <Link to="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all">
              📤 Submit Yours
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Scroll-reveal hook ───────────────────────────────────────────────────────
const useReveal = (threshold = 0.15) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
};

// ─── Animated counter ─────────────────────────────────────────────────────────
const Counter = ({ to, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const [ref, visible] = useReveal(0.5);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const steps = 40;
    const inc = to / steps;
    const timer = setInterval(() => {
      start += inc;
      if (start >= to) { setCount(to); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 30);
    return () => clearInterval(timer);
  }, [visible, to]);
  return <span ref={ref}>{count}{suffix}</span>;
};

// ─── Feature data ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    id: 'ai',
    tag: 'Core Engine',
    headline: 'Generate viral content in seconds',
    sub: 'Describe your campaign once. IVey writes scroll-stopping content across 13+ formats — TikTok scripts, Instagram captions, email campaigns, banner ad copy, YouTube titles, Twitter threads, and more.',
    color: 'emerald',
    subpoints: [
      { label: 'AI-generated captions optimized per platform' },
      { label: 'Claude, GPT-4, Gemini & Grok supported' },
      { label: 'Brand voice baked into every output' },
    ],
    mockup: () => (
      <div className="w-full bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700 bg-gray-900">
          <div className="w-3 h-3 rounded-full bg-red-500/60"/>
          <div className="w-3 h-3 rounded-full bg-yellow-500/60"/>
          <div className="w-3 h-3 rounded-full bg-green-500/60"/>
          <span className="ml-3 text-xs text-gray-500 dark:text-gray-500">IVey — Generate Content</span>
        </div>
        <div className="p-5 space-y-4">
          {/* Format chips */}
          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">Select Formats</p>
            <div className="flex flex-wrap gap-1.5">
              {['TikTok Script','Instagram Caption','Email Campaign','Banner Ad','YouTube Title','Video Script','Twitter Thread','Blog Post'].map((f, i) => (
                <span key={f} className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${i < 3 ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300' : 'border-gray-600 bg-gray-700/60 text-gray-400'}`}>{f}</span>
              ))}
            </div>
          </div>
          {/* AI Provider */}
          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">AI Provider</p>
            <div className="grid grid-cols-4 gap-1.5">
              {[['🤖','Claude'],['🧠','GPT-4'],['💎','Gemini'],['⚡','Grok']].map(([e,n], i) => (
                <div key={n} className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-xs font-semibold transition-all ${i===2 ? 'border-amber-500 bg-amber-500/10 text-amber-300' : 'border-gray-700 bg-gray-700/50 text-gray-500'}`}>
                  <span>{e}</span><span>{n}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Output */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 uppercase tracking-widest">Generated Output</span>
              <span className="text-xs text-emerald-400 animate-pulse">● Generating...</span>
            </div>
            <div className="space-y-2">
              {[100, 85, 92, 70, 88].map((w, i) => (
                <div key={i} className={`h-2.5 rounded-full ${i < 2 ? 'bg-emerald-700/60' : 'bg-gray-700'}`} style={{width:`${w}%`, animationDelay:`${i*100}ms`}}/>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'social',
    tag: 'Distribution',
    headline: 'Post everywhere, from one place',
    sub: 'Connect Twitter/X, Instagram, Facebook and TikTok. Generate platform-optimized captions and post directly — no copy-pasting between 6 different apps at 11pm.',
    color: 'sky',
    subpoints: [
      { label: 'Secure OAuth 1.0a + 2.0 — your credentials stay yours' },
      { label: 'Each platform gets its own optimized caption' },
      { label: 'Full post history, retries, and analytics' },
    ],
    mockup: () => (
      <div className="w-full bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700 bg-gray-900">
          <div className="w-3 h-3 rounded-full bg-red-500/60"/>
          <div className="w-3 h-3 rounded-full bg-yellow-500/60"/>
          <div className="w-3 h-3 rounded-full bg-green-500/60"/>
          <span className="ml-3 text-xs text-gray-500 dark:text-gray-500">IVey — Social Accounts</span>
        </div>
        <div className="p-5 space-y-3">
          {[
            { name:'Twitter / X', handle:'@yourbrand', color:'bg-sky-500',   emoji:'𝕏',  connected:true  },
            { name:'Instagram',   handle:'@yourbrand', color:'bg-pink-500',  emoji:'📸', connected:true  },
            { name:'Facebook',    handle:'Your Page',  color:'bg-blue-600',  emoji:'📘', connected:true  },
            { name:'TikTok',      handle:'@yourbrand', color:'bg-gray-900',  emoji:'🎵', connected:false },
          ].map(acc => (
            <div key={acc.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 ${acc.color} rounded-xl flex items-center justify-center text-sm font-bold text-gray-900 dark:text-white border border-white/10`}>{acc.emoji}</div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{acc.name}</div>
                  <div className="text-xs text-gray-500">{acc.handle}</div>
                </div>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${acc.connected ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-gray-700 text-gray-500 border border-gray-600'}`}>
                {acc.connected ? '● Live' : 'Connect'}
              </span>
            </div>
          ))}
          {/* Compose */}
          <div className="mt-2 bg-gray-900 rounded-xl border border-amber-500/20 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-amber-400 font-semibold">Quick Post</span>
              <span className="text-xs text-gray-600">· 3 platforms selected</span>
            </div>
            <div className="h-2 bg-gray-700 rounded w-full mb-1.5"/>
            <div className="h-2 bg-gray-700 rounded w-3/4 mb-3"/>
            <div className="flex gap-2">
              <div className="flex-1 h-8 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center">
                <span className="text-xs text-amber-400">✨ Generate Caption</span>
              </div>
              <div className="w-20 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-xs text-white font-bold">Post</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'design',
    tag: 'Visual Creation',
    headline: 'Build campaign visuals without leaving IVey',
    sub: 'A drag-and-drop canvas with 18 curated color palettes, layered elements, text tools, and PNG export. Your Canva alternative — already inside your marketing platform.',
    color: 'rose',
    subpoints: [
      { label: '18 hand-picked color palettes that actually work' },
      { label: 'Add, move, resize and layer elements freely' },
      { label: 'Export pixel-perfect PNG in one click' },
    ],
    mockup: () => (
      <div className="w-full bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700 bg-gray-900">
          <div className="w-3 h-3 rounded-full bg-red-500/60"/>
          <div className="w-3 h-3 rounded-full bg-yellow-500/60"/>
          <div className="w-3 h-3 rounded-full bg-green-500/60"/>
          <span className="ml-3 text-xs text-gray-500 dark:text-gray-500">IVey — Design Editor</span>
        </div>
        <div className="flex h-64">
          {/* Sidebar tools */}
          <div className="w-10 bg-gray-900 border-r border-gray-700 flex flex-col items-center py-3 gap-3">
            {[['▭','Select'],['T','Text'],['◎','Shape'],['⬡','Frame'],['↗','Line']].map(([icon,], i) => (
              <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs cursor-pointer transition-all ${i===0 ? 'bg-rose-500 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}>{icon}</div>
            ))}
          </div>
          {/* Canvas */}
          <div className="flex-1 bg-gray-900/70 relative flex items-center justify-center">
            {/* Palette row */}
            <div className="absolute top-2 left-2 flex gap-1">
              {['#10b981','#f59e0b','#3b82f6','#ec4899','#8b5cf6','#f97316','#06b6d4','#84cc16'].map(c => (
                <div key={c} className="w-4 h-4 rounded-full border-2 border-white/20 cursor-pointer hover:scale-125 transition-transform" style={{background:c}}/>
              ))}
            </div>
            {/* Canvas element */}
            <div className="relative">
              <div className="w-44 h-28 rounded-xl border border-dashed border-rose-500/40 bg-gradient-to-br from-rose-500/20 to-amber-500/20 flex flex-col items-center justify-center gap-2 relative">
                <div className="text-white text-xs font-black tracking-widest">YOUR BRAND</div>
                <div className="w-16 h-1 bg-amber-500/60 rounded"/>
                <div className="text-gray-400 text-xs">Campaign Visual</div>
                {/* Handles */}
                {['-top-1 -left-1','-top-1 -right-1','-bottom-1 -left-1','-bottom-1 -right-1'].map(p => (
                  <div key={p} className={`absolute ${p} w-2.5 h-2.5 bg-white rounded-sm border border-gray-400`}/>
                ))}
              </div>
            </div>
            {/* Export btn */}
            <div className="absolute bottom-2 right-2 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg text-xs font-bold text-gray-900 dark:text-white shadow-lg cursor-pointer">Export PNG</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'campaigns',
    tag: 'Organization',
    headline: 'Every campaign, beautifully managed',
    sub: 'Create unlimited campaigns. Each gets its own AI strategy, content history, media gallery, and saved library. Everything in one clean dashboard — not scattered across 10 Notion pages.',
    color: 'amber',
    subpoints: [
      { label: 'Full AI marketing strategy with one click' },
      { label: 'Per-campaign media upload and management' },
      { label: 'Saved content library per campaign' },
    ],
    mockup: () => (
      <div className="w-full bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700 bg-gray-900">
          <div className="w-3 h-3 rounded-full bg-red-500/60"/>
          <div className="w-3 h-3 rounded-full bg-yellow-500/60"/>
          <div className="w-3 h-3 rounded-full bg-green-500/60"/>
          <span className="ml-3 text-xs text-gray-500 dark:text-gray-500">IVey — Campaigns</span>
        </div>
        <div className="p-4 space-y-2">
          {[
            { name:'MAGICAL WANDERINGS',       status:'Complete',       sc:'text-amber-400',   dot:'bg-amber-400',   formats:5 },
            { name:'Kombucha by SCOBBY QUEEN', status:'Strategy Ready', sc:'text-emerald-400', dot:'bg-emerald-400', formats:4 },
            { name:'magical kenya',            status:'Draft',          sc:'text-yellow-400',  dot:'bg-yellow-400',  formats:4 },
            { name:'from dynamic duo to IVey', status:'Draft',          sc:'text-yellow-400',  dot:'bg-yellow-400',  formats:3 },
          ].map(c => (
            <div key={c.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-600 transition-all group">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{c.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`}/>
                  <span className={`text-xs ${c.sc}`}>{c.status}</span>
                  <span className="text-xs text-gray-600">· {c.formats} formats</span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-gray-500 px-2 py-1 hover:text-gray-300 cursor-pointer">Edit</span>
                <span className="text-xs text-red-400 px-2 py-1 hover:text-red-300 cursor-pointer">Delete</span>
                <span className="text-xs text-emerald-400 px-2 py-1 cursor-pointer">Open →</span>
              </div>
            </div>
          ))}
          {/* Strategy snippet */}
          <div className="mt-1 p-3 bg-emerald-900/20 border border-emerald-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">📊</span>
              <span className="text-xs font-bold text-emerald-400">AI Strategy — MAGICAL WANDERINGS</span>
            </div>
            <div className="space-y-1.5">
              <div className="h-2 bg-emerald-800/50 rounded w-full"/>
              <div className="h-2 bg-emerald-800/50 rounded w-4/5"/>
              <div className="h-2 bg-emerald-800/50 rounded w-5/6"/>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'brand',
    tag: 'Brand System',
    headline: 'Define your brand once. Use it everywhere.',
    sub: 'Set colors, voice, audience, photography style, and more. Every AI output automatically reflects your brand identity — no manual briefing, no off-brand content.',
    color: 'violet',
    subpoints: [
      { label: 'Full visual identity — colors, mood, photography style' },
      { label: 'Brand voice, words to use, words to avoid' },
      { label: 'Multiple brand profiles — switch per campaign' },
    ],
    mockup: () => (
      <div className="w-full bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700 bg-gray-900">
          <div className="w-3 h-3 rounded-full bg-red-500/60"/>
          <div className="w-3 h-3 rounded-full bg-yellow-500/60"/>
          <div className="w-3 h-3 rounded-full bg-green-500/60"/>
          <span className="ml-3 text-xs text-gray-500 dark:text-gray-500">IVey — Brand Identity</span>
        </div>
        <div className="p-4 space-y-3">
          {/* Brand preview card */}
          <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-amber-500"/>
            <div className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black">M</div>
              <div>
                <div className="text-gray-900 dark:text-white text-sm font-black">MOONRALDS SAFARIS</div>
                <div className="text-gray-500 text-xs">MAGICAL WANDERINGS · Travel & Hospitality</div>
              </div>
              <span className="ml-auto text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">Default</span>
            </div>
            <div className="px-3 pb-3 flex gap-2">
              {['#10b981','#c7c8cc','#8e5886'].map(c => (
                <div key={c} className="w-8 h-8 rounded-lg border border-white/10 shadow-inner" style={{background:c}}/>
              ))}
              <div className="ml-2 flex gap-1.5 items-center flex-wrap">
                {['Bold','Vibrant','Warm','Luxurious'].map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{t}</span>
                ))}
              </div>
            </div>
          </div>
          {/* Voice selector */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Brand Voice</p>
            <div className="grid grid-cols-3 gap-1.5">
              {[['Professional','Authoritative'],['Bold','Confident'],['Inspiring','Uplifting']].map(([v,d], i) => (
                <div key={v} className={`p-2 rounded-lg border text-center cursor-pointer transition-all ${i===2 ? 'border-amber-500 bg-amber-500/10' : 'border-gray-700 bg-gray-900'}`}>
                  <div className={`text-xs font-bold ${i===2 ? 'text-amber-400' : 'text-gray-900 dark:text-white'}`}>{v}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{d}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Words */}
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-900 rounded-lg border border-emerald-500/20 p-2">
              <p className="text-xs text-emerald-500 mb-1.5">Always Use</p>
              <div className="flex flex-wrap gap-1">
                {['authentic','luxurious','wild'].map(w => (
                  <span key={w} className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">{w}</span>
                ))}
              </div>
            </div>
            <div className="flex-1 bg-gray-900 rounded-lg border border-red-500/20 p-2">
              <p className="text-xs text-red-400 mb-1.5">Never Use</p>
              <div className="flex flex-wrap gap-1">
                {['cheap','basic','simple'].map(w => (
                  <span key={w} className="text-xs px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full border border-red-500/20">{w}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'gallery',
    tag: 'Community',
    headline: 'Get inspired. Get discovered.',
    sub: 'Browse top-performing campaigns from creators and brands. Submit your best work to get featured. See what\'s working across Food, Travel, Tech, Fashion and more.',
    color: 'orange',
    subpoints: [
      { label: 'Admin-curated picks for maximum visibility' },
      { label: 'Submit campaigns directly from your dashboard' },
      { label: 'Filter by industry, format, and performance' },
    ],
    mockup: () => <GalleryMiniPanel />,
  },
];

const COLOR_CLASSES = {
  emerald: { tag:'bg-emerald-400/10 border-emerald-400/20 text-emerald-400', dot:'bg-emerald-400', line:'bg-emerald-400', num:'text-emerald-400/20' },
  sky:     { tag:'bg-sky-400/10 border-sky-400/20 text-sky-400',             dot:'bg-sky-400',     line:'bg-sky-400',     num:'text-sky-400/20'     },
  rose:    { tag:'bg-rose-400/10 border-rose-400/20 text-rose-400',          dot:'bg-rose-400',    line:'bg-rose-400',    num:'text-rose-400/20'    },
  amber:   { tag:'bg-amber-400/10 border-amber-400/20 text-amber-400',       dot:'bg-amber-400',   line:'bg-amber-400',   num:'text-amber-400/20'   },
  violet:  { tag:'bg-violet-400/10 border-violet-400/20 text-violet-400',    dot:'bg-violet-400',  line:'bg-violet-400',  num:'text-violet-400/20'  },
  orange:  { tag:'bg-orange-400/10 border-orange-400/20 text-orange-400',    dot:'bg-orange-400',  line:'bg-orange-400',  num:'text-orange-400/20'  },
};

// ─── Single feature row ───────────────────────────────────────────────────────
const FeatureRow = ({ feature, index }) => {
  const [textRef, textVisible]     = useReveal(0.2);
  const [mockupRef, mockupVisible] = useReveal(0.15);
  const c = COLOR_CLASSES[feature.color];
  const even = index % 2 === 0;
  const Panel = feature.mockup;

  return (
    <div className="py-16 border-b border-gray-800 last:border-0">
      <div className={`grid lg:grid-cols-2 gap-12 items-center ${!even ? 'lg:[&>*:first-child]:order-2' : ''}`}>

        {/* Text side */}
        <div
          ref={textRef}
          className={`space-y-6 transition-all duration-700 ease-out ${textVisible ? 'opacity-100 translate-x-0' : even ? 'opacity-0 -translate-x-10' : 'opacity-0 translate-x-10'}`}
        >
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold ${c.tag}`}>
            {feature.tag}
          </div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white leading-tight">{feature.headline}</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">{feature.sub}</p>
          <ul className="space-y-3">
            {feature.subpoints.map((p, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-300">
                <div className={`w-5 h-5 rounded-full ${c.dot} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <svg className="w-3 h-3 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                </div>
                <span className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{p.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Mockup side */}
        <div
          ref={mockupRef}
          className={`transition-all duration-700 ease-out delay-150 ${mockupVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'}`}
        >
          <Panel />
        </div>
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const Features = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [heroRef, heroVisible] = useReveal(0.1);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-20 px-4">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-emerald-500/8 rounded-full blur-3xl"/>
          <div className="absolute top-20 right-0 w-[500px] h-[400px] bg-amber-500/6 rounded-full blur-3xl"/>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-3xl"/>
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-5" style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize:'60px 60px'}}/>
        </div>

        <div
          ref={heroRef}
          className={`relative max-w-4xl mx-auto text-center transition-all duration-1000 ease-out ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-400/10 border border-emerald-400/20 rounded-full text-emerald-400 text-xs font-bold mb-8 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>
            Platform Features
          </div>

          <h1 className="text-6xl sm:text-7xl font-black text-gray-900 dark:text-white leading-[0.95] tracking-tight mb-6">
            One platform.<br/>
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">Everything viral.</span>
              <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full opacity-40"/>
            </span>
          </h1>

          <p className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            AI content generation, social posting, visual design, brand management, and community discovery. Stop juggling apps. Start going viral.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')} className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-black hover:from-amber-500 hover:to-amber-700 transition-all shadow-2xl shadow-amber-500/20 text-sm">
              {isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </button>
            <Link to="/dashboard" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-sm">
              Open Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <div className="border-y border-gray-100 dark:border-gray-800 bg-gray-100 dark:bg-gray-800/30 py-8 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[[13,'+','Content Formats'],[4,'','AI Providers'],[6,'','Social Platforms'],[0,'∞','Campaigns']].map(([to, suf, label]) => (
            <div key={label}>
              <div className="text-3xl font-black text-gray-900 dark:text-white">
                {to === 0 ? '∞' : <><Counter to={to} />{suf}</>}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        {FEATURES.map((f, i) => <FeatureRow key={f.id} feature={f} index={i} />)}
      </section>

      {/* ── Before / After ───────────────────────────────────────────────── */}
      <section className="border-t border-gray-100 dark:border-gray-800 py-20 px-4 bg-gray-50 dark:bg-gray-800/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-3">Stop juggling 10 different tools.</h2>
            <p className="text-gray-500">Everything you need is already in IVey.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-7">
              <div className="text-xs font-black text-gray-500 mb-5 uppercase tracking-widest flex items-center gap-2">
                <span className="w-5 h-5 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center text-red-400 text-xs">✕</span>
                Before IVey
              </div>
              <div className="space-y-3">
                {['ChatGPT tab for captions','Canva tab for visuals','Buffer for scheduling','Notion for campaign notes','Hootsuite for analytics','Copy-pasting between 6 apps','Different logins for every platform','Hours wasted on repetitive work'].map(t => (
                  <div key={t} className="flex items-center gap-3 text-sm text-gray-400">
                    <span className="w-4 h-4 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs flex-shrink-0">✕</span>
                    {t}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 border border-emerald-500/30 rounded-2xl p-7 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"/>
              <div className="text-xs font-black text-emerald-400 mb-5 uppercase tracking-widest flex items-center gap-2">
                <span className="w-5 h-5 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 text-xs">✓</span>
                After IVey
              </div>
              <div className="space-y-3">
                {['AI content across all 13+ formats','Built-in design editor','Direct social posting to all platforms','Campaign management hub','Post analytics and history','One login, one dashboard','Brand identity synced everywhere','Spend time on strategy, not tools'].map(t => (
                  <div key={t} className="flex items-center gap-3 text-sm text-gray-300">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs flex-shrink-0">✓</span>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-amber-500/6 rounded-full blur-3xl"/>
          <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-emerald-500/5 rounded-full blur-3xl"/>
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-5xl font-black text-gray-900 dark:text-white mb-4 leading-tight">Ready to go viral?</h2>
          <p className="text-gray-400 mb-10 text-lg leading-relaxed">Join creators and businesses using IVey to generate viral marketing content in seconds — not hours.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')} className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-black hover:from-amber-500 hover:to-amber-700 transition-all shadow-2xl shadow-amber-500/20 text-sm">
              {isAuthenticated ? 'Go to Dashboard' : 'Create Free Account'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </button>
            <Link to="/pricing" className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm">
              View Pricing
            </Link>
          </div>
          <p className="text-xs text-gray-600 mt-4">No credit card required · Cancel anytime</p>
        </div>
      </section>

    </div>
  );
};

export default Features;