import { useState, useRef } from "react";
import { RS } from "../constants";

export const BADGE_IMG = {
  b1:"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%230d0d0d' rx='16'/><path d='M50 25 L80 75 L20 75 Z' fill='none' stroke='%23c8b89a' stroke-width='4'/><circle cx='50' cy='60' r='5' fill='%23c8b89a'/></svg>",
  b2:"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%230d0d0d' rx='16'/><circle cx='40' cy='50' r='20' fill='none' stroke='%23c8b89a' stroke-width='3'/><circle cx='60' cy='50' r='20' fill='none' stroke='%23c8b89a' stroke-width='3'/><circle cx='50' cy='50' r='8' fill='%23c8b89a' opacity='0.5'/></svg>",
  b3:"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%230d0d0d' rx='16'/><rect x='30' y='30' width='16' height='16' fill='%23b8d4f0'/><rect x='54' y='30' width='16' height='16' fill='none' stroke='%23b8d4f0' stroke-width='3'/><rect x='30' y='54' width='16' height='16' fill='none' stroke='%23b8d4f0' stroke-width='3'/><rect x='54' y='54' width='16' height='16' fill='%23b8d4f0'/></svg>",
  b4:"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%230d0d0d' rx='16'/><circle cx='50' cy='50' r='24' fill='none' stroke='%23b8d4f0' stroke-width='4'/><path d='M50 16 L50 84 M16 50 L84 50' stroke='%23b8d4f0' stroke-width='2' opacity='0.5'/></svg>",
  b5:"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%230d0d0d' rx='16'/><polygon points='50,20 80,75 20,75' fill='none' stroke='%23a9ddd3' stroke-width='4'/><circle cx='50' cy='55' r='10' fill='%23a9ddd3' opacity='0.6'/></svg>",
  b6:"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%230d0d0d' rx='16'/><path d='M50 20 L76 35 L76 65 L50 80 L24 65 L24 35 Z' fill='none' stroke='%23a9ddd3' stroke-width='4'/><circle cx='50' cy='50' r='8' fill='%23a9ddd3'/></svg>",
  b7:"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%230d0d0d' rx='16'/><rect x='30' y='30' width='40' height='40' fill='none' stroke='%23a9ddd3' stroke-width='4' transform='rotate(45 50 50)'/><circle cx='50' cy='50' r='12' fill='none' stroke='%23a9ddd3' stroke-width='2'/></svg>",
  b8:"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%230d0d0d' rx='16'/><polygon points='50,15 61,38 85,41 68,58 72,82 50,70 28,82 32,58 15,41 39,38' fill='none' stroke='%23e8e3d5' stroke-width='3'/><circle cx='50' cy='50' r='18' fill='none' stroke='%23e8e3d5' stroke-width='1' opacity='0.5'/></svg>",
  b9:"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%230d0d0d' rx='16'/><circle cx='50' cy='50' r='30' fill='none' stroke='%23e8e3d5' stroke-width='2' stroke-dasharray='6 6'/><polygon points='50,25 70,60 30,60' fill='%23e8e3d5' opacity='0.8'/><polygon points='50,75 70,40 30,40' fill='none' stroke='%23e8e3d5' stroke-width='2'/></svg>",
};

export function BadgePreview({ b, i, vis }) {
  const rs = RS[b.rarity];
  const [hov, setHov] = useState(false);
  return (
    <div className="reveal-up" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding:"24px 20px 20px", borderRadius:12, border:`1px solid ${hov?rs.border:"rgba(255,255,255,0.08)"}`, background:hov?`${rs.color}10`:"transparent", transition:`background .2s, border-color .2s`, cursor:"default" }}>
      {BADGE_IMG[b.id] && <img src={BADGE_IMG[b.id]} width={60} height={60} style={{ display:"block", marginBottom:12 }} alt={b.name}/>}
      <div style={{ fontSize:8, color:rs.color, fontFamily:"'Inter',sans-serif", letterSpacing:".15em", border:`1px solid ${rs.border}`, borderRadius:4, padding:"2px 8px", display:"inline-block", marginBottom:10 }}>{b.rarity.toUpperCase()}</div>
      <div style={{ fontSize:14, fontWeight:700, color:"var(--text)", fontFamily:"'Inter',sans-serif", marginBottom:6 }}>{b.name}</div>
      <div style={{ fontSize:11, color:"var(--text)", fontFamily:"'Inter',sans-serif", lineHeight:1.7, marginBottom:14 }}>{b.desc}</div>
      <div style={{ fontSize:9, color:rs.color, fontFamily:"'Inter',monospace", letterSpacing:".1em" }}>ttl · {b.total}d</div>
    </div>
  );
}

