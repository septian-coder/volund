import { useState, useEffect, useRef } from "react";

export default function ShareModal({ onClose, scoreVal, tier, wallet, social, categories, unlocked, theme }) {
  const canvasRef = useRef();
  const [copied, setCopied] = useState(false);
  const [generated, setGenerated] = useState(false);

  const shortAddr = a => a ? a.slice(0,6)+"..."+a.slice(-4) : "";
  const displayName = social?.github ? `@${social.github}` : shortAddr(wallet);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // ── Canvas dimensions ──────────────────────────────────────────────────────
    const W = 900, H = 480;
    canvas.width = W; canvas.height = H;

    // ── Color palette (always dark, premium) ──────────────────────────────────
    const BG     = "#080808";
    const PANEL  = "#111111";
    const ACCENT = "#a9ddd3";
    const TEXT   = "#f0ece0";
    const DIM    = "rgba(240,236,224,0.38)";
    const SUB    = "rgba(240,236,224,0.15)";
    const BORDER = "rgba(255,255,255,0.07)";

    const tierGradients = {
      Elite:       ["#22c55e","#16a34a"],
      Reputable:   ["#84cc16","#65a30d"],
      Established: ["#eab308","#ca8a04"],
      Newcomer:    ["#f97316","#ea580c"],
      Unknown:     ["#ef4444","#dc2626"],
    };
    const [tc1, tc2] = tierGradients[tier] || [ACCENT, ACCENT];

    // ── Helper: rounded rect ───────────────────────────────────────────────────
    function rr(x, y, w, h, r) {
      ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
    }
    function rrS(x, y, w, h, r) {
      ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.stroke();
    }

    // ── 1. Background ──────────────────────────────────────────────────────────
    // Deep dark base
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    // Radial glow — top-left accent
    const glL = ctx.createRadialGradient(100, 80, 0, 100, 80, 380);
    glL.addColorStop(0, "rgba(169,221,211,0.07)");
    glL.addColorStop(1, "transparent");
    ctx.fillStyle = glL;
    ctx.fillRect(0, 0, W, H);

    // Radial glow — bottom-right blue
    const glR = ctx.createRadialGradient(820, 420, 0, 820, 420, 320);
    glR.addColorStop(0, "rgba(82,130,255,0.05)");
    glR.addColorStop(1, "transparent");
    ctx.fillStyle = glR;
    ctx.fillRect(0, 0, W, H);

    // Subtle noise grid (fine dots)
    ctx.fillStyle = "rgba(255,255,255,0.018)";
    for (let gx = 0; gx < W; gx += 24) {
      for (let gy = 0; gy < H; gy += 24) {
        ctx.beginPath(); ctx.arc(gx, gy, 0.7, 0, Math.PI*2); ctx.fill();
      }
    }

    // Vertical divider line (left / right sections)
    const divX = 380;
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    ctx.moveTo(divX, 40);
    ctx.lineTo(divX, H - 40);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── 2. Top rainbow accent line ─────────────────────────────────────────────
    const topGrd = ctx.createLinearGradient(0, 0, W, 0);
    topGrd.addColorStop(0,   "transparent");
    topGrd.addColorStop(0.2, tc2 + "90");
    topGrd.addColorStop(0.5, ACCENT + "cc");
    topGrd.addColorStop(0.8, "rgba(99,120,255,0.5)");
    topGrd.addColorStop(1,   "transparent");
    ctx.fillStyle = topGrd;
    ctx.fillRect(0, 0, W, 1.5);

    // ── 3. Brand header (top-left) ─────────────────────────────────────────────
    ctx.textAlign = "left";
    ctx.font = "700 11px Inter, sans-serif";
    ctx.fillStyle = "rgba(240,236,224,0.22)";
    ctx.fillText("VOLUND", 48, 46);

    ctx.font = "400 9px Inter, sans-serif";
    ctx.fillStyle = SUB;
    ctx.fillText("REPUTATION SYSTEM · BASE SEPOLIA", 48, 62);

    // ── 4. Left section — Score hero ──────────────────────────────────────────
    const LX = 48;

    // Large score numeral
    const scoreStr = String(scoreVal);
    ctx.font = `100 ${scoreStr.length > 3 ? 110 : 128}px Inter, sans-serif`;
    ctx.fillStyle = TEXT;
    ctx.textAlign = "left";
    // Soft glow behind number
    ctx.shadowColor = ACCENT;
    ctx.shadowBlur = 48;
    ctx.fillText(scoreStr, LX - 4, 230);
    ctx.shadowBlur = 0;

    // "/1000" subscript
    ctx.font = "300 16px Inter, sans-serif";
    ctx.fillStyle = DIM;
    ctx.fillText("/ 1000", LX, 256);

    // Thin horizontal progress bar under score
    const PBY = 278, PBH = 4, PBW = 300;
    // Track
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    rr(LX, PBY, PBW, PBH, 2);
    // Fill with gradient
    if (scoreVal > 0) {
      const pbGrd = ctx.createLinearGradient(LX, 0, LX + PBW * (scoreVal / 1000), 0);
      pbGrd.addColorStop(0, tc2);
      pbGrd.addColorStop(1, tc1);
      ctx.fillStyle = pbGrd;
      ctx.shadowColor = tc1;
      ctx.shadowBlur = 8;
      rr(LX, PBY, PBW * (scoreVal / 1000), PBH, 2);
      ctx.shadowBlur = 0;
    }

    // Tier pill badge
    const pillTxt = tier.toUpperCase();
    const pillW = 86, pillH = 26, pillX = LX, pillY = PBY + 20;
    const tierGrd = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY);
    tierGrd.addColorStop(0, tc1 + "28");
    tierGrd.addColorStop(1, tc2 + "10");
    ctx.fillStyle = tierGrd;
    rr(pillX, pillY, pillW, pillH, 8);
    ctx.strokeStyle = tc1 + "55";
    ctx.lineWidth = 1;
    rrS(pillX, pillY, pillW, pillH, 8);
    // Dot
    ctx.beginPath(); ctx.arc(pillX + 14, pillY + pillH/2, 3.5, 0, Math.PI*2);
    ctx.fillStyle = tc1; ctx.fill();
    // Text
    ctx.font = "700 9px Inter, sans-serif";
    ctx.fillStyle = tc1;
    ctx.textAlign = "left";
    ctx.fillText(pillTxt, pillX + 24, pillY + pillH/2 + 3.5);

    // Identity (bottom of left section)
    ctx.textAlign = "left";
    ctx.font = "600 13px Inter, sans-serif";
    ctx.fillStyle = TEXT;
    ctx.fillText(displayName, LX, H - 68);
    ctx.font = "400 10px Inter, sans-serif";
    ctx.fillStyle = DIM;
    ctx.fillText(`${unlocked.length} badges earned  ·  Base Sepolia`, LX, H - 50);

    // ── 5. Right section — Breakdown ──────────────────────────────────────────
    const RX = divX + 36, RW = W - RX - 36;

    // Section header
    ctx.textAlign = "left";
    ctx.font = "600 9px Inter, sans-serif";
    ctx.fillStyle = SUB;
    ctx.fillText("SCORE BREAKDOWN", RX, 82);

    // Horizontal rule under header
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(RX, 90); ctx.lineTo(RX + RW, 90); ctx.stroke();

    categories.forEach((cat, ci) => {
      const RY = 118 + ci * 66;
      const barPct = cat.max > 0 ? cat.score / cat.max : 0;
      const catColor = ["#a9ddd3","#b8d4f0","#d4c5a9","#c8b8d4","#f0cba9"][ci % 5];

      // Category name row
      ctx.textAlign = "left";
      ctx.font = "400 12px Inter, sans-serif";
      ctx.fillStyle = TEXT;
      ctx.fillText(`${cat.icon}  ${cat.label}`, RX, RY);

      // Score on the right
      ctx.textAlign = "right";
      ctx.font = "600 12px Inter, sans-serif";
      ctx.fillStyle = catColor;
      ctx.fillText(`${cat.score}`, RX + RW, RY);
      ctx.font = "400 10px Inter, sans-serif";
      ctx.fillStyle = DIM;
      ctx.fillText(`/${cat.max}`, RX + RW + 28, RY);

      // Bar track (thin, 3px)
      const bY = RY + 10;
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      rr(RX, bY, RW, 3, 1.5);

      // Bar fill
      if (barPct > 0) {
        const bf = ctx.createLinearGradient(RX, 0, RX + RW * barPct, 0);
        bf.addColorStop(0, catColor + "55");
        bf.addColorStop(1, catColor + "cc");
        ctx.fillStyle = bf;
        rr(RX, bY, RW * barPct, 3, 1.5);
      }
    });

    // ── 6. Outer card border ───────────────────────────────────────────────────
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(0.5, 0.5, W - 1, H - 1, 20);
    ctx.stroke();

    // Bottom-right watermark
    ctx.textAlign = "right";
    ctx.font = "400 9px Inter, sans-serif";
    ctx.fillStyle = "rgba(240,236,224,0.1)";
    ctx.fillText("VOLUND · RRS DEVNET", W - 40, H - 20);

    setGenerated(true);
  }, [scoreVal, tier, wallet, social, theme]);


  function downloadCard() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `volund-rrs-${scoreVal}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function copyToClipboard() {
    const canvas = canvasRef.current;
    canvas.toBlob(async blob => {
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch(e) {
        // Fallback — download instead
        downloadCard();
      }
    });
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center",
      background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", animation:"fade-in .2s ease" }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:"var(--bg)", border:"1px solid var(--border)", borderRadius:16, padding:"28px", maxWidth:880, width:"calc(100% - 40px)", animation:"fade-up .3s ease" }}>

        {/* header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <span style={{ fontSize:11, color:"var(--text)", opacity:.6, letterSpacing:".2em", fontFamily:"'Inter',sans-serif" }}>SHARE SCORE CARD</span>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:"var(--text)", opacity:.5, cursor:"pointer", fontSize:18, lineHeight:1 }}>✕</button>
        </div>

        {/* canvas preview */}
        <div style={{ borderRadius:8, overflow:"hidden", border:"1px solid rgba(232,227,213,0.1)", marginBottom:20 }}>
          <canvas ref={canvasRef} style={{ display:"block", width:"100%", height:"auto" }}/>
        </div>

        {/* actions */}
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Just checked my Reputation Score on Base Sepolia. Scored ${scoreVal}/1000 — ${tier.toUpperCase()} Tier.\n\nAre you reputable enough? Find out natively onchain:\n\nvolund.io`)}`}
            target="_blank"
            rel="noreferrer"
            style={{ flex:1, minWidth:"180px", padding:"12px", background:"var(--btn-hover)", color:"var(--bg)", fontWeight:800, fontSize:11, border:"none", borderRadius:8, cursor:"pointer", letterSpacing:".12em", fontFamily:"'Inter',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:8, textDecoration:"none" }}
            onMouseEnter={e=>e.currentTarget.style.background="var(--text)"} onMouseLeave={e=>e.currentTarget.style.background="var(--btn-hover)"}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            SHARE TO X
          </a>
          <button onClick={downloadCard} style={{ flex:1, minWidth:"180px", padding:"12px", background:"var(--text)", color:"var(--bg)", fontWeight:700, fontSize:11, border:"none", borderRadius:8, cursor:"pointer", letterSpacing:".12em", fontFamily:"'Inter',sans-serif" }}
            onMouseEnter={e=>e.currentTarget.style.background="var(--btn-hover)"} onMouseLeave={e=>e.currentTarget.style.background="var(--text)"}>
            ↓ DOWNLOAD PNG
          </button>
          <button onClick={copyToClipboard} style={{ flex:1, minWidth:"180px", padding:"12px", background:"transparent", color:"var(--text)", fontWeight:700, fontSize:11, border:"1px solid var(--border)", borderRadius:8, cursor:"pointer", letterSpacing:".12em", fontFamily:"'Inter',sans-serif" }}>
            {copied ? "✓ COPIED!" : "⎘ COPY IMAGE"}
          </button>
        </div>

        <p style={{ fontSize:10, color:"var(--text)", opacity:.3, textAlign:"center", marginTop:14, letterSpacing:".08em", fontFamily:"'Inter',sans-serif" }}>
          Share on Twitter · Discord · Telegram
        </p>
      </div>
    </div>
  );
}
