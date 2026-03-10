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
      ensAvatar = await fetch(`https://metadata.ens.domains/mainnet/avatar/${ens}`)
        .then(rx => rx.ok ? rx.url : null).catch(() => null);
    }
  } catch (e) {}

  return { balance, txCount, walletAgeMo, ens, ensAvatar };
}

// ── Score calculation ─────────────────────────────────────────────────────────

export function calcScore(d, social = {}) {
  const { balance, txCount, walletAgeMo } = d;
  const txPts  = Math.min(txCount * 0.4, 180);
  const agePts = Math.min(walletAgeMo * 4, 90);
  const balPts = Math.min(balance > 0 ? Math.log10(balance + 0.01) * 15 + 20 : 0, 30);
  const onchain = Math.round(Math.min(txPts + agePts + balPts, 300));
  const defi    = Math.round(Math.min(txCount * 0.08, 160));

  let identity = 40;
  const identityDetails = [{ label: "Base Score", pts: 40 }];
  if (d.ens)          { identity += 40; identityDetails.push({ label: `ENS: ${d.ens}`, pts: 40 }); }
  if (social.github)  { identity += 60; identityDetails.push({ label: `GitHub: @${social.github}`, pts: 60 }); }
  if (social.twitter) { identity += 30; identityDetails.push({ label: `X: @${social.twitter}`, pts: 30 }); }
  identity = Math.min(identity, 200);

  const realworld = 0;
  const community = Math.round(Math.min(walletAgeMo * 0.8, 60));
  const total     = Math.min(onchain + defi + identity + realworld + community, 1000);

  return {
    total,
    categories: [
      { id:"onchain",   icon:"⛓", label:"Onchain Activity",  score:onchain,   max:300, details:[{ label:`${txCount} txns`, pts:Math.round(txPts) },{ label:`${walletAgeMo}mo wallet age`, pts:Math.round(agePts) },{ label:`${balance} ETH balance`, pts:Math.round(balPts) }] },
      { id:"defi",      icon:"↗", label:"DeFi Behavior",     score:defi,      max:250, details:[{ label:"Estimated from tx patterns", pts:defi }] },
      { id:"identity",  icon:"◈", label:"Identity & Trust",  score:identity,  max:200, details:identityDetails },
      { id:"realworld", icon:"◎", label:"Real-World Credit", score:realworld, max:150, details:[{ label:"Rialo integration coming soon", pts:0 }] },
      { id:"community", icon:"◇", label:"Community",         score:community, max:100, details:[{ label:"Estimated from wallet age", pts:community }] },
    ],
  };
}

export function getTier(s) {
  if (s >= 900) return "Elite";
  if (s >= 700) return "Reputable";
  if (s >= 500) return "Established";
  if (s >= 200) return "Newcomer";
  return "Unknown";
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
