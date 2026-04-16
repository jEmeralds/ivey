// frontend/src/pages/LibraryPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// User's personal content vault
// Tab 1: Scripts — saved scripts from Studio
// Tab 2: Videos — imported/produced videos
// Tab 3: Submissions — gallery submission status
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';
const token   = () => localStorage.getItem('token');
const headers = () => ({ Authorization: `Bearer ${token()}` });
const jh      = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

// ── Submit modal ──────────────────────────────────────────────────────────────
const SubmitModal = ({ item, onClose, onSubmitted }) => {
  const [description, setDescription] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API_URL}/library/${item.id}/submit`, {
        method: 'POST', headers: jh(),
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      onSubmitted();
      onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Submit to Gallery</h3>
        <p className="text-xs text-gray-500 mb-4">Your content will be reviewed by our admin before appearing in the public gallery.</p>

        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
          <p className="text-xs text-gray-500 capitalize mt-0.5">{item.type}</p>
        </div>

        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Description (optional)</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Tell the community what this is about..."
          rows={3}
          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"/>

        {error && <p className="text-xs text-red-400 mb-3">⚠️ {error}</p>}

        <div className="flex gap-2">
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-all">
            {loading ? '⏳ Submitting...' : '🚀 Submit for Review'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Script card ───────────────────────────────────────────────────────────────
const ScriptCard = ({ item, onDelete, onSubmit, submissionStatus }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(item.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{new Date(item.created_at).toLocaleDateString()} · {item.source}</p>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button onClick={copy}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}>
            {copied ? '✅' : '📋'}
          </button>
          <button onClick={() => setExpanded(!expanded)}
            className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">
            {expanded ? '▲' : '▼'}
          </button>
          <button onClick={() => onDelete(item.id)}
            className="px-2.5 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-all">
            ✕
          </button>
        </div>
      </div>

      {expanded && item.content && (
        <div className="bg-gray-900 rounded-xl p-3 mb-3 max-h-40 overflow-y-auto">
          <pre className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed font-mono">{item.content}</pre>
        </div>
      )}

      {/* Gallery submission */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
        {submissionStatus ? (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
            submissionStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
            submissionStatus === 'rejected' ? 'bg-red-500/10 text-red-400' :
            'bg-amber-500/10 text-amber-500'
          }`}>
            {submissionStatus === 'pending' ? '⏳ Pending review' : submissionStatus === 'approved' ? '✅ In gallery' : '❌ Not approved'}
          </span>
        ) : (
          <button onClick={() => onSubmit(item)}
            className="text-xs text-gray-500 hover:text-emerald-500 transition-colors font-medium">
            🖼 Submit to Gallery →
          </button>
        )}
      </div>
    </div>
  );
};

