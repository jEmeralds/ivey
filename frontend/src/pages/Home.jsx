import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import GallerySection from '../components/GallerySection';

// ─── Scroll reveal hook ───────────────────────────────────────────────────────
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
const Counter = ({ to, suffix = '', prefix = '' }) => {
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
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
};

// ─── Demo Data ────────────────────────────────────────────────────────────────
const DEMO_STEPS = [
  { id: 'name',     label: 'Campaign Name',    icon: '📝' },
  { id: 'desc',     label: 'Description',       icon: '📄' },
  { id: 'audience', label: 'Target Audience',   icon: '🎯' },
  { id: 'brand',    label: 'Brand Identity',    icon: '🎨' },
  { id: 'formats',  label: 'Output Formats',    icon: '📱' },
  { id: 'provider', label: 'AI Provider',       icon: '🤖' },
  { id: 'submit',   label: 'Generating...',     icon: '⚡' },
  { id: 'done',     label: 'Campaign Created!', icon: '🎉' },
];

const DEMO_DATA = {
  name:        'MOONRALDS SAFARI LAUNCH',
  description: 'Premium safari experience targeting high-income travellers. Drive bookings for our new Kenya & Tanzania routes, showcase transformation testimonials, and create urgency with early-bird pricing.',
  audience:    'Affluent adults 30–55, adventure seekers, luxury travel enthusiasts',
  brand:       'MOONRALDS SAFARIS',
  formats:     ['TikTok Script', 'Instagram Caption', 'Email Campaign', 'YouTube Ad', 'Banner Ad', 'Video Script'],
  provider:    'Gemini (Google)',
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

// ─── Demo Modal ───────────────────────────────────────────────────────────────
const DemoModal = ({ onClose }) => {
  const [stepIdx,     setStepIdx]     = useState(0);
  const [paused,      setPaused]      = useState(false);
  const [nameVal,     setNameVal]     = useState('');
  const [descVal,     setDescVal]     = useState('');
  const [audienceVal, setAudienceVal] = useState('');
  const [brandVal,    setBrandVal]    = useState('');
  const [selFormats,  setSelFormats]  = useState([]);
  const [selProvider, setSelProvider] = useState('');
  const [progress,    setProgress]    = useState(0);
  const [done,        setDone]        = useState(false);

  const pausedRef  = useRef(false);
  const stepRef    = useRef(0);
  const mainTimers = useRef([]);
  const { type: typeText, clear: clearType } = useTypewriter();

  const sched = useCallback((fn, delay) => {
    const id = setTimeout(() => { if (!pausedRef.current) fn(); }, delay);
    mainTimers.current.push(id);
  }, []);

  const clearAll = () => { mainTimers.current.forEach(clearTimeout); mainTimers.current = []; clearType(); };

  const goStep = useCallback((idx) => {
    if (idx >= DEMO_STEPS.length) return;
    stepRef.current = idx; setStepIdx(idx);
  }, []);

  const runStep = useCallback((idx) => {
    if (pausedRef.current) return;
    goStep(idx);
    const step = DEMO_STEPS[idx];
    if (step.id === 'name') {
      typeText(DEMO_DATA.name, setNameVal, 40, () => runStep(idx + 1));
    } else if (step.id === 'desc') {
      typeText(DEMO_DATA.description, setDescVal, 15, () => runStep(idx + 1));
    } else if (step.id === 'audience') {
      typeText(DEMO_DATA.audience, setAudienceVal, 30, () => runStep(idx + 1));
    } else if (step.id === 'brand') {
      typeText(DEMO_DATA.brand, setBrandVal, 40, () => runStep(idx + 1));
    } else if (step.id === 'formats') {
      let delay = 300;
      DEMO_DATA.formats.forEach((fmt, i) => {
        const id = setTimeout(() => {
          if (!pausedRef.current) setSelFormats(prev => [...prev, fmt]);
          if (i === DEMO_DATA.formats.length - 1 && !pausedRef.current) {
            const id2 = setTimeout(() => runStep(idx + 1), 500);
            mainTimers.current.push(id2);
          }
        }, delay);
        mainTimers.current.push(id);
        delay += 350;
      });
    } else if (step.id === 'provider') {
      sched(() => { setSelProvider(DEMO_DATA.provider); sched(() => runStep(idx + 1), 700); }, 300);
    } else if (step.id === 'submit') {
      let pct = 0;
      const tick = () => {
        if (pausedRef.current) return;
        pct += 1; setProgress(pct);
        if (pct < 100) { const id = setTimeout(tick, 22); mainTimers.current.push(id); }
        else { const id = setTimeout(() => { if (!pausedRef.current) runStep(idx + 1); }, 300); mainTimers.current.push(id); }
      };
      setTimeout(tick, 200);
    } else if (step.id === 'done') {
      setDone(true);
    }
  }, [goStep, sched, typeText]);

  useEffect(() => { runStep(0); return () => clearAll(); }, []);

  const togglePause = () => {
    if (!paused) { pausedRef.current = true; clearAll(); setPaused(true); }
    else {
      pausedRef.current = false; setPaused(false);
      const cur = stepRef.current; const step = DEMO_STEPS[cur];
      if (step.id === 'name')     typeText(DEMO_DATA.name,     setNameVal,     40, () => runStep(cur + 1));
      else if (step.id === 'desc') typeText(DEMO_DATA.description, setDescVal, 15, () => runStep(cur + 1));
      else if (step.id === 'audience') typeText(DEMO_DATA.audience, setAudienceVal, 30, () => runStep(cur + 1));
      else if (step.id === 'brand') typeText(DEMO_DATA.brand, setBrandVal, 40, () => runStep(cur + 1));
      else runStep(cur);
    }
  };

  const skipStep = () => {
    clearAll(); pausedRef.current = false; setPaused(false);
    const cur = stepRef.current; const step = DEMO_STEPS[cur];
    if (step.id === 'name')     setNameVal(DEMO_DATA.name);
    if (step.id === 'desc')     setDescVal(DEMO_DATA.description);
    if (step.id === 'audience') setAudienceVal(DEMO_DATA.audience);
    if (step.id === 'brand')    setBrandVal(DEMO_DATA.brand);
    if (step.id === 'formats')  setSelFormats(DEMO_DATA.formats);
    if (step.id === 'provider') setSelProvider(DEMO_DATA.provider);
    if (step.id === 'submit')   setProgress(100);
    const next = cur + 1;
    if (next < DEMO_STEPS.length) { const id = setTimeout(() => runStep(next), 150); mainTimers.current.push(id); }
  };

  const currentStep = DEMO_STEPS[stepIdx];
  const inputCls = (active) => `w-full px-4 py-3 border-2 rounded-xl bg-gray-800 text-white text-sm min-h-[46px] transition-all duration-200 ${active ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-gray-700'}`;

  const FORMAT_COLORS = {
    'TikTok Script':     'border-emerald-500/60 bg-emerald-500/10 text-emerald-300',
    'Instagram Caption': 'border-pink-500/60 bg-pink-500/10 text-pink-300',
    'Email Campaign':    'border-amber-500/60 bg-amber-500/10 text-amber-300',
    'YouTube Ad':        'border-red-500/60 bg-red-500/10 text-red-300',
    'Banner Ad':         'border-indigo-500/60 bg-indigo-500/10 text-indigo-300',
    'Video Script':      'border-orange-500/60 bg-orange-500/10 text-orange-300',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">IVey — Campaign Demo</h2>
              <p className="text-xs text-gray-500">Watch AI build a full campaign in real time</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex gap-1 mb-1">
            {DEMO_STEPS.slice(0, -1).map((s, i) => (
              <div key={s.id} className={`flex-1 h-1 rounded-full transition-all duration-500 ${i < stepIdx ? 'bg-emerald-500' : i === stepIdx ? 'bg-amber-400' : 'bg-gray-700'}`}/>
            ))}
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-amber-400 font-medium">{currentStep.icon} {currentStep.label}</span>
            <span className="text-xs text-gray-600">Step {Math.min(stepIdx + 1, DEMO_STEPS.length - 1)} of {DEMO_STEPS.length - 1}</span>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-4 flex-1 space-y-4">

          {/* Name */}
          <div className={`transition-opacity duration-300 ${stepIdx >= 0 ? 'opacity-100' : 'opacity-30'}`}>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-widest">
              Campaign Name {stepIdx === 0 && <span className="text-emerald-400 animate-pulse ml-1">● typing</span>}
            </label>
            <div className={inputCls(stepIdx === 0)}>
              {nameVal || <span className="text-gray-600">e.g. Summer Product Launch</span>}
              {stepIdx === 0 && nameVal.length < DEMO_DATA.name.length && <span className="animate-pulse text-emerald-400 ml-0.5">|</span>}
            </div>
          </div>

          {/* Description */}
          <div className={`transition-opacity duration-300 ${stepIdx >= 1 ? 'opacity-100' : 'opacity-30'}`}>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-widest">
              Description {stepIdx === 1 && <span className="text-emerald-400 animate-pulse ml-1">● typing</span>}
            </label>
            <div className={`${inputCls(stepIdx === 1)} min-h-[72px] leading-relaxed`}>
              {descVal || <span className="text-gray-600">Describe your campaign goals...</span>}
              {stepIdx === 1 && descVal.length < DEMO_DATA.description.length && <span className="animate-pulse text-emerald-400 ml-0.5">|</span>}
            </div>
          </div>

          {/* Audience */}
          <div className={`transition-opacity duration-300 ${stepIdx >= 2 ? 'opacity-100' : 'opacity-30'}`}>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-widest">
              Target Audience {stepIdx === 2 && <span className="text-emerald-400 animate-pulse ml-1">● typing</span>}
            </label>
            <div className={inputCls(stepIdx === 2)}>
              {audienceVal || <span className="text-gray-600">e.g. Young adults 18–35...</span>}
              {stepIdx === 2 && audienceVal.length < DEMO_DATA.audience.length && <span className="animate-pulse text-emerald-400 ml-0.5">|</span>}
            </div>
          </div>

          {/* Brand */}
          <div className={`transition-opacity duration-300 ${stepIdx >= 3 ? 'opacity-100' : 'opacity-30'}`}>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-widest">
              Brand Identity {stepIdx === 3 && <span className="text-emerald-400 animate-pulse ml-1">● typing</span>}
            </label>
            <div className={`${inputCls(stepIdx === 3)} flex items-center gap-3`}>
              {brandVal ? (
                <>
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                    {brandVal[0]}
                  </div>
                  <span className="text-white font-semibold">{brandVal}</span>
                  <span className="text-xs text-gray-500 ml-auto">Travel & Hospitality</span>
                </>
              ) : <span className="text-gray-600">Select brand profile...</span>}
              {stepIdx === 3 && brandVal.length < DEMO_DATA.brand.length && <span className="animate-pulse text-emerald-400 ml-0.5">|</span>}
            </div>
          </div>

          {/* Formats */}
          <div className={`transition-opacity duration-300 ${stepIdx >= 4 ? 'opacity-100' : 'opacity-30'}`}>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-widest">
              Output Formats {stepIdx === 4 && <span className="text-emerald-400 animate-pulse ml-1">● selecting</span>}
            </label>
            <div className={`p-3 border-2 rounded-xl bg-gray-800 transition-all duration-200 ${stepIdx === 4 ? 'border-emerald-500' : 'border-gray-700'}`}>
              <div className="flex flex-wrap gap-2">
                {['TikTok Script','Instagram Caption','Email Campaign','YouTube Ad','Banner Ad','Video Script','LinkedIn Post','SMS'].map(fmt => {
                  const sel = selFormats.includes(fmt);
                  return (
                    <span key={fmt} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 ${sel ? `${FORMAT_COLORS[fmt] || 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'} scale-105` : 'border-gray-700 bg-gray-700/50 text-gray-500'}`}>
                      {sel ? '✓ ' : ''}{fmt}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Provider */}
          <div className={`transition-opacity duration-300 ${stepIdx >= 5 ? 'opacity-100' : 'opacity-30'}`}>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-widest">
              AI Provider {stepIdx === 5 && <span className="text-emerald-400 animate-pulse ml-1">● selecting</span>}
            </label>
            <div className={`flex gap-2 p-3 border-2 rounded-xl bg-gray-800 transition-all duration-200 ${stepIdx === 5 ? 'border-emerald-500' : 'border-gray-700'}`}>
              {[['🤖','Claude'],['🧠','GPT-4'],['💎','Gemini'],['⚡','Grok']].map(([e,n]) => (
                <div key={n} className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border text-xs font-semibold transition-all ${selProvider.includes(n) ? 'border-amber-500 bg-amber-500/10 text-amber-300 scale-105' : 'border-gray-700 bg-gray-700/50 text-gray-500'}`}>
                  <span>{e}</span><span>{n}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress / Done */}
          {stepIdx >= 6 && (
            <div className="pt-2">
              {!done ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                      {progress < 30 ? 'Analysing campaign brief...' : progress < 60 ? 'Building AI strategy...' : progress < 85 ? 'Generating content...' : 'Polishing output...'}
                    </span>
                    <span className="font-black text-emerald-400 tabular-nums">{progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                    <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500 rounded-full transition-all duration-75" style={{width:`${progress}%`}}/>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-gray-800 border border-emerald-500/30 p-5 text-center space-y-3">
                  <div className="text-4xl">🎉</div>
                  <h3 className="text-base font-black text-white">Campaign Created!</h3>
                  <p className="text-sm text-gray-400">
                    <strong className="text-white">"{DEMO_DATA.name}"</strong> is live with {DEMO_DATA.formats.length} content pieces across {DEMO_DATA.formats.length} formats — generated in 28 seconds.
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {DEMO_DATA.formats.map(fmt => (
                      <span key={fmt} className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${FORMAT_COLORS[fmt] || 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'}`}>✓ {fmt}</span>
                    ))}
                  </div>
                  <button onClick={onClose} className="mt-1 px-6 py-2.5 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-bold text-sm hover:from-amber-500 hover:to-amber-700 transition-all shadow-lg">
                    Try It Yourself →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
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

// ─── Hero visual (right side) ─────────────────────────────────────────────────
const HeroVisual = ({ onOpenDemo }) => (
  <div className="relative">
    {/* Glow behind card */}
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-amber-500/10 rounded-3xl blur-2xl scale-110 pointer-events-none"/>
    <div className="relative bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700 bg-gray-900">
        <div className="w-3 h-3 rounded-full bg-red-500/70"/><div className="w-3 h-3 rounded-full bg-yellow-500/70"/><div className="w-3 h-3 rounded-full bg-green-500/70"/>
        <span className="ml-2 text-xs text-gray-500">IVey — Campaign Dashboard</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-xs text-emerald-400 animate-pulse">● Live</span>
        </div>
      </div>
      <div className="p-5 space-y-3">
        {/* Campaign rows */}
        {[
          { name:'MAGICAL WANDERINGS',       status:'Complete',       sc:'text-amber-400',   dot:'bg-amber-400',   formats:5 },
          { name:'Kombucha by SCOBBY QUEEN', status:'Strategy Ready', sc:'text-emerald-400', dot:'bg-emerald-400', formats:4 },
          { name:'magical kenya',            status:'Draft',          sc:'text-yellow-400',  dot:'bg-yellow-400',  formats:4 },
        ].map(c => (
          <div key={c.name} className="flex items-center justify-between p-3 bg-gray-900 rounded-xl border border-gray-700">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate">{c.name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`}/><span className={`text-xs ${c.sc}`}>{c.status}</span>
                <span className="text-xs text-gray-600">· {c.formats} formats</span>
              </div>
            </div>
            <span className="text-xs text-emerald-500 ml-3">Open →</span>
          </div>
        ))}
        {/* Generating bar */}
        <div className="p-3 bg-emerald-900/20 border border-emerald-500/20 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-emerald-400 flex items-center gap-1.5">
              <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Generating content...
            </span>
            <span className="text-xs font-black text-emerald-400">73%</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full w-3/4 bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full animate-pulse"/>
          </div>
        </div>
        {/* Watch demo button */}
        <button onClick={onOpenDemo}
          className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-bold text-sm hover:from-amber-500 hover:to-amber-700 transition-all shadow-lg flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          Watch Live Demo
        </button>
      </div>
    </div>
    {/* Floating badge */}
    <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/30 animate-bounce">
      ✨ AI Powered
    </div>
  </div>
);

// ─── Feature cards ────────────────────────────────────────────────────────────
const FEATURES_PREVIEW = [
  { icon: '🤖', title: 'AI Content Generation', desc: '13+ formats — TikTok, Instagram, Email, YouTube, Banner Ads and more. Powered by Claude, GPT-4, Gemini & Grok.', color: 'emerald' },
  { icon: '🔗', title: 'Social Media Posting',  desc: 'Connect Twitter/X, Instagram, Facebook & TikTok. Post directly with platform-optimized AI captions.',          color: 'sky'     },
  { icon: '🎨', title: 'Design Editor',          desc: '18 curated palettes, drag-and-drop canvas, and PNG export. Build campaign visuals without leaving IVey.',      color: 'rose'    },
  { icon: '📊', title: 'Campaign Management',    desc: 'Unlimited campaigns with AI strategy, media gallery, saved content library, and full edit/delete control.',    color: 'amber'   },
  { icon: '💼', title: 'Brand Identity System',  desc: 'Define colors, voice, audience and mood once. Every AI output reflects your brand automatically.',             color: 'violet'  },
  { icon: '🏆', title: 'Community Gallery',       desc: 'Browse and submit top campaigns. Get featured, get inspired, see what works across industries.',               color: 'orange'  },
];

const COLOR_MAP = {
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  sky:     'bg-sky-500/10 border-sky-500/20 text-sky-400',
  rose:    'bg-rose-500/10 border-rose-500/20 text-rose-400',
  amber:   'bg-amber-500/10 border-amber-500/20 text-amber-400',
  violet:  'bg-violet-500/10 border-violet-500/20 text-violet-400',
  orange:  'bg-orange-500/10 border-orange-500/20 text-orange-400',
};

const FeatureCard = ({ feature, index }) => {
  const [ref, visible] = useReveal(0.1);
  return (
    <div ref={ref} className={`transition-all duration-600 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{transitionDelay:`${index * 80}ms`}}>
      <div className="h-full bg-gray-800 border border-gray-700 rounded-2xl p-6 hover:border-gray-600 hover:bg-gray-750 transition-all duration-300 group">
        <div className={`w-12 h-12 rounded-xl ${COLOR_MAP[feature.color]} border flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
          {feature.icon}
        </div>
        <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
      </div>
    </div>
  );
};

// ─── Home Page ────────────────────────────────────────────────────────────────
const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);
  const [heroRef, heroVisible] = useReveal(0.1);
  const [statsRef, statsVisible] = useReveal(0.3);

  const displayName = user?.name || user?.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen bg-gray-900 text-white">

      {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-20 px-4">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 left-1/4 w-[700px] h-[600px] bg-emerald-500/6 rounded-full blur-3xl"/>
          <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl"/>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-500/4 rounded-full blur-3xl"/>
          <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize:'60px 60px'}}/>
        </div>

        <div ref={heroRef} className={`relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center transition-all duration-1000 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-400/10 border border-emerald-400/20 rounded-full text-emerald-400 text-xs font-bold mb-6 tracking-widest uppercase">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>
              AI-Powered Viral Marketing
            </div>

            <h1 className="text-5xl sm:text-6xl font-black text-white leading-[0.95] tracking-tight mb-6">
              Generate viral<br/>
              marketing content<br/>
              <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">in seconds.</span>
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
                  <button onClick={() => navigate('/dashboard')} className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-black hover:from-amber-500 hover:to-amber-700 transition-all shadow-xl shadow-amber-500/20 text-sm">
                    🚀 Go to Dashboard
                  </button>
                  <button onClick={() => navigate('/new-campaign')} className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-all text-sm">
                    ✨ New Campaign
                  </button>
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
            <div ref={statsRef} className={`grid grid-cols-3 gap-6 transition-all duration-700 ${statsVisible ? 'opacity-100' : 'opacity-0'}`}>
              {[[50,'K+','Content Pieces'],[2.3,'M+','Words Generated'],[30,'s','Avg. Time']].map(([to, suf, label]) => (
                <div key={label}>
                  <div className="text-2xl font-black text-white">
                    {typeof to === 'number' && to > 10 ? <><Counter to={to}/>{suf}</> : `${to}${suf}`}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="relative">
            <HeroVisual onOpenDemo={() => setShowDemo(true)} />
          </div>
        </div>
      </section>

      {/* ── Features grid ────────────────────────────────────────────────── */}
      <section className="border-t border-gray-800 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/10 border border-amber-400/20 rounded-full text-amber-400 text-xs font-bold mb-4 uppercase tracking-widest">
              Everything Included
            </div>
            <h2 className="text-4xl font-black text-white mb-3">One platform. Everything viral.</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Stop juggling 10 different tools. IVey has everything you need to create, design, post, and track viral marketing content.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES_PREVIEW.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
          </div>
          <div className="text-center mt-8">
            <Link to="/features" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl font-semibold text-sm hover:bg-gray-700 transition-all">
              See all features →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Gallery ──────────────────────────────────────────────────────── */}
      <section className="border-t border-gray-800">
        <GallerySection user={user} />
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="border-t border-gray-800 relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-amber-500/5 rounded-full blur-3xl"/>
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-5xl font-black text-white mb-4 leading-tight">
            {isAuthenticated ? `Welcome back, ${displayName}!` : 'Ready to go viral?'}
          </h2>
          <p className="text-gray-400 mb-10 text-lg leading-relaxed">
            {isAuthenticated ? 'Your campaigns are waiting. Jump back in and keep creating.' : 'Join creators and businesses using IVey to generate viral marketing content in seconds.'}
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
          <p className="text-xs text-gray-600 mt-4">No credit card required · Cancel anytime</p>
        </div>
      </section>

    </div>
  );
};

export default Home;