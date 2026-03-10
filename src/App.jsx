import { useState, useEffect } from "react";
import ErrorBoundary from "./ErrorBoundary";
import { usePWAInstall } from "./hooks/usePWAInstall";
import Landing from "./pages/Landing";
import ScoreApp from "./pages/ScoreApp";
import Docs from "./pages/Docs";

// ── Global CSS ────────────────────────────────────────────────────────────────

const CSS = `
  :root {
    --bg: #000;
    --text: #e8e3d5;
    --text-dim: rgba(232,227,213,0.7);
    --border: rgba(232,227,213,0.15);
    --card-bg: rgba(255,255,255,0.015);
    --accent: #a9ddd3;
    --accent-glow: rgba(169,221,211,0.05);
    --nav-bg: rgba(0,0,0,0.96);
    --shimmer-1: var(--text);
    --shimmer-2: #ffffff;
    --btn-hover: #ffffff;
    --logo-filter: none;
    --particle-color: rgba(232,227,213,0.25);
  }
  [data-theme="light"] {
    --bg: #f7f5f0;
    --text: #1a1a1a;
    --text-dim: rgba(26,26,26,0.6);
    --border: rgba(26,26,26,0.1);
    --card-bg: rgba(0,0,0,0.02);
    --accent: #6eb7a9;
    --accent-glow: rgba(110,183,169,0.05);
    --nav-bg: rgba(247,245,240,0.96);
    --shimmer-1: #1a1a1a;
    --shimmer-2: #333333;
    --btn-hover: #333333;
    --logo-filter: invert(1);
    --particle-color: rgba(110,183,169,0.3);
  }
  
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  body{background:var(--bg);color:var(--text);position:relative;overflow-x:hidden;}
  body::before {
    content: "";
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0.025;
    z-index: 9999;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    filter: brightness(var(--bg-invert, 1));
  }
  [data-theme="light"] { --bg-invert: 0.1; }
  body::after {
    content: "";
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    background: 
      radial-gradient(circle at 20% 30%, var(--accent-glow) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(232,227,213,0.02) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, var(--bg) 0%, var(--bg) 100%);
    z-index: -2;
    pointer-events: none;
  }
  @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes loading-bar{0%{width:10px;opacity:.3}50%{width:80px;opacity:1}100%{width:10px;opacity:.3}}
  @keyframes fade-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
  @keyframes fade-in{from{opacity:0}to{opacity:1}}
  @keyframes float-particle {
    0% { transform: translateY(0) translateX(0); opacity: 0; }
    10% { opacity: 0.5; }
    90% { opacity: 0.5; }
    100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
  }
  @keyframes board-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  .shimmer-text{
    background: linear-gradient(90deg, var(--shimmer-1) 0%, var(--shimmer-1) 35%, var(--shimmer-2) 50%, var(--shimmer-1) 65%, var(--shimmer-1) 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 4s linear infinite;
  }
  .shimmer-accent{
    background: linear-gradient(90deg, var(--accent) 0%, var(--accent) 35%, var(--shimmer-2) 50%, var(--accent) 65%, var(--accent) 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 4s linear infinite;
  }
  @keyframes ring-glow{0%,100%{filter:drop-shadow(0 0 4px rgba(232,227,213,0.2))}50%{filter:drop-shadow(0 0 12px rgba(232,227,213,0.5))}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  .animate-fade-up{animation:fade-up .6s ease both}
  .badge-card-claimed:hover{animation:float 2s ease-in-out infinite!important;}
  @keyframes sparkle-1{0%,100%{opacity:0;transform:scale(0) rotate(0deg)}50%{opacity:1;transform:scale(1) rotate(180deg)}}
  @keyframes sparkle-2{0%,100%{opacity:0;transform:scale(0) rotate(45deg)}40%{opacity:1;transform:scale(1.2) rotate(225deg)}}
  @keyframes sparkle-3{0%,100%{opacity:0;transform:scale(0)}60%{opacity:1;transform:scale(0.8)}}
  @keyframes badge-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  .badge-sparkle{pointer-events:none;position:absolute;inset:0;overflow:hidden;}
  .badge-sparkle span{position:absolute;width:4px;height:4px;border-radius:50%;pointer-events:none;}
  .sp1{top:12%;left:15%;animation:sparkle-1 2.2s 0s ease-in-out infinite;}
  .sp2{top:8%;right:18%;animation:sparkle-2 2.5s .3s ease-in-out infinite;}
  .sp3{top:25%;right:10%;animation:sparkle-1 1.8s .6s ease-in-out infinite;}
  .sp4{bottom:20%;left:8%;animation:sparkle-3 2.0s .9s ease-in-out infinite;}
  .sp5{bottom:15%;right:15%;animation:sparkle-2 2.3s .4s ease-in-out infinite;}
  .sp6{top:50%;left:5%;animation:sparkle-1 1.9s 1.1s ease-in-out infinite;}
  .sp7{top:35%;right:5%;animation:sparkle-3 2.4s .7s ease-in-out infinite;}
  .badge-img-glow{transition:filter .3s;}
  .badge-card-active:hover .badge-img-glow{filter:drop-shadow(0 0 8px currentColor) brightness(1.15);}
  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-track{background:var(--bg);}
  ::-webkit-scrollbar-thumb{background:var(--border);}
  .feat-card{background:var(--card-bg);border:1px solid var(--border);border-radius:12px;transition:all .4s cubic-bezier(0.23, 1, 0.32, 1);cursor:default;position:relative;overflow:hidden;}
  .feat-card:hover{background:var(--card-bg) !important;border-color:var(--accent) !important;transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.1), 0 0 20px var(--accent-glow);}
  .feat-card::before {
    content: '';
    position: absolute;
    top: 0; left: -150%;
    width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, var(--accent-glow), transparent);
    transform: skewX(-25deg);
    transition: left 0.75s cubic-bezier(0.23, 1, 0.32, 1);
    z-index: 1;
  }
  .feat-card:hover::before { left: 150%; }
  .feat-card * { position: relative; z-index: 2; }
  @media(max-width:639px){
    .nav-links{display:none!important;}
    .hero-grid{grid-template-columns:1fr!important;}
    .feat-grid{grid-template-columns:1fr!important;gap:0!important;}
    .badge-stats{grid-template-columns:repeat(2,1fr)!important;}
    .badge-docs{grid-template-columns:1fr!important;}
    .score-panel{flex-direction:column!important;align-items:center!important;}
    .footer-links{display:none!important;}
  }
  .wallet-id-card { cursor: pointer; }
  .wallet-id-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.4), 0 0 8px rgba(169,221,211,0.08); }
`;

