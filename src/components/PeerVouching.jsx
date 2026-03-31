import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * PeerVouching
 * Level 4 requirements: 3 vouches from reputable wallets (score > 400).
 */
export default function PeerVouching({ vouches = [], onVouchRequested, onVouchSomeone }) {
  const [addressInput, setAddressInput] = useState("");
  const [vouching, setVouching] = useState(false);
  
  const slots = [0, 1, 2];
  const filledCount = vouches.length;

  const handleVouchSubmit = async (e) => {
    e.preventDefault();
    if (!addressInput) return;
    setVouching(true);
    try {
      await onVouchSomeone(addressInput);
      setAddressInput("");
    } catch (err) {
      console.error("Vouch UI error:", err);
    } finally {
      setVouching(false);
    }
  };

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        <span>Level 4: Decentralized Trust</span>
        <span style={{ color: "var(--accent)", fontSize: 11 }}>{filledCount}/3 Slots filled</span>
      </div>

      {/* Slots */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {slots.map(i => {
          const v = vouches[i];
          return (
            <div 
              key={i}
              style={{
                aspectRatio: "1/1",
                borderRadius: "16px",
                border: v ? "1px solid var(--accent-border)" : "1px dashed rgba(255,255,255,0.1)",
                background: v ? "var(--bg-elevated)" : "transparent",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "8px"
              }}
            >
              {v ? (
                <>
                  <div style={{ fontSize: 9, opacity: 0.5, marginBottom: 4 }}>{v.address.slice(0, 4)}...{v.address.slice(-3)}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>{v.score}</div>
                  <div style={{ fontSize: 8, opacity: 0.3, marginTop: 4 }}>{v.date || "Verified"}</div>
                </>
              ) : (
                <div style={{ fontSize: 16, opacity: 0.1 }}>+</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button 
          onClick={onVouchRequested}
          className="premium-button"
          style={{ width: "100%", justifyContent: "center" }}
        >
          Generate Request Link
        </button>

        <div style={{ 
          marginTop: 8, 
          padding: "16px", 
          borderRadius: "12px", 
          background: "rgba(255,255,255,0.02)",
          border: "1px solid var(--border-subtle)"
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, marginBottom: 12 }}>VOUCH FOR SOMEONE</div>
          <form onSubmit={handleVouchSubmit} style={{ display: "flex", gap: 8 }}>
            <input 
              type="text" 
              placeholder="0x..." 
              value={addressInput}
              onChange={e => setAddressInput(e.target.value)}
              style={{
                flex: 1,
                background: "#010101",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                padding: "8px 12px",
                color: "var(--text-primary)",
                fontSize: 12,
                outline: "none",
                fontFamily: "monospace"
              }}
            />
            <button 
              type="submit"
              disabled={vouching || !addressInput}
              style={{
                background: "var(--accent)",
                color: "#010101",
                border: "none",
                borderRadius: "8px",
                padding: "0 16px",
                fontSize: 11,
                fontWeight: 800,
                cursor: "pointer",
                opacity: (vouching || !addressInput) ? 0.3 : 1
              }}
            >
              {vouching ? "..." : "VOUCH"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
