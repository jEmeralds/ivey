// frontend/src/pages/SocialPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Merged Social + Analytics
// Tab 1: Platforms — connect/disconnect, post
// Tab 2: Posts & Analytics — post history, stats, sparkline
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useDarkMode } from '../hooks/useDarkMode';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

const PLATFORMS = [
  { id: 'twitter',   name: 'Twitter / X', icon: '𝕏', color: '#000000', canPost: true,  canUpload: true  },
  { id: 'facebook',  name: 'Facebook',    icon: 'f', color: '#1877F2', canPost: false, canUpload: false, soon: 'Pending Meta app review' },
  { id: 'instagram', name: 'Instagram',   icon: '◈', color: '#E1306C', canPost: false, canUpload: false, soon: 'Pending Meta app review' },
  { id: 'tiktok',    name: 'TikTok',      icon: '♪', color: '#69C9D0', canPost: false, canUpload: false, soon: 'Pending TikTok app review' },
];

const PM = Object.fromEntries(PLATFORMS.map(p => [p.id, p]));

const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

// ── Sparkline ─────────────────────────────────────────────────────────────────
const Sparkline = ({ data, color = '#6366f1', isDark }) => {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d[1]), 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.slice(-14).map(([day, count], i) => (
        <div key={i} title={`${day}: ${count}`}
          className="flex-1 rounded-sm transition-all"
          style={{
            height: `${Math.max(4, (count / max) * 100)}%`,
            background: count > 0 ? color : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
          }}
        />
      ))}
    </div>
  );
};

