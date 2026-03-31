const USE_REAL_CHAIN = false; // toggle to true when contracts deployed

export async function getWalletScore(address) {
  if (!USE_REAL_CHAIN) {
    // return mock data for now
    return {}; // MOCK_WALLET_DATA
  }
  
  // REAL implementation (ready for when contract is deployed):
  // const contract = new ethers.Contract(
  //   VOLUND_SCORE_ORACLE_ADDRESS,
  //   VolundScoreOracleABI,
  //   provider
  // )
  // return await contract.getScore(address)
}

export async function getWalletBadges(address) {
  if (!USE_REAL_CHAIN) {
    return {}; // MOCK_BADGES
  }
  // const contract = new ethers.Contract(...)
  // return await contract.getBadges(address)
}

export async function claimBadge(badgeId, signer) {
  if (!USE_REAL_CHAIN) {
    // simulate claim
    await new Promise(r => setTimeout(r, 1500));
    return { success: true, txHash: '0xMOCK...HASH' };
  }
  // const contract = new ethers.Contract(
  //   VOLUND_BADGE_ADDRESS,
  //   VolundBadgeABI,
  //   signer
  // )
  // const tx = await contract.claimBadge(badgeId)
  // return { success: true, txHash: tx.hash }
}

import { ETH_RPC } from "../constants";

// ── Onchain fetching ──────────────────────────────────────────────────────────

export async function rpcCall(method, params = []) {
  if (typeof window !== "undefined" && window.ethereum) {
    try { return await window.ethereum.request({ method, params }); } catch (e) {}
  }
  const res = await fetch(ETH_RPC, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  return (await res.json()).result;
}

export async function fetchOnchainData(address) {
  let balance = 0, txCount = 0;
  try {
    const [balHex, txCountHex] = await Promise.all([
      rpcCall("eth_getBalance", [address, "latest"]),
      rpcCall("eth_getTransactionCount", [address, "latest"]),
    ]);
    balance = parseFloat((parseInt(balHex, 16) / 1e18).toFixed(4));
    txCount = parseInt(txCountHex, 16);
  } catch (e) {
    console.warn("RPC fetch failed, using defaults:", e.message);
  }

  let walletAgeMo = 0;
  try {
    const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&page=1&offset=1&sort=asc`;
    const r = await Promise.race([
      fetch(url).then(r => r.json()),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 5000)),
    ]);
    if (r.status === "1" && r.result?.length > 0) {
      const ts = parseInt(r.result[0].timeStamp) * 1000;
      walletAgeMo = Math.max(1, Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24 * 30)));
    } else if (txCount > 0) {
      walletAgeMo = Math.min(Math.max(Math.round(txCount / 5), 1), 60);
    }
  } catch (e) {
    if (txCount > 0) walletAgeMo = Math.min(Math.max(Math.round(txCount / 5), 1), 60);
  }

  let ens = null, ensAvatar = null;

  // Try Base mainnet first for Basenames (.base.eth)
  try {
    const { ethers: ethLib } = await import("ethers");
    // Checksum the address (MetaMask may return lowercase)
    let checksumAddr;
    try { checksumAddr = ethLib.getAddress(address); } catch { checksumAddr = address; }

    const baseProvider = new ethLib.JsonRpcProvider('https://mainnet.base.org');

    // Step 1: Check NFT ownership on Basenames ERC-721 contract
    const BASENAME_NFT = ethLib.getAddress("0x03c4738ee98ae44591e1a4a4f3cab6641d95dd9a");
    const nftContract = new ethLib.Contract(BASENAME_NFT, ["function balanceOf(address owner) view returns(uint256)"], baseProvider);
    const balance = await Promise.race([
      nftContract.balanceOf(checksumAddr),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 6000)),
    ]);
    
    if (balance > 0n) {
      // They own a Basename! Try reverse resolution for the actual name
      try {
        const addrLower = checksumAddr.toLowerCase().replace('0x', '');
        const reverseNode = ethLib.namehash(`${addrLower}.addr.reverse`);
        const L2_RESOLVER = ethLib.getAddress("0xc6d566a56a1aff6508b41f6c90ff131615583bcd");
        const resolver = new ethLib.Contract(L2_RESOLVER, ["function name(bytes32 node) view returns (string)"], baseProvider);
        const baseName = await Promise.race([
          resolver.name(reverseNode),
          new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 4000)),
        ]);
        if (baseName && baseName.length > 0) {
          ens = baseName;
        }
      } catch (e) {}

      if (!ens) ens = "Basename (Hidden)";
    }
  } catch (e) {}

  // Fallback: try ENS on Ethereum mainnet
  if (!ens) {
    try {
      const query = `{"query":"{domains(where:{resolvedAddress:\\"${address.toLowerCase()}\\"},first:1){name, resolver{texts}}}"}`;
      const r = await Promise.race([
        fetch("https://api.thegraph.com/subgraphs/name/ensdomains/ens", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: query,
        }).then(r => r.json()),
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 4000)),
      ]);
      const domain = r?.data?.domains?.[0];
      if (domain) {
        ens = domain.name;
      }
    } catch (e) {}
  }

  // Resolve avatar if we found a name
  if (ens) {
    try {
      ensAvatar = await fetch(`https://metadata.ens.domains/mainnet/avatar/${ens}`)
        .then(rx => rx.ok ? rx.url : null).catch(() => null);
    } catch (e) {}
  }

  return { balance, txCount, walletAgeMo, ens, ensAvatar };
}

