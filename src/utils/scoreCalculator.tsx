/**
 * Volund Score Calculator — Simulation & display
 * Maps simulation state to category scores (0–1000 total).
 * Categories: Onchain (200) | DeFi (200) | Identity (250) | Social (100) | Badges (250)
 */

import { colors } from "../design-tokens";

export interface SimInput {
  // Onchain (from wallet / sim)
  txCount?: number;
  ageMonths?: number;
  ethBalance?: number;
  rloBalance?: number;
  uniqueContracts?: number;
  chains?: number;
  hasENS?: boolean;
  // DeFi
  swapVolumeUsd?: number;
  lpDays?: number;
  lpAmount?: number;
  lendActive?: boolean;
  defiTxPerMonth?: number;
  cleanHistory?: boolean;
  farmProtocols?: number;
  // Identity
  pohLevel?: number;
  linkedCount?: number; // 3+ accounts linked
  // Social
  github?: { connected: boolean; ageMonths: number; repos: number };
  twitter?: { connected: boolean; followers: number };
  discord?: { connected: boolean; ageMonths: number };
  otherSocial?: boolean;
  // Badges
  commonBadges?: number;
  uncommonBadges?: number;
  rareBadges?: number;
  epicBadges?: number;
  legendaryBadges?: number;
  badgeCount?: number;
  // Gas tier (0–3 or similar for gasScore)
  gasTier?: number;
}

const TIER_BOUNDS: { name: string; min: number; max: number }[] = [
  { name: "unverified", min: 0, max: 99 },
  { name: "bronze", min: 100, max: 199 },
  { name: "silver", min: 200, max: 349 },
  { name: "gold", min: 350, max: 499 },
  { name: "platinum", min: 500, max: 699 },
  { name: "diamond", min: 700, max: 849 },
  { name: "volund", min: 850, max: 1000 },
];

export function getTier(score: number): string {
  const s = Math.round(score);
  for (let i = TIER_BOUNDS.length - 1; i >= 0; i--) {
    if (s >= TIER_BOUNDS[i].min) return TIER_BOUNDS[i].name;
  }
  return "unverified";
}

export function getTierColor(score: number): string {
  const tier = getTier(score);
  const map: Record<string, string> = {
    unverified: colors.tier.unverified,
    bronze: colors.tier.bronze,
    silver: colors.tier.silver,
    gold: colors.tier.gold,
    platinum: colors.tier.platinum,
    diamond: colors.tier.diamond,
    volund: colors.tier.volund,
  };
  return map[tier] ?? colors.tier.unverified;
}

export function getNextTier(score: number): { name: string; min: number } | null {
  const s = Math.round(score);
  for (let i = 0; i < TIER_BOUNDS.length; i++) {
    if (s < TIER_BOUNDS[i].min) return { name: TIER_BOUNDS[i].name, min: TIER_BOUNDS[i].min };
  }
  return null;
}

export interface CategoryResult {
  id: string;
  icon: string;
  label: string;
  score: number;
  max: number;
  rows: any[];
}

export interface ScoreResult {
  rawTotal: number;
  total: number;
  isCapped: boolean;
  activeGate?: string;
  categories: CategoryResult[];
}

/**
 * Apply hard gates logic to cap final score.
 */
