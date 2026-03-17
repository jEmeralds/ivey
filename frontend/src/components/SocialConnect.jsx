// frontend/src/components/SocialConnect.jsx
// Social accounts — connect, post, upload, analytics

import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

const PLATFORMS = [
  { id: 'twitter',   name: 'Twitter / X', icon: '𝕏', color: '#000000', canPost: true,  canUpload: true  },
  { id: 'facebook',  name: 'Facebook',    icon: 'f', color: '#1877F2', canPost: false, canUpload: false, soon: 'Pending Meta app review' },
  { id: 'instagram', name: 'Instagram',   icon: '◈', color: '#E1306C', canPost: false, canUpload: false, soon: 'Pending Meta app review' },
  { id: 'tiktok',    name: 'TikTok',      icon: '♪', color: '#69C9D0', canPost: false, canUpload: false, soon: 'Pending TikTok app review' },
];

const PLATFORM_META = Object.fromEntries(PLATFORMS.map(p => [p.id, p]));

function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// ── Sparkline bar chart ───────────────────────────────────────────────────────
function Sparkline({ data, color = '#6366f1' }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d[1]), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 32 }}>
      {data.slice(-14).map(([day, count], i) => (
        <div key={i} title={`${day}: ${count}`} style={{
          flex: 1, borderRadius: 2,
          height: `${Math.max(4, (count / max) * 100)}%`,
          background: count > 0 ? color : 'rgba(255,255,255,0.05)',
          transition: 'height 0.3s',
        }} />
      ))}
    </div>
  );
}

