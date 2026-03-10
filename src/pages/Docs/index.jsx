import { useState, useEffect } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import Logo from "../../components/Logo";
import ThemeToggle from "../../components/ThemeToggle";
import { BADGE_IMG } from "../../components/BadgeCard";

const DOCS_CSS = `
  /* ── Force dark mode on the docs page ── */
  .docs-root {
    --bg:       #0a0a0a;
    --bg1:      #111111;
    --bg2:      #181818;
    --border:   rgba(232,227,213,0.1);
    --border-hi:rgba(232,227,213,0.18);
    --text:     #e8e3d5;
    --text-dim: rgba(232,227,213,0.6);
    --accent:   #a9ddd3;
  }
  .docs-root *{box-sizing:border-box;}
  .docs-root a{color:var(--accent);text-decoration:none;}
  .docs-root a:hover{text-decoration:underline;}
  .layout{display:grid;grid-template-columns:220px 1fr;min-height:100vh;}
  @media(max-width:768px){.layout{grid-template-columns:1fr;} .sidebar{display:none;}}
  .sidebar{position:sticky;top:0;height:100vh;overflow-y:auto;background:#0d0d0d;border-right:1px solid var(--border);padding:32px 0;}
  .sidebar-logo{padding:0 24px 28px;border-bottom:1px solid var(--border);margin-bottom:20px;}
  .logo-mark{display:block;font-size:14px;font-weight:700;color:#e8e3d5;letter-spacing:.05em;margin-bottom:4px;}
  .logo-sub{font-size:10px;color:rgba(232,227,213,0.4);letter-spacing:.1em;}
  .nav-section{padding:0 16px;margin-bottom:16px;}
  .nav-section-label{font-size:9px;color:rgba(232,227,213,0.3);letter-spacing:.2em;text-transform:uppercase;padding:0 8px;margin-bottom:6px;font-weight:700;}
  .nav-link{display:block;padding:7px 12px;border-radius:6px;font-size:12px;color:rgba(232,227,213,0.55);cursor:pointer;transition:all .15s;margin-bottom:1px;}
  .nav-link:hover{background:rgba(232,227,213,0.05);color:#e8e3d5;}
  .nav-link.active{background:rgba(169,221,211,0.08);color:#a9ddd3;font-weight:600;}
  .main{overflow-y:auto;}
  .topbar{position:sticky;top:0;z-index:10;background:rgba(10,10,10,0.9);backdrop-filter:blur(16px);border-bottom:1px solid var(--border);padding:14px 48px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;}
  .topbar-path{font-size:11px;color:rgba(232,227,213,0.4);letter-spacing:.05em;flex:1;text-align:center;}
  .topbar-path span{color:rgba(232,227,213,0.7);}
  .topbar-badge{font-size:9px;color:rgba(169,221,211,0.6);border:1px solid rgba(169,221,211,0.2);border-radius:4px;padding:3px 10px;letter-spacing:.12em;font-weight:700;}
  .content{padding:48px;max-width:800px;}
  @media(max-width:768px){.content{padding:24px;}}
  .section{margin-bottom:72px;opacity:0;transform:translateY(16px);transition:opacity .6s ease, transform .6s ease;}
  .section.visible{opacity:1;transform:none;}
  .section-tag{font-size:10px;color:rgba(169,221,211,.6);letter-spacing:.2em;text-transform:uppercase;font-weight:700;margin-bottom:14px;}
  h1{font-size:clamp(28px,4vw,44px);font-weight:300;letter-spacing:-.02em;line-height:1.1;margin-bottom:20px;color:#e8e3d5;}
  h2{font-size:clamp(22px,3vw,34px);font-weight:300;letter-spacing:-.02em;line-height:1.15;margin-bottom:20px;color:#e8e3d5;}
  h3{font-size:18px;font-weight:500;letter-spacing:-.01em;margin-bottom:16px;color:#e8e3d5;}
  p{font-size:14px;line-height:1.9;color:rgba(232,227,213,0.7);margin-bottom:16px;}
  .lead{font-size:16px;line-height:1.8;color:rgba(232,227,213,0.75);}
  code{font-family:'Space Mono',monospace;font-size:11px;background:rgba(169,221,211,0.07);color:#a9ddd3;padding:2px 6px;border-radius:4px;border:1px solid rgba(169,221,211,0.12);}
  pre{background:#0d0d0d;border:1px solid var(--border);border-radius:10px;padding:20px 24px;margin:20px 0;overflow-x:auto;}
  pre code{background:none;border:none;padding:0;font-size:12px;line-height:2;color:rgba(232,227,213,0.7);}
  .callout{background:rgba(169,221,211,0.05);border:1px solid rgba(169,221,211,0.15);border-left:3px solid #a9ddd3;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;font-size:13px;color:rgba(232,227,213,0.75);line-height:1.7;}
  .callout strong{color:#a9ddd3;}
  hr{border:none;border-top:1px solid var(--border);margin:48px 0;}
  .score-formula{background:#0d0d0d;border:1px solid var(--border);border-radius:12px;overflow:hidden;margin:20px 0;}
  .formula-row{display:grid;grid-template-columns:1fr 1fr 80px;gap:16px;padding:14px 20px;border-bottom:1px solid var(--border);align-items:center;}
  .formula-row:last-child{border-bottom:none;}
  .formula-label{font-size:13px;font-weight:500;color:#e8e3d5;}
  .formula-detail{font-size:11px;color:rgba(232,227,213,0.45);}
  .formula-max{font-size:12px;color:#a9ddd3;font-weight:700;text-align:right;}
  .tier-table{margin:20px 0;}
  .tier-row{display:grid;grid-template-columns:140px 100px 1fr;gap:16px;padding:14px 0;border-bottom:1px solid var(--border);align-items:center;}
  .tier-name{font-size:14px;font-weight:700;}
  .badge-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin:20px 0;}
  .badge-card{padding:16px;border-radius:10px;border:1px solid var(--border);background:#0d0d0d;transition:border-color .2s;}
  .badge-card:hover{border-color:var(--border-hi);}
  .badge-card img{border-radius:8px;margin-bottom:10px;display:block;}
  .badge-rarity{display:inline-block;font-size:8px;letter-spacing:.15em;text-transform:uppercase;padding:2px 7px;border-radius:4px;border:1px solid;margin-bottom:8px;font-weight:700;}
  .badge-rarity.common{color:#c8b89a;border-color:rgba(200,184,154,.3);}
  .badge-rarity.rare{color:#b8d4f0;border-color:rgba(184,212,240,.3);}
  .badge-rarity.epic{color:#a9ddd3;border-color:rgba(169,221,211,.3);}
  .badge-rarity.legendary{color:#e8e3d5;border-color:rgba(232,227,213,.3);}
  .badge-name{font-size:13px;font-weight:600;color:#e8e3d5;margin-bottom:4px;}
  .badge-req{font-size:10px;color:rgba(232,227,213,0.4);margin-bottom:3px;}
  .badge-ttl{font-size:9px;color:rgba(169,221,211,0.5);letter-spacing:.08em;}
  .shimmer{background:linear-gradient(90deg,#e8e3d5 35%,#fff 50%,#e8e3d5 65%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 4s linear infinite;}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-track{background:#0a0a0a;}
  ::-webkit-scrollbar-thumb{background:rgba(232,227,213,0.1);}
`;