function applyHardGates(rawScore: number, input: SimInput) {
  const badgeCount = input.badgeCount ?? 0;
  const pohLevel = input.pohLevel ?? 0;
  const hasRare = (input.rareBadges ?? 0) >= 1;
  const hasEpic = (input.epicBadges ?? 0) >= 1;
  const hasLegendary = (input.legendaryBadges ?? 0) >= 1;

  let cappedScore = rawScore;
  let activeGate = undefined;

  if (badgeCount < 1) {
    if (cappedScore >= 300) {
      cappedScore = 299;
      activeGate = 'Must own at least 1 badge';
    }
  }
  
  if (pohLevel < 1) {
    if (cappedScore >= 500) {
      cappedScore = 499;
      activeGate = 'Must have PoH Level 1 (cap 499)';
    }
  } else if (pohLevel < 2) {
    if (cappedScore >= 650) {
      cappedScore = 649;
      activeGate = 'Must have PoH Level 2 (cap 649)';
    }
  } else if (pohLevel < 3) {
    if (cappedScore >= 850) {
      cappedScore = 849;
      activeGate = 'Must have PoH Level 3 (cap 849)';
    }
  } else if (pohLevel < 4) {
    if (cappedScore >= 1000) {
      cappedScore = 999;
      activeGate = 'Must have PoH Level 4 (cap 999)';
    }
  }

  return { cappedScore, activeGate };
}

/**
 * Compute full score from simulation input.
 */
