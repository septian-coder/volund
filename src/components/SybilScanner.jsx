import { useState, useEffect } from "react";
import { useBreakpoint } from "../hooks/useBreakpoint";

export default function SybilScanner({ loadStep, wallet }) {
  const { isMobile } = useBreakpoint();
  const [progress, setProgress] = useState(0);
  const [sybilProb, setSybilProb] = useState(0);

  useEffect(() => {
    // Fake progress simulation
    const interval = setInterval(() => {
      setProgress(p => {
        if (p > 95) return p;
        return p + (Math.random() * 10);
      });
      setSybilProb(Math.random() * 5); // fluctuate sybil probability
    }, 150);

    return () => clearInterval(interval);
  }, []);

  const probColor = progress > 90 ? "#4ade80" : "var(--accent)";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, animation: "fade-in 0.5s ease" }}>
      <div style={{ position: "relative", width: 200, padding: "20px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
        {/* Scanning Laser */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0, height: 2,
          background: "var(--accent)",
          boxShadow: "0 0 10px var(--accent), 0 0 20px var(--accent)",
          animation: "scan 1.5s ease-in-out infinite alternate",
          zIndex: 10
        }} />

        <div style={{ fontSize: 9, letterSpacing: ".15em", color: "var(--text)", opacity: 0.5, marginBottom: 8, textAlign: "center", fontFamily: "monospace" }}>
          SYS.SCAN: {wallet?.slice(0, 12)}...
        </div>

        {/* Mock Hash Data Stream */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, fontFamily: "monospace", fontSize: 8, color: "var(--accent)", opacity: 0.7, height: 60, overflow: "hidden", maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ animation: `fade-up 0.5s ${i * 0.1}s infinite alternate` }}>
              0x{Math.random().toString(16).slice(2, 10)}...{Math.random().toString(16).slice(2, 10)}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
           <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, marginBottom: 4, fontFamily: "monospace" }}>
             <span style={{ opacity: 0.6 }}>SYBIL_PROBABILITY</span>
             <span style={{ color: probColor }}>{progress > 90 ? "0.8%" : `${sybilProb.toFixed(1)}%`}</span>
           </div>
           <div style={{ height: 2, background: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
             <div style={{ width: `${Math.min(100, progress)}%`, height: "100%", background: probColor, transition: "width 0.2s" }} />
           </div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: ".2em", opacity: 0.5, fontWeight: 600, marginBottom: 6 }}>
          {progress > 90 ? "COMPUTING FINAL SCORE" : "ANALYZING ONCHAIN FOOTPRINT"}
        </div>
        <div style={{ fontSize: 11, color: "var(--accent)", opacity: 0.8, fontFamily: "monospace" }}>{loadStep}</div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-10px); }
          100% { transform: translateY(160px); }
        }
      `}</style>
    </div>
  );
}
