import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// ─── Feature tab data ─────────────────────────────────────────────────────────
const TABS = [
  { id: 'ai',       label: 'AI Generation' },
  { id: 'social',   label: 'Social Posting' },
  { id: 'design',   label: 'Design Editor' },
  { id: 'campaigns',label: 'Campaigns' },
  { id: 'brand',    label: 'Brand Identity' },
  { id: 'gallery',  label: 'Gallery' },
];

// ─── Mock UI Panels ───────────────────────────────────────────────────────────

const AiPanel = () => (
  <div className="relative w-full h-full min-h-[420px] bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 p-5 flex flex-col gap-4">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        <span className="text-white text-sm font-bold">Generate Content</span>
      </div>
      <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">Gemini 2.5 Flash</span>
    </div>
    {/* Format chips */}
    <div className="flex flex-wrap gap-1.5">
      {['TikTok Script','Instagram Caption','Email Campaign','Banner Ad','YouTube Title','Twitter/X Thread','Video Script','Blog Post'].map((f, i) => (
        <span key={f} className={`text-xs px-2.5 py-1 rounded-full border font-medium ${i < 3 ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300' : 'border-gray-600 bg-gray-700 text-gray-400'}`}>{f}</span>
      ))}
    </div>
    {/* Output preview */}
    <div className="flex-1 bg-gray-900 rounded-xl border border-gray-700 p-4">
      <div className="text-xs text-gray-500 mb-2 uppercase tracking-widest">Generated Output</div>
      <div className="space-y-1.5">
        <div className="h-2.5 bg-gray-700 rounded w-full animate-pulse" style={{animationDelay:'0ms'}}/>
        <div className="h-2.5 bg-gray-700 rounded w-5/6 animate-pulse" style={{animationDelay:'100ms'}}/>
        <div className="h-2.5 bg-gray-700 rounded w-4/6 animate-pulse" style={{animationDelay:'200ms'}}/>
        <div className="h-2.5 bg-emerald-700/50 rounded w-full animate-pulse" style={{animationDelay:'300ms'}}/>
        <div className="h-2.5 bg-emerald-700/50 rounded w-3/4 animate-pulse" style={{animationDelay:'400ms'}}/>
      </div>
    </div>
    {/* Provider selector */}
    <div className="flex gap-2">
      {['Claude','GPT-4','Gemini','Grok'].map((p,i) => (
        <div key={p} className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold border ${i===2 ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-gray-700 bg-gray-700 text-gray-500'}`}>{p}</div>
      ))}
    </div>
  </div>
);

const SocialPanel = () => (
  <div className="relative w-full min-h-[420px] bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 p-5 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <span className="text-white text-sm font-bold">Connected Accounts</span>
      <span className="text-xs text-emerald-400">4 connected</span>
    </div>
    <div className="space-y-2">
      {[
        { name: 'Twitter / X', handle: '@yourbrand', color: 'bg-sky-500', connected: true,  emoji: '𝕏' },
        { name: 'Instagram',   handle: '@yourbrand', color: 'bg-pink-500', connected: true,  emoji: '📸' },
        { name: 'Facebook',    handle: 'Your Page',  color: 'bg-blue-600', connected: true,  emoji: '📘' },
        { name: 'TikTok',      handle: '@yourbrand', color: 'bg-gray-900', connected: false, emoji: '🎵' },
      ].map(acc => (
        <div key={acc.name} className="flex items-center justify-between p-3 bg-gray-900 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 ${acc.color} rounded-lg flex items-center justify-center text-sm font-bold text-white`}>{acc.emoji}</div>
            <div>
              <div className="text-sm font-semibold text-white">{acc.name}</div>
              <div className="text-xs text-gray-500">{acc.handle}</div>
            </div>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${acc.connected ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-700 text-gray-500'}`}>
            {acc.connected ? '● Connected' : 'Connect'}
          </span>
        </div>
      ))}
    </div>
    {/* Post composer */}
    <div className="bg-gray-900 rounded-xl border border-gray-700 p-3">
      <div className="text-xs text-gray-500 mb-2">Quick Post</div>
      <div className="h-2 bg-gray-700 rounded w-full mb-1.5"/>
      <div className="h-2 bg-gray-700 rounded w-2/3 mb-3"/>
      <div className="flex gap-2">
        <div className="flex-1 h-7 bg-amber-500/20 border border-amber-500/40 rounded-lg"/>
        <div className="w-16 h-7 bg-emerald-600 rounded-lg"/>
      </div>
    </div>
  </div>
);

const DesignPanel = () => (
  <div className="relative w-full min-h-[420px] bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 flex">
    {/* Left toolbar */}
    <div className="w-10 bg-gray-900 border-r border-gray-700 flex flex-col items-center py-3 gap-3">
      {['▭','T','◎','⬡','↗'].map((t,i) => (
        <div key={i} className={`w-7 h-7 rounded flex items-center justify-center text-xs ${i===0 ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>{t}</div>
      ))}
    </div>
    {/* Canvas */}
    <div className="flex-1 bg-gray-900 relative overflow-hidden">
      {/* Palette row */}
      <div className="absolute top-2 left-2 flex gap-1">
        {['#10b981','#f59e0b','#3b82f6','#ec4899','#8b5cf6','#f97316'].map(c => (
          <div key={c} className="w-4 h-4 rounded-full border border-white/20" style={{background:c}}/>
        ))}
      </div>
      {/* Canvas elements */}
      <div className="absolute inset-4 top-10 border border-dashed border-gray-700 rounded-lg flex items-center justify-center">
        <div className="relative w-48 h-32">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/30 to-amber-600/30 rounded-xl border border-emerald-500/30"/>
          <div className="absolute top-3 left-3 text-white text-xs font-black">YOUR BRAND</div>
          <div className="absolute bottom-3 right-3 w-12 h-8 bg-amber-500/30 rounded border border-amber-500/40"/>
          {/* Selection handles */}
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-white rounded-sm border border-gray-400"/>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-sm border border-gray-400"/>
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white rounded-sm border border-gray-400"/>
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white rounded-sm border border-gray-400"/>
        </div>
      </div>
      {/* Export button */}
      <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-amber-500 rounded-lg text-xs font-bold text-white">Export PNG</div>
    </div>
  </div>
);

const CampaignsPanel = () => (
  <div className="relative w-full min-h-[420px] bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 p-5 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <span className="text-white text-sm font-bold">Campaigns</span>
      <div className="px-3 py-1 bg-emerald-600 rounded-lg text-xs font-bold text-white">+ New</div>
    </div>
    <div className="space-y-2">
      {[
        { name: 'MAGICAL WANDERINGS',       status: 'Complete',       color: 'text-amber-400',   dot: 'bg-amber-400'   },
        { name: 'Kombucha by SCOBBY QUEEN', status: 'Strategy Ready', color: 'text-emerald-400', dot: 'bg-emerald-400' },
        { name: 'magical kenya',            status: 'Draft',          color: 'text-yellow-400',  dot: 'bg-yellow-400'  },
        { name: 'from dynamic duo to IVey', status: 'Draft',          color: 'text-yellow-400',  dot: 'bg-yellow-400'  },
      ].map(c => (
        <div key={c.name} className="flex items-center justify-between p-3 bg-gray-900 rounded-xl border border-gray-700 hover:border-gray-600 transition-all">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{c.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`}/>
              <span className={`text-xs font-medium ${c.color}`}>{c.status}</span>
            </div>
          </div>
          <div className="flex gap-1 ml-3">
            <span className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded">Edit</span>
            <span className="text-xs text-emerald-500 px-2 py-1 rounded">Open →</span>
          </div>
        </div>
      ))}
    </div>
    {/* Strategy preview */}
    <div className="bg-gray-900 rounded-xl border border-emerald-500/20 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">📊</span>
        <span className="text-xs font-bold text-emerald-400">AI Strategy Generated</span>
      </div>
      <div className="space-y-1">
        <div className="h-2 bg-emerald-900/40 rounded w-full"/>
        <div className="h-2 bg-emerald-900/40 rounded w-4/5"/>
      </div>
    </div>
  </div>
);

const BrandPanel = () => (
  <div className="relative w-full min-h-[420px] bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 p-5 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <span className="text-white text-sm font-bold">Brand Identity</span>
      <div className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-lg text-xs font-bold text-amber-400">💾 Save Brand</div>
    </div>
    {/* Brand card preview */}
    <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
      <div className="h-1 bg-gradient-to-r from-emerald-500 to-amber-500"/>
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-sm">M</div>
        <div>
          <div className="text-white text-sm font-black">MOONRALDS SAFARIS</div>
          <div className="text-gray-500 text-xs">MAGICAL WANDERINGS</div>
        </div>
      </div>
      <div className="px-4 pb-3 flex gap-1.5">
        {['#10b981','#c7c8cc','#8e5886'].map(c => (
          <div key={c} className="w-6 h-6 rounded-md border border-white/10" style={{background:c}}/>
        ))}
        <div className="ml-2 flex gap-1">
          {['Bold','Vibrant','Warm'].map(t => (
            <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{t}</span>
          ))}
        </div>
      </div>
    </div>
    {/* Form fields */}
    <div className="grid grid-cols-2 gap-2">
      {[['Brand Name','MOONRALDS SAFARIS'],['Tagline','MAGICAL WANDERINGS'],['Industry','Travel & Hospitality'],['Voice','Inspiring']].map(([l,v]) => (
        <div key={l} className="bg-gray-900 border border-gray-700 rounded-lg p-2">
          <div className="text-xs text-gray-500 mb-0.5">{l}</div>
          <div className="text-xs text-white font-medium truncate">{v}</div>
        </div>
      ))}
    </div>
    <div>
      <div className="text-xs text-gray-500 mb-1.5">Brand Voice</div>
      <div className="flex gap-1.5 flex-wrap">
        {['Professional','Bold','Inspiring','Playful'].map((v,i) => (
          <span key={v} className={`text-xs px-2.5 py-1 rounded-lg border ${i===2 ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-gray-700 bg-gray-800 text-gray-500'}`}>{v}</span>
        ))}
      </div>
    </div>
  </div>
);

const GalleryPanel = () => (
  <div className="relative w-full min-h-[420px] bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 p-5 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <span className="text-white text-sm font-bold">🏆 Community Gallery</span>
      <div className="flex gap-2 text-xs">
        <span className="text-emerald-400 font-semibold">Featured</span>
        <span className="text-gray-500">Recent</span>
        <span className="text-gray-500">Trending</span>
      </div>
    </div>
    {/* Gallery grid */}
    <div className="grid grid-cols-3 gap-2 flex-1">
      {[
        { bg: 'from-emerald-600/40 to-teal-600/40',   label: 'Safari Campaign'    },
        { bg: 'from-amber-500/40 to-orange-500/40',   label: 'Kombucha Launch'    },
        { bg: 'from-indigo-500/40 to-purple-500/40',  label: 'Tourism Ad'         },
        { bg: 'from-rose-500/40 to-pink-500/40',      label: 'Food & Beverage'    },
        { bg: 'from-sky-500/40 to-blue-500/40',       label: 'Tech Startup'       },
        { bg: 'from-lime-500/40 to-green-500/40',     label: 'Health & Wellness'  },
      ].map((g, i) => (
        <div key={i} className={`aspect-square bg-gradient-to-br ${g.bg} rounded-xl border border-white/10 relative overflow-hidden group cursor-pointer`}>
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-end p-1.5">
            <span className="text-white text-xs font-semibold leading-tight">{g.label}</span>
          </div>
          {i === 0 && <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-xs">⭐</div>}
        </div>
      ))}
    </div>
    <div className="text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-xs text-gray-300 font-semibold">
        Submit Your Campaign →
      </div>
    </div>
  </div>
);

const PANELS = { ai: AiPanel, social: SocialPanel, design: DesignPanel, campaigns: CampaignsPanel, brand: BrandPanel, gallery: GalleryPanel };

// ─── Feature content ──────────────────────────────────────────────────────────
const FEATURE_CONTENT = {
  ai: {
    tag:     'Core Engine',
    headline:'Generate viral content in seconds',
    sub:     'Describe your campaign once. IVey generates scroll-stopping content across 13+ formats — TikTok scripts, Instagram captions, email campaigns, banner ad copy, YouTube titles, and more.',
    points: [
      { icon: '🤖', title: '4 AI Providers',       desc: 'Choose between Claude, GPT-4, Gemini, and Grok for each campaign.' },
      { icon: '📋', title: '13+ Content Formats',  desc: 'Every format your brand needs, from social captions to full email sequences.' },
      { icon: '🎯', title: 'Brand-Aware Output',   desc: 'Content reflects your brand voice, colors, and audience automatically.' },
    ],
  },
  social: {
    tag:     'Distribution',
    headline:'Post everywhere from one place',
    sub:     'Connect Twitter/X, Instagram, Facebook and TikTok via OAuth. Generate platform-optimized captions and post directly from IVey — no copy-pasting between apps.',
    points: [
      { icon: '🔒', title: 'Secure OAuth',          desc: 'Industry-standard OAuth 1.0a and 2.0 — your credentials never touch our servers.' },
      { icon: '✨', title: 'AI Captions Per Platform', desc: 'Each platform gets its own optimized caption — not the same post copy-pasted.' },
      { icon: '📊', title: 'Post Analytics',         desc: 'Track every post — retries, failures, and performance all in one analytics panel.' },
    ],
  },
  design: {
    tag:     'Visual Creation',
    headline:'Build campaign visuals without leaving IVey',
    sub:     'A drag-and-drop canvas with 18 curated color palettes, layered elements, text tools, and PNG export. No Canva subscription needed.',
    points: [
      { icon: '🎨', title: '18 Curated Palettes',  desc: 'Hand-picked color palettes that actually work for marketing visuals.' },
      { icon: '🖱️', title: 'Drag & Drop Canvas',   desc: 'Add, move, resize, and layer elements with a simple point-and-click editor.' },
      { icon: '📥', title: 'PNG Export',            desc: 'Export pixel-perfect images via html2canvas, ready to post anywhere.' },
    ],
  },
  campaigns: {
    tag:     'Organization',
    headline:'Every campaign, beautifully organized',
    sub:     'Create and manage unlimited campaigns. Each gets its own strategy, content history, media gallery, and saved library — everything in one place.',
    points: [
      { icon: '📊', title: 'AI Strategy Generation', desc: 'Generate a full marketing strategy for any campaign with one click.' },
      { icon: '🗂️', title: 'Saved Content Library',  desc: 'Save your best-generated content to revisit and reuse later.' },
      { icon: '🖼️', title: 'Per-Campaign Media',      desc: 'Upload and manage product photos and videos for each campaign separately.' },
    ],
  },
  brand: {
    tag:     'Branding',
    headline:'Define your brand once, use it everywhere',
    sub:     'Set your brand name, colors, voice, audience, photography style, and more. Every AI generation automatically reflects your brand identity — no manual briefing needed.',
    points: [
      { icon: '🎨', title: 'Full Visual Identity',  desc: 'Primary, background, and accent colors with photography style and visual mood.' },
      { icon: '🗣️', title: 'Voice & Tone',          desc: 'Define exactly how your brand speaks — professional, bold, playful, inspiring.' },
      { icon: '👥', title: 'Multi-Brand Support',   desc: 'Manage multiple brand profiles and switch between them per campaign.' },
    ],
  },
  gallery: {
    tag:     'Community',
    headline:'Get inspired. Get discovered.',
    sub:     'Browse top-performing campaigns submitted by creators and brands. Submit your own work to get featured and reach new audiences.',
    points: [
      { icon: '⭐', title: 'Admin-Curated Picks',   desc: 'The best campaigns get featured by our team for maximum visibility.' },
      { icon: '📤', title: 'Submit Your Work',       desc: 'Share your top campaigns directly from the dashboard in one click.' },
      { icon: '🔍', title: 'Cross-Industry Ideas',   desc: 'See what\'s working across Food, Travel, Tech, Fashion, and more.' },
    ],
  },
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const Features = () => {
  const [activeTab, setActiveTab] = useState('ai');
  const [animating, setAnimating] = useState(false);
  const contentRef = useRef(null);

  const switchTab = (id) => {
    if (id === activeTab) return;
    setAnimating(true);
    setTimeout(() => {
      setActiveTab(id);
      setAnimating(false);
    }, 180);
  };

  const content = FEATURE_CONTENT[activeTab];
  const Panel   = PANELS[activeTab];

  return (
    <div className="min-h-screen bg-gray-900 text-white">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-16 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl"/>
          <div className="absolute top-10 right-1/3 w-[400px] h-[300px] bg-amber-500/5 rounded-full blur-3xl"/>
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-400/10 border border-emerald-400/20 rounded-full text-emerald-400 text-xs font-bold mb-6 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>
            Platform Features
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-5">
            One platform.<br/>
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Everything viral.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed mb-8">
            AI content generation, social posting, visual design, brand management, and community discovery — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-bold hover:from-amber-500 hover:to-amber-700 transition-all shadow-lg text-sm">
              Get Started Free
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </Link>
            <Link to="/dashboard" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-all text-sm">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <div className="border-y border-gray-800 bg-gray-800/40 py-5 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[['13+','Content Formats'],['4','AI Providers'],['6','Social Platforms'],['∞','Campaigns']].map(([v,l]) => (
            <div key={l}>
              <div className="text-2xl font-black text-white">{v}</div>
              <div className="text-xs text-gray-500 mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Feature Showcase ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">

        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-10 scrollbar-hide">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => switchTab(tab.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gray-700 text-white border border-gray-600'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div
          ref={contentRef}
          className={`transition-all duration-200 ${animating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}
        >
          <div className="grid lg:grid-cols-2 gap-10 items-start">

            {/* Left — text */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/10 border border-amber-400/20 rounded-full text-amber-400 text-xs font-bold">
                {content.tag}
              </div>
              <h2 className="text-4xl font-black text-white leading-tight">{content.headline}</h2>
              <p className="text-gray-400 leading-relaxed">{content.sub}</p>

              <div className="space-y-4 pt-2">
                {content.points.map(p => (
                  <div key={p.title} className="flex items-start gap-4 p-4 bg-gray-800 border border-gray-700 rounded-xl hover:border-gray-600 transition-all">
                    <div className="text-2xl flex-shrink-0">{p.icon}</div>
                    <div>
                      <div className="text-sm font-bold text-white mb-1">{p.title}</div>
                      <div className="text-xs text-gray-400 leading-relaxed">{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <Link to="/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-bold hover:from-amber-500 hover:to-amber-700 transition-all shadow-lg text-sm">
                Try it free
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </Link>
            </div>

            {/* Right — visual panel */}
            <div className="lg:sticky lg:top-24">
              <Panel />
            </div>
          </div>
        </div>
      </section>

      {/* ── Before / After ───────────────────────────────────────────────── */}
      <section className="border-t border-gray-800 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-white text-center mb-10">Stop juggling 10 different tools.</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Before */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
              <div className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest">Before IVey</div>
              <div className="space-y-2.5">
                {[
                  'ChatGPT for captions',
                  'Canva for visuals',
                  'Buffer for scheduling',
                  'Notion for campaign notes',
                  'Hootsuite for analytics',
                  'Separate tools for each platform',
                ].map(t => (
                  <div key={t} className="flex items-center gap-3 text-sm text-gray-400">
                    <span className="w-4 h-4 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center text-xs flex-shrink-0">✕</span>
                    {t}
                  </div>
                ))}
              </div>
            </div>
            {/* After */}
            <div className="bg-gray-800 border border-emerald-500/30 rounded-2xl p-6">
              <div className="text-sm font-bold text-emerald-400 mb-4 uppercase tracking-widest">After IVey</div>
              <div className="space-y-2.5">
                {[
                  'AI content across all formats',
                  'Built-in design editor',
                  'Direct social posting',
                  'Campaign management hub',
                  'Brand identity system',
                  'Everything in one dashboard',
                ].map(t => (
                  <div key={t} className="flex items-center gap-3 text-sm text-gray-300">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xs flex-shrink-0">✓</span>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 px-4 border-t border-gray-800">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 rounded-full blur-3xl"/>
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-4">Ready to go viral?</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">Join creators and businesses using IVey to generate viral marketing content in seconds.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-black hover:from-amber-500 hover:to-amber-700 transition-all shadow-xl text-sm">
              Create Free Account
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </Link>
            <Link to="/pricing" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-all text-sm">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Features;