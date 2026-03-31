import CONTRACTS from "./contracts.json";

// ── Contract & Network ────────────────────────────────────────────────────────
export const ETH_MAINNET = "0x14a34"; // Base Sepolia
export const BADGE_CONTRACT_ADDRESS = CONTRACTS.VOLUND_BADGE;
export const BADGE_API_URL = "https://api.volund.io/badge/sign";
export const ETH_RPC = "https://sepolia.base.org";
export const BADGE_ABI = [
  "function claimBadge(uint8 badgeId, uint16 score, bytes calldata signature) external",
  "function hasBadge(address user, uint8 badgeId) external view returns (bool)",
  "function getBadges(address user) external view returns (uint8[])",
  "function daysRemaining(address user, uint8 badgeId) external view returns (uint32)",
  "function nonces(address user) external view returns (uint256)",
];

// ── Badges ────────────────────────────────────────────────────────────────────
export const BADGES = [
  { id:"b1", name:"First Steps",    sym:"I",    rarity:"Common",    percent: 82, min:0,   metrics: {}, desc:"Connected wallet for the first time" },
  { id:"b2", name:"Early Mover",    sym:"II",   rarity:"Common",    percent: 64, min:0,   metrics: { walletAgeMo: 1 }, desc:"Joined during Volund devnet phase" },
  { id:"b3", name:"Trusted Agent",  sym:"III",  rarity:"Rare",      percent: 24, min:500, metrics: { txCount: 50 }, desc:"Maintained score above 500 with consistent tx history" },
  { id:"b4", name:"DeFi Architect", sym:"IV",   rarity:"Rare",      percent: 18, min:500, metrics: { liquidityScore: 40 }, desc:"Advanced liquidity positioning detected" },
  { id:"b5", name:"Chain Veteran",  sym:"V",    rarity:"Epic",      percent: 8,  min:700, metrics: { walletAgeMo: 24 }, desc:"Wallet age > 2 years with high temporal heat" },
  { id:"b6", name:"Rialo OG",       sym:"VI",   rarity:"Epic",      percent: 5,  min:700, metrics: { rialoLinked: true }, desc:"Verified link with Rialo institutional credit" },
  { id:"b7", name:"Governance Titan", sym:"VII", rarity:"Epic",      percent: 3,  min:700, metrics: { vouchCount: 5 }, desc:"High social trust weight via the Volund graph" },
  { id:"b8", name:"Onchain Legend", sym:"VIII", rarity:"Legendary", percent: 1.2, min:850, metrics: { txCount: 200, walletAgeMo: 36 }, desc:"Volund tier status with deep historical footprint" },
  { id:"b9", name:"System Oracle",  sym:"IX",   rarity:"Legendary", percent: 0.5, min:950, metrics: { zkVerified: true, score: 950 }, desc:"The ultimate reputation benchmark" },
];

// ── Rarity styles ─────────────────────────────────────────────────────────────
export const RS = {
  Common:    { color:"#CD7F32", border:"rgba(205,127,50,0.4)" },
  Rare:      { color:"#B0C4DE", border:"rgba(176,196,222,0.4)" },
  Epic:      { color:"#7DF9FF", border:"rgba(125,249,255,0.4)" },
  Legendary: { color:"#a9ddd3", border:"rgba(169,221,211,0.6)" },
};

// ── Landing page data ─────────────────────────────────────────────────────────
export const HOW = [
  { n:"01", title:"Connect Wallet",  desc:"Link your wallet. Volund reads your onchain history across all Rialo-connected protocols." },
  { n:"02", title:"Score Computed",  desc:"Rialo bridges real-world credit data natively onchain — no oracles, no third parties." },
  { n:"03", title:"Earn Badges",     desc:"Hit score thresholds to unlock non-permanent badges. Stay active to keep them." },
  { n:"04", title:"Unlock Benefits", desc:"Lower DeFi rates, early NFT access, DAO voting power — your score works for you." },
];

export const FEATURES = [
  { n:"01", title:"Onchain Activity",    desc:"Wallet age, transaction volume, and contract diversity — all scored natively to form the backbone of your Rialo reputation." },
  { n:"02", title:"DeFi Behavior",       desc:"Liquidation history, repayment rates, and lending patterns — your DeFi track record feeds directly into your Rialo score." },
  { n:"03", title:"Real-World Credit",   desc:"The first system to bridge traditional credit signals natively onchain via Rialo. No oracles. No middlemen. Just Rialo." },
  { n:"04", title:"Identity & Trust",    desc:"Link GitHub, ENS, and social identities to enrich your Rialo reputation with a verifiable, multi-layered trust profile." },
  { n:"05", title:"Non-Permanent Badges",desc:"Rialo badges expire. Stay active to keep them. A living reputation that reflects your real engagement with the ecosystem." },
];
