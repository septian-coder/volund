import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ShareModal
 * Minimal spec-compliant UI with preserved complex canvas download logic.
 */
export default function ShareModal({ 
  isOpen, 
  onClose, 
  score, 
  tier, 
  wallet,
  // Preserved for canvas logic
  social,
  categories,
  unlocked,
  theme 
}) {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef();
  
  const shortAddr = (a) => a ? a.slice(0, 6) + "..." + a.slice(-4) : "";
  const getTierColor = (t) => {
    const lower = t?.toLowerCase();
    if (lower === "volund") return "#a9ddd3";
    if (lower === "diamond") return "#7DF9FF";
    if (lower === "platinum") return "#B0C4DE";
    if (lower === "gold") return "#F5C842";
    if (lower === "silver") return "#A8B4BC";
    if (lower === "bronze") return "#CD7F32";
    return "#a9ddd3"; // fallback to accent
  };

  // Re-implement the exact canvas logic for the Download function
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Canvas dimensions from original logic
    const W = 900, H = 480;
    canvas.width = W; canvas.height = H;

    // Preserved Canvas Rendering Logic (from original ShareModal.jsx)
    const BG = "#080808";
    const ACCENT = "#a9ddd3";
    const TEXT = "#f0ece0";
    const DIM = "rgba(240,236,224,0.38)";
    const SUB = "rgba(240,236,224,0.15)";
    const BORDER = "rgba(255,255,255,0.07)";

    const tierGradients = {
      volund: ["#a9ddd3", "#4a9d93"],
      diamond: ["#7DF9FF", "#00BFFF"],
      platinum: ["#B0C4DE", "#4682B4"],
      gold: ["#F5C842", "#DAA520"],
      silver: ["#A8B4BC", "#708090"],
      bronze: ["#CD7F32", "#8B4513"],
      unverified: ["#555555", "#333333"],
    };
    const [tc1, tc2] = tierGradients[tier?.toLowerCase()] || [ACCENT, ACCENT];

    // Helper: rounded rect
    function rr(x, y, w, h, r) {
      ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
    }
    function rrS(x, y, w, h, r) {
      ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.stroke();
    }

    // 1. Background
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    // Radial glows
    const glL = ctx.createRadialGradient(100, 80, 0, 100, 80, 380);
    glL.addColorStop(0, "rgba(169,221,211,0.07)");
    glL.addColorStop(1, "transparent");
    ctx.fillStyle = glL;
    ctx.fillRect(0, 0, W, H);

    // Noise/Grid
    ctx.fillStyle = "rgba(255,255,255,0.018)";
    for (let gx = 0; gx < W; gx += 24) {
      for (let gy = 0; gy < H; gy += 24) {
        ctx.beginPath(); ctx.arc(gx, gy, 0.7, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Header
    ctx.textAlign = "left";
    ctx.font = "700 11px Inter, sans-serif";
    ctx.fillStyle = "rgba(240,236,224,0.22)";
    ctx.fillText("VOLUND", 48, 46);
    ctx.font = "400 9px Inter, sans-serif";
    ctx.fillStyle = SUB;
    ctx.fillText("REPUTATION SYSTEM · BASE SEPOLIA", 48, 62);

    // Score Hero
    const scoreStr = String(score || 0);
    ctx.font = `100 128px Inter, sans-serif`;
    ctx.fillStyle = TEXT;
    ctx.shadowColor = ACCENT;
    ctx.shadowBlur = 48;
    ctx.fillText(scoreStr, 44, 230);
    ctx.shadowBlur = 0;

    // Tier badge
    const pillTxt = tier?.toUpperCase() || "UNKNOWN";
    const pillX = 48, pillY = 298, pillW = 86, pillH = 26;
    ctx.fillStyle = tc1 + "28";
    rr(pillX, pillY, pillW, pillH, 8);
    ctx.strokeStyle = tc1 + "55";
    ctx.lineWidth = 1;
    rrS(pillX, pillY, pillW, pillH, 8);
    ctx.font = "700 9px Inter, sans-serif";
    ctx.fillStyle = tc1;
    ctx.fillText(pillTxt, pillX + 24, pillY + 17);

    // Identity
    ctx.fillStyle = TEXT;
    ctx.font = "600 13px Inter, sans-serif";
    ctx.fillText(shortAddr(wallet), 48, H - 68);

    // Breakdown Section (Right)
    const divX = 380;
    ctx.strokeStyle = BORDER;
    ctx.setLineDash([4, 8]);
    ctx.beginPath(); ctx.moveTo(divX, 40); ctx.lineTo(divX, H - 40); ctx.stroke();
    ctx.setLineDash([]);

    if (categories) {
      categories.forEach((cat, ci) => {
        const RY = 118 + ci * 66;
        const catColor = ["#a9ddd3", "#b8d4f0", "#d4c5a9", "#c8b8d4", "#f0cba9"][ci % 5];
        ctx.fillStyle = TEXT;
        ctx.font = "400 12px Inter, sans-serif";
        ctx.fillText(`${cat.icon}  ${cat.label}`, divX + 36, RY);
        ctx.fillStyle = catColor;
        ctx.textAlign = "right";
        ctx.fillText(`${cat.score}`, 864, RY);
        ctx.textAlign = "left";
      });
    }

    // Watermark
    ctx.textAlign = "right";
    ctx.font = "400 9px Inter, sans-serif";
    ctx.fillStyle = "rgba(240,236,224,0.1)";
    ctx.fillText("VOLUND · BUILD ON RIALO", W - 40, H - 20);

  }, [isOpen, score, tier, wallet, categories]);

  // Existing download logic Reconnected
  const downloadCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `volund-score-${score}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyLink = async () => {
    const url = `https://volund.rialo.io/score/${wallet}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(1,1,1,0.85)", backdropFilter: "blur(8px)"
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(169,221,211,0.25)",
          borderRadius: "16px",
          padding: "32px",
          width: "100%",
          maxWidth: "480px",
          position: "relative",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
        }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: "absolute", top: 20, right: 20,
            background: "none", border: "none", cursor: "pointer",
            color: "#706b61", fontSize: 20, transition: "color 0.2s"
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#e8e3d5"}
          onMouseLeave={e => e.currentTarget.style.color = "#706b61"}
        >
          ✕
        </button>

        <h2 style={{ 
          fontFamily: "'Space Mono', monospace", 
          fontSize: 20, 
          color: "#e8e3d5", 
          marginBottom: 24,
          fontWeight: 700
        }}>
          Share your Volund Score
        </h2>

        {/* Score Card Preview */}
        <div style={{
          background: "#010101",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: 32,
          border: "1px solid rgba(169,221,211,0.1)",
          textAlign: "center"
        }}>
          <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.2em", marginBottom: 8 }}>REPUTATION CARD</div>
          <div style={{ fontSize: 64, fontWeight: 300, color: "#a9ddd3", fontFamily: "'Syne', sans-serif", margin: "16px 0" }}>
            {score}
          </div>
          <div style={{ 
            display: "inline-block", 
            padding: "4px 12px", 
            borderRadius: "6px", 
            fontSize: 10, 
            fontWeight: 800, 
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${getTierColor(tier)}44`,
            color: getTierColor(tier),
            marginBottom: 16
          }}>
            {tier?.toUpperCase()} TIER
          </div>
          <div style={{ fontSize: 12, opacity: 0.4, fontFamily: "monospace", marginBottom: 4 }}>
            {shortAddr(wallet)}
          </div>
          <div style={{ fontSize: 9, opacity: 0.2, fontWeight: 700 }}>Built on @RialoHQ</div>
        </div>

        {/* Hidden Canvas for Download */}
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Share Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <a 
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`My Volund Score is ${score}/1000 — ${tier} tier on @RialoHQ! 🌊 #Rialo #Volund #BuildOnRialo`)}`}
            target="_blank" rel="noreferrer"
            className="premium-button"
            style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}
          >
            Share on X (Twitter)
          </a>
          
          <button 
            onClick={copyLink}
            style={{ 
              width: "100%", padding: "12px", borderRadius: "8px",
              background: "transparent", border: "1px solid var(--border)",
              color: "#e8e3d5", fontSize: 13, fontWeight: 600, cursor: "pointer"
            }}
          >
            {copied ? "Copied! ✓" : "Copy Link"}
          </button>

          <button 
            onClick={downloadCard}
            style={{ 
              width: "100%", padding: "12px", borderRadius: "8px",
              background: "transparent", border: "1px solid var(--accent)",
              color: "#a9ddd3", fontSize: 13, fontWeight: 600, cursor: "pointer"
            }}
          >
            Download Card
          </button>
        </div>
      </motion.div>
    </div>
  );
}