// ── Post/Upload Modal ─────────────────────────────────────────────────────────
function PostModal({ platform, prefillText, campaignId, onClose, onPosted }) {
  const [tab,      setTab]      = useState(prefillText ? 'post' : 'post');
  const [text,     setText]     = useState(prefillText || '');
  const [caption,  setCaption]  = useState('');
  const [files,    setFiles]    = useState([]);
  const [previews, setPreviews] = useState([]);
  const [posting,  setPosting]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(null);
  const fileRef = useRef();
  const p = PLATFORM_META[platform];
  const charLimit = platform === 'twitter' ? 280 : 2200;
  const remaining = charLimit - (tab === 'post' ? text : caption).length;

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files).slice(0, 4);
    setFiles(selected);
    setPreviews(selected.map(f => ({ url: URL.createObjectURL(f), type: f.type })));
  };

  const handlePost = async () => {
    setPosting(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/social/${platform}/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ text: text.slice(0, charLimit), campaignId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post');
      setSuccess(data);
      onPosted?.();
    } catch (err) { setError(err.message); }
    finally { setPosting(false); }
  };

  const handleUpload = async () => {
    if (!files.length && !caption.trim()) return setError('Add media or caption');
    setPosting(true); setError('');
    try {
      const form = new FormData();
      form.append('caption', caption.slice(0, charLimit));
      if (campaignId) form.append('campaignId', campaignId);
      files.forEach(f => form.append('media', f));
      const res = await fetch(`${API_BASE}/social/${platform}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload');
      setSuccess(data);
      onPosted?.();
    } catch (err) { setError(err.message); }
    finally { setPosting(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#0c1420', border: '1px solid #1e293b', borderRadius: 18, width: '100%', maxWidth: 500, margin: '0 16px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff' }}>{p.icon}</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Post to {p.name}</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#475569', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1e293b' }}>
          {[{ id: 'post', label: '✏️ Write Post' }, { id: 'upload', label: '📎 Upload Media' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, padding: '10px 0', background: 'transparent', border: 'none', borderBottom: tab === t.id ? `2px solid ${p.color}` : '2px solid transparent', color: tab === t.id ? '#f1f5f9' : '#475569', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 20 }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Posted successfully!</p>
              {success.url && <a href={success.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: p.color }}>View on {p.name} →</a>}
              <br />
              <button onClick={onClose} style={{ marginTop: 16, padding: '8px 24px', borderRadius: 8, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>Close</button>
            </div>
          ) : tab === 'post' ? (
            <>
              <textarea value={text} onChange={e => setText(e.target.value)} placeholder={`What's on your mind?`} maxLength={charLimit} rows={5}
                style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#f1f5f9', resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6 }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                <span style={{ fontSize: 11, color: remaining < 20 ? '#ef4444' : '#475569' }}>{remaining} remaining</span>
                {error && <span style={{ fontSize: 11, color: '#ef4444', maxWidth: 200, textAlign: 'right' }}>{error}</span>}
                <button onClick={handlePost} disabled={posting || !text.trim() || remaining < 0}
                  style={{ padding: '8px 22px', borderRadius: 8, background: p.color, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: posting ? 'not-allowed' : 'pointer', opacity: posting ? 0.6 : 1 }}>
                  {posting ? 'Posting...' : 'Post Now'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Media picker */}
              <div onClick={() => fileRef.current.click()} style={{ width: '100%', minHeight: 100, borderRadius: 10, background: '#1e293b', border: '2px dashed #334155', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, overflow: 'hidden', position: 'relative' }}>
                {previews.length ? (
                  <div style={{ display: 'grid', gridTemplateColumns: previews.length > 1 ? '1fr 1fr' : '1fr', gap: 4, width: '100%', padding: 4 }}>
                    {previews.map((p, i) => (
                      p.type.startsWith('video')
                        ? <video key={i} src={p.url} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6 }} />
                        : <img key={i} src={p.url} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6 }} />
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <div style={{ fontSize: 28, opacity: 0.3, marginBottom: 6 }}>📎</div>
                    <div style={{ fontSize: 11, color: '#475569' }}>Click to add photos or videos (max 4)</div>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={handleFiles} />

              {/* Caption */}
              <textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="Write a caption..." maxLength={charLimit} rows={3}
                style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#f1f5f9', resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 10 }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: remaining < 20 ? '#ef4444' : '#475569' }}>{remaining} remaining</span>
                {error && <span style={{ fontSize: 11, color: '#ef4444' }}>{error}</span>}
                <button onClick={handleUpload} disabled={posting}
                  style={{ padding: '8px 22px', borderRadius: 8, background: p.color, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: posting ? 'not-allowed' : 'pointer', opacity: posting ? 0.6 : 1 }}>
                  {posting ? 'Uploading...' : 'Upload & Post'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Analytics panel ───────────────────────────────────────────────────────────
function PostItem({ post, pm, card, border, textPri, textMut, onRetry, onDelete }) {
  const [retrying, setRetrying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  return (
    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: pm.color || '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 900, flexShrink: 0 }}>{pm.icon || '?'}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: textPri, lineHeight: 1.4, marginBottom: 3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {post.content_text || post.caption || '(media only)'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, color: post.status === 'published' ? '#10b981' : '#ef4444', fontWeight: 700, textTransform: 'uppercase' }}>{post.status}</span>
          <span style={{ fontSize: 9, color: textMut }}>{post.source}</span>
          <span style={{ fontSize: 9, color: textMut }}>{new Date(post.posted_at).toLocaleDateString()}</span>
          {post.platform_url && <a href={post.platform_url} target="_blank" rel="noreferrer" style={{ fontSize: 9, color: pm.color, textDecoration: 'none' }}>View →</a>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'center' }}>
        {post.status === 'failed' && (
          <button onClick={() => { setRetrying(true); onRetry(post.id).finally(() => setRetrying(false)); }} disabled={retrying}
            title="Retry post"
            style={{ padding: '3px 9px', borderRadius: 6, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#6366f1', fontSize: 10, fontWeight: 700, cursor: retrying ? 'not-allowed' : 'pointer', opacity: retrying ? 0.5 : 1 }}>
            {retrying ? '...' : '↺ Retry'}
          </button>
        )}
        <button onClick={() => onDelete(post.id)} disabled={deleting}
          title="Delete post"
          style={{ padding: '3px 9px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 10, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.5 : 1 }}>
          {deleting ? '...' : '✕'}
        </button>
      </div>
    </div>
  );
}

export function AnalyticsPanel({ isDark }) {
  const [stats,  setStats]  = useState(null);
  const [posts,  setPosts]  = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/social/posts/stats`, { headers: { Authorization: `Bearer ${getToken()}` } }).then(r => r.json()),
      fetch(`${API_BASE}/social/posts?limit=20`, { headers: { Authorization: `Bearer ${getToken()}` } }).then(r => r.json()),
    ]).then(([s, p]) => {
      setStats(s);
      setPosts(p.posts || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleRetry = async (postId) => {
    try {
      const res = await fetch(`${API_BASE}/social/posts/${postId}/retry`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'published', platform_url: data.url } : p));
      setStats(prev => prev ? { ...prev, published: (prev.published || 0) + 1, failed: Math.max(0, (prev.failed || 0) - 1) } : prev);
    } catch (err) { alert('Retry failed: ' + err.message); }
  };

  const handleDelete = async (postId) => {
    const post = posts.find(p => p.id === postId);
    if (!window.confirm('Delete this post?' + (post?.status === 'published' ? ' This will also delete it from Twitter.' : ''))) return;
    try {
      const res = await fetch(`${API_BASE}/social/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPosts(prev => prev.filter(p => p.id !== postId));
      setStats(prev => prev ? { ...prev, total: Math.max(0, (prev.total || 0) - 1) } : prev);
    } catch (err) { alert('Delete failed: ' + err.message); }
  };

  const filtered = filter === 'all' ? posts : posts.filter(p => p.platform === filter);
  const bg = isDark ? '#080e1a' : '#f8fafc';
  const card = isDark ? '#0f172a' : '#ffffff';
  const border = isDark ? '#1e293b' : '#e2e8f0';
  const textPri = isDark ? '#f1f5f9' : '#0f172a';
  const textMut = isDark ? '#475569' : '#64748b';

  if (loading) return <div style={{ padding: 20, color: textMut, fontSize: 12 }}>Loading analytics...</div>;

  return (
    <div style={{ background: bg, borderRadius: 14, padding: 20 }}>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total Posts',  value: stats?.total || 0,     color: '#6366f1' },
          { label: 'Published',    value: stats?.published || 0, color: '#10b981' },
          { label: 'Failed',       value: stats?.failed || 0,    color: '#ef4444' },
          ...Object.entries(stats?.byPlatform || {}).map(([p, c]) => ({ label: PLATFORM_META[p]?.name || p, value: c, color: PLATFORM_META[p]?.color || '#475569' })),
        ].map((s, i) => (
          <div key={i} style={{ background: card, border: `1px solid ${border}`, borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: textMut, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Sparkline */}
      {stats?.byDay?.length > 0 && (
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: textMut, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Posts — last 14 days</div>
          <Sparkline data={stats.byDay} color="#6366f1" />
        </div>
      )}

      {/* Post history */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {['all', ...Object.keys(stats?.byPlatform || {})].map(p => (
          <button key={p} onClick={() => setFilter(p)}
            style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid ${filter === p ? (PLATFORM_META[p]?.color || '#6366f1') : border}`, background: filter === p ? ((PLATFORM_META[p]?.color || '#6366f1') + '18') : 'transparent', color: filter === p ? (PLATFORM_META[p]?.color || '#6366f1') : textMut, fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>
            {p === 'all' ? `All (${posts.length})` : `${PLATFORM_META[p]?.name || p} (${stats.byPlatform[p]})`}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
        {filtered.length === 0
          ? <div style={{ fontSize: 12, color: textMut, textAlign: 'center', padding: 20 }}>No posts yet</div>
          : filtered.map(post => {
            const pm = PLATFORM_META[post.platform] || {};
            return (
              <PostItem key={post.id} post={post} pm={pm} card={card} border={border} textPri={textPri} textMut={textMut} onRetry={handleRetry} onDelete={handleDelete} />
            );
          })
        }
      </div>
    </div>
  );
}

// ── Main SocialConnect component ──────────────────────────────────────────────
export default function SocialConnect({ isDark = true }) {
  const [connections,    setConnections]    = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [connecting,     setConnecting]     = useState(null);
  const [disconnecting,  setDisconnecting]  = useState(null);
  const [postModal,      setPostModal]      = useState(null); // { platform, prefillText?, campaignId? }
  const [toast,          setToast]          = useState(null);
  const location = useLocation();

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthStatus = params.get('oauth');
    const oauthPlatform = params.get('platform');
    const oauthUser = params.get('username');
    if (oauthStatus === 'success') {
      showToast(`✅ Connected to ${oauthPlatform}${oauthUser ? ` as @${oauthUser}` : ''}!`);
      fetchConnections();
      window.history.replaceState({}, '', window.location.pathname);
    } else if (oauthStatus === 'error') {
      showToast(`❌ Failed to connect ${oauthPlatform}. Try again.`, 'error');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [location.search]);

  useEffect(() => { fetchConnections(); }, []);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/social/connections`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      setConnections(data.connections || []);
    } catch {}
    finally { setLoading(false); }
  };

  const handleConnect = async (platformId) => {
    setConnecting(platformId);
    try {
      const res = await fetch(`${API_BASE}/social/${platformId}/connect`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error || 'No OAuth URL');
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
      setConnecting(null);
    }
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

  const getConn = (pid) => connections.find(c => c.platform === pid);

  const surface = isDark ? '#0f172a' : '#ffffff';
  const border  = isDark ? '#1e293b' : '#e2e8f0';
  const textPri = isDark ? '#f1f5f9' : '#0f172a';
  const textMut = isDark ? '#475569' : '#64748b';

  return (
    <>
      <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>

        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🔗</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: textPri }}>Social Accounts</div>
            <div style={{ fontSize: 11, color: textMut, marginTop: 1 }}>Connect accounts · Post content · Track activity</div>
          </div>

        </div>

        {/* Platform rows */}
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PLATFORMS.map(platform => {
            const conn   = getConn(platform.id);
            const isConn = !!conn;
            const isBusy = connecting === platform.id || disconnecting === platform.id;
            return (
              <div key={platform.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 11, border: `1px solid ${isConn ? platform.color + '33' : border}`, background: isConn ? platform.color + '08' : (isDark ? '#080e1a' : '#f8fafc'), transition: 'all 0.2s' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: platform.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: '#fff', flexShrink: 0, boxShadow: isConn ? `0 0 0 3px ${platform.color}33` : 'none' }}>
                  {platform.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: textPri }}>{platform.name}</span>
                    {isConn && <span style={{ fontSize: 8, fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', padding: '1px 6px', borderRadius: 10, letterSpacing: '0.06em' }}>CONNECTED</span>}
                    {platform.soon && !isConn && <span style={{ fontSize: 8, color: '#f59e0b', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', padding: '1px 6px', borderRadius: 10 }}>limited</span>}
                  </div>
                  <div style={{ fontSize: 10, color: textMut, marginTop: 1 }}>
                    {isConn ? `@${conn.platform_username || conn.platform_name} · ${new Date(conn.connected_at).toLocaleDateString()}` : (platform.soon || 'Connect your account')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {isConn && platform.canPost && (
                    <button onClick={() => setPostModal({ platform: platform.id })}
                      style={{ padding: '5px 11px', borderRadius: 7, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#6366f1', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      ✏️ Post
                    </button>
                  )}
                  {isConn && platform.canUpload && (
                    <button onClick={() => setPostModal({ platform: platform.id, defaultTab: 'upload' })}
                      style={{ padding: '5px 11px', borderRadius: 7, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      📎 Upload
                    </button>
                  )}
                  {isConn ? (
                    <button onClick={() => handleDisconnect(platform.id)} disabled={isBusy}
                      style={{ padding: '5px 11px', borderRadius: 7, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: isBusy ? 0.5 : 1 }}>
                      {disconnecting === platform.id ? '...' : 'Disconnect'}
                    </button>
                  ) : (
                    <button onClick={() => handleConnect(platform.id)} disabled={isBusy}
                      style={{ padding: '5px 13px', borderRadius: 7, background: platform.color, border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: isBusy ? 'not-allowed' : 'pointer', opacity: isBusy ? 0.6 : 1 }}>
                      {connecting === platform.id ? '...' : 'Connect'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>


      </div>

      {/* Post/Upload modal */}
      {postModal && (
        <PostModal
          platform={postModal.platform}
          prefillText={postModal.prefillText}
          campaignId={postModal.campaignId}
          onClose={() => setPostModal(null)}
          onPosted={() => { showToast('✅ Posted and logged!'); }}
        />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 100, padding: '12px 18px', borderRadius: 12, background: toast.type === 'error' ? '#1a0010' : '#071a0f', border: `1px solid ${toast.type === 'error' ? '#ef444433' : '#10b98133'}`, color: toast.type === 'error' ? '#ef4444' : '#10b981', fontSize: 13, fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxWidth: 340 }}>
          {toast.msg}
        </div>
      )}
    </>
  );
}

// ── Exported helper: use in CampaignDetail content cards ─────────────────────
export function usePostToSocial() {
  const [modal, setModal] = useState(null);
  const open = ({ platform, text, campaignId }) => setModal({ platform, prefillText: text, campaignId });
  const close = () => setModal(null);
  const ModalSlot = modal ? (
    <PostModal platform={modal.platform} prefillText={modal.prefillText} campaignId={modal.campaignId} onClose={close} />
  ) : null;
  return { open, ModalSlot };
}