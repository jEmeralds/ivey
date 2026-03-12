// frontend/src/components/GallerySubmitButton.jsx
// Dashboard only — submit + manage (delete) your own gallery items

import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

const PLATFORM_META = {
  youtube:   { color: '#FF0000', label: 'YouTube' },
  tiktok:    { color: '#69C9D0', label: 'TikTok' },
  instagram: { color: '#E1306C', label: 'Instagram' },
  facebook:  { color: '#1877F2', label: 'Facebook' },
  link:      { color: '#94a3b8', label: 'Link' },
};

function detectPlatform(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('facebook.com')) return 'facebook';
  return 'link';
}

function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// ── Submit Modal ──────────────────────────────────────────────────────────────
function SubmitModal({ onClose, onAdded, campaigns, isDark }) {
  const [url, setUrl]           = useState('');
  const [caption, setCaption]   = useState('');
  const [brandName, setBrandName] = useState('');
  const [format, setFormat]     = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [views, setViews]       = useState('');
  const [likes, setLikes]       = useState('');
  const [agreed, setAgreed]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  const detectedPlatform = url.length > 10 ? detectPlatform(url) : null;
  const canSubmit = url && caption && brandName && agreed && !loading;

  const surface = isDark ? '#1e293b' : '#ffffff';
  const border  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const text    = isDark ? '#f1f5f9' : '#0f172a';
  const muted   = isDark ? '#64748b' : '#94a3b8';
  const inputBg = isDark ? '#0f172a' : '#f8fafc';

  const inputStyle = {
    width: '100%', padding: '10px 13px', borderRadius: 9,
    border: `1.5px solid ${border}`, background: inputBg,
    color: text, fontSize: 13, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/gallery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ url, caption, brand_name: brandName, format, campaign_id: campaignId || null, views, likes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setSuccess(true);
      onAdded(data.item);
      setTimeout(() => { setSuccess(false); onClose(); }, 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: surface, border: `1px solid ${border}`, borderRadius: 18, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto' }}>

        {success ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🎉</div>
            <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: '#10b981' }}>Added to Gallery!</h3>
            <p style={{ color: muted, fontSize: 13 }}>Your result is now live.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: text }}>Add to Gallery</h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: muted }}>Share your IVey-generated result</p>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: muted, fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {/* URL */}
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Post URL *</label>
                <div style={{ position: 'relative' }}>
                  <input type="text" value={url} placeholder="https://youtube.com/watch?v=..." onChange={e => setUrl(e.target.value)} style={inputStyle} />
                  {detectedPlatform && (
                    <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 9, fontWeight: 700, color: PLATFORM_META[detectedPlatform].color, background: PLATFORM_META[detectedPlatform].color + '18', border: `1px solid ${PLATFORM_META[detectedPlatform].color}30`, padding: '2px 7px', borderRadius: 20 }}>
                      {PLATFORM_META[detectedPlatform].label} ✓
                    </div>
                  )}
                </div>
              </div>

              {/* Caption */}
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Result / Caption *</label>
                <textarea value={caption} placeholder="e.g. Got 12K views in 48 hours with IVey's TikTok script" onChange={e => setCaption(e.target.value)} style={{ ...inputStyle, height: 68, resize: 'none' }} />
              </div>

              {/* Brand + Format */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Brand Name *</label>
                  <input value={brandName} placeholder="e.g. NairobiTech" onChange={e => setBrandName(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Format</label>
                  <input value={format} placeholder="e.g. TikTok Script" onChange={e => setFormat(e.target.value)} style={inputStyle} />
                </div>
              </div>

              {/* Campaign */}
              {campaigns?.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Campaign (optional)</label>
                  <select value={campaignId} onChange={e => setCampaignId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Select...</option>
                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Views</label>
                  <input value={views} placeholder="e.g. 12.4K" onChange={e => setViews(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Likes</label>
                  <input value={likes} placeholder="e.g. 843" onChange={e => setLikes(e.target.value)} style={inputStyle} />
                </div>
              </div>

              {/* Consent */}
              <div onClick={() => setAgreed(!agreed)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${border}`, cursor: 'pointer' }}>
                <div style={{ width: 17, height: 17, borderRadius: 4, border: `2px solid ${agreed ? '#10b981' : border}`, background: agreed ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.2s' }}>
                  {agreed && <span style={{ color: '#fff', fontSize: 10 }}>✓</span>}
                </div>
                <p style={{ margin: 0, fontSize: 11, color: muted, lineHeight: 1.5 }}>I confirm this content was generated using IVey and agree to feature it publicly.</p>
              </div>

              {error && (
                <div style={{ padding: '9px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', fontSize: 12, color: '#ef4444' }}>{error}</div>
              )}

              <button onClick={handleSubmit} disabled={!canSubmit} style={{ padding: '12px 0', borderRadius: 10, border: 'none', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, cursor: canSubmit ? 'pointer' : 'not-allowed', background: canSubmit ? 'linear-gradient(135deg, #10b981, #059669)' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: canSubmit ? '#fff' : muted, transition: 'all 0.2s' }}>
                {loading ? 'Adding...' : 'Add to Gallery ⚡'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function GallerySubmitButton({ campaigns = [], isDark = true }) {
  const [showModal, setShowModal]   = useState(false);
  const [myItems, setMyItems]       = useState([]);
  const [loadingMine, setLoadingMine] = useState(true);
  const [deleting, setDeleting]     = useState(null);
  const [deleteError, setDeleteError] = useState('');

  // Fetch user's own submissions
  useEffect(() => {
    fetch(`${API_BASE}/gallery/mine`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(data => { setMyItems(data.items || []); setLoadingMine(false); })
      .catch(() => setLoadingMine(false));
  }, []);

  const handleAdded = (item) => setMyItems(prev => [item, ...prev]);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this item from the gallery?')) return;
    setDeleting(id);
    setDeleteError('');
    try {
      const res = await fetch(`${API_BASE}/gallery/${id}/mine`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to delete');
      }
      setMyItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const surface = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';

  const meta = (platform) => PLATFORM_META[platform] || PLATFORM_META.link;

  return (
    <>
      {/* Banner */}
      <div className={`rounded-2xl border shadow-sm p-5 mb-6 ${surface}`}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>🏆</div>
            <div>
              <h3 className={`font-semibold text-sm ${textPrimary}`}>Gallery</h3>
              <p className={`text-xs mt-0.5 ${textMuted}`}>
                {loadingMine ? 'Loading...' : myItems.length > 0 ? `You have ${myItems.length} item${myItems.length > 1 ? 's' : ''} in the gallery` : 'Share your results in the public gallery'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}>
            + Add to Gallery
          </button>
        </div>

        {/* User's existing gallery items */}
        {!loadingMine && myItems.length > 0 && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className={`text-xs font-semibold mb-3 ${textMuted}`} style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Gallery Items</p>
            <div className="flex flex-col gap-2">
              {myItems.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-3 p-3 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Platform badge */}
                    <span style={{ flexShrink: 0, padding: '2px 7px', borderRadius: 20, fontSize: 9, fontWeight: 800, background: meta(item.platform).color + '18', color: meta(item.platform).color, border: `1px solid ${meta(item.platform).color}30` }}>
                      {meta(item.platform).label}
                    </span>
                    {/* Caption */}
                    <span className={`text-xs font-medium truncate ${textPrimary}`}>{item.caption}</span>
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                    title="Remove from gallery"
                    style={{ flexShrink: 0, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: deleting === item.id ? 'not-allowed' : 'pointer', opacity: deleting === item.id ? 0.5 : 1 }}>
                    {deleting === item.id ? '...' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
            {deleteError && (
              <p style={{ fontSize: 11, color: '#ef4444', marginTop: 8 }}>{deleteError}</p>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <SubmitModal
          onClose={() => setShowModal(false)}
          onAdded={handleAdded}
          campaigns={campaigns}
          isDark={isDark}
        />
      )}
    </>
  );
}