// ── Root Router ───────────────────────────────────────────────────────────────

export default function Root() {
  const [view, setView] = useState("landing");
  const [fade, setFade] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  
  const go = to => { setFade(true); setTimeout(()=>{ setView(to); setFade(false); try{window.scrollTo(0,0);}catch(e){} },380); };
  
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

  const { canInstall, install } = usePWAInstall();

  return (
    <ErrorBoundary label="app">
      <style>{CSS}</style>
      <div style={{ opacity:fade?0:1, transition:"opacity .38s ease", background:"var(--bg)", color:"var(--text)", minHeight:"100vh" }}>
        <ErrorBoundary key="landing" label="landing page">
          {view==="landing" && <Landing onLaunch={()=>go("app")} onDocs={()=>go("docs")} canInstall={canInstall} onInstall={install} theme={theme} toggleTheme={toggleTheme} />}
        </ErrorBoundary>
        <ErrorBoundary key="app" label="score app">
          {view==="app"     && <ScoreApp onBack={()=>go("landing")} canInstall={canInstall} onInstall={install} theme={theme} toggleTheme={toggleTheme}  />}
        </ErrorBoundary>
        <ErrorBoundary key="docs" label="docs">
          {view==="docs"    && <Docs onBack={()=>go("landing")} theme={theme} toggleTheme={toggleTheme}/>}
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}
