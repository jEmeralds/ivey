// Add this component inside Dashboard.jsx
// Place it right after the stats cards, before BrandSettings

// At the top of Dashboard.jsx add:
// import { useState } from 'react'; // already imported
// import GallerySubmitButton from '../components/GallerySubmitButton';

// ─────────────────────────────────────────────────────────────────────────────
// frontend/src/components/GallerySubmitButton.jsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

const PLATFORM_META = {
  youtube:   { color: '#FF0000', icon: '▶', label: 'YouTube' },
  tiktok:    { color: '#00f2ea', icon: '♫', label: 'TikTok' },
  instagram: { color: '#E1306C', icon: '◈', label: 'Instagram' },
  facebook:  { color: '#1877F2', icon: 'f', label: 'Facebook' },
  link:      { color: '#94a3b8', icon: '⬡', label: 'Link' },
};

function detectPlatform(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('facebook.com')) return 'facebook';
  return 'link';
}

export default function GallerySubmitButton({ campaigns = [], isDark = true }) {
  const [showModal, setShowModal] = useState(false);
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [brandName, setBrandName] = useState('');
  const [format, setFormat] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [views, setViews] = useState('');
  const [likes, setLikes] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const detectedPlatform = url.length > 10 ? detectPlatform(url) : null;
  const canSubmit = url && caption && brandName && agreed && !loading;

  const reset = () => {
    setUrl(''); setCaption(''); setBrandName(''); setFormat('');
    setCampaignId(''); setViews(''); setLikes('');
    setAgreed(false); setError(''); setSuccess(false);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`${API_BASE}/gallery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url, caption, brand_name: brandName, format, campaign_id: campaignId || null, views, likes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setSuccess(true);
      setTimeout(() => { setShowModal(false); reset(); }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const surface = isDark ? '#1e293b' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const text = isDark ? '#f1f5f9' : '#0f172a';
  const muted = isDark ? '#64748b' : '#94a3b8';
  const inputBg = isDark ? '#0f172a' : '#f8fafc';

  const inputStyle = {
    width: '100%', padding: '10px 13px', borderRadius: 9,
    border: `1.5px solid ${border}`, background: inputBg,
    color: text, fontSize: 13, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
  };

  return (
    <>
      {/* Banner CTA inside dashboard */}
      <div className={`rounded-2xl border shadow-sm p-6 mb-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>🏆</div>
            <div>
              <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Share Your Results in the Gallery
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Posted content that performed well? Add it to IVey's public gallery.
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
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={() => { setShowModal(false); reset(); }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 480, background: surface, border: `1px solid ${border}`, borderRadius: 18, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto' }}>

            {success ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#10b981' }}>Added to Gallery!</h3>
                <p style={{ color: muted, fontSize: 13 }}>Your result is now live on the IVey gallery.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: text }}>Add to Gallery</h3>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: muted }}>Share your IVey-generated content result</p>
                  </div>
                  <button onClick={() => { setShowModal(false); reset(); }} style={{ background: 'none', border: 'none', color: muted, fontSize: 20, cursor: 'pointer' }}>✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* URL */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Post URL *</label>
                    <div style={{ position: 'relative' }}>
                      <input type="text" value={url} placeholder="https://youtube.com/watch?v=..."
                        onChange={e => setUrl(e.target.value)} style={inputStyle} />
                      {detectedPlatform && (
                        <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 10, fontWeight: 700, color: PLATFORM_META[detectedPlatform].color, background: PLATFORM_META[detectedPlatform].color + '18', border: `1px solid ${PLATFORM_META[detectedPlatform].color}30`, padding: '2px 8px', borderRadius: 20 }}>
                          {PLATFORM_META[detectedPlatform].label} ✓
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Caption */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>What result did you get? *</label>
                    <textarea value={caption} placeholder="e.g. Got 12K views in 48 hours with IVey's TikTok script"
                      onChange={e => setCaption(e.target.value)} style={{ ...inputStyle, height: 70, resize: 'none' }} />
                  </div>

                  {/* Brand + Format */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Brand Name *</label>
                      <input value={brandName} placeholder="e.g. NairobiTech" onChange={e => setBrandName(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Format</label>
                      <input value={format} placeholder="e.g. TikTok Script" onChange={e => setFormat(e.target.value)} style={inputStyle} />
                    </div>
                  </div>

                  {/* Campaign */}
                  {campaigns.length > 0 && (
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Campaign (optional)</label>
                      <select value={campaignId} onChange={e => setCampaignId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                        <option value="">Select...</option>
                        {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Views</label>
                      <input value={views} placeholder="e.g. 12.4K" onChange={e => setViews(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Likes</label>
                      <input value={likes} placeholder="e.g. 843" onChange={e => setLikes(e.target.value)} style={inputStyle} />
                    </div>
                  </div>

                  {/* Consent */}
                  <div onClick={() => setAgreed(!agreed)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 13px', borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${border}`, cursor: 'pointer' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${agreed ? '#10b981' : border}`, background: agreed ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.2s' }}>
                      {agreed && <span style={{ color: '#fff', fontSize: 11 }}>✓</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: muted, lineHeight: 1.5 }}>
                      I confirm this content was generated using IVey and I agree to feature it publicly.
                    </p>
                  </div>

                  {error && (
                    <div style={{ padding: '10px 13px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', fontSize: 12, color: '#ef4444' }}>
                      {error}
                    </div>
                  )}

                  <button onClick={handleSubmit} disabled={!canSubmit}
                    style={{ padding: '12px 0', borderRadius: 10, border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 800, cursor: canSubmit ? 'pointer' : 'not-allowed', background: canSubmit ? 'linear-gradient(135deg, #10b981, #059669)' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: canSubmit ? '#fff' : muted, boxShadow: canSubmit ? '0 4px 14px rgba(16,185,129,0.3)' : 'none', transition: 'all 0.2s' }}>
                    {loading ? 'Adding...' : 'Add to Gallery ⚡'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}