import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getCampaignById, generateIdeas, generateStrategy, getCampaignMedia,
  saveContent, getSavedContent, deleteSavedContent,
} from '../services/api';
import { OUTPUT_FORMATS, isVideoFormat, isImageFormat } from '../constants/outputFormats';
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

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div>
            <h2 className="text-base font-bold text-white">📤 Share This Visual</h2>
            <p className="text-xs text-gray-400 mt-0.5">{OUTPUT_FORMATS[format]?.name || format}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 flex items-center justify-center text-sm">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Image preview */}
          {imageUrl && (
            <div className="rounded-xl overflow-hidden border border-gray-700 max-h-48">
              <img src={imageUrl} alt="Visual" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Platform picker */}
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

          {/* Caption area */}
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
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
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
              <p className="text-xs text-gray-500 text-center">Copy the caption then paste it when posting your image</p>
            </div>
          )}

          {/* Download image */}
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
  const [script,        setScript]        = useState('');
  const [generating,    setGenerating]    = useState(false);
  const [videoUrl,      setVideoUrl]      = useState('');
  const [importing,     setImporting]     = useState(false);
  const [importInput,   setImportInput]   = useState('');
  const [copied,        setCopied]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [expanded,      setExpanded]      = useState(false);

  const duration = campaign.video_duration || 60;
  const wordCount = Math.round(duration * 130 / 60);
  const fmtDur = (s) => s < 60 ? `${s}s` : `${Math.floor(s/60)}m${s%60>0?` ${s%60}s`:''}`;

  const handleGenerate = async () => {
    setGenerating(true);
    setScript('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/campaigns/${campaignId}/generate-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ duration_seconds: duration }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate script');
      setScript(data.script);
      setExpanded(true);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyScript = () => {
    // Strip markdown for clean HeyGen paste
    const clean = script
      .replace(/#{1,6}\s*/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .trim();
    navigator.clipboard.writeText(clean);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    showToast('📋 Clean script copied — paste it in HeyGen', 'info');
  };

  const handleHeyGen = () => {
    handleCopyScript();
    window.open('https://app.heygen.com/create', '_blank');
  };

  const handleImport = async () => {
    if (!importInput.trim()) return;
    setImporting(true);
    try {
      await onSave({
        title:        `🎬 Video — ${campaign.name}`,
        content:      importInput.trim(),
        content_type: 'video_import',
        format:       'VIDEO_SCRIPT',
        key:          `video_script_${Date.now()}`,
      });
      setVideoUrl(importInput.trim());
      setImportInput('');
      showToast('📥 Video imported and saved!', 'success');
    } catch { showToast('Failed to import video', 'error'); }
    finally { setImporting(false); }
  };

  const handleSaveScript = async () => {
    if (!script || saved) return;
    await onSave({
      title:        `📝 Script (${fmtDur(duration)}) — ${campaign.name}`,
      content:      script,
      content_type: 'video_script',
      format:       'VIDEO_SCRIPT',
      key:          `script_${Date.now()}`,
    });
    setSaved(true);
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center text-lg flex-shrink-0">🎬</div>
          <div>
            <div className="font-bold text-white text-sm">Video Script</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {fmtDur(duration)} · ~{wordCount} words · Ready for HeyGen
            </div>
          </div>
        </div>
        <button onClick={handleGenerate} disabled={generating}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-bold transition-all disabled:opacity-50">
          {generating ? (
            <><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg> Generating...</>
          ) : script ? '🔄 Regenerate' : '✨ Generate Script'}
        </button>
      </div>

      {/* Script output */}
      {script && (
        <div className="border-b border-gray-800">
          <button onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-800/40 transition-all">
            <span className="text-xs font-semibold text-gray-400">
              {expanded ? 'Hide script' : 'View script'}
            </span>
            <span className={`text-gray-500 text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {expanded && (
            <div className="px-5 pb-4">
              <div className="bg-gray-800/50 rounded-xl p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed font-mono">{script}</pre>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={handleCopyScript}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${copied ? 'bg-amber-500 text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                  {copied ? '✅ Copied!' : '📋 Copy Clean Script'}
                </button>
                <button onClick={handleSaveScript} disabled={saved}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${saved ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}>
                  {saved ? '✅' : '🔖 Save'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HeyGen + Import */}
      <div className="p-5 space-y-4">
        {/* Step 1 — HeyGen */}
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2">Step 1 — Produce the video</p>
          <button onClick={handleHeyGen} disabled={!script}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg">
            🎬 Copy Script & Open HeyGen
          </button>
          {!script && <p className="text-xs text-gray-600 mt-1.5 text-center">Generate the script first</p>}
        </div>

        {/* Step 2 — Import */}
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2">Step 2 — Import your video</p>
          {videoUrl ? (
            <div className="flex items-center gap-3 p-3 bg-emerald-900/20 border border-emerald-700/40 rounded-xl">
              <span className="text-emerald-400 text-lg flex-shrink-0">✅</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-emerald-300">Video imported</p>
                <a href={videoUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-emerald-500 hover:text-emerald-400 truncate block mt-0.5">
                  {videoUrl.slice(0, 50)}...
                </a>
              </div>
              <button onClick={() => setVideoUrl('')} className="text-gray-500 hover:text-gray-300 text-xs flex-shrink-0">✕</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input value={importInput} onChange={e => setImportInput(e.target.value)}
                placeholder="Paste your HeyGen video URL here..."
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 text-white text-xs rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none placeholder-gray-600" />
              <button onClick={handleImport} disabled={!importInput.trim() || importing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex-shrink-0">
                {importing ? '⏳' : '📥 Import'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Image Card ───────────────────────────────────────────────────────────────
const ImageCard = ({ item, campaignId, campaignName, productDescription, targetAudience, onSave, showToast }) => {
  const [shareModal, setShareModal] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);

  const fmt = OUTPUT_FORMATS[item.format] || {};

  const handleSave = async () => {
    if (saved || !item.imageUrl) return;
    setSaving(true);
    await onSave({
      title:        `${fmt.name || item.format} — ${campaignName}`,
      content:      item.imageUrl,
      content_type: 'generated_image',
      format:       item.format,
      key:          `img_${item.format}_${Date.now()}`,
    });
    setSaved(true);
    setSaving(false);
  };

  // Failed generation card
  if (item.error) {
    return (
      <div className="bg-gray-900 border border-red-900/40 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <span className="text-xs font-semibold text-gray-300">{fmt.name || item.format}</span>
          <span className="text-xs text-gray-500">{fmt.platform}</span>
        </div>
        <div className="flex items-center justify-center h-48 bg-gray-800/50 px-6">
          <div className="text-center">
            <div className="text-3xl mb-2">⚠️</div>
            <p className="text-xs text-red-400 font-medium">Generation failed</p>
            <p className="text-xs text-gray-500 mt-1">{item.error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Success card
  return (
    <>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden hover:border-gray-500 transition-all group">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div>
            <span className="text-xs font-semibold text-white">{fmt.name || item.format}</span>
            <span className="text-xs text-gray-500 ml-2">{fmt.platform}</span>
          </div>
          <span className="text-xs font-mono text-gray-600">{fmt.aspect} · {fmt.width}×{fmt.height}</span>
        </div>

        {/* Image */}
        <div className="relative bg-gray-800">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={`${fmt.name || item.format} for ${campaignName}`}
              className="w-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2" />
                <p className="text-xs text-gray-400">Generating...</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {item.imageUrl && (
          <div className="px-4 py-3 flex gap-2">
            <button onClick={() => setShareModal(true)}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all">
              📤 Share
            </button>
            <a href={item.imageUrl} target="_blank" rel="noopener noreferrer" download
              className="px-3 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-700 transition-all">
              ⬇️
            </a>
            <button onClick={handleSave} disabled={saving || saved}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                saved ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
              }`}>
              {saving ? '⏳' : saved ? '✅' : '🔖'}
            </button>
          </div>
        )}
      </div>

      <ShareModal
        isOpen={shareModal}
        onClose={() => setShareModal(false)}
        imageUrl={item.imageUrl}
        format={item.format}
        campaignId={campaignId}
        campaignName={campaignName}
        productDescription={productDescription}
        targetAudience={targetAudience}
        showToast={showToast}
      />
    </>
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
        <div className="px-5 py-4 bg-gray-800/50 border-t border-gray-700">
          <div className="prose prose-sm prose-invert max-w-none text-gray-300">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Parse strategy into sections ────────────────────────────────────────────
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
    const start = s.index + s.matchLength;
    const end   = i < found.length - 1 ? found[i + 1].index : text.length;
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

  const filtered = savedItems.filter(savedItem => {
    if (filter === 'all')    return true;
    if (filter === 'images') return ['generated_image', 'generated_thumbnail'].includes(savedItem.content_type);
    if (filter === 'videos') return savedItem.content_type === 'video_import';
    return true;
  });

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden mt-8">
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
          <div key={savedItem.id} className="relative group rounded-xl overflow-hidden border border-gray-700 bg-gray-800">
            {['generated_image', 'generated_thumbnail'].includes(savedItem.content_type) ? (
              <img src={savedItem.content} alt={savedItem.title} className="w-full aspect-square object-cover" />
            ) : savedItem.content_type === 'video_import' ? (
              <div className="w-full aspect-square flex items-center justify-center bg-gray-800">
                <div className="text-center">
                  <div className="text-3xl mb-1">🎬</div>
                  <p className="text-xs text-gray-400 px-2 truncate">{savedItem.title}</p>
                </div>
              </div>
            ) : null}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
              {['generated_image', 'generated_thumbnail'].includes(savedItem.content_type) && (
                <a href={savedItem.content} target="_blank" rel="noopener noreferrer" download
                  className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white text-sm hover:bg-white/30">⬇️</a>
              )}
              {savedItem.content_type === 'video_import' && (
                <a href={savedItem.content} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white text-sm hover:bg-white/30">▶</a>
              )}
              <button onClick={() => onDelete(savedItem.id)}
                className="w-8 h-8 bg-red-500/40 rounded-lg flex items-center justify-center text-white text-sm hover:bg-red-500/60">🗑️</button>
            </div>
            <div className="px-2 py-1.5 border-t border-gray-700">
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
  const { id }   = useParams();
  const navigate = useNavigate();

  const [campaign,           setCampaign]           = useState(null);
  const [generatedImages,    setGeneratedImages]    = useState([]);
  const [strategy,           setStrategy]           = useState(null);
  const [strategySections,   setStrategySections]   = useState([]);
  const [media,              setMedia]              = useState([]);
  const [savedItems,         setSavedItems]         = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [generating,         setGenerating]         = useState(false);
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
        id:              String(raw.id || ''),
        name:            String(raw.name || 'Untitled Campaign'),
        description:     String(raw.product_description || raw.description || ''),
        target_audience: String(raw.target_audience || ''),
        ai_provider:     String(raw.ai_provider || 'openai'),
        output_formats:  Array.isArray(raw.output_formats) ? raw.output_formats : [],
        status:          String(raw.status || ''),
        created_at:      raw.created_at,
        video_duration:  raw.video_duration || null,
        generated_content: Array.isArray(raw.generated_content) ? raw.generated_content : [],
      });
      // Load any previously generated images
      const prev = (raw.generated_content || []).filter(c => c.imageUrl || c.error);
      if (prev.length) setGeneratedImages(prev);
    } catch { setError('Failed to load campaign'); }
    finally { setLoading(false); }
  };

  const fetchMedia  = async () => { try { const d = await getCampaignMedia(id); setMedia(d.media || []); } catch {} };
  const fetchSaved  = async () => {
    try {
      const d = await getSavedContent({ campaign_id: id });
      setSavedItems(d.saved_content || []);
    } catch {}
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

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError('');
      setGeneratedImages([]);
      const data = await generateIdeas(id);
      setGeneratedImages(data.generatedContent || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to generate images');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateStrategy = async () => {
    try {
      setGeneratingStrategy(true);
      setError('');
      const data = await generateStrategy(id);
      setStrategy(data.strategy);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate strategy');
    } finally {
      setGeneratingStrategy(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto" />
        <p className="mt-4 text-gray-400">Loading campaign...</p>
      </div>
    </div>
  );

  if (!campaign) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Campaign not found</h2>
        <button onClick={() => navigate('/dashboard')} className="text-emerald-500 hover:text-emerald-400">← Back to Dashboard</button>
      </div>
    </div>
  );

  const successImages = generatedImages.filter(i => i.imageUrl);
  const failedImages  = generatedImages.filter(i => i.error);

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Back */}
        <button onClick={() => navigate('/dashboard')} className="text-emerald-500 hover:text-emerald-400 font-medium mb-6 flex items-center gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Dashboard
        </button>

        {/* Campaign Header */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-white">{campaign.name}</h1>
              <p className="text-gray-400 mt-1 text-sm">{campaign.description}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={handleGenerateStrategy} disabled={generatingStrategy}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-all">
                {generatingStrategy ? '⏳ Generating...' : '📊 Strategy'}
              </button>
              <button onClick={handleGenerate} disabled={generating}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-lg hover:from-amber-500 hover:to-amber-700 disabled:opacity-50 transition-all font-semibold shadow-lg">
                {generating ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                    Generating...
                  </span>
                ) : generatedImages.length > 0 ? '🔄 Regenerate' : '✨ Generate Images'}
              </button>
            </div>
          </div>

          {/* Meta */}
          <div className="grid md:grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-800">
            <div><span className="text-xs text-gray-500">Target Audience</span><p className="text-sm font-medium text-white mt-0.5">{campaign.target_audience}</p></div>
            <div><span className="text-xs text-gray-500">Formats</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {campaign.output_formats?.map(f => (
                  <span key={f} className="px-2 py-0.5 bg-emerald-900/30 text-emerald-300 rounded text-xs font-medium">{OUTPUT_FORMATS[f]?.name || f}</span>
                ))}
              </div>
            </div>
            <div><span className="text-xs text-gray-500">Status</span>
              <p className="text-sm font-medium mt-0.5">
                {generatedImages.length > 0
                  ? <span className="text-emerald-400">✅ {successImages.length} image{successImages.length !== 1 ? 's' : ''} generated</span>
                  : <span className="text-gray-400">No images yet</span>}
              </p>
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

        {/* Empty state */}
        {generatedImages.length === 0 && !generating && (
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-12 text-center mb-6">
            <div className="text-6xl mb-4">🎨</div>
            <h2 className="text-xl font-bold text-white mb-2">Ready to generate your visuals?</h2>
            <p className="text-gray-400 mb-8 text-sm max-w-md mx-auto">
              IVey will generate a unique DALL-E 3 image for each format you selected — at the exact dimensions for each platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={handleGenerateStrategy} disabled={generatingStrategy}
                className="px-7 py-3.5 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg font-semibold hover:bg-gray-700 disabled:opacity-50 transition-all text-sm">
                {generatingStrategy ? '⏳ Generating Strategy...' : '📊 Generate Strategy First'}
              </button>
              <button onClick={handleGenerate} disabled={generating}
                className="px-7 py-3.5 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-lg font-semibold hover:from-amber-500 hover:to-amber-700 disabled:opacity-50 transition-all shadow-lg text-sm">
                ✨ Generate Images Now
              </button>
            </div>
          </div>
        )}

        {/* Generating skeleton */}
        {generating && (
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-4 flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-emerald-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
              Generating images with DALL-E 3 — this may take a moment...
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaign.output_formats?.map(f => (
                <div key={f} className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden animate-pulse">
                  <div className="px-4 py-3 border-b border-gray-800 flex justify-between">
                    <div className="h-3 bg-gray-700 rounded w-24" />
                    <div className="h-3 bg-gray-700 rounded w-16" />
                  </div>
                  <div className="bg-gray-800 h-48" />
                  <div className="px-4 py-3 flex gap-2">
                    <div className="flex-1 h-8 bg-gray-700 rounded-lg" />
                    <div className="w-8 h-8 bg-gray-700 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Script Card — shown if campaign has VIDEO_SCRIPT format */}
        {campaign.output_formats?.includes('VIDEO_SCRIPT') && (
          <div className="mb-6">
            <VideoScriptCard
              campaignId={id}
              campaign={campaign}
              showToast={showToast}
              onSave={handleSave}
            />
          </div>
        )}

        {/* Generated image grid */}
        {generatedImages.length > 0 && !generating && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">
                🎨 Generated Visuals
                {failedImages.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-red-400">({failedImages.length} failed)</span>
                )}
              </h2>
              <button onClick={handleGenerate} disabled={generating}
                className="px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-all">
                🔄 Regenerate All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedImages.map((imgItem, idx) => (
                <ImageCard
                  key={idx}
                  item={imgItem}
                  campaignId={id}
                  campaignName={campaign.name}
                  productDescription={campaign.description}
                  targetAudience={campaign.target_audience}
                  onSave={handleSave}
                  showToast={showToast}
                />
              ))}
            </div>
          </div>
        )}

        {/* Strategy */}
        {strategy && (
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-7 mb-6">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <h2 className="text-xl font-bold text-white">📊 Visual Marketing Strategy</h2>
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