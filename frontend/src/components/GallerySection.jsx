// frontend/src/components/GallerySection.jsx

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

function getThumbnail(item) {
  if (item.platform === 'youtube' && item.embed_id)
    return `https://img.youtube.com/vi/${item.embed_id}/mqdefault.jpg`;
  return null;
}

// ── Single card — plays inline, no lightbox ───────────────────────────────────
function MediaCard({ item }) {
  const [playing, setPlaying] = useState(false);
  const meta = PLATFORM_META[item.platform] || PLATFORM_META.link;
  const embedUrl = getEmbedUrl(item);
  const thumb = getThumbnail(item);
  const isTikTok = item.platform === 'tiktok';

  return (
    <div style={{
      width: 210,
      flexShrink: 0,
      borderRadius: 12,
      overflow: 'hidden',
      background: '#0f172a',
      border: '1px solid rgba(255,255,255,0.07)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    }}>
      {/* Media area */}
      <div style={{ position: 'relative', width: '100%', paddingTop: isTikTok ? '133%' : '56.25%', background: meta.bg, overflow: 'hidden' }}>

        {/* Embed (when playing) */}
        {playing && embedUrl && (
          <iframe
            src={embedUrl}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
          />
        )}

        {/* Thumbnail / placeholder (when not playing) */}
        {!playing && (
          <div style={{ position: 'absolute', inset: 0 }}>
            {thumb ? (
              <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: `linear-gradient(135deg, ${meta.bg}, #0a0f1a)` }}>
                <div style={{ fontSize: 26, color: meta.color }}>{meta.icon}</div>
                <div style={{ fontSize: 9, color: meta.color, fontWeight: 800, letterSpacing: '0.1em' }}>{meta.label}</div>
              </div>
            )}

            {/* Play button overlay */}
            {embedUrl ? (
              <div
                onClick={() => setPlaying(true)}
                style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.2)' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, boxShadow: `0 0 0 6px ${meta.color}30` }}>▶</div>
              </div>
            ) : (
              <a href={item.url} target="_blank" rel="noreferrer"
                style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                <div style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(0,0,0,0.65)', fontSize: 10, color: '#fff', fontWeight: 700 }}>View ↗</div>
              </a>
            )}
          </div>
        )}

        {/* Platform badge */}
        <div style={{ position: 'absolute', top: 6, left: 6, padding: '2px 6px', background: meta.color, borderRadius: 3, fontSize: 7, fontWeight: 900, color: '#fff', letterSpacing: '0.05em', zIndex: 2 }}>
          {meta.label.toUpperCase()}
        </div>
      </div>

      {/* Caption row */}
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3 }}>
          {item.caption}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{item.brand_name}</span>
          {item.format && (
            <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 10, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', fontWeight: 700 }}>
              ⚡ {item.format}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Horizontal carousel row ───────────────────────────────────────────────────
// Items loop: goes to last → back to first, then continues
function HorizontalCarousel({ items, direction = 'left' }) {
  const [index, setIndex] = useState(0);
  const VISIBLE = 4; // how many cards show at once
  const total = items.length;

  useEffect(() => {
    if (total <= VISIBLE) return;
    const id = setInterval(() => {
      setIndex(i => direction === 'left'
        ? (i + 1) % total
        : (i - 1 + total) % total
      );
    }, 2800);
    return () => clearInterval(id);
  }, [total, direction]);

  // Build the window of visible items (circular)
  const visible = Array.from({ length: Math.min(VISIBLE, total) }, (_, i) =>
    items[(index + i) % total]
  );

  return (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', transition: 'all 0.5s ease' }}>
      {visible.map((item, i) => (
        <div key={`${item.id}-${i}`} style={{ transition: 'opacity 0.4s', opacity: 1 }}>
          <MediaCard item={item} />
        </div>
      ))}
    </div>
  );
}

// ── Vertical carousel column ──────────────────────────────────────────────────
function VerticalCarousel({ items, direction = 'up' }) {
  const [index, setIndex] = useState(0);
  const VISIBLE = 3;
  const total = items.length;

  useEffect(() => {
    if (total <= VISIBLE) return;
    const id = setInterval(() => {
      setIndex(i => direction === 'up'
        ? (i + 1) % total
        : (i - 1 + total) % total
      );
    }, 3200);
    return () => clearInterval(id);
  }, [total, direction]);

  const visible = Array.from({ length: Math.min(VISIBLE, total) }, (_, i) =>
    items[(index + i) % total]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      {visible.map((item, i) => (
        <div key={`${item.id}-${i}`} style={{ transition: 'opacity 0.4s', opacity: 1 }}>
          <MediaCard item={item} />
        </div>
      ))}
    </div>
  );
}

// ── Main GallerySection ───────────────────────────────────────────────────────
export default function GallerySection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/gallery`)
      .then(r => r.json())
      .then(data => { setItems(data.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (!loading && items.length === 0) return null;

  // Split into halves for the two rows
  const mid = Math.ceil(items.length / 2);
  const row1 = items.slice(0, mid).length >= 1 ? items.slice(0, mid) : items;
  const row2 = items.slice(mid).length >= 1 ? items.slice(mid) : items;

  return (
    <section id="gallery" style={{ padding: '80px 0' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48, padding: '0 32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', fontSize: 11, color: '#10b981', fontWeight: 800, marginBottom: 16, letterSpacing: '0.08em' }}>
          🏆 GALLERY
        </div>
        <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 40px)', fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 10px', color: '#f1f5f9' }}>
          Real content.{' '}
          <span style={{ background: 'linear-gradient(135deg, #10b981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Real results.
          </span>
        </h2>
        <p style={{ fontSize: 14, color: '#475569', maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
          Generated with IVey and posted by real users. Click any card to play.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>Loading gallery...</div>
      ) : (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 32px' }}>

          {/* Layout: vertical column on left + right, horizontal rows in center */}
          <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr 210px', gap: 24, alignItems: 'start' }}>

            {/* Left vertical column — scrolls up */}
            <VerticalCarousel items={row1} direction="up" />

            {/* Center — two horizontal rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <HorizontalCarousel items={row1} direction="left" />
              <HorizontalCarousel items={row2} direction="right" />
            </div>

            {/* Right vertical column — scrolls down */}
            <VerticalCarousel items={row2} direction="down" />
          </div>
        </div>
      )}
    </section>
  );
}