// ── Post Modal ────────────────────────────────────────────────────────────────
const PostModal = ({ platform, prefillText, prefillImage, campaignId, onClose, onPosted }) => {
  const [tab,      setTab]      = useState(prefillImage ? 'upload' : 'post');
  const [text,     setText]     = useState(prefillText || '');
  const [caption,  setCaption]  = useState(prefillText || '');
  const [files,    setFiles]    = useState([]);
  const [previews, setPreviews] = useState(prefillImage ? [{ url: prefillImage, type: 'image/url', isUrl: true }] : []);
  const [posting,  setPosting]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(null);
  const fileRef = useRef();
  const p = PM[platform];
  const charLimit = platform === 'twitter' ? 280 : 2200;
  const remaining = charLimit - (tab === 'post' ? text : caption).length;

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files).slice(0, 4);
    setFiles(selected);
    const newPreviews = selected.map(f => ({ url: URL.createObjectURL(f), type: f.type, isUrl: false }));
    setPreviews(prefillImage ? [{ url: prefillImage, type: 'image/url', isUrl: true }, ...newPreviews] : newPreviews);
  };

  const extractVideoUrl = (str) => {
    const match = str.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/)\S+/i);
    return match ? match[0] : null;
  };

  const postTweet = async (tweetText) => {
    const res = await fetch(`${API_BASE}/social/${platform}/post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ text: tweetText.slice(0, 280), campaignId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to post');
    return data;
  };

  const handlePost = async () => {
    setPosting(true); setError('');
    try {
      const rawText  = text.slice(0, charLimit);
      const videoUrl = extractVideoUrl(rawText);
      let finalText  = rawText;
      if (videoUrl) {
        const without = rawText.replace(videoUrl, '').trim();
        finalText = without ? `${without}\n\n${videoUrl}` : videoUrl;
      }
      const data = await postTweet(finalText);
      setSuccess(data); onPosted?.();
    } catch (err) { setError(err.message); }
    finally { setPosting(false); }
  };

  const handleUpload = async () => {
    setPosting(true); setError('');
    try {
      const rawCaption = caption.slice(0, charLimit);
      const videoUrl   = extractVideoUrl(rawCaption);

      if (videoUrl && files.length === 0 && !prefillImage) {
        const without   = rawCaption.replace(videoUrl, '').trim();
        const finalText = without ? `${without}\n\n${videoUrl}` : videoUrl;
        const data = await postTweet(finalText);
        setSuccess(data); onPosted?.(); return;
      }

      let mediaPublicUrl = null;
      if (files.length > 0 || prefillImage) {
        const storageForm = new FormData();
        if (files.length > 0) storageForm.append('image', files[0]);
        else storageForm.append('imageUrl', prefillImage);
        const storageRes = await fetch(`${API_BASE}/social/upload-to-storage`, {
          method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: storageForm,
        });
        const storageData = await storageRes.json();
        if (!storageRes.ok) throw new Error(storageData.error || 'Failed to upload');
        mediaPublicUrl = storageData.publicUrl;
      }

      const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'https://ivey-steel.vercel.app';
      let fullText = rawCaption;
      if (mediaPublicUrl) {
        const cardUrl = `${FRONTEND_URL}/api/card?img=${encodeURIComponent(mediaPublicUrl)}&title=${encodeURIComponent(rawCaption.slice(0, 80))}`;
        fullText = `${rawCaption}\n\n${cardUrl}`.slice(0, 280);
      }
      const data = await postTweet(fullText);
      setSuccess(data); onPosted?.();
    } catch (err) { setError(err.message); }
    finally { setPosting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white" style={{ background: p.color }}>{p.icon}</div>
            <div>
              <p className="text-sm font-bold text-white">Post to {p.name}</p>
              {prefillText && <p className="text-xs text-emerald-400 mt-0.5">Pre-filled with campaign content</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl">✕</button>
        </div>

        <div className="flex border-b border-gray-700">
          {[{ id: 'post', label: '✏️ Write Post' }, { id: 'upload', label: '📎 With Media' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${tab === t.id ? 'text-white border-current' : 'text-gray-500 border-transparent'}`}
              style={{ borderColor: tab === t.id ? p.color : 'transparent' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {success ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-white font-bold mb-1">Posted successfully!</p>
              {success.url && <a href={success.url} target="_blank" rel="noreferrer" className="text-xs" style={{ color: p.color }}>View on {p.name} →</a>}
              <button onClick={onClose} className="block mx-auto mt-4 px-6 py-2 bg-gray-800 border border-gray-700 text-gray-400 rounded-lg text-xs">Close</button>
            </div>
          ) : tab === 'post' ? (
            <>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs text-gray-500">Compose</span>
                <span className={`text-xs ${remaining < 20 ? 'text-red-400' : 'text-gray-500'}`}>{remaining}/{charLimit}</span>
              </div>
              <textarea value={text} onChange={e => setText(e.target.value)} placeholder="What's on your mind?" maxLength={charLimit} rows={6} autoFocus
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
              {error && <p className="text-xs text-red-400 mt-2">⚠️ {error}</p>}
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={onClose} className="px-4 py-2 bg-transparent border border-gray-700 text-gray-500 rounded-lg text-xs">Cancel</button>
                <button onClick={handlePost} disabled={posting || !text.trim() || remaining < 0}
                  className="px-5 py-2 text-white text-xs font-bold rounded-lg disabled:opacity-50" style={{ background: p.color }}>
                  {posting ? 'Posting...' : 'Post Now'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div onClick={() => fileRef.current.click()}
                className="w-full min-h-28 rounded-xl bg-gray-800 border-2 border-dashed border-gray-700 cursor-pointer flex items-center justify-center mb-3 overflow-hidden">
                {previews.length ? (
                  <div className={`grid gap-1 w-full p-1 ${previews.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {previews.map((pv, i) => (
                      <div key={i} className="relative">
                        {pv.type.startsWith('video')
                          ? <video src={pv.url} className="w-full h-28 object-cover rounded-lg"/>
                          : <img src={pv.url} alt="" className="w-full h-28 object-cover rounded-lg"/>
                        }
                        {pv.isUrl && <span className="absolute top-1 left-1 text-xs bg-emerald-500/80 text-white px-2 py-0.5 rounded-md">AI</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6">
                    <p className="text-2xl opacity-30 mb-1">📎</p>
                    <p className="text-xs text-gray-500">Click to add photos or videos</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFiles}/>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs text-gray-500">Caption</span>
                <span className={`text-xs ${remaining < 20 ? 'text-red-400' : 'text-gray-500'}`}>{remaining}/{charLimit}</span>
              </div>
              <textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="Write a caption..." maxLength={charLimit} rows={3}
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-3"/>
              {error && <p className="text-xs text-red-400 mb-2">⚠️ {error}</p>}
              <div className="flex justify-end gap-2">
                <button onClick={onClose} className="px-4 py-2 border border-gray-700 text-gray-500 rounded-lg text-xs">Cancel</button>
                <button onClick={handleUpload} disabled={posting || (previews.length === 0 && !caption.trim())}
                  className="px-5 py-2 text-white text-xs font-bold rounded-lg disabled:opacity-50" style={{ background: p.color }}>
                  {posting ? 'Posting...' : previews.length > 0 ? 'Post with Media' : 'Post'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Post item ─────────────────────────────────────────────────────────────────
const PostItem = ({ post, onRetry, onDelete }) => {
  const [retrying, setRetrying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const pm = PM[post.platform] || {};

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
        style={{ background: pm.color || '#334155' }}>{pm.icon || '?'}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-gray-200 line-clamp-2 leading-snug">
          {post.content_text || post.caption || '(media only)'}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`text-xs font-bold uppercase ${post.status === 'published' ? 'text-emerald-500' : 'text-red-400'}`}>{post.status}</span>
          <span className="text-xs text-gray-500">{post.source}</span>
          <span className="text-xs text-gray-500">{new Date(post.posted_at).toLocaleDateString()}</span>
          {post.platform_url && <a href={post.platform_url} target="_blank" rel="noreferrer" className="text-xs" style={{ color: pm.color }}>View →</a>}
        </div>
      </div>
      <div className="flex gap-1.5 flex-shrink-0">
        {post.status === 'failed' && (
          <button onClick={() => { setRetrying(true); onRetry(post.id).finally(() => setRetrying(false)); }} disabled={retrying}
            className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold rounded-lg disabled:opacity-50">
            {retrying ? '...' : '↺'}
          </button>
        )}
        <button onClick={() => onDelete(post.id)} disabled={deleting}
          className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg disabled:opacity-50">
          {deleting ? '...' : '✕'}
        </button>
      </div>
    </div>
  );
};

// ── Main SocialPage ───────────────────────────────────────────────────────────
const SocialPage = () => {
  const isDark   = useDarkMode();
  const location = useLocation();
  const [tab,           setTab]           = useState('platforms');
  const [connections,   setConnections]   = useState([]);
  const [posts,         setPosts]         = useState([]);
  const [stats,         setStats]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [connecting,    setConnecting]    = useState(null);
  const [disconnecting, setDisconnecting] = useState(null);
  const [postModal,     setPostModal]     = useState(null);
  const [filter,        setFilter]        = useState('all');
  const [toast,         setToast]         = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  useEffect(() => {
    const params      = new URLSearchParams(location.search);
    const oauthStatus = params.get('oauth');
    const oauthPlat   = params.get('platform');
    const oauthUser   = params.get('username');
    if (oauthStatus === 'success') {
      showToast(`✅ Connected to ${oauthPlat}${oauthUser ? ` as @${oauthUser}` : ''}!`);
      fetchConnections();
      window.history.replaceState({}, '', window.location.pathname);
    } else if (oauthStatus === 'error') {
      showToast(`❌ Failed to connect ${oauthPlat}`, 'error');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [location.search]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchConnections(), fetchPosts()]);
    } finally { setLoading(false); }
  };

  const fetchConnections = async () => {
    try {
      const res  = await fetch(`${API_BASE}/social/connections`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      setConnections(data.connections || []);
    } catch {}
  };

  const fetchPosts = async () => {
    try {
      const [statsRes, postsRes] = await Promise.all([
        fetch(`${API_BASE}/social/posts/stats`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${API_BASE}/social/posts?limit=50`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      ]);
      const [s, p] = await Promise.all([statsRes.json(), postsRes.json()]);
      setStats(s);
      setPosts(p.posts || []);
    } catch {}
  };

  const handleConnect = async (platformId) => {
    setConnecting(platformId);
    try {
      const res  = await fetch(`${API_BASE}/social/${platformId}/connect`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error || 'No OAuth URL');
    } catch (err) { showToast(`❌ ${err.message}`, 'error'); setConnecting(null); }
  };

  const handleDisconnect = async (platformId) => {
    if (!window.confirm(`Disconnect ${platformId}?`)) return;
    setDisconnecting(platformId);
    try {
      await fetch(`${API_BASE}/social/disconnect/${platformId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
      setConnections(prev => prev.filter(c => c.platform !== platformId));
      showToast(`Disconnected from ${platformId}`);
    } catch { showToast('Failed to disconnect', 'error'); }
    finally { setDisconnecting(null); }
  };

  const handleRetry = async (postId) => {
    const res  = await fetch(`${API_BASE}/social/posts/${postId}/retry`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'published', platform_url: data.url } : p));
  };

  const handleDelete = async (postId) => {
    const post = posts.find(p => p.id === postId);
    if (!window.confirm('Delete this post?' + (post?.status === 'published' ? ' Also removes from Twitter.' : ''))) return;
    const res  = await fetch(`${API_BASE}/social/posts/${postId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    if (!res.ok) { showToast('Delete failed: ' + data.error, 'error'); return; }
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const getConn   = (pid) => connections.find(c => c.platform === pid);
  const filtered  = filter === 'all' ? posts : posts.filter(p => p.platform === filter);

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 w-fit">
        {[
          { id: 'platforms', label: '🔗 Platforms'        },
          { id: 'analytics', label: '📊 Posts & Analytics' },
        ].map(t => (
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

      {/* ── PLATFORMS TAB ── */}
      {tab === 'platforms' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
          <div className="p-4 space-y-3">
            {PLATFORMS.map(platform => {
              const conn   = getConn(platform.id);
              const isConn = !!conn;
              const isBusy = connecting === platform.id || disconnecting === platform.id;
              return (
                <div key={platform.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isConn ? 'border-opacity-30' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40'
                }`} style={{ borderColor: isConn ? platform.color + '50' : undefined, background: isConn ? platform.color + '08' : undefined }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-black text-white flex-shrink-0"
                    style={{ background: platform.color, boxShadow: isConn ? `0 0 0 3px ${platform.color}30` : 'none' }}>
                    {platform.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{platform.name}</span>
                      {isConn && <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">CONNECTED</span>}
                      {platform.soon && !isConn && <span className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">limited</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isConn ? `@${conn.platform_username || conn.platform_name} · ${new Date(conn.connected_at).toLocaleDateString()}` : (platform.soon || 'Connect your account')}
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {isConn && platform.canPost && (
                      <button onClick={() => setPostModal({ platform: platform.id })}
                        className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-bold rounded-lg hover:bg-indigo-500/20 transition-all">
                        ✏️ Post
                      </button>
                    )}
                    {isConn ? (
                      <button onClick={() => handleDisconnect(platform.id)} disabled={isBusy}
                        className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/20 disabled:opacity-50 transition-all">
                        {disconnecting === platform.id ? '...' : 'Disconnect'}
                      </button>
                    ) : (
                      <button onClick={() => handleConnect(platform.id)} disabled={isBusy}
                        className="px-3 py-1.5 text-white text-xs font-bold rounded-lg disabled:opacity-60 transition-all"
                        style={{ background: platform.color }}>
                        {connecting === platform.id ? '...' : 'Connect'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ANALYTICS TAB ── */}
      {tab === 'analytics' && (
        <div className="space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Posts', value: stats?.total || 0,     color: 'text-indigo-500' },
              { label: 'Published',   value: stats?.published || 0, color: 'text-emerald-500' },
              { label: 'Failed',      value: stats?.failed || 0,    color: 'text-red-400' },
              { label: 'Twitter / X', value: stats?.byPlatform?.twitter || 0, color: 'text-gray-900 dark:text-white' },
            ].map((s, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Sparkline */}
          {stats?.byDay?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Posts — last 14 days</p>
              <Sparkline data={stats.byDay} color="#6366f1" isDark={isDark}/>
            </div>
          )}

          {/* Filter + post list */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <div className="flex gap-2 mb-4 flex-wrap">
              {['all', ...Object.keys(stats?.byPlatform || {})].map(p => (
                <button key={p} onClick={() => setFilter(p)}
                  className={`px-3 py-1 rounded-full border text-xs font-bold transition-all ${
                    filter === p ? 'text-white' : 'text-gray-500 border-gray-200 dark:border-gray-700'
                  }`}
                  style={filter === p ? { background: PM[p]?.color || '#6366f1', borderColor: PM[p]?.color || '#6366f1' } : {}}>
                  {p === 'all' ? `All (${posts.length})` : `${PM[p]?.name || p} (${stats?.byPlatform?.[p] || 0})`}
                </button>
              ))}
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filtered.length === 0
                ? <p className="text-center text-gray-500 text-sm py-8">No posts yet</p>
                : filtered.map(post => (
                    <PostItem key={post.id} post={post} onRetry={handleRetry} onDelete={handleDelete}/>
                  ))}
            </div>
          </div>
        </div>
      )}

      {/* Post modal */}
      {postModal && (
        <PostModal
          platform={postModal.platform}
          prefillText={postModal.prefillText}
          prefillImage={postModal.prefillImage}
          campaignId={postModal.campaignId}
          onClose={() => setPostModal(null)}
          onPosted={() => { showToast('✅ Posted!'); fetchPosts(); }}
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

export default SocialPage;