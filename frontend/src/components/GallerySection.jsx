// frontend/src/components/GallerySection.jsx
// Simple responsive grid — shows exact items, scales as gallery grows

import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

const PLATFORM_META = {
  youtube:   { color: '#FF0000', bg: '#1a0000', icon: '▶', label: 'YouTube' },
  tiktok:    { color: '#69C9D0', bg: '#010101', icon: '♫', label: 'TikTok' },
  instagram: { color: '#E1306C', bg: '#1a0010', icon: '◈', label: 'Instagram' },
  facebook:  { color: '#1877F2', bg: '#000d1a', icon: 'f', label: 'Facebook' },
  link:      { color: '#94a3b8', bg: '#0f172a', icon: '⬡', label: 'Link' },
};

function getEmbedUrl(item) {
  const { platform, embed_id, url } = item;
  if (platform === 'youtube' && embed_id)
    return `https://www.youtube.com/embed/${embed_id}?autoplay=1&rel=0&modestbranding=1`;
  if (platform === 'tiktok' && embed_id)
    return `https://www.tiktok.com/embed/v2/${embed_id}`;
  if (platform === 'instagram' && embed_id)
    return `https://www.instagram.com/p/${embed_id}/embed/`;
  if (platform === 'facebook')
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=true`;
  return null;
}

function MediaCard({ item }) {
  const [playing, setPlaying] = useState(false);
  const meta = PLATFORM_META[item.platform] || PLATFORM_META.link;
  const embedUrl = getEmbedUrl(item);
  const thumb = item.platform === 'youtube' && item.embed_id
    ? `https://img.youtube.com/vi/${item.embed_id}/mqdefault.jpg`
    : null;
  const isTikTok = item.platform === 'tiktok';

  return (
    <div style={{
      borderRadius: 12,
      overflow: 'hidden',
      background: '#0f172a',
      border: '1px solid rgba(255,255,255,0.07)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${meta.color}18`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)'; }}
    >
      {/* Media area */}
      <div style={{ position: 'relative', width: '100%', paddingTop: isTikTok ? '125%' : '56.25%', background: meta.bg, overflow: 'hidden' }}>
        {playing && embedUrl ? (
          <iframe
            src={embedUrl}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0 }}>
            {thumb ? (
              <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <div style={{ fontSize: 28, color: meta.color }}>{meta.icon}</div>
                <div style={{ fontSize: 9, color: meta.color, fontWeight: 800, letterSpacing: '0.1em' }}>{meta.label}</div>
              </div>
            )}
            {embedUrl ? (
              <div onClick={() => setPlaying(true)} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.15)' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, boxShadow: `0 0 0 6px ${meta.color}28` }}>▶</div>
              </div>
            ) : (
              <a href={item.url} target="_blank" rel="noreferrer" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                <div style={{ padding: '6px 14px', borderRadius: 6, background: 'rgba(0,0,0,0.65)', fontSize: 11, color: '#fff', fontWeight: 700 }}>View ↗</div>
              </a>
            )}
          </div>
        )}
        <div style={{ position: 'absolute', top: 7, left: 7, padding: '2px 7px', background: meta.color, borderRadius: 3, fontSize: 8, fontWeight: 900, color: '#fff', letterSpacing: '0.05em', zIndex: 2 }}>
          {meta.label.toUpperCase()}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }}>
          {item.caption}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{item.brand_name}</span>
          {item.format && (
            <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 10, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', fontWeight: 700 }}>
              ⚡ {item.format}
            </span>
          )}
        </div>
        {(item.views !== '—' || item.likes !== '—') && (
          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            {item.views !== '—' && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>👁 {item.views}</span>}
            {item.likes !== '—' && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>♥ {item.likes}</span>}
          </div>
        )}
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

  if (!loading && items.length === 0) return null;

  const platforms = [...new Set(items.map(i => i.platform))];
  const filtered = filter === 'all' ? items : items.filter(i => i.platform === filter);

  return (
    <section id="gallery" style={{ padding: '80px 0' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', fontSize: 11, color: '#10b981', fontWeight: 800, marginBottom: 16, letterSpacing: '0.08em' }}>
            🏆 GALLERY
          </div>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 40px)', fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 10px', color: '#f1f5f9' }}>
            Real content.{' '}
            <span style={{ background: 'linear-gradient(135deg, #10b981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Real results.
            </span>
          </h2>
          <p style={{ fontSize: 14, color: '#475569', maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.6 }}>
            Generated with IVey and posted by real users.
          </p>

          {/* Platform filter pills */}
          {platforms.length > 1 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['all', ...platforms].map(p => {
                const meta = p === 'all' ? { color: '#10b981', label: 'All' } : PLATFORM_META[p];
                const count = p === 'all' ? items.length : items.filter(i => i.platform === p).length;
                return (
                  <button key={p} onClick={() => setFilter(p)} style={{
                    padding: '5px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                    border: `1px solid ${filter === p ? meta.color + '60' : 'rgba(255,255,255,0.08)'}`,
                    background: filter === p ? meta.color + '14' : 'transparent',
                    color: filter === p ? meta.color : '#475569',
                    transition: 'all 0.2s',
                  }}>
                    {meta.label} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Grid — auto-fills columns, grows with content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>Loading gallery...</div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 20,
          }}>
            {filtered.map(item => <MediaCard key={item.id} item={item} />)}
          </div>
        )}
      </div>
    </section>
  );
}