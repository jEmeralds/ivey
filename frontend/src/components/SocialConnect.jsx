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
      <div style={{ background: '#0c1420', border: '1px solid #1e293b', borderRadius: 18, width: '100%', maxWidth: 500, margin: '0 16px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>{/* Platform rows */}
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
