import { useState, useEffect, useMemo } from "react";
import CountUp from "react-countup";
import {
  calculateScore,
  realDataToSimInput,
  getTier,
  getTierColor,
  getNextTier,
} from "../utils/scoreCalculator";
import { useBreakpoint } from "../hooks/useBreakpoint";

const ACCENT = "#a9ddd3";
const ACCENT_DIM = "#4a9d93";
const ACCENT_GLOW = "rgba(169,221,211,0.15)";
const ACCENT_BORDER = "rgba(169,221,211,0.3)";
const BG_CARD = "#0d0d0d";
const BORDER_SUBTLE = "rgba(232,227,213,0.07)";
const TRACK_EMPTY = "#161616";

// SVG circle ring: stroke = tier color
function ScoreRing({ score, size = 120, strokeWidth = 10 }) {
  const tierColor = getTierColor(score);
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = Math.min(score / 1000, 1);
  const strokeDashoffset = circumference * (1 - progress);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={TRACK_EMPTY}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tierColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.23, 1, 0.32, 1)" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-mono), monospace",
          fontSize: size * 0.22,
          fontWeight: 700,
          color: ACCENT,
        }}
      >
        <CountUp key={Math.round(score)} end={Math.round(score)} duration={1} preserveValue />
      </div>
    </div>
  );
}

const ACTIONS = [
  {
    id: "swap",
    label: "Make $100K DeFi swaps",
    type: "usd",
    key: "swapVolumeUsd",
    getValue: (v) => (v && Number(v) > 0 ? Number(v) : undefined),
  },
  {
    id: "lp",
    label: "LP for 6 months+",
    type: "amount_days",
    keys: ["lpAmount", "lpDays"],
    getValue: (a, d) => {
      const amt = Number(a);
      const days = Number(d);
      if (amt > 0 && days > 0) return { lpAmount: amt, lpDays: days };
      return {};
    },
  },
  {
    id: "github",
    label: "GitHub (6mo + 5 repos)",
    type: "toggle",
    key: "github",
    getValue: (v) => (v ? { github: { connected: true, ageMonths: 7, repos: 6 } } : {}),
  },
  {
    id: "twitter",
    label: "Twitter (1k+ followers)",
    type: "toggle",
    key: "twitter",
    getValue: (v) => (v ? { twitter: { connected: true, followers: 1200 } } : {}),
  },
  {
    id: "poh",
    label: "PoH Level 4",
    type: "toggle",
    key: "pohLevel",
    getValue: (v) => (v ? { pohLevel: 4 } : {}),
  },
  {
    id: "badge_rare",
    label: "Hold Rare Badge",
    type: "toggle",
    key: "rareBadge",
    getValue: (v) => (v ? { rareBadges: 1, badgeCount: 1 } : {}),
  },
  {
    id: "badge_epic",
    label: "Hold Epic Badge",
    type: "toggle",
    key: "epicBadge",
    getValue: (v) => (v ? { epicBadges: 1, badgeCount: 1 } : {}),
  },
  {
    id: "badge_legendary",
    label: "Hold Legendary Badge",
    type: "toggle",
    key: "legendaryBadge",
    getValue: (v) => (v ? { legendaryBadges: 1, badgeCount: 1 } : {}),
  },
  {
    id: "eth",
    label: "Increase ETH balance",
    type: "slider_eth",
    key: "ethBalance",
    getValue: (v) => (v != null ? { ethBalance: Number(v) } : {}),
  },
  {
    id: "age",
    label: "Age your wallet (2yr+)",
    type: "months",
    key: "ageMonths",
    getValue: (v) => (v != null && Number(v) > 0 ? { ageMonths: Number(v) } : {}),
  },
];

function getBestPath(baselineTotal, baselineCategories, nextTier) {
  if (!nextTier || baselineTotal >= nextTier.min) return null;
  const gap = nextTier.min - baselineTotal;
  const byGain = (baselineCategories || [])
    .map((c) => ({ id: c.id, label: c.label, max: c.max - c.score }))
    .filter((x) => x.max > 0)
    .sort((a, b) => b.max - a.max);
  if (byGain.length === 0) return { next: nextTier.name, gap, hint: "Keep building onchain activity." };
  const top = byGain[0];
  return { next: nextTier.name, gap, hint: `Focus on ${top.label} (up to +${top.max} pts).` };
}

