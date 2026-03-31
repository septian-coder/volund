import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * TierUpgradeCelebration
 * High-impact full-screen overlay for tier transitions.
 */
export default function TierUpgradeCelebration({ isOpen, tier, onClose, score, wallet }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = [];
    const particleCount = 60;

    class Particle {
      constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = 2 + Math.random() * 8;
        this.vX = Math.cos(this.angle) * this.speed;
        this.vY = Math.sin(this.angle) * this.speed;
        this.size = 2 + Math.random() * 3;
        this.alpha = 1;
        this.decay = 0.01 + Math.random() * 0.02;
        this.color = "#a9ddd3";
      }

      update() {
        this.x += this.vX;
        this.y += this.vY;
        this.alpha -= this.decay;
        this.vY += 0.05; // Gravity
      }

      draw() {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    let animationId;
    const animateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles = particles.filter(p => p.alpha > 0);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      if (particles.length > 0) {
        animationId = requestAnimationFrame(animateParticles);
      }
    };

    animateParticles();
    return () => cancelAnimationFrame(animationId);
  }, [isOpen]);

  const shareText = `Just hit ${tier.toUpperCase()} on @VolundScore / @RialoHQ 🌊\n${Math.round(score)}/1000 pts — building real on-chain rep.\n#Rialo #Volund #BuildOnRialo`;
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  const privileges = {
    "volund": ["Priority Airdrop Access", "Governance Voting Multiplier (2x)", "Flash Loan Fee Reduction"],
    "diamond": ["Exclusive DeFi Pools", "DAO Proposal Access", "Advanced API Keys"],
    "platinum": ["Badge Renewal Discount", "Social Hub Access", "Entry to Volund Alpha"],
    "gold": ["Enhanced Wallet Analytics", "Community Badge Unlocks", "Standard DeFi Access"],
    "silver": ["Basic Score Tracking", "Social Verification", "Initial Badge Eligibility"],
    "bronze": ["Entry Level Tracking", "Community Member Status"],
    "unverified": ["Join the Volund network"]
  }[tier.toLowerCase()] || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 12000,
            background: "rgba(1, 1, 1, 0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          <canvas 
            ref={canvasRef} 
            style={{ 
              position: "absolute", 
              top: 0, 
              left: 0, 
              width: "100%", 
              height: "100%",
              pointerEvents: "none"
            }} 
          />

          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 180, 
              damping: 18, 
              delay: 0.2 
            }}
            style={{
              width: 120,
              height: 120,
              borderRadius: 32,
              background: "#a9ddd3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              boxShadow: "0 0 80px rgba(169, 221, 211, 0.4)",
              marginBottom: 40
            }}
          >
            ⭐
          </motion.div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              fontSize: 48,
              fontWeight: 300,
              fontFamily: "'Syne', sans-serif",
              color: "#a9ddd3",
              textAlign: "center",
              marginBottom: 16
            }}
          >
            Welcome to {tier.toUpperCase()}!
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              fontSize: 16,
              color: "#e8e3d5",
              fontFamily: "'Space Mono', monospace",
              opacity: 0.8,
              marginBottom: 48
            }}
          >
            You've unlocked new governance and DeFi privileges.
          </motion.p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 60 }}>
            {privileges.map((p, i) => (
              <motion.div
                key={p}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontSize: 14,
                  color: "#e8e3d5",
                  fontFamily: "'Inter', sans-serif"
                }}
              >
                <span style={{ color: "#a9ddd3" }}>✦</span> {p}
              </motion.div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            <motion.a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: "16px 32px",
                background: "transparent",
                border: "1px solid #a9ddd3",
                borderRadius: 12,
                color: "#a9ddd3",
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              SHARE ON X
            </motion.a>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: "16px 48px",
                background: "#a9ddd3",
                border: "none",
                borderRadius: 12,
                color: "#010101",
                fontSize: 14,
                fontWeight: 900,
                cursor: "pointer"
              }}
            >
              CONTINUE
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
