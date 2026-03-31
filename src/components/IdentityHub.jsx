import { useState } from "react";
import { ShieldCheck } from 'lucide-react';
import PlatformCard from "./PlatformCard";
import Tag from "./Tag";

const PLATFORMS = [
  { id: "github", name: "GitHub", impact: "25–60", description: "Verify developer contributions and repository age.", requirements: "Requires account older than 6 months and at least 5 public repositories." },
  { id: "twitter", name: "Twitter / X", impact: "40–70", description: "Establish social footprint and follower trust.", requirements: "Verify follower count and account creation date. Bonus for Verified status." },
  { id: "ens", name: "Basenames", impact: "30", description: "Primary onchain identity via Base Name Service.", requirements: "Auto-detected from wallet. Increases score by 30 points instantly." },
  { id: "discord", name: "Discord", impact: "35–55", description: "Verify community involvement and server roles.", requirements: "Check membership duration and active roles in verified DAOs." },
  { id: "worldcoin", name: "World ID", impact: "150", description: "Proof of Personhood via Orb verification.", requirements: "Requires valid World ID humanness attestation." },
  { id: "farcaster", name: "Farcaster", impact: "Coming Soon", description: "Decentralized social protocol integration.", requirements: "Identity bridging via warpcast soon." },
  { id: "lens", name: "Lens Protocol", impact: "Coming Soon", description: "Social graph verification.", requirements: "Profile NFT verification coming soon." }
];

export default function IdentityHub({ 
  social, 
  onConnect, 
  onDisconnect, 
  connectingId,
  hasENS,
  ensName,
  ensAvatar,
  tab,
  setTab
}) {
  const [simAll, setSimAll] = useState(false);

  // Calculate projected gain: what WOULD be added if all were connected
  const currentSocialPoints = (social.github ? 60 : 0) + 
                             (social.twitter?.connected ? (40 + Math.min(Math.floor((social.twitter.followerCount || 0) / 1000) * 5, 20) + (social.twitter.isVerified ? 10 : 0)) : 0) +
                             (social.discord?.connected ? (35 + Math.min((social.discord.membershipMonths || 0) * 2, 20)) : 0) +
                             (hasENS ? 30 : 0);

  const potentialPoints = 60 + 55 + 51 + 30; // Mock averages
  const projectedGain = Math.max(0, potentialPoints - currentSocialPoints);

  return (
    <div className="stagger-container visible" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Header & Simulation Toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20 }}>
        <div>
          <Tag>identity hub</Tag>
          <h2 style={{ fontSize: 32, fontWeight: 300, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em", marginTop: 12 }}>
            Centralized Verification
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8, opacity: 0.7 }}>
            Connect your off-chain footprints to amplify your on-chain reputation.
          </p>
        </div>

        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 16, 
          padding: "12px 20px", 
          background: "var(--bg-secondary)", 
          borderRadius: 16,
          border: simAll ? "1px solid var(--accent)" : "1px solid var(--border-subtle)",
          boxShadow: simAll ? "0 0 15px var(--accent-glow)" : "none",
          transition: "all 0.3s"
        }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Simulate All Connected</div>
            <div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 800 }}>+{projectedGain} PTS PROJECTED GAIN</div>
          </div>
          <button 
            onClick={() => setSimAll(!simAll)}
            style={{ 
              width: 52, height: 28, borderRadius: 20, 
              background: simAll ? "var(--accent)" : "rgba(255,255,255,0.1)", 
              border: "none", cursor: "pointer", position: "relative",
              transition: "background 0.3s"
            }}
          >
            <div style={{ 
              width: 20, height: 20, borderRadius: "50%", background: "#fff",
              position: "absolute", top: 4, left: simAll ? 28 : 4,
              transition: "left 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
            }} />
          </button>
        </div>
      </div>

      {/* Stats Quick View (if needed) or simple breadcrumb */}
      {simAll && (
        <div style={{ 
          padding: "16px 24px", 
          background: "var(--accent-glow)", 
          borderRadius: 16, 
          border: "1px dashed var(--accent)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 600 }}>
            ✨ All platforms simulated. Visit the <b>Score Simulator</b> for detailed projections.
          </div>
          <button 
            onClick={() => setTab("simulator")}
            style={{ padding: "6px 16px", background: "var(--accent)", border: "none", borderRadius: 8, color: "var(--bg-primary)", fontSize: 10, fontWeight: 800, cursor: "pointer" }}
          >
            OPEN SIMULATOR
          </button>
        </div>
      )}

      {/* Platforms Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
        gap: 20 
      }}>
        {PLATFORMS.map(p => {
          let status = "disconnected";
          let data = null;

          if (p.id === "farcaster" || p.id === "lens") {
            status = "coming_soon";
          } else if (p.id === "ens") {
            const connected = social.ens?.hasENS || hasENS;
            status = connected ? "connected" : "disconnected";
            data = connected ? { handle: social.ens?.domain || ensName || (typeof hasENS === 'string' ? hasENS : null), details: "Verified Domain", isVerifiedChip: true } : null;
          } else if (p.id === "worldcoin") {
            const connected = social.worldcoin?.verified;
            status = connected ? "connected" : "disconnected";
            data = connected ? { details: "World ID Verified" } : null;
          } else if (social[p.id]?.connected) {
            status = "connected";
            data = social[p.id]; 
          }

          return (
            <PlatformCard 
              key={p.id}
              platform={p}
              status={status}
              connecting={connectingId === p.id}
              onConnect={() => onConnect(p.id)}
              onDisconnect={() => onDisconnect(p.id)}
              data={data}
              simulated={simAll && status === "disconnected"}
            />
          );
        })}
      </div>

      {/* Privacy Footer */}
      <div style={{ 
        marginTop: 12, 
        padding: "24px", 
        borderTop: "1px solid var(--border-subtle)", 
        display: "flex", 
        alignItems: "center", 
        gap: 12,
        opacity: 0.5
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShieldCheck size={14} strokeWidth={1.5} color="#a9ddd3" />
        </div>
        <div style={{ fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.5 }}>
          <b>Privacy Assurance:</b> Only public profile data is read during the verification process. 
          Volund never requests access to private DMs, email addresses, or password management.
        </div>
      </div>
    </div>
  );
}
