import { motion } from "framer-motion";

/**
 * ScoreCapWarning
 * Detailed alert when score is being suppressed by PoH level.
 */
export default function ScoreCapWarning({ rawScore, cappedScore, pohLevel, onAction }) {
  if (rawScore <= cappedScore) return null;

  const pointsLocked = rawScore - cappedScore;
  const caps = [300, 500, 650, 850, 1000];
  const nextCap = caps[pohLevel + 1] || caps[pohLevel];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: "20px",
        borderRadius: "16px",
        background: "rgba(245, 200, 66, 0.08)",
        border: "1px solid rgba(245, 200, 66, 0.3)",
        marginBottom: 24,
        display: "flex",
        flexDirection: "column",
        gap: 12
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 20 }}>⚠️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "#F5C842", fontWeight: 700, marginBottom: 4 }}>
            Verification Required to Unlock Points
          </div>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
            Your activity earned <strong style={{ color: "#e8e3d5" }}>{rawScore} pts</strong>, but Proof of Humanity Level {pohLevel} caps you at <strong style={{ color: "#e8e3d5" }}>{cappedScore}</strong>. 
            Verify the next level to unlock <strong style={{ color: "#F5C842" }}>{pointsLocked} hidden points</strong>.
          </p>
        </div>
      </div>
      
      <button 
        onClick={onAction}
        style={{
          alignSelf: "flex-end",
          background: "none",
          border: "none",
          color: "#F5C842",
          fontSize: 12,
          fontWeight: 800,
          cursor: "pointer",
          letterSpacing: "0.05em",
          padding: "4px 0"
        }}
      >
        UNLOCK NOW →
      </button>
    </motion.div>
  );
}
