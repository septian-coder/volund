import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "../../hooks/useInView";
import Tag from "../../components/Tag";

// -- CONFIGURATION & DATA --

const beforeNodes = [
  { id: 'l1', x: 15, y: 20, label: 'Twitter/X' },
  { id: 'l2', x: 15, y: 40, label: 'GitHub' },
  { id: 'l3', x: 15, y: 60, label: 'On-chain Data' },
  { id: 'l4', x: 15, y: 80, label: 'KYC Provider' },
  { id: 'c1', x: 50, y: 25, label: 'Manual Review' },
  { id: 'c2', x: 50, y: 50, label: 'Centralized DB' },
  { id: 'c3', x: 50, y: 75, label: '3rd Party Oracle' },
  { id: 'r1', x: 85, y: 30, label: 'DeFi Protocol', rightText: '?' },
  { id: 'r2', x: 85, y: 55, label: 'DAO', rightText: '?' },
  { id: 'r3', x: 85, y: 80, label: 'Airdrop', rightText: '?' },
];

const beforeEdges = [
  { from: 'l1', to: 'c2' },
  { from: 'l2', to: 'c1' },
  { from: 'l3', to: 'c3' },
  { from: 'l4', to: 'c1' },
  { from: 'c1', to: 'r1' },
  { from: 'c1', to: 'r2' },
  { from: 'c2', to: 'r2' },
  { from: 'c3', to: 'r1' },
  { from: 'c3', to: 'r3' },
];

const calloutsBefore = [
  { text: "$ Repeated KYC costs $50-$200 per user", x: 30, y: 8 },
  { text: "No portable reputation across protocols", x: 75, y: 12 },
  { text: "$ Sybil attacks cost protocols $10M+ annually", x: 70, y: 92 },
  { text: "Centralized data = single point of failure", x: 30, y: 90 },
  { text: "No on-chain verifiability - trust is assumed", x: 35, y: 45 },
  { text: "$ Manual review delays onboarding by 3-7 days", x: 50, y: 15 },
];

const afterNodes = [
  { id: 'al1', x: 15, y: 20, label: 'On-chain Activity' },
  { id: 'al2', x: 15, y: 40, label: 'DeFi Behavior' },
  { id: 'al3', x: 15, y: 60, label: 'Social Identity' },
  { id: 'al4', x: 15, y: 80, label: 'Badges' },
  { id: 'c1', x: 50, y: 50, isHero: true },
  { id: 'ar1', x: 85, y: 20, label: 'DeFi Protocol', rightText: 'Score >= 100' },
  { id: 'ar2', x: 85, y: 40, label: 'DAO Governance', rightText: 'Voice Power' },
  { id: 'ar3', x: 85, y: 60, label: 'Airdrop', rightText: 'Gold Tier' },
  { id: 'ar4', x: 85, y: 80, label: 'KYC-free Access', rightText: 'Verified' },
];

const afterEdges = [
  ...[1,2,3,4].map(i => ({ from: `al${i}`, to: 'c1' })),
  ...[1,2,3,4].map(i => ({ from: 'c1', to: `ar${i}` }))
];

const calloutsAfter = [
  { text: "$0 integration cost - native protocol call", x: 30, y: 15 },
  { text: "One score, readable by all Rialo protocols", x: 70, y: 15 },
  { text: "Soulbound badges - non-transferable proof", x: 30, y: 85 },
  { text: "ZK-ready - prove eligibility without revealing identity", x: 70, y: 85 },
  { text: "Score updates in <10ms on-chain read", x: 50, y: 8 },
  { text: "Composable - any protocol can gate with 1 line", x: 50, y: 92 },
];

const statsBefore = [
  { label: "INTEGRATION COST", prefix: "$", val: 20, suffix: " / verification" },
  { label: "COLLATERAL", prefix: "", val: 300, suffix: "%+ required" },
  { label: "TRUST LATENCY", prefix: "", val: 3.2, suffix: "s per protocol", isFloat: true },
];

const statsAfter = [
  { label: "INTEGRATION COST", prefix: "$", val: 0, suffix: " native call" },
  { label: "COLLATERAL", prefix: "", val: 125, suffix: "% with score" },
  { label: "TRUST LATENCY", prefix: "<", val: 10, suffix: "ms (onchain read)" },
];

function getCoords(id, nodes) {
  const node = nodes.find(n => n.id === id);
  return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
}

// -- COMPONENTS --

