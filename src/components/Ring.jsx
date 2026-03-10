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
    { from: 0,   to: 200,  color: "#ef4444" },
    { from: 200, to: 500,  color: "#f97316" },
    { from: 500, to: 700,  color: "#eab308" },
    { from: 700, to: 900,  color: "#84cc16" },
    { from: 900, to: 1000, color: "#22c55e" },
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
        </defs>
        <path d={arcPath(START_DEG, START_DEG + SWEEP)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={trackW} strokeLinecap="round"/>
        {ZONES.map((z, zi) => (
          <path key={zi} d={arcPath(scoreDeg(z.from), scoreDeg(z.to))} fill="none" stroke={z.color} strokeWidth={trackW} strokeLinecap="butt" opacity={0.18}/>
        ))}
        {s > 0 && (
          <path d={arcPath(START_DEG, Math.max(currentDeg, START_DEG + 0.5))} fill="none" stroke="var(--accent)" strokeWidth={trackW} strokeLinecap="round" style={{ transition: "d 0.8s cubic-bezier(0.34,1.56,0.64,1)", filter: "drop-shadow(0 0 6px rgba(169,221,211,0.5))" }}/>
        )}
        {ticks.map((tk, i) => (
          <line key={i} x1={tk.s.x} y1={tk.s.y} x2={tk.e.x} y2={tk.e.y} stroke="rgba(255,255,255,0.2)" strokeWidth={tk.major ? 1.5 : 0.8}/>
        ))}
        {[{ val: 0, label: "0" }, { val: 500, label: "500" }, { val: 1000, label: "1K" }].map((lbl, i) => {
          const p = pt(scoreDeg(lbl.val), R + 18);
          return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="rgba(255,255,255,0.25)" fontFamily="'Inter',sans-serif">{lbl.label}</text>;
        })}
        <line x1={needleBack.x} y1={needleBack.y} x2={needleTip.x} y2={needleTip.y} stroke="var(--text)" strokeWidth="2" strokeLinecap="round" filter="url(#needle-glow)" style={{ transition: "x1 0.9s cubic-bezier(0.34,1.56,0.64,1), y1 0.9s cubic-bezier(0.34,1.56,0.64,1), x2 0.9s cubic-bezier(0.34,1.56,0.64,1), y2 0.9s cubic-bezier(0.34,1.56,0.64,1)" }}/>
        <circle cx={cx} cy={cy} r="6" fill="var(--text)" opacity="0.9"/>
        <circle cx={cx} cy={cy} r="3" fill="var(--bg)"/>
        <text x={cx} y={cy - 32} textAnchor="middle" fontSize="38" fontWeight="300" fill="var(--text)" fontFamily="'Inter',sans-serif" letterSpacing="-2">{s}</text>
        <text x={cx} y={cy - 14} textAnchor="middle" fontSize="10" fill="var(--text)" fontFamily="'Inter',sans-serif" opacity="0.45">/ 1000</text>
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
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }}>
        <div style={{ height: "100%", background: "var(--text)", width: `${w}%`, transition: "width 1s ease" }}/>
      </div>
      <div style={{ overflow: "hidden", maxHeight: activeCat === cat.id ? "200px" : "0", transition: "max-height .3s ease", opacity: activeCat === cat.id ? 1 : 0 }}>
        <div style={{ marginTop: 12, paddingLeft: 14, borderLeft: "1px solid var(--border)", marginLeft: 4 }}>
          {cat.details && cat.details.map((d, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: "var(--text)", opacity: .6, fontFamily: "'Inter',sans-serif" }}>{d.label}</span>
              <span style={{ fontSize: 10, color: "#a9ddd3", fontFamily: "'Inter',sans-serif", letterSpacing: ".05em" }}>+{d.pts} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
