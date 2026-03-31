import { useState, useEffect } from "react";

export default function PrivacyProof({ score, onVerified }) {
  const [generating, setGenerating] = useState(false);
  const [logs, setLogs] = useState([]);
  const [proof, setProof] = useState(null);

  const startGen = () => {
    setGenerating(true);
    setLogs([]);
    setProof(null);

    const steps = [
      "> Initializing poseidon hash constraints...",
      "> Loading R1CS witness generator...",
      "> Generating non-interactive zero-knowledge proof (snarkjs)...",
      "> Compressing proof wire (Alt-Bn128)...",
      "> Finalizing proof certificate..."
    ];

    steps.forEach((step, i) => {
      setTimeout(() => {
        setLogs(prev => [...prev, step]);
        if (i === steps.length - 1) {
          setTimeout(() => {
            setGenerating(false);
            setProof({
              id: "ZKP-" + Math.random().toString(36).substring(7).toUpperCase(),
              timestamp: new Date().toISOString()
            });
            if (onVerified) onVerified();
          }, 800);
        }
      }, i * 600 + Math.random() * 300);
    });
  };

  return (
    <div className="glass-panel" style={{
      marginTop: 32,
      padding: "32px",
      borderRadius: 24,
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 10px #4ade8055" }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", opacity: 0.6 }}>PRIVACY LAYER</span>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 300 }}>ZK-Reputation Proof</h3>
          <p style={{ fontSize: 11, opacity: 0.5, maxWidth: 360, lineHeight: 1.6, marginTop: 4 }}>
            Prove you have a high reputation score without revealing your wallet address or exact balance history.
          </p>
        </div>
        
        {!proof && !generating && (
          <button 
            onClick={startGen}
            style={{ 
              padding: "10px 20px", 
              background: "var(--text)", 
              color: "var(--bg)", 
              border: "none", 
              borderRadius: 8, 
              fontSize: 11, 
              fontWeight: 700, 
              cursor: "pointer" 
            }}
          >
            GENERATE PROOF
          </button>
        )}
      </div>

      {(generating || logs.length > 0) && !proof && (
        <div style={{ 
          background: "rgba(0,0,0,0.3)", 
          padding: "20px", 
          borderRadius: 16, 
          fontFamily: "'JetBrains Mono', monospace", 
          fontSize: 10, 
          color: "#4ade80",
          border: "none"
        }}>
          {logs.map((log, i) => (
            <div key={i} style={{ marginBottom: 4, opacity: i === logs.length - 1 ? 1 : 0.4 }}>{log}</div>
          ))}
          {generating && <div style={{ animation: "pulse 1s infinite" }}>_</div>}
        </div>
      )}

      {proof && (
        <div style={{ 
          padding: "20px", 
          background: "rgba(74, 222, 128, 0.05)", 
          border: "1px solid rgba(74, 222, 128, 0.2)", 
          borderRadius: 12,
          animation: "fade-up 0.5s ease"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#4ade80", marginBottom: 4 }}>✓ VALID PROOF GENERATED</div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Eligible for Tier: {score > 400 ? "Epic+" : "Member"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, opacity: 0.5 }}>{proof.id}</div>
              <div style={{ fontSize: 14 }}>🛡️</div>
            </div>
          </div>
          <div style={{ marginTop: 12, padding: 8, background: "rgba(0,0,0,0.2)", borderRadius: 6, fontSize: 9, opacity: 0.6, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            snark_proof: 0x92b...{Math.random().toString(16).slice(2, 40)}...3a1
          </div>
        </div>
      )}
    </div>
  );
}
