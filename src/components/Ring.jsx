import { useState, useEffect } from "react";

export function Ring({ s }) {
  const W = 240, H = 148;
  const cx = 120, cy = 136, R = 108, trackW = 14;
  const START_DEG = 210, SWEEP = 240;
  const toRad = d => d * Math.PI / 180;
  const pt = (deg, r = R) => ({ x: cx + r * Math.cos(toRad(deg)), y: cy + r * Math.sin(toRad(deg)) });
  const arcPath = (startDeg, endDeg, r = R) => {
    const s2 = pt(startDeg, r), e = pt(endDeg, r);
    const large = (endDeg - startDeg) > 180 ? 1 : 0;
    return `M ${s2.x} ${s2.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };
  const scoreDeg = v => START_DEG + (v / 1000) * SWEEP;
  const currentDeg = scoreDeg(s);

  const ZONES = [
    { from: 0,   to: 200,  color: "var(--error)" },
    { from: 200, to: 500,  color: "var(--warning)" },
    { from: 500, to: 700,  color: "var(--info)" },
    { from: 700, to: 900,  color: "var(--accent)" },
    { from: 900, to: 1000, color: "var(--text-primary)" },
  ];

  const needleLen = R - 18;
  const needleTip  = pt(currentDeg, needleLen);
  const needleBack = pt(currentDeg + 180, 12);

  const ticks = Array.from({ length: 25 }, (_, i) => {
    const frac = i / 24;
    const deg  = START_DEG + frac * SWEEP;
    const major = i % 6 === 0;
    return { s: pt(deg, major ? R - trackW - 10 : R - trackW - 5), e: pt(deg, R - trackW), major };
  });

  return (
    <div style={{ position: "relative", width: W, height: H + 16, flexShrink: 0 }}>
      <svg width={W} height={H + 16} viewBox={`0 0 ${W} ${H + 16}`} style={{ overflow: "visible" }}>
        <defs>
          <filter id="needle-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0"/>
            <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        
        {/* Rotating background aura */}
        <circle cx={cx} cy={cy} r={R + 10} fill="none" stroke="url(#ring-grad)" strokeWidth="1" strokeDasharray="100 200" style={{ animation: "spin 10s linear infinite", opacity: 0.3 }}/>
        
        <path d={arcPath(START_DEG, START_DEG + SWEEP)} fill="none" stroke="var(--border)" strokeWidth={trackW} strokeLinecap="round"/>
        {ZONES.map((z, zi) => (
          <path key={zi} d={arcPath(scoreDeg(z.from), scoreDeg(z.to))} fill="none" stroke={z.color} strokeWidth={trackW} strokeLinecap="butt" opacity={0.12}/>
        ))}
        {s > 0 && (
          <path d={arcPath(START_DEG, Math.max(currentDeg, START_DEG + 0.5))} fill="none" stroke="var(--accent)" strokeWidth={trackW} strokeLinecap="round" style={{ transition: "all 1s cubic-bezier(0.23, 1, 0.32, 1)", filter: "drop-shadow(0 0 12px var(--accent-glow))" }}/>
        )}
        {ticks.map((tk, i) => (
          <line key={i} x1={tk.s.x} y1={tk.s.y} x2={tk.e.x} y2={tk.e.y} stroke="var(--border-strong)" strokeWidth={tk.major ? 1.5 : 0.8}/>
        ))}
        {[{ val: 0, label: "0" }, { val: 500, label: "500" }, { val: 1000, label: "1K" }].map((lbl, i) => {
          const p = pt(scoreDeg(lbl.val), R + 22);
          return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="700" fill="var(--text-dim)" opacity="0.4" fontFamily="'Inter',sans-serif">{lbl.label}</text>;
        })}
        
        {/* Needle with magnetic-like elasticity */}
        <line x1={needleBack.x} y1={needleBack.y} x2={needleTip.x} y2={needleTip.y} stroke="var(--text)" strokeWidth="3" strokeLinecap="round" filter="url(#needle-glow)" style={{ transition: "all 1.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}/>
        
        <circle cx={cx} cy={cy} r="6" fill="var(--text)"/>
        <circle cx={cx} cy={cy} r="3" fill="var(--bg)"/>
        
        {/* Glitchy Score Text */}
        <text x={cx} y={cy - 40} textAnchor="middle" className="glitch-text" data-text={typeof s === "number" ? s.toFixed(1) : s} fontSize="48" fontWeight="300" fill="var(--text)" fontFamily="'Syne', sans-serif" letterSpacing="-0.04em" style={{ transition: "all 0.5s" }}>{typeof s === "number" ? s.toFixed(1) : s}</text>
        
        <text x={cx} y={cy - 12} textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--accent)" fontFamily="'Inter',sans-serif" letterSpacing=".2em" opacity="0.6">REPUTATION</text>
        
        {/* Glass reflection overlay */}
        <path d={arcPath(START_DEG, START_DEG + SWEEP, R + 5)} fill="none" stroke="var(--border-subtle)" strokeWidth="1" strokeLinecap="round" style={{ pointerEvents: "none" }}/>
        <path d={`M ${cx - R + 20} ${cy - 40} Q ${cx} ${cy - 120} ${cx + R - 20} ${cy - 40}`} fill="none" stroke="var(--border-subtle)" strokeWidth="40" opacity="0.1" style={{ pointerEvents: "none", filter: "blur(20px)" }}/>
      </svg>
    </div>
  );
}

export function MiniChart({ data }) {
  if (!data || data.length === 0) return null;
  const mn = Math.min(...data.map(d => d.score)) - 20;
  const mx = Math.max(...data.map(d => d.score)) + 20;
  const W = 460, H = 70;
  const pts = data.map((d, i) => ({ x: (i / (data.length - 1)) * W, y: H - ((d.score - mn) / (mx - mn)) * H, ...d }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${path} L ${W} ${H} L 0 ${H} Z`;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 60 }} preserveAspectRatio="none">
        <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--text)" stopOpacity=".12"/><stop offset="100%" stopColor="var(--text)" stopOpacity="0"/></linearGradient></defs>
        <path d={area} fill="url(#cg)"/>
        <path d={path} fill="none" stroke="var(--text)" strokeWidth="1.5"/>
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--text)"/>)}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
        {data.map((d, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "var(--text)", fontFamily: "'Inter',sans-serif" }}>{d.month}</div>
            <div style={{ fontSize: 10, color: "var(--text)", fontFamily: "'Inter',sans-serif" }}>{d.score}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CategoryBar({ cat, i, activeCat, onToggle }) {
  const [w, setW] = useState(0);
  const pct = Math.round((cat.score / cat.max) * 100);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), 400 + i * 100);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div style={{ marginBottom: 20 }}>
      <div onClick={onToggle} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ color: "var(--text)", fontSize: 12, fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
          <span>{cat.icon}</span><span>{cat.label}</span>
          <span style={{ fontSize: 9, opacity: .4, transform: activeCat === cat.id ? "rotate(180deg)" : "none", transition: "transform .2s", display: "inline-block" }}>▼</span>
        </span>
        <span style={{ color: "var(--btn-hover)", fontSize: 12, fontFamily: "'Inter',sans-serif" }}>{cat.score}<span style={{ color: "var(--text)", opacity: .5 }}>/{cat.max}</span></span>
      </div>
      <div style={{ height: 2, background: "var(--border-subtle)", borderRadius: 2 }}>
        <div style={{ height: "100%", background: "var(--accent)", width: `${w}%`, transition: "width 1s ease", borderRadius: 2, boxShadow: "0 0 8px var(--accent-glow)" }}/>
      </div>
      <div style={{ overflow: "hidden", maxHeight: activeCat === cat.id ? "200px" : "0", transition: "all .3s ease", opacity: activeCat === cat.id ? 1 : 0 }}>
        <div style={{ marginTop: 12, paddingLeft: 14, borderLeft: "2px solid var(--accent-glow)", marginLeft: 4 }}>
          {cat.details && cat.details.map((d, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, padding: "4px 0" }}>
              <span style={{ fontSize: 10, color: "var(--text)", opacity: .6, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: ".05em" }}>{d.label}</span>
              <span style={{ fontSize: 10, color: d.isDecay ? "var(--error)" : "var(--accent)", fontFamily: "monospace", fontWeight: 700 }}>
                {d.pts > 0 ? "+" : ""}{d.pts} PTS
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
