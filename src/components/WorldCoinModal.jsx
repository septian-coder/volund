import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * WorldCoinModal
 * Mock World ID verification flow.
 * Note: Only the QR card is allowed to be white (#f5f5f5).
 */
export default function WorldCoinModal({ isOpen, onClose, onVerify }) {
  const [step, setStep] = useState(1); // 1: Info, 2: QR, 3: Verifying, 4: Success

  const handleVerify = () => {
    setStep(3);
    setTimeout(() => {
      setStep(4);
      setTimeout(() => {
        onVerify();
        onClose();
      }, 1500);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(1,1,1,0.9)", backdropFilter: "blur(12px)"
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(169,221,211,0.2)",
          borderRadius: "24px",
          padding: "40px",
          width: "100%",
          maxWidth: "420px",
          textAlign: "center",
          position: "relative",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)"
        }}
      >
        <button 
          onClick={onClose}
          style={{
            position: "absolute", top: 24, right: 24,
            background: "none", border: "none", color: "#706b61",
            cursor: "pointer", fontSize: 20
          }}
        >✕</button>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ 
                width: 64, height: 64, borderRadius: "50%", background: "#6BE75F22", 
                display: "flex", alignItems: "center", justifyContent: "center", 
                margin: "0 auto 24px", border: "1px solid #6BE75F44"
              }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#6BE75F" }} />
              </div>
              <h3 style={{ fontSize: 24, color: "#e8e3d5", marginBottom: 16, fontFamily: "'Syne', sans-serif" }}>World ID Verification</h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 32 }}>
                Prove your unique personhood without sharing any private data. Unlocks Level 3 PoH status and lifts your score cap to 850.
              </p>
              <button 
                onClick={() => setStep(2)}
                className="premium-button"
                style={{ width: "100%", height: 48, background: "#6BE75F", color: "#010101", fontWeight: 700 }}
              >
                Verify with World ID
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h3 style={{ fontSize: 18, color: "#e8e3d5", marginBottom: 24 }}>Scan with World App</h3>
              
              {/* White QR Card - The specific allowed white element */}
              <div 
                onClick={handleVerify}
                style={{
                  background: "#f5f5f5",
                  width: "100%",
                  aspectRatio: "1/1",
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  padding: "32px",
                  marginBottom: 24,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
                }}
              >
                {/* Mock QR logic */}
                <div style={{ 
                  display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4, width: "100%", height: "100%" 
                }}>
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div key={i} style={{ 
                      background: Math.random() > 0.7 ? "#010101" : "transparent",
                      borderRadius: 1
                    }} />
                  ))}
                </div>
              </div>
              <p style={{ fontSize: 11, opacity: 0.5, fontStyle: "italic" }}>
                Tap the QR code to simulate a successful scan
              </p>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ 
                width: 64, height: 64, borderRadius: "50%", border: "2px solid #6BE75F",
                borderTopColor: "transparent", animation: "spin 1s linear infinite",
                margin: "0 auto 32px"
              }} />
              <h3 style={{ fontSize: 20, color: "#e8e3d5", marginBottom: 12 }}>Authenticating...</h3>
              <p style={{ fontSize: 12, opacity: 0.5 }}>Verifying unique human signature from World ID Protocol</p>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <div style={{ 
                width: 64, height: 64, borderRadius: "50%", background: "var(--accent)", 
                display: "flex", alignItems: "center", justifyContent: "center", 
                margin: "0 auto 32px", color: "#010101", fontSize: 32
              }}>✓</div>
              <h3 style={{ fontSize: 24, color: "var(--accent)", marginBottom: 12, fontWeight: 700 }}>Verified!</h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Humanity confirmed. Leveling up to PoH Level 3.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