export default function Docs({ onBack, theme, toggleTheme }) {
  const { isMobile } = useBreakpoint();

  useEffect(() => {
    // Scroll spy & section reveal
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.docs-nav-link');

    const revealObs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.08 });
    sections.forEach(s => revealObs.observe(s));

    const spyObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          navLinks.forEach(l => l.classList.remove('active'));
          const a = document.querySelector(`.docs-nav-link[href="#${e.target.id}"]`);
          if (a) a.classList.add('active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(s => spyObs.observe(s));

    return () => { revealObs.disconnect(); spyObs.disconnect(); };
  }, []);

  return (
    <div className="docs-root" style={{ fontFamily:"'Inter',sans-serif", background:"#0a0a0a", color:"#e8e3d5", minHeight:"100vh" }}>
      <style>{DOCS_CSS}</style>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <span className="logo-mark">Volund</span>
            <span className="logo-sub">RRS · Documentation</span>
          </div>
          <div className="nav-section">
            <div className="nav-section-label">Getting Started</div>
            <a href="#overview"  className="nav-link docs-nav-link active">Overview</a>
            <a href="#how"       className="nav-link docs-nav-link">How it works</a>
            <a href="#tiers"     className="nav-link docs-nav-link">Score tiers</a>
          </div>
          <div className="nav-section">
            <div className="nav-section-label">Score System</div>
            <a href="#score-intro" className="nav-link docs-nav-link">Overview</a>
            <a href="#onchain"     className="nav-link docs-nav-link">Onchain Activity</a>
            <a href="#defi"        className="nav-link docs-nav-link">DeFi Behavior</a>
            <a href="#identity"    className="nav-link docs-nav-link">Identity & Trust</a>
            <a href="#realworld"   className="nav-link docs-nav-link">Real-World Credit</a>
            <a href="#community"   className="nav-link docs-nav-link">Community</a>
          </div>
          <div className="nav-section">
            <div className="nav-section-label">Badge System</div>
            <a href="#badges-overview" className="nav-link docs-nav-link">Overview</a>
            <a href="#rarity"          className="nav-link docs-nav-link">Rarity tiers</a>
            <a href="#ttl"             className="nav-link docs-nav-link">TTL & expiry</a>
            <a href="#claim"           className="nav-link docs-nav-link">Claiming badges</a>
            <a href="#all-badges"      className="nav-link docs-nav-link">All badges</a>
          </div>
        </aside>
        <main className="main">
          <div className="topbar">
            <button onClick={onBack} style={{
              padding:"6px 14px", background:"transparent",
              border:"1px solid var(--border)", color:"var(--text)",
              fontSize:10, fontFamily:"'Inter',sans-serif", letterSpacing:".1em",
              cursor:"pointer", borderRadius:4, transition:"all .15s"
            }}>← BACK</button>
            <div className="topbar-path">docs / <span>volund-rrs</span></div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <ThemeToggle theme={theme} toggle={toggleTheme}/>
              <div className="topbar-badge">DEVNET · Base Sepolia</div>
            </div>
          </div>
          <div className="content">

            <section className="section" id="overview">
              <div className="section-tag">01 · Overview</div>
              <h1><span className="shimmer">Volund Reputation Score</span></h1>
              <p className="lead">Volund RRS is the native reputation layer for the Rialo ecosystem — turning your entire onchain history into a single verifiable score from 0 to 1000. No signup, no email, no middlemen. Just connect your wallet.</p>
              <p>Built on Base Sepolia, Volund RRS aggregates five distinct signal categories to produce a composite reputation score. Scores are non-permanent — they decay over time and must be actively maintained through onchain behavior.</p>
              <div className="callout"><strong>Note:</strong> Volund RRS is currently deployed on Base Sepolia. Full integration with Rialo mainnet is planned for a future release.</div>
              <h3>Why Rialo needs a reputation layer?</h3>
              <p>Rialo enables real-world data to live natively onchain — but without a reputation layer, that data has no context. Volund RRS provides the trust infrastructure: a transparent, composable score that any Rialo-connected protocol can query natively, without oracles or middleware.</p>
              <pre dangerouslySetInnerHTML={{__html: `<code style={{fontFamily:"monospace",fontSize:11,lineHeight:2,color:"rgba(232,227,213,0.7)"}}>// Query any wallet's score
const score = await volundRRS.getScore("0xWallet");
// → { total: 742, tier: "Reputable", ecosystem: "rialo" }</code>`}}/>
            </section>

            <section className="section" id="how">
              <div className="section-tag">02 · How it works</div>
              <h2>Four steps. Zero middleware.</h2>
              <p>VRS is computed entirely from public onchain data and Rialo signals. No KYC, no data brokers, no intermediaries — just transparent, verifiable reputation.</p>
              <div className="score-formula">
                {["01 · Connect Wallet","02 · Compute Score","03 · Earn Badges","04 · Unlock Benefits"].map((s,i)=>(
                  <div key={i} className="formula-row" style={{background:i===0?"rgba(232,227,213,0.02)":"transparent"}}>
                    <div className="formula-label">{s}</div>
                    <div className="formula-detail">{["MetaMask or injected · Base Sepolia","Balance · tx count · age · DeFi · identity","Score thresholds unlock soulbound badges (TTL 30–90d)","DeFi rates · DAO voting · early access"][i]}</div>
                    <div className="formula-max" style={{color:"rgba(232,227,213,0.4)"}}>→</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="section" id="tiers">
              <div className="section-tag">03 · Score tiers</div>
              <h2>Score tiers</h2>
              <p>Every wallet falls into one of five tiers based on their total VRS score.</p>
              <div className="tier-table">
                {[["Elite","900–1000","var(--text)","Top tier. Maximum DeFi privileges, Legendary badge eligibility."],
                  ["Reputable","700–899","#a9ddd3","Strong history. Epic badge eligibility. Preferred DeFi rates."],
                  ["Established","500–699","#b8d4f0","Growing reputation. Rare badge eligibility."],
                  ["Newcomer","200–499","#c8b89a","Early stage. Common badges available."],
                  ["Unknown","0–199","var(--border)","Insufficient onchain history."]
                ].map(([name,range,color,desc])=>(
                  <div key={name} className="tier-row">
                    <div className="tier-name" style={{color}}>{name}</div>
                    <div style={{color:"#a9ddd3",fontSize:11}}>{range}</div>
                    <div style={{color:"rgba(232,227,213,0.45)",fontSize:11}}>{desc}</div>
                  </div>
                ))}
              </div>
            </section>

            <hr/>

            <section className="section" id="score-intro">
              <div className="section-tag">04 · Score system</div>
              <h2>How the score is calculated</h2>
              <p>VRS is composed of five weighted categories. Each has a maximum contribution to the total score of 1000.</p>
              <pre dangerouslySetInnerHTML={{__html: `<code style={{fontFamily:"monospace",fontSize:11,lineHeight:2,color:"rgba(232,227,213,0.7)"}}>// Score formula
total = onchain(300) + defi(250) + identity(200) + realworld(150) + community(100)
total = Math.min(total, 1000)</code>`}}/>
              <div className="score-formula">
                {[["⛓","Onchain Activity","tx count · wallet age · ETH balance",300],
                  ["↗","DeFi Behavior","protocol interactions · repayment history",250],
                  ["◈","Identity & Trust","ENS · GitHub · Twitter/X",200],
                  ["◎","Real-World Credit","Rialo · coming soon",150],
                  ["◇","Community","DAO participation · coming soon",100]
                ].map(([icon,label,detail,max])=>(
                  <div key={label} className="formula-row">
                    <div className="formula-label"><span style={{opacity:.5}}>{icon}</span> {label}</div>
                    <div className="formula-detail">{detail}</div>
                    <div className="formula-max">{max}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="section" id="onchain">
              <h3>Onchain Activity <code style={{float:"right",fontSize:11}}>max 300</code></h3>
              <p>The foundation of your score. Measures raw onchain participation.</p>
              <pre dangerouslySetInnerHTML={{__html: `<code style={{fontFamily:"monospace",fontSize:11,lineHeight:2,color:"rgba(232,227,213,0.7)"}}>txPts   = Math.min(txCount x 0.4, 180)\nagePts  = Math.min(walletAgeMo x 4, 90)\nbalPts  = Math.min(log10(eth + 0.01) x 15 + 20, 30)\nonchain = Math.min(txPts + agePts + balPts, 300)</code>`}}/>
            </section>

            <section className="section" id="defi">
              <h3>DeFi Behavior <code style={{float:"right",fontSize:11}}>max 250</code></h3>
              <p>Estimated from transaction patterns. Full DeFi analysis coming soon.</p>
              <pre dangerouslySetInnerHTML={{__html: `<code style={{fontFamily:"monospace",fontSize:11,lineHeight:2,color:"rgba(232,227,213,0.7)"}}>defi = Math.min(txCount x 0.08, 160)\n// Future: liquidations, repayment rate, protocol diversity</code>`}}/>
            </section>

            <section className="section" id="identity">
              <h3>Identity & Trust <code style={{float:"right",fontSize:11}}>max 200</code></h3>
              <p>Link verifiable identities to prove you're a real, trusted participant.</p>
              <div className="score-formula">
                {[["Base","Connected wallet","+40"],["ENS Name","Registered ENS on this wallet","+40"],["GitHub","OAuth-verified GitHub account","+60"],["Twitter / X","OAuth-verified Twitter account","+30"]].map(([label,detail,max])=>(
                  <div key={label} className="formula-row">
                    <div className="formula-label">{label}</div>
                    <div className="formula-detail">{detail}</div>
                    <div className="formula-max">{max}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="section" id="realworld">
              <h3>Real-World Credit <code style={{float:"right",fontSize:11}}>max 150</code></h3>
              <p>Rialo makes Volund the first reputation system to incorporate real-world credit signals natively onchain — without a single oracle or middleware layer.</p>
              <div className="callout"><strong>Coming with Rialo mainnet:</strong> Traditional credit signals bridged natively onchain through Rialo using threshold MPC — zero data exposure, full privacy preservation.</div>
            </section>

            <section className="section" id="community">
              <h3>Community <code style={{float:"right",fontSize:11}}>max 100</code></h3>
              <p>DAO participation, governance voting, and community contributions.</p>
              <pre dangerouslySetInnerHTML={{__html: `<code style={{fontFamily:"monospace",fontSize:11,lineHeight:2,color:"rgba(232,227,213,0.7)"}}>community = Math.min(walletAgeMo x 0.8, 60)\n// Future: DAO votes, governance activity</code>`}}/>
            </section>

            <hr/>

            <section className="section" id="badges-overview">
              <div className="section-tag">05 · Badge system</div>
              <h2>Badges expire. Keep earning.</h2>
              <p className="lead">Volund badges are soulbound NFTs that represent your standing in the Rialo ecosystem. Unlike static NFTs, they carry a TTL — your reputation must be actively maintained to keep them alive.</p>
              <div className="callout"><strong>Soulbound:</strong> No <code>transferFrom</code> function exists. Badges cannot be sold, traded, or moved under any circumstances.</div>
            </section>

            <section className="section" id="rarity">
              <h3>Rarity tiers</h3>
              <div className="score-formula">
                {[["◆ Common","Score ≥ 0 · available to all wallets","TTL 30d","#c8b89a"],
                  ["◆ Rare","Score ≥ 500 · Established tier and above","TTL 45d","#b8d4f0"],
                  ["◆ Epic","Score ≥ 700 · Reputable tier and above","TTL 60d","#a9ddd3"],
                  ["◆ Legendary","Score ≥ 900 · Elite tier only","TTL 90d","var(--text)"]
                ].map(([label,detail,max,color])=>(
                  <div key={label} className="formula-row">
                    <div className="formula-label" style={{color}}>{label}</div>
                    <div className="formula-detail">{detail}</div>
                    <div className="formula-max" style={{color}}>{max}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="section" id="ttl">
              <h3>TTL & expiry</h3>
              <p>Every badge has an <code>expiresAt</code> timestamp. Once expired, the badge is inactive and must be re-claimed.</p>
              <pre dangerouslySetInnerHTML={{__html: `<code style={{fontFamily:"monospace",fontSize:11,lineHeight:2,color:"rgba(232,227,213,0.7)"}}>[UNCLAIMED]  --&gt;  claimBadge()  --&gt;  [ACTIVE]\n[ACTIVE]     --&gt;  TTL expired   --&gt;  [EXPIRED]\n[ACTIVE]     --&gt;  claimBadge()  --&gt;  [RENEWED]  // resets timer\n[EXPIRED]    --&gt;  claimBadge()  --&gt;  [ACTIVE]   // re-mint</code>`}}/>
            </section>

            <section className="section" id="claim">
              <h3>Claiming badges</h3>
              <p>Badge claims are backend-verified. The server independently computes your score, then issues an ECDSA signature your wallet submits to the contract.</p>
              <pre dangerouslySetInnerHTML={{__html: `<code style={{fontFamily:"monospace",fontSize:11,lineHeight:2,color:"rgba(232,227,213,0.7)"}}>// 1. Request signature\nPOST /api/badge/sign  &#123;address, badgeId&#125;\n\n// 2. Backend returns\n&#123;signature, score, nonce&#125;\n\n// 3. Contract call\ncontract.claimBadge(badgeId, score, signature)</code>`}}/>
              <div className="callout"><strong>Anti-replay:</strong> Each claim increments the wallet's nonce on-contract. Signatures cannot be reused.</div>
            </section>

            <section className="section" id="all-badges">
              <h3>All badges</h3>
              <div className="badge-grid">
                {[
                  {id:"b1",name:"First Steps",rarity:"common",min:0,ttl:30},
                  {id:"b2",name:"Early Mover",rarity:"common",min:0,ttl:30},
                  {id:"b3",name:"Trusted Agent",rarity:"rare",min:500,ttl:45},
                  {id:"b4",name:"DeFi Dabbler",rarity:"rare",min:500,ttl:45},
                  {id:"b5",name:"Chain Veteran",rarity:"epic",min:700,ttl:60},
                  {id:"b6",name:"Rialo Pioneer",rarity:"epic",min:700,ttl:60},
                  {id:"b7",name:"Score Crusher",rarity:"epic",min:700,ttl:60},
                  {id:"b8",name:"Onchain Legend",rarity:"legendary",min:900,ttl:90},
                  {id:"b9",name:"Rialo OG",rarity:"legendary",min:900,ttl:90},
                ].map(b=>(
                  <div key={b.id} className={`badge-card ${b.rarity}`}>
                    {BADGE_IMG[b.id] && <img src={BADGE_IMG[b.id]} width={40} height={40} style={{marginBottom:10,display:"block"}} alt={b.name}/>}
                    <span className={`badge-rarity ${b.rarity}`}>{b.rarity}</span>
                    <div className="badge-name">{b.name}</div>
                    <div className="badge-req">Score ≥ {b.min}</div>
                    <div className="badge-ttl">ttl · {b.ttl}d</div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}

// ── root ──────────────────────────────────────────────────────────────────────

