import { useState, useEffect } from "react";
import { RS } from "../constants";

export default function OnchainWrapped({ onClose, scoreVal, tier, onchainData, unlocked }) {
  const [slide, setSlide] = useState(0);
  const [progress, setProgress] = useState(0);

  const SLIDE_DURATION = 4000;

  const slides = [
    {
      title: "ONCHAIN JOURNEY",
      subtitle: "We analyzed your footprint on Base Sepolia...",
      content: <div style={{ fontSize: 64, animation: "pulse 2s infinite" }}>🌐</div>
    },
    {
      title: "VETERAN STATUS",
      subtitle: "You've been forging blocks for...",
      content: (
        <div>
          <div style={{ fontSize: 80, fontWeight: 800, color: "var(--accent)" }}>{onchainData?.walletAgeMo || 0}</div>
          <div style={{ fontSize: 16, letterSpacing: ".2em", opacity: 0.5 }}>MONTHS</div>
        </div>
      )
    },
    {
      title: "ACTIVITY",
      subtitle: "Total onchain transactions executed:",
      content: (
        <div>
          <div style={{ fontSize: 80, fontWeight: 800, color: "#eab308" }}>{onchainData?.txCount || 0}</div>
          <div style={{ fontSize: 16, letterSpacing: ".2em", opacity: 0.5 }}>TXs</div>
        </div>
      )
    },
    {
      title: "ACHIEVEMENTS",
      subtitle: "Badges claimed so far:",
      content: (
        <div>
          <div style={{ fontSize: 80, fontWeight: 800, color: "#a855f7" }}>{unlocked?.length || 0}</div>
          <div style={{ fontSize: 16, letterSpacing: ".2em", opacity: 0.5 }}>BADGES</div>
        </div>
      )
    },
    {
      title: "FINAL VERDICT",
      subtitle: `Your Volund Reputation Score is ${Math.round(scoreVal)}`,
      content: (
        <div>
          <div style={{ fontSize: 48, fontWeight: 800, color: RS[tier]?.color || "var(--accent)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 12 }}>{tier} TIER</div>
          <div style={{ fontSize: 12, opacity: 0.5 }}>You are in the top percentage of the network.</div>
          <button onClick={onClose} style={{ marginTop: 40, padding: "12px 32px", background: "var(--text)", color: "var(--bg)", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", letterSpacing: ".1em" }}>FINISH</button>
        </div>
      )
    }
  ];

  useEffect(() => {
    if (slide >= slides.length - 1) {
      setProgress(100);
      return; 
    }

    setProgress(0);
    let start = Date.now();
    let rAF;

    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = (elapsed / SLIDE_DURATION) * 100;
      if (pct >= 100) {
        setSlide(s => s + 1);
      } else {
        setProgress(pct);
        rAF = requestAnimationFrame(tick);
      }
    };

    rAF = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rAF);
  }, [slide]);

  const curr = slides[slide];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center",
      background: "#050505", color: "var(--text)", fontFamily: "'Inter', sans-serif"
    }}>
      {/* Background Effects */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.4, background: "radial-gradient(circle at 50% 50%, rgba(169,221,211,0.1) 0%, transparent 60%)" }} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.1, backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      
      {/* Container */}
      <div style={{ position: "relative", width: "100%", maxWidth: 400, height: "100%", maxHeight: 800, display: "flex", flexDirection: "column", padding: "24px", zIndex: 10 }}>
        
        {/* Progress Bars */}
        <div style={{ display: "flex", gap: 4, marginBottom: 40, marginTop: 20 }}>
          {slides.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ 
                height: "100%", 
                background: "var(--text)", 
                width: i < slide ? "100%" : i === slide ? `${progress}%` : "0%"
              }} />
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center", animation: "fade-up 0.5s ease" }} key={slide}>
          <div style={{ fontSize: 12, letterSpacing: ".3em", opacity: 0.5, marginBottom: 16 }}>{curr.title}</div>
          <div style={{ fontSize: 24, fontWeight: 300, lineHeight: 1.4, marginBottom: 60 }}>{curr.subtitle}</div>
          {curr.content}
        </div>

        {/* Navigation Overlays */}
        <div style={{ position: "absolute", inset: 0, display: "flex", zIndex: 20 }}>
          <div style={{ flex: 1, cursor: "pointer" }} onClick={() => slide > 0 && setSlide(s => s - 1)} />
          <div style={{ flex: 1, cursor: "pointer" }} onClick={() => slide < slides.length - 1 && setSlide(s => s + 1)} />
        </div>

        {/* Close Button */}
        <button onClick={onClose} style={{ position: "absolute", top: 32, right: 32, background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: 32, height: 32, borderRadius: 16, cursor: "pointer", zIndex: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      </div>
    </div>
  );
}
