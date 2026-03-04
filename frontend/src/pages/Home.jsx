import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

// ─── Demo Data ────────────────────────────────────────────────────────────────
const DEMO_DATA = {
  name:        'Summer Fitness Challenge',
  description: 'A 30-day fitness challenge targeting gym-goers and home workout enthusiasts. We want to drive sign-ups for our new app launch, highlight transformation stories, and create urgency with limited-time offers.',
  audience:    'Young adults 18–35, fitness enthusiasts, health-conscious professionals',
  formats:     ['TikTok Script', 'Instagram Caption', 'Email Campaign', 'YouTube Ad', 'Facebook Post'],
  provider:    'Claude (Anthropic)',
};

const TYPING_SPEED = 28; // ms per char

const TAG_COLORS = {
  'TikTok Script':     'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700',
  'Instagram Caption': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  'Email Campaign':    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
  'YouTube Ad':        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',
  'Facebook Post':     'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700',
};

const ALL_FORMAT_OPTIONS = [
  'TikTok Script', 'Instagram Caption', 'Email Campaign',
  'YouTube Ad', 'Facebook Post', 'LinkedIn Post', 'SMS', 'Banner Ad',
];

const PROVIDERS = ['Claude (Anthropic)', 'GPT-4 (OpenAI)', 'Gemini (Google)'];

// ─── Step definitions ─────────────────────────────────────────────────────────
// Each step has a label, field highlight, and how long it takes
const STEPS = [
  { id: 'name',     label: 'Campaign Name',     icon: '📝' },
  { id: 'desc',     label: 'Description',        icon: '📄' },
  { id: 'audience', label: 'Target Audience',    icon: '🎯' },
  { id: 'formats',  label: 'Output Formats',     icon: '📱' },
  { id: 'provider', label: 'AI Provider',        icon: '🤖' },
  { id: 'submit',   label: 'Creating Campaign',  icon: '🚀' },
  { id: 'done',     label: 'Campaign Created!',  icon: '🎉' },
];

// ─── Typewriter hook ──────────────────────────────────────────────────────────
const useTypewriter = () => {
  const timers = useRef([]);
  const clear  = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const type   = (text, setter, speed, onDone) => {
    clear();
    setter('');
    let i = 0;
    const tick = () => {
      i++;
      setter(text.slice(0, i));
      if (i < text.length) {
        const id = setTimeout(tick, speed);
        timers.current.push(id);
      } else {
        if (onDone) { const id = setTimeout(onDone, 300); timers.current.push(id); }
      }
    };
    const id = setTimeout(tick, 80);
    timers.current.push(id);
  };
  return { type, clear };
};

