// frontend/src/components/SocialConnect.jsx
// Social accounts connection panel — lives in Dashboard

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

const PLATFORMS = [
  {
    id: 'twitter',
    name: 'Twitter / X',
    icon: '𝕏',
    color: '#000000',
    bg: '#000000',
    description: 'Post tweets directly from IVey',
    canPost: true,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'f',
    color: '#1877F2',
    bg: '#1877F2',
    description: 'Connect your Facebook Page',
    canPost: false,
    comingSoon: 'Posting requires Meta app review',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '◈',
    color: '#E1306C',
    bg: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
    description: 'Connect your Instagram Business account',
    canPost: false,
    comingSoon: 'Posting requires Meta app review',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '♪',
    color: '#69C9D0',
    bg: '#010101',
    description: 'Connect your TikTok creator account',
    canPost: false,
    comingSoon: 'Posting requires TikTok app review',
  },
];

function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// ── Quick tweet modal ─────────────────────────────────────────────────────────
function TweetModal({ onClose, onPost }) {
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const remaining = 280 - text.length;

  const handlePost = async () => {
    if (!text.trim()) return;
    setPosting(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/social/twitter/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post');
      setSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, width: '100%', maxWidth: 460, margin: '0 16px', padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff' }}>𝕏</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Post to Twitter / X</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#475569', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
            <p style={{ color: '#f1f5f9', fontWeight: 700, marginBottom: 6 }}>Tweet posted!</p>
            <a href={success.url} target="_blank" rel="noreferrer"
              style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>View on Twitter →</a>
            <br />
            <button onClick={onClose} style={{ marginTop: 16, padding: '8px 20px', borderRadius: 8, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>Close</button>
          </div>
        ) : (
          <>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="What's happening?"
              maxLength={280}
              rows={4}
              style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#f1f5f9', resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <span style={{ fontSize: 12, color: remaining < 20 ? '#ef4444' : '#475569' }}>{remaining} remaining</span>
              {error && <span style={{ fontSize: 11, color: '#ef4444' }}>{error}</span>}
              <button onClick={handlePost} disabled={posting || !text.trim() || remaining < 0}
                style={{ padding: '8px 20px', borderRadius: 8, background: '#000', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: posting ? 'not-allowed' : 'pointer', opacity: posting ? 0.6 : 1 }}>
                {posting ? 'Posting...' : 'Post Tweet'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SocialConnect({ isDark = true }) {
  const [connections, setConnections]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [connecting, setConnecting]     = useState(null);
  const [disconnecting, setDisconnecting] = useState(null);
  const [tweetModal, setTweetModal]     = useState(false);
  const [toast, setToast]               = useState(null);
  const location = useLocation();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Handle OAuth redirect back from backend
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthStatus   = params.get('oauth');
    const oauthPlatform = params.get('platform');
    const oauthUser     = params.get('username');
    if (oauthStatus === 'success') {
      showToast(`✅ Connected to ${oauthPlatform}${oauthUser ? ` as @${oauthUser}` : ''}!`);
      fetchConnections();
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (oauthStatus === 'error') {
      showToast(`❌ Failed to connect ${oauthPlatform}. Please try again.`, 'error');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [location.search]);

  useEffect(() => { fetchConnections(); }, []);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/social/connections`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setConnections(data.connections || []);
    } catch {}
    finally { setLoading(false); }
  };

  const handleConnect = async (platformId) => {
    setConnecting(platformId);
    try {
      const res = await fetch(`${API_BASE}/social/${platformId}/connect`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'No OAuth URL returned');
      }
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platformId) => {
    if (!window.confirm(`Disconnect ${platformId}?`)) return;
    setDisconnecting(platformId);
    try {
      await fetch(`${API_BASE}/social/disconnect/${platformId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setConnections(prev => prev.filter(c => c.platform !== platformId));
      showToast(`Disconnected from ${platformId}`);
    } catch {
      showToast('Failed to disconnect', 'error');
    } finally {
      setDisconnecting(null);
    }
  };

  const getConnection = (platformId) => connections.find(c => c.platform === platformId);

  const surface  = isDark ? '#0f172a' : '#ffffff';
  const border   = isDark ? '#1e293b' : '#e2e8f0';
  const textPri  = isDark ? '#f1f5f9' : '#0f172a';
  const textMut  = isDark ? '#475569' : '#64748b';

  return (
    <>
      <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🔗</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: textPri }}>Social Accounts</div>
            <div style={{ fontSize: 11, color: textMut, marginTop: 1 }}>
              Connect your accounts to post content directly from IVey
            </div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 11, color: textMut }}>
            {loading ? '...' : `${connections.length} connected`}
          </div>
        </div>

        {/* Platform list */}
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PLATFORMS.map(platform => {
            const conn       = getConnection(platform.id);
            const isConn     = !!conn;
            const isBusy     = connecting === platform.id || disconnecting === platform.id;

            return (
              <div key={platform.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderRadius: 12, border: `1px solid ${isConn ? '#10b98133' : border}`,
                background: isConn ? (isDark ? 'rgba(16,185,129,0.04)' : 'rgba(16,185,129,0.03)') : (isDark ? '#080e1a' : '#f8fafc'),
                transition: 'all 0.2s',
              }}>

                {/* Platform icon */}
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: typeof platform.bg === 'string' && platform.bg.includes('gradient') ? platform.bg : platform.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 900, color: '#fff',
                  boxShadow: isConn ? `0 0 0 2px ${platform.color}44` : 'none',
                }}>
                  {platform.icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: textPri }}>{platform.name}</span>
                    {isConn && (
                      <span style={{ fontSize: 9, fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', padding: '1px 6px', borderRadius: 10, letterSpacing: '0.06em' }}>
                        CONNECTED
                      </span>
                    )}
                    {platform.comingSoon && !isConn && (
                      <span style={{ fontSize: 9, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '1px 6px', borderRadius: 10 }}>
                        limited
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: textMut, marginTop: 2 }}>
                    {isConn
                      ? <>@{conn.platform_username || conn.platform_name} · Connected {new Date(conn.connected_at).toLocaleDateString()}</>
                      : platform.comingSoon || platform.description
                    }
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                  {isConn && platform.canPost && (
                    <button onClick={() => setTweetModal(true)}
                      style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#6366f1', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      Post
                    </button>
                  )}
                  {isConn ? (
                    <button onClick={() => handleDisconnect(platform.id)} disabled={isBusy}
                      style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: isBusy ? 0.5 : 1 }}>
                      {disconnecting === platform.id ? '...' : 'Disconnect'}
                    </button>
                  ) : (
                    <button onClick={() => handleConnect(platform.id)} disabled={isBusy}
                      style={{ padding: '6px 14px', borderRadius: 8, background: isConn ? 'transparent' : platform.color, border: `1px solid ${platform.color}`, color: '#fff', fontSize: 11, fontWeight: 700, cursor: isBusy ? 'not-allowed' : 'pointer', opacity: isBusy ? 0.6 : 1, transition: 'all 0.2s' }}>
                      {connecting === platform.id ? 'Opening...' : 'Connect'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tweet modal */}
      {tweetModal && <TweetModal onClose={() => setTweetModal(false)} />}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 100,
          padding: '12px 18px', borderRadius: 12,
          background: toast.type === 'error' ? '#1a0010' : '#071a0f',
          border: `1px solid ${toast.type === 'error' ? '#ef444433' : '#10b98133'}`,
          color: toast.type === 'error' ? '#ef4444' : '#10b981',
          fontSize: 13, fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          maxWidth: 340,
        }}>
          {toast.msg}
        </div>
      )}
    </>
  );
}