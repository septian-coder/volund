import { useState, useEffect } from "react";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import Logo from "../../components/Logo";
import ThemeToggle from "../../components/ThemeToggle";
import { BADGE_IMG } from "../../components/BadgeCard";
import { useTheme } from "../../context/ThemeContext";

const DOCS_CSS = `
  .docs-root *{box-sizing:border-box;}
  .docs-root a{color:var(--accent);text-decoration:none;}
  .docs-root a:hover{text-decoration:underline;}
  .layout{display:grid;grid-template-columns:220px 1fr;min-height:100vh;}
  @media(max-width:768px){.layout{grid-template-columns:1fr;} .sidebar{display:none;}}
  .sidebar{position:sticky;top:0;height:100vh;overflow-y:auto;background:var(--bg-secondary);border-right:1px solid var(--border-subtle);padding:32px 0;}
  .sidebar-logo{padding:0 24px 28px;border-bottom:1px solid var(--border-subtle);margin-bottom:20px;}
  .logo-mark{display:block;font-size:14px;font-weight:700;color:var(--text-primary);letter-spacing:.05em;margin-bottom:4px;}
  .logo-sub{font-size:10px;color:var(--text-tertiary);letter-spacing:.1em;}
  .nav-section{padding:0 16px;margin-bottom:16px;}
  .nav-section-label{font-size:9px;color:var(--text-tertiary);letter-spacing:.2em;text-transform:uppercase;padding:0 8px;margin-bottom:6px;font-weight:700;opacity:0.6;}
  .nav-link{display:block;padding:7px 12px;border-radius:6px;font-size:12px;color:var(--text-secondary);cursor:pointer;transition:all .3s cubic-bezier(0.16,1,0.3,1);margin-bottom:1px;}
  .nav-link:hover{background:var(--accent-glow);color:var(--text-primary);transform:translateX(4px);}
  .nav-link.active{background:var(--accent-glow);color:var(--accent);font-weight:600;transform:translateX(4px);border-left:2px solid var(--accent);}
  .main{overflow-y:auto; background: var(--bg-primary);}
  .topbar{position:sticky;top:0;z-index:10;background:var(--bg-primary);backdrop-filter:blur(16px);border-bottom:1px solid var(--border-subtle);padding:14px 48px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap; opacity: 0.95;}
  .topbar-path{font-size:11px;color:var(--text-tertiary);letter-spacing:.05em;flex:1;text-align:center;}
  .topbar-path span{color:var(--text-secondary);}
  .topbar-badge{font-size:9px;color:var(--accent);border:1px solid var(--accent-border);border-radius:4px;padding:3px 10px;letter-spacing:.12em;font-weight:700;}
  .content{padding:48px;max-width:800px;}
  @media(max-width:768px){.content{padding:24px;}}
  .section{margin-bottom:72px;opacity:0;transform:translateY(24px);transition:opacity .8s cubic-bezier(0.16,1,0.3,1), transform .8s cubic-bezier(0.16,1,0.3,1);}
  .section.visible{opacity:1;transform:none;}
  .section-tag{font-size:10px;color:var(--accent);letter-spacing:.2em;text-transform:uppercase;font-weight:700;margin-bottom:14px;opacity:0.8;}
  h1{font-size:clamp(28px,4vw,44px);font-weight:300;letter-spacing:-.02em;line-height:1.1;margin-bottom:20px;color:var(--text-primary);}
  h2{font-size:clamp(22px,3vw,34px);font-weight:300;letter-spacing:-.02em;line-height:1.15;margin-bottom:20px;color:var(--text-primary);}
  h3{font-size:18px;font-weight:500;letter-spacing:-.01em;margin-bottom:16px;color:var(--text-primary);border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;}
  p{font-size:14px;line-height:1.9;color:var(--text-secondary);margin-bottom:16px;}
  .lead{font-size:16px;line-height:1.8;color:var(--text-primary);opacity:0.9;}
  code{font-family:'Space Mono',monospace;font-size:11px;background:var(--accent-glow);color:var(--accent);padding:2px 6px;border-radius:4px;border:1px solid var(--accent-border);}
  pre{background:var(--bg-secondary);border:1px solid var(--border-subtle);border-radius:10px;padding:20px 24px;margin:20px 0;overflow-x:auto;}
  pre code{background:none;border:none;padding:0;font-size:12px;line-height:2;color:var(--text-secondary);}
  .callout{background:var(--accent-glow);border:1px solid var(--accent-border);border-left:3px solid var(--accent);border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;font-size:13px;color:var(--text-secondary);line-height:1.7;transition:border-left-width 0.3s ease;}
  .callout:hover{border-left-width:5px;}
  .callout strong{color:var(--accent);}
  hr{border:none;border-top:1px solid var(--border-subtle);margin:48px 0;}
  .score-formula{background:var(--bg-secondary);border:1px solid var(--border-subtle);border-radius:12px;overflow:hidden;margin:20px 0;}
  .formula-row{display:grid;grid-template-columns:1fr 1fr 80px;gap:16px;padding:14px 20px;border-bottom:1px solid var(--border-subtle);align-items:center;}
  .formula-row:last-child{border-bottom:none;}
  .formula-label{font-size:13px;font-weight:500;color:var(--text-primary);}
  .formula-detail{font-size:11px;color:var(--text-tertiary);}
  .formula-max{font-size:12px;color:var(--accent);font-weight:700;text-align:right;}
  .tier-table{margin:20px 0;}
  .tier-row{display:grid;grid-template-columns:140px 100px 1fr;gap:16px;padding:14px 0;border-bottom:1px solid var(--border-subtle);align-items:center;}
  .tier-name{font-size:14px;font-weight:700;}
  .badge-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin:20px 0;}
  .badge-card{padding:16px;border-radius:10px;border:1px solid var(--border-subtle);background:var(--bg-secondary);transition:all .3s cubic-bezier(0.16,1,0.3,1);}
  .badge-card:hover{border-color:var(--accent-border);transform:translateY(-2px);box-shadow:0 8px 24px -8px rgba(0,0,0,0.2);}
  .badge-card img{border-radius:8px;margin-bottom:10px;display:block;}
  .badge-rarity{display:inline-block;font-size:8px;letter-spacing:.15em;text-transform:uppercase;padding:2px 7px;border-radius:4px;border:1px solid;margin-bottom:8px;font-weight:700;}
  .badge-rarity.common{color:var(--text-secondary);border-color:var(--border-subtle);}
  .badge-rarity.rare{color:var(--info);border-color:var(--info);}
  .badge-rarity.epic{color:var(--accent);border-color:var(--accent);}
  .badge-rarity.legendary{color:var(--text-primary);border-color:var(--text-secondary);}
  .badge-name{font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:4px;}
  .badge-req{font-size:10px;color:var(--text-tertiary);margin-bottom:3px;}
  .badge-ttl{font-size:9px;color:var(--accent);letter-spacing:.08em;opacity:0.75;}
  .shimmer{background:linear-gradient(90deg,var(--text-primary) 35%,var(--accent) 50%,var(--text-primary) 65%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;color:var(--text-primary);animation:shimmer 4s linear infinite;}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-track{background:var(--bg-primary);}
  ::-webkit-scrollbar-thumb{background:var(--border-subtle);border-radius: 4px;}
`;


