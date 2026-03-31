import { useMemo } from "react";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { useTheme } from "../context/ThemeContext";

export default function Grid() {
  const { w, isMobile } = useBreakpoint();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const particles = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * -20,
      dur: 20 + Math.random() * 40,
      size: 0.5 + Math.random() * 2.5,
      opacity: isDark ? 0.1 + Math.random() * 0.4 : 0.05 + Math.random() * 0.2,
    }));
  }, [isDark]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden", background: "transparent", transition: "background 0.4s ease" }}>
      {/* Base Noise Layer */}
      <div style={{ position: "absolute", inset: 0, opacity: isDark ? 0.012 : 0.006, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, transition: "opacity 0.4s" }}/>
      
      {/* Structural Ambient Glows (Static) */}
      <div style={{ position: "absolute", top: "-10%", left: "10%", width: "80%", height: "40%", background: `radial-gradient(ellipse at center, ${isDark ? "rgba(154,230,212,0.03)" : "rgba(22,128,113,0.02)"} 0%, transparent 80%)`, filter: "blur(100px)", transition: "background 0.4s" }}/>
      <div style={{ position: "absolute", bottom: "0%", left: "50%", transform: "translateX(-50%)", width: "100%", height: "30%", background: `linear-gradient(to top, var(--border-subtle) 0%, transparent 100%)`, transition: "background 0.4s" }}/>

      {/* Technical Blueprint Grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(var(--border-subtle) 1px,transparent 1px),linear-gradient(90deg,var(--border-subtle) 1px,transparent 1px)`, backgroundSize: "80px 80px", backgroundPosition: "center center", opacity: isDark ? 0.4 : 0.2, transition: "opacity 0.4s" }}/>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(var(--border-subtle) 1px,transparent 1px),linear-gradient(90deg,var(--border-subtle) 1px,transparent 1px)`, backgroundSize: "400px 400px", backgroundPosition: "center center", opacity: isDark ? 0.8 : 0.4, transition: "opacity 0.4s" }}/>

      {/* Corner / Tech Marks */}
      {!isMobile && (
        <div style={{ position: "absolute", inset: 40, border: "1px solid var(--border-subtle)", pointerEvents: "none", opacity: isDark ? 1 : 0.5, transition: "all 0.4s" }}>
          <div style={{ position: "absolute", top: -1, left: -1, width: 20, height: 20, borderTop: "1px solid var(--border-strong)", borderLeft: "1px solid var(--border-strong)", opacity: 0.3 }}/>
          <div style={{ position: "absolute", top: -1, right: -1, width: 20, height: 20, borderTop: "1px solid var(--border-strong)", borderRight: "1px solid var(--border-strong)", opacity: 0.3 }}/>
          <div style={{ position: "absolute", bottom: -1, left: -1, width: 20, height: 20, borderBottom: "1px solid var(--border-strong)", borderLeft: "1px solid var(--border-strong)", opacity: 0.3 }}/>
          <div style={{ position: "absolute", bottom: -1, right: -1, width: 20, height: 20, borderBottom: "1px solid var(--border-strong)", borderRight: "1px solid var(--border-strong)", opacity: 0.3 }}/>
          
          <div style={{ position: "absolute", top: 10, left: 10, fontSize: 8, color: "var(--text-tertiary)", opacity: 0.3, fontFamily: "monospace", letterSpacing: "2px" }}>RRS_PROTO_DEVNET // 40.7128° N, 74.0060° W</div>
        </div>
      )}

      {/* Volumetric God Rays (Ultra-Subtle) */}
      {!isMobile && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: isDark ? 1 : 0.3, transition: "opacity 0.4s" }}>
          <div style={{
            position: "absolute", top: "-50%", left: "20%", width: "20%", height: "200%",
            background: "linear-gradient(to right, transparent, rgba(154,230,212,0.02), transparent)",
            transform: "rotate(35deg)", filter: "blur(120px)",
            animation: "shimmer 25s infinite linear alternate"
          }}/>
          <div style={{
            position: "absolute", top: "-50%", left: "60%", width: "15%", height: "200%",
            background: "linear-gradient(to right, transparent, rgba(232,227,213,0.015), transparent)",
            transform: "rotate(35deg)", filter: "blur(100px)",
            animation: "shimmer 35s infinite linear alternate-reverse"
          }}/>
        </div>
      )}

      {/* Technical Micro-Glitch Scanlines */}
      <div style={{ 
        position: "absolute", inset: 0, opacity: isDark ? 0.05 : 0.02, pointerEvents: "none", zIndex: 1,
        backgroundImage: `linear-gradient(transparent 50%, var(--border-subtle) 50%)`,
        backgroundSize: "100% 4px", animation: "tech-glitch 8s infinite steps(1)", transition: "opacity 0.4s"
      }}/>

      {/* Global Vignette */}
      <div style={{ 
        position: "absolute", inset: 0, 
        background: `radial-gradient(circle at center, transparent 30%, ${isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.04)"} 100%)`,
        transition: "background 0.4s ease"
      }}/>
    </div>
  );
}
