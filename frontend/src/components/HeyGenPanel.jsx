// frontend/src/components/HeyGenPanel.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Automated HeyGen video production panel
// Replaces the manual "paste URL" workflow with a fully automated flow:
// 1. User picks avatar + voice
// 2. Clicks "Produce Video" → IVey submits script to HeyGen API
// 3. Panel polls for status every 15s
// 4. When ready → video stored in Supabase → Distribute button appears
//
// If HEYGEN_API_KEY not set → shows setup instructions
// If user plan doesn't include video → shows upgrade prompt
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    processing: { label: 'Generating...', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    completed:  { label: 'Ready',         color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    failed:     { label: 'Failed',        color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  };
  const s = map[status] || map.processing;
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${s.color}`}>{s.label}</span>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const HeyGenPanel = ({ campaignId, script, onVideoReady, showToast }) => {
  const [configured,  setConfigured]  = useState(null);
  const [planAllowed, setPlanAllowed] = useState(null);
  const [avatars,     setAvatars]     = useState([]);
  const [voices,      setVoices]      = useState([]);
  const [avatarId,    setAvatarId]    = useState('');
  const [voiceId,     setVoiceId]     = useState('');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [generating,  setGenerating]  = useState(false);
  const [videoId,     setVideoId]     = useState(null);
  const [jobStatus,   setJobStatus]   = useState(null); // processing | completed | failed
  const [videoUrl,    setVideoUrl]    = useState(null);
  const [progress,    setProgress]    = useState(0);
  const [jobs,        setJobs]        = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [error,       setError]       = useState('');
  const pollRef = useRef(null);

  useEffect(() => {
    checkStatus();
    fetchJobs();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const token = () => localStorage.getItem('token');

  const checkStatus = async () => {
    try {
      const res  = await fetch(`${API_URL}/heygen/status`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setConfigured(data.configured);
      // Plan check happens on backend when user tries to generate
      // Always allow the UI to load — backend returns 403 with upgrade:true if plan insufficient
      setPlanAllowed(true);
      if (data.configured) {
        loadAvatarsAndVoices();
      }
    } catch (err) {
      console.warn('HeyGen status check failed:', err.message);
      setConfigured(false);
      setPlanAllowed(true);
    }
  };

  const fetchJobs = async () => {
    if (!campaignId) return;
    try {
      const res  = await fetch(`${API_URL}/heygen/jobs/${campaignId}`, { headers: { Authorization: `Bearer ${token()}` } });
      if (!res.ok) return; // silently skip if endpoint not ready
      const data = await res.json();
      setJobs(data.jobs || []);

      // If there's a processing job, resume polling
      const processing = (data.jobs || []).find(j => j.status === 'processing');
      if (processing) {
        setVideoId(processing.video_id);
        setJobStatus('processing');
        startPolling(processing.video_id);
      }

      // If there's a completed job, surface the video URL
      const completed = (data.jobs || []).find(j => j.status === 'completed');
      if (completed?.video_url) {
        setVideoUrl(completed.video_url);
        setJobStatus('completed');
        onVideoReady?.(completed.video_url);
      }
    } catch {}
  };

  const loadAvatarsAndVoices = async () => {
    setLoadingAssets(true);
    try {
      const [avRes, voRes] = await Promise.all([
        fetch(`${API_URL}/heygen/avatars`, { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`${API_URL}/heygen/voices`,  { headers: { Authorization: `Bearer ${token()}` } }),
      ]);
      const avData = await avRes.json();
      const voData = await voRes.json();
      setAvatars(avData.avatars || []);
      setVoices(voData.voices?.filter(v => v.language === 'English') || []);

      // Default selections
      if (avData.avatars?.[0]) setAvatarId(avData.avatars[0].avatar_id);
      if (voData.voices?.[0])  setVoiceId(voData.voices[0].voice_id);
    } catch (err) {
      setError('Failed to load avatars/voices: ' + err.message);
    } finally {
      setLoadingAssets(false);
    }
  };

  const startPolling = (vid) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => pollStatus(vid), 15000); // every 15s
  };

  const pollStatus = async (vid) => {
    try {
      const res  = await fetch(`${API_URL}/heygen/video/${vid}`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();

      setProgress(data.progress || 0);

      if (data.status === 'completed') {
        clearInterval(pollRef.current);
        setJobStatus('completed');
        setVideoUrl(data.videoUrl);
        setGenerating(false);
        onVideoReady?.(data.videoUrl);
        showToast('🎬 Video ready! Click Distribute to post it.', 'success');
        fetchJobs();
      }

      if (data.status === 'failed') {
        clearInterval(pollRef.current);
        setJobStatus('failed');
        setGenerating(false);
        setError(data.error || 'Video generation failed');
        showToast('❌ Video generation failed', 'error');
      }
    } catch (err) {
      console.error('Poll error:', err.message);
    }
  };

  const handleGenerate = async () => {
    if (!script?.trim()) { setError('Generate a script first'); return; }
    if (!avatarId)        { setError('Select an avatar'); return; }
    if (!voiceId)         { setError('Select a voice'); return; }

    setGenerating(true); setError(''); setJobStatus('processing'); setProgress(0);

    try {
      const res  = await fetch(`${API_URL}/heygen/generate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ campaignId, script, avatarId, voiceId, aspectRatio }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.upgrade) {
          // Backend says plan upgrade required
          setPlanAllowed(false);
          setJobStatus(null);
          setGenerating(false);
          return;
        }
        throw new Error(data.error || data.message || 'Failed to start generation');
      }

      setVideoId(data.videoId);
      showToast('🎬 Video generation started — takes 5-10 minutes', 'info');
      startPolling(data.videoId);
      fetchJobs();
    } catch (err) {
      setError(err.message);
      setGenerating(false);
      setJobStatus(null);
    }
  };

  // ── Not configured ────────────────────────────────────────────────────────
  if (configured === false) return (
    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
      <p className="text-sm font-bold text-amber-400 mb-2">⚡ HeyGen not connected yet</p>
      <p className="text-xs text-gray-400 leading-relaxed mb-3">
        Connect HeyGen to let IVey automatically produce videos from your scripts.
      </p>
      <ol className="text-xs text-gray-400 space-y-1.5 list-decimal list-inside leading-relaxed">
        <li>Sign up at <a href="https://app.heygen.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">app.heygen.com</a></li>
        <li>Go to Settings → API → Generate API Key</li>
        <li>Add <code className="bg-gray-800 px-1 rounded text-amber-400">HEYGEN_API_KEY</code> to Railway environment variables</li>
        <li>Railway auto-restarts — no redeploy needed</li>
      </ol>
    </div>
  );

  // ── Plan not allowed — shown after backend rejects with upgrade:true ────────
  if (planAllowed === false) return (
    <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-xl">
      <p className="text-sm font-bold text-violet-400 mb-1">🔒 Video generation requires Creator or Studio plan</p>
      <p className="text-xs text-gray-400 mb-3">Upgrade to automatically produce HeyGen videos from your scripts.</p>
      <button onClick={() => window.location.href = '/dashboard?section=settings'}
        className="inline-block px-4 py-2 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-lg text-xs font-bold hover:from-violet-700 hover:to-violet-800 transition-all">
        View Plans →
      </button>
    </div>
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (configured === null) return (
    <div className="flex items-center justify-center py-6">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"/>
    </div>
  );

  return (
    <div className="space-y-4">

      {/* Completed video */}
      {jobStatus === 'completed' && videoUrl && (
        <div className="p-4 bg-emerald-900/20 border border-emerald-700/40 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-lg">✅</span>
            <div>
              <p className="text-xs font-bold text-emerald-300">Video ready</p>
              <a href={videoUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-emerald-500 hover:text-emerald-400 truncate block max-w-xs">
                {videoUrl.slice(0, 60)}...
              </a>
            </div>
          </div>
          <p className="text-xs text-gray-500">The Distribute button below is now active. Click it to post to social media.</p>
        </div>
      )}

      {/* Processing status */}
      {jobStatus === 'processing' && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-400 flex-shrink-0"/>
            <p className="text-xs font-bold text-amber-400">HeyGen is producing your video...</p>
            <StatusBadge status="processing" />
          </div>
          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full transition-all duration-1000"
              style={{ width: progress ? `${progress}%` : '15%', animation: progress ? 'none' : 'pulse 2s infinite' }}/>
          </div>
          <p className="text-xs text-gray-500 mt-2">Takes 5-10 minutes. You can leave this page — we'll have it ready when you come back.</p>
        </div>
      )}

      {/* Setup — only show if not processing or completed */}
      {!['processing', 'completed'].includes(jobStatus) && (
        <>
          {loadingAssets ? (
            <div className="flex items-center gap-2 py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"/>
              <p className="text-xs text-gray-400">Loading avatars and voices...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Avatar picker */}
              {avatars.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">Avatar</label>
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                    {avatars.slice(0, 12).map(av => (
                      <button key={av.avatar_id} onClick={() => setAvatarId(av.avatar_id)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                          avatarId === av.avatar_id
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                        }`}>
                        {av.preview_image_url ? (
                          <img src={av.preview_image_url} alt={av.avatar_name}
                            className="w-10 h-10 rounded-lg object-cover"/>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-lg">👤</div>
                        )}
                        <span className="text-xs text-gray-400 truncate w-full text-center">{av.avatar_name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Voice picker */}
              {voices.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">Voice</label>
                  <select value={voiceId} onChange={e => setVoiceId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-xs rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
                    {voices.map(v => (
                      <option key={v.voice_id} value={v.voice_id}>
                        {v.display_name || v.name} — {v.gender} {v.accent ? `(${v.accent})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Aspect ratio */}
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-2">Format</label>
                <div className="flex gap-2">
                  {[
                    { id: '9:16', label: '9:16', desc: 'Vertical (TikTok/Reels)' },
                    { id: '16:9', label: '16:9', desc: 'Landscape (YouTube)'    },
                    { id: '1:1',  label: '1:1',  desc: 'Square (Feed)'          },
                  ].map(r => (
                    <button key={r.id} onClick={() => setAspectRatio(r.id)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        aspectRatio === r.id
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                      }`}>
                      <span className="font-black">{r.label}</span>
                      <span className="block text-gray-500 text-xs mt-0.5">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {error && (
        <div className="px-3 py-2 bg-red-900/20 border border-red-800 text-red-400 rounded-xl text-xs">
          ⚠️ {error}
        </div>
      )}

      {/* Generate button */}
      {!['processing', 'completed'].includes(jobStatus) && (
        <button onClick={handleGenerate}
          disabled={generating || loadingAssets || !script?.trim() || !avatarId || !voiceId}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-40 shadow-lg">
          {generating
            ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"/><span>Starting...</span></>
            : <><span>🎬</span><span>Produce with HeyGen</span></>
          }
        </button>
      )}

      {/* Past jobs */}
      {jobs.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Production History</p>
          <div className="space-y-2">
            {jobs.slice(0, 3).map(job => (
              <div key={job.id} className="flex items-center gap-3 p-2.5 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <StatusBadge status={job.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 truncate">{job.video_id}</p>
                  <p className="text-xs text-gray-600">{new Date(job.created_at).toLocaleDateString()}</p>
                </div>
                {job.status === 'completed' && job.video_url && (
                  <button onClick={() => { setVideoUrl(job.video_url); setJobStatus('completed'); onVideoReady?.(job.video_url); }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex-shrink-0">
                    Use this →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HeyGenPanel;