import { useState } from "react";
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
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding:"24px 20px 20px", borderRadius:12, border:`1px solid ${hov?rs.border:"rgba(255,255,255,0.08)"}`, background:hov?`${rs.color}10`:"transparent", opacity:vis?1:0, transform:vis?"none":"translateY(16px)", transition:`opacity .5s ${i*.06}s, transform .5s ${i*.06}s, background .2s, border-color .2s`, cursor:"default" }}>
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
  const eligible = scoreVal >= b.min;
  const active   = eligible && claimed;
  const exp      = active && daysLeft !== null && daysLeft <= 7;
  const pct      = active && b.total ? Math.round(((daysLeft ?? 0) / b.total) * 100) : 0;
  const [hov, setHov] = useState(false);

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className={active ? "badge-card-active" : ""}
      style={{ padding:"20px 16px 16px", borderRadius:12, border:`1px solid ${active?rs.border:eligible?"rgba(232,227,213,0.25)":"rgba(232,227,213,0.08)"}`, background:active?`${rs.color}08`:"transparent", opacity:eligible?1:0.3, position:"relative", overflow:"hidden", cursor:"default", transform:hov&&active?"translateY(-4px)":hov&&eligible?"translateY(-2px)":"none", transition:"transform .2s, box-shadow .2s", boxShadow:hov&&active?`0 14px 40px rgba(0,0,0,.8), 0 0 20px ${rs.color}22`:hov&&eligible?"0 8px 24px rgba(0,0,0,.6)":"none" }}>
      {active && <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${rs.color}55,transparent)` }}/>}
      {eligible && (
        <div className="badge-sparkle">
          <span className="sp1" style={{ background:rs.color, boxShadow:`0 0 4px ${rs.color}` }}/><span className="sp2" style={{ background:"var(--btn-hover)", boxShadow:"0 0 3px #fff" }}/><span className="sp3" style={{ background:rs.color, boxShadow:`0 0 5px ${rs.color}` }}/><span className="sp4" style={{ background:"var(--btn-hover)", boxShadow:"0 0 3px #fff" }}/><span className="sp5" style={{ background:rs.color, boxShadow:`0 0 4px ${rs.color}` }}/><span className="sp6" style={{ background:"var(--btn-hover)", boxShadow:"0 0 3px #fff", width:3, height:3 }}/><span className="sp7" style={{ background:rs.color, boxShadow:`0 0 4px ${rs.color}`, width:3, height:3 }}/>
        </div>
      )}
      {BADGE_IMG[b.id] ? <img src={BADGE_IMG[b.id]} width={56} height={56} className="badge-img-glow" style={{ display:"block", marginBottom:10, opacity:active?1:eligible?0.7:0.3, color:rs.color }} alt={b.name}/> : <div style={{ fontSize:24, fontWeight:300, color:eligible?rs.color:"#444", marginBottom:10 }}>{b.sym}</div>}
      <div style={{ fontSize:8, color:eligible?rs.color:"#444", fontFamily:"'Inter',sans-serif", letterSpacing:".15em", border:`1px solid ${eligible?rs.border:"rgba(255,255,255,0.1)"}`, borderRadius:4, padding:"2px 7px", display:"inline-block", marginBottom:8 }}>{b.rarity.toUpperCase()}</div>
      <div className={active?(b.rarity==="Legendary"?"shimmer-accent":"shimmer-text"):""} style={{ fontSize:13, fontWeight:700, color:active?undefined:eligible?"var(--text)":"#444", fontFamily:"'Inter',sans-serif", marginBottom:6 }}>{b.name}</div>
      <div style={{ fontSize:10, color:eligible?"var(--text)":"#444", fontFamily:"'Inter',sans-serif", lineHeight:1.6, marginBottom:12, opacity:.7 }}>{eligible?b.desc:`score.require(${b.min})`}</div>
      {active && (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ fontSize:9, color:exp?"#f87171":"var(--text)", fontFamily:"'Inter',sans-serif", letterSpacing:".1em" }}>{exp?"⚠ EXPIRING":"● ACTIVE"}</span>
            <span style={{ fontSize:9, color:exp?"#f87171":rs.color }}>{daysLeft!=null?`${daysLeft}d`:"—"}</span>
          </div>
          <div style={{ height:1, background:"rgba(255,255,255,0.05)", marginBottom:12 }}>
            <div style={{ height:"100%", width:`${pct}%`, background:exp?"#f87171":rs.color, transition:"width .8s" }}/>
          </div>
        </>
      )}
      {eligible && (
        <button onClick={onClaim} disabled={claiming} style={{ width:"100%", padding:"8px 0", fontSize:10, fontWeight:700, fontFamily:"'Inter',sans-serif", letterSpacing:".12em", cursor:claiming?"wait":"pointer", border:`1px solid ${active?rs.border:"var(--border)"}`, background:active?"transparent":"var(--text)", color:active?rs.color:"var(--bg)", borderRadius:6, transition:"all .15s", opacity:claiming?0.6:1 }} onMouseEnter={e=>{ if(!claiming){e.currentTarget.style.background=active?"rgba(232,227,213,0.1)":"var(--btn-hover)";} }} onMouseLeave={e=>{ e.currentTarget.style.background=active?"transparent":"var(--text)"; }}>
          {claiming?"CLAIMING...":active?"RENEW →":"CLAIM →"}
        </button>
      )}
    </div>
  );
}
