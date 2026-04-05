// IVey Logo — Italic wordmark + amber dot under V + circle mark
// Props:
//   size={34}        icon diameter in px (wordmark scales proportionally)
//   iconOnly         show circle mark only, no wordmark
//   className        extra classes on wrapper

import { useNavigate, useLocation } from 'react-router-dom';

const IVeyLogo = ({ iconOnly = false, size = 34, className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (e) => {
    e.preventDefault();
    if (location.pathname === '/') {
      // Already on home — scroll to top smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
      // Small delay to let page render then scroll to top
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    }
  };
  const s   = size;
  const r   = s / 2 - 1;
  const cx  = s / 2;
  const bw  = Math.round(s * 0.27);
  const bh  = Math.round(s * 0.55);
  const bx  = Math.round((s - bw) / 2);
  const by  = Math.round((s - bh) / 2);
  const sw  = Math.max(1.2, s * 0.055);
  const dr  = Math.max(1.5, s * 0.065); // dot radius below mark

  // Wordmark dimensions scale from icon size
  const fs  = Math.round(s * 0.88);     // font size
  const wmW = Math.round(s * 4.2);      // total wordmark svg width
  const wmH = Math.round(s * 1.35);     // total wordmark svg height
  const ty  = Math.round(wmH * 0.78);   // text baseline y
  const skew = -10;                      // italic angle degrees

  // V dot position (approximate center of V in skewed space)
  const dotX = Math.round(s * 0.08 + fs * 0.62);
  const dotY = Math.round(ty + Math.max(2, s * 0.12));
  const dotR = Math.max(1.5, s * 0.075);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <a href="/" onClick={handleClick} className={`inline-flex items-center gap-0 hover:opacity-90 transition-opacity select-none cursor-pointer ${className}`}>
      {/* Circle mark with dot below */}
      <svg
        width={s}
        height={s + dr * 3}
        viewBox={`0 0 ${s} ${s + dr * 3}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <circle cx={cx} cy={cx} r={r} stroke="#f59e0b" strokeWidth={sw} fill="none"/>
        <rect x={bx} y={by} width={bw} height={bh} rx={Math.max(1, s * 0.05)} fill="#f59e0b"/>
      </svg>

      {/* Wordmark — only shown when not iconOnly */}
      {!iconOnly && (
        <svg
          width={wmW}
          height={wmH + dotR * 2.5}
          viewBox={`0 0 ${wmW} ${wmH + dotR * 2.5}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0, marginLeft: Math.round(s * 0.18) }}
        >
          {/* Italic group */}
          <g transform={`skewX(${skew})`}>
            <text
              x={0} y={ty}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize={fs}
              fontWeight="900"
              fill="#10b981"
            >I</text>
            <text
              x={Math.round(fs * 0.52)} y={ty}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize={fs}
              fontWeight="900"
              fill="#f59e0b"
            >V</text>
            <text
              x={Math.round(fs * 1.08)} y={ty}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize={fs}
              fontWeight="900"
              fill="#10b981"
            >ey</text>
          </g>
          {/* Amber dot under V — NOT skewed so it stays a perfect circle */}
          <circle cx={dotX} cy={wmH + dotR * 0.8} r={dotR} fill="#f59e0b"/>
        </svg>
      )}
    </a>
  );
};

export default IVeyLogo;