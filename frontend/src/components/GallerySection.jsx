// frontend/src/components/GallerySection.jsx
// Dual-carousel gallery — row 1 scrolls left, row 2 scrolls right
// Universal media: YouTube, YouTube Shorts, TikTok, Instagram, Facebook

import { useState, useEffect, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

const PLATFORM_META = {
  youtube:   { color: '#FF0000', bg: '#1a0000', icon: '▶', label: 'YouTube' },
  tiktok:    { color: '#00f2ea', bg: '#001a1a', icon: '♫', label: 'TikTok' },
  instagram: { color: '#E1306C', bg: '#1a0010', icon: '◈', label: 'Instagram' },
  facebook:  { color: '#1877F2', bg: '#000d1a', icon: 'f', label: 'Facebook' },
  link:      { color: '#94a3b8', bg: '#0f172a', icon: '⬡', label: 'Link' },
};

// ── Universal embed resolver ──────────────────────────────────────────────────
function getEmbedUrl(item) {
  const { platform, embed_id, url } = item;

  if (platform === 'youtube' && embed_id) {
    // Handles both regular videos and Shorts
    return `https://www.youtube.com/embed/${embed_id}?autoplay=1&rel=0&modestbranding=1`;
  }
  if (platform === 'tiktok' && embed_id) {
    return `https://www.tiktok.com/embed/v2/${embed_id}`;
  }
  if (platform === 'instagram' && embed_id) {
    // Instagram oEmbed iframe
    return `https://www.instagram.com/p/${embed_id}/embed/`;
  }
  if (platform === 'facebook') {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=true`;
  }
  return null;
}

function getThumbnail(item) {
  if (item.platform === 'youtube' && item.embed_id) {
    return `https://img.youtube.com/vi/${item.embed_id}/mqdefault.jpg`;
  }
  if (item.platform === 'tiktok' && item.embed_id) {
    return null; // TikTok blocks external thumbnail access
  }
  return null;
}

// ── Media Card ────────────────────────────────────────────────────────────────
function MediaCard({ item, onOpen }) {
  const meta = PLATFORM_META[item.platform] || PLATFORM_META.link;
  const thumb = getThumbnail(item);
  const embedUrl = getEmbedUrl(item);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => embedUrl ? onOpen(item) : window.open(item.url, '_blank')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 220,
        flexShrink: 0,
        background: thumb ? 'transparent' : `linear-gradient(135deg, ${meta.bg}, #0a0f1a)`,
        border: `1px solid ${hovered ? meta.color + '60' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-4px) scale(1.02)' : 'none',
        boxShadow: hovered ? `0 12px 32px ${meta.color}20` : '0 2px 10px rgba(0,0,0,0.3)',
        position: 'relative',
      }}
    >
      {/* Thumbnail / preview */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', overflow: 'hidden' }}>
        {thumb ? (
          <img src={thumb} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6, background: `linear-gradient(135deg, ${meta.bg}, #0a0f1a)` }}>
            <div style={{ fontSize: 28, color: meta.color }}>{meta.icon}</div>
            <div style={{ fontSize: 10, color: meta.color, fontWeight: 800, letterSpacing: '0.1em' }}>{meta.label}</div>
          </div>
        )}

        {/* Play overlay */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: hovered ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.15)', transition: 'background 0.2s' }}>
          {embedUrl && (
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, opacity: hovered ? 1 : 0.7, transition: 'opacity 0.2s', boxShadow: `0 0 0 6px ${meta.color}30` }}>▶</div>
          )}
          {!embedUrl && (
            <div style={{ padding: '5px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.6)', fontSize: 10, color: '#fff', fontWeight: 700, opacity: hovered ? 1 : 0 }}>View ↗</div>
          )}
        </div>

        {/* Platform badge */}
        <div style={{ position: 'absolute', top: 8, left: 8, padding: '2px 7px', background: meta.color, borderRadius: 4, fontSize: 8, fontWeight: 900, color: '#fff', letterSpacing: '0.05em' }}>
          {meta.label.toUpperCase()}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.caption}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{item.brand_name}</span>
          {item.format && (
            <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 20, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', fontWeight: 700 }}>
              ⚡ {item.format}
            </span>
          )}
        </div>
        {(item.views !== '—' || item.likes !== '—') && (
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>👁 {item.views}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>♥ {item.likes}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Lightbox Player ───────────────────────────────────────────────────────────
function Lightbox({ item, onClose }) {
  const meta = PLATFORM_META[item.platform] || PLATFORM_META.link;
  const embedUrl = getEmbedUrl(item);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 760, background: '#0f172a', border: `1px solid ${meta.color}30`, borderRadius: 20, overflow: 'hidden', boxShadow: `0 32px 80px ${meta.color}20` }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800, background: meta.color + '18', border: `1px solid ${meta.color}30`, color: meta.color }}>
              {meta.icon} {meta.label}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{item.brand_name}</span>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.5)', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Embed */}
        {embedUrl ? (
          <div style={{ position: 'relative', paddingTop: item.platform === 'tiktok' ? '177%' : '56.25%' }}>
            <iframe
              src={embedUrl}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{meta.icon}</div>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 16, fontSize: 13 }}>This content can't be embedded directly.</p>
            <a href={item.url} target="_blank" rel="noreferrer"
              style={{ padding: '10px 24px', borderRadius: 10, background: meta.color, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
              Open on {meta.label} ↗
            </a>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.caption}
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {item.views !== '—' && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>👁 {item.views}</span>}
            {item.likes !== '—' && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>♥ {item.likes}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Infinite carousel row ─────────────────────────────────────────────────────
function CarouselRow({ items, direction = 'left', speed = 35, onOpen }) {
  const trackRef = useRef(null);
  const animRef = useRef(null);
  const posRef = useRef(0);
  const pausedRef = useRef(false);

  // Triplicate items so we never run out
  const doubled = [...items, ...items, ...items];

  useEffect(() => {
    const track = trackRef.current;
    if (!track || items.length === 0) return;

    const cardWidth = 236; // card 220 + gap 16
    const singleSetWidth = items.length * cardWidth;

    // Start mid-set
    posRef.current = singleSetWidth;
    track.style.transform = `translateX(-${posRef.current}px)`;

    const step = () => {
      if (!pausedRef.current) {
        if (direction === 'left') {
          posRef.current += 0.4;
          if (posRef.current >= singleSetWidth * 2) posRef.current = singleSetWidth;
        } else {
          posRef.current -= 0.4;
          if (posRef.current <= 0) posRef.current = singleSetWidth;
        }
        track.style.transform = `translateX(-${posRef.current}px)`;
      }
      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [items, direction]);

  return (
    <div
      style={{ overflow: 'hidden', width: '100%', cursor: 'grab' }}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      <div ref={trackRef} style={{ display: 'flex', gap: 16, width: 'max-content', willChange: 'transform' }}>
        {doubled.map((item, i) => (
          <MediaCard key={`${item.id}-${i}`} item={item} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

// ── Main GallerySection ───────────────────────────────────────────────────────
export default function GallerySection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/gallery`)
      .then(r => r.json())
      .then(data => { setItems(data.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (!loading && items.length === 0) return null;

  // Split into two rows
  const mid = Math.ceil(items.length / 2);
  const row1 = items.slice(0, mid);
  const row2 = items.slice(mid);

  // If only a few items, duplicate rows so carousel has enough content
  const r1 = row1.length < 4 ? [...row1, ...row1, ...row1] : row1;
  const r2 = row2.length < 4 ? (row2.length > 0 ? [...row2, ...row2, ...row2] : [...row1, ...row1]) : row2;

  return (
    <section id="gallery" style={{ padding: '80px 0', overflow: 'hidden', background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.15), transparent)' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48, padding: '0 32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', fontSize: 11, color: '#10b981', fontWeight: 800, marginBottom: 16, letterSpacing: '0.08em' }}>
          🏆 GALLERY
        </div>
        <h2 style={{ fontSize: 'clamp(24px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 12px', color: '#f1f5f9' }}>
          Real content.{' '}
          <span style={{ background: 'linear-gradient(135deg, #10b981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Real results.
          </span>
        </h2>
        <p style={{ fontSize: 15, color: '#475569', maxWidth: 440, margin: '0 auto', lineHeight: 1.6 }}>
          Generated with IVey and posted by real users. Hover to pause. Click to play.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#334155' }}>Loading gallery...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Row 1 — scrolls left */}
          <CarouselRow items={r1} direction="left" onOpen={setActiveItem} />
          {/* Row 2 — scrolls right */}
          <CarouselRow items={r2} direction="right" onOpen={setActiveItem} />
        </div>
      )}

      {/* Lightbox */}
      {activeItem && <Lightbox item={activeItem} onClose={() => setActiveItem(null)} />}
    </section>
  );
}