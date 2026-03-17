// frontend/src/components/BrandSettings.jsx
// Multi-brand version — list, create, edit, delete, set default

import { useState, useEffect, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';

const INDUSTRIES = [
  'E-commerce', 'Fashion & Apparel', 'Food & Beverage', 'Health & Wellness',
  'Technology', 'Finance & Fintech', 'Real Estate', 'Education', 'Travel & Tourism',
  'Entertainment & Media', 'Beauty & Cosmetics', 'Automotive', 'Non-profit',
  'Professional Services', 'Sports & Fitness', 'Other',
];

const PRESET_COLORS = [
  '#f97316', '#ef4444', '#8b5cf6', '#3b82f6', '#10b981',
  '#f59e0b', '#ec4899', '#06b6d4', '#84cc16', '#ffffff',
  '#1e293b', '#0f172a',
];

const EMPTY_FORM = {
  brand_name: '', tagline: '', industry: '', brand_colors: [], target_personas: '',
};

function isLight(hex) {
  if (!hex || hex.length < 7) return true;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

// ─── Brand Form (create / edit) ───────────────────────────────────────────────
function BrandForm({ initial = EMPTY_FORM, onSave, onCancel, saving }) {
  const isDark = document.documentElement.classList.contains('dark');
  const [form, setForm]             = useState(initial);
  const [customColor, setCustomColor] = useState('#000000');
  const colorInputRef               = useRef(null);

  const border   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
  const text     = isDark ? '#f1f5f9' : '#0f172a';
  const muted    = isDark ? '#64748b' : '#94a3b8';
  const inputBg  = isDark ? '#0f172a' : '#ffffff';
  const labelColor = isDark ? '#94a3b8' : '#64748b';

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: '10px',
    border: `1.5px solid ${border}`, background: inputBg,
    color: text, fontSize: '14px', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s',
  };
  const labelStyle = {
    display: 'block', fontSize: '12px', fontWeight: '700',
    color: labelColor, marginBottom: '8px',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  };

  const toggleColor = (color) => {
    setForm(p => ({
      ...p,
      brand_colors: p.brand_colors.includes(color)
        ? p.brand_colors.filter(c => c !== color)
        : p.brand_colors.length < 5 ? [...p.brand_colors, color] : p.brand_colors,
    }));
  };

  const addCustomColor = (color) => {
    if (!form.brand_colors.includes(color) && form.brand_colors.length < 5) {
      setForm(p => ({ ...p, brand_colors: [...p.brand_colors, color] }));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Name + Tagline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Brand Name *</label>
          <input
            type="text" value={form.brand_name} placeholder="e.g. CHI Naturals"
            onChange={e => setForm(p => ({ ...p, brand_name: e.target.value }))}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#f97316'}
            onBlur={e => e.target.style.borderColor = border}
          />
        </div>
        <div>
          <label style={labelStyle}>Tagline</label>
          <input
            type="text" value={form.tagline} placeholder="e.g. Brewed for your gut"
            onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#f97316'}
            onBlur={e => e.target.style.borderColor = border}
          />
        </div>
      </div>

      {/* Industry + Audience */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Industry</label>
          <select
            value={form.industry}
            onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
            style={{ ...inputStyle, cursor: 'pointer' }}
            onFocus={e => e.target.style.borderColor = '#f97316'}
            onBlur={e => e.target.style.borderColor = border}
          >
            <option value="">Select industry...</option>
            {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Target Audience</label>
          <input
            type="text" value={form.target_personas}
            placeholder="e.g. 18-35, health-conscious"
            onChange={e => setForm(p => ({ ...p, target_personas: e.target.value }))}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#f97316'}
            onBlur={e => e.target.style.borderColor = border}
          />
        </div>
      </div>

      {/* Colors */}
      <div>
        <label style={labelStyle}>
          Brand Colors
          <span style={{ fontSize: '11px', fontWeight: '400', marginLeft: '8px', color: muted, textTransform: 'none' }}>
            (pick up to 5)
          </span>
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {form.brand_colors.map(color => (
            <div key={color} onClick={() => toggleColor(color)} title={`Remove ${color}`}
              style={{
                width: '32px', height: '32px', borderRadius: '8px', background: color,
                cursor: 'pointer', border: '2px solid rgba(249,115,22,0.8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
              <span style={{ fontSize: '10px', color: isLight(color) ? '#000' : '#fff', fontWeight: '800' }}>✕</span>
            </div>
          ))}
          {form.brand_colors.length > 0 && (
            <div style={{ width: '1px', height: '24px', background: border, margin: '0 2px' }} />
          )}
          {PRESET_COLORS.map(color => (
            <div key={color} onClick={() => toggleColor(color)} title={color}
              style={{
                width: '28px', height: '28px', borderRadius: '7px', background: color,
                cursor: 'pointer', flexShrink: 0,
                border: form.brand_colors.includes(color) ? '2px solid #f97316' : `2px solid ${border}`,
                opacity: form.brand_colors.length >= 5 && !form.brand_colors.includes(color) ? 0.35 : 1,
                transition: 'transform 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          ))}
          {/* Custom picker */}
          <div style={{ position: 'relative' }}>
            <div onClick={() => colorInputRef.current?.click()}
              style={{
                width: '28px', height: '28px', borderRadius: '7px',
                background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
                cursor: 'pointer', border: `2px solid ${border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
              }} title="Custom color">+</div>
            <input ref={colorInputRef} type="color" value={customColor}
              onChange={e => setCustomColor(e.target.value)}
              onBlur={e => addCustomColor(e.target.value)}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
          </div>
        </div>
      </div>

      {/* Preview */}
      {form.brand_name && (
        <div style={{
          padding: '14px 18px', background: isDark ? 'rgba(249,115,22,0.06)' : 'rgba(249,115,22,0.04)',
          border: '1px solid rgba(249,115,22,0.15)', borderRadius: '10px',
          display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          {form.brand_colors.length > 0 && (
            <div style={{ display: 'flex', gap: '4px' }}>
              {form.brand_colors.map(c => (
                <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c, border: `1px solid ${border}` }} />
              ))}
            </div>
          )}
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: text }}>{form.brand_name}</div>
            {form.tagline && <div style={{ fontSize: '12px', color: muted, marginTop: '2px' }}>{form.tagline}</div>}
          </div>
          {form.industry && (
            <div style={{
              marginLeft: 'auto', padding: '3px 10px', borderRadius: '20px',
              background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)',
              fontSize: '11px', color: '#f97316', fontWeight: '600',
            }}>{form.industry}</div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button onClick={onCancel}
          style={{
            padding: '9px 18px', borderRadius: '9px', border: `1.5px solid ${border}`,
            background: 'transparent', color: muted, fontSize: '13px', fontWeight: '600',
            cursor: 'pointer',
          }}>
          Cancel
        </button>
        <button onClick={() => onSave(form)} disabled={saving || !form.brand_name.trim()}
          style={{
            padding: '9px 20px', borderRadius: '9px', border: 'none',
            background: saving ? 'rgba(249,115,22,0.5)' : 'linear-gradient(135deg, #f97316, #ea580c)',
            color: 'white', fontSize: '13px', fontWeight: '700',
            cursor: saving || !form.brand_name.trim() ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(249,115,22,0.3)',
          }}>
          {saving ? 'Saving...' : 'Save Brand'}
        </button>
      </div>
    </div>
  );
}

// ─── Brand Card ───────────────────────────────────────────────────────────────
function BrandCard({ brand, onEdit, onDelete, onSetDefault, isDark }) {
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const text   = isDark ? '#f1f5f9' : '#0f172a';
  const muted  = isDark ? '#64748b' : '#94a3b8';

  return (
    <div style={{
      padding: '18px 20px',
      background: brand.is_default
        ? isDark ? 'rgba(249,115,22,0.07)' : 'rgba(249,115,22,0.04)'
        : isDark ? '#1e293b' : '#f8fafc',
      border: `1.5px solid ${brand.is_default ? 'rgba(249,115,22,0.3)' : border}`,
      borderRadius: '14px',
      display: 'flex', alignItems: 'center', gap: '16px',
      transition: 'all 0.2s',
    }}>
      {/* Color dots */}
      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        {(brand.brand_colors || []).slice(0, 4).map(c => (
          <div key={c} style={{
            width: '12px', height: '12px', borderRadius: '50%',
            background: c, border: `1px solid ${border}`,
          }} />
        ))}
        {(!brand.brand_colors || brand.brand_colors.length === 0) && (
          <div style={{
            width: '12px', height: '12px', borderRadius: '50%',
            background: border, border: `1px solid ${border}`,
          }} />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: text, truncate: true }}>
            {brand.brand_name}
          </span>
          {brand.is_default && (
            <span style={{
              fontSize: '10px', fontWeight: '700', color: '#f97316',
              background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)',
              padding: '2px 8px', borderRadius: '20px', letterSpacing: '0.04em',
            }}>DEFAULT</span>
          )}
        </div>
        {brand.tagline && (
          <div style={{ fontSize: '12px', color: muted, marginTop: '2px' }}>{brand.tagline}</div>
        )}
        {brand.industry && (
          <div style={{ fontSize: '11px', color: muted, marginTop: '3px' }}>🏭 {brand.industry}</div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
        {!brand.is_default && (
          <button onClick={() => onSetDefault(brand.id)} title="Set as default"
            style={{
              padding: '6px 10px', borderRadius: '8px', border: `1.5px solid ${border}`,
              background: 'transparent', color: muted, fontSize: '11px', fontWeight: '600',
              cursor: 'pointer',
            }}>
            ⭐ Default
          </button>
        )}
        <button onClick={() => onEdit(brand)} title="Edit"
          style={{
            padding: '6px 10px', borderRadius: '8px', border: `1.5px solid ${border}`,
            background: 'transparent', color: muted, fontSize: '13px',
            cursor: 'pointer',
          }}>
          ✏️
        </button>
        <button onClick={() => onDelete(brand.id)} title="Delete"
          style={{
            padding: '6px 10px', borderRadius: '8px',
            border: '1.5px solid rgba(239,68,68,0.2)',
            background: 'rgba(239,68,68,0.05)', color: '#ef4444', fontSize: '13px',
            cursor: 'pointer',
          }}>
          🗑️
        </button>
      </div>
    </div>
  );
}

// ─── Main BrandSettings Component ────────────────────────────────────────────
export default function BrandSettings() {
  const isDark = document.documentElement.classList.contains('dark');
  const [brands,  setBrands]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [mode,    setMode]    = useState('list');       // 'list' | 'create' | 'edit'
  const [editing, setEditing] = useState(null);         // brand object being edited
  const [error,   setError]   = useState('');
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  const border  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const surface = isDark ? '#1e293b' : '#f8fafc';
  const text    = isDark ? '#f1f5f9' : '#0f172a';
  const muted   = isDark ? '#64748b' : '#94a3b8';

  // ── Fetch brands ─────────────────────────────────────────────────────────────
  const fetchBrands = async () => {
    try {
      const res = await fetch(`${API_BASE}/brand`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setBrands(data.brands || []);
    } catch {
      setError('Failed to load brand profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBrands(); }, []);

  // ── Create ────────────────────────────────────────────────────────────────────
  const handleCreate = async (form) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/brand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBrands(prev => [...prev, data.brand]);
      setMode('list');
    } catch (err) {
      setError(err.message || 'Failed to create brand');
    } finally {
      setSaving(false);
    }
  };

  // ── Update ────────────────────────────────────────────────────────────────────
  const handleUpdate = async (form) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/brand/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBrands(prev => prev.map(b => b.id === editing.id ? data.brand : b));
      setMode('list');
      setEditing(null);
    } catch (err) {
      setError(err.message || 'Failed to update brand');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this brand profile?')) return;
    setError('');
    try {
      const res = await fetch(`${API_BASE}/brand/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBrands(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete brand');
    }
  };

  // ── Set Default ───────────────────────────────────────────────────────────────
  const handleSetDefault = async (id) => {
    setError('');
    try {
      const res = await fetch(`${API_BASE}/brand/${id}/set-default`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Update local state — flip is_default flags
      setBrands(prev => prev.map(b => ({ ...b, is_default: b.id === id })));
    } catch (err) {
      setError(err.message || 'Failed to set default');
    }
  };

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', color: muted }}>
      Loading brand profiles...
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Error banner */}
      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: '10px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#ef4444', fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      {/* ── List view ── */}
      {mode === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {brands.length === 0 ? (
            <div style={{
              padding: '40px', textAlign: 'center',
              background: surface, border: `1.5px dashed ${border}`,
              borderRadius: '14px',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎨</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: text, marginBottom: '6px' }}>
                No brand profiles yet
              </div>
              <div style={{ fontSize: '13px', color: muted, marginBottom: '20px' }}>
                Create your first brand so AI can generate on-brand content
              </div>
              <button onClick={() => setMode('create')}
                style={{
                  padding: '10px 22px', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: 'white', fontSize: '13px', fontWeight: '700',
                  cursor: 'pointer', boxShadow: '0 4px 14px rgba(249,115,22,0.3)',
                }}>
                + Create Brand Profile
              </button>
            </div>
          ) : (
            <>
              {brands.map(brand => (
                <BrandCard
                  key={brand.id}
                  brand={brand}
                  isDark={isDark}
                  onEdit={(b) => { setEditing(b); setMode('edit'); }}
                  onDelete={handleDelete}
                  onSetDefault={handleSetDefault}
                />
              ))}
              <button onClick={() => setMode('create')}
                style={{
                  padding: '12px', borderRadius: '12px',
                  border: `1.5px dashed ${border}`,
                  background: 'transparent', color: muted,
                  fontSize: '13px', fontWeight: '600',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.color = '#f97316'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = muted; }}
              >
                + Add Another Brand
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Create view ── */}
      {mode === 'create' && (
        <div style={{
          background: surface, border: `1.5px solid ${border}`,
          borderRadius: '16px', padding: '24px',
        }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: text, marginBottom: '20px' }}>
            ✨ New Brand Profile
          </div>
          <BrandForm
            initial={EMPTY_FORM}
            onSave={handleCreate}
            onCancel={() => { setMode('list'); setError(''); }}
            saving={saving}
          />
        </div>
      )}

      {/* ── Edit view ── */}
      {mode === 'edit' && editing && (
        <div style={{
          background: surface, border: `1.5px solid ${border}`,
          borderRadius: '16px', padding: '24px',
        }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: text, marginBottom: '20px' }}>
            ✏️ Edit — {editing.brand_name}
          </div>
          <BrandForm
            initial={{
              brand_name:      editing.brand_name || '',
              tagline:         editing.tagline || '',
              industry:        editing.industry || '',
              brand_colors:    editing.brand_colors || [],
              target_personas: editing.target_personas || '',
            }}
            onSave={handleUpdate}
            onCancel={() => { setMode('list'); setEditing(null); setError(''); }}
            saving={saving}
          />
        </div>
      )}
    </div>
  );
}