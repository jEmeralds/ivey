import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// ─── Feature data ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    number: '01',
    title:  'AI Content Generation',
    tag:    'Core Engine',
    desc:   'Generate viral marketing content across 13+ formats in seconds. From TikTok scripts to email campaigns, Instagram captions to banner ad copy — powered by Claude, GPT-4, and Gemini.',
    bullets: ['13+ content formats', 'Multiple AI providers', 'Brand-aware output'],
    color:  'emerald',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  {
    number: '02',
    title:  'Social Media Posting',
    tag:    'Distribution',
    desc:   'Connect Twitter/X, Instagram, Facebook and TikTok. Post directly from IVey — with AI-generated captions optimized per platform. One campaign, every channel.',
    bullets: ['OAuth-secured connections', 'Platform-optimized captions', 'Media upload support'],
    color:  'amber',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
    ),
  },
  {
    number: '03',
    title:  'Design Editor',
    tag:    'Visual Creation',
    desc:   'Drag-and-drop canvas with 18 curated color palettes, layered elements, and PNG export. Build campaign visuals without leaving the platform.',
    bullets: ['18 curated palettes', 'Drag & drop canvas', 'PNG export via html2canvas'],
    color:  'rose',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
        <path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>
      </svg>
    ),
  },
  {
    number: '04',
    title:  'Campaign Management',
    tag:    'Organization',
    desc:   'Create, organize and track every campaign in one place. Full CRUD with strategy generation, content history, media gallery, and saved library per campaign.',
    bullets: ['Strategy generation', 'Media per campaign', 'Saved content library'],
    color:  'indigo',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
      </svg>
    ),
  },
  {
    number: '05',
    title:  'Brand Identity System',
    tag:    'Branding',
    desc:   'Define your brand once — colors, voice, audience, photography style — and every piece of AI content automatically reflects it. Multiple brand profiles supported.',
    bullets: ['Brand voice & tone', 'Color system', 'Multi-brand support'],
    color:  'teal',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
      </svg>
    ),
  },
  {
    number: '06',
    title:  'Community Gallery',
    tag:    'Discovery',
    desc:   'Browse and submit top-performing campaigns to the public gallery. Get inspired, showcase your work, and see what\'s working across industries.',
    bullets: ['Admin-curated picks', 'Community submissions', 'Cross-industry inspiration'],
    color:  'orange',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
  },
];

const COLOR_MAP = {
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', glow: 'shadow-emerald-500/20', tag: 'bg-emerald-400/10 text-emerald-400' },
  amber:   { text: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20',   glow: 'shadow-amber-500/20',   tag: 'bg-amber-400/10 text-amber-400'   },
  rose:    { text: 'text-rose-400',    bg: 'bg-rose-400/10',    border: 'border-rose-400/20',    glow: 'shadow-rose-500/20',    tag: 'bg-rose-400/10 text-rose-400'    },
  indigo:  { text: 'text-indigo-400',  bg: 'bg-indigo-400/10',  border: 'border-indigo-400/20',  glow: 'shadow-indigo-500/20',  tag: 'bg-indigo-400/10 text-indigo-400' },
  teal:    { text: 'text-teal-400',    bg: 'bg-teal-400/10',    border: 'border-teal-400/20',    glow: 'shadow-teal-500/20',    tag: 'bg-teal-400/10 text-teal-400'    },
  orange:  { text: 'text-orange-400',  bg: 'bg-orange-400/10',  border: 'border-orange-400/20',  glow: 'shadow-orange-500/20',  tag: 'bg-orange-400/10 text-orange-400' },
};

// ─── Animated feature card ────────────────────────────────────────────────────
const FeatureCard = ({ feature, index }) => {
  const ref  = useRef(null);
  const c    = COLOR_MAP[feature.color];
  const even = index % 2 === 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add('opacity-100', 'translate-y-0'); },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="opacity-0 translate-y-8 transition-all duration-700 ease-out"
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className={`group relative bg-gray-800/60 border ${c.border} rounded-2xl p-7 hover:bg-gray-800 hover:shadow-2xl ${c.glow} transition-all duration-300 overflow-hidden`}>

        {/* Background number watermark */}
        <div className={`absolute -right-4 -top-6 text-8xl font-black ${c.text} opacity-5 select-none pointer-events-none leading-none`}>
          {feature.number}
        </div>

        <div className={`flex flex-col ${even ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 items-start`}>

          {/* Left — icon + number */}
          <div className="flex-shrink-0 flex flex-row lg:flex-col items-center lg:items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0`}>
              <span className={`w-7 h-7 ${c.text}`}>{feature.icon}</span>
            </div>
            <span className={`text-4xl font-black ${c.text} opacity-30 leading-none`}>{feature.number}</span>
          </div>

          {/* Right — content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${c.tag}`}>
                {feature.tag}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 leading-tight">{feature.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">{feature.desc}</p>
            <ul className="space-y-2">
              {feature.bullets.map((b, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-gray-300">
                  <span className={`w-4 h-4 flex-shrink-0 ${c.text}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const Features = () => {
  const heroRef = useRef(null);

  useEffect(() => {
    const el = heroRef.current;
    if (el) setTimeout(() => el.classList.add('opacity-100', 'translate-y-0'), 50);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-16 px-4">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-3xl" />
        </div>

        <div
          ref={heroRef}
          className="relative max-w-4xl mx-auto text-center opacity-0 translate-y-6 transition-all duration-700 ease-out"
        >
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-400/10 border border-emerald-400/20 rounded-full text-emerald-400 text-xs font-bold mb-6 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Platform Features
          </div>

          <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-6">
            Everything you need to go{' '}
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              viral
            </span>
          </h1>

          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            IVey is an AI-powered viral marketing platform built for creators and brands who want to move fast, look good, and reach everyone.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-bold hover:from-amber-500 hover:to-amber-700 transition-all shadow-lg text-sm">
              Get Started Free
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </Link>
            <Link to="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-all text-sm">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-gray-800 bg-gray-800/40 py-6 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: '13+',    label: 'Content Formats'   },
            { value: '4',      label: 'AI Providers'      },
            { value: '6',      label: 'Social Platforms'  },
            { value: '∞',      label: 'Campaigns'         },
          ].map(s => (
            <div key={s.label}>
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="max-w-5xl mx-auto px-4 py-16 space-y-5">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-white mb-3">Built for speed. Designed to convert.</h2>
          <p className="text-gray-500 text-sm max-w-xl mx-auto">Every feature is purpose-built to help you create, distribute, and optimize marketing content faster than your competition.</p>
        </div>
        {FEATURES.map((feature, i) => (
          <FeatureCard key={feature.number} feature={feature} index={i} />
        ))}
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-amber-500/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-4">Ready to start?</h2>
          <p className="text-gray-400 mb-8 text-sm leading-relaxed">
            Join creators and businesses using IVey to generate viral marketing content in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-black hover:from-amber-500 hover:to-amber-700 transition-all shadow-xl text-sm">
              Create Free Account
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </Link>
            <Link to="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-all text-sm">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Features;