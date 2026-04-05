// IVey Logo SVG Component
// Usage:
//   <IVeyLogo />                    — icon + wordmark, default size
//   <IVeyLogo iconOnly />           — circle + bar only
//   <IVeyLogo size={24} />          — custom icon size
//   <IVeyLogo dark />               — force dark text (for light backgrounds)

const IVeyLogo = ({ iconOnly = false, size = 32, className = '', dark = false }) => {
  const textColor = dark ? '#059669' : 'currentColor';
  const barSize   = { w: Math.round(size * 0.26), h: Math.round(size * 0.54) };
  const barX      = Math.round((size - barSize.w) / 2);
  const barY      = Math.round((size - barSize.h) / 2);
  const r         = Math.round(size / 2) - 1;
  const cx        = Math.round(size / 2);

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {/* Circle + bar mark */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx={cx} cy={cx} r={r} stroke="#f59e0b" strokeWidth={Math.max(1.5, size * 0.06)} fill="none"/>
        <rect x={barX} y={barY} width={barSize.w} height={barSize.h} rx={Math.max(1, size * 0.05)} fill="#f59e0b"/>
      </svg>
      {/* Wordmark */}
      {!iconOnly && (
        <span style={{
          fontWeight: 800,
          fontSize: Math.round(size * 0.7),
          letterSpacing: '0.05em',
          color: textColor,
          lineHeight: 1,
          fontFamily: 'system-ui, sans-serif',
        }}>
          IVey
        </span>
      )}
    </span>
  );
};

export default IVeyLogo;