// ── Video card ────────────────────────────────────────────────────────────────
const VideoCard = ({ item, onDelete, onSubmit, submissionStatus }) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
    {/* Thumbnail / video preview */}
    <div className="relative bg-gray-900 h-36">
      {item.video_url ? (
        <video src={item.video_url} className="w-full h-full object-cover" controls={false}
          onMouseEnter={e => e.target.play()} onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }}/>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-3xl opacity-30">🎬</span>
        </div>
      )}
      <div className="absolute top-2 right-2">
        <span className="text-xs font-bold px-2 py-1 bg-black/60 text-white rounded-lg capitalize">{item.source}</span>
      </div>
      {item.duration_sec && (
        <div className="absolute bottom-2 right-2">
          <span className="text-xs bg-black/60 text-white px-2 py-0.5 rounded-md">{item.duration_sec}s</span>
        </div>
      )}
    </div>

    <div className="p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{new Date(item.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-1.5">
          {item.video_url && (
            <a href={item.video_url} target="_blank" rel="noreferrer"
              className="px-2.5 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-500/20 transition-all">
              ▶
            </a>
          )}
          <button onClick={() => onDelete(item.id)}
            className="px-2.5 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-all">
            ✕
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
        {submissionStatus ? (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
            submissionStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
            submissionStatus === 'rejected' ? 'bg-red-500/10 text-red-400' :
            'bg-amber-500/10 text-amber-500'
          }`}>
            {submissionStatus === 'pending' ? '⏳ Pending review' : submissionStatus === 'approved' ? '✅ In gallery' : '❌ Not approved'}
          </span>
        ) : (
          <button onClick={() => onSubmit(item)}
            className="text-xs text-gray-500 hover:text-emerald-500 transition-colors font-medium">
            🖼 Submit to Gallery →
          </button>
        )}
      </div>
    </div>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
const LibraryPage = () => {
  const [tab,         setTab]         = useState('scripts');
  const [items,       setItems]       = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [submitItem,  setSubmitItem]  = useState(null);
  const [toast,       setToast]       = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [itemsRes, subsRes] = await Promise.all([
        fetch(`${API_URL}/library`,             { headers: headers() }),
        fetch(`${API_URL}/library/submissions`, { headers: headers() }),
      ]);
      const [i, s] = await Promise.all([itemsRes.json(), subsRes.json()]);
      setItems(i.items || []);
      setSubmissions(s.submissions || []);
    } catch {}
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await fetch(`${API_URL}/library/${id}`, { method: 'DELETE', headers: headers() });
      setItems(prev => prev.filter(i => i.id !== id));
      showToast('Deleted');
    } catch { showToast('Failed to delete', 'error'); }
  };

  const getSubmissionStatus = (itemId) => {
    const sub = submissions.find(s => s.library_item_id === itemId);
    return sub?.status || null;
  };

  const scripts = items.filter(i => i.type === 'script');
  const videos  = items.filter(i => i.type === 'video');

  const TABS = [
    { id: 'scripts',     label: `📝 Scripts (${scripts.length})`        },
    { id: 'videos',      label: `🎬 Videos (${videos.length})`           },
    { id: 'submissions', label: `🖼 Submissions (${submissions.length})` },
  ];

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"/>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-gray-900 dark:text-white">📚 Library</h2>
        <p className="text-sm text-gray-500 mt-0.5">Your saved scripts and videos. Submit content to the public gallery for community visibility.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── SCRIPTS ── */}
      {tab === 'scripts' && (
        scripts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
            <p className="text-3xl mb-3">📝</p>
            <p className="text-gray-500 text-sm">No scripts saved yet.</p>
            <p className="text-gray-400 text-xs mt-1">Scripts generated in Studio are saved here automatically.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {scripts.map(item => (
              <ScriptCard key={item.id} item={item}
                onDelete={handleDelete}
                onSubmit={setSubmitItem}
                submissionStatus={getSubmissionStatus(item.id)}
              />
            ))}
          </div>
        )
      )}

      {/* ── VIDEOS ── */}
      {tab === 'videos' && (
        videos.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
            <p className="text-3xl mb-3">🎬</p>
            <p className="text-gray-500 text-sm">No videos saved yet.</p>
            <p className="text-gray-400 text-xs mt-1">Import a video in Studio → Produce to save it here.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map(item => (
              <VideoCard key={item.id} item={item}
                onDelete={handleDelete}
                onSubmit={setSubmitItem}
                submissionStatus={getSubmissionStatus(item.id)}
              />
            ))}
          </div>
        )
      )}

      {/* ── SUBMISSIONS ── */}
      {tab === 'submissions' && (
        submissions.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
            <p className="text-3xl mb-3">🖼</p>
            <p className="text-gray-500 text-sm">No gallery submissions yet.</p>
            <p className="text-gray-400 text-xs mt-1">Submit a script or video from your library to appear in the public gallery.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map(sub => (
              <div key={sub.id} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl flex-shrink-0">
                  {sub.content_type === 'video' ? '🎬' : '📝'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{sub.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Submitted {new Date(sub.submitted_at).toLocaleDateString()}</p>
                  {sub.admin_note && <p className="text-xs text-gray-400 mt-0.5 italic">"{sub.admin_note}"</p>}
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 ${
                  sub.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                  sub.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                  'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}>
                  {sub.status === 'pending' ? '⏳ Under Review' : sub.status === 'approved' ? '✅ Approved' : '❌ Not Approved'}
                </span>
              </div>
            ))}
          </div>
        )
      )}

      {/* Submit modal */}
      {submitItem && (
        <SubmitModal
          item={submitItem}
          onClose={() => setSubmitItem(null)}
          onSubmitted={() => { fetchAll(); showToast('🚀 Submitted for review!'); }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-7 right-7 z-50 px-4 py-3 rounded-xl border text-sm font-semibold shadow-2xl ${
          toast.type === 'error' ? 'bg-red-900/90 border-red-500 text-red-300' : 'bg-gray-900/90 border-emerald-500 text-emerald-300'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default LibraryPage;