import { RS } from "../constants";

const Icons = {
  Bank: ({ color }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M3 10h18"/><path d="M5 6l7-3 7 3"/><path d="M4 10v11"/><path d="M20 10v11"/><path d="M8 14v3"/><path d="M12 14v3"/><path d="M16 14v3"/></svg>
  ),
  Scale: ({ color }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16c0 3.665-2.985 6.5-6 6.5s-6-2.835-6-6.5c0-3.665 2.985-6.5 6-6.5s6 2.835 6 6.5z"/><path d="M12 3v13"/><path d="M7 21l10-10"/><path d="M17 21L7 11"/></svg>
  ),
  Rocket: ({ color }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4.5c1.62-1.63 5-2.5 5-2.5"/><path d="M15 12v5s3.03-.55 4.5-2c1.63-1.62 2.5-5 2.5-5"/></svg>
  ),
  Gas: ({ color }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 22L15 22"/><path d="M4 9L14 9"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2a2 2 0 0 0-2 2v4"/><path d="M5 13h8"/></svg>
  )
};

export default function PerksShowcase({ score, tier, zkVerified, sbt }) {
  const perks = [
    {
      id: "p1",
      label: "Institutional Lending",
      desc: "Unlock undercollateralized loans on Rialo Finance.",
      min: 800,
      icon: "Bank",
      benefit: "LTV up to 95%",
      isLocked: score < 800 && !sbt // SBT can help unlock early
    },
    {
      id: "p2",
      label: "Governance Multiplier",
      desc: "Your vote weight increases based on your credibility.",
      min: 600,
      icon: "Scale",
      benefit: "Up to 2.0x VP",
      isLocked: score < 600
    },
    {
      id: "p3",
      label: "Alpha Access",
      desc: "Priority access to new devnet toolings and testnets.",
      min: 400,
      icon: "Rocket",
      benefit: "Private Alpha",
      isLocked: score < 400 && !zkVerified // ZK Proof required for Alpha
    },
    {
      id: "p4",
      label: "Gas Rebates",
      desc: "Get partial gas fee refunds for participants.",
      min: 500,
      icon: "Gas",
      benefit: "10% Rebate",
      isLocked: score < 500
    }
  ];

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div style={{ width: 12, height: 12, borderRadius: 3, background: "var(--accent)" }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".2em", opacity: 0.6 }}>VOLUND PERKS & UTILITY</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
        {perks.map(p => {
          const unlocked = !p.isLocked;
          const IconComp = Icons[p.icon];
          return (
            <div key={p.id} style={{
              padding: "20px",
              borderRadius: 16,
              background: unlocked ? "rgba(169, 221, 211, 0.05)" : "rgba(255, 255, 255, 0.02)",
              border: `1px solid ${unlocked ? "rgba(169, 221, 211, 0.2)" : "var(--border)"}`,
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s ease",
              opacity: unlocked ? 1 : 0.6
            }}>
              {!unlocked && (
                <div style={{ position: "absolute", top: 12, right: 12, fontSize: 10, padding: "2px 8px", background: "rgba(255,255,255,0.05)", borderRadius: 4, opacity: 0.5 }}>
                  LOCKED
                </div>
              )}
              {unlocked && (
                <div style={{ position: "absolute", top: 12, right: 12, fontSize: 10, padding: "2px 8px", background: "var(--accent)", color: "var(--bg)", borderRadius: 4, fontWeight: 700 }}>
                  ACTIVE
                </div>
              )}

              <div style={{ marginBottom: 16, opacity: unlocked ? 1 : 0.3 }}>
                <IconComp color={unlocked ? "var(--accent)" : "var(--text)"} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: unlocked ? "var(--text)" : "var(--text)" }}>{p.label}</div>
              <div style={{ fontSize: 11, opacity: 0.5, lineHeight: 1.5, marginBottom: 16 }}>{p.desc}</div>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: unlocked ? "var(--accent)" : "var(--text)", opacity: unlocked ? 1 : 0.3 }}>
                  {p.benefit}
                </div>
                {!unlocked && (
                  <div style={{ fontSize: 9, opacity: 0.4 }}>
                    REQ: {p.min} PTS 
                    {p.id === "p3" && <div style={{ color: "var(--accent)", marginTop: 4, fontWeight: 700 }}>OR ZK-REP PROOF</div>}
                    {p.id === "p1" && <div style={{ color: "var(--accent)", marginTop: 4, fontWeight: 700 }}>OR SBT PASSPORT</div>}
                  </div>
                )}
                {unlocked && (score < p.min) && (
                  <div style={{ fontSize: 9, color: "var(--accent)", fontWeight: 700 }}>
                    {p.id === "p3" ? "UNLOCKED BY ZK-REP" : "UNLOCKED BY SBT"}
                  </div>
                )}
                {unlocked && (score >= p.min) && (
                  <div style={{ fontSize: 9, opacity: 0.4 }}>SCORE REQUIREMENT MET</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
