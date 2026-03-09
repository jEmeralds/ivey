// frontend/src/components/BrandSettings.jsx
// Embedded inside Dashboard — Brand Profile section

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

export default function BrandSettings() {
  const isDark = document.documentElement.classList.contains('dark');
  const [form, setForm] = useState({
    brand_name: '',
    tagline: '',
    industry: '',
    brand_colors: [],
    target_personas: '',
  });
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [loading, setLoading] = useState(true);
  const [customColor, setCustomColor] = useState('#000000');
  const colorInputRef = useRef(null);
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  // ── Load existing brand profile ──────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/brand`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.brand) {
          setForm({
            brand_name: data.brand.brand_name || '',
            tagline: data.brand.tagline || '',
            industry: data.brand.industry || '',
            brand_colors: data.brand.brand_colors || [],
            target_personas: data.brand.target_personas || '',
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`${API_BASE}/brand`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Color management ─────────────────────────────────────────────────────────
  const toggleColor = (color) => {
    setForm(p => ({
      ...p,
      brand_colors: p.brand_colors.includes(color)
        ? p.brand_colors.filter(c => c !== color)
        : p.brand_colors.length < 5
          ? [...p.brand_colors, color]
          : p.brand_colors,
    }));
  };

  const addCustomColor = (color) => {
    if (!form.brand_colors.includes(color) && form.brand_colors.length < 5) {
      setForm(p => ({ ...p, brand_colors: [...p.brand_colors, color] }));
    }
  };

  // ── Theme ────────────────────────────────────────────────────────────────────
  const bg       = isDark ? '#0f172a' : '#ffffff';
  const surface  = isDark ? '#1e293b' : '#f8fafc';
  const border   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const text      = isDark ? '#f1f5f9' : '#0f172a';
  const muted    = isDark ? '#64748b' : '#94a3b8';
  const inputBg  = isDark ? '#0f172a' : '#ffffff';
  const labelColor = isDark ? '#94a3b8' : '#64748b';

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: '10px',
    border: `1.5px solid ${border}`, background: inputBg,
    color: text, fontSize: '14px', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block', fontSize: '12px', fontWeight: '700',
    color: labelColor, marginBottom: '8px',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  };

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', color: muted }}>
      Loading brand profile...
    </div>
  );

  return (
    <div style={{
      background: surface, border: `1px solid ${border}`,
      borderRadius: '16px', padding: '28px', marginBottom: '24px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px',
          }}>🎨</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: text }}>
              Brand Profile
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: muted }}>
              AI uses this to generate on-brand content
            </p>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '10px 20px', borderRadius: '10px', border: 'none',
            background: saved
              ? 'linear-gradient(135deg, #10b981, #059669)'
              : saving
                ? 'rgba(249,115,22,0.5)'
                : 'linear-gradient(135deg, #f97316, #ea580c)',
            color: 'white', fontSize: '13px', fontWeight: '700',
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: saved || saving ? 'none' : '0 4px 14px rgba(249,115,22,0.35)',
            transition: 'all 0.25s', display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Brand'}
        </button>
      </div>

      {/* Form grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Brand Name */}
        <div>
          <label style={labelStyle}>Brand Name</label>
          <input
            type="text" value={form.brand_name} placeholder="e.g. NairobiTech"
            onChange={e => setForm(p => ({ ...p, brand_name: e.target.value }))}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#f97316'}
            onBlur={e => e.target.style.borderColor = border}
          />
        </div>

        {/* Tagline */}
        <div>
          <label style={labelStyle}>Tagline</label>
          <input
            type="text" value={form.tagline} placeholder="e.g. Built for Africa's future"
            onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#f97316'}
            onBlur={e => e.target.style.borderColor = border}
          />
        </div>

        {/* Industry */}
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
            {INDUSTRIES.map(ind => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>

        {/* Target Personas */}
        <div>
          <label style={labelStyle}>Target Audience</label>
          <input
            type="text" value={form.target_personas}
            placeholder="e.g. Young professionals aged 25-35 in Nairobi"
            onChange={e => setForm(p => ({ ...p, target_personas: e.target.value }))}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#f97316'}
            onBlur={e => e.target.style.borderColor = border}
          />
        </div>
      </div>

      {/* Brand Colors */}
      <div style={{ marginTop: '20px' }}>
        <label style={labelStyle}>
          Brand Colors
          <span style={{ fontSize: '11px', fontWeight: '400', marginLeft: '8px', color: muted, textTransform: 'none' }}>
            (pick up to 5)
          </span>
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Selected colors */}
          {form.brand_colors.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {form.brand_colors.map(color => (
                <div
                  key={color}
                  onClick={() => toggleColor(color)}
                  title={`Remove ${color}`}
                  style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: color, cursor: 'pointer',
                    border: '2px solid rgba(249,115,22,0.8)',
                    boxShadow: '0 0 0 2px rgba(249,115,22,0.3)',
                    position: 'relative', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <span style={{
                    fontSize: '10px', color: isLight(color) ? '#000' : '#fff',
                    fontWeight: '800',
                  }}>✕</span>
                </div>
              ))}
              <div style={{ width: '1px', height: '24px', background: border, margin: '0 4px' }} />
            </div>
          )}

          {/* Preset swatches */}
          {PRESET_COLORS.map(color => (
            <div
              key={color}
              onClick={() => toggleColor(color)}
              title={color}
              style={{
                width: '28px', height: '28px', borderRadius: '7px',
                background: color, cursor: 'pointer', flexShrink: 0,
                border: form.brand_colors.includes(color)
                  ? '2px solid #f97316'
                  : `2px solid ${border}`,
                transition: 'transform 0.15s, border-color 0.15s',
                opacity: form.brand_colors.length >= 5 && !form.brand_colors.includes(color) ? 0.4 : 1,
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          ))}

          {/* Custom color picker */}
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => colorInputRef.current?.click()}
              style={{
                width: '28px', height: '28px', borderRadius: '7px',
                background: `conic-gradient(red, yellow, lime, cyan, blue, magenta, red)`,
                cursor: 'pointer', border: `2px solid ${border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px',
              }}
              title="Custom color"
            >+</div>
            <input
              ref={colorInputRef}
              type="color" value={customColor}
              onChange={e => setCustomColor(e.target.value)}
              onBlur={e => addCustomColor(e.target.value)}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            />
          </div>
        </div>
      </div>

      {/* Brand preview pill */}
      {(form.brand_name || form.tagline) && (
        <div style={{
          marginTop: '24px', padding: '16px 20px',
          background: isDark ? 'rgba(249,115,22,0.06)' : 'rgba(249,115,22,0.04)',
          border: '1px solid rgba(249,115,22,0.15)',
          borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px',
        }}>
          {/* Color dots */}
          {form.brand_colors.length > 0 && (
            <div style={{ display: 'flex', gap: '4px' }}>
              {form.brand_colors.map(c => (
                <div key={c} style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: c, border: `1px solid ${border}`,
                }} />
              ))}
            </div>
          )}
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: text }}>
              {form.brand_name || 'Your Brand'}
            </div>
            {form.tagline && (
              <div style={{ fontSize: '12px', color: muted, marginTop: '2px' }}>
                {form.tagline}
              </div>
            )}
          </div>
          {form.industry && (
            <div style={{
              marginLeft: 'auto', padding: '4px 10px', borderRadius: '20px',
              background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)',
              fontSize: '11px', color: '#f97316', fontWeight: '600',
            }}>
              {form.industry}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper — is color light or dark?
function isLight(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}