export default function Docs({ onBack }) {
  const { isMobile } = useBreakpoint();
  const { theme } = useTheme();

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
    <div className="docs-root" style={{ fontFamily:"'Inter',sans-serif", background:"var(--bg-primary)", color:"var(--text-primary)", minHeight:"100vh" }}>
      <style>{DOCS_CSS}</style>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <span className="logo-mark">Volund</span>
            <span className="logo-sub">Documentation</span>
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
            <a href="#social-rep"  className="nav-link docs-nav-link">Social Reputation</a>
            <a href="#badges-rep"  className="nav-link docs-nav-link">Badge Achievements</a>
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
              border:"1px solid var(--border-subtle)", color: "var(--text-primary)",
              fontSize:10, fontFamily:"'Inter',sans-serif", letterSpacing:".1em",
              cursor:"pointer", borderRadius:4, transition:"all .15s"
            }}>← BACK</button>
            <div className="topbar-path" style={{color: "var(--text-tertiary)"}}>docs / <span style={{color: "var(--text-secondary)"}}>volund-rrs</span></div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <ThemeToggle />
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
              <pre dangerouslySetInnerHTML={{__html: `<code style="font-family:monospace;font-size:11px;line-height:2;color:var(--text-secondary)">// Query any wallet's score
const score = await volundRRS.getScore("0xWallet");
// → { total: 742, tier: "Volund", ecosystem: "rialo" }</code>`}}/>
            </section>

            <section className="section" id="how">
              <div className="section-tag">02 · How it works</div>
              <h2>Four steps. Zero middleware.</h2>
              <p>VRS is computed entirely from public onchain data and Rialo signals. No KYC, no data brokers, no intermediaries — just transparent, verifiable reputation.</p>
              <div className="score-formula">
                {["01 · Connect Wallet","02 · Compute Score","03 · Earn Badges","04 · Unlock Benefits"].map((s,i)=>(
                  <div key={i} className="formula-row" style={{background:i===0?"var(--accent-glow)":"transparent"}}>
                    <div className="formula-label">{s}</div>
                    <div className="formula-detail">{["MetaMask or injected · Base Sepolia","Balance · tx count · age · DeFi · identity","Score thresholds unlock soulbound badges (TTL 30–90d)","DeFi rates · DAO voting · early access"][i]}</div>
                    <div className="formula-max" style={{color:"var(--text-tertiary)"}}>→</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="section" id="tiers">
              <div className="section-tag">03 · Score tiers</div>
              <h2>Score tiers</h2>
              <p>Every wallet falls into one of seven tiers based on their total VRS score.</p>
              <div className="tier-table">
                {[["Volund","850–1000","var(--accent)","Top tier. Maximum DeFi privileges, Legendary badge eligibility."],
                  ["Diamond","700–849","var(--diamond)","Strong history. Epic badge eligibility. Preferred DeFi rates."],
                  ["Platinum","500–699","var(--platinum)","Growing reputation. Rare badge eligibility."],
                  ["Gold","350–499","var(--gold)","Significant activity. Common badges available."],
                  ["Silver","200–349","var(--silver)","Early stage. Basic reputation."],
                  ["Bronze","100–199","var(--bronze)","Initial on-chain footprint."],
                  ["Unverified","0–99","var(--text-tertiary)","Insufficient history."]
                ].map(([name,range,color,desc])=>(
                  <div key={name} className="tier-row">
                    <div className="tier-name" style={{color}}>{name}</div>
                    <div style={{color:"var(--accent)",fontSize:11}}>{range}</div>
                    <div style={{color:"var(--text-tertiary)",fontSize:11}}>{desc}</div>
                  </div>
                ))}
              </div>
            </section>

            <hr/>

            <section className="section" id="score-intro">
              <div className="section-tag">04 · Score system</div>
              <h2>How the score is calculated</h2>
              <p>VRS is composed of five weighted categories. Each has a maximum contribution to the total score of 1000.</p>
              <pre dangerouslySetInnerHTML={{__html: `<code style="font-family:monospace;font-size:11px;line-height:2;color:var(--text-secondary)">// Score formula
total = onchain(200) + defi(200) + identity(250) + social(100) + badges(250)
total = Math.min(total, 1000)</code>`}}/>
              <div className="score-formula">
                {[["⛓","Onchain Activity","tx count · wallet age · ETH balance",200],
                  ["↗","DeFi Behavior","LP commitment · volume · repayment",200],
                  ["◈","Identity & Trust","PoH Level · links · Basename",250],
                  ["◎","Social Reputation","GitHub · Twitter · Discord",100],
                  ["◇","Badge Achievements","Cumulative rarity bonus",250]
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
              <h3>Onchain Activity <code style={{float:"right",fontSize:11}}>max 200</code></h3>
              <p>The foundation of your score. Measures raw onchain participation.</p>
              <pre dangerouslySetInnerHTML={{__html: `<code style="font-family:monospace;font-size:11px;line-height:2;color:var(--text-secondary)">txPts   = min(txCount x multiplier, 80)\nagePts  = min(walletAgeMo x factor, 50)\nbalPts  = min(balance score, 30)\nonchain = total(200)</code>`}}/>
            </section>

            <section className="section" id="defi">
              <h3>DeFi Behavior <code style={{float:"right",fontSize:11}}>max 200</code></h3>
              <p>Analyzed from LP positions and protocol interaction frequency.</p>
              <pre dangerouslySetInnerHTML={{__html: `<code style="font-family:monospace;font-size:11px;line-height:2;color:var(--text-secondary)">defi = min(LP_pts + Volume_pts + Frequency_pts, 200)</code>`}}/>
            </section>

            <section className="section" id="identity">
              <h3>Identity & Trust <code style={{float:"right",fontSize:11}}>max 250</code></h3>
              <p>Link verifiable identities to prove you're a real, trusted participant.</p>
              <div className="score-formula">
                {[["PoH Level","Proof of Humanity depth","+200"],["Basename","Registered Base name on this wallet","+30"],["Other Links","Verified platform connections","+20"]].map(([label,detail,max])=>(
                  <div key={label} className="formula-row">
                    <div className="formula-label">{label}</div>
                    <div className="formula-detail">{detail}</div>
                    <div className="formula-max">{max}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="section" id="social-rep">
              <h3>Social Reputation <code style={{float:"right",fontSize:11}}>max 100</code></h3>
              <p>Measures social influence and community trust across platforms like GitHub, Twitter/X, and Discord.</p>
               <div className="score-formula">
                {[["GitHub","Dev presence & age","+35"],["Twitter/X","Follower count & verification","+25"],["Discord","Membership & activity","+20"],["Other","Trust graph signals","+20"]].map(([label,detail,max])=>(
                  <div key={label} className="formula-row">
                    <div className="formula-label">{label}</div>
                    <div className="formula-detail">{detail}</div>
                    <div className="formula-max">{max}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="section" id="badges-rep">
              <h3>Badge Achievements <code style={{float:"right",fontSize:11}}>max 250</code></h3>
              <p>Cumulative reputation bonus earned from maintaining active Volund badges.</p>
              <div className="callout"><strong>Bonus stacking:</strong> Rarer badges provide significantly higher reputation multipliers and base points.</div>
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
                {[["◆ Common","Score ≥ 0 · Available to all","TTL 30d","var(--text-secondary)"],
                  ["◆ Rare","Score ≥ 500 · Platinum and above","TTL 45d","var(--info)"],
                  ["◆ Epic","Score ≥ 700 · Diamond and above","TTL 60d","var(--accent)"],
                  ["◆ Legendary","Score ≥ 850 · Volund tier only","TTL 90d","var(--text-primary)"]
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
              <pre dangerouslySetInnerHTML={{__html: `<code style="font-family:monospace;font-size:11px;line-height:2;color:var(--text-secondary)">[UNCLAIMED]  --&gt;  claimBadge()  --&gt;  [ACTIVE]\n[ACTIVE]     --&gt;  TTL expired   --&gt;  [EXPIRED]\n[ACTIVE]     --&gt;  claimBadge()  --&gt;  [RENEWED]  // resets timer\n[EXPIRED]    --&gt;  claimBadge()  --&gt;  [ACTIVE]   // re-mint</code>`}}/>
            </section>

            <section className="section" id="claim">
              <h3>Claiming badges</h3>
              <p>Badge claims are backend-verified. The server independently computes your score, then issues an ECDSA signature your wallet submits to the contract.</p>
              <pre dangerouslySetInnerHTML={{__html: `<code style="font-family:monospace;font-size:11px;line-height:2;color:var(--text-secondary)">// 1. Request signature\nPOST /api/badge/sign  {address, badgeId}\n\n// 2. Backend returns\n{signature, score, nonce}\n\n// 3. Contract call\ncontract.claimBadge(badgeId, score, signature)</code>`}}/>
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
                  {id:"b8",name:"Onchain Legend",rarity:"legendary",min:850,ttl:90},
                  {id:"b9",name:"Rialo OG",rarity:"legendary",min:850,ttl:90},
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
