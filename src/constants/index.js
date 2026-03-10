// ── Contract & Network ────────────────────────────────────────────────────────
export const ETH_MAINNET = "0x14a34"; // Base Sepolia
export const BADGE_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";
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
  { id:"b1", name:"First Steps",    sym:"I",    rarity:"Common",    min:0,   days:8,   total:30, desc:"Connected wallet for the first time" },
  { id:"b2", name:"Early Mover",    sym:"II",   rarity:"Common",    min:0,   days:21,  total:30, desc:"Joined during Volund devnet phase" },
  { id:"b3", name:"Trusted Agent",  sym:"III",  rarity:"Rare",      min:500, days:33,  total:45, desc:"Maintained score above 500 for 30 days" },
  { id:"b4", name:"DeFi Dabbler",   sym:"IV",   rarity:"Rare",      min:500, days:40,  total:45, desc:"Completed 5+ DeFi interactions" },
  { id:"b5", name:"Chain Veteran",  sym:"V",    rarity:"Epic",      min:700, days:52,  total:60, desc:"Wallet age > 2 years with consistent activity" },
  { id:"b6", name:"Rialo Pioneer",  sym:"VI",   rarity:"Epic",      min:700, days:55,  total:60, desc:"First to use Rialo real-world data" },
  { id:"b7", name:"Score Crusher",  sym:"VII",  rarity:"Epic",      min:700, days:58,  total:60, desc:"Scored above 700 reputation threshold" },
  { id:"b8", name:"Onchain Legend", sym:"VIII", rarity:"Legendary", min:900, days:null,total:90, desc:"Score 900+ — the rarest of the rare" },
  { id:"b9", name:"Rialo OG",       sym:"IX",   rarity:"Legendary", min:900, days:null,total:90, desc:"Elite pioneer of the Rialo ecosystem" },
];

// ── Rarity styles ─────────────────────────────────────────────────────────────
export const RS = {
  Common:    { color:"#c8b89a", border:"rgba(200,184,154,0.4)" },
  Rare:      { color:"#b8d4f0", border:"rgba(184,212,240,0.4)" },
  Epic:      { color:"#a9ddd3", border:"rgba(169,221,211,0.4)" },
  Legendary: { color:"var(--text)", border:"rgba(232,227,213,0.6)" },
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