export function calculateScore(input: SimInput): ScoreResult {
  // ── ONCHAIN ACTIVITY (max 200 pts) ────────────────────────────────────
  const tx = input.txCount ?? 0;
  let txScore = 0;
  if (tx < 10) txScore = tx * 2;
  else if (tx <= 50) txScore = 20 + (tx - 10) * 0.8;
  else if (tx <= 200) txScore = 52 + (tx - 50) * 0.3;
  else txScore = 80;

  const age = input.ageMonths ?? 0;
  let ageScore = 0;
  if (age >= 24) ageScore = 50;
  else if (age >= 12) ageScore = 35;
  else if (age >= 6) ageScore = 20;
  else if (age >= 3) ageScore = 10;

  const eth = input.ethBalance ?? 0;
  let ethScore = 0;
  if (eth >= 5) ethScore = 30;
  else if (eth >= 2) ethScore = 20;
  else if (eth >= 0.5) ethScore = 12;
  else if (eth >= 0.1) ethScore = 5;

  const rlo = input.rloBalance ?? 0;
  let rloScore = 0;
  if (rlo >= 50000) rloScore = 40;
  else if (rlo >= 10000) rloScore = 25;
  else if (rlo >= 1000) rloScore = 15;
  else if (rlo >= 100) rloScore = 5;

  const onchain = Math.round(Math.min(txScore + ageScore + ethScore + rloScore, 200));

  // ── DEFI BEHAVIOR (max 200 pts) ────────────────────────────────────────
  const vol = input.swapVolumeUsd ?? 0;
  let swapScore = 0;
  if (vol >= 100000) swapScore = 60;
  else if (vol >= 20000) swapScore = 45;
  else if (vol >= 5000) swapScore = 25;
  else if (vol >= 500) swapScore = 10;

  const lpDays = input.lpDays ?? 0;
  let lpScore = 0;
  if (lpDays >= 180) lpScore = 50;
  else if (lpDays >= 90) lpScore = 35;
  else if (lpDays >= 30) lpScore = 20;
  else if (lpDays >= 14) lpScore = 10;

  const txPm = input.defiTxPerMonth ?? 0;
  let freqScore = 0;
  if (txPm >= 30) freqScore = 40;
  else if (txPm >= 20) freqScore = 30;
  else if (txPm >= 10) freqScore = 20;
  else if (txPm >= 5) freqScore = 10;

  const lending = input.lendActive ? 20 : 0;
  const clean = input.cleanHistory ? 20 : 0;
  const farmCount = input.farmProtocols ?? 0;
  let farmScore = farmCount >= 3 ? 10 : (farmCount >= 2 ? 8 : (farmCount >= 1 ? 5 : 0));

  const defi = Math.round(Math.min(swapScore + lpScore + freqScore + lending + clean + farmScore, 200));

  // ── IDENTITY & TRUST (max 250 pts) ────────────────────────────────────
  const pohLevel = input.pohLevel ?? 0;
  const pohLevels = [0, 40, 80, 140, 200];
  const pohScore = pohLevels[Math.min(pohLevel, 4)] ?? 200;

  const ensScore = input.hasENS ? 30 : 0;
  const linkedScore = (input.linkedCount ?? 0) >= 3 ? 20 : 0;

  const identity = Math.round(Math.min(pohScore + ensScore + linkedScore, 250));

  // ── SOCIAL REPUTATION (max 100 pts) ───────────────────────────────────
  const gh = input.github;
  let ghScore = 0;
  if (gh?.connected) {
    if (gh.ageMonths > 6 && gh.repos > 5) ghScore = 35;
    else if (gh.ageMonths > 3) ghScore = 20;
    else ghScore = 10;
  }

  const tw = input.twitter;
  let twScore = 0;
  if (tw?.connected) {
    if (tw.followers > 1000) twScore = 25;
    else if (tw.followers > 100) twScore = 15;
    else twScore = 8;
  }

  const ds = input.discord;
  let dsScore = 0;
  if (ds?.connected) {
    dsScore = ds.ageMonths > 6 ? 20 : 10;
  }

  const other = input.otherSocial ? 20 : 0;
  const social = Math.round(Math.min(ghScore + twScore + dsScore + other, 100));

  // ── BADGE ACHIEVEMENTS (max 250 pts) ───────────────────────────────────
  const common = Math.min(input.commonBadges ?? 0, 3) * 10;
  const uncommon = Math.min(input.uncommonBadges ?? 0, 3) * 25;
  const rare = Math.min(input.rareBadges ?? 0, 2) * 50;
  const epic = Math.min(input.epicBadges ?? 0, 1) * 80;
  const legendary = Math.min(input.legendaryBadges ?? 0, 1) * 150;

  const badges = Math.round(Math.min(common + uncommon + rare + epic + legendary, 250));

  const rawTotal = onchain + defi + identity + social + badges;
  const { cappedScore, activeGate } = applyHardGates(rawTotal, input);

  return {
    rawTotal,
    total: cappedScore,
    isCapped: cappedScore < rawTotal,
    activeGate,
    categories: [
      { 
        id: "onchain", icon: "Layers", label: "Onchain Activity", score: onchain, max: 200,
        rows: [
          { icon: "Activity", label: "Tx count", currentValue: tx, earned: Math.round(txScore), max: 80, formula: "log-scaling up to 200", improveTip: "Increase transaction density on Rialo." },
          { icon: "Clock", label: "Wallet age", currentValue: `${age}m`, earned: Math.round(ageScore), max: 50, formula: "Tiered by months (up to 24m)", improveTip: "Hold your keys long-term." },
          { icon: "CircleDollarSign", label: "ETH balance", currentValue: eth.toFixed(2), earned: ethScore, max: 30, formula: "Holdings on Base Sepolia", improveTip: "Keep > 5 ETH for max points." },
          { icon: "Coins", label: "RLO holdings", currentValue: rlo, earned: rloScore, max: 40, formula: "Total RLO in wallet", improveTip: "Bridge more RLO tokens." }
        ]
      },
      { 
        id: "defi", icon: "TrendingUp", label: "DeFi Behavior", score: defi, max: 200,
        rows: [
          { icon: "Droplets", label: "Swap volume", currentValue: `$${vol}`, earned: swapScore, max: 60, formula: "Tiered USD volume", improveTip: "Increase volume to $100K." },
          { icon: "Network", label: "LP commitment", currentValue: `${lpDays}d`, earned: lpScore, max: 50, formula: "Days in liquidity pools", improveTip: "Provide LP for 180+ days." },
          { icon: "Zap", label: "DeFi frequency", currentValue: `${txPm}/mo`, earned: freqScore, max: 40, formula: "Tx/month speed", improveTip: "Maintain 30+ tx per month." },
          { icon: "Landmark", label: "Lending active", currentValue: lending > 0 ? "YES" : "NO", earned: lending, max: 20, formula: "Open lending position", improveTip: "Supply assets to Rialo Lend." },
          { icon: "ShieldCheck", label: "Clean history", currentValue: clean > 0 ? "YES" : "NO", earned: clean, max: 20, formula: "No liquidations", improveTip: "Manage your health factor." }
        ]
      },
      { 
        id: "identity", icon: "UserCheck", label: "Identity & Trust", score: identity, max: 250,
        rows: [
          { icon: "Tag", label: "PoH Level", currentValue: `Level ${pohLevel}`, earned: pohScore, max: 200, formula: "Proof of Humanity rank", improveTip: "Complete PoH upgrades." },
          { icon: "LayoutGrid", label: "ENS presence", currentValue: input.hasENS ? "YES" : "NO", earned: ensScore, max: 30, formula: "Primary ENS mapped", improveTip: "Register an ENS domain." },
          { icon: "ShieldCheck", label: "Linked Accounts", currentValue: input.linkedCount || 0, earned: linkedScore, max: 20, formula: "3+ verified links", improveTip: "Connect more social accounts." }
        ]
      },
      { 
        id: "social", icon: "MessageSquare", label: "Social Reputation", score: social, max: 100,
        rows: [
          { icon: "Github", label: "GitHub quality", currentValue: gh?.repos || 0, earned: ghScore, max: 35, formula: "Age + Repos + Connect", improveTip: "Build more open source repos." },
          { icon: "Twitter", label: "Twitter influence", currentValue: tw?.followers || 0, earned: twScore, max: 25, formula: "Follower tiers", improveTip: "Grow your social following." },
          { icon: "MessageCircle", label: "Discord seniority", currentValue: ds?.ageMonths || 0, earned: dsScore, max: 20, formula: "Account age", improveTip: "Keep your Discord verified." }
        ]
      },
      { 
        id: "badges", icon: "Award", label: "Badge Achievements", score: badges, max: 250,
        rows: [
          { icon: "Award", label: "Total Badge Pts", currentValue: input.badgeCount || 0, earned: badges, max: 250, formula: "Cumulative rarity bonus", improveTip: "Claim higher rarity badges." }
        ]
      },
    ],
  };
}

