// frontend/src/pages/SocialAdminDashboard.jsx
// Admin view — all users' social posts, stats, platform breakdown

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

const PLATFORM_META = {
  twitter:   { name: 'Twitter/X', icon: '𝕏', color: '#000000' },
  facebook:  { name: 'Facebook',  icon: 'f',  color: '#1877F2' },
  instagram: { name: 'Instagram', icon: '◈',  color: '#E1306C' },
  tiktok:    { name: 'TikTok',    icon: '♪',  color: '#69C9D0' },
};

function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function Sparkline({ data, color = '#6366f1', height = 40 }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d[1]), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
      {data.slice(-21).map(([day, count], i) => (
        <div key={i} title={`${day}: ${count} posts`} style={{
          flex: 1, borderRadius: 3, minHeight: 3,
          height: `${Math.max(3, (count / max) * 100)}%`,
          background: count > 0 ? color : 'rgba(255,255,255,0.05)',
        }} />
      ))}
    </div>
  );
}

export default function SocialAdminDashboard() {
  const navigate = useNavigate();
  const [stats,    setStats]    = useState(null);
  const [posts,    setPosts]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [filter,   setFilter]   = useState('all');
  const [page,     setPage]     = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const LIMIT = 25;

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchPosts(); }, [filter, page]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/social/admin/stats`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.status === 403) { setError('Admin access required'); return; }
      const data = await res.json();
      setStats(data);
    } catch { setError('Failed to load stats'); }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: LIMIT, offset: page * LIMIT, ...(filter !== 'all' && { platform: filter }) });
      const res = await fetch(`${API_BASE}/social/admin/posts?${params}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      setPosts(data.posts || []);
      setTotal(data.total || 0);
    } catch {}
    finally { setLoading(false); }
  };

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#04080f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <p style={{ color: '#ef4444', marginBottom: 16 }}>{error}</p>
        <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 20px', borderRadius: 8, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', cursor: 'pointer' }}>← Back</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#04080f', padding: '32px 24px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <button onClick={() => navigate('/dashboard')} style={{ background: 'transparent', border: 'none', color: '#475569', fontSize: 12, cursor: 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>← Dashboard</button>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9', margin: 0 }}>📡 Social Activity</h1>
            <p style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>All posts made through IVey across all users</p>
          </div>
          <button onClick={() => { fetchStats(); fetchPosts(); }}
            style={{ padding: '8px 18px', borderRadius: 10, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
            ↺ Refresh
          </button>
        </div>

        {/* Stats cards */}
        {stats && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Total Posts',   value: stats.total,       color: '#6366f1', icon: '📊' },
                { label: 'Published',     value: stats.published,   color: '#10b981', icon: '✅' },
                { label: 'Failed',        value: stats.failed,      color: '#ef4444', icon: '❌' },
                { label: 'Active Users',  value: stats.uniqueUsers, color: '#f59e0b', icon: '👥' },
                ...Object.entries(stats.byPlatform || {}).map(([p, c]) => ({
                  label: PLATFORM_META[p]?.name || p, value: c,
                  color: PLATFORM_META[p]?.color || '#475569',
                  icon: PLATFORM_META[p]?.icon || '?',
                })),
              ].map((s, i) => (
                <div key={i} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Activity chart */}
            {stats.byDay?.length > 0 && (
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                  Post activity — last 21 days
                </div>
                <Sparkline data={stats.byDay} color="#6366f1" height={48} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: 9, color: '#334155' }}>{stats.byDay[0]?.[0]}</span>
                  <span style={{ fontSize: 9, color: '#334155' }}>{stats.byDay[stats.byDay.length - 1]?.[0]}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {['all', 'twitter', 'facebook', 'instagram', 'tiktok'].map(p => {
            const pm = PLATFORM_META[p];
            const count = p === 'all' ? total : (stats?.byPlatform?.[p] || 0);
            return (
              <button key={p} onClick={() => { setFilter(p); setPage(0); }}
                style={{ padding: '5px 14px', borderRadius: 20, border: `1px solid ${filter === p ? (pm?.color || '#6366f1') : '#1e293b'}`, background: filter === p ? ((pm?.color || '#6366f1') + '18') : 'transparent', color: filter === p ? (pm?.color || '#6366f1') : '#475569', fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>
                {p === 'all' ? `All (${total})` : `${pm?.icon} ${pm?.name} (${count})`}
              </button>
            );
          })}
        </div>

        {/* Posts table */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 120px 100px 90px', gap: 0, padding: '10px 16px', borderBottom: '1px solid #1e293b' }}>
            {['User', 'Content', 'Platform', 'Status', 'Date'].map(h => (
              <div key={h} style={{ fontSize: 9, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#334155', fontSize: 12 }}>Loading...</div>
          ) : posts.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#334155', fontSize: 12 }}>No posts found</div>
          ) : posts.map(post => {
            const pm = PLATFORM_META[post.platform] || {};
            const user = post.users;
            return (
              <div key={post.id} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 120px 100px 90px', gap: 0, padding: '12px 16px', borderBottom: '1px solid #0d1520', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>{user?.name || 'Unknown'}</div>
                  <div style={{ fontSize: 10, color: '#334155' }}>{user?.email}</div>
                </div>
                <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', paddingRight: 12 }}>
                  {post.content_text || post.caption || <em style={{ color: '#334155' }}>media only</em>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 5, background: pm.color || '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 900 }}>{pm.icon || '?'}</div>
                  <span style={{ fontSize: 10, color: '#475569' }}>{pm.name}</span>
                </div>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: post.status === 'published' ? '#10b981' : '#ef4444', background: post.status === 'published' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', padding: '2px 7px', borderRadius: 8 }}>
                    {post.status}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: '#334155' }}>
                  {new Date(post.posted_at).toLocaleDateString()}
                  {post.platform_url && <><br /><a href={post.platform_url} target="_blank" rel="noreferrer" style={{ color: pm.color, fontSize: 9 }}>View →</a></>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {total > LIMIT && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              style={{ padding: '7px 16px', borderRadius: 8, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', fontSize: 12, cursor: 'pointer', opacity: page === 0 ? 0.4 : 1 }}>← Prev</button>
            <span style={{ fontSize: 12, color: '#475569' }}>Page {page + 1} of {Math.ceil(total / LIMIT)}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * LIMIT >= total}
              style={{ padding: '7px 16px', borderRadius: 8, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', fontSize: 12, cursor: 'pointer', opacity: (page + 1) * LIMIT >= total ? 0.4 : 1 }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}