// ─── Campaign Demo Modal ──────────────────────────────────────────────────────
const CampaignDemoModal = ({ onClose }) => {
  const [stepIdx,      setStepIdx]      = useState(0);
  const [paused,       setPaused]       = useState(false);
  const [nameVal,      setNameVal]      = useState('');
  const [descVal,      setDescVal]      = useState('');
  const [audienceVal,  setAudienceVal]  = useState('');
  const [selFormats,   setSelFormats]   = useState([]);
  const [selProvider,  setSelProvider]  = useState('');
  const [progress,     setProgress]     = useState(0);
  const [done,         setDone]         = useState(false);

  const pausedRef  = useRef(false);
  const stepRef    = useRef(0);
  const mainTimers = useRef([]);
  const { type: typeText, clear: clearType } = useTypewriter();

  const sched = useCallback((fn, delay) => {
    const id = setTimeout(() => { if (!pausedRef.current) fn(); }, delay);
    mainTimers.current.push(id);
  }, []);

  const clearAll = () => {
    mainTimers.current.forEach(clearTimeout);
    mainTimers.current = [];
    clearType();
  };

  // ── advance step ────────────────────────────────────────────────────────────
  const goStep = useCallback((idx) => {
    if (idx >= STEPS.length) return;
    stepRef.current = idx;
    setStepIdx(idx);
  }, []);

  // ── run a step ──────────────────────────────────────────────────────────────
  const runStep = useCallback((idx) => {
    if (pausedRef.current) return;
    goStep(idx);
    const step = STEPS[idx];

    if (step.id === 'name') {
      typeText(DEMO_DATA.name, setNameVal, TYPING_SPEED, () => runStep(idx + 1));
    }

    else if (step.id === 'desc') {
      typeText(DEMO_DATA.description, setDescVal, 18, () => runStep(idx + 1));
    }

    else if (step.id === 'audience') {
      typeText(DEMO_DATA.audience, setAudienceVal, TYPING_SPEED, () => runStep(idx + 1));
    }

    else if (step.id === 'formats') {
      let delay = 400;
      DEMO_DATA.formats.forEach((fmt, i) => {
        const id = setTimeout(() => {
          if (!pausedRef.current) setSelFormats(prev => [...prev, fmt]);
          if (i === DEMO_DATA.formats.length - 1 && !pausedRef.current) {
            const id2 = setTimeout(() => runStep(idx + 1), 600);
            mainTimers.current.push(id2);
          }
        }, delay);
        mainTimers.current.push(id);
        delay += 400;
      });
    }

    else if (step.id === 'provider') {
      sched(() => {
        setSelProvider(DEMO_DATA.provider);
        sched(() => runStep(idx + 1), 800);
      }, 400);
    }

    else if (step.id === 'submit') {
      let pct = 0;
      const tick = () => {
        if (pausedRef.current) return;
        pct += 1;
        setProgress(pct);
        if (pct < 100) {
          const id = setTimeout(tick, 25);
          mainTimers.current.push(id);
        } else {
          const id = setTimeout(() => { if (!pausedRef.current) runStep(idx + 1); }, 400);
          mainTimers.current.push(id);
        }
      };
      setTimeout(tick, 300);
    }

    else if (step.id === 'done') {
      setDone(true);
    }
  }, [goStep, sched, typeText]);

  // Start on mount
  useEffect(() => { runStep(0); return () => clearAll(); }, []);

  // ── pause / resume ───────────────────────────────────────────────────────────
  const togglePause = () => {
    if (!paused) {
      // pause
      pausedRef.current = true;
      clearAll();
      setPaused(true);
    } else {
      // resume — re-run from current step but preserve typed content
      pausedRef.current = false;
      setPaused(false);
      const cur = stepRef.current;
      const step = STEPS[cur];

      // For typing steps resume from where we left off
      if (step.id === 'name') {
        typeText(DEMO_DATA.name, setNameVal, TYPING_SPEED, () => runStep(cur + 1));
      } else if (step.id === 'desc') {
        typeText(DEMO_DATA.description, setDescVal, 18, () => runStep(cur + 1));
      } else if (step.id === 'audience') {
        typeText(DEMO_DATA.audience, setAudienceVal, TYPING_SPEED, () => runStep(cur + 1));
      } else {
        runStep(cur);
      }
    }
  };

  // ── skip to next step ────────────────────────────────────────────────────────
  const skipStep = () => {
    clearAll();
    pausedRef.current = false;
    setPaused(false);
    const cur = stepRef.current;
    const step = STEPS[cur];

    // Fill current step instantly
    if (step.id === 'name')     { setNameVal(DEMO_DATA.name); }
    if (step.id === 'desc')     { setDescVal(DEMO_DATA.description); }
    if (step.id === 'audience') { setAudienceVal(DEMO_DATA.audience); }
    if (step.id === 'formats')  { setSelFormats(DEMO_DATA.formats); }
    if (step.id === 'provider') { setSelProvider(DEMO_DATA.provider); }
    if (step.id === 'submit')   { setProgress(100); }

    const nextIdx = cur + 1;
    if (nextIdx < STEPS.length) {
      const id = setTimeout(() => runStep(nextIdx), 200);
      mainTimers.current.push(id);
    }
  };

  const currentStep = STEPS[stepIdx];
  const isLastStep  = stepIdx === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 py-6"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 flex flex-col">

        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Create a Campaign — Demo</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Watch how IVey generates viral content in seconds</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Step Progress Bar ── */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-1 mb-1">
            {STEPS.slice(0, -1).map((s, i) => (
              <div key={s.id} className="flex items-center gap-1 flex-1">
                <div className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                  i < stepIdx ? 'bg-purple-600' : i === stepIdx ? 'bg-purple-400' : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
              {currentStep.icon} {currentStep.label}
            </span>
            <span className="text-xs text-gray-400">Step {Math.min(stepIdx + 1, STEPS.length - 1)} of {STEPS.length - 1}</span>
          </div>
        </div>

        {/* ── Form Body ── */}
        <div className="px-6 py-4 flex-1 space-y-5">

          {/* Campaign Name */}
          <div className={`transition-all duration-300 ${stepIdx >= 0 ? 'opacity-100' : 'opacity-30'}`}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Campaign Name
              {stepIdx === 0 && <span className="ml-2 text-xs text-purple-500 animate-pulse">● typing...</span>}
            </label>
            <div className={`w-full px-4 py-3 border-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm min-h-[46px] transition-all duration-200 ${
              stepIdx === 0 ? 'border-purple-500 shadow-sm shadow-purple-200 dark:shadow-purple-900/30' : 'border-gray-200 dark:border-gray-700'
            }`}>
              {nameVal || <span className="text-gray-400 dark:text-gray-500">e.g. Summer Sale Campaign</span>}
              {stepIdx === 0 && nameVal.length < DEMO_DATA.name.length && (
                <span className="animate-pulse text-purple-500 ml-0.5">|</span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className={`transition-all duration-300 ${stepIdx >= 1 ? 'opacity-100' : 'opacity-30'}`}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Campaign Description
              {stepIdx === 1 && <span className="ml-2 text-xs text-purple-500 animate-pulse">● typing...</span>}
            </label>
            <div className={`w-full px-4 py-3 border-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm min-h-[88px] leading-relaxed transition-all duration-200 ${
              stepIdx === 1 ? 'border-purple-500 shadow-sm shadow-purple-200 dark:shadow-purple-900/30' : 'border-gray-200 dark:border-gray-700'
            }`}>
              {descVal || <span className="text-gray-400 dark:text-gray-500">Describe your campaign goals, product, and key messages...</span>}
              {stepIdx === 1 && descVal.length < DEMO_DATA.description.length && (
                <span className="animate-pulse text-purple-500 ml-0.5">|</span>
              )}
            </div>
          </div>

          {/* Target Audience */}
          <div className={`transition-all duration-300 ${stepIdx >= 2 ? 'opacity-100' : 'opacity-30'}`}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Target Audience
              {stepIdx === 2 && <span className="ml-2 text-xs text-purple-500 animate-pulse">● typing...</span>}
            </label>
            <div className={`w-full px-4 py-3 border-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm min-h-[46px] transition-all duration-200 ${
              stepIdx === 2 ? 'border-purple-500 shadow-sm shadow-purple-200 dark:shadow-purple-900/30' : 'border-gray-200 dark:border-gray-700'
            }`}>
              {audienceVal || <span className="text-gray-400 dark:text-gray-500">e.g. Young adults 18–35 interested in fitness</span>}
              {stepIdx === 2 && audienceVal.length < DEMO_DATA.audience.length && (
                <span className="animate-pulse text-purple-500 ml-0.5">|</span>
              )}
            </div>
          </div>

          {/* Output Formats */}
          <div className={`transition-all duration-300 ${stepIdx >= 3 ? 'opacity-100' : 'opacity-30'}`}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Output Formats
              {stepIdx === 3 && <span className="ml-2 text-xs text-purple-500 animate-pulse">● selecting...</span>}
            </label>
            <div className={`p-3 border-2 rounded-xl bg-gray-50 dark:bg-gray-800 transition-all duration-200 ${
              stepIdx === 3 ? 'border-purple-500 shadow-sm shadow-purple-200 dark:shadow-purple-900/30' : 'border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex flex-wrap gap-2">
                {ALL_FORMAT_OPTIONS.map(fmt => {
                  const selected = selFormats.includes(fmt);
                  const justSelected = selected && stepIdx === 3;
                  return (
                    <span key={fmt} className={`
                      px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300
                      ${selected
                        ? `${TAG_COLORS[fmt] || 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300'} ${justSelected ? 'scale-110' : 'scale-100'}`
                        : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600'
                      }
                    `}>
                      {selected ? '✓ ' : ''}{fmt}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI Provider */}
          <div className={`transition-all duration-300 ${stepIdx >= 4 ? 'opacity-100' : 'opacity-30'}`}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              AI Provider
              {stepIdx === 4 && <span className="ml-2 text-xs text-purple-500 animate-pulse">● selecting...</span>}
            </label>
            <div className={`p-3 border-2 rounded-xl bg-gray-50 dark:bg-gray-800 transition-all duration-200 ${
              stepIdx === 4 ? 'border-purple-500 shadow-sm shadow-purple-200 dark:shadow-purple-900/30' : 'border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex flex-wrap gap-2">
                {PROVIDERS.map(p => (
                  <span key={p} className={`
                    px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300
                    ${selProvider === p
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-400 scale-105'
                      : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600'}
                  `}>
                    {selProvider === p ? '✓ ' : ''}{p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Submit / Progress */}
          {stepIdx >= 5 && (
            <div className="pt-2">
              {!done ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 font-medium flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      AI generating your campaign...
                    </span>
                    <span className="font-bold text-purple-600 dark:text-purple-400 tabular-nums">{progress}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 rounded-full transition-all duration-75 bg-[length:200%_100%] animate-shimmer"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                    {progress < 30 && 'Analysing campaign brief...'}
                    {progress >= 30 && progress < 60 && 'Building marketing strategy...'}
                    {progress >= 60 && progress < 85 && 'Generating content for each format...'}
                    {progress >= 85 && 'Finalising and polishing content...'}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-5 text-center space-y-3">
                  <div className="text-3xl">🎉</div>
                  <h3 className="text-base font-bold text-green-700 dark:text-green-300">Campaign Created Successfully!</h3>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    <strong>"{DEMO_DATA.name}"</strong> is ready with {DEMO_DATA.formats.length} content pieces across {DEMO_DATA.formats.length} formats — generated in 31 seconds.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center pt-1">
                    {DEMO_DATA.formats.map(fmt => (
                      <span key={fmt} className={`px-2.5 py-1 rounded-full text-xs font-medium border ${TAG_COLORS[fmt] || 'bg-purple-100 text-purple-700 border-purple-300'}`}>
                        ✓ {fmt}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors shadow-sm"
                  >
                    Try It Yourself →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Controls Footer ── */}
        {!done && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl flex items-center justify-between gap-3 sticky bottom-0">
            <button
              onClick={togglePause}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {paused ? (
                <>
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Resume
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                  Pause
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              {!isLastStep && (
                <button
                  onClick={skipStep}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  Skip Step
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Static Campaign Brief Card (homepage) ───────────────────────────────────
const CampaignBriefCard = ({ onOpenDemo }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg md:rounded-xl shadow-lg p-4 md:p-6">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-6 h-6 md:w-8 md:h-8 bg-purple-600 rounded-md md:rounded-lg" />
      <span className="font-semibold text-sm md:text-base text-gray-900 dark:text-white">Campaign Brief</span>
    </div>
    <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
      <div className="h-3 md:h-4 bg-gray-100 dark:bg-gray-700 rounded w-3/4" />
      <div className="h-3 md:h-4 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
      <div className="h-3 md:h-4 bg-gray-100 dark:bg-gray-700 rounded w-5/6" />
    </div>
    <div className="flex gap-2 mb-5">
      <div className="px-2 md:px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs">TikTok</div>
      <div className="px-2 md:px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">Instagram</div>
      <div className="px-2 md:px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs">Email</div>
    </div>

    {/* Demo button */}
    <button
      onClick={onOpenDemo}
      className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
      Watch Campaign Demo
    </button>

    <div className="flex justify-center mt-4">
      <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-gray-400">
        <svg className="w-3 h-3 md:w-4 md:h-4 animate-spin text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>AI generating content...</span>
      </div>
    </div>
  </div>
);

// ─── Home Page ────────────────────────────────────────────────────────────────
const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);

  const displayName = user?.name || user?.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors pt-16 md:pt-20">

      {/* Demo Modal */}
      {showDemo && <CampaignDemoModal onClose={() => setShowDemo(false)} />}

      {/* Hero */}
      <div className="px-4 md:px-6 lg:px-12 py-8 md:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs md:text-sm mb-4 md:mb-6">
              <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>AI-Powered Marketing</span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-4 md:mb-6">
              Generate Viral Marketing Content
              <span className="text-purple-600 dark:text-purple-400"> in Seconds</span>
            </h1>

            <p className="text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-6 md:mb-8 max-w-lg">
              Create TikTok scripts, Instagram captions, email campaigns, and 13+ content formats using advanced AI. Built for marketing agencies and brands.
            </p>

            {isAuthenticated && (
              <div className="flex items-center gap-2 mb-5 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl w-fit">
                <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                  👋 Welcome back, {displayName}!
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              {isAuthenticated ? (
                <>
                  <button onClick={() => navigate('/dashboard')} className="px-6 md:px-8 py-3 md:py-4 bg-green-600 text-white rounded-lg md:rounded-xl font-semibold text-base md:text-lg hover:bg-green-700 transition-colors text-center">
                    🚀 Go to Dashboard
                  </button>
                  <button onClick={() => navigate('/new-campaign')} className="px-6 md:px-8 py-3 md:py-4 border-2 border-purple-400 dark:border-purple-600 text-purple-700 dark:text-purple-300 rounded-lg md:rounded-xl font-semibold text-base md:text-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-center">
                    ✨ New Campaign
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => navigate('/signup')} className="px-6 md:px-8 py-3 md:py-4 bg-purple-600 text-white rounded-lg md:rounded-xl font-semibold text-base md:text-lg hover:bg-purple-700 transition-colors text-center">
                    Start Free Trial
                  </button>
                  <button onClick={() => navigate('/login')} className="px-6 md:px-8 py-3 md:py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg md:rounded-xl font-semibold text-base md:text-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors text-center">
                    Sign In
                  </button>
                </>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 md:flex md:items-center md:gap-8 mt-8 md:mt-12">
              <div className="text-center md:text-left">
                <div className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">50K+</div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Content pieces</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">2.3M+</div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Words written</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">30s</div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Avg. time</div>
              </div>
            </div>
          </div>

          {/* Right — Card with Demo Button */}
          <div className="relative mt-8 lg:mt-0">
            <div className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8">
              <CampaignBriefCard onOpenDemo={() => setShowDemo(true)} />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-4 md:px-6 lg:px-12 py-12 md:py-16 lg:py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need to create viral content
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Stop spending hours writing content. Let AI do the heavy lifting while you focus on strategy.
            </p>
          </div>
          <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              { color: 'purple', title: '15+ Content Formats', desc: 'Generate TikTok scripts, Instagram captions, YouTube ads, email campaigns, and more from one brief.', path: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
              { color: 'blue',   title: 'Lightning Fast',     desc: 'Generate comprehensive marketing strategies and content in 30 seconds, not 30 minutes.',              path: 'M13 10V3L4 14h7v7l9-11h-7z' },
              { color: 'green',  title: 'Multi-AI Power',     desc: 'Choose between Claude, GPT-4, and Gemini for optimal results based on your content type.',            path: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
            ].map(({ color, title, desc, path }) => (
              <div key={title} className={`bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl md:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 ${color === 'green' ? 'md:col-span-2 lg:col-span-1' : ''}`}>
                <div className={`w-10 h-10 md:w-12 md:h-12 bg-${color}-100 dark:bg-${color}-900/30 rounded-lg md:rounded-xl flex items-center justify-center mb-4 md:mb-6`}>
                  <svg className={`w-5 h-5 md:w-6 md:h-6 text-${color}-600 dark:text-${color}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 md:mb-3">{title}</h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-4 md:px-6 lg:px-12 py-12 md:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
            {isAuthenticated ? `Welcome back, ${displayName}!` : 'Ready to 10x your content creation speed?'}
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-400 mb-6 md:mb-8">
            {isAuthenticated ? 'Your campaigns are waiting. Jump back in and keep creating.' : 'Join thousands of marketers using AI to create viral content that converts.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <button onClick={() => navigate('/dashboard')} className="px-6 md:px-8 py-3 md:py-4 bg-green-600 text-white rounded-lg md:rounded-xl font-semibold text-base md:text-lg hover:bg-green-700 transition-colors">🚀 Go to Dashboard</button>
                <button onClick={() => navigate('/new-campaign')} className="px-6 md:px-8 py-3 md:py-4 border-2 border-purple-400 dark:border-purple-600 text-purple-700 dark:text-purple-300 rounded-lg md:rounded-xl font-semibold text-base md:text-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">✨ New Campaign</button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/signup')} className="px-6 md:px-8 py-3 md:py-4 bg-purple-600 text-white rounded-lg md:rounded-xl font-semibold text-base md:text-lg hover:bg-purple-700 transition-colors">Start Free Trial</button>
                <Link to="/pricing" className="px-6 md:px-8 py-3 md:py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg md:rounded-xl font-semibold text-base md:text-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors">View Pricing</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;