export default function ScoreSimulator({ realData, social }) {
  const { isMobile } = useBreakpoint();
  const baselineInput = useMemo(
    () => realDataToSimInput(realData || {}, social || {}),
    [realData, social]
  );
  const baselineResult = useMemo(() => calculateScore(baselineInput), [baselineInput]);
  const currentScore = baselineResult.total;
  const currentTier = getTier(currentScore);

  const [selectedCard, setSelectedCard] = useState(null);
  const [actionValues, setActionValues] = useState({
    swapVolumeUsd: "",
    lpAmount: "",
    lpDays: "",
    github: false,
    twitter: false,
    hasENS: baselineInput.hasENS ?? false,
    rloBalance: baselineInput.rloBalance ?? "",
    pohLevel: baselineInput.pohLevel ?? 0,
    rareBadge: false,
    epicBadge: false,
    legendaryBadge: false,
    defiTxPerMonth: baselineInput.defiTxPerMonth ?? 0,
    ethBalance: baselineInput.ethBalance ?? realData?.balance ?? 0,
    ageMonths: realData?.walletAgeMo ?? baselineInput.ageMonths ?? 0,
  });

  const projectedInput = useMemo(() => {
    const overrides = { ...baselineInput };
    if (actionValues.swapVolumeUsd) {
      const v = Number(actionValues.swapVolumeUsd);
      if (v > 0) overrides.swapVolumeUsd = v;
    }
    if (actionValues.lpAmount && actionValues.lpDays) {
      const amt = Number(actionValues.lpAmount);
      const days = Number(actionValues.lpDays);
      if (amt > 0 && days > 0) {
        overrides.lpAmount = amt;
        overrides.lpDays = days;
      }
    }
    if (actionValues.github) overrides.github = { connected: true, ageMonths: 7, repos: 6 };
    if (actionValues.twitter) overrides.twitter = { connected: true, followers: 1200 };
    if (actionValues.hasENS) overrides.hasENS = true;
    if (actionValues.rloBalance) {
      const v = Number(actionValues.rloBalance);
      if (v > 0) overrides.rloBalance = v;
    }
    if (actionValues.pohLevel === 4 || actionValues.pohLevel === true) overrides.pohLevel = 4;
    
    if (actionValues.rareBadge) {
      overrides.rareBadges = (overrides.rareBadges || 0) + 1;
      overrides.badgeCount = (overrides.badgeCount || 0) + 1;
    }
    if (actionValues.epicBadge) {
      overrides.epicBadges = (overrides.epicBadges || 0) + 1;
      overrides.badgeCount = (overrides.badgeCount || 0) + 1;
    }
    if (actionValues.legendaryBadge) {
      overrides.legendaryBadges = (overrides.legendaryBadges || 0) + 1;
      overrides.badgeCount = (overrides.badgeCount || 0) + 1;
    }

    overrides.defiTxPerMonth = Number(actionValues.defiTxPerMonth) || 0;
    overrides.ethBalance = Number(actionValues.ethBalance) || 0;
    if (actionValues.ageMonths !== "" && actionValues.ageMonths != null) {
      const m = Number(actionValues.ageMonths);
      if (m > 0) overrides.ageMonths = m;
    }
    return overrides;
  }, [baselineInput, actionValues]);

  const projectedResult = useMemo(() => calculateScore(projectedInput), [projectedInput]);
  const projectedScore = projectedResult.total;
  const projectedTier = getTier(projectedScore);
  const delta = Math.round(projectedScore - currentScore);
  const nextTier = getNextTier(currentScore);
  const bestPath = getBestPath(currentScore, baselineResult.categories, nextTier);

  const [copied, setCopied] = useState(false);
  const copyText = `Projecting ${projectedScore} pts on @RialoHQ 🌊 #BuildOnRialo`;

  useEffect(() => {
    if (realData?.balance != null && actionValues.ethBalance === 0)
      setActionValues((prev) => ({ ...prev, ethBalance: Number(realData.balance) || 0 }));
  }, [realData?.balance]);

  const cardStyle = (selected) => ({
    background: BG_CARD,
    border: selected ? `2px solid ${ACCENT}` : `1px solid ${BORDER_SUBTLE}`,
    borderRadius: 8,
    padding: "14px 16px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    ...(selected && { background: "rgba(169,221,211,0.07)" }),
  });

  const deltaPillStyle = {
    padding: "6px 14px",
    borderRadius: 9999,
    background: ACCENT_GLOW,
    border: `1px solid ${ACCENT_BORDER}`,
    color: ACCENT,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.05em",
  };

  return (
    <div style={{ animation: "fade-up 0.6s ease both" }}>
      {/* ── Top: current vs projected score rings ───────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: isMobile ? 24 : 48,
          marginBottom: 40,
          flexWrap: "wrap",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "var(--text-secondary)", letterSpacing: "0.15em", marginBottom: 12 }}>
            CURRENT
          </div>
          <ScoreRing score={currentScore} size={isMobile ? 100 : 140} />
          <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 8 }}>{currentTier}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, color: ACCENT, letterSpacing: "0.15em", marginBottom: 12 }}>
            PROJECTED
          </div>
          <ScoreRing score={projectedScore} size={isMobile ? 100 : 140} />
          <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 8 }}>{projectedTier}</div>
          {delta !== 0 && (
            <div style={{ ...deltaPillStyle, marginTop: 12, display: "inline-block" }}>
              {delta > 0 ? "+" : ""}{delta} pts
            </div>
          )}
        </div>
      </div>

      {/* ── Middle: action selector grid (10 cards) ───────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            fontSize: 10,
            color: "var(--text-secondary)",
            letterSpacing: "0.2em",
            marginBottom: 16,
            fontWeight: 700,
          }}
        >
          SIMULATION ACTIONS
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
            gap: 12,
          }}
        >
          {ACTIONS.map((action) => {
            const selected = selectedCard === action.id;
            const value = actionValues[action.key] ?? actionValues[action.keys?.[0]];
            return (
              <div
                key={action.id}
                style={cardStyle(selected)}
                onClick={() => setSelectedCard(selectedCard === action.id ? null : action.id)}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
                  {action.label}
                </div>
                {action.type === "toggle" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActionValues((prev) => ({ ...prev, [action.key]: !prev[action.key] }));
                    }}
                    style={{
                      padding: "6px 14px",
                      background: value ? ACCENT : "transparent",
                      color: value ? "#010101" : ACCENT,
                      border: `1px solid ${value ? ACCENT : ACCENT_BORDER}`,
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {value ? "ON" : "OFF"}
                  </button>
                )}
                {action.type === "usd" && (
                  <input
                    type="number"
                    placeholder="USD amount"
                    value={actionValues.swapVolumeUsd}
                    onChange={(e) => {
                      e.stopPropagation();
                      setActionValues((prev) => ({ ...prev, swapVolumeUsd: e.target.value }));
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "var(--bg-elevated)",
                      border: `1px solid ${BORDER_SUBTLE}`,
                      borderRadius: 6,
                      color: "var(--text-primary)",
                      fontSize: 12,
                    }}
                  />
                )}
                {action.type === "amount_days" && (
                  <div style={{ display: "flex", gap: 8 }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={actionValues.lpAmount}
                      onChange={(e) => setActionValues((prev) => ({ ...prev, lpAmount: e.target.value }))}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        background: "var(--bg-elevated)",
                        border: `1px solid ${BORDER_SUBTLE}`,
                        borderRadius: 6,
                        color: "var(--text-primary)",
                        fontSize: 12,
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Days"
                      value={actionValues.lpDays}
                      onChange={(e) => setActionValues((prev) => ({ ...prev, lpDays: e.target.value }))}
                      style={{
                        width: 70,
                        padding: "8px 12px",
                        background: "var(--bg-elevated)",
                        border: `1px solid ${BORDER_SUBTLE}`,
                        borderRadius: 6,
                        color: "var(--text-primary)",
                        fontSize: 12,
                      }}
                    />
                  </div>
                )}
                {action.type === "amount" && action.key === "rloBalance" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number"
                      placeholder="RLO amount"
                      value={actionValues.rloBalance}
                      onChange={(e) => setActionValues((prev) => ({ ...prev, rloBalance: e.target.value }))}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        background: "var(--bg-elevated)",
                        border: `1px solid ${BORDER_SUBTLE}`,
                        borderRadius: 6,
                        color: "var(--text-primary)",
                        fontSize: 12,
                      }}
                    />
                    <span style={{ fontSize: 10, color: ACCENT, fontWeight: 700 }}>RLO</span>
                  </div>
                )}
                {action.type === "slider_0_10" && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={actionValues.defiTxPerMonth}
                      onChange={(e) =>
                        setActionValues((prev) => ({ ...prev, defiTxPerMonth: Number(e.target.value) }))
                      }
                      className="sim-slider"
                    />
                    <div style={{ fontSize: 11, color: ACCENT, marginTop: 4 }}>
                      {actionValues.defiTxPerMonth} txs/month
                    </div>
                  </div>
                )}
                {action.type === "slider_eth" && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={0.1}
                      value={actionValues.ethBalance}
                      onChange={(e) =>
                        setActionValues((prev) => ({ ...prev, ethBalance: Number(e.target.value) }))
                      }
                      className="sim-slider"
                    />
                    <div style={{ fontSize: 11, color: ACCENT, marginTop: 4 }}>
                      {Number(actionValues.ethBalance).toFixed(1)} ETH
                    </div>
                  </div>
                )}
                {action.type === "months" && (
                  <input
                    type="number"
                    placeholder="Months"
                    value={actionValues.ageMonths}
                    onChange={(e) => {
                      e.stopPropagation();
                      setActionValues((prev) => ({ ...prev, ageMonths: e.target.value }));
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "var(--bg-elevated)",
                      border: `1px solid ${BORDER_SUBTLE}`,
                      borderRadius: 6,
                      color: "var(--text-primary)",
                      fontSize: 12,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom: breakdown diff table + Best path + Copy ───────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 320px",
          gap: 24,
          alignItems: "start",
        }}
      >
        <div
          style={{
            background: BG_CARD,
            border: `1px solid ${BORDER_SUBTLE}`,
            borderRadius: 8,
            padding: "20px 24px",
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "var(--text-secondary)",
              letterSpacing: "0.2em",
              marginBottom: 16,
              fontWeight: 700,
            }}
          >
            BREAKDOWN DIFF
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {projectedResult.categories.map((cat, i) => {
              const baseCat = baselineResult.categories[i];
              const before = baseCat?.score ?? 0;
              const after = cat.score;
              const diff = after - before;
              const pct = cat.max > 0 ? (after / cat.max) * 100 : 0;
              return (
                <div key={cat.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                      fontSize: 12,
                      color: "var(--text-primary)",
                    }}
                  >
                    <span>
                      {cat.icon} {cat.label}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono), monospace" }}>
                      {before} → <span style={{ color: ACCENT }}>{after}</span>
                      {diff !== 0 && (
                        <span
                          style={{
                            ...deltaPillStyle,
                            marginLeft: 8,
                            padding: "2px 8px",
                            fontSize: 10,
                          }}
                        >
                          {diff > 0 ? "+" : ""}{diff}
                        </span>
                      )}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 4,
                      background: ACCENT_GLOW,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: ACCENT,
                        borderRadius: 4,
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: BG_CARD,
              border: `1px dashed ${ACCENT_BORDER}`,
              borderRadius: 8,
              padding: "20px",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: ACCENT,
                letterSpacing: "0.2em",
                marginBottom: 10,
                fontWeight: 700,
              }}
            >
              BEST PATH TO NEXT TIER
            </div>
            {bestPath ? (
              <>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                  → {bestPath.next}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {bestPath.gap != null && (
                    <span style={{ color: ACCENT, fontWeight: 600 }}>{bestPath.gap} pts to go. </span>
                  )}
                  {bestPath.hint}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                You’re at the top tier. Maintain activity to keep your score.
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(copyText);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            style={{
              padding: "12px 20px",
              background: "rgba(169,221,211,0.07)",
              border: `1px solid ${ACCENT_BORDER}`,
              borderRadius: 6,
              color: ACCENT,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {copied ? "Copied!" : `Copy: "Projecting ${projectedScore} pts on @RialoHQ 🌊 #BuildOnRialo"`}
          </button>
        </div>
      </div>
    </div>
  );
}
