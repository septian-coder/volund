import { useState, useEffect } from "react";
import ErrorBoundary from "./ErrorBoundary";
import { usePWAInstall } from "./hooks/usePWAInstall";
import Landing from "./pages/Landing";
import ScoreApp from "./pages/ScoreApp";
import Docs from "./pages/Docs";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { ReputationProvider } from "./context/ReputationProvider";
import "./styles/global.css";

// ── Root Router ───────────────────────────────────────────────────────────────

function Main() {
  const [view, setView] = useState("landing");
  const [fade, setFade] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { theme, toggleTheme } = useTheme();
  
  const go = to => { setFade(true); setTimeout(()=>{ setView(to); setFade(false); try{window.scrollTo(0,0);}catch(e){} },500); };
  
  const { canInstall, install } = usePWAInstall();

  // Scroll progress tracking
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? window.scrollY / totalHeight : 0;
      setScrollProgress(Math.min(progress, 1));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <ErrorBoundary label="app">
      {/* Scroll Progress Bar */}
      <div className="scroll-progress" style={{ transform: `scaleX(${scrollProgress})`, width: "100%" }}/>
      <div style={{ opacity:fade?0:1, filter: fade ? "blur(8px)" : "none", transition:"opacity .5s cubic-bezier(0.16,1,0.3,1), filter .5s cubic-bezier(0.16,1,0.3,1)", background:"var(--bg-primary)", color:"var(--text-primary)", minHeight:"100vh" }}>
        <ErrorBoundary key="landing" label="landing page">
          {view==="landing" && <Landing onLaunch={()=>go("app")} onDocs={()=>go("docs")} canInstall={canInstall} onInstall={install} />}
        </ErrorBoundary>
        <ErrorBoundary key="app" label="score app">
          {view==="app"     && <ScoreApp onBack={()=>go("landing")} canInstall={canInstall} onInstall={install}  />}
        </ErrorBoundary>
        <ErrorBoundary key="docs" label="docs">
          {view==="docs"    && <Docs onBack={()=>go("landing")}/>}
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ReputationProvider>
        <Main />
      </ReputationProvider>
    </ThemeProvider>
  );
}
