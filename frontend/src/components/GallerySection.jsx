// frontend/src/components/GallerySection.jsx
// Single-row carousel with expand-to-grid option

import { useState, useEffect, useRef } from 'react';

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

// ── Single card ───────────────────────────────────────────────────────────────
function MediaCard({ item, width = 240 }) {
  const [playing, setPlaying] = useState(false);
  const meta = PLATFORM_META[item.platform] || PLATFORM_META.link;
  const embedUrl = getEmbedUrl(item);
  const thumb = item.platform === 'youtube' && item.embed_id
    ? `https://img.youtube.com/vi/${item.embed_id}/mqdefault.jpg`
    : null;

  return (
    <div style={{
      width, flexShrink: 0,
      borderRadius: 12, overflow: 'hidden',
      background: '#0f172a',
      border: '1px solid rgba(255,255,255,0.07)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${meta.color}20`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)'; }}
    >
      {/* Media */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: meta.bg, overflow: 'hidden' }}>
        {playing && embedUrl ? (
          <iframe src={embedUrl} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} allow="autoplay; fullscreen; encrypted-media" allowFullScreen />
        ) : (
          <div style={{ position: 'absolute', inset: 0 }}>
            {thumb
              ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <div style={{ fontSize: 26, color: meta.color }}>{meta.icon}</div>
                  <div style={{ fontSize: 9, color: meta.color, fontWeight: 800, letterSpacing: '0.1em' }}>{meta.label}</div>
                </div>
            }
            {embedUrl
              ? <div onClick={() => setPlaying(true)} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.12)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, boxShadow: `0 0 0 6px ${meta.color}28` }}>▶</div>
                </div>
              : <a href={item.url} target="_blank" rel="noreferrer" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                  <div style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(0,0,0,0.65)', fontSize: 11, color: '#fff', fontWeight: 700 }}>View ↗</div>
                </a>
            }
          </div>
        )}
        <div style={{ position: 'absolute', top: 6, left: 6, padding: '2px 6px', background: meta.color, borderRadius: 3, fontSize: 7, fontWeight: 900, color: '#fff', letterSpacing: '0.05em', zIndex: 2 }}>
          {meta.label.toUpperCase()}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '9px 11px 11px' }}>
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
          <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
            {item.views !== '—' && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>👁 {item.views}</span>}
            {item.likes !== '—' && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>♥ {item.likes}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Carousel row ──────────────────────────────────────────────────────────────
function CarouselRow({ items }) {
  const trackRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // Drag to scroll
  const onMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.pageX - trackRef.current.offsetLeft;
    scrollLeft.current = trackRef.current.scrollLeft;
    trackRef.current.style.cursor = 'grabbing';
  };
  const onMouseUp = () => { isDragging.current = false; trackRef.current.style.cursor = 'grab'; };
  const onMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.2;
    trackRef.current.scrollLeft = scrollLeft.current - walk;
  };

  // Arrow scroll
  const scroll = (dir) => {
    trackRef.current.scrollBy({ left: dir * 260, behavior: 'smooth' });
  };

  const showArrows = items.length > 4;

  return (
    <div style={{ position: 'relative' }}>
      {/* Left arrow */}
      {showArrows && (
        <button onClick={() => scroll(-1)} style={{ position: 'absolute', left: -18, top: '50%', transform: 'translateY(-60%)', zIndex: 10, width: 34, height: 34, borderRadius: '50%', background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.12)', color: '#f1f5f9', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>‹</button>
      )}

      {/* Track */}
      <div
        ref={trackRef}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onMouseMove={onMouseMove}
        style={{ display: 'flex', gap: 16, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', cursor: 'grab', paddingBottom: 4, userSelect: 'none' }}
      >
        <style>{`.carousel-track::-webkit-scrollbar{display:none}`}</style>
        {items.map(item => <MediaCard key={item.id} item={item} width={240} />)}
      </div>

      {/* Right arrow */}
      {showArrows && (
        <button onClick={() => scroll(1)} style={{ position: 'absolute', right: -18, top: '50%', transform: 'translateY(-60%)', zIndex: 10, width: 34, height: 34, borderRadius: '50%', background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.12)', color: '#f1f5f9', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>›</button>
      )}
    </div>
  );
}

// ── Main GallerySection ───────────────────────────────────────────────────────
export default function GallerySection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
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
    <section id="gallery" style={{ padding: '72px 0' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', fontSize: 11, color: '#10b981', fontWeight: 800, marginBottom: 14, letterSpacing: '0.08em' }}>
            🏆 GALLERY
          </div>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 10px', color: '#f1f5f9' }}>
            Real content.{' '}
            <span style={{ background: 'linear-gradient(135deg, #10b981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Real results.
            </span>
          </h2>
          <p style={{ fontSize: 13, color: '#475569', maxWidth: 380, margin: '0 auto 20px', lineHeight: 1.6 }}>
            Generated with IVey and posted by real users.
          </p>

          {/* Filters */}
          {platforms.length > 1 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
              {['all', ...platforms].map(p => {
                const meta = p === 'all' ? { color: '#10b981', label: 'All' } : PLATFORM_META[p];
                const count = p === 'all' ? items.length : items.filter(i => i.platform === p).length;
                return (
                  <button key={p} onClick={() => setFilter(p)} style={{
                    padding: '5px 13px', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontWeight: 700,
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#475569' }}>Loading gallery...</div>
        ) : expanded ? (
          /* ── Expanded grid ── */
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18, marginBottom: 24 }}>
              {filtered.map(item => <MediaCard key={item.id} item={item} width="100%" />)}
            </div>
            <div style={{ textAlign: 'center' }}>
              <button onClick={() => setExpanded(false)} style={{ padding: '8px 24px', borderRadius: 20, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#475569', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
              >
                ↑ Collapse
              </button>
            </div>
          </>
        ) : (
          /* ── Carousel row ── */
          <>
            <CarouselRow items={filtered} />
            {filtered.length > 4 && (
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button onClick={() => setExpanded(true)} style={{ padding: '8px 24px', borderRadius: 20, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#475569', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.color = '#10b981'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#475569'; }}
                >
                  View all {filtered.length} results ↓
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}