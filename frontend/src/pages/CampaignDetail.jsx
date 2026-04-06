import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  getCampaignById, generateStrategy, getCampaignMedia,
  saveContent, getSavedContent, deleteSavedContent,
} from '../services/api';

import MediaUpload from '../components/MediaUpload';
import ReactMarkdown from 'react-markdown';

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'https://ivey-steel.vercel.app';
const API_URL      = import.meta.env.VITE_API_URL      || 'https://ivey-production.up.railway.app/api';

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, visible }) => {
  if (!visible) return null;
  return (
    <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-sm shadow-2xl transition-all duration-300 ${
      type === 'error' ? 'bg-red-900/80 border-red-500 text-red-300' :
      type === 'info'  ? 'bg-gray-900/80 border-emerald-500 text-emerald-300' :
                         'bg-green-900/80 border-amber-500 text-amber-300'
    }`}>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

// ─── Share / Caption Modal ────────────────────────────────────────────────────
const ShareModal = ({ isOpen, onClose, imageUrl, format, campaignId, campaignName, productDescription, targetAudience, showToast }) => {
  const [platform,         setPlatform]         = useState('instagram');
  const [caption,          setCaption]          = useState('');
  const [generating,       setGenerating]       = useState(false);
  const [copied,           setCopied]           = useState(false);
  const [captionGenerated, setCaptionGenerated] = useState(false);

  const platforms = [
    { id: 'instagram', label: 'Instagram', emoji: '📸' },
    { id: 'twitter',   label: 'Twitter/X', emoji: '𝕏'  },
    { id: 'facebook',  label: 'Facebook',  emoji: '📘' },
    { id: 'linkedin',  label: 'LinkedIn',  emoji: '💼' },
    { id: 'tiktok',    label: 'TikTok',    emoji: '🎵' },
  ];

  const handleGenerateCaption = async () => {
    setGenerating(true);
    setCaption('');
    setCaptionGenerated(false);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/campaigns/${campaignId}/caption`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ format, platform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate caption');
      setCaption(data.caption);
      setCaptionGenerated(true);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => { setCaption(''); setCaptionGenerated(false); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div>
            <h2 className="text-base font-bold text-white">📤 Share This Visual</h2>
            <p className="text-xs text-gray-400 mt-0.5">{OUTPUT_FORMATS[format]?.name || format}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 flex items-center justify-center text-sm">✕</button>
        </div>
        <div className="p-6 space-y-5">
          {imageUrl && (
            <div className="rounded-xl overflow-hidden border border-gray-700 max-h-48">
              <img src={imageUrl} alt="Visual" className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">WHERE ARE YOU POSTING?</p>
            <div className="flex gap-2 flex-wrap">
              {platforms.map(p => (
                <button key={p.id} onClick={() => { setPlatform(p.id); handleReset(); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    platform === p.id
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
                  }`}>
                  {p.emoji} {p.label}
                </button>
              ))}
            </div>
          </div>
          {!captionGenerated ? (
            <button onClick={handleGenerateCaption} disabled={generating}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 transition-all text-sm">
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  Generating caption...
                </span>
              ) : `✨ Generate ${platforms.find(p => p.id === platform)?.label} Caption`}
            </button>
          ) : (
            <div className="space-y-3">
              <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={5}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              <div className="flex gap-2">
                <button onClick={handleCopy}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${copied ? 'bg-amber-500 text-gray-900' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                  {copied ? '✅ Copied!' : '📋 Copy Caption'}
                </button>
                <button onClick={handleGenerateCaption} disabled={generating}
                  className="px-4 py-2.5 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl text-sm hover:bg-gray-700 transition-all disabled:opacity-50">
                  🔄 Regenerate
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center">Copy the caption then paste it when posting your content</p>
            </div>
          )}
          {imageUrl && (
            <a href={imageUrl} target="_blank" rel="noopener noreferrer" download
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl text-sm hover:bg-gray-700 transition-all">
              ⬇️ Download Image
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Video Script Card ────────────────────────────────────────────────────────
const VideoScriptCard = ({ campaignId, campaign, showToast, onSave }) => {
  const [script,         setScript]         = useState('');
  const [generating,     setGenerating]     = useState(false);
  const [genStage,       setGenStage]       = useState('');
  const [videoUrl,       setVideoUrl]       = useState('');
  const [importing,      setImporting]      = useState(false);
  const [importInput,    setImportInput]    = useState('');
  const [copied,         setCopied]         = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [activeTab,      setActiveTab]      = useState('script');
  const [intel,          setIntel]          = useState(null); // full intelligence package
  const [viralScore,     setViralScore]     = useState(null);
  const [seconds,        setSeconds]        = useState(null);

  const fmtDur = (s) => !s ? '' : s < 60 ? `${s}s` : `${Math.floor(s/60)}m${s%60>0?` ${s%60}s`:''}`;

  const STAGES = [
    '🧠 Excavating audience psychology...',
    '🔍 Analysing competitive landscape...',
    '🎭 Designing narrative arc...',
    '🎣 Running Hook Laboratory...',
    '✍️  Writing production script...',
    '📊 Scoring for viral potential...',
  ];

  const handleGenerate = async () => {
    setGenerating(true); setScript(''); setIntel(null); setViralScore(null); setGenStage(STAGES[0]);
    let stageIdx = 0;
    const ticker = setInterval(() => {
      stageIdx = Math.min(stageIdx + 1, STAGES.length - 1);
      setGenStage(STAGES[stageIdx]);
    }, 8000);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/campaigns/${campaignId}/generate-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ai_provider: campaign.ai_provider || 'claude' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate script');
      setScript(data.script);
      setSeconds(data.seconds);
      setViralScore(data.viralScore);
      setIntel({
        audienceProfile: data.audienceProfile,
        competitiveGap:  data.competitiveGap,
        narrativeArc:    data.narrativeArc,
        hooks:           data.hooks,
        winnerHook:      data.winnerHook,
        strengths:       data.strengths,
        improvements:    data.improvements,
        predictedViews:  data.predictedViews,
        scoreFeatures:   data.scoreFeatures,
        bracketReason:   data.bracketReason,
        productionBrief: data.productionBrief,
      });
      setActiveTab('script');
    } catch (err) { showToast(err.message, 'error'); }
    finally { clearInterval(ticker); setGenerating(false); setGenStage(''); }
  };

  const handleCopyScript = () => {
    const clean = script.replace(/#{1,6}\s*/g, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').trim();
    navigator.clipboard.writeText(clean);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    showToast('📋 Script copied — paste into HeyGen', 'success');
  };

  const handleHeyGen = () => { handleCopyScript(); window.open('https://app.heygen.com/create', '_blank'); };

  const handleImport = async () => {
    if (!importInput.trim()) return;
    setImporting(true);
    try {
      await onSave({ title: `🎬 Video — ${campaign.name}`, content: importInput.trim(), content_type: 'video_import', format: 'VIDEO_SCRIPT', key: `video_script_${Date.now()}` });
      setVideoUrl(importInput.trim()); setImportInput('');
      showToast('📥 Video imported and saved!', 'success');
    } catch { showToast('Failed to import video', 'error'); }
    finally { setImporting(false); }
  };

  const handleSaveScript = async () => {
    if (!script || saved) return;
    await onSave({ title: `📝 Script (${fmtDur(seconds)}) — ${campaign.name}`, content: script, content_type: 'video_script', format: 'VIDEO_SCRIPT', key: `script_${Date.now()}` });
    setSaved(true);
  };

  const scoreColor = (s) => s >= 71 ? 'text-emerald-400' : s >= 51 ? 'text-amber-400' : 'text-red-400';
  const scoreBg    = (s) => s >= 71 ? 'bg-emerald-500' : s >= 51 ? 'bg-amber-500' : 'bg-red-500';

  const prod = intel?.productionBrief || campaign.production_brief || {};
  const narratorDesc = [prod.narratorGender, prod.narratorAge, prod.narratorEthnicity]
    .filter(v => v && v !== 'Either' && v !== 'Any' && v !== 'Not specified').join(', ');

  const TABS = [
    { id: 'script',    label: '📄 Script'    },
    { id: 'package',   label: '🎬 Production Package' },
    { id: 'audience',  label: '🧠 Audience'  },
    { id: 'hooks',     label: '🎣 Hooks'     },
  ];

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center text-lg flex-shrink-0">🎬</div>
          <div>
            <div className="font-bold text-white text-sm">Video Script</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {seconds ? `${fmtDur(seconds)} · IVey Engine v4` : 'IVey selects 30/45s bracket · Ready for HeyGen'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {viralScore && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 rounded-lg">
              <span className="text-xs text-gray-400">Score</span>
              <span className={`text-sm font-black ${scoreColor(viralScore)}`}>{viralScore}</span>
              <span className="text-xs text-gray-500">/100</span>
            </div>
          )}
          <button onClick={handleGenerate} disabled={generating}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 shadow-lg">
            {generating
              ? <><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg> Working...</>
              : script ? '🔄 Regenerate' : '⚡ Generate'}
          </button>
        </div>
      </div>

      {/* Generating progress */}
      {generating && (
        <div className="px-5 py-4 border-b border-gray-700 bg-gray-900/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse flex-shrink-0"/>
            <p className="text-xs text-amber-400 font-semibold">{genStage}</p>
          </div>
          <div className="space-y-1.5">
            {STAGES.map((s, i) => {
              const current = STAGES.indexOf(genStage);
              const done    = i < current;
              const active  = i === current;
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${done ? 'bg-emerald-500' : active ? 'bg-amber-400 animate-pulse' : 'bg-gray-700'}`}/>
                  <span className={`text-xs ${done ? 'text-emerald-400' : active ? 'text-amber-400' : 'text-gray-600'}`}>{s}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Viral score bar */}
      {viralScore && !generating && (
        <div className="px-5 py-3 border-b border-gray-700 bg-gray-900/30">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400 font-semibold">Viral Score</span>
            <span className="text-xs text-gray-400">{intel?.predictedViews} predicted views</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className={`h-full ${scoreBg(viralScore)} rounded-full transition-all`} style={{width: `${viralScore}%`}}/>
          </div>
          {intel?.improvements?.length > 0 && (
            <p className="text-xs text-gray-500 mt-1.5">💡 {intel.improvements[0]}</p>
          )}
        </div>
      )}

      {/* Tabs */}
      {(script || intel) && !generating && (
        <div className="flex border-b border-gray-700 overflow-x-auto">
          {TABS.filter(t => t.id === 'script' || intel).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      {!generating && (
        <div>

          {/* ── SCRIPT TAB ── */}
          {activeTab === 'script' && script && (
            <div className="p-5 space-y-4">
              <div className="bg-gray-900/50 rounded-xl p-4 max-h-80 overflow-y-auto border border-gray-700">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed font-mono">{script}</pre>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCopyScript}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${copied ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                  {copied ? '✅ Copied!' : '📋 Copy Clean Script'}
                </button>
                <button onClick={handleSaveScript} disabled={saved}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${saved ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}>
                  {saved ? '✅' : '🔖 Save'}
                </button>
              </div>
            </div>
          )}

          {/* ── PRODUCTION PACKAGE TAB ── */}
          {activeTab === 'package' && intel && (
            <div className="p-5 space-y-5">

              {/* Brand Kit Setup */}
              <div className="p-4 bg-gray-900/60 border border-gray-700 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">🎨</span>
                  <p className="text-xs font-bold text-white uppercase tracking-widest">Step 1 — HeyGen Brand Kit Setup</p>
                  <span className="ml-auto text-xs text-gray-500">Do this once per brand</span>
                </div>
                <div className="space-y-2.5">
                  {/* Logo */}
                  <div className="flex items-start gap-3 p-3 bg-gray-800 rounded-xl">
                    <span className="text-base flex-shrink-0">🖼</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-300 mb-1">Logo</p>
                      {prod.logoUrl ? (
                        <div className="flex items-center gap-2">
                          <img src={prod.logoUrl} alt="logo" className="w-8 h-8 rounded object-contain bg-gray-700 p-1 flex-shrink-0" onError={e => e.target.style.display='none'}/>
                          <div>
                            <p className="text-xs text-gray-400 break-all">{prod.logoUrl}</p>
                            <button onClick={() => { navigator.clipboard.writeText(prod.logoUrl); showToast('Logo URL copied', 'success'); }}
                              className="text-xs text-amber-400 hover:text-amber-300 mt-0.5">Copy URL →</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">No logo detected — upload your logo manually in HeyGen Brand Kit</p>
                      )}
                    </div>
                  </div>
                  {/* Colors */}
                  <div className="flex items-start gap-3 p-3 bg-gray-800 rounded-xl">
                    <span className="text-base flex-shrink-0">🎨</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-300 mb-2">Brand Colors</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: 'Primary', color: '#10b981', name: 'Emerald' },
                          { label: 'Accent',  color: '#f59e0b', name: 'Amber'   },
                          { label: 'Dark',    color: '#111827', name: 'Dark'    },
                          { label: 'White',   color: '#ffffff', name: 'White'   },
                        ].map(c => (
                          <button key={c.color} onClick={() => { navigator.clipboard.writeText(c.color); showToast(`${c.name} copied: ${c.color}`, 'success'); }}
                            className="flex items-center gap-1.5 px-2 py-1 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all">
                            <div className="w-3 h-3 rounded-sm border border-gray-500 flex-shrink-0" style={{background: c.color}}/>
                            <span className="text-xs text-gray-300 font-mono">{c.color}</span>
                            <span className="text-xs text-gray-500">{c.label}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 mt-1.5">Click any color to copy the hex code</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Avatar Recommendation */}
              <div className="p-4 bg-gray-900/60 border border-gray-700 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">👤</span>
                  <p className="text-xs font-bold text-white uppercase tracking-widest">Step 2 — Avatar Selection</p>
                </div>
                <div className="p-3 bg-gray-800 rounded-xl space-y-2">
                  <p className="text-xs text-gray-300">
                    <span className="font-bold text-amber-400">Recommended: </span>
                    {narratorDesc
                      ? `${narratorDesc} presenter — confident, natural delivery`
                      : 'Select an avatar that matches your target audience demographics'}
                  </p>
                  {prod.energyLevel && prod.energyLevel !== 'Warm & Friendly' && (
                    <p className="text-xs text-gray-400">
                      <span className="font-bold text-gray-300">Energy: </span>{prod.energyLevel} — choose avatar expression to match
                    </p>
                  )}
                  {prod.primaryMarket && prod.primaryMarket !== 'Global' && (
                    <p className="text-xs text-gray-400">
                      <span className="font-bold text-gray-300">Market: </span>{prod.primaryMarket} — prioritise avatars from this region if available
                    </p>
                  )}
                  {prod.videoFormat === 'two_character' && (
                    <p className="text-xs text-emerald-400 mt-1">
                      💬 Two-character script — select two different avatars and assign Character A and Character B in HeyGen
                    </p>
                  )}
                </div>
              </div>

              {/* Script paste */}
              <div className="p-4 bg-gray-900/60 border border-gray-700 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">📄</span>
                  <p className="text-xs font-bold text-white uppercase tracking-widest">Step 3 — Paste Script</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">Copy the clean script and paste it into HeyGen's script editor. Visual notes in (parentheses) are for your reference — do not paste them into HeyGen.</p>
                  {intel.winnerHook && (
                    <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                      <p className="text-xs font-bold text-amber-400 mb-1">Opening hook — {intel.winnerHook.formula}</p>
                      <p className="text-xs text-white italic">"{intel.winnerHook.hook}"</p>
                    </div>
                  )}
                  <button onClick={handleHeyGen} disabled={!script}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-40 shadow-lg">
                    🎬 Copy Script & Open HeyGen
                  </button>
                </div>
              </div>

              {/* Overlay Timeline */}
              <div className="p-4 bg-gray-900/60 border border-gray-700 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">⏱</span>
                  <p className="text-xs font-bold text-white uppercase tracking-widest">Step 4 — Overlay Timeline</p>
                  <span className="ml-auto text-xs text-gray-500">Apply in HeyGen editor</span>
                </div>
                <div className="space-y-2">
                  {[
                    { time: '0:00', action: 'Logo overlay', detail: 'Bottom-right corner · 70% opacity · throughout video' },
                    { time: '0:02', action: 'Lower third in', detail: `Campaign: "${campaign.name}"` },
                    { time: '0:05', action: 'Lower third out', detail: 'Fade out lower third' },
                    { time: prod.musicMood && prod.musicMood !== 'No music specified' ? prod.musicMood : 'Background', action: 'Music', detail: `${prod.musicMood && prod.musicMood !== 'No music specified' ? prod.musicMood : 'Subtle'} · -20dB · does not compete with voice` },
                    { time: `${Math.max((seconds || 45) - 8, 30)}s`, action: 'CTA overlay', detail: 'Link in bio · large text · center or bottom' },
                    { time: `${seconds || 45}s`, action: 'Logo hold', detail: 'Final frame · logo prominent · 0.5s hold then fade' },
                  ].map(({ time, action, detail }) => (
                    <div key={time+action} className="flex items-start gap-3 p-2.5 bg-gray-800 rounded-lg">
                      <span className="font-mono text-amber-400 text-xs w-12 flex-shrink-0 pt-0.5">{time}</span>
                      <div>
                        <span className="text-xs font-bold text-gray-200">{action}</span>
                        <p className="text-xs text-gray-500 mt-0.5">{detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Export settings */}
              <div className="p-4 bg-gray-900/60 border border-gray-700 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">🚀</span>
                  <p className="text-xs font-bold text-white uppercase tracking-widest">Step 5 — Export & Post</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Resolution', value: '1080p (1920×1080)' },
                    { label: 'Format', value: 'MP4' },
                    { label: 'Duration', value: fmtDur(seconds) || '45s' },
                    { label: 'Market', value: prod.primaryMarket || 'Global' },
                    { label: 'Platform', value: 'TikTok · Instagram · YouTube' },
                    { label: 'Aspect', value: '9:16 (vertical) for social' },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-2 bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="text-xs font-bold text-gray-200 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Download production brief */}
              <button onClick={() => {
                const brief = [
                  `IVEY PRODUCTION PACKAGE — ${campaign.name}`,
                  `Generated: ${new Date().toLocaleDateString()}`,
                  `Duration: ${fmtDur(seconds) || '45s'} | Market: ${prod.primaryMarket || 'Global'} | Format: ${prod.videoFormat || 'single_narrator'}`,
                  '',
                  '═══ BRAND KIT ═══',
                  `Logo URL: ${prod.logoUrl || 'Upload manually'}`,
                  'Primary Color: #10b981 (Emerald)',
                  'Accent Color: #f59e0b (Amber)',
                  'Dark Color: #111827',
                  '',
                  '═══ AVATAR ═══',
                  `Narrator: ${narratorDesc || 'Match your audience profile'}`,
                  `Energy: ${prod.energyLevel || 'Warm & Friendly'}`,
                  `Music: ${prod.musicMood || 'No music specified'}`,
                  '',
                  '═══ OPENING HOOK ═══',
                  intel.winnerHook ? `Formula: ${intel.winnerHook.formula}` : '',
                  intel.winnerHook ? `"${intel.winnerHook.hook}"` : '',
                  intel.winnerHook ? `Visual: ${intel.winnerHook.visual}` : '',
                  '',
                  '═══ OVERLAY TIMELINE ═══',
                  '0:00 — Logo in (bottom-right, 70% opacity)',
                  `0:02 — Lower third: "${campaign.name}"`,
                  '0:05 — Lower third out',
                  `${Math.max((seconds||45)-8,30)}s — CTA overlay: Link in bio`,
                  `${seconds||45}s — Logo final frame, hold, fade`,
                  '',
                  '═══ EXPORT SETTINGS ═══',
                  'Resolution: 1080p (1920×1080)',
                  'Format: MP4',
                  'Aspect: 9:16 for TikTok/Instagram/YouTube Shorts',
                  '',
                  '═══ SCRIPT ═══',
                  script,
                  '',
                  '═══ AUDIENCE INTELLIGENCE ═══',
                  intel.audienceProfile ? `2am thought: ${intel.audienceProfile.two_am_thought}` : '',
                  intel.audienceProfile ? `Secret desire: ${intel.audienceProfile.secret_desire}` : '',
                  intel.audienceProfile ? `Hook insight: ${intel.audienceProfile.hook_insight}` : '',
                  '',
                  `Viral Score: ${viralScore}/100 | Predicted: ${intel.predictedViews}`,
                  '',
                  'Generated by IVey — ivey-steel.vercel.app',
                ].filter(l => l !== undefined).join('
');
                const blob = new Blob([brief], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `IVey-Production-Package-${campaign.name.replace(/\s+/g,'-')}.txt`;
                a.click();
                URL.revokeObjectURL(url);
                showToast('📦 Production package downloaded!', 'success');
              }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white rounded-xl text-sm font-bold transition-all">
                📦 Download Full Production Package
              </button>

              {/* Import video */}
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2">After producing — paste your video URL to save it</p>
                {videoUrl ? (
                  <div className="flex items-center gap-3 p-3 bg-emerald-900/20 border border-emerald-700/40 rounded-xl">
                    <span className="text-emerald-400 text-lg flex-shrink-0">✅</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-emerald-300">Video imported</p>
                      <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-500 hover:text-emerald-400 truncate block mt-0.5">{videoUrl.slice(0,60)}...</a>
                    </div>
                    <button onClick={() => setVideoUrl('')} className="text-gray-500 hover:text-gray-300 text-xs">✕</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input value={importInput} onChange={e => setImportInput(e.target.value)}
                      placeholder="Paste your HeyGen video URL here..."
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white text-xs rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none placeholder-gray-500"/>
                    <button onClick={handleImport} disabled={!importInput.trim() || importing}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex-shrink-0">
                      {importing ? '⏳' : '📥 Import'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── AUDIENCE TAB ── */}
          {activeTab === 'audience' && intel?.audienceProfile && (
            <div className="p-5 space-y-3">
              <p className="text-xs text-gray-500 mb-3">IVey excavated your audience psychology before writing a single word.</p>
              {[
                { icon: '🌙', label: 'The 2am Thought',    key: 'two_am_thought'  },
                { icon: '✨', label: 'Secret Desire',       key: 'secret_desire'  },
                { icon: '👁', label: 'Social Fear',         key: 'social_fear'    },
                { icon: '❌', label: 'Failed Attempt',      key: 'failed_attempt' },
                { icon: '🗣', label: 'Their Language',      key: 'their_language' },
                { icon: '🔑', label: 'Permission Block',    key: 'permission_block'},
                { icon: '🌅', label: 'After State',         key: 'after_state'    },
                { icon: '💡', label: 'Hook Insight',        key: 'hook_insight'   },
              ].map(({ icon, label, key }) => {
                const val = intel.audienceProfile[key];
                if (!val) return null;
                const display = Array.isArray(val) ? val.join(' · ') : val;
                return (
                  <div key={key} className="flex items-start gap-3 p-3 bg-gray-900/40 rounded-xl border border-gray-700/50">
                    <span className="text-base flex-shrink-0">{icon}</span>
                    <div>
                      <p className="text-xs font-bold text-gray-400 mb-0.5">{label}</p>
                      <p className="text-xs text-gray-300 leading-relaxed">{display}</p>
                    </div>
                  </div>
                );
              })}
              {intel.competitiveGap && (
                <div className="mt-4 p-3 bg-sky-500/5 border border-sky-500/20 rounded-xl">
                  <p className="text-xs font-bold text-sky-400 mb-1">🎯 Competitive Gap</p>
                  <p className="text-xs text-gray-300">{intel.competitiveGap.emotional_gap}</p>
                  <p className="text-xs text-gray-500 mt-1">Positioning: {intel.competitiveGap.positioning}</p>
                </div>
              )}
            </div>
          )}

          {/* ── HOOKS TAB ── */}
          {activeTab === 'hooks' && intel?.hooks && (
            <div className="p-5 space-y-3">
              <p className="text-xs text-gray-500 mb-3">IVey generated 5 hooks across 5 formulas and selected the highest scoring one. Use the others for A/B testing.</p>
              {intel.hooks.map((h, i) => (
                <div key={i} className={`p-4 rounded-xl border transition-all ${i === 0 ? 'border-amber-500/40 bg-amber-500/5' : 'border-gray-700 bg-gray-900/30'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {i === 0 && <span className="text-xs bg-amber-500 text-gray-900 font-black px-2 py-0.5 rounded-full">WINNER</span>}
                      <span className="text-xs font-bold text-gray-400">{h.formula}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-black ${h.total >= 24 ? 'text-emerald-400' : h.total >= 20 ? 'text-amber-400' : 'text-gray-500'}`}>{h.total}</span>
                      <span className="text-xs text-gray-600">/30</span>
                    </div>
                  </div>
                  <p className="text-sm text-white italic mb-1">"{h.hook}"</p>
                  <p className="text-xs text-gray-500">📷 {h.visual}</p>
                  <div className="flex gap-3 mt-2 text-xs text-gray-600">
                    <span>Pattern {h.pattern_interrupt_score}/10</span>
                    <span>·</span>
                    <span>Audience {h.audience_match_score}/10</span>
                    <span>·</span>
                    <span>Gap {h.gap_score}/10</span>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(h.hook); showToast('Hook copied!', 'success'); }}
                    className="mt-2 text-xs text-gray-500 hover:text-amber-400 transition-colors">
                    Copy hook →
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!script && !generating && (
            <div className="p-8 text-center">
              <div className="text-4xl mb-3">⚡</div>
              <p className="text-sm font-bold text-white mb-1">Ready to generate</p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">IVey will excavate your audience, analyse competitors, design a narrative arc, test 5 hooks, and write a production-ready script.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


// ─── Strategy Section ─────────────────────────────────────────────────────────
const StrategySection = ({ title, content, icon, defaultOpen }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-700 rounded-xl overflow-hidden mb-3">
      <button onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 bg-emerald-900/20 flex items-center justify-between hover:bg-emerald-900/30 transition-all">
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        <span className={`text-gray-400 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && (
        <div className="px-5 py-4 bg-gray-700/50 border-t border-gray-700">
          <div className="prose prose-sm prose-invert max-w-none text-gray-300">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Parse strategy ───────────────────────────────────────────────────────────
const parseStrategy = (strategy) => {
  if (!strategy) return [];
  const text = typeof strategy === 'string' ? strategy : JSON.stringify(strategy, null, 2);
  const patterns = [
    { pattern: /(?:^|\n)(?:#{1,3}\s*)?(?:\d+\.\s*)?(?:CAMPAIGN OBJECTIVES|Executive Summary|Overview)/i, title: 'Campaign Objectives', icon: '🎯' },
    { pattern: /(?:^|\n)(?:#{1,3}\s*)?(?:\d+\.\s*)?(?:TARGET AUDIENCE|Audience Analysis)/i,              title: 'Target Audience',    icon: '👥' },
    { pattern: /(?:^|\n)(?:#{1,3}\s*)?(?:\d+\.\s*)?(?:VISUAL BRAND|Brand Direction|Visual Style)/i,      title: 'Visual Direction',   icon: '🎨' },
    { pattern: /(?:^|\n)(?:#{1,3}\s*)?(?:\d+\.\s*)?(?:FORMAT STRATEGY|Content Strategy)/i,               title: 'Format Strategy',    icon: '📐' },
    { pattern: /(?:^|\n)(?:#{1,3}\s*)?(?:\d+\.\s*)?(?:CONTENT CALENDAR|Timeline|Schedule)/i,             title: 'Content Calendar',   icon: '📅' },
    { pattern: /(?:^|\n)(?:#{1,3}\s*)?(?:\d+\.\s*)?(?:SUCCESS METRICS|KPIs|Metrics)/i,                   title: 'Success Metrics',    icon: '📊' },
    { pattern: /(?:^|\n)(?:#{1,3}\s*)?(?:\d+\.\s*)?(?:DISTRIBUTION|Channel Strategy|Platform)/i,         title: 'Distribution Plan',  icon: '📢' },
  ];
  const found = [];
  patterns.forEach(({ pattern, title, icon }) => {
    const match = text.match(pattern);
    if (match) found.push({ title, icon, index: match.index, matchLength: match[0].length });
  });
  found.sort((a, b) => a.index - b.index);
  const sections = [];
  found.forEach((s, i) => {
    const start   = s.index + s.matchLength;
    const end     = i < found.length - 1 ? found[i + 1].index : text.length;
    const content = text.substring(start, end).trim().replace(/^[:\s]+/, '');
    if (content.length > 10) sections.push({ title: s.title, icon: s.icon, content });
  });
  if (sections.length === 0) sections.push({ title: 'Visual Marketing Strategy', icon: '📊', content: text });
  return sections;
};

// ─── Saved Library ────────────────────────────────────────────────────────────
const SavedLibrary = ({ savedItems, onDelete }) => {
  const [filter, setFilter] = useState('all');
  if (savedItems.length === 0) return null;
  const filtered = savedItems.filter(s => {
    if (filter === 'all')    return true;
    if (filter === 'images') return ['generated_image', 'generated_thumbnail'].includes(s.content_type);
    if (filter === 'videos') return s.content_type === 'video_import';
    return true;
  });
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden mt-8">
      <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-white">🗂️ Saved Library</span>
          <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2 py-0.5 rounded-full">{savedItems.length}</span>
        </div>
        <div className="flex gap-1">
          {['all', 'images', 'videos'].map(tab => (
            <button key={tab} onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${filter === tab ? 'bg-emerald-500/20 text-emerald-300' : 'text-gray-400 hover:text-gray-200'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
        {filtered.map(savedItem => (
          <div key={savedItem.id} className="relative group rounded-xl overflow-hidden border border-gray-700 bg-gray-700">
            {['generated_image', 'generated_thumbnail'].includes(savedItem.content_type) ? (
              <img src={savedItem.content} alt={savedItem.title} className="w-full aspect-square object-cover" />
            ) : savedItem.content_type === 'video_import' ? (
              <div className="w-full aspect-square flex items-center justify-center bg-gray-700">
                <div className="text-center">
                  <div className="text-3xl mb-1">🎬</div>
                  <p className="text-xs text-gray-400 px-2 truncate">{savedItem.title}</p>
                </div>
              </div>
            ) : null}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
              {['generated_image', 'generated_thumbnail'].includes(savedItem.content_type) && (
                <a href={savedItem.content} target="_blank" rel="noopener noreferrer" download className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white text-sm hover:bg-white/30">⬇️</a>
              )}
              {savedItem.content_type === 'video_import' && (
                <a href={savedItem.content} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white text-sm hover:bg-white/30">▶</a>
              )}
              <button onClick={() => onDelete(savedItem.id)} className="w-8 h-8 bg-red-500/40 rounded-lg flex items-center justify-center text-white text-sm hover:bg-red-500/60">🗑️</button>
            </div>
            <div className="px-2 py-1.5 border-t border-gray-600">
              <p className="text-xs text-gray-400 truncate">{savedItem.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const CampaignDetail = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const location  = useLocation();

  const goBack = () => {
    if (location.state?.from === 'campaigns') {
      navigate('/dashboard?section=campaigns');
    } else {
      navigate('/dashboard?section=campaigns');
    }
  };

  const [campaign,           setCampaign]           = useState(null);
  const [strategy,           setStrategy]           = useState(null);
  const [strategySections,   setStrategySections]   = useState([]);
  const [media,              setMedia]              = useState([]);
  const [savedItems,         setSavedItems]         = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [generatingStrategy, setGeneratingStrategy] = useState(false);
  const [error,              setError]              = useState('');
  const [toast,              setToast]              = useState({ visible: false, message: '', type: 'success' });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500);
  }, []);

  useEffect(() => { fetchCampaign(); fetchMedia(); fetchSaved(); }, [id]);
  useEffect(() => { if (strategy) setStrategySections(parseStrategy(strategy)); }, [strategy]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const data = await getCampaignById(id);
      const raw  = data.campaign;
      setCampaign({
        id:               String(raw.id || ''),
        name:             String(raw.name || 'Untitled Campaign'),
        description:      String(raw.product_description || raw.description || ''),
        target_audience:  String(raw.target_audience || ''),
        ai_provider:      String(raw.ai_provider || 'openai'),
        output_formats:   Array.isArray(raw.output_formats) ? raw.output_formats : [],
        status:           String(raw.status || ''),
        created_at:       raw.created_at,
        video_duration:   raw.video_duration || null,
        generated_content: Array.isArray(raw.generated_content) ? raw.generated_content : [],
      });

    } catch { setError('Failed to load campaign'); }
    finally { setLoading(false); }
  };

  const fetchMedia = async () => { try { const d = await getCampaignMedia(id); setMedia(d.media || []); } catch {} };
  const fetchSaved = async () => {
    try { const d = await getSavedContent({ campaign_id: id }); setSavedItems(d.saved_content || []); } catch {}
  };

  const handleSave = useCallback(async ({ title, content, content_type, format, key }) => {
    try {
      const d = await saveContent({ campaign_id: id, title, content, content_type, format });
      setSavedItems(prev => [d.saved, ...prev]);
      showToast(`🔖 "${title}" saved!`);
    } catch { showToast('Failed to save', 'error'); }
  }, [id, showToast]);

  const handleDeleteSaved = async (savedId) => {
    try { await deleteSavedContent(savedId); setSavedItems(prev => prev.filter(s => s.id !== savedId)); }
    catch { showToast('Failed to delete', 'error'); }
  };

  const handleGenerateStrategy = async () => {
    try {
      setGeneratingStrategy(true); setError('');
      const data = await generateStrategy(id);
      setStrategy(data.strategy);
    } catch (err) { setError(err.response?.data?.error || 'Failed to generate strategy'); }
    finally { setGeneratingStrategy(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto" />
        <p className="mt-4 text-gray-400">Loading campaign...</p>
      </div>
    </div>
  );

  if (!campaign) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Campaign not found</h2>
        <button onClick={goBack} className="text-emerald-500 hover:text-emerald-400">← Back to Campaigns</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 pt-16 py-10 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Back */}
        <button onClick={goBack} className="text-emerald-500 hover:text-emerald-400 font-medium mb-6 flex items-center gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Campaigns
        </button>

        {/* Campaign Header */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-white">{campaign.name}</h1>
              <p className="text-gray-400 mt-1 text-sm">{campaign.description}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={handleGenerateStrategy} disabled={generatingStrategy}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-700 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-all">
                {generatingStrategy ? '⏳ Generating...' : '📊 Strategy'}
              </button>

            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-700">
            <div><span className="text-xs text-gray-500">Target Audience</span><p className="text-sm font-medium text-white mt-0.5">{campaign.target_audience}</p></div>
            <div>
              <span className="text-xs text-gray-500">AI Provider</span>
              <p className="text-sm font-medium text-white mt-0.5 capitalize">{campaign.ai_provider || 'gemini'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Status</span>
              <p className="text-sm font-medium text-emerald-400 mt-0.5">🎬 Video-first campaign</p>
            </div>
          </div>
        </div>

        {/* Media Upload */}
        <div className="mb-6">
          <MediaUpload campaignId={id} media={media} onUploadSuccess={fetchMedia} onSelectForVisual={() => {}} selectedMediaId={null} />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>
        )}

        {/* Video Script */}
        <div className="mb-6">
          <VideoScriptCard campaignId={id} campaign={campaign} showToast={showToast} onSave={handleSave} />
        </div>

        {/* Strategy */}
        {strategy && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-7 mb-6">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <h2 className="text-xl font-bold text-white">📊 Marketing Strategy</h2>
              <button onClick={handleGenerateStrategy} disabled={generatingStrategy}
                className="px-3 py-1.5 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-all">
                {generatingStrategy ? 'Regenerating...' : '🔄 Regenerate'}
              </button>
            </div>
            <div className="space-y-2">
              {strategySections.map((section, i) => (
                <StrategySection key={i} title={section.title} content={section.content} icon={section.icon} defaultOpen={i === 0} />
              ))}
            </div>
          </div>
        )}

        <SavedLibrary savedItems={savedItems} onDelete={handleDeleteSaved} />

      </div>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </div>
  );
};

export default CampaignDetail;