import { calculateScore, realDataToSimInput, getTier as getTierCalc } from "./scoreCalculator";

// ── PoH Level Calculation ───────────────────────────────────────────────────

export function calcPoHLevel(social = {}) {
  const matureConnections = [
    social.github?.connected && (social.github?.ageMonths || 0) >= 3,
    social.twitter?.connected && (social.twitter?.ageMonths || 0) >= 3,
    social.discord?.connected && (social.discord?.membershipMonths || 0) >= 3,
  ].filter(Boolean).length;

  let newLevel = 0;

  // Level 1: 2+ mature social connections
  if (matureConnections >= 2) newLevel = 1;

  // Level 2: Level 1 DONE + has Basename
  if (newLevel >= 1 && social.ens?.hasENS === true) newLevel = 2;

  // Level 3: Level 2 DONE + WorldCoin verified
  if (newLevel >= 2 && social.worldcoin?.verified === true) newLevel = 3;

  // Level 4: Level 3 DONE + 3 vouches from wallets score > 400
  const reputableVouches = (social.vouches || []).filter(v => v.score >= 400).length;
  if (newLevel >= 3 && reputableVouches >= 3) newLevel = 4;

  return newLevel;
}

// ── Score calculation ─────────────────────────────────────────────────────────

export function calcScore(d, social = {}) {
  // Transform the walletData shape 'd' to SimInput
  const simInput = realDataToSimInput(d, social);
  
  // Also manually add any fields that might be in 'd' but not caught by realDataToSimInput
  // d.badgeCount, d.hasRareBadge, etc.
  if (d.badgeCount !== undefined) simInput.badgeCount = d.badgeCount;
  if (d.hasRareBadge !== undefined) simInput.rareBadges = 1;
  if (d.hasEpicBadge !== undefined) simInput.epicBadges = 1;
  if (d.hasDivineBadge !== undefined) simInput.divineBadges = 1;

  return calculateScore(simInput);
}

export function getTier(s) {
  return getTierCalc(s);
}

export function shortAddr(a) { return a ? a.slice(0, 6) + "..." + a.slice(-4) : ""; }

export function generateHistory(currentScore, address) {
  const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  let seed = 0;
  if (address) for (let i = 0; i < address.length; i++) seed += address.charCodeAt(i);
  return months.map((month, i) => {
    const step = 5 - i;
    const variability = Math.sin(seed + i) * 20;
    const trend = -(step * 30);
    return { month, score: Math.max(0, Math.min(1000, Math.round(currentScore + trend + variability))) };
  });
}
