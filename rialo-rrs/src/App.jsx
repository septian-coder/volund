import { useState, useEffect, useRef } from "react";

// ── constants ─────────────────────────────────────────────────────────────────

const ETH_MAINNET = "0x14a34"; // Base Sepolia

// ── contract ──────────────────────────────────────────────────────────────────
// Replace with your deployed contract address
const BADGE_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";
const BADGE_API_URL = "https://api.volund.io/badge/sign"; // your backend

// Minimal ABI — only what the frontend needs
const BADGE_ABI = [
  "function claimBadge(uint8 badgeId, uint16 score, bytes calldata signature) external",
  "function hasBadge(address user, uint8 badgeId) external view returns (bool)",
  "function getBadges(address user) external view returns (uint8[])",
  "function daysRemaining(address user, uint8 badgeId) external view returns (uint32)",
  "function nonces(address user) external view returns (uint256)",
];
const ETH_RPC = "https://sepolia.base.org";

const BADGES = [
  { id:"b1", name:"First Steps",    sym:"I",    rarity:"Common",    min:0,   days:8,   total:30, desc:"Connected wallet for the first time" },
  { id:"b2", name:"Early Mover",    sym:"II",   rarity:"Common",    min:0,   days:21,  total:30, desc:"Joined during Volund devnet phase" },
  { id:"b3", name:"Trusted Agent",  sym:"III",  rarity:"Rare",      min:500, days:33,  total:45, desc:"Maintained score above 500 for 30 days" },
  { id:"b4", name:"DeFi Dabbler",   sym:"IV",   rarity:"Rare",      min:500, days:40,  total:45, desc:"Completed 5+ DeFi interactions" },
  { id:"b5", name:"Chain Veteran",  sym:"V",    rarity:"Epic",      min:700, days:52,  total:60, desc:"Wallet age > 2 years with consistent activity" },
  { id:"b6", name:"Rialo Pioneer",    sym:"VI",   rarity:"Epic",      min:700, days:55,  total:60, desc:"First to use Rialo real-world data" },
  { id:"b7", name:"Score Crusher",  sym:"VII",  rarity:"Epic",      min:700, days:58,  total:60, desc:"Scored above 700 reputation threshold" },
  { id:"b8", name:"Onchain Legend", sym:"VIII", rarity:"Legendary", min:900, days:null,total:90, desc:"Score 900+ — the rarest of the rare" },
  { id:"b9", name:"Rialo OG",       sym:"IX",   rarity:"Legendary", min:900, days:null,total:90, desc:"Elite pioneer of the Rialo ecosystem" },
];

const RS = {
  Common:    { color:"#c8b89a", border:"rgba(200,184,154,0.4)" },
  Rare:      { color:"#b8d4f0", border:"rgba(184,212,240,0.4)" },
  Epic:      { color:"#a9ddd3", border:"rgba(169,221,211,0.4)" },
  Legendary: { color:"#e8e3d5", border:"rgba(232,227,213,0.6)" },
};

const HOW = [
  { n:"01", title:"Connect Wallet",  desc:"Link your wallet. Volund reads your onchain history across all Rialo-connected protocols." },
  { n:"02", title:"Score Computed",  desc:"Rialo bridges real-world credit data natively onchain — no oracles, no third parties." },
  { n:"03", title:"Earn Badges",     desc:"Hit score thresholds to unlock non-permanent badges. Stay active to keep them." },
  { n:"04", title:"Unlock Benefits", desc:"Lower DeFi rates, early NFT access, DAO voting power — your score works for you." },
];

const FEATURES = [
  { n:"01", title:"Onchain Activity",    desc:"Wallet age, transaction volume, and contract diversity — all scored natively to form the backbone of your Rialo reputation." },
  { n:"02", title:"DeFi Behavior",       desc:"Liquidation history, repayment rates, and lending patterns — your DeFi track record feeds directly into your Rialo score." },
  { n:"03", title:"Real-World Credit",   desc:"The first system to bridge traditional credit signals natively onchain via Rialo. No oracles. No middlemen. Just Rialo." },
  { n:"04", title:"Identity & Trust",    desc:"Link GitHub, ENS, and social identities to enrich your Rialo reputation with a verifiable, multi-layered trust profile." },
  { n:"05", title:"Non-Permanent Badges",desc:"Rialo badges expire. Stay active to keep them. A living reputation that reflects your real engagement with the ecosystem." },
];

const HISTORY = [
  {month:"Oct",score:680},{month:"Nov",score:705},
  {month:"Dec",score:718},{month:"Jan",score:731},
  {month:"Feb",score:738},{month:"Mar",score:742},
];

// ── onchain logic ─────────────────────────────────────────────────────────────

async function rpcCall(method, params = []) {
  // Use MetaMask provider if available — avoids CORS entirely
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      return await window.ethereum.request({ method, params });
    } catch(e) {}
  }
  // Fallback to direct RPC fetch
  const res = await fetch(ETH_RPC, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ jsonrpc:"2.0", id:1, method, params }),
  });
  return (await res.json()).result;
}

