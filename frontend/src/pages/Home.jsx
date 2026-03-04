import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

// All content formats to cycle through
const ALL_FORMATS = [
  { label: 'TikTok',         color: 'purple' },
  { label: 'Instagram',      color: 'blue'   },
  { label: 'Email',          color: 'green'  },
  { label: 'YouTube',        color: 'red'    },
  { label: 'Facebook',       color: 'blue'   },
  { label: 'Twitter/X',      color: 'gray'   },
  { label: 'LinkedIn',       color: 'blue'   },
  { label: 'Banner Ad',      color: 'yellow' },
  { label: 'SMS',            color: 'green'  },
  { label: 'Blog Post',      color: 'purple' },
  { label: 'Press Release',  color: 'gray'   },
  { label: 'Podcast Script', color: 'red'    },
  { label: 'WhatsApp',       color: 'green'  },
];

const TAG_COLORS = {
  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  blue:   'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  green:  'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  red:    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  gray:   'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
};

const BRIEF_LINES = [
  'Njambi Spot — comfort food for Nairobi',
  'Target: busy professionals & families',
  'Tone: warm, homey, appetite-driven ✦',
];

const TYPING_SPEED = 38;

// ─── Animated Campaign Brief Card ────────────────────────────────────────────
const CampaignBriefCard = () => {
  const [phase, setPhase]             = useState('idle');
  const [typedLines, setTypedLines]   = useState(['', '', '']);
  const [visibleTags, setVisibleTags] = useState([ALL_FORMATS[0], ALL_FORMATS[1], ALL_FORMATS[2]]);
  const [progressPct, setProgressPct] = useState(0);
  const [showDone, setShowDone]       = useState(false);
  const timeoutsRef                   = useRef([]);

  const clearAll = () => { timeoutsRef.current.forEach(clearTimeout); timeoutsRef.current = []; };
  const schedule = (fn, delay) => { const id = setTimeout(fn, delay); timeoutsRef.current.push(id); return id; };

  const resetCard = () => {
    clearAll();
    setPhase('idle');
    setTypedLines(['', '', '']);
    setVisibleTags([ALL_FORMATS[0], ALL_FORMATS[1], ALL_FORMATS[2]]);
    setProgressPct(0);
    setShowDone(false);
  };

  const startProgress = () => {
    setPhase('progress');
    setProgressPct(0);
    let pct = 0;
    const tick = () => {
      pct += 1;
      setProgressPct(pct);
      if (pct < 100) {
        schedule(tick, 22);
      } else {
        schedule(() => {
          setShowDone(true);
          setPhase('done');
          schedule(resetCard, 2800);
        }, 300);
      }
    };
    schedule(tick, 100);
  };

  const startFormatting = () => {
    setPhase('formatting');
    let delay = 0;
    ALL_FORMATS.forEach((_, i) => {
      schedule(() => {
        setVisibleTags(ALL_FORMATS.slice(Math.max(0, i - 1), Math.max(0, i - 1) + 3));
      }, delay);
      delay += 180;
    });
    schedule(() => startProgress(), delay + 200);
  };

  const startTyping = () => {
    setPhase('typing');
    let totalDelay = 0;
    BRIEF_LINES.forEach((line, lineIdx) => {
      for (let charIdx = 1; charIdx <= line.length; charIdx++) {
        const captured = charIdx;
        schedule(() => {
          setTypedLines(prev => {
            const next = [...prev];
            next[lineIdx] = line.slice(0, captured);
            return next;
          });
          if (lineIdx === BRIEF_LINES.length - 1 && captured === line.length) {
            schedule(() => startFormatting(), 400);
          }
        }, totalDelay);
        totalDelay += TYPING_SPEED;
      }
      totalDelay += 200;
    });
  };

  const handleDemo = () => {
    if (phase !== 'idle') { resetCard(); return; }
    startTyping();
  };

  useEffect(() => () => clearAll(), []);

  const isRunning = phase !== 'idle' && phase !== 'done';

  return (
    <div className={`
      relative bg-white dark:bg-gray-800 rounded-lg md:rounded-xl shadow-lg p-4 md:p-6
      transition-all duration-500
      ${isRunning ? 'ring-2 ring-purple-500/60 shadow-purple-500/20 shadow-xl' : ''}
      ${showDone  ? 'ring-2 ring-green-500/60 shadow-green-500/20 shadow-xl' : ''}
    `}>

      {/* Pulsing glow when running */}
      {isRunning && (
        <div className="absolute inset-0 rounded-lg md:rounded-xl pointer-events-none animate-pulse bg-purple-500/5" />
      )}

      {/* Header row */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 md:w-8 md:h-8 bg-purple-600 rounded-md md:rounded-lg transition-all duration-300 ${isRunning ? 'animate-pulse' : ''}`} />
          <span className="font-semibold text-sm md:text-base text-gray-900 dark:text-white">Campaign Brief</span>
        </div>

        {!showDone ? (
          <button
            onClick={handleDemo}
            className={`
              text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-200
              ${phase === 'idle'
                ? 'bg-purple-600 text-white hover:bg-purple-700 hover:scale-105 shadow-sm shadow-purple-500/30'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400'}
            `}
          >
            {phase === 'idle' ? '▶ Watch Demo' : '✕ Reset'}
          </button>
        ) : (
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 animate-pulse">
            ✓ Ready
          </span>
        )}
      </div>

      {/* Typed brief lines */}
      <div className="space-y-2 md:space-y-3 mb-4 md:mb-5 min-h-[60px]">
        {BRIEF_LINES.map((fullLine, i) => (
          <div key={i} className="relative h-4 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-400 to-blue-400 dark:from-purple-500 dark:to-blue-500 rounded flex items-center transition-all duration-75"
              style={{ width: `${(typedLines[i].length / fullLine.length) * 100}%` }}
            >
              {typedLines[i] && (
                <span className="absolute left-2 text-white whitespace-nowrap font-medium" style={{ fontSize: '9px' }}>
                  {typedLines[i]}
                  {phase === 'typing' && typedLines[i].length < fullLine.length && (
                    <span className="animate-ping ml-0.5 opacity-75">|</span>
                  )}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Format tags */}
      <div className="flex gap-2 flex-wrap min-h-[26px] mb-4">
        {visibleTags.map((tag, i) => (
          <span
            key={`${tag.label}-${i}`}
            className={`
              px-2 md:px-3 py-1 rounded-full text-xs font-medium transition-all duration-200
              ${TAG_COLORS[tag.color]}
              ${phase === 'formatting' ? 'scale-105' : ''}
            `}
          >
            {tag.label}
          </span>
        ))}
      </div>

      {/* Bottom status: spinner → progress bar → done */}
      <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-gray-400 min-h-[20px]">
        {(phase === 'idle' || phase === 'typing' || phase === 'formatting') && (
          <>
            <svg className="w-3 h-3 md:w-4 md:h-4 animate-spin text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className={phase !== 'idle' ? 'text-purple-600 dark:text-purple-400 font-medium' : ''}>
              {phase === 'idle'       && 'AI generating content...'}
              {phase === 'typing'     && 'Writing brief...'}
              {phase === 'formatting' && 'Selecting formats...'}
            </span>
          </>
        )}

        {phase === 'progress' && (
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-75"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-purple-600 dark:text-purple-400 font-bold text-xs w-8 text-right tabular-nums">
              {progressPct}%
            </span>
          </div>
        )}

        {phase === 'done' && (
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 h-2 bg-green-200 dark:bg-green-900/40 rounded-full overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" />
            </div>
            <span className="text-green-600 dark:text-green-400 font-bold text-xs">Done ✓</span>
          </div>
        )}
      </div>

      {/* Done success message */}
      {showDone && (
        <div className="mt-3 p-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
          <p className="text-green-700 dark:text-green-300 text-xs font-semibold">
            🎉 13 content pieces generated in 31s
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Home Page ────────────────────────────────────────────────────────────────
const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.name || user?.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors pt-16 md:pt-20">

      {/* Hero Section */}
      <div className="px-4 md:px-6 lg:px-12 py-8 md:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* Left Column */}
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

            {/* Social Proof */}
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

          {/* Right Column — Animated Card */}
          <div className="relative mt-8 lg:mt-0">
            <div className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8">
              <CampaignBriefCard />
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
            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl md:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg md:rounded-xl flex items-center justify-center mb-4 md:mb-6">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 md:mb-3">15+ Content Formats</h3>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Generate TikTok scripts, Instagram captions, YouTube ads, email campaigns, and more from one brief.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl md:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg md:rounded-xl flex items-center justify-center mb-4 md:mb-6">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 md:mb-3">Lightning Fast</h3>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Generate comprehensive marketing strategies and content in 30 seconds, not 30 minutes.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl md:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 md:col-span-2 lg:col-span-1">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 dark:bg-green-900/30 rounded-lg md:rounded-xl flex items-center justify-center mb-4 md:mb-6">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 md:mb-3">Multi-AI Power</h3>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Choose between Claude, GPT-4, and Gemini for optimal results based on your content type.</p>
            </div>
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
            {isAuthenticated
              ? 'Your campaigns are waiting. Jump back in and keep creating.'
              : 'Join thousands of marketers using AI to create viral content that converts.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <button onClick={() => navigate('/dashboard')} className="px-6 md:px-8 py-3 md:py-4 bg-green-600 text-white rounded-lg md:rounded-xl font-semibold text-base md:text-lg hover:bg-green-700 transition-colors">
                  🚀 Go to Dashboard
                </button>
                <button onClick={() => navigate('/new-campaign')} className="px-6 md:px-8 py-3 md:py-4 border-2 border-purple-400 dark:border-purple-600 text-purple-700 dark:text-purple-300 rounded-lg md:rounded-xl font-semibold text-base md:text-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                  ✨ New Campaign
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/signup')} className="px-6 md:px-8 py-3 md:py-4 bg-purple-600 text-white rounded-lg md:rounded-xl font-semibold text-base md:text-lg hover:bg-purple-700 transition-colors">
                  Start Free Trial
                </button>
                <Link to="/pricing" className="px-6 md:px-8 py-3 md:py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg md:rounded-xl font-semibold text-base md:text-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                  View Pricing
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;