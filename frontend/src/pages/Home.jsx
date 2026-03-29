import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import GallerySection from '../components/GallerySection';

// ─── Scroll reveal hook ───────────────────────────────────────────────────────
const useReveal = (threshold = 0.12) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
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
    const steps = 50;
    const inc = to / steps;
    const timer = setInterval(() => {
      start += inc;
      if (start >= to) { setCount(to); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 25);
    return () => clearInterval(timer);
  }, [visible, to]);
  return <span ref={ref}>{count}{suffix}</span>;
};

// ─── Demo Modal ───────────────────────────────────────────────────────────────
const DEMO_STEPS = [
  { id: 'name',     label: 'Campaign Name',   icon: '📝' },
  { id: 'desc',     label: 'Description',      icon: '📄' },
  { id: 'audience', label: 'Target Audience',  icon: '🎯' },
  { id: 'brand',    label: 'Brand Identity',   icon: '🎨' },
  { id: 'formats',  label: 'Output Formats',   icon: '📱' },
  { id: 'provider', label: 'AI Provider',      icon: '🤖' },
  { id: 'submit',   label: 'Generating...',    icon: '⚡' },
  { id: 'done',     label: 'Done!',            icon: '🎉' },
];
const DEMO_DATA = {
  name: 'MOONRALDS SAFARI LAUNCH',
  description: 'Premium safari experience for luxury travellers. Drive bookings for Kenya & Tanzania routes, showcase transformation stories, and create urgency with early-bird pricing.',
  audience: 'Affluent adults 30–55, adventure seekers, luxury travel enthusiasts',
  brand: 'MOONRALDS SAFARIS',
  formats: ['TikTok Script','Instagram Caption','Email Campaign','YouTube Ad','Banner Ad','Video Script'],
  provider: 'Gemini',
};
const FORMAT_COLORS = {
  'TikTok Script':     'border-emerald-500/60 bg-emerald-500/10 text-emerald-300',
  'Instagram Caption': 'border-pink-500/60 bg-pink-500/10 text-pink-300',
  'Email Campaign':    'border-amber-500/60 bg-amber-500/10 text-amber-300',
  'YouTube Ad':        'border-red-500/60 bg-red-500/10 text-red-300',
  'Banner Ad':         'border-indigo-500/60 bg-indigo-500/10 text-indigo-300',
  'Video Script':      'border-orange-500/60 bg-orange-500/10 text-orange-300',
};

const useTypewriter = () => {
  const timers = useRef([]);
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const type = (text, setter, speed, onDone) => {
    clear(); setter(''); let i = 0;
    const tick = () => {
      i++; setter(text.slice(0, i));
      if (i < text.length) { const id = setTimeout(tick, speed); timers.current.push(id); }
      else if (onDone) { const id = setTimeout(onDone, 300); timers.current.push(id); }
    };
    const id = setTimeout(tick, 80); timers.current.push(id);
  };
  return { type, clear };
};

