import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ethers } from "ethers";
import { VOLUND_ACCESS_GATE, VOLUND_SCORE_ORACLE } from "../constants/contracts.json";
import ABIS from "../constants/abis.json";
import { Shield, Zap, Vote, Coins, Lock, Unlock, ExternalLink, RefreshCcw } from "lucide-react";

// ── Mock Lending Protocols ────────────────────────────────────────────────────
const PROTOCOLS = [
  {
    id: "aave-fork",
    name: "Rialo Lending",
    desc: "Institutional-grade undercollateralized lending powered by Volund reputation.",
    icon: <Coins size={20} strokeWidth={1.5} />,
    gates: [
      { label: "Standard Pool — 12% APY", minScore: 0, color: "#888" },
      { label: "Verified Pool — 8% APY", minScore: 300, color: "#B0C4DE" },
      { label: "Premium Pool — 4.5% APY", minScore: 600, color: "#a9ddd3" },
      { label: "Uncollateralized — 2.1% APY", minScore: 850, color: "#FFD700", badge: "b8" },
    ]
  },
  {
    id: "governance",
    name: "VolundDAO Governance",
    desc: "On-chain voting power weighted by your Volund reputation score.",
    icon: <Vote size={20} strokeWidth={1.5} />,
    gates: [
      { label: "View Proposals", minScore: 0, color: "#888" },
      { label: "Cast Vote (1x weight)", minScore: 200, color: "#B0C4DE" },
      { label: "Create Proposals", minScore: 500, color: "#a9ddd3" },
      { label: "Veto Power (5x weight)", minScore: 900, color: "#FFD700" },
    ]
  },
  {
    id: "launchpad",
    name: "Volund Launchpad",
    desc: "Priority allocation for new token launches based on reputation tier.",
    icon: <Zap size={20} strokeWidth={1.5} />,
    gates: [
      { label: "Public Sale Access", minScore: 0, color: "#888" },
      { label: "Guaranteed Alloc — $500", minScore: 400, color: "#B0C4DE" },
      { label: "Priority Alloc — $2,000", minScore: 700, color: "#a9ddd3" },
      { label: "Whale Alloc — $10,000", minScore: 950, color: "#FFD700" },
    ]
  }
];

import { useAccount } from "wagmi";
import { useReputation } from "../context/useReputation";
import { calculateScore as calcScore } from "../utils/scoreCalculator";

