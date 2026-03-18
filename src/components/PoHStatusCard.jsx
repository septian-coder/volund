import { motion } from "framer-motion";

/**
 * PoHStatusCard
 * Visual levels (0-4), cap info, and upgrade CTA.
 */
export default function PoHStatusCard({ currentLevel, rawScore, cappedScore, onUpgrade }) {
  const caps = [300, 500, 650, 850, 1000];
  const currentCap = caps[currentLevel];
  const isCapped = rawScore > currentCap;
  const nextLevel = Math.min(currentLevel + 1, 4);
  const potentialUnlock = isCapped ? rawScore - currentCap : (caps[nextLevel] - currentCap);

  return (
    <div style={{
      padding: "24px",
      borderRadius: "20px",
      background: "var(--bg-elevated)",
      border: isCapped ? "1px solid #F5C842" : "1px solid var(--border-subtle)",
      display: "flex",
      flexDirection: "column",
      gap: 20,
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background Glow for high levels */}
      {currentLevel >= 4 && (
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 50% 50%, rgba(169, 221, 211, 0.1), transparent)",
          pointerEvents: "none"
        }} />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-secondary)", letterSpacing: "0.15em", marginBottom: 4 }}>
            PROOF OF HUMANITY
          </div>
          <div style={{ 
            fontSize: 20, 
            fontWeight: 700, 
            color: currentLevel === 4 ? "var(--accent)" : "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            Level {currentLevel}
            {currentLevel === 4 && (
              <span style={{ 
                fontSize: 9, 
                padding: "2px 8px", 
                background: "var(--accent)", 
                color: "#010101", 
                borderRadius: "4px",
                letterSpacing: "0.05em"
              }}>FULLY VERIFIED</span>
            )}
            {currentLevel === 3 && (
              <span style={{ color: "#6BE75F", fontSize: 14 }}>●</span>
            )}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: isCapped ? "#F5C842" : "var(--text-secondary)" }}>
            Cap: {currentCap} pts
          </div>
          <div style={{ fontSize: 10, opacity: 0.5 }}>Tier limit</div>
        </div>
      </div>

      {/* Progress Steps */}
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 6 }}>
          {[
            { level: 1, label: "Social" },
            { level: 2, label: "ENS" },
            { level: 3, label: "World ID" },
            { level: 4, label: "Vouching" }
          ].map(step => (
            <div key={step.level} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.05)", position: "relative" }}>
                {step.level <= currentLevel && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    style={{ 
                      height: "100%", 
                      borderRadius: 2, 
                      background: "var(--accent)",
                      boxShadow: "0 0 8px rgba(169,221,211,0.4)"
                    }} 
                  />
                )}
              </div>
              <div style={{ fontSize: 9, fontFamily: "'Space Mono', monospace", opacity: 0.5, textAlign: "center", color: "var(--text-primary)" }}>
                {step.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>
          {currentLevel < 4 ? `+${caps[nextLevel] - currentCap} pts potential` : "Max potential reached"}
        </div>
        
        {currentLevel < 4 && (
          <button 
            onClick={onUpgrade}
            className="premium-button"
            style={{ padding: "8px 16px", fontSize: 11 }}
          >
            Upgrade to Level {nextLevel} →
          </button>
        )}
      </div>

      {isCapped && (
        <div style={{ 
          marginTop: 12, 
          padding: "12px 16px", 
          borderRadius: "12px", 
          background: "rgba(245, 200, 66, 0.08)", 
          border: "1px solid rgba(245, 200, 66, 0.3)",
          fontSize: 11,
          color: "#F5C842",
          lineHeight: 1.5,
          display: "flex",
          flexDirection: "column",
          gap: 10
        }}>
          <div>
            ⚠️ Your activity earned {rawScore} pts but PoH Level {currentLevel} caps you at {currentCap}. Verify next level to unlock {rawScore - currentCap} hidden points.
          </div>
          {currentLevel < 4 && (
            <button 
              onClick={onUpgrade}
              style={{
                background: "transparent",
                border: "none",
                color: "#F5C842",
                fontWeight: 700,
                fontSize: 11,
                cursor: "pointer",
                padding: 0,
                textAlign: "left",
                opacity: 0.9,
                letterSpacing: "0.05em"
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0.9}
            >
              Unlock Now →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
