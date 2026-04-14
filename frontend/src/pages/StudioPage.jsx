// frontend/src/pages/StudioPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The core IVey workflow in one place — no tabs, no hunting
// Step 1: Pick campaign
// Step 2: Generate script
// Step 3: Produce video with HeyGen
// Step 4: Distribute to social media
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import DistributeModal from '../components/DistributeModal';

const API_URL = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';
const token   = () => localStorage.getItem('token');

const headers      = () => ({ Authorization: `Bearer ${token()}` });
const jsonHeaders  = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

// ── Step indicator ────────────────────────────────────────────────────────────
const Step = ({ number, label, active, done }) => (
  <div className={`flex items-center gap-2 ${active ? 'opacity-100' : done ? 'opacity-70' : 'opacity-30'}`}>
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 transition-all ${
      done   ? 'bg-emerald-500 text-white' :
      active ? 'bg-amber-400 text-gray-900' :
               'bg-gray-200 dark:bg-gray-700 text-gray-500'
    }`}>
      {done ? '✓' : number}
    </div>
    <span className={`text-sm font-semibold hidden sm:block ${
      active ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
    }`}>{label}</span>
  </div>
);

const Divider = ({ done }) => (
  <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all ${done ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`}/>
);

// ── Script display with copy ──────────────────────────────────────────────────
const ScriptDisplay = ({ script, onCopy, copied }) => (
  <div className="bg-gray-900 rounded-xl p-4 max-h-64 overflow-y-auto border border-gray-700">
    <pre className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed font-mono">{script}</pre>
    <button onClick={onCopy}
      className={`mt-3 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
        copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}>
      {copied ? '✅ Copied' : '📋 Copy Script'}
    </button>
  </div>
);

// ── Platform chips ────────────────────────────────────────────────────────────
const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', emoji: '📸', color: 'border-pink-500 bg-pink-500/10 text-pink-400'    },
  { id: 'tiktok',    label: 'TikTok',    emoji: '🎵', color: 'border-cyan-500 bg-cyan-500/10 text-cyan-400'    },
  { id: 'facebook',  label: 'Facebook',  emoji: '📘', color: 'border-blue-500 bg-blue-500/10 text-blue-400'    },
  { id: 'linkedin',  label: 'LinkedIn',  emoji: '💼', color: 'border-indigo-500 bg-indigo-500/10 text-indigo-400' },
  { id: 'youtube',   label: 'YouTube',   emoji: '▶️', color: 'border-red-500 bg-red-500/10 text-red-400'       },
];

// ── Main ──────────────────────────────────────────────────────────────────────
const StudioPage = ({ embedded = false }) => {
  // Step tracking
  const [step, setStep] = useState(1); // 1=campaign, 2=script, 3=produce, 4=distribute

  // Step 1 — Campaign
  const [campaigns,        setCampaigns]        = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  // Step 2 — Script
  const [script,           setScript]           = useState('');
  const [viralScore,       setViralScore]        = useState(null);
  const [seconds,          setSeconds]           = useState(null);
  const [winnerHook,       setWinnerHook]        = useState(null);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [scriptStage,      setScriptStage]      = useState('');
  const [copied,           setCopied]           = useState(false);

  // Step 3 — HeyGen
  const [heygenConfigured, setHeygenConfigured] = useState(null);
  const [avatars,          setAvatars]          = useState([]);
  const [voices,           setVoices]           = useState([]);
  const [avatarId,         setAvatarId]         = useState('');
  const [voiceId,          setVoiceId]          = useState('');
  const [aspectRatio,      setAspectRatio]      = useState('9:16');
  const [producing,        setProducing]        = useState(false);
  const [videoJobId,       setVideoJobId]       = useState(null);
  const [videoStatus,      setVideoStatus]      = useState(null); // processing|completed|failed
  const [videoUrl,         setVideoUrl]         = useState('');
  const [manualUrl,        setManualUrl]        = useState('');
  const [loadingAssets,    setLoadingAssets]    = useState(false);
  const pollRef = useRef(null);

  // Step 4 — Distribute
  const [distributeOpen,   setDistributeOpen]   = useState(false);

  // General
  const [error,            setError]            = useState('');
  const [upgradeModal,     setUpgradeModal]     = useState(null);
  const [toast,            setToast]            = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchCampaigns();
    checkHeyGen();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // ── Fetch campaigns ───────────────────────────────────────────────────────
  const fetchCampaigns = async () => {
    try {
      const res  = await fetch(`${API_URL}/campaigns`, { headers: headers() });
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch {}
    finally { setLoadingCampaigns(false); }
  };

  // ── Check HeyGen status ───────────────────────────────────────────────────
  const checkHeyGen = async () => {
    try {
      const res  = await fetch(`${API_URL}/heygen/status`, { headers: headers() });
      const data = await res.json();
      setHeygenConfigured(data.configured);
      if (data.configured) loadHeyGenAssets();
    } catch { setHeygenConfigured(false); }
  };

  const loadHeyGenAssets = async () => {
    setLoadingAssets(true);
    try {
      const [avRes, voRes] = await Promise.all([
        fetch(`${API_URL}/heygen/avatars`, { headers: headers() }),
        fetch(`${API_URL}/heygen/voices`,  { headers: headers() }),
      ]);
      const avData = await avRes.json();
      const voData = await voRes.json();
      const avList = avData.avatars || [];
      const voList = (voData.voices || []).filter(v => v.language === 'English' || !v.language);
      setAvatars(avList);
      setVoices(voList);
      if (avList[0]) setAvatarId(avList[0].avatar_id);
      if (voList[0]) setVoiceId(voList[0].voice_id);
    } catch {}
    finally { setLoadingAssets(false); }
  };

  // ── Select campaign ───────────────────────────────────────────────────────
  const handleSelectCampaign = (c) => {
    setSelectedCampaign(c);
    setScript(''); setViralScore(null); setSeconds(null); setWinnerHook(null);
    setVideoUrl(''); setVideoJobId(null); setVideoStatus(null);
    setError('');
    setStep(2);
    if (pollRef.current) clearInterval(pollRef.current);
  };

  // ── Generate script ───────────────────────────────────────────────────────
  const STAGES = [
    '🧠 Excavating audience psychology...',
    '🔍 Analysing competitive landscape...',
    '🎭 Designing narrative arc...',
    '🎣 Running Hook Laboratory...',
    '✍️  Writing production script...',
    '📊 Scoring for viral potential...',
  ];

  const handleGenerateScript = async () => {
    if (!selectedCampaign) return;
    setGeneratingScript(true); setScript(''); setError('');
    setScriptStage(STAGES[0]);
    let idx = 0;
    const ticker = setInterval(() => {
      idx = Math.min(idx + 1, STAGES.length - 1);
      setScriptStage(STAGES[idx]);
    }, 8000);
    try {
      const res  = await fetch(`${API_URL}/campaigns/${selectedCampaign.id}/generate-script`, {
        method: 'POST', headers: jsonHeaders(),
        body: JSON.stringify({ ai_provider: selectedCampaign.ai_provider || 'gemini' }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.upgrade) {
          setUpgradeModal({ requiredPlan: data.required || 'starter', feature: data.message || 'Script generation' });
          return;
        }
        throw new Error(data.error || 'Failed to generate script');
      }
      setScript(data.script);
      setViralScore(data.viralScore);
      setSeconds(data.seconds);
      setWinnerHook(data.winnerHook);
      // Stay on step 2 — user reviews script then clicks Next
    } catch (err) { setError(err.message); }
    finally { clearInterval(ticker); setGeneratingScript(false); setScriptStage(''); }
  };

  // ── Produce video ─────────────────────────────────────────────────────────
  const handleProduce = async () => {
    if (!script?.trim() || !avatarId || !voiceId) return;
    setProducing(true); setError(''); setVideoStatus('processing');
    try {
      const res  = await fetch(`${API_URL}/heygen/generate`, {
        method: 'POST', headers: jsonHeaders(),
        body: JSON.stringify({
          campaignId: selectedCampaign.id, script, avatarId, voiceId, aspectRatio,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.upgrade) {
          setUpgradeModal({ requiredPlan: data.required || 'creator', feature: data.message || 'Video production' });
          return;
        }
        throw new Error(data.error || data.message || 'Failed to start production');
      }
      setVideoJobId(data.videoId);
      showToast('🎬 Video generation started — takes 5-10 minutes', 'info');
      startPolling(data.videoId);
    } catch (err) {
      setError(err.message);
      setVideoStatus(null);
    } finally { setProducing(false); }
  };

  const startPolling = (vid) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => pollVideoStatus(vid), 15000);
  };

  const pollVideoStatus = async (vid) => {
    try {
      const res  = await fetch(`${API_URL}/heygen/video/${vid}`, { headers: headers() });
      const data = await res.json();
      if (data.status === 'completed') {
        clearInterval(pollRef.current);
        setVideoStatus('completed');
        setVideoUrl(data.videoUrl);
        setStep(4);
        showToast('🎬 Video ready! Distribute it now.', 'success');
      }
      if (data.status === 'failed') {
        clearInterval(pollRef.current);
        setVideoStatus('failed');
        setError(data.error || 'Video generation failed');
      }
    } catch {}
  };

  const handleImportManualUrl = () => {
    if (!manualUrl.trim()) return;
    setVideoUrl(manualUrl.trim());
    setManualUrl('');
    setStep(4);
    showToast('✅ Video URL imported', 'success');
  };

  // ── Copy script ───────────────────────────────────────────────────────────
  const handleCopy = () => {
    const clean = script.replace(/#{1,6}\s*/g, '').replace(/\*\*(.*?)\*\*/g, '$1').trim();
    navigator.clipboard.writeText(clean);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const fmtDur = (s) => !s ? '' : s < 60 ? `${s}s` : `${Math.floor(s/60)}m${s%60>0?` ${s%60}s`:''}`;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={embedded ? '' : 'min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 py-10 px-4'}>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Studio</h1>
          <p className="text-sm text-gray-500 mt-0.5">Script → Produce → Distribute — all in one place</p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4">
          <Step number={1} label="Campaign" active={step === 1} done={step > 1} />
          <Divider done={step > 1} />
          <Step number={2} label="Script"   active={step === 2} done={step > 2} />
          <Divider done={step > 2} />
          <Step number={3} label="Produce"  active={step === 3} done={step > 3} />
          <Divider done={step > 3} />
          <Step number={4} label="Distribute" active={step === 4} done={false} />
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 bg-red-900/20 border border-red-800 text-red-400 rounded-xl text-sm flex items-center gap-2">
            <span>⚠️</span><span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300">✕</button>
          </div>
        )}

        {/* ── STEP 1: Campaign picker ── */}
        <div className={`bg-white dark:bg-gray-800 border rounded-2xl overflow-hidden transition-all ${
          step === 1 ? 'border-amber-400/50' : 'border-gray-200 dark:border-gray-700'
        }`}>
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${step > 1 ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-gray-900'}`}>
                {step > 1 ? '✓' : '1'}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Select Campaign</p>
                {selectedCampaign && step > 1 && (
                  <p className="text-xs text-gray-500 mt-0.5">{selectedCampaign.name}</p>
                )}
              </div>
            </div>
            {selectedCampaign && step > 1 && (
              <button onClick={() => setStep(1)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                Change →
              </button>
            )}
          </div>

          {step === 1 && (
            <div className="p-5">
              {loadingCampaigns ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"/>
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 mb-3">No campaigns yet</p>
                  <a href="/new-campaign" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all">
                    + Create Campaign
                  </a>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {campaigns.map(c => (
                    <button key={c.id} onClick={() => handleSelectCampaign(c)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-gray-200 dark:border-gray-700 hover:border-emerald-400 rounded-xl transition-all text-left group">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-sm flex-shrink-0">🎯</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.name}</p>
                        <p className="text-xs text-gray-500 truncate">{c.description || c.target_audience || ''}</p>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── STEP 2: Script ── */}
        {step >= 2 && (
          <div className={`bg-white dark:bg-gray-800 border rounded-2xl overflow-hidden transition-all ${
            step === 2 ? 'border-amber-400/50' : 'border-gray-200 dark:border-gray-700'
          }`}>
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${step > 2 ? 'bg-emerald-500 text-white' : step === 2 ? 'bg-amber-400 text-gray-900' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                  {step > 2 ? '✓' : '2'}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Generate Script</p>
                  {script && step > 2 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {fmtDur(seconds)} · Score {viralScore}/100
                    </p>
                  )}
                </div>
              </div>
              {script && (
                <div className="flex items-center gap-2">
                  {viralScore && (
                    <span className={`text-sm font-black ${viralScore >= 71 ? 'text-emerald-400' : viralScore >= 51 ? 'text-amber-400' : 'text-red-400'}`}>
                      {viralScore}<span className="text-xs text-gray-500 font-normal">/100</span>
                    </span>
                  )}
                  {step > 2 && (
                    <button onClick={() => setStep(2)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      Edit →
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="p-5 space-y-4">
              {/* Generating progress */}
              {generatingScript && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse flex-shrink-0"/>
                    <p className="text-xs text-amber-400 font-semibold">{scriptStage}</p>
                  </div>
                  <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full animate-pulse" style={{width:'60%'}}/>
                  </div>
                </div>
              )}

              {/* Winner hook */}
              {winnerHook && !generatingScript && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <p className="text-xs font-bold text-amber-400 mb-1">Opening Hook — {winnerHook.formula}</p>
                  <p className="text-xs text-white italic">"{winnerHook.hook}"</p>
                </div>
              )}

              {/* Script display */}
              {script && !generatingScript && (
                <ScriptDisplay script={script} onCopy={handleCopy} copied={copied} />
              )}

              <div className="flex gap-2 flex-col sm:flex-row">
                {script && step === 2 && (
                  <button onClick={() => setStep(3)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg order-first">
                    <span>🎬</span><span>Next — Produce Video</span>
                  </button>
                )}
                <button onClick={handleGenerateScript} disabled={generatingScript}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold disabled:opacity-50 transition-all ${
                    script ? 'px-5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600' : 'flex-1 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white shadow-lg'
                  }`}>
                  {generatingScript
                    ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"/><span>Generating...</span></>
                    : <><span>⚡</span><span>{script ? 'Regenerate' : 'Generate Script'}</span></>
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Produce ── */}
        {step >= 3 && (
          <div className={`bg-white dark:bg-gray-800 border rounded-2xl overflow-hidden transition-all ${
            step === 3 ? 'border-amber-400/50' : 'border-gray-200 dark:border-gray-700'
          }`}>
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${step > 3 ? 'bg-emerald-500 text-white' : step === 3 ? 'bg-amber-400 text-gray-900' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                  {step > 3 ? '✓' : '3'}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Produce Video</p>
                  {videoUrl && <p className="text-xs text-gray-500 mt-0.5">Video ready</p>}
                  {videoStatus === 'processing' && <p className="text-xs text-amber-400 mt-0.5">Generating... (5-10 min)</p>}
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Processing state */}
              {videoStatus === 'processing' && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-400 flex-shrink-0"/>
                  <div>
                    <p className="text-xs font-bold text-amber-400">HeyGen is producing your video</p>
                    <p className="text-xs text-gray-500 mt-0.5">You can leave this page — we'll have it ready when you return.</p>
                  </div>
                </div>
              )}

              {/* Video ready */}
              {videoUrl && videoStatus === 'completed' && (
                <div className="p-3 bg-emerald-900/20 border border-emerald-700/40 rounded-xl flex items-center gap-3">
                  <span className="text-emerald-400 text-lg">✅</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-emerald-300">Video ready</p>
                    <a href={videoUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-emerald-500 hover:text-emerald-400 truncate block">{videoUrl.slice(0,50)}...</a>
                  </div>
                </div>
              )}

              {/* HeyGen not configured */}
              {heygenConfigured === false && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <p className="text-sm font-bold text-amber-400 mb-2">⚡ HeyGen not connected</p>
                  <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Sign up at <a href="https://app.heygen.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">app.heygen.com</a></li>
                    <li>Settings → API → Generate API Key</li>
                    <li>Add <code className="bg-gray-800 px-1 rounded text-amber-400">HEYGEN_API_KEY</code> to Railway</li>
                  </ol>
                </div>
              )}

              {/* HeyGen configured — show avatar/voice pickers */}
              {heygenConfigured && videoStatus !== 'processing' && !videoUrl && (
                loadingAssets ? (
                  <div className="flex items-center gap-2 py-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"/>
                    <p className="text-xs text-gray-400">Loading avatars and voices...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Avatar picker */}
                    {avatars.length > 0 && (
                      <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-2">Avatar</label>
                        <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
                          {avatars.slice(0, 12).map(av => (
                            <button key={av.avatar_id} onClick={() => setAvatarId(av.avatar_id)}
                              className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                                avatarId === av.avatar_id ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:border-gray-400'
                              }`}>
                              {av.preview_image_url
                                ? <img src={av.preview_image_url} alt={av.avatar_name} className="w-10 h-10 rounded-lg object-cover"/>
                                : <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-lg">👤</div>
                              }
                              <span className="text-xs text-gray-500 truncate w-full text-center leading-tight">{av.avatar_name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Voice picker */}
                    {voices.length > 0 && (
                      <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-2">Voice</label>
                        <select value={voiceId} onChange={e => setVoiceId(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-xs rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
                          {voices.map(v => (
                            <option key={v.voice_id} value={v.voice_id}>
                              {v.display_name || v.name} {v.gender ? `— ${v.gender}` : ''} {v.accent ? `(${v.accent})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Aspect ratio */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-2">Format</label>
                      <div className="flex gap-2">
                        {[
                          { id: '9:16', label: '9:16', desc: 'TikTok / Reels' },
                          { id: '16:9', label: '16:9', desc: 'YouTube'        },
                          { id: '1:1',  label: '1:1',  desc: 'Square Feed'    },
                        ].map(r => (
                          <button key={r.id} onClick={() => setAspectRatio(r.id)}
                            className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
                              aspectRatio === r.id ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-400'
                            }`}>
                            <span className="font-black block">{r.label}</span>
                            <span className="text-gray-400">{r.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* Produce button */}
              {heygenConfigured && videoStatus !== 'processing' && !videoUrl && (
                <button onClick={handleProduce} disabled={producing || !avatarId || !voiceId}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-sm font-bold disabled:opacity-40 transition-all shadow-lg">
                  {producing
                    ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"/><span>Starting...</span></>
                    : <><span>🎬</span><span>Produce with HeyGen</span></>}
                </button>
              )}

              {/* Manual URL fallback — always available */}
              {!videoUrl && videoStatus !== 'processing' && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 mb-2">Or paste a direct MP4 URL:</p>
                  <div className="flex gap-2">
                    <input value={manualUrl} onChange={e => setManualUrl(e.target.value)}
                      placeholder="https://...mp4"
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-xs rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none placeholder-gray-400"/>
                    <button onClick={handleImportManualUrl} disabled={!manualUrl.trim()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold disabled:opacity-40 transition-all flex-shrink-0">
                      Import
                    </button>
                  </div>
                </div>
              )}

              {/* Next step */}
              {videoUrl && step === 3 && (
                <button onClick={() => setStep(4)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all">
                  Next → Distribute
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 4: Distribute ── */}
        {step >= 4 && (
          <div className="bg-white dark:bg-gray-800 border border-amber-400/50 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-amber-400 text-gray-900 flex items-center justify-center text-xs font-black">4</div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Distribute</p>
            </div>
            <div className="p-5 space-y-4">
              {videoUrl ? (
                <>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {PLATFORMS.map(p => (
                      <span key={p.id} className={`text-xs px-2 py-1 rounded-lg border font-medium ${p.color}`}>
                        {p.emoji} {p.label}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Your video will be posted to the platforms you select. Captions are auto-generated from your campaign data.</p>
                  <button onClick={() => setDistributeOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white rounded-xl text-sm font-bold transition-all shadow-lg">
                    🚀 Post to Social Media
                  </button>
                  <DistributeModal
                    isOpen={distributeOpen}
                    onClose={() => setDistributeOpen(false)}
                    videoUrl={videoUrl}
                    campaign={selectedCampaign}
                    showToast={showToast}
                  />
                </>
              ) : (
                <p className="text-xs text-gray-500 py-2">Complete Step 3 to unlock distribution.</p>
              )}
            </div>
          </div>
        )}

        {/* Start over */}
        {step > 1 && (
          <button onClick={() => {
            setStep(1); setSelectedCampaign(null); setScript(''); setVideoUrl('');
            setVideoJobId(null); setVideoStatus(null); setError('');
            if (pollRef.current) clearInterval(pollRef.current);
          }} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mx-auto block">
            ← Start over with a different campaign
          </button>
        )}
      </div>

      {/* Upgrade modal */}
      <UpgradeModal
        isOpen={!!upgradeModal}
        onClose={() => setUpgradeModal(null)}
        requiredPlan={upgradeModal?.requiredPlan}
        feature={upgradeModal?.feature}
      />

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 px-5 py-3 rounded-xl border shadow-2xl text-sm font-medium transition-all ${
          toast.type === 'error' ? 'bg-red-900/90 border-red-500 text-red-300' :
          toast.type === 'info'  ? 'bg-gray-900/90 border-gray-600 text-gray-300' :
                                   'bg-green-900/90 border-emerald-500 text-emerald-300'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default StudioPage;