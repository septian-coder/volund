import { useState } from "react";

export default function GovernancePower({ score, attested, sbt }) {
  const [balance, setBalance] = useState(1000);
  
  // Dynamic Multiplier Path: 
  // Base: 1 + score/1000
  // SBT Bonus: +0.5
  // Attestation Bonus: +0.5
  const baseMult = 1 + (score / 1000);
  const bonus = (sbt ? 0.5 : 0) + (attested ? 0.5 : 0);
  const multiplier = baseMult + bonus;
  const votingPower = Math.floor(balance * multiplier);

  return (
    <div className="glass-panel" style={{
      marginTop: 24,
      padding: "32px",
      borderRadius: 24,
      position: "relative"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", opacity: 0.6 }}>GOVERNANCE LAYER</span>
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 300, marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>Governance Multiplier</h3>
      <p style={{ fontSize: 11, opacity: 0.5, marginBottom: 20, lineHeight: 1.6 }}>
        In Volund-enabled DAOs, your voting weight is amplified by your reputation score.
      </p>

      <div style={{ background: "var(--bg-elevated)", padding: "24px", borderRadius: 16, border: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11, opacity: 0.6 }}>Token Balance</span>
          <span style={{ fontSize: 12, fontWeight: 700 }}>{balance} VOL</span>
        </div>
        <input 
          type="range" 
          min="10" 
          max="10000" 
          step="10"
          value={balance}
          onChange={(e) => setBalance(Number(e.target.value))}
          style={{ width: "100%", accentColor: "var(--accent)", marginBottom: 20, cursor: "pointer" }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 9, opacity: 0.5, letterSpacing: ".1em" }}>REPUTATION MULTIPLIER</div>
            <div style={{ fontSize: 24, fontWeight: 300, color: "var(--accent)" }}>{multiplier.toFixed(2)}x</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, opacity: 0.5, letterSpacing: ".1em" }}>FINAL VOTING POWER</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)" }}>{votingPower.toLocaleString()} VP</div>
          </div>
        </div>
      </div>
    </div>
  );
}
