import { useState, useEffect, useRef } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { useInView } from "../../hooks/useInView";
import { BADGES, RS, HOW, FEATURES } from "../../constants";
import Logo from "../../components/Logo";
import Tag from "../../components/Tag";
import ThemeToggle from "../../components/ThemeToggle";
import Grid from "../../components/Grid";
import { BadgePreview } from "../../components/BadgeCard";
import SimSection from "./SimSection";

export default function Landing({ onLaunch, onDocs, canInstall, onInstall, theme, toggleTheme }) {
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef();
  const howRef=useRef(), featRef=useRef(), bRef=useRef(), ctaRef=useRef();
  const howVis=useInView(howRef), featVis=useInView(featRef), bVis=useInView(bRef), ctaVis=useInView(ctaRef);
  const { isMobile, isTablet } = useBreakpoint();

  useEffect(()=>{ 
    const fn=()=>setScrollY(window.scrollY); 
    window.addEventListener("scroll",fn); 
    return ()=>window.removeEventListener("scroll",fn); 
  },[]);

  const handleMouseMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

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
    <div style={{ background:"var(--bg)", color:"var(--text)", fontFamily:"'Inter',sans-serif", transition:"background 0.3s, color 0.3s" }}>
      <Grid/>

      {/* NAV */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, background:scrollY>40?"var(--nav-bg)":"transparent", backdropFilter:scrollY>40?"blur(14px)":"none", transition:"background .3s", padding:isMobile?"0 20px":"0 40px" }}>
        <div style={{ width:"100%", margin:"0 auto", height:72, display:"flex", alignItems:"center", justifyContent:"space-between", gap:24 }}>
          {/* left */}
          <div style={{ flex:1, display:"flex", alignItems:"center" }}><Logo size={22}/></div>
          {/* center */}
          {!isMobile ? (
            <div style={{ display:"flex", alignItems:"center", border:"1px solid var(--border)", borderRadius:999, overflow:"hidden" }}>
              {["Docs","Blog","Network"].map((l)=>(
                <span key={l} onClick={l==="Docs" ? onDocs : undefined} style={{ fontSize:13, color:"var(--text)", cursor:"pointer", letterSpacing:".05em", padding:"10px 28px", fontFamily:"'Inter',sans-serif", transition:"color .15s, background .15s", whiteSpace:"nowrap" }}
                  onMouseEnter={e=>{ e.currentTarget.style.color="var(--bg)"; e.currentTarget.style.background="var(--text)"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.color="var(--text)"; e.currentTarget.style.background="transparent"; }}
                >{l}</span>
              ))}
            </div>
          ) : <div/>}
          {/* right */}
          <div style={{ flex:1, display:"flex", justifyContent:"flex-end", alignItems:"center", gap:16 }}>
            <ThemeToggle theme={theme} toggle={toggleTheme}/>
            <button onClick={onLaunch} style={{ padding:"12px 28px", background:"var(--text)", color:"var(--bg)", fontWeight:800, fontSize:13, border:"none", cursor:"pointer", letterSpacing:".12em", fontFamily:"'Inter',sans-serif", borderRadius:4 }}
              onMouseEnter={e=>e.currentTarget.style.background="var(--btn-hover)"} onMouseLeave={e=>e.currentTarget.style.background="var(--text)"}>
              {isMobile ? "APP →" : "LAUNCH APP →"}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section ref={heroRef} onMouseMove={handleMouseMove} style={{ minHeight:"100vh", display:"flex", alignItems:"center", padding:isMobile?"80px 20px 60px":"110px 32px 80px", borderBottom:"1px solid var(--border)", position:"relative", overflow:"hidden" }}>
        {/* Glow Follower */}
        {!isMobile && (
          <div style={{
            position: "absolute",
            top: mousePos.y,
            left: mousePos.x,
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(169,221,211,0.08) 0%, transparent 70%)",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 1
          }}/>
        )}
        <div style={{ maxWidth:1100, margin:"0 auto", textAlign:"center", width:"100%", position:"relative", zIndex:2 }}>
          <Tag>volund reputation score devnet</Tag>
          <h1 style={{ fontSize:"clamp(52px,7vw,100px)", fontWeight:300, color:"var(--text)", fontFamily:"'Inter',sans-serif", letterSpacing:"-0.02em", lineHeight:0.95, margin:"32px auto 24px", animation:"fade-up .8s .1s ease both" }}>
            <span className="shimmer-text">Your reputation.</span><br/><span className="shimmer-accent">Onchain.</span>
          </h1>
          <p style={{ fontSize:15, color:"var(--text)", lineHeight:2.0, maxWidth:480, marginBottom:40, margin:"0 auto 40px", opacity:.7, animation:"fade-up .8s .25s ease both" }}>
            The native reputation layer for the Rialo ecosystem. Prove your credibility, earn badges, unlock the full power of the Rialo ecosystem.
          </p>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:40, animation:"fade-up .8s .4s ease both" }}>
            <button 
              onClick={onLaunch} 
              onMouseMove={handleMagMove}
              onMouseEnter={e=>e.currentTarget.style.background="var(--btn-hover)"} 
              onMouseLeave={e=>{e.currentTarget.style.background="var(--text)"; setMag({ x: 0, y: 0 }); }}
              style={{ 
                padding:"18px 60px", background:"var(--text)", color:"var(--bg)", fontWeight:800, fontSize:14, border:"none", cursor:"pointer", letterSpacing:".15em", fontFamily:"'Inter',sans-serif", borderRadius:4, transition:"transform 0.1s ease-out, background .15s",
                transform: `translate(${mag.x}px, ${mag.y}px)`
              }}>
              LAUNCH APP →
            </button>
          </div>
          <div className="hero-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, maxWidth:700, margin:"0 auto 48px" }}>
            {[
              { icon:"◎", label:"Real-World Credit", sub:"via Rialo" },
              { icon:"◉", label:"Non-Permanent Badges", sub:"30–90d TTL" },
              { icon:"⛓", label:"Onchain Native", sub:"no oracles" },
              { icon:"◈", label:"Privacy First", sub:"threshold MPC" },
              { icon:"↗", label:"DeFi Unlocks", sub:"rates & access" },
              { icon:"◇", label:"Composable", sub:"queryable layer" },
            ].map(f=>(
              <div key={f.label} className="feat-card" style={{ padding:"16px", textAlign:"left" }}>
                <div className="feat-icon" style={{ fontSize:18, marginBottom:8 }}>{f.icon}</div>
                <div className="feat-label" style={{ fontSize:12, fontWeight:600, color:"var(--text)", fontFamily:"'Inter',sans-serif", marginBottom:4 }}>{f.label}</div>
                <div className="feat-sub" style={{ fontSize:10, color:"var(--text)", opacity:.6, fontFamily:"'Inter',sans-serif" }}>{f.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"center", gap:48, opacity:.5 }}>
            {[{v:"9",l:"badges"},{v:"5",l:"signals"},{v:"4",l:"rarity"},{v:"IPC",l:"powered"}].map(m=>(
              <div key={m.l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:22, fontWeight:300, color:"var(--text)", fontFamily:"'Inter',sans-serif", letterSpacing:"-0.04em" }}>{m.v}</div>
                <div style={{ fontSize:10, color:"var(--text)", letterSpacing:".1em", marginTop:4 }}>{m.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* SIMULATION  Canvas particle flow */}
      <SimSection isMobile={isMobile}/>



      <section ref={howRef} style={{ padding:isMobile?"60px 20px":"100px 32px", borderBottom:"1px solid var(--border)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:isMobile?"0 4px":0 }}>
          <Tag>how it works</Tag>
          <h2 style={{ fontSize:"clamp(30px,4vw,54px)", fontWeight:300, color:"var(--text)", fontFamily:"'Inter',sans-serif", letterSpacing:"-0.01em", margin:"20px 0 0", lineHeight:1.1 }}>
            <span className="shimmer-text">Four steps.</span><br/><span className="shimmer-accent">Zero middleware.</span>
          </h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:0, marginTop:60, border:"1px solid var(--text)", borderRadius:12, overflow:"hidden" }}>
            {HOW.map((s,i)=>(
              <div key={i} style={{ padding:"32px 28px", borderRight:i<HOW.length-1?"1px solid var(--border)":"none",
                opacity:howVis?1:0, transform:howVis?"none":"translateY(16px)", transition:`opacity .6s ${i*.12}s cubic-bezier(0.16,1,0.3,1), transform .6s ${i*.12}s cubic-bezier(0.16,1,0.3,1)` }}>
                <div style={{ fontSize:11, color:"var(--text)", opacity:.4, fontFamily:"'Inter',sans-serif", letterSpacing:".1em", marginBottom:20 }}>{s.n}</div>
                <div style={{ fontSize:17, fontWeight:600, color:"var(--text)", fontFamily:"'Inter',sans-serif", letterSpacing:"-0.02em", marginBottom:12 }}>{s.title}</div>
                <div style={{ fontSize:12, color:"var(--text)", opacity:.6, lineHeight:1.9 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section ref={featRef} style={{ padding:isMobile?"60px 20px":"100px 32px", borderBottom:"1px solid var(--border)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:isTablet?"1fr":"1fr 1fr", gap:isTablet?40:80, alignItems:"start" }}>
          <div>
            <Tag>score signals</Tag>
            <h2 style={{ fontSize:"clamp(28px,3.5vw,48px)", fontWeight:300, color:"var(--text)", fontFamily:"'Inter',sans-serif", letterSpacing:"-0.01em", margin:"20px 0 16px", lineHeight:1.1 }}>
              <span className="shimmer-text">Five signals.</span><br/><span className="shimmer-accent">One score.</span>
            </h2>
            <p style={{ fontSize:12, color:"var(--text)", opacity:.6, lineHeight:1.9, maxWidth:340, marginBottom:36 }}>
              Every interaction you've had onchain tells a story. Volund reads it all — and turns it into a single verifiable number.
            </p>
          </div>
          <div>
            {FEATURES.map((f,i)=>(
              <div key={i} style={{ padding:"28px 0", borderBottom:"1px solid var(--border)",
                opacity:featVis?1:0, transform:featVis?"none":"translateX(16px)",
                transition:`opacity .6s ${i*.12}s cubic-bezier(0.16,1,0.3,1), transform .6s ${i*.12}s cubic-bezier(0.16,1,0.3,1)` }}>
                <div style={{ marginBottom:10 }}>
                  <span style={{ fontSize:11, color:"var(--text)", opacity:.4, fontFamily:"'Inter',sans-serif" }}>{f.n}</span>
                </div>
                <div style={{ fontSize:18, fontWeight:300, color:"var(--text)", fontFamily:"'Inter',sans-serif", letterSpacing:"-0.02em", marginBottom:10 }}>{f.title}</div>
                <div style={{ fontSize:12, color:"var(--text)", opacity:.6, lineHeight:1.8 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BADGES */}
      <section ref={bRef} style={{ padding:isMobile?"60px 20px":"100px 32px", borderBottom:"1px solid var(--border)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:isMobile?"0 4px":0 }}>
          <Tag>badge system</Tag>
          <h2 style={{ fontSize:"clamp(28px,4vw,54px)", fontWeight:300, color:"var(--text)", fontFamily:"'Inter',sans-serif", letterSpacing:"-0.01em", margin:"20px 0 0", lineHeight:1.05 }}>
            <span className="shimmer-text">Badges expire.</span><br/><span className="shimmer-accent">Keep earning.</span>
          </h2>
          <div style={{ marginTop:60 }}>
            {[
              {label:"Common",    badges:BADGES.filter(b=>b.rarity==="Common")},
              {label:"Rare",      badges:BADGES.filter(b=>b.rarity==="Rare")},
              {label:"Epic",      badges:BADGES.filter(b=>b.rarity==="Epic")},
              {label:"Legendary", badges:BADGES.filter(b=>b.rarity==="Legendary")},
            ].map((group,gi)=>(
              <div key={group.label} style={{ marginBottom:40 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, paddingBottom:10, borderBottom:"1px solid rgba(232,227,213,0.1)" }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:RS[group.label].color }}/>
                  <span style={{ fontSize:10, color:RS[group.label].color, fontFamily:"'Inter',sans-serif", letterSpacing:".2em" }}>{group.label.toUpperCase()}</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12 }}>
                  {group.badges.map((b,i)=><BadgePreview key={b.id} b={b} i={gi*3+i} vis={bVis}/>)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:8, padding:"18px 24px", border:"1px solid rgba(232,227,213,0.12)", borderRadius:12, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
            <span style={{ fontSize:10, color:"var(--text)", opacity:.5, fontFamily:"'Inter',sans-serif" }}>
              badge.rule: non-permanent · score decay triggers badge loss
            </span>
            <span style={{ fontSize:10, color:"var(--text)", opacity:.5, fontFamily:"'Inter',sans-serif" }}>
              Common 30d · Rare 45d · Epic 60d · Legendary 90d
            </span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} style={{ padding:isMobile?"60px 20px":"120px 32px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", textAlign:"center" }}>
          <Tag>get started</Tag>
          <h2 style={{ fontSize:"clamp(38px,6vw,82px)", fontWeight:300, color:"var(--text)", fontFamily:"'Inter',sans-serif", letterSpacing:"-0.02em", margin:"24px 0 16px", lineHeight:1.0,
            opacity:ctaVis?1:0, transform:ctaVis?"none":"translateY(20px)", transition:"opacity .8s, transform .8s" }}>
            <span className="shimmer-text">Check your</span><br/><span className="shimmer-accent">score now.</span>
          </h2>
          <p style={{ fontSize:13, color:"var(--text)", opacity:.6, lineHeight:1.9, maxWidth:380, marginBottom:48, margin:"0 auto 48px", opacity:ctaVis?0.6:0, transition:"opacity .8s .15s" }}>
            Built natively on Rialo. No signup. No email. Just connect your wallet — your onchain history does the rest.
          </p>
          <button onClick={onLaunch} style={{ padding:"18px 60px", background:"var(--text)", color:"var(--bg)", fontWeight:800, fontSize:14, border:"none", cursor:"pointer", letterSpacing:".15em", fontFamily:"'Inter',sans-serif", borderRadius:4, transition:"all .15s",
            opacity:ctaVis?1:0, transition:"opacity .8s .3s, background .15s" }}
            onMouseEnter={e=>e.currentTarget.style.background="var(--btn-hover)"} onMouseLeave={e=>e.currentTarget.style.background="var(--text)"}>
            LAUNCH APP →
          </button>
          <div style={{ marginTop:20, fontSize:10, color:"var(--text)", opacity:.3, letterSpacing:".1em" }}>CONNECT · COMPUTE · EARN</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:"1px solid var(--border)", padding:"24px 32px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
          <Logo size={14}/>
          <div className="footer-links" style={{ display:"flex", alignItems:"center", gap:20 }}>
            {["@VolundHQ","Discord","Docs","Build"].map(l=>(
              <span key={l} style={{ fontSize:10, color:"var(--text)", opacity:.4, fontFamily:"'Inter',sans-serif", letterSpacing:".08em", cursor:"pointer" }}>{l}</span>
            ))}
            {canInstall && (
               <button onClick={onInstall} style={{ padding:"4px 12px", background:"rgba(169,221,211,0.1)", border:"1px solid var(--accent)", color:"var(--accent)", borderRadius:4, cursor:"pointer", fontSize:10, fontWeight:700, fontFamily:"'Inter',sans-serif" }}>INSTALL APP</button>
            )}
          </div>
          <span style={{ fontSize:9, color:"var(--text)", opacity:.2, fontFamily:"'Inter',sans-serif", letterSpacing:".1em" }}>RRS · DEVNET</span>
        </div>
      </footer>
    </div>
  );
}
