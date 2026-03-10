// frontend/src/components/GallerySection.jsx
// Drop inside Home.jsx below the demo section

import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

const PLATFORM_META = {
  youtube:   { color: '#FF0000', darkBg: '#1a0000', icon: '▶', label: 'YouTube' },
  tiktok:    { color: '#00f2ea', darkBg: '#001a1a', icon: '♫', label: 'TikTok' },
  instagram: { color: '#E1306C', darkBg: '#1a0010', icon: '◈', label: 'Instagram' },
  facebook:  { color: '#1877F2', darkBg: '#000d1a', icon: 'f', label: 'Facebook' },
  link:      { color: '#94a3b8', darkBg: '#0f172a', icon: '⬡', label: 'Link' },
};

// ── Embed preview ─────────────────────────────────────────────────────────────
function EmbedPreview({ item }) {
  const [playing, setPlaying] = useState(false);
  const meta = PLATFORM_META[item.platform];

  if (item.platform === 'youtube' && item.embed_id) {
    return playing ? (
      <div style={{ width: '100%', paddingTop: '56.25%', position: 'relative', borderRadius: '10px 10px 0 0', overflow: 'hidden' }}>
        <iframe
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          src={`https://www.youtube.com/embed/${item.embed_id}?autoplay=1`}
          allow="autoplay; encrypted-media" allowFullScreen
        />
      </div>
    ) : (
      <div onClick={() => setPlaying(true)} style={{ width: '100%', paddingTop: '56.25%', position: 'relative', borderRadius: '10px 10px 0 0', overflow: 'hidden', cursor: 'pointer', background: '#000' }}>
        <img
          src={`https://img.youtube.com/vi/${item.embed_id}/mqdefault.jpg`} alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
        />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FF0000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 0 0 8px rgba(255,0,0,0.18)' }}>▶</div>
        </div>
        <div style={{ position: 'absolute', top: 8, left: 8, padding: '3px 8px', background: '#FF0000', borderRadius: 4, fontSize: 9, fontWeight: 800, color: '#fff' }}>YOUTUBE</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', paddingTop: '56.25%', position: 'relative', borderRadius: '10px 10px 0 0', overflow: 'hidden', background: `linear-gradient(135deg, ${meta.darkBg}, #0a0f1a)` }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <div style={{ fontSize: 34, color: meta.color, opacity: 0.8 }}>{meta.icon}</div>
        <div style={{ fontSize: 11, color: meta.color, fontWeight: 800, letterSpacing: '0.1em' }}>{meta.label}</div>
        <a href={item.url} target="_blank" rel="noreferrer"
          style={{ padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: meta.color + '20', border: `1px solid ${meta.color}50`, color: meta.color, textDecoration: 'none' }}>
          View Post ↗
        </a>
      </div>
    </div>
  );
}

// ── Gallery card ──────────────────────────────────────────────────────────────
function GalleryCard({ item }) {
  const meta = PLATFORM_META[item.platform] || PLATFORM_META.link;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'rgba(15,23,42,0.85)',
        border: `1px solid ${hovered ? meta.color + '55' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 14, overflow: 'hidden',
        backdropFilter: 'blur(12px)',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        transform: hovered ? 'translateY(-5px)' : 'none',
        boxShadow: hovered ? `0 16px 40px ${meta.color}15` : '0 2px 12px rgba(0,0,0,0.25)',
      }}
    >
      <EmbedPreview item={item} />

      <div style={{ padding: '14px 16px 16px' }}>
        {/* Platform + brand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 800, background: meta.color + '15', border: `1px solid ${meta.color}30`, color: meta.color }}>
            {meta.icon} {meta.label}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>{item.brand_name}</span>
        </div>

        {/* Caption */}
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.caption}
        </p>

        {/* Format */}
        {item.format && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', marginBottom: 12 }}>
            ⚡ {item.format}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
          {[
            { icon: '👁', label: 'Views', val: item.views },
            { icon: '♥', label: 'Likes', val: item.likes },
          ].map((s, i) => (
            <div key={s.label} style={{ flex: 1, padding: '8px 10px', textAlign: 'center', borderRight: i === 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9' }}>{s.val}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.icon} {s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Submit Modal ──────────────────────────────────────────────────────────────
function SubmitModal({ onClose, onSubmit, campaigns }) {
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

  const detectedPlatform = url.length > 10 ? detectPlatform(url) : null;
  const canSubmit = url && caption && brandName && agreed && !loading;

  function detectPlatform(u) {
    if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
    if (u.includes('tiktok.com')) return 'tiktok';
    if (u.includes('instagram.com')) return 'instagram';
    if (u.includes('facebook.com')) return 'facebook';
    return 'link';
  }

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
      onSubmit(data.item);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1.5px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.35)',
    color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };

  const meta = detectedPlatform ? PLATFORM_META[detectedPlatform] : null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 500, background: 'linear-gradient(145deg, #0f172a, #1e293b)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32, boxShadow: '0 32px 80px rgba(0,0,0,0.6)', maxHeight: '90vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏆</div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>Add to Gallery</h3>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Share your IVey-generated content result</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* URL */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Post / Video URL *</label>
            <div style={{ position: 'relative' }}>
              <input type="text" value={url} placeholder="https://youtube.com/watch?v=..."
                onChange={e => setUrl(e.target.value)} style={inputCls} />
              {meta && (
                <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: meta.color + '20', color: meta.color, border: `1px solid ${meta.color}40` }}>
                  {meta.icon} {meta.label} ✓
                </div>
              )}
            </div>
          </div>

          {/* Caption */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>What result did you get? *</label>
            <textarea value={caption} placeholder="e.g. Got 12K views in 48 hours using IVey's TikTok script"
              onChange={e => setCaption(e.target.value)}
              style={{ ...inputCls, height: 72, resize: 'none' }} />
          </div>

          {/* Brand + Format */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Brand Name *</label>
              <input type="text" value={brandName} placeholder="e.g. NairobiTech"
                onChange={e => setBrandName(e.target.value)} style={inputCls} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Content Format</label>
              <input type="text" value={format} placeholder="e.g. TikTok Script"
                onChange={e => setFormat(e.target.value)} style={inputCls} />
            </div>
          </div>

          {/* Campaign link */}
          {campaigns?.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Link to Campaign (optional)</label>
              <select value={campaignId} onChange={e => setCampaignId(e.target.value)} style={{ ...inputCls, cursor: 'pointer' }}>
                <option value="">Select campaign...</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Views</label>
              <input type="text" value={views} placeholder="e.g. 12.4K"
                onChange={e => setViews(e.target.value)} style={inputCls} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Likes</label>
              <input type="text" value={likes} placeholder="e.g. 843"
                onChange={e => setLikes(e.target.value)} style={inputCls} />
            </div>
          </div>

          {/* Consent */}
          <div onClick={() => setAgreed(!agreed)}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
            <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${agreed ? '#10b981' : 'rgba(255,255,255,0.15)'}`, background: agreed ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.2s' }}>
              {agreed && <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>✓</span>}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
              I confirm this content was generated using IVey and I agree to feature it in the public gallery.
            </p>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, color: '#ef4444' }}>
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={!canSubmit}
            style={{ padding: '13px 0', borderRadius: 11, border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 800, cursor: canSubmit ? 'pointer' : 'not-allowed', transition: 'all 0.25s', background: canSubmit ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.04)', color: canSubmit ? '#fff' : '#334155', boxShadow: canSubmit ? '0 6px 20px rgba(16,185,129,0.3)' : 'none' }}>
            {loading ? 'Adding to gallery...' : canSubmit ? 'Add to Gallery ⚡' : 'Fill required fields'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main GallerySection — drop into Home.jsx ──────────────────────────────────
export default function GallerySection({ user, campaigns = [] }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/gallery`)
      .then(r => r.json())
      .then(data => { setItems(data.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? items : items.filter(i => i.platform === filter);
  const activePlatforms = ['all', ...new Set(items.map(i => i.platform))];

  const totalViews = items.reduce((acc, i) => {
    const n = parseFloat(i.views?.replace('K', '')) * (i.views?.includes('K') ? 1000 : 1);
    return acc + (isNaN(n) ? 0 : n);
  }, 0);

  return (
    <section id="gallery" style={{ padding: '90px 32px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 52 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', fontSize: 11, color: '#10b981', fontWeight: 800, marginBottom: 20, letterSpacing: '0.08em' }}>
          🏆 GALLERY
        </div>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 14px', lineHeight: 1.1, color: '#f1f5f9' }}>
          Real content.{' '}
          <span style={{ background: 'linear-gradient(135deg, #10b981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Real results.
          </span>
        </h2>
        <p style={{ fontSize: 16, color: '#475569', maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.6 }}>
          These were all generated with IVey and posted by real users. No actors. No paid promotions.
        </p>

        {/* Aggregate stats */}
        {items.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 36 }}>
            {[
              { val: items.length, label: 'Results posted', icon: '📤' },
              { val: totalViews >= 1000 ? (totalViews / 1000).toFixed(0) + 'K+' : totalViews, label: 'Total views', icon: '👁' },
              { val: new Set(items.map(i => i.platform)).size, label: 'Platforms', icon: '🌐' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#f1f5f9' }}>{s.icon} {s.val}</div>
                <div style={{ fontSize: 11, color: '#334155', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Platform filters */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {activePlatforms.map(p => {
            const meta = p === 'all' ? { color: '#10b981', label: 'All' } : PLATFORM_META[p];
            const count = p === 'all' ? items.length : items.filter(i => i.platform === p).length;
            return (
              <button key={p} onClick={() => setFilter(p)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 24, cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.2s', background: filter === p ? meta.color + '18' : 'rgba(255,255,255,0.03)', border: `1px solid ${filter === p ? meta.color + '50' : 'rgba(255,255,255,0.06)'}`, color: filter === p ? meta.color : '#475569' }}>
                {p !== 'all' && PLATFORM_META[p].icon}
                {meta.label} <span style={{ opacity: 0.6 }}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#334155' }}>Loading gallery...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <p style={{ color: '#334155' }}>No results yet — be the first to share!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18, marginBottom: 56 }}>
          {filtered.map(item => <GalleryCard key={item.id} item={item} />)}
        </div>
      )}

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '48px 32px', background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(5,150,105,0.03))', border: '1px solid rgba(16,185,129,0.12)', borderRadius: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.03) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🚀</div>
          <h3 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 10px', color: '#f1f5f9' }}>Got results with IVey?</h3>
          <p style={{ fontSize: 14, color: '#475569', margin: '0 0 24px' }}>
            {user
              ? 'Share your content in the gallery and inspire others.'
              : 'Sign up, generate content, then share your results here.'}
          </p>
          {user ? (
            <button onClick={() => setShowModal(true)}
              style={{ padding: '13px 30px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 20px rgba(16,185,129,0.3)' }}>
              🏆 Add My Result
            </button>
          ) : (
            <a href="/signup"
              style={{ display: 'inline-block', padding: '13px 30px', borderRadius: 12, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: 14, fontWeight: 800, textDecoration: 'none', boxShadow: '0 6px 20px rgba(16,185,129,0.3)' }}>
              Start Free →
            </a>
          )}
          <p style={{ fontSize: 11, color: '#1e3a2e', marginTop: 12 }}>
            {user ? 'Goes live instantly. We review and may remove if not IVey-generated.' : 'Free forever. No credit card required.'}
          </p>
        </div>
      </div>

      {showModal && (
        <SubmitModal
          onClose={() => setShowModal(false)}
          onSubmit={item => setItems(p => [item, ...p])}
          campaigns={campaigns}
        />
      )}
    </section>
  );
}