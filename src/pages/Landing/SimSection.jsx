import { useState, useEffect, useRef } from "react";
import { useInView } from "../../hooks/useInView";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import Tag from "../../components/Tag";

// ── Simulation ────────────────────────────────────────────────────────
export default function SimSection({ isMobile }) {
  const [mode, setMode] = useState("before");
  const [score, setScore] = useState(0);
  const canvasRef = useRef();
  const modeRef = useRef("before");
  const simRef = useRef();
  const simVis = useInView(simRef);
  const rafRef = useRef();

  // Auto-cycle
  useEffect(() => {
    if (!simVis) return;
    const id = setInterval(() => {
      setMode(m => { const next = m === "before" ? "after" : "before"; modeRef.current = next; return next; });
    }, 5000);
    return () => clearInterval(id);
  }, [simVis]);

  // Score count-up
  useEffect(() => {
    if (mode === "after") {
      let v = 0; setScore(0);
      const t = setInterval(() => { v += Math.ceil((742 - v) / 6) || 1; if (v >= 742) { clearInterval(t); v = 742; } setScore(v); }, 24);
      return () => clearInterval(t);
    } else { setScore(0); }
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const cx = W / 2, cy = H / 2;

    // NODES
    const protocols = [
      { label: "KYC",      icon: "◈", angle: -90 },
      { label: "DeFi",     icon: "◎", angle: -30 },
      { label: "Bridge",   icon: "⛓", angle:  30 },
      { label: "IPC Gate", icon: "◉", angle:  90 },
      { label: "Oracle",   icon: "◇", angle: 150 },
      { label: "Collateral",icon: "◆",angle: 210 },
    ];
    const R = Math.min(W, H) * 0.33;
    const nodes = protocols.map(p => {
      const rad = (p.angle * Math.PI) / 180;
      return { x: cx + R * Math.cos(rad), y: cy + R * Math.sin(rad), label: p.label, icon: p.icon };
    });
    const hub = { x: cx, y: cy, label: "Volund", icon: "◎" };

    // PARTICLES
    const particles = [];
    function spawnParticle(from, to, good) {
      particles.push({ x: from.x, y: from.y, tx: to.x, ty: to.y, t: 0, good, speed: 0.004 + Math.random() * 0.003, dead: false });
    }

    let spawnTimer = 0;

    function drawNode(n, active, size = 26) {
      const isDark = modeRef.current === "before";
      ctx.beginPath();
      ctx.arc(n.x, n.y, size, 0, Math.PI * 2);
      ctx.fillStyle = active ? (isDark ? "rgba(248,113,113,0.1)" : "rgba(169,221,211,0.12)") : "rgba(255,255,255,0.04)";
      ctx.fill();
      ctx.strokeStyle = active ? (isDark ? "rgba(248,113,113,0.5)" : "rgba(169,221,211,0.6)") : "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = isDark ? "#f87171" : "#a9ddd3";
      ctx.textAlign = "center";
      ctx.font = `13px Inter,sans-serif`;
      ctx.fillText(n.icon, n.x, n.y - 4);
      ctx.font = `600 8px Inter,sans-serif`;
      ctx.fillStyle = isDark ? "rgba(248,113,113,0.7)" : "rgba(169,221,211,0.8)";
      ctx.fillText(n.label, n.x, n.y + 10);
    }

    function drawEdge(a, b, good, alpha = 0.18) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = good ? `rgba(169,221,211,${alpha})` : `rgba(248,113,113,${alpha})`;
      ctx.lineWidth = 1;
      ctx.setLineDash(good ? [] : [4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    function draw(ts) {
      ctx.clearRect(0, 0, W, H);
      const isBefore = modeRef.current === "before";

      if (isBefore) {
        // — BEFORE: all-to-all messy graph —
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            drawEdge(nodes[i], nodes[j], false, 0.12);
          }
        }
        // Cost labels on a few edges
        ctx.font = "7px Inter,sans-serif";
        ctx.fillStyle = "rgba(248,113,113,0.4)";
        ctx.textAlign = "center";
        [["KYC","DeFi","+$12"], ["Bridge","IPC Gate","3.2s"], ["Oracle","Collateral","+$8"]].forEach(([a,b,lbl]) => {
          const na = nodes.find(n=>n.label===a), nb = nodes.find(n=>n.label===b);
          if(na&&nb) ctx.fillText(lbl, (na.x+nb.x)/2, (na.y+nb.y)/2 - 5);
        });
        nodes.forEach(n => drawNode(n, true, 24));

        // Spawn inter-node particles
        spawnTimer += 16;
        if (spawnTimer > 300 && !isMobile) {
          spawnTimer = 0;
          const from = nodes[Math.floor(Math.random() * nodes.length)];
          const to = nodes[Math.floor(Math.random() * nodes.length)];
          if (from !== to) spawnParticle(from, to, false);
        }

      } else {
        // — AFTER: hub-and-spoke through Volund —
        nodes.forEach(n => drawEdge(hub, n, true, 0.25));

        // Hub glow ring
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 50);
        grad.addColorStop(0, "rgba(169,221,211,0.15)");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(cx, cy, 50, 0, Math.PI * 2); ctx.fill();

        nodes.forEach(n => drawNode(n, true, 22));

        // Draw Hub
        ctx.beginPath(); ctx.arc(cx, cy, 32, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(169,221,211,0.12)"; ctx.fill();
        ctx.strokeStyle = "#a9ddd3"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.font = "600 9px Inter,sans-serif";
        ctx.fillStyle = "#a9ddd3"; ctx.textAlign = "center";
        ctx.fillText("VOLUND", cx, cy - 3);
        ctx.font = "7px Inter,sans-serif"; ctx.fillStyle = "rgba(169,221,211,0.6)";
        ctx.fillText("RRS", cx, cy + 9);

        spawnTimer += 16;
        if (spawnTimer > 200 && !isMobile) {
          spawnTimer = 0;
          const n = nodes[Math.floor(Math.random() * nodes.length)];
          spawnParticle(hub, n, true);
        }
      }

      // Update & draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.t += p.speed;
        if (p.t >= 1) { particles.splice(i, 1); continue; }
        const x = p.x + (p.tx - p.x) * p.t;
        const y = p.y + (p.ty - p.y) * p.t;
        const alpha = Math.sin(p.t * Math.PI);
        ctx.beginPath(); ctx.arc(x, y, p.good ? 2.5 : 2, 0, Math.PI * 2);
        ctx.fillStyle = p.good ? `rgba(169,221,211,${alpha * 0.9})` : `rgba(248,113,113,${alpha * 0.7})`;
        ctx.fill();
        if (p.good) {
          ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(169,221,211,${alpha * 0.15})`; ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleTabClick = (m) => { setMode(m); modeRef.current = m; };

  const isBefore = mode === "before";

  return (
    <section ref={simRef} style={{ padding: isMobile ? "60px 20px" : "100px 32px", borderBottom: "1px solid var(--border)", overflow: "hidden" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", opacity: simVis ? 1 : 0, transform: simVis ? "none" : "translateY(32px)", transition: "opacity .8s ease, transform .8s ease" }}>

        {/* Header */}
        <Tag>the problem</Tag>
        <h2 style={{ fontSize: "clamp(28px,4vw,54px)", fontWeight: 300, letterSpacing: "-0.01em", margin: "20px 0 12px", lineHeight: 1.1 }}>
          <span className="shimmer-text">{isBefore ? "Before Volund:" : "With Volund RRS:"}</span><br/>
          <span className="shimmer-accent">{isBefore ? "Anonymous. Fragile. Costly." : "Unified. Trusted. Composable."}</span>
        </h2>
        <p style={{ fontSize: 13, opacity: 0.55, lineHeight: 1.9, maxWidth: 420, marginBottom: 36 }}>
          {isBefore
            ? "Every protocol builds its own trust check. Your wallet connects to each one separately — slow, costly, and still untrusted."
            : "One score. All protocols read it instantly. No oracles, no KYC re-runs, no middleware."}
        </p>

        {/* Toggle */}
        <div style={{ display: "flex", gap: 4, marginBottom: 32, padding: 4, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 12, width: "fit-content" }}>
          {[{ id: "before", label: "Before Volund" }, { id: "after", label: "With Volund RRS" }].map(tab => (
            <button key={tab.id} onClick={() => handleTabClick(tab.id)} style={{
              padding: "8px 22px", border: "none", borderRadius: 8, cursor: "pointer",
              fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: tab.id === mode ? 700 : 400,
              background: tab.id === mode ? (tab.id === "before" ? "rgba(248,113,113,0.14)" : "rgba(169,221,211,0.14)") : "transparent",
              color: tab.id === mode ? (tab.id === "before" ? "#f87171" : "#a9ddd3") : "rgba(255,255,255,0.45)",
              outline: tab.id === mode ? `1px solid ${tab.id === "before" ? "rgba(248,113,113,0.3)" : "rgba(169,221,211,0.3)"}` : "1px solid transparent",
              transition: "all 0.25s ease", letterSpacing: ".05em", whiteSpace: "nowrap",
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main panel */}
        <div style={{
          display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden",
          background: isBefore ? "rgba(248,113,113,0.02)" : "rgba(169,221,211,0.015)",
          transition: "background 0.7s ease",
        }}>
          {/* Canvas panel */}
          <div style={{ position: "relative", height: isMobile ? 280 : 360, borderRight: isMobile ? "none" : "1px solid var(--border)", borderBottom: isMobile ? "1px solid var(--border)" : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }}/>
            {/* Score overlay when "after" */}
            {!isBefore && (
              <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", border: "1px solid rgba(169,221,211,0.25)", borderRadius: 10, padding: "8px 20px", textAlign: "center", whiteSpace: "nowrap" }}>
                <div style={{ fontSize: 9, letterSpacing: ".2em", color: "rgba(169,221,211,0.6)", marginBottom: 2 }}>REPUTATION SCORE</div>
                <div style={{ fontSize: 22, fontWeight: 200, color: "#a9ddd3", letterSpacing: "-0.03em", fontFamily: "'Inter',sans-serif" }}>{score} <span style={{ fontSize: 10, opacity: 0.5 }}>/ 1000</span></div>
              </div>
            )}
            {/* "FRAGILE" watermark when "before" */}
            {isBefore && (
              <div style={{ position: "absolute", top: 16, right: 16, fontSize: 9, letterSpacing: ".25em", color: "rgba(248,113,113,0.35)", fontWeight: 700, border: "1px solid rgba(248,113,113,0.15)", borderRadius: 4, padding: "3px 8px" }}>
                FRAGILE SYSTEM
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div style={{ padding: isMobile ? "28px 24px" : "44px 40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: 10, letterSpacing: ".25em", color: isBefore ? "#f87171" : "#a9ddd3", marginBottom: 18, fontWeight: 700, transition: "color 0.5s" }}>
              {isBefore ? "BEFORE · PROBLEM STATE" : "WITH VOLUND RRS · SOLVED"}
            </div>
            <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 200, letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: 12 }}>
              {isBefore ? <>Your wallet is<br/><span style={{ color: "#f87171", fontWeight: 600 }}>a stranger.</span></>
                       : <>Your score<br/><span style={{ color: "#a9ddd3", fontWeight: 600 }}>speaks for you.</span></>}
            </div>
            <p style={{ fontSize: 12, opacity: 0.5, lineHeight: 1.8, marginBottom: 24 }}>
              {isBefore ? "6 protocols. 6 separate trust checks. Latency compounds. Costs multiply. And you still get blocked."
                        : "Connect once. Every Rialo protocol reads your score natively. Composable. Zero middleware."}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(isBefore ? [
                { icon: "✗", t: "No shared reputation layer", s: "each protocol re-verifies from scratch" },
                { icon: "✗", t: "300%+ collateral required", s: "anonymous wallets = max risk tier" },
                { icon: "✗", t: "KYC friction on every app", s: "+$8–20 per verification" },
                { icon: "✗", t: "Blocked from IPC & rate tiers", s: "no trust → no access" },
              ] : [
                { icon: "✓", t: "One universal score", s: "computed once, read by all protocols" },
                { icon: "✓", t: "IPC access unlocked", s: "score ≥ 500 → full Rialo access" },
                { icon: "✓", t: "Collateral drops to 125%", s: "Elite tier earns best capital efficiency" },
                { icon: "✓", t: "Composable & queryable", s: "any protocol calls it natively, no oracles" },
              ]).map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 12px", borderRadius: 8,
                  background: isBefore ? "rgba(248,113,113,0.04)" : "rgba(169,221,211,0.04)",
                  border: `1px solid ${isBefore ? "rgba(248,113,113,0.12)" : "rgba(169,221,211,0.12)"}`,
                  animation: `fade-up 0.35s ${i * 0.07}s ease both`,
                }}>
                  <span style={{ color: isBefore ? "#f87171" : "#4ade80", fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 1 }}>{item.t}</div>
                    <div style={{ fontSize: 10, opacity: 0.45 }}>{item.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom metrics */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 12, marginTop: 14 }}>
          {[
            { label: "INTEGRATION COST", before: "$20 / verification", after: "$0 native call" },
            { label: "COLLATERAL",        before: "300%+ required",     after: "125% with score" },
            { label: "TRUST LATENCY",     before: "3.2s per protocol",  after: "<10ms (onchain read)" },
          ].map((m) => (
            <div key={m.label} style={{
              padding: "16px 20px", borderRadius: 12,
              border: `1px solid ${isBefore ? "rgba(248,113,113,0.12)" : "rgba(169,221,211,0.12)"}`,
              background: isBefore ? "rgba(248,113,113,0.02)" : "rgba(169,221,211,0.03)",
              transition: "all 0.5s ease",
            }}>
              <div style={{ fontSize: 8, letterSpacing: ".2em", opacity: 0.35, marginBottom: 6, fontWeight: 700 }}>{m.label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: isBefore ? "#f87171" : "#a9ddd3", transition: "color 0.5s" }}>
                {isBefore ? m.before : m.after}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