const DemoModal = ({ onClose }) => {
  const [stepIdx, setStepIdx]     = useState(0);
  const [paused, setPaused]       = useState(false);
  const [nameVal, setNameVal]     = useState('');
  const [descVal, setDescVal]     = useState('');
  const [audienceVal, setAudienceVal] = useState('');
  const [brandVal, setBrandVal]   = useState('');
  const [selFormats, setSelFormats] = useState([]);
  const [selProvider, setSelProvider] = useState('');
  const [progress, setProgress]   = useState(0);
  const [done, setDone]           = useState(false);
  const pausedRef = useRef(false);
  const stepRef   = useRef(0);
  const timers    = useRef([]);
  const { type: typeText, clear: clearType } = useTypewriter();

  const sched = useCallback((fn, delay) => {
    const id = setTimeout(() => { if (!pausedRef.current) fn(); }, delay);
    timers.current.push(id); return id;
  }, []);
  const clearAll = () => { timers.current.forEach(clearTimeout); timers.current = []; clearType(); };
  const goStep = useCallback((idx) => { stepRef.current = idx; setStepIdx(idx); }, []);

  const runStep = useCallback((idx) => {
    if (pausedRef.current || idx >= DEMO_STEPS.length) return;
    goStep(idx);
    const s = DEMO_STEPS[idx].id;
    if (s === 'name')     typeText(DEMO_DATA.name, setNameVal, 40, () => runStep(idx+1));
    else if (s === 'desc') typeText(DEMO_DATA.description, setDescVal, 14, () => runStep(idx+1));
    else if (s === 'audience') typeText(DEMO_DATA.audience, setAudienceVal, 28, () => runStep(idx+1));
    else if (s === 'brand') typeText(DEMO_DATA.brand, setBrandVal, 40, () => runStep(idx+1));
    else if (s === 'formats') {
      let delay = 300;
      DEMO_DATA.formats.forEach((fmt, i) => {
        const id = setTimeout(() => {
          if (!pausedRef.current) setSelFormats(p => [...p, fmt]);
          if (i === DEMO_DATA.formats.length - 1 && !pausedRef.current)
            setTimeout(() => runStep(idx+1), 500);
        }, delay);
        timers.current.push(id); delay += 340;
      });
    } else if (s === 'provider') {
      sched(() => { setSelProvider(DEMO_DATA.provider); sched(() => runStep(idx+1), 700); }, 300);
    } else if (s === 'submit') {
      let pct = 0;
      const tick = () => {
        if (pausedRef.current) return;
        pct++; setProgress(pct);
        if (pct < 100) { const id = setTimeout(tick, 22); timers.current.push(id); }
        else sched(() => runStep(idx+1), 300);
      };
      setTimeout(tick, 200);
    } else if (s === 'done') setDone(true);
  }, [goStep, sched, typeText]);

  useEffect(() => { runStep(0); return () => clearAll(); }, []);

  const togglePause = () => {
    if (!paused) { pausedRef.current = true; clearAll(); setPaused(true); }
    else {
      pausedRef.current = false; setPaused(false);
      const cur = stepRef.current; const s = DEMO_STEPS[cur].id;
      if (s === 'name') typeText(DEMO_DATA.name, setNameVal, 40, () => runStep(cur+1));
      else if (s === 'desc') typeText(DEMO_DATA.description, setDescVal, 14, () => runStep(cur+1));
      else if (s === 'audience') typeText(DEMO_DATA.audience, setAudienceVal, 28, () => runStep(cur+1));
      else if (s === 'brand') typeText(DEMO_DATA.brand, setBrandVal, 40, () => runStep(cur+1));
      else runStep(cur);
    }
  };
  const skipStep = () => {
    clearAll(); pausedRef.current = false; setPaused(false);
    const cur = stepRef.current; const s = DEMO_STEPS[cur].id;
    if (s === 'name') setNameVal(DEMO_DATA.name);
    if (s === 'desc') setDescVal(DEMO_DATA.description);
    if (s === 'audience') setAudienceVal(DEMO_DATA.audience);
    if (s === 'brand') setBrandVal(DEMO_DATA.brand);
    if (s === 'formats') setSelFormats(DEMO_DATA.formats);
    if (s === 'provider') setSelProvider(DEMO_DATA.provider);
    if (s === 'submit') setProgress(100);
    const next = cur + 1;
    if (next < DEMO_STEPS.length) { const id = setTimeout(() => runStep(next), 150); timers.current.push(id); }
  };

  const inp = (active) => `w-full px-4 py-3 border-2 rounded-xl bg-gray-800 text-white text-sm min-h-[46px] transition-all duration-200 ${active ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-gray-700'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-6"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">IVey — Live Demo</h2>
              <p className="text-xs text-gray-500">Watch AI build a campaign in real time</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex gap-1 mb-1">
            {DEMO_STEPS.slice(0,-1).map((s,i) => (
              <div key={s.id} className={`flex-1 h-1 rounded-full transition-all duration-500 ${i < stepIdx ? 'bg-emerald-500' : i === stepIdx ? 'bg-amber-400' : 'bg-gray-700'}`}/>
            ))}
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-amber-400 font-medium">{DEMO_STEPS[stepIdx].icon} {DEMO_STEPS[stepIdx].label}</span>
            <span className="text-xs text-gray-600">Step {Math.min(stepIdx+1, DEMO_STEPS.length-1)} of {DEMO_STEPS.length-1}</span>
          </div>
        </div>
        {/* Fields */}
        <div className="px-6 py-4 flex-1 space-y-4">
          <div className={`transition-opacity duration-300 ${stepIdx >= 0 ? 'opacity-100' : 'opacity-30'}`}>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Campaign Name {stepIdx===0 && <span className="text-emerald-400 animate-pulse ml-1">● typing</span>}</label>
            <div className={inp(stepIdx===0)}>{nameVal || <span className="text-gray-600">e.g. Summer Product Launch</span>}{stepIdx===0 && nameVal.length < DEMO_DATA.name.length && <span className="animate-pulse text-emerald-400">|</span>}</div>
          </div>
          <div className={`transition-opacity duration-300 ${stepIdx >= 1 ? 'opacity-100' : 'opacity-30'}`}>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Description {stepIdx===1 && <span className="text-emerald-400 animate-pulse ml-1">● typing</span>}</label>
            <div className={`${inp(stepIdx===1)} min-h-[72px] leading-relaxed`}>{descVal || <span className="text-gray-600">Describe your campaign goals...</span>}{stepIdx===1 && descVal.length < DEMO_DATA.description.length && <span className="animate-pulse text-emerald-400">|</span>}</div>
          </div>
          <div className={`transition-opacity duration-300 ${stepIdx >= 2 ? 'opacity-100' : 'opacity-30'}`}>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Target Audience {stepIdx===2 && <span className="text-emerald-400 animate-pulse ml-1">● typing</span>}</label>
            <div className={inp(stepIdx===2)}>{audienceVal || <span className="text-gray-600">e.g. Adults 25–45...</span>}{stepIdx===2 && audienceVal.length < DEMO_DATA.audience.length && <span className="animate-pulse text-emerald-400">|</span>}</div>
          </div>
          <div className={`transition-opacity duration-300 ${stepIdx >= 3 ? 'opacity-100' : 'opacity-30'}`}>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Brand Identity {stepIdx===3 && <span className="text-emerald-400 animate-pulse ml-1">● selecting</span>}</label>
            <div className={`${inp(stepIdx===3)} flex items-center gap-3`}>
              {brandVal ? (<><div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">{brandVal[0]}</div><span className="font-semibold">{brandVal}</span><span className="text-xs text-gray-500 ml-auto">Travel & Hospitality</span></>) : <span className="text-gray-600">Select brand profile...</span>}
              {stepIdx===3 && brandVal.length < DEMO_DATA.brand.length && <span className="animate-pulse text-emerald-400">|</span>}
            </div>
          </div>
          <div className={`transition-opacity duration-300 ${stepIdx >= 4 ? 'opacity-100' : 'opacity-30'}`}>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Output Formats {stepIdx===4 && <span className="text-emerald-400 animate-pulse ml-1">● selecting</span>}</label>
            <div className={`p-3 border-2 rounded-xl bg-gray-800 transition-all duration-200 ${stepIdx===4 ? 'border-emerald-500' : 'border-gray-700'}`}>
              <div className="flex flex-wrap gap-2">
                {['TikTok Script','Instagram Caption','Email Campaign','YouTube Ad','Banner Ad','Video Script','LinkedIn Post','SMS'].map(fmt => {
                  const sel = selFormats.includes(fmt);
                  return <span key={fmt} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 ${sel ? `${FORMAT_COLORS[fmt]||'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'} scale-105` : 'border-gray-700 bg-gray-700/50 text-gray-500'}`}>{sel?'✓ ':''}{fmt}</span>;
                })}
              </div>
            </div>
          </div>
          <div className={`transition-opacity duration-300 ${stepIdx >= 5 ? 'opacity-100' : 'opacity-30'}`}>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-widest">AI Provider {stepIdx===5 && <span className="text-emerald-400 animate-pulse ml-1">● selecting</span>}</label>
            <div className={`flex gap-2 p-3 border-2 rounded-xl bg-gray-800 transition-all duration-200 ${stepIdx===5 ? 'border-emerald-500' : 'border-gray-700'}`}>
              {[['🤖','Claude'],['🧠','GPT-4'],['💎','Gemini'],['⚡','Grok']].map(([e,n]) => (
                <div key={n} className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border text-xs font-semibold transition-all ${selProvider===n ? 'border-amber-500 bg-amber-500/10 text-amber-300 scale-105' : 'border-gray-700 bg-gray-700/50 text-gray-500'}`}>
                  <span>{e}</span><span>{n}</span>
                </div>
              ))}
            </div>
          </div>
          {stepIdx >= 6 && (
            <div className="pt-2">
              {!done ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                      {progress<30?'Analysing brief...':progress<60?'Building strategy...':progress<85?'Generating content...':'Polishing output...'}
                    </span>
                    <span className="font-black text-emerald-400">{progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                    <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500 rounded-full transition-all duration-75" style={{width:`${progress}%`}}/>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-gray-800 border border-emerald-500/30 p-5 text-center space-y-3">
                  <div className="text-4xl">🎉</div>
                  <h3 className="text-base font-black text-white">Campaign Created!</h3>
                  <p className="text-sm text-gray-400"><strong className="text-white">"{DEMO_DATA.name}"</strong> is live with {DEMO_DATA.formats.length} content pieces — generated in 28 seconds.</p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {DEMO_DATA.formats.map(fmt => <span key={fmt} className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${FORMAT_COLORS[fmt]||'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'}`}>✓ {fmt}</span>)}
                  </div>
                  <button onClick={onClose} className="mt-1 px-6 py-2.5 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-bold text-sm hover:from-amber-500 hover:to-amber-700 transition-all shadow-lg">Try It Yourself →</button>
                </div>
              )}
            </div>
          )}
        </div>
        {!done && (
          <div className="px-6 py-4 border-t border-gray-700 bg-gray-900/80 rounded-b-2xl flex items-center justify-between sticky bottom-0">
            <button onClick={togglePause} className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors">
              {paused ? <><svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>Resume</> : <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>Pause</>}
            </button>
            <div className="flex items-center gap-2">
              <button onClick={skipStep} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors">
                Skip <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>
              </button>
              <button onClick={onClose} className="px-3 py-2 text-gray-600 hover:text-gray-400 text-sm transition-colors">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Section wrapper with reveal ──────────────────────────────────────────────
const Section = ({ children, className = '', delay = 0, direction = 'up' }) => {
  const [ref, visible] = useReveal(0.1);
  const initial = direction === 'up' ? 'translate-y-10' : direction === 'left' ? '-translate-x-10' : 'translate-x-10';
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-x-0 translate-y-0' : `opacity-0 ${initial}`} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
};

// ─── Feature cards data ───────────────────────────────────────────────────────
const FEATURES = [
  { icon:'🤖', title:'AI Content Generation', desc:'13+ formats — TikTok, Instagram, Email, YouTube, Banner Ads and more. Powered by Claude, GPT-4, Gemini & Grok.', color:'emerald' },
  { icon:'🔗', title:'Social Media Posting',  desc:'Connect Twitter/X, Instagram, Facebook & TikTok. Post directly with platform-optimized AI captions.',         color:'sky'     },
  { icon:'🎨', title:'Design Editor',         desc:'18 curated palettes, drag-and-drop canvas, and PNG export. Build campaign visuals without leaving IVey.',     color:'rose'    },
  { icon:'📊', title:'Campaign Management',   desc:'Unlimited campaigns with AI strategy, media gallery, saved content library, and full edit/delete control.',   color:'amber'   },
  { icon:'💼', title:'Brand Identity System', desc:'Define colors, voice, audience and mood once. Every AI output reflects your brand automatically.',            color:'violet'  },
  { icon:'🏆', title:'Community Gallery',      desc:'Browse and submit top campaigns. Get featured, get inspired, see what works across industries.',              color:'orange'  },
];
const COLOR_MAP = {
  emerald:'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  sky:    'bg-sky-500/10 border-sky-500/20 text-sky-400',
  rose:   'bg-rose-500/10 border-rose-500/20 text-rose-400',
  amber:  'bg-amber-500/10 border-amber-500/20 text-amber-400',
  violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
  orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
};

// ─── How it works steps ───────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  { num:'01', title:'Create a Campaign',    desc:'Name your campaign, describe your product or service, define your target audience, and pick your brand profile.',  icon:'📝', color:'emerald' },
  { num:'02', title:'Pick Your Formats',    desc:'Choose from 13+ content formats — TikTok scripts, Instagram captions, email campaigns, banner ads, YouTube titles, and more.', icon:'📱', color:'amber' },
  { num:'03', title:'AI Generates Content', desc:'Select Claude, GPT-4, Gemini or Grok. Hit generate. Full brand-aware content for every selected format in under 30 seconds.', icon:'⚡', color:'rose'  },
  { num:'04', title:'Post & Go Viral',      desc:'Post directly to Twitter/X, Instagram, Facebook & TikTok with one click. AI-generated captions optimized per platform.', icon:'🚀', color:'sky'   },
];

// ─── Pricing preview data ─────────────────────────────────────────────────────
const PRICING_PREVIEW = [
  { name:'Starter', price:'Free', desc:'For individuals and creators getting started.', features:['5 campaigns/month','13+ content formats','4 AI providers','Design Editor','Brand Identity'], popular:false, cta:'Get Started Free', type:'free' },
  { name:'Professional', price:'$29', period:'/mo', desc:'For marketing teams and agencies.', features:['Unlimited campaigns','500 content pieces/month','Scheduled posting','Team collaboration','Priority support'], popular:true, cta:'Coming Soon', type:'paid' },
  { name:'Enterprise', price:'$99', period:'/mo', desc:'For large organizations with custom needs.', features:['Unlimited everything','White-label options','Custom AI training','API access','Dedicated manager'], popular:false, cta:'Coming Soon', type:'paid' },
];

// ─── Home Page ────────────────────────────────────────────────────────────────
const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);
  const [heroRef, heroVisible] = useReveal(0.05);

  const displayName = user?.name || user?.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white overflow-x-hidden">

      {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}

      {/* ══════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-24 pb-20 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/4 w-[700px] h-[600px] bg-emerald-500/6 rounded-full blur-3xl"/>
          <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl"/>
          <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:'linear-gradient(rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.15) 1px,transparent 1px)',backgroundSize:'60px 60px'}}/>
        </div>
        <div ref={heroRef} className={`relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center transition-all duration-1000 ${heroVisible?'opacity-100 translate-y-0':'opacity-0 translate-y-8'}`}>
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-400/10 border border-emerald-400/20 rounded-full text-emerald-400 text-xs font-bold mb-6 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>
              AI-Powered Viral Marketing
            </div>
            <h1 className="text-5xl sm:text-6xl font-black text-white leading-[0.95] tracking-tight mb-6">
              Generate viral<br/>marketing content<br/>
              <span className="relative">
                <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">in seconds.</span>
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 opacity-40 rounded-full"/>
              </span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-lg">
              Create TikTok scripts, Instagram captions, email campaigns, and 13+ content formats using advanced AI. Built for creators and brands who want to move fast.
            </p>
            {isAuthenticated && (
              <div className="flex items-center gap-2 mb-6 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl w-fit">
                <span className="text-amber-400 text-sm font-medium">👋 Welcome back, {displayName}!</span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              {isAuthenticated ? (
                <>
                  <button onClick={() => navigate('/dashboard')} className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-black hover:from-amber-500 hover:to-amber-700 transition-all shadow-xl shadow-amber-500/20 text-sm">🚀 Go to Dashboard</button>
                  <button onClick={() => navigate('/new-campaign')} className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-all text-sm">✨ New Campaign</button>
                </>
              ) : (
                <>
                  <button onClick={() => navigate('/signup')} className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-black hover:from-amber-500 hover:to-amber-700 transition-all shadow-xl shadow-amber-500/20 text-sm">
                    Start Free — No Card Needed
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                  </button>
                  <button onClick={() => setShowDemo(true)} className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-all text-sm">
                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    Watch Demo
                  </button>
                </>
              )}
            </div>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              {[[50,'K+','Content Pieces'],[2,'M+','Words Generated'],[30,'s','Avg. Time']].map(([to,suf,label]) => (
                <div key={label}>
                  <div className="text-2xl font-black text-white"><Counter to={to}/>{suf}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Right — dashboard preview */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-amber-500/10 rounded-3xl blur-2xl scale-110 pointer-events-none"/>
            <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700 bg-gray-900">
                <div className="w-3 h-3 rounded-full bg-red-500/70"/><div className="w-3 h-3 rounded-full bg-yellow-500/70"/><div className="w-3 h-3 rounded-full bg-green-500/70"/>
                <span className="ml-2 text-xs text-gray-500">IVey — Dashboard</span>
                <span className="ml-auto text-xs text-emerald-400 animate-pulse">● Live</span>
              </div>
              <div className="p-4 space-y-3">
                {[{name:'MAGICAL WANDERINGS',status:'Complete',sc:'text-amber-400',dot:'bg-amber-400'},{name:'Kombucha by SCOBBY QUEEN',status:'Strategy Ready',sc:'text-emerald-400',dot:'bg-emerald-400'},{name:'magical kenya',status:'Draft',sc:'text-yellow-400',dot:'bg-yellow-400'}].map(c => (
                  <div key={c.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{c.name}</div>
                      <div className="flex items-center gap-2 mt-0.5"><div className={`w-1.5 h-1.5 rounded-full ${c.dot}`}/><span className={`text-xs ${c.sc}`}>{c.status}</span></div>
                    </div>
                    <span className="text-xs text-emerald-500 ml-3">Open →</span>
                  </div>
                ))}
                <div className="p-3 bg-emerald-900/20 border border-emerald-500/20 rounded-xl">
                  <div className="flex justify-between mb-2"><span className="text-xs text-emerald-400 flex items-center gap-1.5"><svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>Generating...</span><span className="text-xs font-black text-emerald-400">73%</span></div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className="h-full w-3/4 bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full animate-pulse"/></div>
                </div>
                <button onClick={() => setShowDemo(true)} className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-bold text-sm hover:from-amber-500 hover:to-amber-700 transition-all flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>Watch Live Demo
                </button>
              </div>
            </div>
            <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/30 animate-bounce">✨ AI Powered</div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════════════════ */}
      <section id="features" className="border-t border-gray-800 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <Section className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/10 border border-amber-400/20 rounded-full text-amber-400 text-xs font-bold mb-4 uppercase tracking-widest">Everything Included</div>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4">One platform.<br/>Everything viral.</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg">Stop juggling 10 different tools. IVey has everything you need to create, design, post, and track viral marketing content.</p>
          </Section>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <Section key={f.title} delay={i * 80}>
                <div className="h-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:border-gray-300 dark:hover:border-gray-600 hover:-translate-y-1 transition-all duration-300 group cursor-default">
                  <div className={`w-12 h-12 rounded-xl ${COLOR_MAP[f.color]} border flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}>{f.icon}</div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              </Section>
            ))}
          </div>
          <Section delay={200} className="text-center mt-8">
            <Link to="/features" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl font-semibold text-sm hover:bg-gray-700 hover:border-gray-600 transition-all">
              See full feature breakdown →
            </Link>
          </Section>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="border-t border-gray-100 dark:border-gray-800 py-20 px-4 bg-gray-50 dark:bg-gray-800/20">
        <div className="max-w-5xl mx-auto">
          <Section className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-400/10 border border-emerald-400/20 rounded-full text-emerald-400 text-xs font-bold mb-4 uppercase tracking-widest">How It Works</div>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4">From brief to viral<br/>in 4 steps.</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg">The fastest path from idea to published content.</p>
          </Section>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_IT_WORKS.map((step, i) => (
              <Section key={step.num} delay={i * 100}>
                <div className="relative bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:border-gray-300 dark:hover:border-gray-600 hover:-translate-y-1 transition-all duration-300 h-full">
                  {/* Connector line on desktop */}
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden lg:block absolute top-8 -right-3 w-6 h-0.5 bg-gray-700 z-10"/>
                  )}
                  <div className={`w-10 h-10 rounded-xl ${COLOR_MAP[step.color]} border flex items-center justify-center text-xl mb-4`}>{step.icon}</div>
                  <div className="text-xs font-black text-gray-600 mb-1 uppercase tracking-widest">{step.num}</div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </Section>
            ))}
          </div>
          <Section delay={300} className="text-center mt-10">
            <button onClick={() => setShowDemo(true)} className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-black hover:from-amber-500 hover:to-amber-700 transition-all shadow-xl shadow-amber-500/20 text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              Watch It Live
            </button>
          </Section>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PRICING PREVIEW
      ══════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="border-t border-gray-800 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <Section className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-400/10 border border-violet-400/20 rounded-full text-violet-400 text-xs font-bold mb-4 uppercase tracking-widest">Pricing</div>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4">Simple, transparent<br/>pricing.</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg">Start free. Upgrade as you grow. No hidden fees, no surprises.</p>
          </Section>
          <div className="grid sm:grid-cols-3 gap-5">
            {PRICING_PREVIEW.map((plan, i) => (
              <Section key={plan.name} delay={i * 100}>
                <div className={`relative bg-white dark:bg-gray-800 rounded-2xl border-2 p-6 h-full flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${plan.popular ? 'border-emerald-500 shadow-xl shadow-emerald-500/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-black rounded-full shadow-lg">Most Popular</span>
                    </div>
                  )}
                  {plan.type === 'paid' && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-full">🚧 Soon</span>
                    </div>
                  )}
                  <div className="mb-4">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                    <p className="text-xs text-gray-500 mb-3">{plan.desc}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-gray-900 dark:text-white">{plan.price}</span>
                      {plan.period && <span className="text-gray-500 text-sm">{plan.period}</span>}
                    </div>
                    {plan.price === 'Free' && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Forever free · No credit card</p>}
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${plan.popular ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-400'}`}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => plan.type === 'free' ? navigate(isAuthenticated ? '/dashboard' : '/signup') : null}
                    className={`w-full py-3 rounded-xl font-black text-sm transition-all ${plan.popular ? 'bg-emerald-600 text-white hover:bg-emerald-700' : plan.type === 'free' ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-white hover:from-amber-500 hover:to-amber-700' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}>
                    {plan.type === 'free' && isAuthenticated ? '🚀 Dashboard' : plan.cta}
                  </button>
                </div>
              </Section>
            ))}
          </div>
          <Section delay={200} className="text-center mt-8">
            <Link to="/pricing" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl font-semibold text-sm hover:bg-gray-700 transition-all">
              View full pricing details →
            </Link>
          </Section>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          GALLERY
      ══════════════════════════════════════════════════════════════════ */}
      <section id="gallery" className="border-t border-gray-100 dark:border-gray-800">
        <GallerySection embedded />
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════════════ */}
      <section className="border-t border-gray-100 dark:border-gray-800 relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-amber-500/5 rounded-full blur-3xl"/>
          <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-emerald-500/4 rounded-full blur-3xl"/>
        </div>
        <Section className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-5xl font-black text-gray-900 dark:text-white mb-4 leading-tight">
            {isAuthenticated ? `Welcome back,\n${displayName}!` : 'Ready to go viral?'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-10 text-lg leading-relaxed">
            {isAuthenticated ? 'Your campaigns are waiting.' : 'Join creators and businesses generating viral content in seconds.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isAuthenticated ? (
              <>
                <button onClick={() => navigate('/dashboard')} className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-black hover:from-amber-500 hover:to-amber-700 transition-all shadow-2xl shadow-amber-500/20 text-sm">🚀 Go to Dashboard</button>
                <button onClick={() => navigate('/new-campaign')} className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-all text-sm">✨ New Campaign</button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/signup')} className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-black hover:from-amber-500 hover:to-amber-700 transition-all shadow-2xl shadow-amber-500/20 text-sm">
                  Create Free Account
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                </button>
                <Link to="/pricing" className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-all text-sm">View Pricing</Link>
              </>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-5">No credit card required · Cancel anytime</p>
        </Section>
      </section>

    </div>
  );
};

export default Home;