// frontend/src/components/DistributeModal.jsx
import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', emoji: '📸', color: 'border-pink-500 bg-pink-500/10 text-pink-400'     },
  { id: 'tiktok',    label: 'TikTok',    emoji: '🎵', color: 'border-cyan-500 bg-cyan-500/10 text-cyan-400'      },
  { id: 'facebook',  label: 'Facebook',  emoji: '📘', color: 'border-blue-500 bg-blue-500/10 text-blue-400'      },
  { id: 'linkedin',  label: 'LinkedIn',  emoji: '💼', color: 'border-indigo-500 bg-indigo-500/10 text-indigo-400' },
  { id: 'twitter',   label: 'Twitter/X', emoji: '𝕏',  color: 'border-sky-500 bg-sky-500/10 text-sky-400'         },
  { id: 'youtube',   label: 'YouTube',   emoji: '▶️', color: 'border-red-500 bg-red-500/10 text-red-400'         },
];

const DistributeModal = ({ isOpen, onClose, videoUrl, campaign, showToast }) => {
  const [configured,        setConfigured]        = useState(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['instagram', 'tiktok']);
  const [caption,           setCaption]           = useState('');
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [scheduleEnabled,   setScheduleEnabled]   = useState(false);
  const [scheduleDate,      setScheduleDate]       = useState('');
  const [scheduleTime,      setScheduleTime]       = useState('09:00');
  const [posting,           setPosting]            = useState(false);
  const [result,            setResult]             = useState(null);
  const [error,             setError]              = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setResult(null); setError('');
    checkStatus();
  }, [isOpen]);

  const checkStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/ayrshare/status`, { headers: { Authorization: `Bearer ${token}` } });
      const data  = await res.json();
      setConfigured(data.configured);
    } catch { setConfigured(false); }
  };

  const togglePlatform = (id) =>
    setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

  const handleGenerateCaption = async () => {
    if (!campaign) return;
    setGeneratingCaption(true); setCaption('');
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/campaigns/${campaign.id}/caption`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ format: 'VIDEO_SCRIPT', platform: selectedPlatforms[0] || 'instagram', ai_provider: campaign.ai_provider || 'gemini' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate caption');
      setCaption(data.caption || '');
    } catch (err) { setError(err.message); }
    finally { setGeneratingCaption(false); }
  };

  const handlePost = async () => {
    if (!selectedPlatforms.length) { setError('Select at least one platform'); return; }
    if (!caption.trim())           { setError('Caption is required'); return; }
    if (!videoUrl?.trim())         { setError('No video URL'); return; }
    if (scheduleEnabled && !scheduleDate) { setError('Pick a date to schedule'); return; }

    setPosting(true); setError(''); setResult(null);
    try {
      const token           = localStorage.getItem('token');
      const scheduleDateTime = scheduleEnabled && scheduleDate
        ? new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString()
        : null;

      const endpoint = scheduleEnabled ? '/ayrshare/schedule' : '/ayrshare/post';
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          videoUrl, caption: caption.trim(), platforms: selectedPlatforms,
          campaignId: campaign?.id || null,
          ...(scheduleEnabled && { scheduleDate: scheduleDateTime }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to distribute');
      setResult(data);
      showToast(data.message || (scheduleEnabled ? '⏰ Post scheduled!' : '🚀 Video distributed!'), 'success');
    } catch (err) { setError(err.message); }
    finally { setPosting(false); }
  };

  if (!isOpen) return null;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">🚀 Distribute Video</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{videoUrl}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 flex items-center justify-center text-sm">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* Loading */}
          {configured === null && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"/>
            </div>
          )}

          {/* Not configured */}
          {configured === false && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <p className="text-sm font-bold text-amber-400 mb-2">⚡ Ayrshare not connected yet</p>
                <p className="text-xs text-gray-400 leading-relaxed mb-3">
                  Ayrshare lets IVey post your video to all platforms with one click — $29/month.
                </p>
                <ol className="text-xs text-gray-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>Sign up at <a href="https://app.ayrshare.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">app.ayrshare.com</a></li>
                  <li>Connect your social profiles inside Ayrshare</li>
                  <li>Copy your API key from the Ayrshare dashboard</li>
                  <li>Add <code className="bg-gray-800 px-1 rounded text-amber-400">AYRSHARE_API_KEY</code> to Railway environment variables</li>
                  <li>Railway auto-restarts — distribution works immediately, no redeploy needed</li>
                </ol>
              </div>
              <div className="p-3 bg-gray-800 border border-gray-700 rounded-xl">
                <p className="text-xs font-bold text-gray-400 mb-2">Supported platforms:</p>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(p => (
                    <span key={p.id} className={`text-xs px-2 py-1 rounded-lg border font-medium ${p.color}`}>
                      {p.emoji} {p.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Configured — distribution UI */}
          {configured === true && !result && (
            <>
              {/* Platform selector */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Select Platforms</p>
                <div className="grid grid-cols-3 gap-2">
                  {PLATFORMS.map(p => (
                    <button key={p.id} onClick={() => togglePlatform(p.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                        selectedPlatforms.includes(p.id) ? p.color : 'border-gray-700 text-gray-500 hover:border-gray-600'
                      }`}>
                      <span>{p.emoji}</span>
                      <span className="truncate">{p.label}</span>
                      {selectedPlatforms.includes(p.id) && <span className="ml-auto flex-shrink-0">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Caption</p>
                  <button onClick={handleGenerateCaption} disabled={generatingCaption || !campaign}
                    className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-40">
                    {generatingCaption
                      ? <><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Generating...</>
                      : '✨ Auto-generate'}
                  </button>
                </div>
                <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={4}
                  placeholder="Write a caption or click Auto-generate..."
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl resize-none focus:ring-2 focus:ring-emerald-500 outline-none placeholder-gray-500"/>
                <p className="text-xs text-gray-600 mt-1">{caption.length} chars</p>
              </div>

              {/* Schedule */}
              <div>
                <button onClick={() => setScheduleEnabled(!scheduleEnabled)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all w-full ${
                    scheduleEnabled ? 'border-violet-500 bg-violet-500/10 text-violet-400' : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                  }`}>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${scheduleEnabled ? 'bg-violet-500 border-violet-500' : 'border-gray-500'}`}>
                    {scheduleEnabled && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                  </div>
                  <span>⏰ Schedule for later</span>
                  <span className="ml-auto text-xs text-gray-500">{scheduleEnabled ? 'On' : 'Post immediately'}</span>
                </button>
                {scheduleEnabled && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1.5">Date</label>
                      <input type="date" value={scheduleDate} min={minDate} onChange={e => setScheduleDate(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl focus:ring-2 focus:ring-violet-500 outline-none"/>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1.5">Time</label>
                      <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm rounded-xl focus:ring-2 focus:ring-violet-500 outline-none"/>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-900/20 border border-red-800 text-red-400 rounded-xl text-xs">
                  ⚠️ {error}
                </div>
              )}
            </>
          )}

          {/* Success */}
          {configured === true && result && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="text-4xl mb-3">{scheduleEnabled ? '⏰' : '🚀'}</div>
                <p className="text-lg font-bold text-white">{result.message}</p>
                {result.scheduledAt && (
                  <p className="text-xs text-gray-400 mt-1">Scheduled for {new Date(result.scheduledAt).toLocaleString()}</p>
                )}
              </div>
              <div className="space-y-2">
                {(result.results || []).map((r, i) => {
                  const platform = PLATFORMS.find(p => p.id === r.platform);
                  return (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${r.status === 'success' ? 'border-emerald-700/40 bg-emerald-900/10' : 'border-red-700/40 bg-red-900/10'}`}>
                      <span className="text-lg">{platform?.emoji || '📱'}</span>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-300 capitalize">{r.platform}</p>
                        {r.postUrl && <a href={r.postUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:underline">View post →</a>}
                        {r.errors?.[0] && <p className="text-xs text-red-400">{r.errors[0].message}</p>}
                      </div>
                      <span>{r.status === 'success' ? '✅' : '❌'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex-shrink-0">
          {configured === true && !result ? (
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-all">Cancel</button>
              <button onClick={handlePost} disabled={posting || !selectedPlatforms.length || !caption.trim()}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white rounded-xl text-sm font-bold disabled:opacity-40 transition-all shadow-lg hover:from-emerald-600 hover:to-emerald-800">
                {posting
                  ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>{scheduleEnabled ? 'Scheduling...' : 'Posting...'}</span>
                  : scheduleEnabled ? '⏰ Schedule Post' : '🚀 Post Now'}
              </button>
            </div>
          ) : (
            <button onClick={onClose} className="w-full py-2.5 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-all">
              {result ? 'Done' : 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DistributeModal;