async function fetchOnchainData(address) {
  // Core RPC — use MetaMask provider (no CORS issues)
  let balance = 0, txCount = 0;
  try {
    const [balHex, txCountHex] = await Promise.all([
      rpcCall("eth_getBalance", [address, "latest"]),
      rpcCall("eth_getTransactionCount", [address, "latest"]),
    ]);
    balance = parseFloat((parseInt(balHex, 16) / 1e18).toFixed(4));
    txCount = parseInt(txCountHex, 16);
  } catch(e) {
    console.warn("RPC fetch failed, using defaults:", e.message);
  }

  // Estimate wallet age from block number heuristic if Etherscan fails
  // Current block ~19.5M, ~6500 blocks/day, ~195000 blocks/month
  let walletAgeMo = 0;
  try {
    // Use Etherscan without key — rate limited but works for single queries
    const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&page=1&offset=1&sort=asc`;
    const r = await Promise.race([
      fetch(url).then(r => r.json()),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 5000))
    ]);
    if (r.status === "1" && r.result?.length > 0) {
      const ts = parseInt(r.result[0].timeStamp) * 1000;
      walletAgeMo = Math.max(1, Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24 * 30)));
    } else if (txCount > 0) {
      // Fallback: rough estimate from tx count (active wallets avg ~5 tx/mo)
      walletAgeMo = Math.min(Math.max(Math.round(txCount / 5), 1), 60);
    }
  } catch(e) {
    // Still estimate from tx count
    if (txCount > 0) walletAgeMo = Math.min(Math.max(Math.round(txCount / 5), 1), 60);
  }

  // ENS lookup via public ENS subgraph
  let ens = null;
  try {
    const query = `{"query":"{domains(where:{resolvedAddress:\\"${address.toLowerCase()}\\"},first:1){name}}"}`;
    const r = await Promise.race([
      fetch("https://api.thegraph.com/subgraphs/name/ensdomains/ens", {
        method: "POST", headers: {"Content-Type":"application/json"}, body: query
      }).then(r => r.json()),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 4000))
    ]);
    ens = r?.data?.domains?.[0]?.name || null;
  } catch(e) {}

  return { balance, txCount, walletAgeMo, ens };
}

function calcScore(d, social={}) {
  const { balance, txCount, walletAgeMo } = d;
  const onchain   = Math.round(Math.min(Math.min(txCount*0.4,180) + Math.min(walletAgeMo*4,90) + Math.min(balance>0?Math.log10(balance+0.01)*15+20:0,30), 300));
  const defi      = Math.round(Math.min(txCount*0.08, 160));

  // Identity — base 40, +40 ENS, +60 GitHub, +30 Twitter (max 200)
  let identity = 40;
  const identityDetails = [];
  if (d.ens)           { identity += 40; identityDetails.push(`ENS: ${d.ens}`); }
  if (social.github)   { identity += 60; identityDetails.push(`GitHub: @${social.github}`); }
  if (social.twitter)  { identity += 30; identityDetails.push(`X: @${social.twitter}`); }
  identity = Math.min(identity, 200);

  const realworld = 0;
  const community = Math.round(Math.min(walletAgeMo*0.8, 60));
  const total     = Math.min(onchain+defi+identity+realworld+community, 1000);
  return {
    total,
    categories: [
      { id:"onchain",   icon:"⛓", label:"Onchain Activity",  score:onchain,   max:300, detail:`${txCount} txns · ${walletAgeMo}mo wallet age · ${balance} ETH` },
      { id:"defi",      icon:"↗", label:"DeFi Behavior",     score:defi,      max:250, detail:"Estimated from tx patterns" },
      { id:"identity",  icon:"◈", label:"Identity & Trust",  score:identity,  max:200, detail:identityDetails.length ? identityDetails.join(" · ") : "No identity linked" },
      { id:"realworld", icon:"◎", label:"Real-World Credit", score:realworld, max:150, detail:"Rialo · Coming soon" },
      { id:"community", icon:"◇", label:"Community",         score:community, max:100, detail:"DAO data · Coming soon" },
    ],
  };
}

function getTier(s) {
  if (s>=900) return "Elite";
  if (s>=700) return "Reputable";
  if (s>=500) return "Established";
  if (s>=200) return "Newcomer";
  return "Unknown";
}

function shortAddr(a) { return a ? a.slice(0,6)+"..."+a.slice(-4) : ""; }

// ── hooks ─────────────────────────────────────────────────────────────────────

function useEase(target, active, dur=1800) {
  const [v,setV] = useState(0);
  useEffect(() => {
    if (!active) { setV(0); return; }
    let s=null;
    const run = ts => { if(!s)s=ts; const p=Math.min((ts-s)/dur,1),e=1-Math.pow(1-p,4); setV(Math.round(target*e)); if(p<1) requestAnimationFrame(run); };
    requestAnimationFrame(run);
  }, [active, target]);
  return v;
}

function useBreakpoint() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return { isMobile: w < 640, isTablet: w < 1024, w };
}

function useInView(ref, threshold=0.15) {
  const [vis,setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e])=>{ if(e.isIntersecting) setVis(true); },{threshold});
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return vis;
}

// ── shared components ─────────────────────────────────────────────────────────

const LOGO_SRC = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//2wBDAQ4ODhMREyYVFSZPNS01T09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0//wAARCAAoACgDASIAAhEBAxEB/8QAGQABAAMBAQAAAAAAAAAAAAAAAAQFBgcC/8QAKhAAAQIFAgQGAwAAAAAAAAAAAQADAgQFERITIRUiQVEGFBYxcaEXQmH/xAAVAQEBAAAAAAAAAAAAAAAAAAAAAf/EABURAQEAAAAAAAAAAAAAAAAAAAAR/9oADAMBAAIRAxEAPwDmCIp0pSKjOsF+Wk3o2Re7uNoBbc3iOwsggotvwyU/GuuZZnXI1Q9bmMetgebtjYW9uqy03R6jJMB+Zk3YGTazuN4DfcWiGxuggoiICu/DFfdok7zjUknrQvsncEdwO4+9x1VIiDrBpzQY4fhBwAtecM1kcdDLPS+c+vvj/VgvE9fdrc6BANOSZ5WGRsAO5Hc/Ww6L16lmvSIoF4tPWzzv+nvh8ZbqiUgIiKgiIgIiICIiD//Z";

function Logo({ size=18 }) {
  const s = size*1.6;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:9 }}>
      <img src={LOGO_SRC} width={s} height={s} style={{ display:"block" }} alt="Volund"/>
      <span style={{ fontSize:size, fontWeight:900, color:"#e8e3d5", fontFamily:"'Inter',sans-serif", letterSpacing:"-0.04em" }}>Volund</span>
    </div>
  );
}

function Tag({ children }) {
  return <span style={{ fontSize:9, color:"#e8e3d5", background:"transparent", fontFamily:"'Inter',sans-serif", letterSpacing:".2em", padding:"0", display:"inline-block", fontWeight:400, opacity:.5, animation:"fade-in .5s ease both", textTransform:"uppercase" }}>{children}</span>;
}

function Grid() {
  return <div style={{ position:"fixed", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)", backgroundSize:"60px 60px", pointerEvents:"none", zIndex:0 }}/>;
}

// ── badge images ──────────────────────────────────────────────────────────────

const BADGE_IMG = {
  b1:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCABQAFADASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAQFBgECAwf/xAAxEAACAQMCAwcCBQUAAAAAAAABAgMABBEFIRIxURMiMkFhcZEGFCMzgbHwQlJTocH/xAAYAQADAQEAAAAAAAAAAAAAAAABAgMABP/EAB4RAAMAAgMBAQEAAAAAAAAAAAABEQIhAxIxQRNR/9oADAMBAAIRAxEAPwDz+iiisYKK2CEnGKbtdLu7t1SGFmLbjY4I6+1BtIKTYlRVptdO03Rn49SZLy6A7trH3gp6seXzW0uk2WvOZNIja3uAPxLbh29weVJ+io3RlUoq3RfQN/whrm4t4B0yWP8AqobXNOt9Nmjt4JXmkxl2IwPTA+aPdWA6uUiqKKKcUKZtbd5bmCNXVXkdQpzyycA0tUpFF2Msc0bDt0aJljKnfbOaXJwbFUmtQtLLRZk7aRru5kXtGkkGdyTyHLy5mkjqOo6gxitFl4TzEeSxHqR/zFdvqKY3MtrK4Cs1uCVBzg96lNPvZdPuY7i1J418QJ2YdK515X6X8cRzNhcQzpDPFJDI7AKHUrzPOvQdK7O3RbKwThjT8yThzk9T1JqEv/qS11W3jgIdZWYAK6eFvIg+9RsevX9vK9tZRIcMVBILMTnc4pX2yCokW/XNRg0+zeR2O22/iY9KqGmWtvrksrfcSW96q9qJUBwCCNiPTIwRSGojUZm7fUknJ5KZEKqvsOVM/TsxtJLuZVDFbdiFJ5nu7UZE2vTe6+EDcwPHczRs6syMwY554OCaXqRkj7Z3mdh27tIzRgcts5zUdXTi6c+ShlRk4qzXunOkcV9Dh4TFF3lPhOACCPKqyDg1ctA+pJIrJYJ7cTwIoiIGCwA9PMUnLfUPxwitQcyGHPPsR+xpzQJtMjlMeqW0bqx7sr5wPQ4NNX1np98e3sJDGVHejI2X3HMVGXVwjEW6WiQugCuS+cnrUbdItP6Seqw6Ut/bnTjGHEitwRycSsAc/oa30vWbLSLi4Dh+0LsWZEyWJOcZ6CkdP0pBdQyXc6xR8YwAjAuc7AZx50X+mJ91NLZ3CyRlzleBiVOdwcetCfAHPW9Wm1i5EjApCngQnJ9zS1k5jWfH+Ij9q62lwiEwPaRzSOCqMJDsT5/pUjYWenWX4+oyGQsO7EBs3sOZo2aZvdoQsdPZreW9mISERyjiJ8TYOAOtV1hg1cNf+onnszDb2wggZTGAcBiPbyFU87mrcd9ZLkhinrK5iiTglDKeLiDqfTl/M0jWRVGqTTjLLFcBuFmAnUDKumzr8b/HxXG6iuI7k3UfGyNghs5IGOZxj5xUbp0ttHLm47VP7ZIjuh64PP22qVuNe+5aOOUgGEERzRLw8ZzsSpqDxeL0XWSa2cI7lmdmTCkxBAV5+mD85PvWJbhhIrHxCPgLf1bev6DFS+jXlmuq2811bRDiyGIyBxbd7HKtdZvLQ6tcTWdrFhRhSQSOLPixyzS9tjTRHWsUrXC3MgaONcksDgnI8s5xXaWdQWZVECncu5y7fO/z8VrBrot3kjjILTAB5pV4uA53IUVFajJbPIPtu1bHiklPec9cDl7b0yxeT2K8kloL65hkXgiDMeLJdjz2/nSkazWKulEQboUUUUQBmts1rRWMO2uoy26GIhZYCQTG/XqDzB9qLvUprmMQgCKBSSI06nzJ5k+9JUUvVWjdnIZzWM0UUwoUUUVjH//Z",
  b2:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCABQAFADASIAAhEBAxEB/8QAGwAAAgMBAQEAAAAAAAAAAAAAAAUBBAYCAwf/xAA1EAACAQMCBQIEBAQHAAAAAAABAgMABBEFEiExQVFhEyIGMnGBFEKRsSNSYsFyoaLR4fDx/8QAGAEBAAMBAAAAAAAAAAAAAAAAAgABAwT/xAAgEQACAgICAgMAAAAAAAAAAAAAAQIREiEDMRMiQVGB/9oADAMBAAIRAxEAPwD5/RRRUIFFekULyuqopLMcAdzVmDTLq4n9GKPe+ce05/aqbSLUWylRWwsdK03Q39TVtl1dEZS1T3FfLDkPvwqNQ0vTtal9TTPTtLrHvtW9pbyvQ/ah5FYvGzIUU5g+GtSuLhoY4DuXmW4D9TTlvgqDTrT8Rq98cngsMA4se24/7Us0VgzG0V1Lt9V9gwmTtGc8K5pBCmmi6ZLe3wjWWKHAG55OIGfHeldaDQ5PQ1Ro2iaT1QPl5jHHOOvChNtLQ4K2OJtO+HdMCkyteTRnDM+SmewUcz4zjuaX6h8RzSn07NRbptCn0wA5A8jgv0Gar61GAlsyH2yI54Hn/ENeFhZtO4RCAAMsx5KM8zWPatmyXwjxAkfO44BOSB1Pnv8Aen2gaCb2RHuCxiJ3JFnn/V4H050GwsXmit7SW4uZycvuXagH7mtJLqFtoFmgJElzNyHfufoP+BRcm3SFSSsr6jqcGj3M8Vy86yIALeOM7Q/D5s/X9qz+oanLqTxNeyFGKhSVHIkdBU6nq8up3J2gHByC2PaO+elLoNl3PIQcwwKp3Hr7wCx/7yqJaIUtRsZYbgAyxS71yrJwzjpjvS+nmrOJNRWFImjEKnG7gTnjnHSkddEHa2c81TJUZNa6G3Fh8SWbyKQrRB/9BrIqcGthojWF+lvJe3DJcR5T1N2RjiAG+3I0OW6HxUVNZDS21vMdmwNLEMNknEmckdOdc2K3U0BhtrfK8ywzxPc1e1PRriOW1hdciSSQ704qQWBGD9K2+kafDaWaoiKMDB4VjbfqjXUVkzCafPFpVrJPOgZy2EXdxlb+yjqfsOtLLi4uL25MsrGSaY4GBjPYKOgFaP4t0i1tYhc+vJJO3Alj83c+B0AFZxMWDLNIRJORlBn/AD8ClGv0p/ZWuWmVmtdojCnEgHNj5NMtFRobaeYbNjNHGcthuMgPAdeVKyWd2kkOWY5J8060DTLi+hlKJhVdCXf2qMMScn6UpdFI6ktxffEN40QJVYd/fhtFZRhitXrbWViZmspmkmcBDLuwOgKr4xnJNZQ86XF0DloimVnegW4gkB2plgw6ZpbXpCMyD3bR1PatJJNGcW09G0+HZJpZELylo1J2luSDqafal8RQWsXpxOOA4Dv9awk2tMIUt7b2RKMZA4nyam1a0mST8WxM2wtGUbOT+6muN8cu3o6846XZ1quoXV9OTMGC9Ae3eqUUE1xNtjR3c9efCtNpX4CSSNLqaR7ZlLFWQbkIx+YdOPMVzqM2nrPMllNLHbJj2onFzx/Menk/pTi6VJFPb2L4NPit8B2/E3bfJBF7uPkj+1e19LeW0HoSvFDGx3MkTDCnAGCOQP616Qara2dv6VqkaSsmZHlfCj649znwKQ396J5dwZpW/ncAAf4VHAVcYuT2GUkkF5eAwehHu2thmJ60uqWYk5JJPmorpiqRzydsKKKKsJINSG41zRUIMrLVJLdXjfLJINrMPmA6+P8AyvK4v2kASMbVB+b8xqlRRwV2LN1R0W4561BNRRSCFFFFQh//2Q==",
  b3:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCABQAFADASIAAhEBAxEB/8QAGwAAAgMBAQEAAAAAAAAAAAAAAAUCBAYDBwH/xAA1EAACAQMDAgMFBwMFAAAAAAABAgMABBEFEiETMUFRcQYUImGRFSMyQoGCoSQzUmJyosHw/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAH/xAAVEQEBAAAAAAAAAAAAAAAAAAAAAf/aAAwDAQACEQMRAD8A8/ooooCipKhY4AzXY2c6SGN4mRxwVYYP0oK9FbvQfYy3aFJ79jM556YOFX5HzNZ2/wBMhSRlXMT5wo7q3Pb5UCairK2Vw8nTjhd3/wAVGT9K4MjIcMMUEaKKKAproOk/adwWe4ht4YiC7yc/x40qp/7PD+lufD7yI/8AIUGhW19n7KK4WCOS6nwR1HAVUJHfwCj158qXxzwSao62m0wwAvkKSXPAXcT/AKiPpSvVJM3Ji3FYkC7VBwF+Hnj/ALqVhMNO097gqC8rblB8cZC/zk/tqo0957UDRbJYbaNZbwrwG/DGPM/M+VZea+OqLudAkw/EF7H5ijS7xboNaXiIwlk3NKUBkBzzg1wvNQ2QJa28UadOTcJAg3k/M0DSG8iW8jW829GYB8lSGQ8g4I8mBptJbez17DbiaOS0nwBvQBlcgd/EMPTnzrNXTre2azKu0xtuZQO2cBv5AP7qhp0h96Me7MLqxKE5BwD3oOWuaX9nXAKXEU8MpJR4+P4pZT72gH9PaY5+KXt/vNIaipJjcM16FaWmlXukxe5ultcNGhbHKuy4znyOa87HBrV6PqcQ0hbdlSXphmZCNroT+ZW8e3arB8jtGg1V5Z4oJ3RRthdgQ4x+JT2OPI0vu1Ek7sGZlLlyjcMhPfg9xTBZ45UEhBkMgVRG+Fz5HPgee4NWLDTBa61aylyzPuXpyDlGKHB+tEUNN0S6mmFzboBADkySnYi+pNc7vQrq2m69yo6GciSP4kbywR3rdezYjvbZJruT3i4AGRKclfQdh+lZ3V5JLCZjbXXSlc/24WPGTxuHb9KDPQExTqwZlUPvCjlmPoOwq+bc3WpLNBFDAzL8catgKMY3HwGc9hX24sTe6jcTR5LAgCNB+IhRknyFDTRQIZAdhXI6aYOMHn1PHcmgdXUGl2elSe9lbm5Eb7CeFQtk8eZyawL43HFaPVNUD6dJANkQkVfgA3O5BzuZvDv2rNHk0qitB7L6hbaeLmSXYZto2JJ+F1wcj17Vn6BUGstrM3VlGLO6C42seqN21x4Z8OfP61YvdRvbX3aK9tunPbyLIsi8qyjvg9xSTR9Qt4JI+uZIGTtPB3x5MviPT+adjXBrNzFb3EkcZRXQMvwrICRj4Tx4dqqGAufcLg9FgLW6+8SQf4nllB8ME/TFI0le6czzAdG1/ORyx/Knz8/QGr+m294l1Jpvu8d7alx91naU+a57Y9f1qrdWV5NqMdlNHFbRRk4gHOO3gO+fXnxNBLSby8e0mtbK16k0rF3lc4RR8/Oq15a+72jC4uBIQGI6a7QzH5+P6Vd+3RpMtxawvGxlCKzv8YjAznCjjx7Uj1S9t5HcW/UnZ+DPP3/avgP/AHFBLXr23vOjJEqJIQdyJ2UYGB60mooqKKKKKAqQbzqNFA30jXrjTLpJf7yKeVY4P6GqtzqM08rsrNGGJJw2Sc+ZqlRQSLeVRzRRQFFFFB//2Q==",
  b4:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCABQAFADASIAAhEBAxEB/8QAGwAAAgMBAQEAAAAAAAAAAAAAAAQCBQYDAQf/xAAyEAACAQMDAgMHBAEFAAAAAAABAgMABBEFEiExURNBcQYUIoGRwdEjJGGhsTJCYuHx/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAH/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwD5/RRRQFFSCknGDmu8NlcTvtjjZjQLUVoLLSba1Jm1ArJt6RhuM9j39KXvrS0nuSbbFszZPhnO0c9BnkUFPRTj6dcRyBHTaT0JPB+dKsjKcEHNBGiiigK7x2zPAZiyqgO0ZPLHrgCuFWNl4higEWN6TF1BOMkAfig03srp9ir41CCV52HiKJR8OPI46n/FWV3dJbLLc20KrHnl8AfQVWvfMddaeSTJZVQsx7rVbqGslIhbQMNq5BI5znrk9PpVHv7rUNQuGs4Czb87hhQmR3/FTPsnqx/VYw8f8j+K7ezGqtYq6zRbkeQsCRtxwP6rVXeuQJD4phkJx2HH90GVge80gD3uBWjU8EgMoNS1eCw1Gz8exgkiuUOWWLlMdSQOo+VQ1XW3v7a5jjh2ArySck8/1Svs/etDfqVYo3JznGOKCiltmSEShlZCdpweVPYiuFP3Zcxz+LjxHmDsBz1B/NIVBOJd8irkDJxk1tLzQrbR9LEyq93JgfrIf01z1wByT64rEqcEEVsdP1S7jgibCkOudqcgjt/Pp1FAhbWtxreptb2v+5RkkHaMA9a72mnSaHrUbajFG7AH4CwPzFWdjcWMt0JbYra3Cnp0GfTqP8Vx11Z3v0mlQvI3G/rkdgaotdc1W3gtl/bP8QyM4qgt7ozWNxuUABztHPAz0rvrrB7O3VAzOF/0gciqq0i2rJ72JhDncFReWPYnqKDij5aRAu5nGAoGat7ddMgCvehgwGR4Z+L0zXHULq0SYW+mWyoVJVtgyW9e9Vz27LJm6cqxPEY5YntigvrbQ7DVbKaSPxLXaTtmlbKHtu6c+lYuVdkjLkHBxkedaGSeeOycIAqRrna/H/np1JrOMcnJqDynbK9e3G1XZec4PKn1H3FJV6DQa6yv7C+Kw6hEibzlHJ2kHuH/ADVm0M+n3KwxuLyJwSI3wG8u/B6/91iba8aIbGVZIz1jkGQfuPUU2mpgPt2tHCAQo3F9o+f2qj6Hp/uOozeES0c0Y5jkGGH8c9fQ/WldbttOguFhfdPI2dkEfLZ+XT5fWktDZNQkjklfxANqrJu+JSOx6j0pTVpvc5JXibwl5Uvv+Js9z1NBG10zxriSE7bNANzBCHkbr1PQUrfXtlZlotPjRgp+NwdxY92fz+VU7aiN+0q0kOAGXcU3Cl7q8aYbFVIoh0jjGFH3J/k0BeXj3ACl2IBzgcKPQfek69JryoCiiigKkGqNFAzaXs9lOJrWVopB5r5+o868ubua7mMtxIZHPmfL0HlS9FBItUaKKAooooP/2Q==",
  b5:"data:image/jpeg;base64,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",
  b6:"data:image/jpeg;base64,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",
  b7:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCABQAFADASIAAhEBAxEB/8QAGwAAAgMBAQEAAAAAAAAAAAAAAAQCBQYDAQf/xAAwEAACAQMCBAQFAwUAAAAAAAABAgMABBEFIRITMUFRYYGRBhQicaEyscEjNFJi8P/EABgBAAMBAQAAAAAAAAAAAAAAAAIDBAAB/8QAHxEAAwEAAwACAwAAAAAAAAAAAAERAgMSIRMxQXGx/9oADAMBAAIRAxEAPwD5/RRRWMFFSCEgkDpU0hd34FVi3TAG9cp2M5UVbWeiS3ThONQx7AZx69K6zfDsqsY4p42lG3Lf6Sfseh96X8uLKH8WpYUlFdpbeWKVopI2SRTgqwwQa5lSO1MoEI0UUV04FOafp1xfuwgQEJguzEAKPM0nWj0J5LW57ASCMgnpgb0vl085qGceez9BtPtbeMNIRKyrjEY4VPr1JqDqVsGuQAvGxVQP8Rsfc/tVpq2oM8bjmq2QdhSN0eXbQ2j/AFKgXIHctk/zUmda16yppL6LP4VuobeXjkAJx3rz4nuYZ7jmRAA+VP6V8PxtbrI0agsuQGdv4NJ6lpTmblx2qMcZyJG2HvSe2e9C/oldzC50mC/P9zAwjkbuynYH7g7etcotCEk8RljaJMCRgRxArnptvk9APGoWjM0E1qF5RYHCtvhlw3fzFO6a7rbxvNMWUMJVUMT9eVPEfQ9Kc28rwGUz+vW6xXxkhszaW8g/px8WcY2O/wB6rKvNVke7lON1jMufLJqjqvi03n0l5Mx+E4lDSKpOASAT4VqtY0a40rkXcPFNCUXidRkDAx06jasmrFWBHUb1qoL26t4YEineVOWrFGGcEjJx79val81UaD4Sunea4s/meFeUW4Mgjr9hXSzdbqVBNPHAAoPG2eq7bemDXS7it72WNkVIHfIdkGVz2yPek77T5rFk56KVO6ujcQODuaDPVqfTGOr00CahcS2M62l49yIcYWNCC+/TPh+aVGpTIkXzVwYGOd3Ukp5edd/hgi2nma3PFHL08/waU18JLeqJRwRxnJ8vxSUl26/gP2USupFtZHEMqTLwHDLnctt+29EbzR6eJthECFySOuB29KXs9PnvnfkgBAcs7twgA9P+FO2scFm7u4WZ0I4GcYGfIe1O1Ep9sBV+jOi6JPqPPupMwwBGw7jAORucdTWZlULIwByAdj41pJ7y7njnWado05bEIoxuBkZ9u/tWZYliSeppnDW22K5fIjynLC4mSRY1kQKT0kOF9+1J16DTmqoKy46anSri2L/K3zcmUHAkBG3r09DtVjquixxSwrDqXHJyyUWUYJG2d+h7VkLO8NtkcEciN+pHXIPr1B8xT0Opx89SqNEqnCAvxBQeoPT8VJvi0nUVZ5E/GM2T6tpN4VtkKSyHaPh4lY+K9j6VyuE1LVL9hNGWmU/UnDwhT/t4Vp/hmVraZwpWThRSoPXG/Twqm1XUrjUbt2m4YVIP0r4efjQLdfi9CeZ+h7TNEikkkWbUgr8ALrGASBvjfoO9VmrT2/N+VsW5shIHHkHO/j0HptSEmooZmLo0qsfrCvwqQOgHX80ld3ZuMDgSNF/SiDYfyfWjxxabrA1yJKIL2eVpGjaRSo7RnK+/elK9Jryq0ooTN10KKKK6cDNSDVGisYsNP1a409xyyHjzvG+49O4PmK43N5JcuS2FUnPCvT18fWlaKHpm2BdnISLVHNFFECFFFFYx/9k=",
  b8:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCABQAFADASIAAhEBAxEB/8QAGwAAAQUBAQAAAAAAAAAAAAAAAAEDBAUGBwL/xAAtEAACAQMDAgUEAwADAAAAAAABAgMABBEFEiExQRMUIlFxBjKBsUJhwVKh8P/EABgBAAMBAQAAAAAAAAAAAAAAAAABAwIE/8QAHBEAAwADAQEBAAAAAAAAAAAAAAECERIhAzFB/9oADAMBAAIRAxEAPwDn9FTLXTLm7s57mBQ625HiKPuAOece3HNMG2lEZfb6RjJ/ympbAaopcUYpAJRS4oxTwAlFLijacZxxSASinBBIVDBDg9DjrUi60y5tLOC5nUIs5PhqfuIGOce3NPD+gaH6KWa1Y3nW3YlCynO1h2YdgQevStBq2gWl/bmbTgIpM75Lc8IxH6rN/Q+oLZ3jpMSsD4yxHpB/s9s/5W9zDc+I1vJ4JZSCRypPx2NdEPiHVJSc2g0OaW+8vGjeJu27XXGM8cimrrS5IXaAQsZYs7z1HWtfA6Qamkd6quF9STKSCO3B7duOlN3tr53XXjgmBjdd5kkXaVGTwffpVnMrmCUJ1Rj005yCQpxRJp7KftPFdF03RbVnI3lyvVSvFe73Q7Uy7Q5V2HC7eK5LuZeDsfnK5npz620iSaRYFRhcF9uO1epNEljv/LMhEgfbtVdxb4rV2VsbLXVjuJtqRruVo1yWGcAA/mkkZJ9TeOyWONT6nmYkk9uT378dK6Y0r8OG1Sf0kaT9P2lhCJtQAln+9IF5VT8f+FZ/61Sa5K3nAgUhQzHG5iOijuAB16VuMw2xja4k8YquNx4UfjufmsF9cagt5eIsJLQJnDY9JP8AXvj/AGp2+Mr5udcIpdI1GbTbsSwuy5G1gD1FdN0nU7W9UAKsrFBv2RFWGemRXJEOGFbz6eNtOcwT7mjt13EA7lIwMAVnzaawxUmyy1OIW98snhuicg55GD3OeeCBUNdTSK4OnrbKJZJS4desgY569yP1SzatKt5NbarA9wFbYjwgDPHH559/xTFxa2Uluvg3lu6rhlj37ZIjn+Pf8VVW01sjfF2S+ttWdYFVLVUMfDkZGMV7l1Z3iMb2yl5DhOpzUHRL6O8kcTFfMtHhj0E4HfHZh3FGt36WcoS3YC5EYXf1EAPce7HtRcedP4QurdcfCPNqkVxdrY+WUyQSiRpG6xhTnr7n/oU/pUK3N68pidl4UY4GB3AHPPJqtgtbKG2YTXdvGh9RiD7pJTn+R65/qpEGrSveRW2lQNbozbHeUA9ufzx2P4qabXJKaLXFFvq+pWlihBVImCHZuiLMcewrmWr6jNqN2ZZnZsDaoY9BWu14W0UmLmfaXt22kg7iTng1hHxuOKXpxYMQmspnmpVpcPBIrxuyOpyrA4xUWlBxUprVlTdaNqtvJMonVpPMZDrMykMRjoTwfg4PzVpM2mecW2hhiVTHkb1yM55Ug8j91zZJiAR2PWpUF9NFKrpIxx/FmPNX2VdEbfTdIt72/fycxgTIkYBslW7Mh/ea8XmmWlnqW27nNxsy4BbHJ6tIff2Apj6UvbeWVlQ7JSuBFvw/yueG+OtQ9ent7O5kViXlIAMe/Lgj/ljgfFaTWfvDOC/gOmece1mhidUjBwiYGc/aAOtVGsaxbpM3gK6GD0osTKAuQRyRwPgZPxWVmvppZGd5GGSfSrEAVGkmL4HYdBWXSno+scu7l55CzszMxyxJzmotKTSVCq2eRpBRRRWRhSg0lFAHsSEEc9KC5P5rxRWtmGBc0lFFZAKKKKAP/9k=",
  b9:"data:image/jpeg;base64,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",
};

// ── badge components ──────────────────────────────────────────────────────────

function BadgePreview({ b, i, vis }) {
  const rs=RS[b.rarity];
  const [hov,setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ padding:"24px 20px 20px", borderRadius:12,
        border:`1px solid ${hov?rs.border:"rgba(255,255,255,0.08)"}`,
        background:hov?`${rs.color}10`:"transparent",
        opacity:vis?1:0, transform:vis?"none":"translateY(16px)",
        transition:`opacity .5s ${i*.06}s, transform .5s ${i*.06}s, background .2s, border-color .2s`,
        cursor:"default" }}>
      {BADGE_IMG[b.id] && <img src={BADGE_IMG[b.id]} width={60} height={60} style={{ display:"block", marginBottom:12 }} alt={b.name}/>}
      <div style={{ fontSize:8, color:rs.color, fontFamily:"'Inter',sans-serif", letterSpacing:".15em", border:`1px solid ${rs.border}`, borderRadius:4, padding:"2px 8px", display:"inline-block", marginBottom:10 }}>{b.rarity.toUpperCase()}</div>
      <div style={{ fontSize:14, fontWeight:700, color:"#e8e3d5", fontFamily:"'Inter',sans-serif", marginBottom:6 }}>{b.name}</div>
      <div style={{ fontSize:11, color:"#e8e3d5", fontFamily:"'Inter',sans-serif", lineHeight:1.7, marginBottom:14 }}>{b.desc}</div>
      <div style={{ fontSize:9, color:rs.color, fontFamily:"'Inter',monospace", letterSpacing:".1em" }}>ttl · {b.total}d</div>
    </div>
  );
}

function BadgeCard({ b, scoreVal, claimed, daysLeft, onClaim, claiming }) {
  const rs  = RS[b.rarity];
  const eligible = scoreVal >= b.min;   // score high enough
  const active   = eligible && claimed; // actually claimed onchain
  const exp      = active && daysLeft !== null && daysLeft <= 7;
  const pct      = active && b.total ? Math.round(((daysLeft ?? 0) / b.total) * 100) : 0;
  const [hov, setHov] = useState(false);

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      className={active ? "badge-card-active" : ""}
      style={{ padding:"20px 16px 16px", borderRadius:12,
        border:`1px solid ${active ? rs.border : eligible ? "rgba(232,227,213,0.25)" : "rgba(232,227,213,0.08)"}`,
        background: active ? `${rs.color}08` : "transparent",
        opacity: eligible ? 1 : 0.3,
        position:"relative", overflow:"hidden", cursor:"default",
        transform: hov && active ? "translateY(-4px)" : hov && eligible ? "translateY(-2px)" : "none",
        transition:"transform .2s, box-shadow .2s",
        boxShadow: hov && active ? `0 14px 40px rgba(0,0,0,.8), 0 0 20px ${rs.color}22` : hov && eligible ? "0 8px 24px rgba(0,0,0,.6)" : "none" }}>

      {/* top glow line */}
      {active && <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${rs.color}55,transparent)` }}/>}

      {/* sparkles — only on active/eligible badges */}
      {eligible && (
        <div className="badge-sparkle">
          <span className="sp1" style={{ background:rs.color, boxShadow:`0 0 4px ${rs.color}` }}/>
          <span className="sp2" style={{ background:"#fff", boxShadow:"0 0 3px #fff" }}/>
          <span className="sp3" style={{ background:rs.color, boxShadow:`0 0 5px ${rs.color}` }}/>
          <span className="sp4" style={{ background:"#fff", boxShadow:"0 0 3px #fff" }}/>
          <span className="sp5" style={{ background:rs.color, boxShadow:`0 0 4px ${rs.color}` }}/>
          <span className="sp6" style={{ background:"#fff", boxShadow:"0 0 3px #fff", width:3, height:3 }}/>
          <span className="sp7" style={{ background:rs.color, boxShadow:`0 0 4px ${rs.color}`, width:3, height:3 }}/>
        </div>
      )}

      {/* badge image */}
      {BADGE_IMG[b.id]
        ? <img src={BADGE_IMG[b.id]} width={56} height={56} className="badge-img-glow" style={{ display:"block", marginBottom:10, opacity: active?1:eligible?0.7:0.3, color:rs.color }} alt={b.name}/>
        : <div style={{ fontSize:24, fontWeight:300, color:eligible?rs.color:"#444", marginBottom:10 }}>{b.sym}</div>
      }

      {/* rarity pill */}
      <div style={{ fontSize:8, color:eligible?rs.color:"#444", fontFamily:"'Inter',sans-serif", letterSpacing:".15em", border:`1px solid ${eligible?rs.border:"rgba(255,255,255,0.1)"}`, borderRadius:4, padding:"2px 7px", display:"inline-block", marginBottom:8 }}>{b.rarity.toUpperCase()}</div>

      <div className={active?(b.rarity==="Legendary"?"shimmer-accent":"shimmer-text"):""} style={{ fontSize:13, fontWeight:700, color:active?undefined:eligible?"#e8e3d5":"#444", fontFamily:"'Inter',sans-serif", marginBottom:6 }}>{b.name}</div>
      <div style={{ fontSize:10, color:eligible?"#e8e3d5":"#444", fontFamily:"'Inter',sans-serif", lineHeight:1.6, marginBottom:12, opacity:.7 }}>
        {eligible ? b.desc : `score.require(${b.min})`}
      </div>

      {/* TTL bar — only if claimed */}
      {active && (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ fontSize:9, color:exp?"#f87171":"#e8e3d5", fontFamily:"'Inter',sans-serif", letterSpacing:".1em" }}>{exp?"⚠ EXPIRING":"● ACTIVE"}</span>
            <span style={{ fontSize:9, color:exp?"#f87171":rs.color }}>{daysLeft != null ? `${daysLeft}d` : "—"}</span>
          </div>
          <div style={{ height:1, background:"rgba(255,255,255,0.05)", marginBottom:12 }}>
            <div style={{ height:"100%", width:`${pct}%`, background:exp?"#f87171":rs.color, transition:"width .8s" }}/>
          </div>
        </>
      )}

      {/* Claim / Renew button */}
      {eligible && (
        <button
          onClick={onClaim}
          disabled={claiming}
          style={{ width:"100%", padding:"8px 0", fontSize:10, fontWeight:700,
            fontFamily:"'Inter',sans-serif", letterSpacing:".12em", cursor: claiming?"wait":"pointer",
            border:`1px solid ${active ? rs.border : "rgba(232,227,213,0.3)"}`,
            background: active ? "transparent" : "#e8e3d5",
            color: active ? rs.color : "#000",
            borderRadius:6, transition:"all .15s",
            opacity: claiming ? 0.6 : 1 }}
          onMouseEnter={e=>{ if(!claiming) { e.target.style.background=active?"rgba(232,227,213,0.1)":"#fff"; }}}
          onMouseLeave={e=>{ e.target.style.background=active?"transparent":"#e8e3d5"; }}
        >
          {claiming ? "CLAIMING..." : active ? "RENEW →" : "CLAIM →"}
        </button>
      )}
    </div>
  );
}