export default function DemoEligibleAccess() {
  const [loading, setLoading] = useState(false);
  const [oraclePhase, setOraclePhase] = useState("idle"); // idle | querying | fetched | done
  const [selectedProtocol, setSelectedProtocol] = useState(PROTOCOLS[0]);
  const [error, setError] = useState("");

  const { 
    social, 
    pohLevel, 
    onchainScore,
    localScore,
    computed,
    syncScoreOnchain,
    scoreSyncing
  } = useReputation();

  const { address: wallet } = useAccount();

  async function handleSync() {
    if (!wallet || !computed) return;
    try {
      const scoresObj = {
        total: computed.total,
        onchain: computed.categories.find(c => c.id === 'onchain')?.score || 0,
        defi: computed.categories.find(c => c.id === 'defi')?.score || 0,
        identity: computed.categories.find(c => c.id === 'identity')?.score || 0,
        social: computed.categories.find(c => c.id === 'community')?.score || 0,
        badges: computed.categories.find(c => c.id === 'badges')?.score || 0
      };
      await syncScoreOnchain(wallet, scoresObj);
    } catch(err) {
      console.error("Sync failed:", err);
    }
  }

  async function queryAccessGate() {
    setError("");
    setOraclePhase("querying");
    setLoading(true);

    try {
      if (wallet) {
        await new Promise(r => setTimeout(r, 800)); // Dramatic pause
        setOraclePhase("fetched");
        await new Promise(r => setTimeout(r, 600));
        setOraclePhase("done");
      } else {
        // Demo fallback
        await new Promise(r => setTimeout(r, 1200));
        setOraclePhase("fetched");
        await new Promise(r => setTimeout(r, 800));
        setOraclePhase("done");
      }
    } catch (err) {
      console.error("AccessGate read failed:", err);
      setError("Contract read failed.");
      setOraclePhase("done");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (wallet) queryAccessGate();
  }, [wallet]);

  const liveScore = wallet ? onchainScore : 420; // Use global onchainScore or demo score
  const scoreDisplay = oraclePhase === "done" ? liveScore : "—";

  return (
    <div style={{ padding: "20px 0", color: "var(--text)" }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Shield size={16} strokeWidth={2} color="#a9ddd3" />
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".2em", color: "var(--accent)" }}>PROTOCOL SHOWCASE</span>
        </div>
        <h2 style={{ fontSize: 32, fontWeight: 300, fontFamily: "'Syne', sans-serif", marginBottom: 12, letterSpacing: "-0.02em" }}>
          Third-Party Integration Demo
        </h2>
        <p style={{ fontSize: 14, opacity: 0.5, maxWidth: 600, lineHeight: 1.7 }}>
          This is how external protocols read your Volund score directly from the blockchain via the <code style={{ color: "var(--accent)", fontSize: 12 }}>VolundAccessGate</code> smart contract on Base Sepolia.
        </p>
      </div>

      {/* ── Live Oracle Status Panel ──────────────────────────────────────── */}
      <div className="glass-panel" style={{
        padding: "24px 32px",
        borderRadius: 20,
        marginBottom: 32,
        border: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 20,
        background: oraclePhase === "done" ? "rgba(169,221,211,0.03)" : "var(--bg-secondary)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <AnimatePresence mode="wait">
            {oraclePhase === "idle" && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#666" }} />
                <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.4, letterSpacing: ".1em" }}>ORACLE STANDBY</span>
              </motion.div>
            )}
            {oraclePhase === "querying" && (
              <motion.div key="querying" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>Reading VolundAccessGate...</span>
              </motion.div>
            )}
            {oraclePhase === "fetched" && (
              <motion.div key="fetched" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#a9ddd3", animation: "pulse 1s infinite" }} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>Decoding contract response...</span>
              </motion.div>
            )}
            {oraclePhase === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#a9ddd3", boxShadow: "0 0 8px rgba(169,221,211,0.6)" }} />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".15em", color: "var(--accent)", marginBottom: 2 }}>ON-CHAIN SCORE</div>
                  <div style={{ fontSize: 28, fontWeight: 300, fontFamily: "'Syne', sans-serif" }}>{scoreDisplay}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {wallet && (
            <div style={{ fontSize: 11, fontFamily: "monospace", opacity: 0.3 }}>
              {wallet.slice(0, 6)}...{wallet.slice(-4)}
            </div>
          )}
          <button
            onClick={queryAccessGate}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 10,
              background: "rgba(169,221,211,0.1)", border: "1px solid rgba(169,221,211,0.3)",
              color: "var(--accent)", fontSize: 10, fontWeight: 800, letterSpacing: ".08em",
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1,
              transition: "all 0.2s"
            }}
          >
            <RefreshCcw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            {loading ? "READING..." : "RE-QUERY"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 20px", borderRadius: 12, background: "rgba(255,100,100,0.06)", border: "1px solid rgba(255,100,100,0.3)", color: "#FF6B6B", fontSize: 12, marginBottom: 24, fontWeight: 600 }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Contract Address Reference ─────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
        <a href={`https://sepolia.basescan.org/address/${VOLUND_ACCESS_GATE}`} target="_blank" rel="noreferrer"
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, background: "rgba(169,221,211,0.05)", border: "1px solid var(--border-subtle)", color: "var(--accent)", fontSize: 10, fontWeight: 700, letterSpacing: ".05em", textDecoration: "none", transition: "all 0.2s" }}>
          <ExternalLink size={10} /> AccessGate Contract
        </a>
        <a href={`https://sepolia.basescan.org/address/${VOLUND_SCORE_ORACLE}`} target="_blank" rel="noreferrer"
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, background: "rgba(169,221,211,0.05)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", fontSize: 10, fontWeight: 700, letterSpacing: ".05em", textDecoration: "none", transition: "all 0.2s" }}>
          <ExternalLink size={10} /> ScoreOracle Contract
        </a>
      </div>

      {/* ── Protocol Selector ──────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 32, overflowX: "auto", scrollbarWidth: "none" }}>
        {PROTOCOLS.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedProtocol(p)}
            style={{
              padding: "14px 24px", borderRadius: 16,
              background: selectedProtocol.id === p.id ? "rgba(169,221,211,0.08)" : "transparent",
              border: selectedProtocol.id === p.id ? "1px solid var(--accent)" : "1px solid var(--border-subtle)",
              color: selectedProtocol.id === p.id ? "var(--accent)" : "var(--text-secondary)",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 10,
              transition: "all 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
              whiteSpace: "nowrap",
              boxShadow: selectedProtocol.id === p.id ? "0 0 16px rgba(169,221,211,0.1)" : "none"
            }}
          >
            {p.icon} {p.name}
          </button>
        ))}
      </div>

      {/* ── Sync Warning ──────────────────────────────────────────────── */}
      {localScore > onchainScore && (
        <div style={{ padding: "16px 24px", borderRadius: 16, background: "rgba(169,221,211,0.05)", border: "1px solid var(--accent)", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>
            Your on-chain score ({onchainScore}) is lower than your current potential ({localScore}). Sync now to unlock more protocols.
          </div>
          <button 
            onClick={handleSync}
            disabled={scoreSyncing}
            style={{ 
              padding: "10px 20px", borderRadius: 10, background: "var(--accent)", color: "var(--bg)", border: "none", fontSize: 11, fontWeight: 800, cursor: scoreSyncing ? "not-allowed" : "pointer", opacity: scoreSyncing ? 0.6 : 1, transition: "all 0.2s" 
            }}
          >
            {scoreSyncing ? "SYNCING..." : "SYNC NOW"}
          </button>
        </div>
      )}

      {/* ── Selected Protocol Detail ───────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedProtocol.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="glass-panel" style={{ padding: 32, borderRadius: 24, border: "1px solid var(--border-subtle)", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(169,221,211,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}>
                {selectedProtocol.icon}
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{selectedProtocol.name}</h3>
                <p style={{ fontSize: 12, opacity: 0.5, margin: 0 }}>{selectedProtocol.desc}</p>
              </div>
            </div>
          </div>

          {/* ── Access Tiers ───────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {selectedProtocol.gates.map((gate, idx) => {
              const checkScore = oraclePhase === "done" ? liveScore : null;
              const isUnlocked = checkScore !== null && checkScore >= gate.minScore;
              const pointsNeeded = checkScore !== null ? Math.max(0, gate.minScore - checkScore) : null;
              const isHighest = idx === selectedProtocol.gates.length - 1;

              return (
                <motion.div
                  key={gate.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.4 }}
                  style={{
                    padding: "20px 28px",
                    borderRadius: 16,
                    background: isUnlocked
                      ? "rgba(169,221,211,0.05)"
                      : "rgba(255,255,255,0.01)",
                    border: isUnlocked
                      ? `1px solid ${gate.color}40`
                      : "1px solid var(--border-subtle)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    transition: "all 0.4s ease",
                    position: "relative",
                    overflow: "hidden"
                  }}
                >
                  {/* Glow bar for unlocked */}
                  {isUnlocked && (
                    <div style={{
                      position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                      background: gate.color,
                      boxShadow: `0 0 12px ${gate.color}80`
                    }} />
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 10,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: isUnlocked ? `${gate.color}15` : "rgba(255,255,255,0.03)",
                      color: isUnlocked ? gate.color : "var(--text-secondary)",
                      transition: "all 0.3s"
                    }}>
                      {isUnlocked ? <Unlock size={16} strokeWidth={2} /> : <Lock size={14} strokeWidth={2} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: isUnlocked ? "var(--text)" : "var(--text-secondary)", opacity: isUnlocked ? 1 : 0.5 }}>
                        {gate.label}
                      </div>
                      <div style={{ fontSize: 10, opacity: 0.4, marginTop: 2 }}>
                        {gate.minScore === 0 ? "No minimum score" : `Requires ${gate.minScore}+ Volund Score`}
                        {gate.badge ? " + Legendary Badge" : ""}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {/* Progress indicator */}
                    {checkScore !== null && !isUnlocked && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 10, color: "#FF6B6B", fontWeight: 700 }}>
                          +{pointsNeeded} pts needed
                        </div>
                        <div style={{
                          width: 80, height: 3, borderRadius: 2,
                          background: "rgba(255,255,255,0.05)", marginTop: 4,
                          overflow: "hidden"
                        }}>
                          <div style={{
                            width: `${Math.min(100, (checkScore / gate.minScore) * 100)}%`,
                            height: "100%", borderRadius: 2,
                            background: `linear-gradient(90deg, ${gate.color}60, ${gate.color})`,
                            transition: "width 0.8s ease"
                          }} />
                        </div>
                      </div>
                    )}

                    <div style={{
                      padding: "6px 14px", borderRadius: 8,
                      fontSize: 10, fontWeight: 800, letterSpacing: ".1em",
                      background: isUnlocked ? `${gate.color}15` : "rgba(255,255,255,0.02)",
                      color: isUnlocked ? gate.color : "var(--text-secondary)",
                      border: `1px solid ${isUnlocked ? gate.color + "40" : "var(--border-subtle)"}`,
                      opacity: isUnlocked ? 1 : 0.4
                    }}>
                      {isUnlocked ? "UNLOCKED" : "LOCKED"}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ── How It Works (Code snippet) ────────────────────────────── */}
          <div style={{ marginTop: 32, padding: 24, borderRadius: 16, background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".15em", color: "var(--accent)", marginBottom: 16 }}>
              HOW PROTOCOLS INTEGRATE — SOLIDITY
            </div>
            <pre style={{
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontSize: 12, lineHeight: 1.8,
              color: "var(--text-secondary)", margin: 0,
              overflowX: "auto", whiteSpace: "pre",
              scrollbarWidth: "thin"
            }}>
{`// Any protocol can read Volund scores permissionlessly
IVolundAccessGate gate = IVolundAccessGate(
  ${VOLUND_ACCESS_GATE}
);

// Simple eligibility check
(bool eligible, string memory reason) = gate.isEligible(
  msg.sender,    // borrower wallet
  ${selectedProtocol.gates[2]?.minScore || 500}              // minimum score for premium tier
);

require(eligible, reason);
// → Grant undercollateralized loan access`}
            </pre>
          </div>
        </motion.div>
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}} />
    </div>
  );
}
