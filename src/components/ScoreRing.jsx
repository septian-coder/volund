import { motion, useSpring, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * ScoreRing
 * SVG arc with spring-animated stroke-dashoffset and pulsing text.
 */
export default function ScoreRing({ score, tier, size = 260 }) {
  const [displayScore, setDisplayScore] = useState(score);

  // Spring for the number
  const springScore = useSpring(score, { stiffness: 180, damping: 18 });
  
  useEffect(() => {
    springScore.set(score);
  }, [score, springScore]);

  useEffect(() => {
    return springScore.on("change", (v) => {
      setDisplayScore(v);
    });
  }, [springScore]);

  // SVG parameters
  const strokeWidth = 14;
  const radius = (size / 2) - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  
  // Angle for the arc (12 o'clock center, 240 degree sweep like the old gauge or full circle?)
  // The spec says "SVG arc", let's do a full circle but with a small gap at bottom like a gauge
  const sweepAngle = 240; 
  const gapAngle = 360 - sweepAngle;
  const offsetCircumference = (gapAngle / 360) * circumference;
  const activeCircumference = circumference - offsetCircumference;

  const progress = Math.min(Math.max(score / 1000, 0), 1);
  const dashOffset = activeCircumference * (1 - progress);

  // Tier colors
  const getTierColor = (t) => {
    switch (t?.toLowerCase()) {
      case "volund": return "#a9ddd3";
      case "diamond": return "#7DF9FF";
      case "platinum": return "#B0C4DE";
      case "gold": return "#F5C842";
      case "silver": return "#A8B4BC";
      case "bronze": return "#CD7F32";
      default: return "var(--text-tertiary)";
    }
  };

  const tierColor = getTierColor(tier);

  return (
    <div style={{ 
      position: "relative", 
      width: size, 
      height: size, 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center" 
    }}>
      <svg width={size} height={size} style={{ transform: "rotate(150deg)" }}>
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${activeCircumference} ${offsetCircumference}`}
          strokeLinecap="round"
        />

        {/* Animated Progress Arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tierColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${activeCircumference} ${offsetCircumference}`}
          strokeLinecap="round"
          initial={{ strokeDashoffset: activeCircumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ type: "spring", stiffness: 180, damping: 18 }}
          style={{
            filter: `drop-shadow(0 0 8px ${tierColor}44)`
          }}
        />
      </svg>

      {/* Center Content */}
      <motion.div 
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{ 
          position: "absolute", 
          textAlign: "center" 
        }}
      >
        <div style={{ 
          fontSize: size * 0.22, 
          fontWeight: 300, 
          color: tierColor, 
          fontFamily: "'Space Mono', monospace",
          letterSpacing: "-0.05em" 
        }}>
          {Math.round(displayScore)}
        </div>
        <div style={{ 
          fontSize: 10, 
          fontWeight: 800, 
          color: "var(--text-secondary)", 
          letterSpacing: "0.2em",
          marginTop: -4,
          opacity: 0.6
        }}>
          REPUTATION.SCORE
        </div>
      </motion.div>
    </div>
  );
}