function Ring({ s }) {
  const r=72, circ=2*Math.PI*r, off=circ*(1-s/1000);
  return (
    <div style={{ position:"relative", width:190, height:190, flexShrink:0 }}>
      <svg width="190" height="190" style={{ transform:"rotate(-90deg)", animation:"ring-glow 3s ease-in-out infinite" }}>
        {Array.from({length:30}).map((_,i)=>{
          const a=(i/30)*2*Math.PI;
          return <line key={i} x1={95+67*Math.cos(a)} y1={95+67*Math.sin(a)} x2={95+74*Math.cos(a)} y2={95+74*Math.sin(a)} stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>;
        })}
        <circle cx="95" cy="95" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5"/>
        <circle cx="95" cy="95" r={r} fill="none" stroke="#e8e3d5" strokeWidth="1.5" strokeLinecap="butt" strokeDasharray={circ} strokeDashoffset={off} style={{ transition:"stroke-dashoffset .04s linear" }}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <div style={{ fontSize:46, fontWeight:300, color:"#e8e3d5", fontFamily:"'Inter',sans-serif", letterSpacing:"-0.05em", lineHeight:1, transition:"font-size .3s" }}>{s}</div>
        <div style={{ fontSize:11, color:"#e8e3d5", fontFamily:"'Inter',sans-serif", marginTop:4 }}>/ 1000</div>
      </div>
    </div>
  );
}

