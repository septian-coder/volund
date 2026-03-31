import { motion } from "framer-motion";

/**
 * ScoreDeltaBadge
 * Shows recent reputation gains or losses.
 */
export default function ScoreDeltaBadge({ delta, reason }) {
  const isPositive = delta >= 0;
  const color = isPositive ? "#a9ddd3" : "#F5C842";
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: "99px",
        background: `${color}11`,
        border: `1px solid ${color}33`,
        fontSize: "11px",
        fontWeight: 700,
        color: color,
        fontFamily: "'Space Mono', monospace"
      }}
    >
      <span>{isPositive ? "+" : ""}{delta} pts</span>
      {reason && (
        <span style={{ 
          fontSize: "9px", 
          opacity: 0.6, 
          fontWeight: 400,
          fontFamily: "'Inter', sans-serif",
          letterSpacing: "0.02em"
        }}>
          ({reason})
        </span>
      )}
    </motion.div>
  );
}
