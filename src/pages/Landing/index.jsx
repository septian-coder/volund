import { useState, useEffect, useRef } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { useInView } from "../../hooks/useInView";

import { BADGES, RS, HOW, FEATURES } from "../../constants";
import Logo from "../../components/Logo";
import Tag from "../../components/Tag";
import ThemeToggle from "../../components/ThemeToggle";
import Grid from "../../components/Grid";
import { BadgePreview, BADGE_IMG } from "../../components/BadgeCard";
import SimSection from "./SimSection";
import AnimatedCounter from "../../components/AnimatedCounter";

import { useScrollReveal } from "../../hooks/useScrollReveal";

export default function Landing({ onLaunch, onDocs, canInstall, onInstall }) {
  useScrollReveal();
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef();
  const { isMobile, isTablet } = useBreakpoint();


  const handleMouseMove = (e) => {
    if (!heroRef.current || isMobile) return;
    const rect = heroRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  useEffect(()=>{ 
    let ticking = false;
    const fn=()=>{
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    }; 
    window.addEventListener("scroll",fn); 
    return ()=>window.removeEventListener("scroll",fn); 
  },[]);

  const [mag, setMag] = useState({ x: 0, y: 0 });
  const handleMagMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - (rect.left + rect.width / 2)) * 0.35;
    const y = (e.clientY - (rect.top + rect.height / 2)) * 0.35;
    setMag({ x, y });
  };

  const BADGE_GROUPS = [
    { label:"Common",    color:RS.Common.color,    badges:BADGES.filter(b=>b.rarity==="Common") },
    { label:"Rare",      color:RS.Rare.color,      badges:BADGES.filter(b=>b.rarity==="Rare") },
    { label:"Epic",      color:RS.Epic.color,      badges:BADGES.filter(b=>b.rarity==="Epic") },
    { label:"Legendary", color:RS.Legendary.color, badges:BADGES.filter(b=>b.rarity==="Legendary") },
  ];

  return (
    <div style={{ background:"var(--bg)", color:"var(--text)", fontFamily:"'Inter',sans-serif", transition:"background-color 0.4s ease, color 0.4s ease" }}>
      <Grid/>

      {/* NAV */}
      <nav className="nav-shrink" style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, background:scrollY>40?"var(--nav-bg)":"transparent", backdropFilter:scrollY>40?"blur(24px) saturate(200%)":"none", borderBottom: scrollY>40 ? "1px solid var(--border)" : "1px solid transparent", transition:"all .4s cubic-bezier(0.16,1,0.3,1), background-color 0.4s ease", padding:isMobile?"0 20px":"0 40px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", height:scrollY>40?64:80, display:"flex", alignItems:"center", justifyContent:"space-between", gap:24, transition:"height 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
          {/* left */}
          <div style={{ flex:1, display:"flex", alignItems:"center" }}><Logo size={24}/></div>
          {/* center */}
          {!isMobile ? (
            <div className="glass-panel" style={{ display:"flex", alignItems:"center", borderRadius:999, padding:"4px" }}>
              {["Docs","Blog","Network"].map((l)=>(
                <span key={l} onClick={l==="Docs" ? onDocs : undefined} className="hover-underline" style={{ fontSize:12, fontWeight:500, color:"var(--text)", cursor:"pointer", letterSpacing:".02em", padding:"8px 24px", borderRadius:999, transition:"all .3s cubic-bezier(0.16,1,0.3,1)" }}
                  onMouseEnter={e=>{ e.currentTarget.style.background="var(--border-subtle)"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; }}
                >{l}</span>
              ))}
            </div>
          ) : <div/>}
          {/* right */}
          <div style={{ flex:1, display:"flex", justifyContent:"flex-end", alignItems:"center", gap:16 }}>
            <ThemeToggle />
            <button onClick={onLaunch} className="premium-button" style={{ padding:"10px 24px", fontSize:12 }}>
              {isMobile ? "APP" : "LAUNCH APP"}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section ref={heroRef} onMouseMove={handleMouseMove} style={{ minHeight:"100vh", display:"flex", alignItems:"center", padding:isMobile?"120px 20px 180px":"160px 32px 240px", position:"relative", overflow:"hidden" }}>
        {/* Glow Follower */}
        {!isMobile && (
          <div style={{
            position: "absolute",
            top: mousePos.y,
            left: mousePos.x,
            width: "800px",
            height: "800px",
            background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 60%)",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 1
          }}/>
        )}
        <div className="reveal-up-scroll" style={{ maxWidth:1100, margin:"0 auto", textAlign:"center", width:"100%", position:"relative", zIndex:2 }}>
          <Tag>volund reputation score devnet</Tag>
          <h1 className="chromatic-text" style={{ 
            fontSize:"clamp(56px,8vw,110px)", fontWeight:300, color:"var(--text)", 
            fontFamily:"'Syne', sans-serif", letterSpacing:"-0.04em", lineHeight:0.85, 
            margin:"40px auto 28px"
          }}>
            <span className="shimmer-text">Your reputation.</span><br/>
            <span className="shimmer-accent" style={{ transform: isMobile ? "none" : `translate(${mousePos.x * 0.01}px, ${mousePos.y * 0.01}px)`, display: "inline-block" }}>Onchain.</span>
          </h1>
          <p style={{ fontSize:16, color:"var(--text-dim)", lineHeight:1.8, maxWidth:520, marginBottom:48, margin:"0 auto 48px" }}>
            The native reputation layer for the Rialo ecosystem. Prove your credibility, earn badges, and unlock institutional DeFi access.
          </p>
          <div style={{ display:"flex", justifyContent:"center", gap:16, marginBottom:64 }}>
            <button 
              onClick={onLaunch} 
              className="premium-button"
              onMouseMove={handleMagMove}
              onMouseLeave={()=>setMag({ x: 0, y: 0 })}
              style={{ 
                padding:"20px 48px", fontSize:15,
                transform: `translate(${mag.x}px, ${mag.y}px)`
              }}>
              LAUNCH APP →
            </button>
            <button onClick={onDocs} className="secondary-button" style={{ padding:"20px 48px", fontSize:15 }}>
              READ DOCS
            </button>
          </div>
          <div className="hero-grid stagger-container" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:16, maxWidth:900, margin:"0 auto 64px" }}>
            {[
              { icon:"◎", label:"Real-World Credit", sub:"Rialo Native" },
              { icon:"◉", label:"Non-Permanent", sub:"30–90d TTL" },
              { icon:"⛓", label:"Onchain Data", sub:"Zero Oracles" },
            ].map(f=>(
              <div key={f.label} className="reveal-up-scroll glass-panel" style={{ padding:"24px", textAlign:"left", borderRadius:20 }}>
                <div style={{ fontSize:22, marginBottom:12, color:"var(--accent)" }}>{f.icon}</div>
                <div style={{ fontSize:14, fontWeight:700, color:"var(--text)", marginBottom:4 }}>{f.label}</div>
                <div style={{ fontSize:12, color:"var(--text-dim)" }}>{f.sub}</div>
              </div>
            ))}
          </div>


          <div style={{ display:"flex", justifyContent:"center", gap:48, opacity:.3 }}>
            {[{v:"9",l:"badges"},{v:"5",l:"signals"},{v:"4",l:"rarity"},{v:"0.1",l:"sync"}].map(m=>(
              <div key={m.l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:22, fontWeight:200, color:"var(--text)", letterSpacing:"-0.04em" }}>
                  <AnimatedCounter value={m.v} duration={1800} suffix={m.l==="sync"?"s":""}/>
                </div>
                <div style={{ fontSize:9, color:"var(--text)", letterSpacing:".2em", marginTop:4, textTransform:"uppercase" }}>{m.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SIMULATION - Problem/Solution */}
      <SimSection isMobile={isMobile} isTablet={isTablet}/>

      {/* ARCHITECTURE */}
      <section style={{ padding:isMobile?"100px 20px":"160px 32px", borderBottom:"1px solid var(--border)" }}>
        <div className="reveal-up-scroll" style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 80 }}>
            <Tag>architecture</Tag>
            <h2 className="chromatic-text" style={{ fontSize:"clamp(32px,5vw,64px)", fontWeight:300, color:"var(--text)", fontFamily:"'Syne', sans-serif", letterSpacing:"-0.02em", margin:"24px 0 0", lineHeight:1.1 }}>
              <span className="shimmer-text">Four steps.</span><br/><span className="shimmer-accent">Zero middleware.</span>
            </h2>
          </div>
          <div className="stagger-container" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:16 }}>
            {HOW.map((s,i)=>(
              <div key={i} className="reveal-up-scroll glass-panel" style={{ padding:"40px 32px", borderRadius:24 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--accent)", letterSpacing:".2em", marginBottom:24, textTransform:"uppercase" }}>0{i+1}</div>
                <div style={{ fontSize:20, fontWeight:700, color:"var(--text)", fontFamily:"'Syne', sans-serif", marginBottom:16 }}>{s.title}</div>
                <div style={{ fontSize:14, color:"var(--text-dim)", lineHeight:1.8 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES / SIGNALS */}
      <section style={{ padding:isMobile?"100px 20px":"160px 32px", borderBottom:"1px solid var(--border)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:isTablet?"1fr":"1.2fr 1fr", gap:isTablet?60:100, alignItems:"center" }}>
          <div className="reveal-left">
            <Tag>score signals</Tag>
            <h2 className="chromatic-text" style={{ fontSize:"clamp(36px,5vw,64px)", fontWeight:300, color:"var(--text)", fontFamily:"'Syne', sans-serif", letterSpacing:"-0.02em", margin:"24px 0 24px", lineHeight:1.05 }}>
              <span className="shimmer-text">Five signals.</span><br/><span className="shimmer-accent">One identity.</span>
            </h2>
            <p style={{ fontSize:16, color:"var(--text-dim)", lineHeight:1.8, maxWidth:420, marginBottom:48 }}>
              Every interaction you've had onchain tells a story. Volund reads it all — and turns it into a single, institutional-grade number.
            </p>
            <button onClick={onLaunch} className="premium-button breathe" style={{ padding: "14px 32px" }}>COMPUTE NOW</button>
          </div>
          <div className="reveal-right">
            {FEATURES.map((f,i)=>(
              <div key={i} style={{ padding:"32px 0", borderBottom:"1px solid var(--border)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                  <div style={{ width:24, height:24, borderRadius:6, background:"var(--card-bg)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"var(--accent)" }}>{i+1}</div>
                  <div style={{ height:1, flex:1, background:"var(--border)", opacity:0.5 }}/>
                </div>
                <div style={{ fontSize:22, fontWeight:700, color:"var(--text)", fontFamily:"'Syne', sans-serif", marginBottom:12 }}>{f.title}</div>
                <div style={{ fontSize:14, color:"var(--text-dim)", lineHeight:1.8 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST LAYER / HUMAN SIGNAL */}
      <section style={{ padding:isMobile?"100px 20px":"160px 32px", background:"rgba(154,230,212,0.02)", borderBottom:"1px solid var(--border)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:isTablet?"1fr":"1fr 1.2fr", gap:isTablet?60:100, alignItems:"center" }}>
            <div className="reveal-left" style={{ order:isTablet?2:1 }}>
              <div style={{ position:"relative", padding:"20px" }}>
                <div className="glass-panel" style={{ width:"100%", height:340, borderRadius:32, border:"1px solid var(--border)", background:"rgba(154,230,212,0.05)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
                   <div style={{ position:"absolute", inset:0, background:"radial-gradient(circle, var(--accent) 0%, transparent 60%)", opacity:0.1 }}/>
                   {/* Minimal technical diagram representation */}
                   <svg width="240" height="240" viewBox="0 0 240 240" fill="none" style={{ opacity:0.6 }}>
                      <circle cx="120" cy="120" r="80" stroke="var(--accent)" strokeWidth="0.5" strokeDasharray="4 4"/>
                      <circle cx="120" cy="120" r="40" stroke="var(--accent)" strokeWidth="1"/>
                      <path d="M120 40L120 200M40 120L200 120" stroke="var(--accent)" strokeWidth="0.5" opacity="0.5"/>
                      {[0,72,144,216,288].map(deg => (
                        <circle key={deg} cx={120 + 80*Math.cos(deg*Math.PI/180)} cy={120 + 80*Math.sin(deg*Math.PI/180)} r="4" fill="var(--accent)"/>
                      ))}
                   </svg>
                   <div style={{ position:"absolute", bottom:40, left:0, right:0, textAlign:"center", fontSize:11, color:"var(--accent)", letterSpacing:".25em", fontWeight:800 }}>SOCIAL INTEGRITY ANALYZER</div>
                </div>
              </div>
            </div>
            <div className="reveal-right" style={{ order:isTablet?1:2 }}>
              <Tag>human layer</Tag>
              <h2 style={{ fontSize:"clamp(36px,5vw,64px)", fontWeight:300, color:"var(--text)", fontFamily:"'Syne', sans-serif", letterSpacing:"-0.02em", margin:"24px 0 24px", lineHeight:1.05 }}>
                <span className="shimmer-text">Trust is a</span><br/><span className="shimmer-accent">Social Signal.</span>
              </h2>
              <p style={{ fontSize:16, color:"var(--text-dim)", lineHeight:1.8, marginBottom:40 }}>
                Beyond algorithms, Volund integrates social trust. High-score peers can vouch for you, boosting your governance weight and unlocking exclusive "Social Trust" perks.
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                {[
                  { l: "VOUCHING", v: "Boosts Reputation" },
                  { l: "GOVERNANCE", v: "Dynamic Weighting" }
                ].map(x => (
                  <div key={x.l} style={{ padding:"16px", border:"1px solid var(--border)", borderRadius:12 }}>
                    <div style={{ fontSize:9, color:"var(--accent)", fontWeight:800, letterSpacing:".15em", marginBottom:4 }}>{x.l}</div>
                    <div style={{ fontSize:13, color:"var(--text)", fontWeight:600 }}>{x.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ZK PRIVACY */}
      <section style={{ padding:isMobile?"100px 20px":"160px 32px", borderBottom:"1px solid var(--border)", background:"rgba(232,227,213,0.01)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:isTablet?"1fr":"1.2fr 1fr", gap:isTablet?60:100, alignItems:"center" }}>
           <div className="reveal-left">
              <Tag>privacy protocol</Tag>
              <h2 style={{ fontSize:"clamp(36px,5vw,64px)", fontWeight:300, color:"var(--text)", fontFamily:"'Syne', sans-serif", letterSpacing:"-0.02em", margin:"24px 0 24px", lineHeight:1.05 }}>
                <span className="shimmer-text">Zero Knowledge.</span><br/><span className="shimmer-accent">Full Trust.</span>
              </h2>
              <p style={{ fontSize:16, color:"var(--text-dim)", lineHeight:1.8, maxWidth:480 }}>
                Prove your reputation without exposing your wallet. Volund uses ZK-SNARK technology to generate verifiable credentials that unlock benefits while keeping your onchain footprint private.
              </p>
           </div>
           <div className="reveal-right">
              <div className="glass-panel" style={{ padding:40, borderRadius:32, border:"1px solid var(--border-strong)", background:"var(--bg)", position:"relative" }}>
                 <div style={{ fontSize:10, color:"var(--accent)", letterSpacing:".2em", fontWeight:800, marginBottom:32 }}>PROOF GENERATION STATE</div>
                 <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    {[
                      { l: "Circuit Selection", s: "SUCCESS", c: "var(--accent)" },
                      { l: "Witness Computation", s: "SUCCESS", c: "var(--accent)" },
                      { l: "Proof Generation", s: "PENDING...", c: "var(--text-dim)" }
                    ].map(x => (
                      <div key={x.l} style={{ display:"flex", justifyContent:"space-between", fontSize:12, paddingBottom:8, borderBottom:"1px solid var(--border)" }}>
                        <span style={{ color:"var(--text-dim)" }}>{x.l}</span>
                        <span style={{ color:x.c, fontWeight:700 }}>{x.s}</span>
                      </div>
                    ))}
                 </div>
                 <div style={{ marginTop:32, height:1, background:"var(--border)", position:"relative" }}>
                    <div style={{ position:"absolute", top:0, left:0, height:"100%", width:"65%", background:"var(--accent)", boxShadow:"0 0 10px var(--accent)" }}/>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* BADGES */}
      <section style={{ padding:isMobile?"100px 20px":"160px 32px", borderBottom:"1px solid var(--border)" }}>
        <div className="reveal-up-scroll" style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 80 }}>
            <Tag>badge system</Tag>
            <h2 style={{ fontSize:"clamp(32px,5vw,64px)", fontWeight:300, color:"var(--text)", fontFamily:"'Syne', sans-serif", letterSpacing:"-0.01em", margin:"24px 0 0", lineHeight:1.05 }}>
              <span className="shimmer-text">Status is earned.</span><br/><span className="shimmer-accent">Legacy is kept.</span>
            </h2>
          </div>
          <div className="stagger-container" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))", gap:24 }}>
            {BADGE_GROUPS.map((group, gi) => (
              <div key={group.label} className="reveal-up-scroll glass-panel" style={{ padding:"32px", borderRadius:24 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
                  <div style={{ width:12, height:12, borderRadius:"50%", background:group.color, boxShadow:`0 0 12px ${group.color}` }}/>
                  <span style={{ fontSize:12, fontWeight:800, color:group.color, letterSpacing:".15em", textTransform:"uppercase" }}>{group.label}</span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {group.badges.map(b => (
                    <div key={b.id} style={{ display:"flex", alignItems:"center", gap:16, padding:"12px", background:"rgba(232,227,213,0.02)", border:"1px solid var(--border)", borderRadius:12 }}>
                      <div style={{ width:42, height:42, borderRadius:10, background:"var(--bg)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, overflow:"hidden" }}>
                        {BADGE_IMG[b.id] ? (
                          <img src={BADGE_IMG[b.id]} width={32} height={32} alt={b.name} style={{ opacity: 0.8 }} />
                        ) : (
                          <div style={{ fontSize:16, color:group.color, fontWeight:800 }}>{b.sym}</div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>{b.name}</div>
                        <div style={{ fontSize:12, color:"var(--text-dim)", opacity:0.6 }}>Min Score: {b.min}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="glass-panel" style={{ marginTop:48, padding:"24px 32px", borderRadius:16, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:24 }}>
            <div style={{ display:"flex", gap:32 }}>
              <div style={{ fontSize:11, color:"var(--text-dim)", letterSpacing:".05em" }}>
                <span style={{ color:"var(--accent)", fontWeight:800 }}>RULE :</span> NON-PERMANENT
              </div>
              <div style={{ fontSize:11, color:"var(--text-dim)", letterSpacing:".05em" }}>
                <span style={{ color:"var(--accent)", fontWeight:800 }}>DECAY :</span> 30–90 DAYS
              </div>
            </div>
            <button onClick={onDocs} style={{ background:"transparent", border:"none", color:"var(--accent)", fontSize:11, fontWeight:800, cursor:"pointer", textDecoration:"underline" }}>LEARN MORE</button>
          </div>
        </div>
      </section>

      {/* LIVE ECOSYSTEM — Deployed Contracts */}
      <section style={{ padding:isMobile?"100px 20px":"160px 32px", borderBottom:"1px solid var(--border)", background:"rgba(169,221,211,0.015)" }}>
        <div className="reveal-up-scroll" style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 80 }}>
            <Tag>live infrastructure</Tag>
            <h2 className="chromatic-text" style={{ fontSize:"clamp(32px,5vw,64px)", fontWeight:300, color:"var(--text)", fontFamily:"'Syne', sans-serif", letterSpacing:"-0.02em", margin:"24px 0 0", lineHeight:1.1 }}>
              <span className="shimmer-text">Deployed.</span><br/><span className="shimmer-accent">Onchain.</span>
            </h2>
            <p style={{ fontSize:14, color:"var(--text-dim)", lineHeight:1.8, maxWidth:500, margin:"20px auto 0" }}>
              Four immutable smart contracts powering every interaction in the Volund ecosystem. Fully verified and open-source.
            </p>
          </div>

          <div className="stagger-container" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap:16 }}>
            {[
              { name: "Registry", addr: "0xc62D6142...4119", desc: "Identity primitive storage — Basenames, PoH levels, and registration timestamps.", full: "0xc62D6142a6229d0EEf0ff735Edf0E32251344119" },
              { name: "Badge", addr: "0x5DC88b45...5136", desc: "Soulbound ERC-721 NFTs with expiry mechanics and payable minting.", full: "0x5DC88b45c76e7b6011B7bf4BEa1b48cfCDe15136" },
              { name: "Score Oracle", addr: "0x837aA7e1...Fd4a", desc: "On-chain score storage with authorized relayer pattern for secure updates.", full: "0x837aA7e144757464C815878C87c99c0a4D4AFd4a" },
              { name: "Access Gate", addr: "0xf14ccDD2...07a", desc: "Permissionless eligibility API for third-party protocol integrations.", full: "0xf14ccDD2EEa9C3043Dc7A795F219B05628B6407a" },
            ].map((c, i) => (
              <a key={c.name} href={`https://sepolia.basescan.org/address/${c.full}`} target="_blank" rel="noreferrer"
                className="reveal-up-scroll glass-panel"
                style={{
                  padding:"32px", borderRadius:24, textDecoration:"none", color:"var(--text)",
                  display:"flex", flexDirection:"column", gap:16,
                  transition:"all 0.4s cubic-bezier(0.23,1,0.32,1)",
                  cursor:"pointer", position:"relative", overflow:"hidden"
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.boxShadow="0 0 24px rgba(169,221,211,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=""; e.currentTarget.style.boxShadow="none"; }}
              >
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:"#a9ddd3", boxShadow:"0 0 8px rgba(169,221,211,0.6)", animation:"pulse 2s infinite" }}/>
                    <span style={{ fontSize:10, fontWeight:800, letterSpacing:".15em", color:"var(--accent)" }}>0{i+1}</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ opacity:0.3 }}><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
                </div>

                <div>
                  <div style={{ fontSize:18, fontWeight:700, fontFamily:"'Syne', sans-serif", marginBottom:4 }}>Volund{c.name}</div>
                  <div style={{ fontSize:11, fontFamily:"monospace", opacity:0.3 }}>{c.addr}</div>
                </div>

                <div style={{ fontSize:13, color:"var(--text-dim)", lineHeight:1.7 }}>{c.desc}</div>
              </a>
            ))}
          </div>

          <div style={{ textAlign:"center", marginTop:48 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 24px", borderRadius:999, background:"rgba(169,221,211,0.05)", border:"1px solid rgba(169,221,211,0.15)" }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"#a9ddd3", boxShadow:"0 0 6px rgba(169,221,211,0.6)", animation:"pulse 2s infinite" }}/>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", color:"var(--accent)" }}>CHAIN ID 84532 · LIVE</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:isMobile?"60px 20px":"120px 32px" }}>
        <div className="reveal-up-scroll" style={{ maxWidth:1100, margin:"0 auto", textAlign:"center" }}>
          <Tag>get started</Tag>
          <h2 style={{ fontSize:"clamp(38px,6vw,82px)", fontWeight:300, color:"var(--text)", fontFamily:"'Syne', sans-serif", letterSpacing:"-0.02em", margin:"24px 0 16px", lineHeight:1.0 }}>
            <span className="shimmer-text">Check your</span><br/><span className="shimmer-accent">score now.</span>
          </h2>
          <p style={{ fontSize:13, color:"var(--text)", opacity:.6, lineHeight:1.9, maxWidth:380, marginBottom:48, margin:"0 auto 48px" }}>
            Built natively on Rialo. No signup. No email. Just connect your wallet — your onchain history does the rest.
          </p>
          <button onClick={onLaunch} className="premium-button" style={{ padding:"20px 64px", fontSize:15 }}>
            LAUNCH APP →
          </button>
          <div style={{ marginTop:20, fontSize:10, color:"var(--text)", opacity:.3, letterSpacing:".1em" }}>CONNECT · COMPUTE · EARN</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:"1px solid var(--border)", padding:"32px 32px 24px", position: "relative" }}>
        {/* Animated separator */}
        <div style={{ position:"absolute", top:0, left:"10%", right:"10%", height:1, background:"linear-gradient(90deg, transparent, var(--accent), transparent)", opacity:0.4 }}/>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          {/* Contract strip */}
          <div style={{ display:"flex", justifyContent:"center", gap:isMobile?12:32, flexWrap:"wrap", marginBottom:24, paddingBottom:24, borderBottom:"1px solid var(--border)" }}>
            {[
              { name:"Registry", addr:"0xc62D...4119" },
              { name:"Badge", addr:"0x5DC8...5136" },
              { name:"Oracle", addr:"0x837a...Fd4a" },
              { name:"Gate", addr:"0xf14c...07a" },
            ].map(c => (
              <div key={c.name} style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:4, height:4, borderRadius:"50%", background:"var(--accent)", opacity:0.5 }}/>
                <span style={{ fontSize:9, fontFamily:"monospace", color:"var(--text)", opacity:0.25, letterSpacing:".02em" }}>{c.name}: {c.addr}</span>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
            <Logo size={14}/>
            <div className="footer-links" style={{ display:"flex", alignItems:"center", gap:20 }}>
              {["@VolundHQ","Discord","Docs","Build"].map(l=>(
                <span key={l} className="hover-underline" style={{ fontSize:10, color:"var(--text)", opacity:.4, fontFamily:"'Inter',sans-serif", letterSpacing:".08em", cursor:"pointer" }}>{l}</span>
              ))}
              {canInstall && (
                 <button onClick={onInstall} style={{ padding:"4px 12px", background:"rgba(169,221,211,0.1)", border:"1px solid var(--accent)", color:"var(--accent)", borderRadius:4, cursor:"pointer", fontSize:10, fontWeight:700, fontFamily:"'Inter',sans-serif" }}>INSTALL APP</button>
              )}
            </div>
            <span style={{ fontSize:9, color:"var(--text)", opacity:.2, fontFamily:"'Inter',sans-serif", letterSpacing:".1em" }}>RRS · DEVNET</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