function MiniChart() {
  const mn=Math.min(...HISTORY.map(d=>d.score))-20, mx=Math.max(...HISTORY.map(d=>d.score))+20;
  const W=460, H=70;
  const pts=HISTORY.map((d,i)=>({ x:(i/(HISTORY.length-1))*W, y:H-((d.score-mn)/(mx-mn))*H, ...d }));
  const path=pts.map((p,i)=>`${i===0?"M":"L"} ${p.x} ${p.y}`).join(" ");
  const area=`${path} L ${W} ${H} L 0 ${H} Z`;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:60 }} preserveAspectRatio="none">
        <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e8e3d5" stopOpacity=".12"/><stop offset="100%" stopColor="#e8e3d5" stopOpacity="0"/></linearGradient></defs>
        <path d={area} fill="url(#cg)"/>
        <path d={path} fill="none" stroke="#e8e3d5" strokeWidth="1.5"/>
        {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="3" fill="#e8e3d5"/>)}
      </svg>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:10 }}>
        {HISTORY.map((d,i)=>(
          <div key={i} style={{ textAlign:"center" }}>
            <div style={{ fontSize:9, color:"#e8e3d5", fontFamily:"'Inter',sans-serif" }}>{d.month}</div>
            <div style={{ fontSize:10, color:"#e8e3d5", fontFamily:"'Inter',sans-serif" }}>{d.score}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryBar({ cat, i, activeCat, onToggle }) {
  const [w,setW] = useState(0);
  const pct = Math.round((cat.score/cat.max)*100);
  useEffect(() => {
    const t = setTimeout(()=>setW(pct), 400+i*100);
    return ()=>clearTimeout(t);
  }, [pct]);
  return (
    <div onClick={onToggle} style={{ cursor:"pointer", marginBottom:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
        <span style={{ color:"#e8e3d5", fontSize:12, fontFamily:"'Inter',sans-serif" }}>{cat.icon} {cat.label}</span>
        <span style={{ color:"#fff", fontSize:12, fontFamily:"'Inter',sans-serif" }}>{cat.score}<span style={{ color:"#e8e3d5", opacity:.5 }}>/{cat.max}</span></span>
      </div>
      <div style={{ height:1, background:"rgba(255,255,255,0.06)" }}>
        <div style={{ height:"100%", background:"#e8e3d5", width:`${w}%`, transition:"width 1s ease" }}/>
      </div>
      {activeCat===cat.id && <p style={{ fontSize:10, color:"#e8e3d5", fontFamily:"'Inter',sans-serif", marginTop:8, paddingLeft:16, opacity:.7 }}>{cat.detail}</p>}
    </div>
  );
}

// ── Landing ───────────────────────────────────────────────────────────────────

function Landing({ onLaunch, onDocs }) {
  const [scrollY, setScrollY] = useState(0);
  const howRef=useRef(), featRef=useRef(), bRef=useRef(), ctaRef=useRef();
  const howVis=useInView(howRef), featVis=useInView(featRef), bVis=useInView(bRef), ctaVis=useInView(ctaRef);
  const { isMobile, isTablet } = useBreakpoint();

  useEffect(()=>{ const fn=()=>setScrollY(window.scrollY); window.addEventListener("scroll",fn); return ()=>window.removeEventListener("scroll",fn); },[]);

  const BADGE_GROUPS = [
    { label:"Common",    color:RS.Common.color,    badges:BADGES.filter(b=>b.rarity==="Common") },
    { label:"Rare",      color:RS.Rare.color,      badges:BADGES.filter(b=>b.rarity==="Rare") },
    { label:"Epic",      color:RS.Epic.color,      badges:BADGES.filter(b=>b.rarity==="Epic") },
    { label:"Legendary", color:RS.Legendary.color, badges:BADGES.filter(b=>b.rarity==="Legendary") },
  ];

  return (
    <div style={{ background:"#000", color:"#e8e3d5", fontFamily:"'Inter',sans-serif" }}>
      <Grid/>

      {/* NAV */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, background:scrollY>40?"rgba(0,0,0,0.96)":"transparent", backdropFilter:scrollY>40?"blur(14px)":"none", transition:"background .3s" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 32px", height:56, display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", gap:16 }}>
          {/* left */}
          <div><Logo size={16}/></div>
          {/* center — always true center */}
          {!isMobile ? (
            <div style={{ display:"flex", alignItems:"center", border:"1px solid rgba(232,227,213,0.5)", borderRadius:999, overflow:"hidden" }}>
              {["Docs","Blog","Network"].map((l)=>(
                <span key={l} onClick={l==="Docs" ? onDocs : undefined} style={{ fontSize:11, color:"#e8e3d5", cursor:"pointer", letterSpacing:".05em", padding:"7px 22px", fontFamily:"'Inter',sans-serif", transition:"color .15s, background .15s", whiteSpace:"nowrap" }}
                  onMouseEnter={e=>{ e.target.style.color="#000"; e.target.style.background="#e8e3d5"; }}
                  onMouseLeave={e=>{ e.target.style.color="#e8e3d5"; e.target.style.background="transparent"; }}
                >{l}</span>
              ))}
            </div>
          ) : <div/>}
          {/* right */}
          <div style={{ display:"flex", justifyContent:"flex-end" }}>
            <button onClick={onLaunch} style={{ padding:"8px 20px", background:"#e8e3d5", color:"#000", fontWeight:700, fontSize:11, border:"none", cursor:"pointer", letterSpacing:".1em", fontFamily:"'Inter',sans-serif", borderRadius:4 }}
              onMouseEnter={e=>e.target.style.background="#fff"} onMouseLeave={e=>e.target.style.background="#e8e3d5"}>
              {isMobile ? "APP →" : "LAUNCH APP →"}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight:"100vh", display:"flex", alignItems:"center", padding:isMobile?"80px 20px 60px":"110px 32px 80px", borderBottom:"1px solid rgba(232,227,213,0.15)", position:"relative", overflow:"hidden" }}>
        <div style={{ maxWidth:900, margin:"0 auto", textAlign:"center", width:"100%" }}>
          <Tag>volund reputation score devnet</Tag>
          <h1 style={{ fontSize:"clamp(52px,7vw,100px)", fontWeight:300, color:"#e8e3d5", fontFamily:"'Inter',sans-serif", letterSpacing:"-0.02em", lineHeight:0.95, margin:"32px auto 24px", animation:"fade-up .8s .1s ease both" }}>
            <span className="shimmer-text">Your reputation.</span><br/><span className="shimmer-accent">Onchain.</span>
          </h1>
          <p style={{ fontSize:15, color:"#e8e3d5", lineHeight:2.0, maxWidth:480, marginBottom:40, margin:"0 auto 40px", opacity:.7, animation:"fade-up .8s .25s ease both" }}>
            The native reputation layer for the Rialo ecosystem. Prove your credibility, earn badges, unlock the full power of the Rialo ecosystem.
          </p>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:40, animation:"fade-up .8s .4s ease both" }}>
            <button onClick={onLaunch} style={{ padding:"18px 60px", background:"#e8e3d5", color:"#000", fontWeight:800, fontSize:14, border:"none", cursor:"pointer", letterSpacing:".15em", fontFamily:"'Inter',sans-serif", borderRadius:4, transition:"all .15s" }}
              onMouseEnter={e=>e.target.style.background="#fff"} onMouseLeave={e=>e.target.style.background="#e8e3d5"}>
              LAUNCH APP →
            </button>
          </div>
          <div className="hero-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, maxWidth:700, margin:"0 auto 48px" }}>
            {[
              { icon:"◎", label:"Real-World Credit", sub:"via Rialo" },
              { icon:"◉", label:"Non-Permanent Badges", sub:"30–90d TTL" },
              { icon:"⛓", label:"Onchain Native", sub:"no oracles" },
              { icon:"◈", label:"Privacy First", sub:"threshold MPC" },
              { icon:"↗", label:"DeFi Unlocks", sub:"rates & access" },
              { icon:"◇", label:"Composable", sub:"queryable layer" },
            ].map(f=>(
              <div key={f.label} className="feat-card" style={{ padding:"16px", textAlign:"left" }}>
                <div className="feat-icon" style={{ fontSize:18, marginBottom:8 }}>{f.icon}</div>
                <div className="feat-label" style={{ fontSize:12, fontWeight:600, color:"#e8e3d5", fontFamily:"'Inter',sans-serif", marginBottom:4 }}>{f.label}</div>
                <div className="feat-sub" style={{ fontSize:10, color:"#e8e3d5", opacity:.6, fontFamily:"'Inter',sans-serif" }}>{f.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"center", gap:48, opacity:.5 }}>
            {[{v:"9",l:"badges"},{v:"5",l:"signals"},{v:"4",l:"rarity"},{v:"IPC",l:"powered"}].map(m=>(
              <div key={m.l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:22, fontWeight:300, color:"#e8e3d5", fontFamily:"'Inter',sans-serif", letterSpacing:"-0.04em" }}>{m.v}</div>
                <div style={{ fontSize:10, color:"#e8e3d5", letterSpacing:".1em", marginTop:4 }}>{m.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section ref={howRef} style={{ padding:isMobile?"60px 20px":"100px 32px", borderBottom:"1px solid rgba(232,227,213,0.15)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:isMobile?"0 4px":0 }}>
          <Tag>how it works</Tag>
          <h2 style={{ fontSize:"clamp(30px,4vw,54px)", fontWeight:300, color:"#e8e3d5", fontFamily:"'Inter',sans-serif", letterSpacing:"-0.01em", margin:"20px 0 0", lineHeight:1.1 }}>
            <span className="shimmer-text">Four steps.</span><br/><span className="shimmer-accent">Zero middleware.</span>
          </h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:0, marginTop:60, border:"1px solid #e8e3d5", borderRadius:12, overflow:"hidden" }}>
            {HOW.map((s,i)=>(
              <div key={i} style={{ padding:"32px 28px", borderRight:i<HOW.length-1?"1px solid rgba(232,227,213,0.15)":"none",
                opacity:howVis?1:0, transform:howVis?"none":"translateY(16px)", transition:`opacity .6s ${i*.12}s cubic-bezier(0.16,1,0.3,1), transform .6s ${i*.12}s cubic-bezier(0.16,1,0.3,1)` }}>
                <div style={{ fontSize:11, color:"#e8e3d5", opacity:.4, fontFamily:"'Inter',sans-serif", letterSpacing:".1em", marginBottom:20 }}>{s.n}</div>
                <div style={{ fontSize:17, fontWeight:600, color:"#e8e3d5", fontFamily:"'Inter',sans-serif", letterSpacing:"-0.02em", marginBottom:12 }}>{s.title}</div>
                <div style={{ fontSize:12, color:"#e8e3d5", opacity:.6, lineHeight:1.9 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section ref={featRef} style={{ padding:isMobile?"60px 20px":"100px 32px", borderBottom:"1px solid rgba(232,227,213,0.15)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:isTablet?"1fr":"1fr 1fr", gap:isTablet?40:80, alignItems:"start" }}>
          <div>
            <Tag>score signals</Tag>
            <h2 style={{ fontSize:"clamp(28px,3.5vw,48px)", fontWeight:300, color:"#e8e3d5", fontFamily:"'Inter',sans-serif", letterSpacing:"-0.01em", margin:"20px 0 16px", lineHeight:1.1 }}>
              <span className="shimmer-text">Five signals.</span><br/><span className="shimmer-accent">One score.</span>
            </h2>
            <p style={{ fontSize:12, color:"#e8e3d5", opacity:.6, lineHeight:1.9, maxWidth:340, marginBottom:36 }}>
              Every interaction you've had onchain tells a story. Volund reads it all — and turns it into a single verifiable number.
            </p>
          </div>
          <div>
            {FEATURES.map((f,i)=>(
              <div key={i} style={{ padding:"28px 0", borderBottom:"1px solid rgba(232,227,213,0.15)",
                opacity:featVis?1:0, transform:featVis?"none":"translateX(16px)",
                transition:`opacity .6s ${i*.12}s cubic-bezier(0.16,1,0.3,1), transform .6s ${i*.12}s cubic-bezier(0.16,1,0.3,1)` }}>
                <div style={{ marginBottom:10 }}>
                  <span style={{ fontSize:11, color:"#e8e3d5", opacity:.4, fontFamily:"'Inter',sans-serif" }}>{f.n}</span>
                </div>
                <div style={{ fontSize:18, fontWeight:300, color:"#e8e3d5", fontFamily:"'Inter',sans-serif", letterSpacing:"-0.02em", marginBottom:10 }}>{f.title}</div>
                <div style={{ fontSize:12, color:"#e8e3d5", opacity:.6, lineHeight:1.8 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BADGES */}
      <section ref={bRef} style={{ padding:isMobile?"60px 20px":"100px 32px", borderBottom:"1px solid rgba(232,227,213,0.15)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:isMobile?"0 4px":0 }}>
          <Tag>badge system</Tag>
          <h2 style={{ fontSize:"clamp(28px,4vw,54px)", fontWeight:300, color:"#e8e3d5", fontFamily:"'Inter',sans-serif", letterSpacing:"-0.01em", margin:"20px 0 0", lineHeight:1.05 }}>
            <span className="shimmer-text">Badges expire.</span><br/><span className="shimmer-accent">Keep earning.</span>
          </h2>
          <div style={{ marginTop:60 }}>
            {[
              {label:"Common",    badges:BADGES.filter(b=>b.rarity==="Common")},
              {label:"Rare",      badges:BADGES.filter(b=>b.rarity==="Rare")},
              {label:"Epic",      badges:BADGES.filter(b=>b.rarity==="Epic")},
              {label:"Legendary", badges:BADGES.filter(b=>b.rarity==="Legendary")},
            ].map((group,gi)=>(
              <div key={group.label} style={{ marginBottom:40 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, paddingBottom:10, borderBottom:"1px solid rgba(232,227,213,0.1)" }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:RS[group.label].color }}/>
                  <span style={{ fontSize:10, color:RS[group.label].color, fontFamily:"'Inter',sans-serif", letterSpacing:".2em" }}>{group.label.toUpperCase()}</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12 }}>
                  {group.badges.map((b,i)=><BadgePreview key={b.id} b={b} i={gi*3+i} vis={bVis}/>)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:8, padding:"18px 24px", border:"1px solid rgba(232,227,213,0.12)", borderRadius:12, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
            <span style={{ fontSize:10, color:"#e8e3d5", opacity:.5, fontFamily:"'Inter',sans-serif" }}>
              badge.rule: non-permanent · score decay triggers badge loss
            </span>
            <span style={{ fontSize:10, color:"#e8e3d5", opacity:.5, fontFamily:"'Inter',sans-serif" }}>
              Common 30d · Rare 45d · Epic 60d · Legendary 90d
            </span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} style={{ padding:isMobile?"60px 20px":"120px 32px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", textAlign:"center" }}>
          <Tag>get started</Tag>
          <h2 style={{ fontSize:"clamp(38px,6vw,82px)", fontWeight:300, color:"#e8e3d5", fontFamily:"'Inter',sans-serif", letterSpacing:"-0.02em", margin:"24px 0 16px", lineHeight:1.0,
            opacity:ctaVis?1:0, transform:ctaVis?"none":"translateY(20px)", transition:"opacity .8s, transform .8s" }}>
            <span className="shimmer-text">Check your</span><br/><span className="shimmer-accent">score now.</span>
          </h2>
          <p style={{ fontSize:13, color:"#e8e3d5", opacity:.6, lineHeight:1.9, maxWidth:380, marginBottom:48, margin:"0 auto 48px", opacity:ctaVis?0.6:0, transition:"opacity .8s .15s" }}>
            Built natively on Rialo. No signup. No email. Just connect your wallet — your onchain history does the rest.
          </p>
          <button onClick={onLaunch} style={{ padding:"18px 60px", background:"#e8e3d5", color:"#000", fontWeight:800, fontSize:14, border:"none", cursor:"pointer", letterSpacing:".15em", fontFamily:"'Inter',sans-serif", borderRadius:4, transition:"all .15s",
            opacity:ctaVis?1:0, transition:"opacity .8s .3s, background .15s" }}
            onMouseEnter={e=>e.target.style.background="#fff"} onMouseLeave={e=>e.target.style.background="#e8e3d5"}>
            LAUNCH APP →
          </button>
          <div style={{ marginTop:20, fontSize:10, color:"#e8e3d5", opacity:.3, letterSpacing:".1em" }}>CONNECT · COMPUTE · EARN</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:"1px solid rgba(232,227,213,0.15)", padding:"24px 32px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <Logo size={14}/>
          <div className="footer-links" style={{ display:"flex", gap:20 }}>
            {["@VolundHQ","Discord","Docs","Build"].map(l=>(
              <span key={l} style={{ fontSize:10, color:"#e8e3d5", opacity:.4, fontFamily:"'Inter',sans-serif", letterSpacing:".08em", cursor:"pointer" }}>{l}</span>
            ))}
          </div>
          <span style={{ fontSize:9, color:"#e8e3d5", opacity:.2, fontFamily:"'Inter',sans-serif", letterSpacing:".1em" }}>RRS · DEVNET</span>
        </div>
      </footer>
    </div>
  );
}


// ── Share Score Card ──────────────────────────────────────────────────────────

function ShareModal({ onClose, scoreVal, tier, wallet, social, categories, unlocked }) {
  const canvasRef = useRef();
  const [copied, setCopied] = useState(false);
  const [generated, setGenerated] = useState(false);

  const shortAddr = a => a ? a.slice(0,6)+"..."+a.slice(-4) : "";
  const displayName = social?.github ? `@${social.github}` : shortAddr(wallet);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 800, H = 440;
    canvas.width = W; canvas.height = H;

    // Background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Border
    ctx.strokeStyle = "rgba(232,227,213,0.25)";
    ctx.lineWidth = 1;
    ctx.strokeRect(1,1,W-2,H-2);

    // Top accent line
    const grad = ctx.createLinearGradient(0,0,W,0);
    grad.addColorStop(0,"transparent");
    grad.addColorStop(0.3,"rgba(169,221,211,0.8)");
    grad.addColorStop(0.7,"rgba(232,227,213,0.8)");
    grad.addColorStop(1,"transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,W,1);

    // VOLUND label — top left
    ctx.fillStyle = "rgba(232,227,213,0.4)";
    ctx.font = "600 10px Inter, sans-serif";
    ctx.letterSpacing = "0.2em";
    ctx.fillText("VOLUND REPUTATION SCORE", 40, 44);

    // Score circle
    const cx = 200, cy = 230, r = 100;
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();

    const pct = scoreVal/1000;
    ctx.strokeStyle = "#e8e3d5";
    ctx.lineWidth = 1.5;
    ctx.lineCap = "butt";
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI/2, -Math.PI/2 + pct*Math.PI*2);
    ctx.stroke();

    // Score number
    ctx.fillStyle = "#e8e3d5";
    ctx.font = "300 72px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(scoreVal, cx, cy+20);
    ctx.font = "400 12px Inter, sans-serif";
    ctx.fillStyle = "rgba(232,227,213,0.5)";
    ctx.fillText("/ 1000", cx, cy+44);

    // Tier badge
    ctx.textAlign = "left";
    const tierColors = { Elite:"#e8e3d5", Reputable:"#a9ddd3", Established:"#b8d4f0", Newcomer:"#c8b89a", Unknown:"#666" };
    const tc = tierColors[tier] || "#e8e3d5";
    ctx.strokeStyle = tc + "66";
    ctx.lineWidth = 1;
    ctx.strokeRect(cx-40, cy+60, 80, 24);
    ctx.fillStyle = tc;
    ctx.font = "700 10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(tier.toUpperCase(), cx, cy+76);

    // Right side — categories
    ctx.textAlign = "left";
    const startX = 360, startY = 100;
    categories.forEach((cat, i) => {
      const y = startY + i * 54;
      const pct = cat.score / cat.max;
      const barW = 340;

      ctx.fillStyle = "rgba(232,227,213,0.5)";
      ctx.font = "400 11px Inter, sans-serif";
      ctx.fillText(`${cat.icon}  ${cat.label}`, startX, y);

      ctx.fillStyle = "#e8e3d5";
      ctx.font = "300 11px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${cat.score}/${cat.max}`, startX + barW, y);
      ctx.textAlign = "left";

      // Bar track
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(startX, y+8, barW, 1);
      // Bar fill
      ctx.fillStyle = "#e8e3d5";
      ctx.fillRect(startX, y+8, barW*pct, 1);
    });

    // Bottom info
    ctx.fillStyle = "rgba(232,227,213,0.35)";
    ctx.font = "400 11px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(displayName, 40, H-54);
    ctx.fillText(`${unlocked.length} badges · Base Sepolia`, 40, H-34);

    // Bottom right
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(232,227,213,0.2)";
    ctx.font = "400 10px Inter, sans-serif";
    ctx.fillText("VOLUND · RRS DEVNET", W-40, H-34);

    setGenerated(true);
  }, [scoreVal, tier, wallet, social]);

  function downloadCard() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `volund-rrs-${scoreVal}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function copyToClipboard() {
    const canvas = canvasRef.current;
    canvas.toBlob(async blob => {
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch(e) {
        // Fallback — download instead
        downloadCard();
      }
    });
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center",
      background:"rgba(0,0,0,0.85)", backdropFilter:"blur(12px)", animation:"fade-in .2s ease" }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:"#000", border:"1px solid rgba(232,227,213,0.2)", borderRadius:16, padding:"28px", maxWidth:880, width:"calc(100% - 40px)", animation:"fade-up .3s ease" }}>

        {/* header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <span style={{ fontSize:11, color:"#e8e3d5", opacity:.6, letterSpacing:".2em", fontFamily:"'Inter',sans-serif" }}>SHARE SCORE CARD</span>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:"#e8e3d5", opacity:.5, cursor:"pointer", fontSize:18, lineHeight:1 }}>✕</button>
        </div>

        {/* canvas preview */}
        <div style={{ borderRadius:8, overflow:"hidden", border:"1px solid rgba(232,227,213,0.1)", marginBottom:20 }}>
          <canvas ref={canvasRef} style={{ display:"block", width:"100%", height:"auto" }}/>
        </div>

        {/* actions */}
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={downloadCard} style={{ flex:1, padding:"12px", background:"#e8e3d5", color:"#000", fontWeight:700, fontSize:11, border:"none", borderRadius:8, cursor:"pointer", letterSpacing:".12em", fontFamily:"'Inter',sans-serif" }}
            onMouseEnter={e=>e.target.style.background="#fff"} onMouseLeave={e=>e.target.style.background="#e8e3d5"}>
            ↓ DOWNLOAD PNG
          </button>
          <button onClick={copyToClipboard} style={{ flex:1, padding:"12px", background:"transparent", color:"#e8e3d5", fontWeight:700, fontSize:11, border:"1px solid rgba(232,227,213,0.3)", borderRadius:8, cursor:"pointer", letterSpacing:".12em", fontFamily:"'Inter',sans-serif" }}>
            {copied ? "✓ COPIED!" : "⎘ COPY IMAGE"}
          </button>
        </div>

        <p style={{ fontSize:10, color:"#e8e3d5", opacity:.3, textAlign:"center", marginTop:14, letterSpacing:".08em", fontFamily:"'Inter',sans-serif" }}>
          Share on Twitter · Discord · Telegram
        </p>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

function App({ onBack }) {
  const { isMobile } = useBreakpoint();
  const [tab, setTab] = useState("score");
  const [activeCat, setActiveCat] = useState(null);
  const [filter, setFilter] = useState("All");
  const [showShare, setShowShare] = useState(false);

  const [wallet, setWallet] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [walletError, setWalletError] = useState("");
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const isLive = typeof window !== "undefined" && !!window.ethereum;

  const [onchainData, setOnchainData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [loadStep, setLoadStep] = useState("");

  // Social identity
  const [social, setSocial] = useState({});  // { github: "username", twitter: "handle" }
  const [connectingGH, setConnectingGH] = useState(false);

  // Badge claim state
  // claimedBadges: { [badgeId]: { claimed: bool, daysLeft: number } }
  const [claimedBadges, setClaimedBadges] = useState({});
  const [claimingId, setClaimingId] = useState(null);
  const [claimError, setClaimError] = useState("");
  const [claimSuccess, setClaimSuccess] = useState("");

  const computed   = onchainData ? calcScore(onchainData, social) : null;
  const scoreVal   = computed?.total ?? 0;
  const tier       = computed ? getTier(scoreVal) : "—";
  const categories = computed?.categories ?? [];

  const score    = useEase(scoreVal, !!onchainData);
  const unlocked = BADGES.filter(b => scoreVal >= b.min);
  const filtered = filter==="All" ? BADGES : BADGES.filter(b=>b.rarity===filter);

  // Detect if MetaMask is available (won't work in iframe/sandbox)
  const isDemo = typeof window === "undefined" || !window.ethereum;

  useEffect(() => {
    setHasMetaMask(typeof window !== "undefined" && !!window.ethereum);
    if (isDemo) return;
    window.ethereum.request({ method:"eth_accounts" }).then(accounts => {
      if (accounts.length > 0) { setWallet(accounts[0]); checkNetwork(accounts[0]); }
    }).catch(()=>{});
    const onAcc = (accounts) => { setWallet(accounts[0]||null); setOnchainData(null); if(accounts[0]) checkNetwork(accounts[0]); };
    const onChain = () => window.location.reload();
    window.ethereum.on("accountsChanged", onAcc);
    window.ethereum.on("chainChanged", onChain);
    return () => { window.ethereum.removeListener("accountsChanged",onAcc); window.ethereum.removeListener("chainChanged",onChain); };
  }, []);

  async function checkNetwork(addr) {
    if (!window.ethereum) return;
    const chainId = await window.ethereum.request({ method:"eth_chainId" });
    const wrong = chainId !== ETH_MAINNET;
    setWrongNetwork(wrong);
    if (!wrong && addr) loadData(addr);
  }

  async function switchToMainnet() {
    try {
      await window.ethereum.request({ method:"wallet_switchEthereumChain", params:[{ chainId:ETH_MAINNET }] });
      setWrongNetwork(false);
    } catch(err) {
      // Chain not added yet — add Base Sepolia
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x14a34",
              chainName: "Base Sepolia",
              nativeCurrency: { name:"Ether", symbol:"ETH", decimals:18 },
              rpcUrls: ["https://sepolia.base.org"],
              blockExplorerUrls: ["https://sepolia.basescan.org"],
            }]
          });
          setWrongNetwork(false);
        } catch(e) {}
      }
    }
  }

  async function loadData(addr) {
    setLoadingData(true);
    setLoadStep("connecting to Base Sepolia...");
    try {
      setLoadStep("reading wallet data...");
      const data = await fetchOnchainData(addr);
      setLoadStep("computing score...");
      await new Promise(r => setTimeout(r, 400));
      setOnchainData(data);
      const sc = calcScore(data, social).total;
      await fetchClaimedBadges(addr, sc);
    } catch(e) {
      console.error("loadData error:", e);
      // Even if fetch fails, compute a minimal score from what we have
      const fallback = { balance: 0, txCount: 0, walletAgeMo: 0, ens: null };
      setOnchainData(fallback);
      setLoadStep("");
    } finally {
      setLoadingData(false);
      setLoadStep("");
    }
  }

  async function connectWallet() {
    setWalletError("");
    if (!isLive) {
      // Demo mode — simulate wallet connect with mock data
      setConnecting(true);
      await new Promise(r => setTimeout(r, 800));
      const demoAddr = "0x3f4a8c2e1d9b7f6a5c4d3e2f1a0b9c8d7e6f5a4b";
      setWallet(demoAddr);
      setConnecting(false);
      await loadDemoData();
      return;
    }
    setConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method:"eth_requestAccounts" });
      setWallet(accounts[0]);
      await checkNetwork(accounts[0]);
    } catch(err) {
      if (err.code === 4001) {
        setWalletError("Connection rejected.");
      } else {
        // Still set wallet if we got accounts, just couldn't check network
        setWalletError("Network check failed — trying anyway.");
        setTimeout(() => setWalletError(""), 3000);
      }
    } finally { setConnecting(false); }
  }

  async function loadDemoData() {
    setLoadingData(true);
    setLoadStep("fetching balance & tx count...");
    await new Promise(r => setTimeout(r, 600));
    setLoadStep("computing score...");
    await new Promise(r => setTimeout(r, 600));
    const demoData = { balance: 2.4812, txCount: 847, walletAgeMo: 28, ens: null };
    setOnchainData(demoData);
    fetchClaimedBadges(demoAddr, calcScore(demoData).total);
    setLoadingData(false);
    setLoadStep("");
  }

  function disconnectWallet() { setWallet(null); setWrongNetwork(false); setOnchainData(null); setClaimedBadges({}); setSocial({}); }

  async function connectGitHub() {
    setConnectingGH(true);
    // Demo mode — simulate OAuth flow
    // In production: window.open("/api/auth/github", "_blank") then listen for postMessage
    const GITHUB_CLIENT_ID = "YOUR_GITHUB_CLIENT_ID";
    const isDemo = GITHUB_CLIENT_ID === "YOUR_GITHUB_CLIENT_ID";
    if (isDemo) {
      await new Promise(r => setTimeout(r, 1500));
      // Simulate fetched GitHub profile
      const mockUser = { login: "volund-user", public_repos: 12, followers: 48 };
      setSocial(prev => ({ ...prev, github: mockUser.login, githubRepos: mockUser.public_repos }));
      setConnectingGH(false);
      return;
    }
    // Production OAuth flow
    const popup = window.open(
      `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=read:user`,
      "github-oauth", "width=600,height=700,left=300,top=100"
    );
    const handler = (e) => {
      if (e.data?.type === "github-oauth" && e.data.username) {
        setSocial(prev => ({ ...prev, github: e.data.username }));
        setConnectingGH(false);
        window.removeEventListener("message", handler);
      }
    };
    window.addEventListener("message", handler);
    const check = setInterval(() => {
      if (popup?.closed) { clearInterval(check); setConnectingGH(false); window.removeEventListener("message", handler); }
    }, 500);
  }

  function disconnectGitHub() {
    setSocial(prev => { const s={...prev}; delete s.github; delete s.githubRepos; return s; });
  }

  // Fetch which badges user already holds onchain (or mock in demo)
  async function fetchClaimedBadges(addr, scoreValue) {
    if (!window.ethereum || BADGE_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      // Demo mode — simulate badges based on score
      const demo = {};
      BADGES.forEach(b => {
        if (scoreValue >= b.min) {
          demo[b.id] = { claimed: true, daysLeft: b.total - Math.floor(Math.random()*15) };
        } else {
          demo[b.id] = { claimed: false, daysLeft: null };
        }
      });
      setClaimedBadges(demo);
      return;
    }
    // Real contract read via eth_call
    try {
      const badges = {};
      for (const b of BADGES) {
        const idNum = parseInt(b.id.replace("b",""));
        // hasBadge(address, uint8)
        const hasBadgeData = "0x" + "85f92ea5" +
          addr.slice(2).padStart(64,"0") +
          idNum.toString(16).padStart(64,"0");
        const hasRes = await rpcCall("eth_call", [{ to: BADGE_CONTRACT_ADDRESS, data: hasBadgeData }, "latest"]);
        const hasB = parseInt(hasRes, 16) === 1;

        let daysLeft = null;
        if (hasB) {
          const daysData = "0x" + "07b04f45" +
            addr.slice(2).padStart(64,"0") +
            idNum.toString(16).padStart(64,"0");
          const daysRes = await rpcCall("eth_call", [{ to: BADGE_CONTRACT_ADDRESS, data: daysData }, "latest"]);
          daysLeft = parseInt(daysRes, 16);
        }
        badges[b.id] = { claimed: hasB, daysLeft };
      }
      setClaimedBadges(badges);
    } catch(e) { console.error("fetchClaimedBadges:", e); }
  }

  async function claimBadge(b) {
    setClaimError(""); setClaimSuccess("");
    setClaimingId(b.id);
    const badgeIdNum = parseInt(b.id.replace("b",""));
    const isContractDeployed = BADGE_CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000";

    try {
      // Use demo mode if: no wallet, no contract deployed, or no score yet
      if (!isLive || !isContractDeployed || !scoreVal) {
        await new Promise(r => setTimeout(r, 1200));
        setClaimedBadges(prev => ({
          ...prev,
          [b.id]: { claimed: true, daysLeft: b.total }
        }));
        setClaimSuccess(`${b.name} claimed! (demo)`);
        setTimeout(() => setClaimSuccess(""), 3000);
        return;
      }

      // ── Production flow ──────────────────────────────────────────────────

      // 1. Request signature from backend
      const sigRes = await fetch(BADGE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: wallet, badgeId: badgeIdNum }),
      }).then(r => r.json());

      if (!sigRes.signature) throw new Error(sigRes.error || "Backend signing failed");

      // 2. Encode tx data manually (no ethers.js required in browser)
      // claimBadge(uint8 badgeId, uint16 score, bytes sig)
      // selector: keccak256("claimBadge(uint8,uint16,bytes)") = 0x...
      // Use eth_sendTransaction with ABI-encoded data
      const abi = ["function claimBadge(uint8,uint16,bytes)"];
      const iface = new (await import("https://esm.sh/ethers@6")).Interface(abi);
      const data = iface.encodeFunctionData("claimBadge", [
        badgeIdNum, sigRes.score, sigRes.signature
      ]);

      // 3. Send transaction
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: wallet, to: BADGE_CONTRACT_ADDRESS, data, chainId: "0x14a34" }],
      });

      setClaimSuccess(`${b.name} claimed! Tx: ${txHash.slice(0,10)}…`);
      setTimeout(() => { fetchClaimedBadges(wallet, scoreVal); setClaimSuccess(""); }, 4000);

    } catch(e) {
      const msg = e?.code === 4001 ? "Transaction rejected."
        : e?.message?.includes("score_too_low") ? "Score too low for this badge."
        : e?.message || "Claim failed. Try again.";
      setClaimError(msg);
      setTimeout(() => setClaimError(""), 5000);
    } finally {
      setClaimingId(null);
    }
  }

  const panel = { border:"1px solid rgba(232,227,213,0.2)", borderRadius:12, padding:"28px", marginBottom:10 };
  const label = { fontSize:9, color:"#e8e3d5", opacity:.5, letterSpacing:".3em", marginBottom:22, fontFamily:"'Inter',sans-serif", display:"block" };

  return (
    <div style={{ background:"#000", minHeight:"100vh", fontFamily:"'Inter',sans-serif" }}>
      <Grid/>
      <div style={{ maxWidth:760, margin:"0 auto", padding:"32px 20px", position:"relative", zIndex:1 }}>

        {/* nav */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:36, paddingBottom:24, borderBottom:"1px solid rgba(232,227,213,0.2)", flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <button onClick={onBack} style={{ fontSize:11, color:"#e8e3d5", background:"transparent", border:"none", cursor:"pointer", fontFamily:"'Inter',sans-serif", padding:0, letterSpacing:".05em", opacity:.6 }}
              onMouseEnter={e=>e.target.style.opacity="1"} onMouseLeave={e=>e.target.style.opacity=".6"}>← back</button>
            <div style={{ width:1, height:14, background:"rgba(232,227,213,0.3)" }}/>
            <Logo size={16}/>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#e8e3d5" }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background: wrongNetwork?"#f87171": wallet?"#4ade80":"rgba(232,227,213,0.3)", animation:"pulse 2s infinite" }}/>
              {wrongNetwork
                ? <button onClick={switchToMainnet} style={{ fontSize:10, color:"#f87171", background:"transparent", border:"none", cursor:"pointer", fontFamily:"'Inter',sans-serif", padding:0, textDecoration:"underline" }}>wrong network — switch to Base Sepolia</button>
                : <span style={{ opacity:.6 }}>{wallet ? "Base Sepolia" : "not connected"}</span>
              }
            </div>
            {wallet && (
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ fontSize:11, color:"#e8e3d5", border:"1px solid rgba(232,227,213,0.3)", borderRadius:8, padding:"5px 12px" }}>{shortAddr(wallet)}</div>
                <button onClick={disconnectWallet} style={{ fontSize:10, color:"#e8e3d5", background:"transparent", border:"1px solid rgba(232,227,213,0.2)", borderRadius:8, padding:"5px 10px", cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>disconnect</button>
              </div>
            )}
            {!wallet && (
              <button onClick={connectWallet} style={{ fontSize:11, fontWeight:700, color:"#000", background:"#e8e3d5", border:"none", borderRadius:8, padding:"7px 16px", cursor:"pointer", fontFamily:"'Inter',sans-serif", letterSpacing:".08em" }}>
                {connecting ? "connecting..." : "CONNECT"}
              </button>
            )}
          </div>
        </div>

        {/* connect gate */}
        {!wallet && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", textAlign:"center" }}>
            <div style={{ fontSize:11, color:"#e8e3d5", opacity:.5, letterSpacing:".2em", marginBottom:24 }}>VOLUND REPUTATION SCORE</div>
            <h2 style={{ fontSize:"clamp(32px,5vw,64px)", fontWeight:300, color:"#e8e3d5", fontFamily:"'Inter',sans-serif", letterSpacing:"-0.02em", lineHeight:1.0, marginBottom:16, animation:"fade-up .6s ease both" }}>
              <span className="shimmer-text">Connect your</span><br/><span className="shimmer-accent">wallet.</span>
            </h2>
            <p style={{ fontSize:13, color:"#e8e3d5", opacity:.6, lineHeight:1.9, maxWidth:340, marginBottom:40 }}>
              Volund RRS is the reputation infrastructure powering the Rialo ecosystem. Your score unlocks IPC access, better rates, and exclusive badges.
            </p>
            {walletError && <div style={{ fontSize:11, color:"#f87171", marginBottom:16, padding:"8px 16px", border:"1px solid rgba(248,113,113,0.3)", borderRadius:8 }}>{walletError}</div>}
            {!isLive && (
              <div style={{ fontSize:11, color:"#a9ddd3", marginBottom:16, padding:"8px 16px", border:"1px solid rgba(169,221,211,0.3)", borderRadius:8 }}>
                Demo mode — MetaMask not detected. Score will use sample data.
              </div>
            )}
            <button onClick={connectWallet} disabled={connecting} style={{ padding:"16px 48px", background:"#e8e3d5", color:"#000", fontWeight:700, fontSize:13, border:"none", cursor:"pointer", letterSpacing:".12em", fontFamily:"'Inter',sans-serif", borderRadius:8, opacity:connecting?0.7:1 }}
              onMouseEnter={e=>{ if(!connecting) e.target.style.background="#fff"; }} onMouseLeave={e=>{ e.target.style.background="#e8e3d5"; }}>
              {connecting ? "CONNECTING..." : isLive ? "CONNECT WALLET →" : "LAUNCH DEMO →"}
            </button>
            <div style={{ fontSize:10, color:"#e8e3d5", opacity:.3, marginTop:16, letterSpacing:".1em" }}>{isLive ? "MetaMask · Injected · Base Sepolia" : "Demo · Base Sepolia · Mock Data"}</div>
          </div>
        )}

        {/* wrong network */}
        {wallet && wrongNetwork && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", textAlign:"center", gap:16 }}>
            <div style={{ fontSize:48 }}>⚠️</div>
            <h2 style={{ fontSize:28, fontWeight:300, color:"#f87171", fontFamily:"'Inter',sans-serif" }}>Wrong Network</h2>
            <p style={{ fontSize:13, color:"#e8e3d5", opacity:.6, maxWidth:300 }}>Please switch to Base Sepolia to continue.</p>
            <button onClick={switchToMainnet} style={{ padding:"14px 36px", background:"#e8e3d5", color:"#000", fontWeight:700, fontSize:13, border:"none", cursor:"pointer", letterSpacing:".12em", fontFamily:"'Inter',sans-serif", borderRadius:8 }}>SWITCH TO BASE SEPOLIA →</button>
          </div>
        )}

        {/* dashboard */}
        {wallet && !wrongNetwork && (
          <>
            <h1 style={{ fontSize:32, fontWeight:300, color:"#e8e3d5", margin:"0 0 6px", fontFamily:"'Inter',sans-serif", letterSpacing:"-0.01em" }}>Reputation Score</h1>
            <p style={{ color:"#e8e3d5", opacity:.5, fontSize:11, margin:"0 0 28px" }}>powered by rialo · base sepolia testnet</p>

            <div style={{ display:"flex", marginBottom:28, borderBottom:"1px solid rgba(232,227,213,0.2)" }}>
              {["score","badges"].map(t=>(
                <button key={t} onClick={()=>setTab(t)} style={{ padding:"12px 24px", border:"none", background:"transparent", cursor:"pointer", fontFamily:"'Inter',sans-serif", fontSize:11, letterSpacing:".1em", color:tab===t?"#fff":"#e8e3d5", borderBottom:tab===t?"1px solid #fff":"1px solid transparent", marginBottom:"-1px", transition:"all .15s", textTransform:"uppercase" }}>
                  {t==="score" ? "Score" : `Badges (${unlocked.length}/${BADGES.length})`}
                </button>
              ))}
            </div>

            {tab==="score" && (
              <>
                {loadingData && (
                  <div style={{ textAlign:"center", padding:"60px 0" }}>
                    <div style={{ color:"#e8e3d5", fontSize:11, letterSpacing:".2em", opacity:.6, marginBottom:12 }}>COMPUTING SCORE</div>
                    <div style={{ color:"#a9ddd3", fontSize:10, letterSpacing:".1em", opacity:.8, fontFamily:"'Inter',sans-serif" }}>{loadStep}</div>
                    <div style={{ width:40, height:1, background:"#e8e3d5", margin:"20px auto 0", animation:"loading-bar 1.2s ease-in-out infinite" }}/>
                  </div>
                )}
                {!loadingData && !onchainData && (
                  <div style={{ textAlign:"center", padding:"60px 0" }}>
                    <div style={{ color:"#e8e3d5", fontSize:11, letterSpacing:".1em", marginBottom:8, opacity:.6 }}>Wallet connected. Ready to score.</div>
                    <div style={{ color:"#e8e3d5", fontSize:10, letterSpacing:".08em", marginBottom:24, opacity:.35, fontFamily:"'Inter',sans-serif" }}>reads balance, tx count & wallet age from Base Sepolia</div>
                    <button onClick={()=>loadData(wallet)} style={{ padding:"14px 40px", background:"#e8e3d5", color:"#000", fontWeight:700, fontSize:12, border:"none", borderRadius:8, cursor:"pointer", letterSpacing:".12em", fontFamily:"'Inter',sans-serif" }}
                      onMouseEnter={e=>e.target.style.background="#fff"} onMouseLeave={e=>e.target.style.background="#e8e3d5"}>
                      COMPUTE SCORE →
                    </button>
                  </div>
                )}
                {!loadingData && onchainData && (
                  <>
                    <div className="score-panel" style={{ ...panel, display:"flex", alignItems:"center", gap:36, flexWrap:"wrap", justifyContent:"center" }}>
                      <Ring s={score}/>
                      <div style={{ flex:1, minWidth:200 }}>
                        <div style={{ display:"inline-flex", alignItems:"center", gap:8, border:"1px solid rgba(232,227,213,0.25)", padding:"5px 14px", marginBottom:18, borderRadius:4 }}>
                          <div style={{ width:5, height:5, borderRadius:"50%", background:"#e8e3d5", animation:"pulse 2s infinite" }}/>
                          <span style={{ fontSize:10, fontWeight:700, letterSpacing:".2em", color:"#e8e3d5", fontFamily:"'Inter',sans-serif" }}>{tier.toUpperCase()}</span>
                        </div>
                        <div style={{ marginBottom:20 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                            <span style={{ fontSize:10, color:"#e8e3d5", opacity:.6 }}>progress → Elite</span>
                            <span style={{ fontSize:10, color:"#e8e3d5", opacity:.6 }}>{Math.max(900-scoreVal,0)} pts</span>
                          </div>
                          <div style={{ height:1, background:"rgba(255,255,255,0.06)" }}>
                            <div style={{ height:"100%", width:`${Math.min((scoreVal/900)*100,100)}%`, background:"#e8e3d5" }}/>
                          </div>
                        </div>
                        <div style={{ fontSize:11, color:"#e8e3d5", lineHeight:2.5 }}>
                          <div style={{ opacity:.6 }}>wallet <span style={{ color:"#fff", opacity:1 }}>{onchainData?.ens || shortAddr(wallet)}</span></div>
                          <div style={{ opacity:.6 }}>tx.count <span style={{ color:"#fff", opacity:1 }}>{onchainData?.txCount ?? "—"}</span></div>
                          <div style={{ opacity:.6 }}>wallet.age <span style={{ color:"#fff", opacity:1 }}>{onchainData?.walletAgeMo ? `${onchainData.walletAgeMo} months` : "—"}</span></div>
                          <div style={{ opacity:.6 }}>badges.earned <span style={{ color:"#fff", opacity:1 }}>{unlocked.length}/{BADGES.length}</span></div>
                        </div>
                        <div style={{ display:"flex", gap:8, marginTop:22 }}>
                          <button onClick={()=>setShowShare(true)} style={{ padding:"10px 22px", background:"#e8e3d5", color:"#000", fontWeight:700, fontSize:11, border:"none", cursor:"pointer", letterSpacing:".12em", fontFamily:"'Inter',sans-serif", borderRadius:4 }} onMouseEnter={e=>e.target.style.background="#fff"} onMouseLeave={e=>e.target.style.background="#e8e3d5"}>SHARE →</button>
                          <button onClick={()=>loadData(wallet)} style={{ padding:"10px 22px", background:"transparent", color:"#e8e3d5", fontSize:11, border:"1px solid rgba(232,227,213,0.3)", borderRadius:8, cursor:"pointer", letterSpacing:".12em", fontFamily:"'Inter',sans-serif" }}>REFRESH</button>
                        </div>
                      </div>
                    </div>
                    <div style={panel}>
                      <span style={label}>SCORE.BREAKDOWN</span>
                      {categories.map((cat,i)=>(
                        <CategoryBar key={cat.id} cat={cat} i={i} activeCat={activeCat} onToggle={()=>setActiveCat(activeCat===cat.id?null:cat.id)}/>
                      ))}
                    </div>
                    <div style={panel}>
                      <span style={label}>IDENTITY.LINKS</span>
                      {/* GitHub */}
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 0", borderBottom:"1px solid rgba(232,227,213,0.1)" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#e8e3d5" opacity={social.github?1:0.4}>
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                          </svg>
                          <div>
                            <div style={{ fontSize:12, color:"#e8e3d5", fontFamily:"'Inter',sans-serif", fontWeight:600 }}>GitHub</div>
                            <div style={{ fontSize:10, color:"#e8e3d5", opacity:.5, fontFamily:"'Inter',sans-serif" }}>
                              {social.github ? `@${social.github} · ${social.githubRepos ?? 0} repos · +60 pts` : "Connect to boost identity score +60 pts"}
                            </div>
                          </div>
                        </div>
                        {social.github ? (
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ fontSize:9, color:"#4ade80", fontFamily:"'Inter',sans-serif", letterSpacing:".1em" }}>● LINKED</span>
                            <button onClick={disconnectGitHub} style={{ fontSize:9, color:"#e8e3d5", opacity:.5, background:"transparent", border:"none", cursor:"pointer", fontFamily:"'Inter',sans-serif", letterSpacing:".08em" }}>unlink</button>
                          </div>
                        ) : (
                          <button onClick={connectGitHub} disabled={connectingGH} style={{ padding:"7px 16px", background:"#e8e3d5", color:"#000", fontWeight:700, fontSize:10, border:"none", borderRadius:6, cursor:"pointer", letterSpacing:".1em", fontFamily:"'Inter',sans-serif", opacity:connectingGH?0.6:1 }}>
                            {connectingGH ? "LINKING..." : "CONNECT →"}
                          </button>
                        )}
                      </div>
                      {/* ENS */}
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 0", borderBottom:"1px solid rgba(232,227,213,0.1)" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                          <div style={{ width:18, height:18, borderRadius:"50%", background:"linear-gradient(135deg,#5298ff,#a855f7)", opacity:onchainData?.ens?1:0.4, flexShrink:0 }}/>
                          <div>
                            <div style={{ fontSize:12, color:"#e8e3d5", fontFamily:"'Inter',sans-serif", fontWeight:600 }}>ENS</div>
                            <div style={{ fontSize:10, color:"#e8e3d5", opacity:.5, fontFamily:"'Inter',sans-serif" }}>
                              {onchainData?.ens ? `${onchainData.ens} · +40 pts` : "No ENS name detected on this wallet · +40 pts"}
                            </div>
                          </div>
                        </div>
                        {onchainData?.ens
                          ? <span style={{ fontSize:9, color:"#4ade80", fontFamily:"'Inter',sans-serif", letterSpacing:".1em" }}>● LINKED</span>
                          : <a href="https://app.ens.domains" target="_blank" rel="noreferrer" style={{ padding:"7px 16px", background:"transparent", color:"#e8e3d5", fontWeight:700, fontSize:10, border:"1px solid rgba(232,227,213,0.3)", borderRadius:6, cursor:"pointer", letterSpacing:".1em", fontFamily:"'Inter',sans-serif", textDecoration:"none" }}>GET ENS →</a>
                        }
                      </div>
                      {/* Twitter — coming soon */}
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 0", opacity:.4 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#e8e3d5">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                          <div>
                            <div style={{ fontSize:12, color:"#e8e3d5", fontFamily:"'Inter',sans-serif", fontWeight:600 }}>Twitter / X</div>
                            <div style={{ fontSize:10, color:"#e8e3d5", opacity:.5, fontFamily:"'Inter',sans-serif" }}>Coming soon · +30 pts</div>
                          </div>
                        </div>
                        <span style={{ fontSize:9, color:"#e8e3d5", fontFamily:"'Inter',sans-serif", letterSpacing:".1em", border:"1px solid rgba(232,227,213,0.2)", borderRadius:4, padding:"4px 10px" }}>SOON</span>
                      </div>
                    </div>

                    <div style={panel}>
                      <span style={label}>SCORE.HISTORY(6m)</span>
                      <MiniChart/>
                    </div>
                  </>
                )}
              </>
            )}

            {tab==="badges" && (
              <>
{/* floating toast — always visible */}
              {(claimError || claimSuccess) && (
                <div style={{ position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)", zIndex:999,
                  padding:"12px 24px", borderRadius:8, fontSize:12, fontFamily:"'Inter',sans-serif",
                  border:`1px solid ${claimError ? "rgba(248,113,113,0.5)" : "rgba(169,221,211,0.5)"}`,
                  background: claimError ? "rgba(20,0,0,0.95)" : "rgba(0,20,18,0.95)",
                  color: claimError ? "#f87171" : "#a9ddd3",
                  backdropFilter:"blur(10px)", whiteSpace:"nowrap",
                  boxShadow:"0 8px 32px rgba(0,0,0,0.6)" }}>
                  {claimError || `✓ ${claimSuccess}`}
                </div>
              )}
                <div className="badge-stats" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:10 }}>
                  {[
                    {label:"earned",   val:Object.values(claimedBadges).filter(x=>x.claimed).length},
                    {label:"eligible", val:unlocked.length},
                    {label:"expiring", val:Object.values(claimedBadges).filter(x=>x.claimed&&x.daysLeft!=null&&x.daysLeft<=7).length},
                    {label:"epic+",    val:Object.values(claimedBadges).filter((_,i)=>{ const b=BADGES[i]; return b&&(b.rarity==="Epic"||b.rarity==="Legendary")&&claimedBadges[b.id]?.claimed; }).length},
                  ].map(s=>(
                    <div key={s.label} style={{ ...panel, padding:"18px 14px", marginBottom:0, textAlign:"center" }}>
                      <div style={{ fontSize:26, fontWeight:300, color:"#e8e3d5", fontFamily:"'Inter',sans-serif", letterSpacing:"-0.01em" }}>{s.val}</div>
                      <div style={{ fontSize:9, color:"#e8e3d5", opacity:.5, letterSpacing:".12em", marginTop:4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", marginBottom:14, border:"1px solid rgba(232,227,213,0.2)", borderRadius:12, overflow:"auto" }}>
                  {["All","Common","Rare","Epic","Legendary"].map(r=>{
                    const a=filter===r;
                    return <button key={r} onClick={()=>setFilter(r)} style={{ flex:1, padding:"9px 0", border:"none", background:a?"#e8e3d5":"transparent", color:a?"#000":"#e8e3d5", fontSize:9, fontFamily:"'Inter',sans-serif", cursor:"pointer", letterSpacing:".1em", fontWeight:a?700:400, transition:"all .15s", opacity:a?1:0.5 }}>{r.toUpperCase()}</button>;
                  })}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:`repeat(auto-fill,minmax(${isMobile?"140px":"196px"},1fr))`, gap:8, marginBottom:10 }}>
                  {filtered.map(b=>(
                  <BadgeCard
                    key={b.id}
                    b={b}
                    scoreVal={scoreVal}
                    claimed={claimedBadges[b.id]?.claimed ?? false}
                    daysLeft={claimedBadges[b.id]?.daysLeft ?? null}
                    claiming={claimingId === b.id}
                    onClaim={()=>claimBadge(b)}
                  />
                ))}
                </div>
                <div style={panel}>
                  <span style={label}>BADGE.SYSTEM.DOCS</span>
                  <div className="badge-docs" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    {[
                      {c:"badge.ttl(30–90d)",     t:"Badges expire. Not permanent."},
                      {c:"score.maintain()",       t:"Stay active to auto-renew."},
                      {c:"decay.rate(6mo)",        t:"Inactivity causes score decay."},
                      {c:"tier.require(sustained)",t:"Epic+ needs consistent high scores."},
                    ].map(x=>(
                      <div key={x.c} style={{ padding:"16px", border:"1px solid rgba(232,227,213,0.15)", borderRadius:12 }}>
                        <div style={{ fontSize:10, color:"#e8e3d5", opacity:.5, fontFamily:"'Inter',sans-serif", marginBottom:6 }}>{x.c}</div>
                        <div style={{ fontSize:11, color:"#e8e3d5", opacity:.7, fontFamily:"'Inter',sans-serif", lineHeight:1.6 }}>{x.t}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div style={{ marginTop:36, paddingTop:24, borderTop:"1px solid rgba(232,227,213,0.15)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <Logo size={14}/>
              <span style={{ fontSize:9, color:"#e8e3d5", opacity:.2, fontFamily:"'Inter',sans-serif", letterSpacing:".12em" }}>RRS · DEVNET</span>
            </div>
          </>
        )}
      </div>

      {/* Share Modal */}
      {showShare && onchainData && (
        <ShareModal
          onClose={()=>setShowShare(false)}
          scoreVal={scoreVal}
          tier={tier}
          wallet={wallet}
          social={social}
          categories={categories}
          unlocked={unlocked}
        />
      )}
    </div>
  );
}


// ── Docs ─────────────────────────────────────────────────────────────────────

const DOCS_CSS = `:root {
    --bg: #000;
    --bg1: #0a0a0a;
    --bg2: #111;
    --border: rgba(232,227,213,0.12);
    --border-hi: rgba(232,227,213,0.3);
    --text: #e8e3d5;
    --text-dim: rgba(232,227,213,0.45);
    --accent: #a9ddd3;
    --gold: #c8b89a;
    --rare: #b8d4f0;
    --epic: #a9ddd3;
    --legendary: #e8e3d5;
    --mono: 'Inter', sans-serif;
    --display: 'Inter', sans-serif;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    line-height: 1.8;
    overflow-x: hidden;
  }

  /* scrollbar */
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: #000; }
  ::-webkit-scrollbar-thumb { background: rgba(232,227,213,0.2); }

  /* ── Layout ── */
  .layout { display: flex; min-height: 100vh; }

  /* ── Sidebar ── */
  .sidebar {
    width: 260px;
    flex-shrink: 0;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    border-right: 1px solid var(--border);
    background: var(--bg);
    overflow-y: auto;
    z-index: 100;
    padding: 0 0 40px;
  }

  .sidebar-logo {
    padding: 28px 24px 24px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 8px;
  }

  .sidebar-logo .logo-mark {
    font-family: 'Inter', sans-serif;
    font-size: 20px;
    font-weight: 300;
    color: var(--text);
    letter-spacing: -0.02em;
    display: block;
  }

  .sidebar-logo .logo-sub {
    font-size: 9px;
    color: var(--text-dim);
    letter-spacing: 0.2em;
    margin-top: 2px;
  }

  .nav-section {
    padding: 16px 24px 4px;
  }

  .nav-section-label {
    font-size: 8px;
    letter-spacing: 0.25em;
    color: var(--text-dim);
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .nav-link {
    display: block;
    padding: 7px 12px;
    font-size: 11px;
    color: var(--text-dim);
    text-decoration: none;
    border-radius: 4px;
    transition: all 0.15s;
    border-left: 2px solid transparent;
    margin-bottom: 1px;
    font-family: 'Inter', sans-serif;
  }

  .nav-link:hover { color: var(--text); background: rgba(232,227,213,0.04); }
  .nav-link.active { color: var(--accent); border-left-color: var(--accent); background: rgba(169,221,211,0.06); }

  /* ── Main ── */
  .main {
    margin-left: 260px;
    flex: 1;
    min-width: 0;
  }

  /* ── Top bar ── */
  .topbar {
    position: sticky;
    top: 0;
    background: rgba(0,0,0,0.92);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    padding: 0 48px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 50;
  }

  .topbar-path { font-size: 11px; color: var(--text-dim); }
  .topbar-path span { color: var(--text); }

  .topbar-badge {
    font-size: 9px;
    letter-spacing: 0.15em;
    padding: 4px 12px;
    border: 1px solid var(--border-hi);
    border-radius: 999px;
    color: var(--text-dim);
  }

  /* ── Content ── */
  .content {
    max-width: 760px;
    padding: 60px 48px 120px;
  }

  /* ── Section ── */
  .section {
    margin-bottom: 80px;
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 0.5s ease, transform 0.5s ease;
  }
  .section.visible { opacity: 1; transform: none; }

  .section-tag {
    font-size: 9px;
    letter-spacing: 0.25em;
    color: var(--text-dim);
    text-transform: uppercase;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section-tag::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
    max-width: 60px;
  }

  h1 {
    font-family: 'Inter', sans-serif;
    font-size: clamp(32px, 4vw, 52px);
    font-weight: 300;
    color: var(--text);
    letter-spacing: -0.02em;
    line-height: 1.05;
    margin-bottom: 20px;
  }

  h2 {
    font-family: 'Inter', sans-serif;
    font-size: 26px;
    font-weight: 300;
    color: var(--text);
    letter-spacing: -0.02em;
    margin-bottom: 16px;
  }

  h3 {
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: var(--text);
    margin: 28px 0 10px;
  }

  p {
    color: rgba(232,227,213,0.7);
    margin-bottom: 16px;
    line-height: 1.9;
  }

  .lead {
    font-size: 15px;
    color: rgba(232,227,213,0.8);
    line-height: 2.0;
    margin-bottom: 32px;
  }

  /* ── Accent text ── */
  .accent { color: var(--accent); }

  /* ── Callout ── */
  .callout {
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    background: rgba(169,221,211,0.04);
    padding: 16px 20px;
    border-radius: 0 8px 8px 0;
    margin: 24px 0;
    font-size: 12px;
    color: rgba(232,227,213,0.75);
  }
  .callout strong { color: var(--accent); font-family: 'Inter', sans-serif; }

  /* ── Code ── */
  code {
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    background: rgba(232,227,213,0.07);
    border: 1px solid var(--border);
    padding: 2px 7px;
    border-radius: 4px;
    color: var(--accent);
  }

  pre {
    background: var(--bg1);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 20px 24px;
    overflow-x: auto;
    margin: 20px 0;
    font-size: 11px;
    line-height: 1.8;
    color: rgba(232,227,213,0.8);
    font-family: 'Courier New', monospace;
  }
  pre code { background: none; border: none; padding: 0; color: inherit; }

  .code-comment { color: rgba(232,227,213,0.3); }
  .code-key { color: var(--accent); }
  .code-val { color: var(--gold); }
  .code-num { color: #f0a070; }

  /* ── Score visual ── */
  .score-formula {
    display: grid;
    gap: 0;
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    margin: 24px 0;
  }

  .formula-row {
    display: grid;
    grid-template-columns: 200px 1fr 80px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
    align-items: center;
    transition: background 0.15s;
  }
  .formula-row:last-child { border-bottom: none; }
  .formula-row:hover { background: rgba(232,227,213,0.03); }

  .formula-label { font-size: 11px; color: var(--text); display: flex; align-items: center; gap: 8px; }
  .formula-detail { font-size: 10px; color: var(--text-dim); font-family: 'Inter', sans-serif; }
  .formula-max { font-size: 12px; color: var(--accent); text-align: right; font-family: 'Inter', sans-serif; font-weight: 700; }

  .formula-bar-wrap { margin-top: 6px; height: 1px; background: rgba(255,255,255,0.05); grid-column: 1/-1; }
  .formula-bar { height: 100%; background: var(--accent); transition: width 1s ease; }

  /* ── Badge grid ── */
  .badge-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 10px;
    margin: 24px 0;
  }

  .badge-card {
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }
  .badge-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.6);
  }

  .badge-card.common  { border-color: rgba(200,184,154,0.3); }
  .badge-card.rare    { border-color: rgba(184,212,240,0.3); }
  .badge-card.epic    { border-color: rgba(169,221,211,0.3); }
  .badge-card.legendary { border-color: rgba(232,227,213,0.4); }
  .badge-card.legendary::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(232,227,213,0.6), transparent);
  }

  .badge-rarity {
    font-size: 8px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    margin-bottom: 8px;
    display: block;
  }
  .badge-rarity.common    { color: var(--gold); }
  .badge-rarity.rare      { color: var(--rare); }
  .badge-rarity.epic      { color: var(--epic); }
  .badge-rarity.legendary { color: var(--legendary); }

  .badge-name {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 6px;
  }

  .badge-req {
    font-size: 10px;
    color: var(--text-dim);
    margin-bottom: 8px;
  }

  .badge-ttl {
    font-size: 9px;
    color: var(--text-dim);
    font-family: 'Inter', sans-serif;
  }

  /* ── Tier table ── */
  .tier-table { margin: 24px 0; }
  .tier-row {
    display: grid;
    grid-template-columns: 100px 80px 1fr;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    align-items: center;
    font-size: 11px;
    transition: background 0.15s;
  }
  .tier-row:first-child { border-top: 1px solid var(--border); }
  .tier-row:hover { background: rgba(232,227,213,0.02); }
  .tier-name { font-family: 'Inter', sans-serif; font-weight: 700; }

  /* ── Divider ── */
  hr { border: none; border-top: 1px solid var(--border); margin: 40px 0; }

  /* ── Shimmer text ── */
  @keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
  .shimmer {
    background: linear-gradient(90deg, var(--text) 0%, var(--text) 35%, #fff 50%, var(--text) 65%, var(--text) 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 4s linear infinite;
  }

  /* ── Fade in ── */
  @keyframes fade-up { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:none } }`;

function Docs({ onBack }) {
  const { isMobile } = useBreakpoint();

  useEffect(() => {
    // Scroll spy & section reveal
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.docs-nav-link');

    const revealObs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.08 });
    sections.forEach(s => revealObs.observe(s));

    const spyObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          navLinks.forEach(l => l.classList.remove('active'));
          const a = document.querySelector(`.docs-nav-link[href="#${e.target.id}"]`);
          if (a) a.classList.add('active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(s => spyObs.observe(s));

    return () => { revealObs.disconnect(); spyObs.disconnect(); };
  }, []);

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", background:"#000", minHeight:"100vh" }}>
      <style>{DOCS_CSS}</style>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <span className="logo-mark">Volund</span>
            <span className="logo-sub">RRS · Documentation</span>
          </div>
          <div className="nav-section">
            <div className="nav-section-label">Getting Started</div>
            <a href="#overview"  className="nav-link docs-nav-link active">Overview</a>
            <a href="#how"       className="nav-link docs-nav-link">How it works</a>
            <a href="#tiers"     className="nav-link docs-nav-link">Score tiers</a>
          </div>
          <div className="nav-section">
            <div className="nav-section-label">Score System</div>
            <a href="#score-intro" className="nav-link docs-nav-link">Overview</a>
            <a href="#onchain"     className="nav-link docs-nav-link">Onchain Activity</a>
            <a href="#defi"        className="nav-link docs-nav-link">DeFi Behavior</a>
            <a href="#identity"    className="nav-link docs-nav-link">Identity & Trust</a>
            <a href="#realworld"   className="nav-link docs-nav-link">Real-World Credit</a>
            <a href="#community"   className="nav-link docs-nav-link">Community</a>
          </div>
          <div className="nav-section">
            <div className="nav-section-label">Badge System</div>
            <a href="#badges-overview" className="nav-link docs-nav-link">Overview</a>
            <a href="#rarity"          className="nav-link docs-nav-link">Rarity tiers</a>
            <a href="#ttl"             className="nav-link docs-nav-link">TTL & expiry</a>
            <a href="#claim"           className="nav-link docs-nav-link">Claiming badges</a>
            <a href="#all-badges"      className="nav-link docs-nav-link">All badges</a>
          </div>
        </aside>
        <main className="main">
          <div className="topbar">
            <button onClick={onBack} style={{
              padding:"6px 14px", background:"transparent",
              border:"1px solid rgba(232,227,213,0.2)", color:"#e8e3d5",
              fontSize:10, fontFamily:"'Inter',sans-serif", letterSpacing:".1em",
              cursor:"pointer", borderRadius:4, transition:"all .15s"
            }}>← BACK</button>
            <div className="topbar-path">docs / <span>volund-rrs</span></div>
            <div className="topbar-badge">DEVNET · Base Sepolia</div>
          </div>
          <div className="content">

            <section className="section" id="overview">
              <div className="section-tag">01 · Overview</div>
              <h1><span className="shimmer">Volund Reputation Score</span></h1>
              <p className="lead">Volund RRS is the native reputation layer for the Rialo ecosystem — turning your entire onchain history into a single verifiable score from 0 to 1000. No signup, no email, no middlemen. Just connect your wallet.</p>
              <p>Built on Base Sepolia, Volund RRS aggregates five distinct signal categories to produce a composite reputation score. Scores are non-permanent — they decay over time and must be actively maintained through onchain behavior.</p>
              <div className="callout"><strong>Note:</strong> Volund RRS is currently deployed on Base Sepolia. Full integration with Rialo mainnet is planned for a future release.</div>
              <h3>Why Rialo needs a reputation layer?</h3>
              <p>Rialo enables real-world data to live natively onchain — but without a reputation layer, that data has no context. Volund RRS provides the trust infrastructure: a transparent, composable score that any Rialo-connected protocol can query natively, without oracles or middleware.</p>
              <pre dangerouslySetInnerHTML={{__html: `<code style={{fontFamily:"monospace",fontSize:11,lineHeight:2,color:"rgba(232,227,213,0.7)"}}>// Query any wallet's score
const score = await volundRRS.getScore("0xWallet");
// → { total: 742, tier: "Reputable", ecosystem: "rialo" }</code>`}}/>
            </section>

            <section className="section" id="how">
              <div className="section-tag">02 · How it works</div>
              <h2>Four steps. Zero middleware.</h2>
              <p>VRS is computed entirely from public onchain data and Rialo signals. No KYC, no data brokers, no intermediaries — just transparent, verifiable reputation.</p>
              <div className="score-formula">
                {["01 · Connect Wallet","02 · Compute Score","03 · Earn Badges","04 · Unlock Benefits"].map((s,i)=>(
                  <div key={i} className="formula-row" style={{background:i===0?"rgba(232,227,213,0.02)":"transparent"}}>
                    <div className="formula-label">{s}</div>
                    <div className="formula-detail">{["MetaMask or injected · Base Sepolia","Balance · tx count · age · DeFi · identity","Score thresholds unlock soulbound badges (TTL 30–90d)","DeFi rates · DAO voting · early access"][i]}</div>
                    <div className="formula-max" style={{color:"rgba(232,227,213,0.4)"}}>→</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="section" id="tiers">
              <div className="section-tag">03 · Score tiers</div>
              <h2>Score tiers</h2>
              <p>Every wallet falls into one of five tiers based on their total VRS score.</p>
              <div className="tier-table">
                {[["Elite","900–1000","#e8e3d5","Top tier. Maximum DeFi privileges, Legendary badge eligibility."],
                  ["Reputable","700–899","#a9ddd3","Strong history. Epic badge eligibility. Preferred DeFi rates."],
                  ["Established","500–699","#b8d4f0","Growing reputation. Rare badge eligibility."],
                  ["Newcomer","200–499","#c8b89a","Early stage. Common badges available."],
                  ["Unknown","0–199","rgba(232,227,213,0.3)","Insufficient onchain history."]
                ].map(([name,range,color,desc])=>(
                  <div key={name} className="tier-row">
                    <div className="tier-name" style={{color}}>{name}</div>
                    <div style={{color:"#a9ddd3",fontSize:11}}>{range}</div>
                    <div style={{color:"rgba(232,227,213,0.45)",fontSize:11}}>{desc}</div>
                  </div>
                ))}
              </div>
            </section>

            <hr/>

            <section className="section" id="score-intro">
              <div className="section-tag">04 · Score system</div>
              <h2>How the score is calculated</h2>
              <p>VRS is composed of five weighted categories. Each has a maximum contribution to the total score of 1000.</p>
              <pre dangerouslySetInnerHTML={{__html: `<code style={{fontFamily:"monospace",fontSize:11,lineHeight:2,color:"rgba(232,227,213,0.7)"}}>// Score formula
total = onchain(300) + defi(250) + identity(200) + realworld(150) + community(100)
total = Math.min(total, 1000)</code>`}}/>
              <div className="score-formula">
                {[["⛓","Onchain Activity","tx count · wallet age · ETH balance",300],
                  ["↗","DeFi Behavior","protocol interactions · repayment history",250],
                  ["◈","Identity & Trust","ENS · GitHub · Twitter/X",200],
                  ["◎","Real-World Credit","Rialo · coming soon",150],
                  ["◇","Community","DAO participation · coming soon",100]
                ].map(([icon,label,detail,max])=>(
                  <div key={label} className="formula-row">
                    <div className="formula-label"><span style={{opacity:.5}}>{icon}</span> {label}</div>
                    <div className="formula-detail">{detail}</div>
                    <div className="formula-max">{max}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="section" id="onchain">
              <h3>Onchain Activity <code style={{float:"right",fontSize:11}}>max 300</code></h3>
              <p>The foundation of your score. Measures raw onchain participation.</p>
              <pre dangerouslySetInnerHTML={{__html: `<code style={{fontFamily:"monospace",fontSize:11,lineHeight:2,color:"rgba(232,227,213,0.7)"}}>txPts   = Math.min(txCount x 0.4, 180)\nagePts  = Math.min(walletAgeMo x 4, 90)\nbalPts  = Math.min(log10(eth + 0.01) x 15 + 20, 30)\nonchain = Math.min(txPts + agePts + balPts, 300)</code>`}}/>
            </section>

            <section className="section" id="defi">
              <h3>DeFi Behavior <code style={{float:"right",fontSize:11}}>max 250</code></h3>
              <p>Estimated from transaction patterns. Full DeFi analysis coming soon.</p>
              <pre dangerouslySetInnerHTML={{__html: `<code style={{fontFamily:"monospace",fontSize:11,lineHeight:2,color:"rgba(232,227,213,0.7)"}}>defi = Math.min(txCount x 0.08, 160)\n// Future: liquidations, repayment rate, protocol diversity</code>`}}/>
            </section>

            <section className="section" id="identity">
              <h3>Identity & Trust <code style={{float:"right",fontSize:11}}>max 200</code></h3>
              <p>Link verifiable identities to prove you're a real, trusted participant.</p>
              <div className="score-formula">
                {[["Base","Connected wallet","+40"],["ENS Name","Registered ENS on this wallet","+40"],["GitHub","OAuth-verified GitHub account","+60"],["Twitter / X","OAuth-verified Twitter account","+30"]].map(([label,detail,max])=>(
                  <div key={label} className="formula-row">
                    <div className="formula-label">{label}</div>
                    <div className="formula-detail">{detail}</div>
                    <div className="formula-max">{max}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="section" id="realworld">
              <h3>Real-World Credit <code style={{float:"right",fontSize:11}}>max 150</code></h3>
              <p>Rialo makes Volund the first reputation system to incorporate real-world credit signals natively onchain — without a single oracle or middleware layer.</p>
              <div className="callout"><strong>Coming with Rialo mainnet:</strong> Traditional credit signals bridged natively onchain through Rialo using threshold MPC — zero data exposure, full privacy preservation.</div>
            </section>

            <section className="section" id="community">
              <h3>Community <code style={{float:"right",fontSize:11}}>max 100</code></h3>
              <p>DAO participation, governance voting, and community contributions.</p>
              <pre dangerouslySetInnerHTML={{__html: `<code style={{fontFamily:"monospace",fontSize:11,lineHeight:2,color:"rgba(232,227,213,0.7)"}}>community = Math.min(walletAgeMo x 0.8, 60)\n// Future: DAO votes, governance activity</code>`}}/>
            </section>

            <hr/>

            <section className="section" id="badges-overview">
              <div className="section-tag">05 · Badge system</div>
              <h2>Badges expire. Keep earning.</h2>
              <p className="lead">Volund badges are soulbound NFTs that represent your standing in the Rialo ecosystem. Unlike static NFTs, they carry a TTL — your reputation must be actively maintained to keep them alive.</p>
              <div className="callout"><strong>Soulbound:</strong> No <code>transferFrom</code> function exists. Badges cannot be sold, traded, or moved under any circumstances.</div>
            </section>

            <section className="section" id="rarity">
              <h3>Rarity tiers</h3>
              <div className="score-formula">
                {[["◆ Common","Score ≥ 0 · available to all wallets","TTL 30d","#c8b89a"],
                  ["◆ Rare","Score ≥ 500 · Established tier and above","TTL 45d","#b8d4f0"],
                  ["◆ Epic","Score ≥ 700 · Reputable tier and above","TTL 60d","#a9ddd3"],
                  ["◆ Legendary","Score ≥ 900 · Elite tier only","TTL 90d","#e8e3d5"]
                ].map(([label,detail,max,color])=>(
                  <div key={label} className="formula-row">
                    <div className="formula-label" style={{color}}>{label}</div>
                    <div className="formula-detail">{detail}</div>
                    <div className="formula-max" style={{color}}>{max}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="section" id="ttl">
              <h3>TTL & expiry</h3>
              <p>Every badge has an <code>expiresAt</code> timestamp. Once expired, the badge is inactive and must be re-claimed.</p>
              <pre dangerouslySetInnerHTML={{__html: `<code style={{fontFamily:"monospace",fontSize:11,lineHeight:2,color:"rgba(232,227,213,0.7)"}}>[UNCLAIMED]  --&gt;  claimBadge()  --&gt;  [ACTIVE]\n[ACTIVE]     --&gt;  TTL expired   --&gt;  [EXPIRED]\n[ACTIVE]     --&gt;  claimBadge()  --&gt;  [RENEWED]  // resets timer\n[EXPIRED]    --&gt;  claimBadge()  --&gt;  [ACTIVE]   // re-mint</code>`}}/>
            </section>

            <section className="section" id="claim">
              <h3>Claiming badges</h3>
              <p>Badge claims are backend-verified. The server independently computes your score, then issues an ECDSA signature your wallet submits to the contract.</p>
              <pre dangerouslySetInnerHTML={{__html: `<code style={{fontFamily:"monospace",fontSize:11,lineHeight:2,color:"rgba(232,227,213,0.7)"}}>// 1. Request signature\nPOST /api/badge/sign  &#123;address, badgeId&#125;\n\n// 2. Backend returns\n&#123;signature, score, nonce&#125;\n\n// 3. Contract call\ncontract.claimBadge(badgeId, score, signature)</code>`}}/>
              <div className="callout"><strong>Anti-replay:</strong> Each claim increments the wallet's nonce on-contract. Signatures cannot be reused.</div>
            </section>

            <section className="section" id="all-badges">
              <h3>All badges</h3>
              <div className="badge-grid">
                {[
                  {id:"b1",name:"First Steps",rarity:"common",min:0,ttl:30},
                  {id:"b2",name:"Early Mover",rarity:"common",min:0,ttl:30},
                  {id:"b3",name:"Trusted Agent",rarity:"rare",min:500,ttl:45},
                  {id:"b4",name:"DeFi Dabbler",rarity:"rare",min:500,ttl:45},
                  {id:"b5",name:"Chain Veteran",rarity:"epic",min:700,ttl:60},
                  {id:"b6",name:"Rialo Pioneer",rarity:"epic",min:700,ttl:60},
                  {id:"b7",name:"Score Crusher",rarity:"epic",min:700,ttl:60},
                  {id:"b8",name:"Onchain Legend",rarity:"legendary",min:900,ttl:90},
                  {id:"b9",name:"Rialo OG",rarity:"legendary",min:900,ttl:90},
                ].map(b=>(
                  <div key={b.id} className={`badge-card ${b.rarity}`}>
                    {BADGE_IMG[b.id] && <img src={BADGE_IMG[b.id]} width={40} height={40} style={{marginBottom:10,display:"block"}} alt={b.name}/>}
                    <span className={`badge-rarity ${b.rarity}`}>{b.rarity}</span>
                    <div className="badge-name">{b.name}</div>
                    <div className="badge-req">Score ≥ {b.min}</div>
                    <div className="badge-ttl">ttl · {b.ttl}d</div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}

// ── root ──────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  body{background:#000;color:#e8e3d5;}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
  @keyframes loading-bar{0%{width:10px;opacity:.3}50%{width:80px;opacity:1}100%{width:10px;opacity:.3}}
  @keyframes fade-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
  @keyframes fade-in{from{opacity:0}to{opacity:1}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  .shimmer-text{
    background: linear-gradient(90deg, #e8e3d5 0%, #e8e3d5 35%, #ffffff 50%, #e8e3d5 65%, #e8e3d5 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 4s linear infinite;
  }
  .shimmer-accent{
    background: linear-gradient(90deg, #a9ddd3 0%, #a9ddd3 35%, #ffffff 50%, #a9ddd3 65%, #a9ddd3 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 4s linear infinite;
  }
  @keyframes ring-glow{0%,100%{filter:drop-shadow(0 0 4px rgba(232,227,213,0.2))}50%{filter:drop-shadow(0 0 12px rgba(232,227,213,0.5))}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  .animate-fade-up{animation:fade-up .6s ease both}
  .badge-card-claimed:hover{animation:float 2s ease-in-out infinite!important;}
  @keyframes sparkle-1{0%,100%{opacity:0;transform:scale(0) rotate(0deg)}50%{opacity:1;transform:scale(1) rotate(180deg)}}
  @keyframes sparkle-2{0%,100%{opacity:0;transform:scale(0) rotate(45deg)}40%{opacity:1;transform:scale(1.2) rotate(225deg)}}
  @keyframes sparkle-3{0%,100%{opacity:0;transform:scale(0)}60%{opacity:1;transform:scale(0.8)}}
  @keyframes badge-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  .badge-sparkle{pointer-events:none;position:absolute;inset:0;overflow:hidden;}
  .badge-sparkle span{position:absolute;width:4px;height:4px;border-radius:50%;pointer-events:none;}
  .sp1{top:12%;left:15%;animation:sparkle-1 2.2s 0s ease-in-out infinite;}
  .sp2{top:8%;right:18%;animation:sparkle-2 2.5s .3s ease-in-out infinite;}
  .sp3{top:25%;right:10%;animation:sparkle-1 1.8s .6s ease-in-out infinite;}
  .sp4{bottom:20%;left:8%;animation:sparkle-3 2.0s .9s ease-in-out infinite;}
  .sp5{bottom:15%;right:15%;animation:sparkle-2 2.3s .4s ease-in-out infinite;}
  .sp6{top:50%;left:5%;animation:sparkle-1 1.9s 1.1s ease-in-out infinite;}
  .sp7{top:35%;right:5%;animation:sparkle-3 2.4s .7s ease-in-out infinite;}
  .badge-img-glow{transition:filter .3s;}
  .badge-card-active:hover .badge-img-glow{filter:drop-shadow(0 0 8px currentColor) brightness(1.15);}
  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-track{background:#000;}
  ::-webkit-scrollbar-thumb{background:rgba(232,227,213,0.2);}
  .feat-card{background:rgba(255,255,255,0.015);border:1px solid rgba(232,227,213,0.15);border-radius:12px;transition:all .2s;cursor:default;}
  .feat-card:hover{background:#e8e3d5 !important;border-color:#e8e3d5 !important;}
  .feat-card:hover .feat-label{color:#000 !important;}
  .feat-card:hover .feat-sub{color:rgba(0,0,0,0.5) !important;}
  .feat-card:hover .feat-icon{filter:grayscale(1) brightness(0);}
  @media(max-width:639px){
    .nav-links{display:none!important;}
    .hero-grid{grid-template-columns:1fr!important;}
    .feat-grid{grid-template-columns:1fr!important;gap:0!important;}
    .badge-stats{grid-template-columns:repeat(2,1fr)!important;}
    .badge-docs{grid-template-columns:1fr!important;}
    .score-panel{flex-direction:column!important;align-items:center!important;}
    .footer-links{display:none!important;}
  }
`;

export default function Root() {
  const [view, setView] = useState("landing");
  const [fade, setFade] = useState(false);
  const go = to => { setFade(true); setTimeout(()=>{ setView(to); setFade(false); try{window.scrollTo(0,0);}catch(e){} },380); };
  return (
    <>
      <style>{CSS}</style>
      <div style={{ opacity:fade?0:1, transition:"opacity .38s ease" }}>
        {view==="landing" && <Landing onLaunch={()=>go("app")} onDocs={()=>go("docs")}/>}
        {view==="app"     && <App onBack={()=>go("landing")}/>}
        {view==="docs"    && <Docs onBack={()=>go("landing")}/>}
      </div>
    </>
  );
}