/**
 * Map realData + social from app to SimInput for baseline.
 */
export function realDataToSimInput(realData: Record<string, any>, social: Record<string, any>): SimInput {
  const balance = Number(realData.balance ?? 0);
  const txCount = Number(realData.txCount ?? 0);
  const walletAgeMo = Number(realData.walletAgeMo ?? 0);
  
  // Count linked accounts
  let linked = 0;
  if (social.github?.connected) linked++;
  if (social.twitter?.connected) linked++;
  if (social.discord?.connected) linked++;
  if (social.worldCoinVerified) linked++;

  return {
    txCount,
    ageMonths: walletAgeMo,
    ethBalance: balance,
    rloBalance: 0,
    uniqueContracts: Math.min(Math.floor(txCount / 5), 30),
    chains: 1,
    hasENS: !!realData.ens,
    swapVolumeUsd: 0,
    lpDays: 0,
    lendActive: false,
    defiTxPerMonth: Math.min(Math.floor(txCount / 6), 30),
    cleanHistory: true,
    farmProtocols: 0,
    pohLevel: Number(social.pohLevel ?? 0),
    linkedCount: linked,
    github: social.github ? { connected: !!social.github.connected, ageMonths: social.github.ageMonths || 0, repos: social.github.repos || 0 } : undefined,
    twitter: social.twitter ? { connected: !!social.twitter.connected, followers: social.twitter.followerCount || 0 } : undefined,
    discord: social.discord ? { connected: !!social.discord.connected, ageMonths: social.discord.membershipMonths || 0 } : undefined,
    otherSocial: !!social.worldCoinVerified,
    commonBadges: 0,
    uncommonBadges: 0,
    rareBadges: 0,
    epicBadges: 0,
    legendaryBadges: 0,
    badgeCount: 0,
    gasTier: 0,
  };
}