export function BadgeCard({ b, scoreVal, claimed, daysLeft, onClaim, claiming }) {
  const rs = RS[b.rarity];
  const eligible = scoreVal >= b.min;  const active   = eligible && claimed;
  const inProgress = eligible && !claimed;
  const locked   = !eligible;
  const exp      = active && daysLeft !== null && daysLeft <= 7;
  const pct      = active && b.total ? Math.round(((daysLeft ?? 0) / b.total) * 100) : 0;
  const [hov, setHov] = useState(false);
  const [showQuest, setShowQuest] = useState(false);
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  return (
    <div 
      ref={cardRef}
      onMouseEnter={() => setHov(true)} 
      onMouseLeave={() => {
        setHov(false);
        setTilt({ x: 0, y: 0 });
        setGlare({ ...glare, opacity: 0 });
      }}
      onMouseMove={(e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Calculate tilt
        const rotateX = ((y - centerY) / centerY) * -12;
        const rotateY = ((x - centerX) / centerX) * 12;
        
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;
        
        setTilt({ x: rotateX, y: rotateY });
        setGlare({ x: glareX, y: glareY, opacity: 1 });
      }}
      className={`${active ? "badge-card-active" : ""} ${inProgress ? "badge-card-progress" : ""}`}
      style={{ 
        padding:"28px 24px", borderRadius:24, 
        border:`1px solid ${active?rs.border:eligible?"var(--border-default)":"var(--border-subtle)"}`, 
        background:active?"var(--bg-secondary)":"transparent", 
        opacity:locked ? 0.45 : inProgress ? 0.75 : 1, 
        filter: locked ? "grayscale(1)" : "none",
        position:"relative", overflow:"hidden", cursor:"default", 
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${hov&&active?"translateY(-4px) scale(1.02)":hov&&eligible?"translateY(-2px) scale(1.01)":"none"}`, 
        transformStyle: "preserve-3d",
        transition: "transform 0.15s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.2s, opacity 0.3s, filter 0.3s", 
        boxShadow:hov&&active?`0 32px 64px -16px rgba(0,0,0,0.7), 0 0 40px ${rs.color}22`:hov&&eligible?"0 24px 48px -12px rgba(0,0,0,0.6)":"0 8px 32px -8px rgba(0,0,0,0.4)",
        zIndex: hov ? 10 : 1,
        backdropFilter: "blur(40px) saturate(180%)",
        animation: inProgress ? "pulse-border 2s infinite" : "none"
      }}
    >
      <style>{`
        @keyframes pulse-border {
          0% { border-color: var(--border-default); box-shadow: 0 0 0 0 var(--accent-glow); }
          50% { border-color: var(--accent); box-shadow: 0 0 15px 0 var(--accent-glow); }
          100% { border-color: var(--border-default); box-shadow: 0 0 0 0 var(--accent-glow); }
        }
      `}</style>

      {locked && (
        <div style={{
          position: "absolute", bottom: 12, right: 12,
          fontSize: 12, background: "rgba(1,1,1,0.75)",
          color: "white", padding: "4px 8px", borderRadius: 6,
          zIndex: 30, display: "flex", alignItems: "center", gap: 4,
          fontFamily: "monospace", letterSpacing: "0.05em", fontWeight: 700
        }}>
          🔒 LOCKED
        </div>
      )}

      {/* Multi-layered lens glare */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 60%)`,
        mixBlendMode: "overlay",
        opacity: hov ? 0.8 : 0,
        transition: "opacity 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
        pointerEvents: "none",
        zIndex: 20
      }}/>
      {/* Holographic Iridescent Sheen */}
      {active && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(${135 + glare.x/2}deg, transparent 0%, rgba(154,230,212,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(184,212,240,0.05) 75%, transparent 100%)`,
          mixBlendMode: "color-dodge",
          opacity: hov ? 0.6 : 0,
          backgroundSize: "200% 200%",
          backgroundPosition: `${glare.x}% ${glare.y}%`,
          transition: "opacity 0.5s ease",
          pointerEvents: "none",
          zIndex: 22
        }}/>
      )}
      <div style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(circle at ${100 - glare.x}% ${100 - glare.y}%, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 40%)`,
        mixBlendMode: "screen",
        opacity: hov ? 0.4 : 0,
        transition: "opacity 0.8s ease",
        pointerEvents: "none",
        zIndex: 21
      }}/>
      {active && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${rs.color},transparent)`, opacity: 0.6 }}/>}
      
      {BADGE_IMG[b.id] ? (
        <img src={BADGE_IMG[b.id]} width={64} height={64} className="badge-img-glow" style={{ display:"block", marginBottom:18, opacity:active?1:eligible?0.8:0.25, filter: active ? `drop-shadow(0 0 12px ${rs.color}44)` : "none" }} alt={b.name}/>
      ) : (
        <div style={{ fontSize:32, fontWeight:300, color:eligible?rs.color:"var(--text-tertiary)", marginBottom:18 }}>{b.sym}</div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ fontSize:9, color:eligible?rs.color:"var(--text-tertiary)", fontFamily:"'Inter',sans-serif", letterSpacing:".2em", border:`1px solid ${eligible?rs.border:"var(--border-subtle)"}`, borderRadius:8, padding:"3px 10px", fontWeight: 800 }}>{b.rarity.toUpperCase()}</div>
        <div style={{ fontSize:10, color:eligible?rs.color:"var(--text-tertiary)", fontWeight:700, fontFamily:"monospace", opacity:0.8 }}>TOP {b.percent}%</div>
      </div>
      
      <div className={active?(b.rarity==="Legendary"?"shimmer-accent":""):""} style={{ 
        fontSize:20, fontWeight:300, 
        color:active?"var(--text-primary)":eligible?"var(--text-primary)":"var(--text-tertiary)", 
        fontFamily:"'Syne', sans-serif", marginBottom:8, 
        letterSpacing: "-0.04em", lineHeight: 1.1
      }}>{b.name}</div>
      
      <div style={{ fontSize:12, color:"var(--text-secondary)", fontFamily:"'Inter',sans-serif", lineHeight:1.6, marginBottom:20, opacity:eligible?0.8:0.4 }}>{eligible?b.desc:`REQUISITE: ${b.min} PTS`}</div>
      
      {active && (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:10, color:exp?"var(--error)":"var(--accent)", fontFamily:"'Inter',sans-serif", letterSpacing:".1em", fontWeight: 800 }}>{exp?"⚠ EXPIRING":"● VALID"}</span>
            <span style={{ fontSize:10, color:exp?"var(--error)":rs.color, fontWeight: 700 }}>{daysLeft!=null?`${daysLeft}D REMAINING`:"—"}</span>
          </div>
          <div style={{ height:2, background:"var(--border-subtle)", marginBottom:20, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height:"100%", width:`${pct}%`, background:exp?"var(--error)":rs.color, transition:"width 1s cubic-bezier(0.23, 1, 0.32, 1)" }}/>
          </div>
        </>
      )}

      {eligible && (
        <button onClick={onClaim} disabled={claiming} 
          className={active ? "secondary-button" : "premium-button"}
          style={{ width:"100%", padding:"12px 0", fontSize:11, justifyContent: "center" }}>
          {claiming?"SYNCING...":active?"RENEW ATTESTATION":"MINT BADGE →"}
        </button>
      )}
      {!eligible && (
        <>
          <button onClick={() => setShowQuest(!showQuest)} style={{ width:"100%", padding:"8px 0", fontSize:10, fontWeight:700, fontFamily:"'Inter',sans-serif", letterSpacing:".12em", cursor:"pointer", border:"1px solid var(--border-subtle)", background: showQuest ? "rgba(255,255,255,0.05)" : "transparent", color:"var(--text-primary)", borderRadius:6, transition:"all .15s" }}>
            {showQuest ? "HIDE QUEST" : "VIEW QUEST"}
          </button>
          
          {showQuest && (
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid var(--border-subtle)", animation: "fade-up 0.5s ease" }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", color: rs.color, marginBottom: 16, fontFamily: "'Syne', sans-serif" }}>QUEST OBJECTIVES</div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, opacity: scoreVal >= b.min ? 1 : 0.4 }}>
                 <div style={{ width: 14, height: 14, borderRadius: "50%", border: `1px solid ${scoreVal >= b.min ? rs.color : "var(--border-subtle)"}`, display: "flex", alignItems: "center", justifyContent: "center", background: scoreVal >= b.min ? rs.color : "transparent" }}>
                   {scoreVal >= b.min && <span style={{ color: "var(--bg-primary)", fontSize: 9 }}>✓</span>}
                 </div>
                 <span style={{ fontSize: 11, fontWeight: 600 }}>Total Score: {b.min}</span>
              </div>

              {b.metrics && Object.entries(b.metrics).map(([key, req]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, opacity: 0.6 }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", opacity: 0.3 }}/>
                  </div>
                  <span style={{ fontSize: 11 }}>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}: {req}</span>
                </div>
              ))}
              
              <div style={{ height: 4, background: "var(--border-subtle)", borderRadius: 2, overflow: "hidden" }}>
                 <div style={{ height: "100%", width: `${Math.min(100, (scoreVal / b.min) * 100)}%`, background: rs.color, transition: "width 1s ease-out" }}/>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, opacity: 0.5, marginTop: 6, fontFamily: "monospace" }}>
                <span>{Math.round(scoreVal)} PTS</span>
                <span>{b.min} PTS</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