const NodeBox = ({ label, left, top, isGood, rightText, isHero }) => {
  if (isHero) {
    return (
      <div className="hub-pulse" style={{
        position: "absolute", left: `${left}%`, top: `${top}%`, transform: "translate(-50%, -50%)",
        width: "140px", height: "140px", borderRadius: "50%",
        background: "rgba(var(--sim-mint-rgb), 0.1)", border: "2px solid var(--sim-mint)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        zIndex: 10
      }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--sim-mint)", letterSpacing: "2px" }}>VOLUND</div>
        <div style={{ fontSize: "38px", fontWeight: 200, color: "var(--sim-mint)", margin: "4px 0" }}>742</div>
        <div style={{ fontSize: "9px", color: "rgba(var(--sim-mint-rgb), 0.7)", letterSpacing: "1px" }}>SCORE ORACLE</div>
      </div>
    );
  }

  return (
    <div style={{
      position: "absolute", left: `${left}%`, top: `${top}%`, transform: "translate(-50%, -50%)",
      border: isGood ? "1px solid rgba(var(--sim-mint-rgb), 0.3)" : "1px dashed rgba(var(--sim-red-rgb), 0.4)",
      background: isGood ? "rgba(var(--sim-mint-rgb), 0.05)" : "rgba(var(--sim-red-rgb), 0.05)",
      color: isGood ? "var(--sim-text)" : "rgba(var(--sim-text-rgb), 0.7)",
      borderRadius: "8px", padding: "10px 16px",
      fontSize: "13px", fontFamily: "'Inter', sans-serif",
      display: "flex", alignItems: "center", gap: "10px",
      zIndex: 2, backdropFilter: "blur(4px)", whiteSpace: "nowrap"
    }}>
      {label}
      {rightText && (
        <span style={{ fontSize: "11px", color: isGood ? "var(--sim-mint)" : "rgba(var(--sim-text-rgb), 0.5)" }}>
          {rightText}
        </span>
      )}
    </div>
  );
};

const Callout = ({ text, x, y, isGood }) => {
  const color = isGood ? "var(--sim-mint)" : "var(--sim-red)";
  return (
    <div style={{
      position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)",
      color: color, fontSize: "12px", display: "flex", gap: "6px", alignItems: "center",
      whiteSpace: "nowrap", zIndex: 3, fontWeight: 600, opacity: 0.9, 
      textShadow: "0 1px 4px rgba(var(--sim-bg-rgb), 0.9), 0 2px 10px rgba(var(--sim-bg-rgb), 0.5)"
    }}>
      {text}
    </div>
  );
};

const StatCard = ({ label, prefix, val, suffix, isFloat, isBefore }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref);

  const themeColor = isBefore ? "var(--sim-red)" : "var(--sim-mint)";
  const themeRgb = isBefore ? "var(--sim-red-rgb)" : "var(--sim-mint-rgb)";

  useEffect(() => {
    if (isInView) {
      let startTimestamp = null;
      let animationFrame;
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / 1500, 1);
        const easing = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const currentVal = easing * val;
        setCount(isFloat ? currentVal.toFixed(1) : Math.floor(currentVal));
        if (progress < 1) {
          animationFrame = window.requestAnimationFrame(step);
        }
      };
      animationFrame = window.requestAnimationFrame(step);
      return () => window.cancelAnimationFrame(animationFrame);
    } else {
      setCount(0);
    }
  }, [isInView, val, isFloat]);

  return (
    <div ref={ref} style={{
      position: "relative",
      background: `linear-gradient(135deg, rgba(${themeRgb}, 0.02) 0%, rgba(${themeRgb}, 0.06) 100%)`,
      border: `1px solid rgba(${themeRgb}, 0.15)`,
      borderRadius: "16px", padding: "24px",
      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)", 
      cursor: "default",
      overflow: "hidden"
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-5px) scale(1.02)";
      e.currentTarget.style.boxShadow = `0 12px 30px rgba(${themeRgb}, 0.12), inset 0 0 0 1px rgba(${themeRgb}, 0.3)`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0) scale(1)";
      e.currentTarget.style.boxShadow = "none";
    }}>
      {/* Decorative top border glow */}
      <div style={{
        position: "absolute", top: 0, left: "15%", right: "15%", height: "1px",
        background: `linear-gradient(90deg, transparent, rgba(${themeRgb}, 0.6), transparent)`
      }} />

      <div style={{
        fontSize: "10px", fontFamily: "'Space Mono', monospace",
        letterSpacing: "0.25em", color: `rgba(${themeRgb}, 0.6)`,
        textTransform: "uppercase", marginBottom: "12px",
        fontWeight: 700
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'Inter', sans-serif",
        display: "flex", alignItems: "baseline", gap: "8px"
      }}>
        <span style={{
          fontSize: "24px", fontWeight: "700", color: themeColor,
          fontFamily: "'Space Mono', monospace", letterSpacing: "-0.03em"
        }}>
          {prefix}{count}
        </span>
        <span style={{
          fontSize: "13px", fontWeight: "500", color: `rgba(${themeRgb}, 0.65)`
        }}>
          {suffix}
        </span>
      </div>
    </div>
  );
};

