import { useState } from "react";
import { motion } from "framer-motion";

export default function SoulboundMint({ score, wallet, onMinted }) {
  const [minting, setMinting] = useState(false);
  const [minted, setMinted] = useState(false);

  const handleMint = async () => {
    setMinting(true);
    // Mimic the 1.5s delay from the connect flow
    await new Promise(r => setTimeout(r, 1500));
    
    setMinted(true);
    setMinting(false);
    if (onMinted) onMinted();
    console.log("SoulboundMint called");
  };

  return (
    <div style={{
      background: "#010101",
      border: "1px solid rgba(169, 221, 211, 0.15)",
      borderRadius: "24px",
      padding: "40px 32px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      minHeight: "180px",
      transition: "all 0.5s ease"
    }}>
      {!minted ? (
        <>
          <div style={{ fontSize: 10, fontWeight: 800, color: "var(--accent)", letterSpacing: "0.2em", marginBottom: 4 }}>PERSISTENT REPUTATION</div>
          <h3 style={{ fontSize: 18, fontWeight: 300, color: "#e8e3d5", margin: 0, fontFamily: "'Syne', sans-serif" }}>Soulbound Passport</h3>
          <p style={{ fontSize: 11, color: "#b8b3a7", opacity: 0.6, maxWidth: 240, margin: "0 0 8px" }}>
            Seal your on-chain footprint as a non-transferable identity token.
          </p>
          <button 
            onClick={handleMint}
            disabled={minting}
            style={{ 
              background: "#a9ddd3", 
              color: "#010101", 
              border: "none", 
              padding: "12px 32px", 
              borderRadius: "12px", 
              fontSize: 12, 
              fontWeight: 800, 
              cursor: minting ? "wait" : "pointer",
              transition: "all 0.3s ease",
              opacity: minting ? 0.7 : 1,
              transform: minting ? "scale(0.98)" : "scale(1)"
            }}
          >
            {minting ? "COMMITTING..." : "MINT SBT PASSPORT"}
          </button>
        </>
      ) : (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
        >
          <motion.div
            style={{
              width: 54,
              height: 54,
              borderRadius: "50%",
              background: "rgba(169, 221, 211, 0.1)",
              border: "1px solid rgba(169, 221, 211, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <motion.svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#a9ddd3"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                d="M20 6L9 17L4 12"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: "easeInOut", delay: 0.2 }}
              />
            </motion.svg>
          </motion.div>
          
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#e8e3d5", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Linked to wallet</div>
            <div style={{ color: "#a9ddd3", fontSize: 9, fontWeight: 800, letterSpacing: "0.1em" }}>ID: #VOL-PASSPORT-CONFIRMED</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
