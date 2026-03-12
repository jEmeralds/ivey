// frontend/src/components/GallerySection.jsx
// Public read-only gallery — no submit button here
// Submission only via Dashboard (GallerySubmitButton.jsx)

import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

const PLATFORM_META = {
  youtube:   { color: '#FF0000', darkBg: '#1a0000', icon: '▶', label: 'YouTube' },
  tiktok:    { color: '#00f2ea', darkBg: '#001a1a', icon: '♫', label: 'TikTok' },
  instagram: { color: '#E1306C', darkBg: '#1a0010', icon: '◈', label: 'Instagram' },
  facebook:  { color: '#1877F2', darkBg: '#000d1a', icon: 'f', label: 'Facebook' },
  link:      { color: '#94a3b8', darkBg: '#0f172a', icon: '⬡', label: 'Link' },
};

function EmbedPreview({ item }) {
  const [playing, setPlaying] = useState(false);
  const meta = PLATFORM_META[item.platform] || PLATFORM_META.link;

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 800, background: meta.color + '15', border: `1px solid ${meta.color}30`, color: meta.color }}>
            {meta.icon} {meta.label}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>{item.brand_name}</span>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.caption}
        </p>
        {item.format && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', marginBottom: 12 }}>
            ⚡ {item.format}
          </div>
        )}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
          {[{ icon: '👁', label: 'Views', val: item.views }, { icon: '♥', label: 'Likes', val: item.likes }].map((s, i) => (
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

export default function GallerySection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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

  // Don't render the section at all if no items and not loading
  if (!loading && items.length === 0) return null;

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

        {/* Platform filters */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {activePlatforms.map(p => {
            const meta = p === 'all' ? { color: '#10b981', label: 'All' } : PLATFORM_META[p];
            const count = p === 'all' ? items.length : items.filter(i => i.platform === p).length;
            return (
              <button key={p} onClick={() => setFilter(p)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 24, cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.2s', background: filter === p ? meta.color + '18' : 'rgba(255,255,255,0.03)', border: `1px solid ${filter === p ? meta.color + '50' : 'rgba(255,255,255,0.06)'}`, color: filter === p ? meta.color : '#475569' }}>
                {p !== 'all' && PLATFORM_META[p]?.icon}
                {meta.label} <span style={{ opacity: 0.6 }}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#334155' }}>Loading gallery...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
          {filtered.map(item => <GalleryCard key={item.id} item={item} />)}
        </div>
      )}
    </section>
  );
}