// -- MAIN SECTION --

export default function SimSection({ isMobile }) {
  const [mode, setMode] = useState("before");
  const isBefore = mode === "before";
  const currentStats = isBefore ? statsBefore : statsAfter;

  return (
    <section className="sim-section" style={{ 
      padding: isMobile ? "60px 20px" : "100px 32px", 
      borderBottom: "1px solid var(--border)", 
      overflow: "hidden", 
      background: "var(--sim-bg)" 
    }}>
      <style>{`
        .sim-section {
          --sim-mint: #a9ddd3;
          --sim-mint-rgb: 169, 221, 211;
          --sim-red: #f87171;
          --sim-red-rgb: 248, 113, 113;
          --sim-text: #e8e3d5;
          --sim-text-rgb: 232, 227, 213;
          --sim-bg: #010101;
          --sim-bg-rgb: 1, 1, 1;
        }

        [data-theme="light"], [data-theme="light"] .sim-section {
          --sim-mint: #0f766e;
          --sim-mint-rgb: 15, 118, 110;
          --sim-red: #b91c1c;
          --sim-red-rgb: 185, 28, 28;
          --sim-text: #111827;
          --sim-text-rgb: 17, 24, 39;
          --sim-bg: #ffffff;
          --sim-bg-rgb: 255, 255, 255;
        }

        @keyframes flicker {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes flowDots {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes hubPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(var(--sim-mint-rgb), 0.1); }
          50% { box-shadow: 0 0 60px rgba(var(--sim-mint-rgb), 0.3); }
        }
        @keyframes flowDotsRed {
          from { stroke-dashoffset: 40; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes pulseX {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .flow-line {
          stroke-dasharray: 0.1 24;
          stroke-linecap: round;
          animation: flowDots 1s linear infinite;
        }
        .flow-line-red {
          stroke-dasharray: 0.1 40;
          stroke-linecap: round;
          animation: flowDotsRed 1.5s linear infinite;
        }
        .flicker-line {
          animation: flicker 2s infinite ease-in-out;
        }
        .pulse-x {
          animation: pulseX 1.5s infinite ease-in-out;
        }
        .hub-pulse {
          animation: hubPulse 3s infinite ease-in-out;
        }
      `}</style>

      <div className="reveal-up-scroll" style={{ maxWidth: 1100, margin: "0 auto" }}>
        
        {/* Header */}
        <Tag>{isBefore ? "the problem" : "the solution"}</Tag>
        <h2 style={{ 
          fontSize: "clamp(28px, 4vw, 54px)", fontWeight: 700, 
          letterSpacing: "-0.01em", margin: "20px 0 12px", lineHeight: 1.1, 
          color: "var(--sim-text)" 
        }}>
          {isBefore ? "Before Volund: Fragile. Opaque. Unverifiable." : "With Volund RRS: Unified. Verified. Composable."}
        </h2>
        
        <p style={{ fontSize: 13, color: "rgba(var(--sim-text-rgb), 0.6)", lineHeight: 1.9, maxWidth: 500, marginBottom: 36 }}>
          {isBefore
            ? "Every protocol builds its own trust check. Your wallet connects to each one separately - slow, costly, and still untrusted."
            : "One score. All protocols read it instantly. No oracles, no KYC re-runs, no middleware."}
        </p>

        {/* Toggle Button */}
        <div style={{ display: "flex", gap: 12, marginBottom: 40 }}>
          <button
            onClick={() => setMode("before")}
            style={{
              padding: "12px 24px",
              background: isBefore ? "rgba(var(--sim-red-rgb), 0.08)" : "transparent",
              border: `1px solid ${isBefore ? "rgba(var(--sim-red-rgb), 0.5)" : "rgba(var(--sim-red-rgb), 0.3)"}`,
              color: isBefore ? "var(--sim-red)" : "rgba(var(--sim-red-rgb), 0.8)",
              borderRadius: "8px", cursor: "pointer",
              fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600,
              transition: "all 0.3s ease"
            }}
          >
            Before Volund
          </button>
          <button
            onClick={() => setMode("after")}
            style={{
              padding: "12px 24px",
              background: !isBefore ? "rgba(var(--sim-mint-rgb), 0.08)" : "transparent",
              border: `1px solid ${!isBefore ? "rgba(var(--sim-mint-rgb), 0.5)" : "rgba(var(--sim-mint-rgb), 0.3)"}`,
              color: !isBefore ? "var(--sim-mint)" : "rgba(var(--sim-mint-rgb), 0.8)",
              borderRadius: "8px", cursor: "pointer",
              fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600,
              boxShadow: !isBefore ? "0 0 16px rgba(var(--sim-mint-rgb), 0.1)" : "none",
              transition: "all 0.3s ease"
            }}
          >
            With Volund RRS
          </button>
        </div>

        {/* Main Diagram Area */}
        <div style={{
          width: "100%", overflowX: "auto", overflowY: "hidden",
          border: "1px solid var(--border)", borderRadius: "16px",
          background: isBefore ? "rgba(var(--sim-red-rgb), 0.02)" : "rgba(var(--sim-mint-rgb), 0.015)",
          transition: "background 0.5s ease"
        }}>
          <div style={{ position: "relative", minWidth: "900px", height: "500px" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
              >
                {/* SVG Lines Layer */}
                <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1 }}>
                  {isBefore ? (
                    beforeEdges.map((edge, i) => {
                      const from = getCoords(edge.from, beforeNodes);
                      const to = getCoords(edge.to, beforeNodes);
                      const mx = (from.x + to.x) / 2;
                      const my = (from.y + to.y) / 2;
                      return (
                        <g key={i}>
                          {/* Base dashed line */}
                          <line 
                            x1={`${from.x}%`} y1={`${from.y}%`} 
                            x2={`${to.x}%`} y2={`${to.y}%`} 
                            stroke="rgba(var(--sim-red-rgb), 0.4)" strokeWidth="2" strokeDasharray="6,6"
                            className="flicker-line"
                          />
                          {/* Red particles flowing to the midpoint (broken) */}
                          <line 
                            x1={`${from.x}%`} y1={`${from.y}%`} 
                            x2={`${mx}%`} y2={`${my}%`} 
                            stroke="rgba(var(--sim-red-rgb), 0.9)" strokeWidth="3.5"
                            className="flow-line-red"
                          />
                          <text x={`${mx}%`} y={`${my}%`} fill="rgba(var(--sim-red-rgb), 0.8)" fontSize="16" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle" className="pulse-x">
                            x
                          </text>
                        </g>
                      );
                    })
                  ) : (
                    afterEdges.map((edge, i) => {
                      const from = getCoords(edge.from, afterNodes);
                      const to = getCoords(edge.to, afterNodes);
                      return (
                        <line 
                          key={i}
                          x1={`${from.x}%`} y1={`${from.y}%`} 
                          x2={`${to.x}%`} y2={`${to.y}%`} 
                          stroke="rgba(var(--sim-mint-rgb), 0.4)" strokeWidth="4"
                          className="flow-line"
                        />
                      );
                    })
                  )}
                </svg>

                {/* HTML Nodes Layer */}
                {isBefore ? (
                  <>
                    {beforeNodes.map(node => (
                      <NodeBox key={node.id} left={node.x} top={node.y} label={node.label} rightText={node.rightText} isGood={false} />
                    ))}
                    {calloutsBefore.map((c, i) => (
                      <Callout key={i} text={c.text} x={c.x} y={c.y} isGood={false} />
                    ))}
                  </>
                ) : (
                  <>
                    {afterNodes.map(node => (
                      <NodeBox key={node.id} left={node.x} top={node.y} label={node.label} rightText={node.rightText} isHero={node.isHero} isGood={true} />
                    ))}
                    {calloutsAfter.map((c, i) => (
                      <Callout key={i} text={c.text} x={c.x} y={c.y} isGood={true} />
                    ))}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Upgraded Stat Cards */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", 
          gap: "24px", 
          marginTop: "40px" 
        }}>
          {currentStats.map((stat, i) => (
            <StatCard key={stat.label + mode} {...stat} isBefore={isBefore} />
          ))}
        </div>

      </div>
    </section>
  );
}
