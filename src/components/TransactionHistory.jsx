import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { VOLUND_REGISTRY, VOLUND_BADGE, VOLUND_SCORE_ORACLE } from "../constants/contracts.json";
import ABIS from "../constants/abis.json";
import { Clock, UserPlus, Award, BarChart2, ExternalLink } from "lucide-react";

const EVENT_TYPES = {
  registration: { icon: <UserPlus size={14} />, label: "Identity Registered", color: "#a9ddd3" },
  badge: { icon: <Award size={14} />, label: "Badge Claimed", color: "#FFD700" },
  score: { icon: <BarChart2 size={14} />, label: "Score Updated", color: "#B0C4DE" },
  poh: { icon: <UserPlus size={14} />, label: "PoH Level Updated", color: "#a9ddd3" },
};

function timeAgo(timestamp) {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function TransactionHistory({ wallet }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!wallet) return;
    fetchHistory(wallet);
  }, [wallet]);

  async function fetchHistory(addr) {
    setLoading(true);
    setError("");

    const isLive = typeof window !== "undefined" && !!window.ethereum;

    try {
      if (!isLive) {
        // Demo mode fallback
        await new Promise(r => setTimeout(r, 800));
        setEvents([
          { type: "registration", txHash: "0xdemo1...abc", timestamp: Math.floor(Date.now()/1000) - 3600, detail: "demo.eth" },
          { type: "badge", txHash: "0xdemo2...def", timestamp: Math.floor(Date.now()/1000) - 1800, detail: "DeFi Dabbler (Common)" },
          { type: "score", txHash: "0xdemo3...ghi", timestamp: Math.floor(Date.now()/1000) - 600, detail: "Score: 420" },
        ]);
        setLoading(false);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const allEvents = [];

      // Query Registration events
      try {
        const registry = new ethers.Contract(VOLUND_REGISTRY, ABIS.VolundRegistry, provider);
        const regFilter = registry.filters.IdentityRegistered(addr);
        const regEvents = await registry.queryFilter(regFilter, -50000);
        for (const ev of regEvents) {
          const block = await ev.getBlock();
          allEvents.push({
            type: "registration",
            txHash: ev.transactionHash,
            timestamp: block.timestamp,
            detail: "Identity registered on Volund"
          });
        }
      } catch (e) { console.warn("Registry events:", e); }

      // Query PoH Level events
      try {
        const registry = new ethers.Contract(VOLUND_REGISTRY, ABIS.VolundRegistry, provider);
        const pohFilter = registry.filters.PohLevelUpdated(addr);
        const pohEvents = await registry.queryFilter(pohFilter, -50000);
        for (const ev of pohEvents) {
          const block = await ev.getBlock();
          allEvents.push({
            type: "poh",
            txHash: ev.transactionHash,
            timestamp: block.timestamp,
            detail: `PoH Level -> ${ev.args?.newLevel || "?"}`
          });
        }
      } catch (e) { console.warn("PoH events:", e); }

      // Query Badge Issued events
      try {
        const badge = new ethers.Contract(VOLUND_BADGE, ABIS.VolundBadge, provider);
        const badgeFilter = badge.filters.Issued(addr);
        const badgeEvents = await badge.queryFilter(badgeFilter, -50000);
        for (const ev of badgeEvents) {
          const block = await ev.getBlock();
          allEvents.push({
            type: "badge",
            txHash: ev.transactionHash,
            timestamp: block.timestamp,
            detail: `Badge: ${ev.args?.badgeId || "unknown"}`
          });
        }
      } catch (e) { console.warn("Badge events:", e); }

      // Query Score Updated events
      try {
        const oracle = new ethers.Contract(VOLUND_SCORE_ORACLE, ABIS.VolundScoreOracle, provider);
        const scoreFilter = oracle.filters.ScoreUpdated(addr);
        const scoreEvents = await oracle.queryFilter(scoreFilter, -50000);
        for (const ev of scoreEvents) {
          const block = await ev.getBlock();
          allEvents.push({
            type: "score",
            txHash: ev.transactionHash,
            timestamp: block.timestamp,
            detail: `Score: ${ev.args?.total || "?"}`
          });
        }
      } catch (e) { console.warn("Score events:", e); }

      // Sort newest first
      allEvents.sort((a, b) => b.timestamp - a.timestamp);
      setEvents(allEvents);
    } catch (err) {
      console.error("History fetch error:", err);
      setError("Failed to fetch on-chain history");
    } finally {
      setLoading(false);
    }
  }

  if (!wallet) return null;

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Clock size={16} color="#a9ddd3" />
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".2em", color: "var(--accent)" }}>ON-CHAIN HISTORY</span>
        </div>
        <button
          onClick={() => fetchHistory(wallet)}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 8,
            background: "rgba(169,221,211,0.08)", border: "1px solid rgba(169,221,211,0.2)",
            color: "var(--accent)", fontSize: 10, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1,
            transition: "all 0.2s"
          }}
        >
          {loading ? "LOADING..." : "REFRESH"}
        </button>
      </div>

      {error && (
        <div style={{ padding: "10px 16px", borderRadius: 10, background: "rgba(255,100,100,0.06)", border: "1px solid rgba(255,100,100,0.2)", color: "#FF6B6B", fontSize: 11, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading && events.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", opacity: 0.4 }}>
          <div style={{ width: 16, height: 16, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
          <div style={{ fontSize: 11, letterSpacing: ".1em" }}>QUERYING EVENTS...</div>
        </div>
      )}

      {!loading && events.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", opacity: 0.3 }}>
          <div style={{ fontSize: 11, letterSpacing: ".1em" }}>NO ON-CHAIN ACTIVITY YET</div>
          <div style={{ fontSize: 10, marginTop: 4 }}>Register, claim badges, or sync your score to appear here.</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {events.map((ev, i) => {
          const config = EVENT_TYPES[ev.type] || EVENT_TYPES.registration;
          return (
            <div key={`${ev.txHash}-${i}`} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 18px", borderRadius: 14,
              background: "rgba(255,255,255,0.015)",
              border: "1px solid var(--border-subtle)",
              transition: "all 0.3s"
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = `${config.color}40`}
              onMouseLeave={e => e.currentTarget.style.borderColor = ""}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: `${config.color}12`, color: config.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0
              }}>
                {config.icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{config.label}</div>
                <div style={{ fontSize: 11, opacity: 0.5, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.detail}</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <span style={{ fontSize: 10, opacity: 0.35, fontFamily: "monospace" }}>{timeAgo(ev.timestamp)}</span>
                <a href={`https://sepolia.basescan.org/tx/${ev.txHash}`} target="_blank" rel="noreferrer"
                  style={{ display: "flex", color: "var(--accent)", opacity: 0.5, transition: "opacity 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "0.5"}
                >
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
}
