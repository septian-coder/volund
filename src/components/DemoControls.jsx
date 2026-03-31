import { motion } from "framer-motion";

/**
 * DemoControls
 * Floating panel to trigger mock interactions for testing.
 */
export default function DemoControls({ onAction }) {
  const actions = [
    { label: "Swap $500 on Rialo", points: 15, sub: "DeFi Activity" },
    { label: "Add Liquidity", points: 25, sub: "LP Deployment" },
    { label: "Connect GitHub", points: 35, sub: "Identity Link" },
    { label: "Verify PoH L1", points: 50, sub: "Sybil Guard" },
    { label: "DeFi Dabbler badge", points: 20, sub: "Tier Achievement" },
  ];

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      zIndex: 11000,
      background: "#0d0d0d",
      border: "1px solid rgba(169, 221, 211, 0.3)",
      borderRadius: "16px",
      padding: "16px",
      width: "240px",
      boxShadow: "0 16px 48px rgba(0,0,0,0.8)",
      display: "flex",
      flexDirection: "column",
      gap: 12
    }}>
      <div style={{ 
        fontSize: "9px", 
        color: "var(--text-secondary)", 
        fontWeight: 800, 
        letterSpacing: "0.1em",
        opacity: 0.5
      }}>
        ⚡ DEMO CONTROLS
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={() => onAction(a)}
            style={{
              background: "none",
              border: "1px solid rgba(169, 221, 211, 0.2)",
              borderRadius: "8px",
              padding: "10px",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#a9ddd3"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(169, 221, 211, 0.2)"}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#e8e3d5" }}>{a.label}</div>
            <div style={{ fontSize: "9px", color: "#a9ddd3", opacity: 0.8 }}>+{a.points} pts · {a.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
