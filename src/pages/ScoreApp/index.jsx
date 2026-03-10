import { useState, useEffect, useRef } from "react";
import { readCache, writeCache, clearCache, formatCacheAge } from "../../hooks/useScoreCache";
import { requestNotificationPermission, notifyExpiringBadges, getExpiringBadges } from "../../hooks/useNotifications";
import { BADGES, RS, ETH_MAINNET, BADGE_CONTRACT_ADDRESS, BADGE_API_URL, BADGE_ABI } from "../../constants";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { useEase } from "../../hooks/useInView";
import { fetchOnchainData, calcScore, getTier, shortAddr, generateHistory } from "../../utils/onchain";
import Logo from "../../components/Logo";
import Tag from "../../components/Tag";
import ThemeToggle from "../../components/ThemeToggle";
import Grid from "../../components/Grid";
import { Ring, MiniChart, CategoryBar } from "../../components/Ring";
import { BadgeCard, BADGE_IMG } from "../../components/BadgeCard";
import ShareModal from "../../components/ShareModal";

export default function ScoreApp({ onBack, canInstall, onInstall, theme, toggleTheme }) {
  const { isMobile } = useBreakpoint();
  const [tab, setTab] = useState("score");
  const [activeCat, setActiveCat] = useState(null);
  const [filter, setFilter] = useState("All");
  const [showShare, setShowShare] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);

  const [wallet, setWallet] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [walletError, setWalletError] = useState("");
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const isLive = typeof window !== "undefined" && !!window.ethereum;

  const [onchainData, setOnchainData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [loadStep, setLoadStep] = useState("");

  // ── Cache state ──
  const [cacheAge, setCacheAge] = useState(null);      // ms since last cache
  const [fromCache, setFromCache] = useState(false);   // true when showing cached data

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
      if (accounts.length > 0) {
        setWallet(accounts[0]);
        // ── Try loading from cache first ──
        const cached = readCache(accounts[0]);
        if (cached && cached.onchainData) {
          setOnchainData(cached.onchainData);
          setClaimedBadges(cached.claimedBadges || {});
          setSocial(cached.social || {});
          setFromCache(true);
          setCacheAge(cached.ageMs);
          // If cache is stale, still fetch fresh data in background
          if (cached.stale) checkNetwork(accounts[0]);
        } else {
          checkNetwork(accounts[0]);
        }
      }
    }).catch(()=>{});
    const onAcc = (accounts) => {
      setWallet(accounts[0]||null);
      setOnchainData(null);
      setFromCache(false);
      setCacheAge(null);
      if(accounts[0]) {
        const cached = readCache(accounts[0]);
        if (cached?.onchainData) {
          setOnchainData(cached.onchainData);
          setClaimedBadges(cached.claimedBadges || {});
          setSocial(cached.social || {});
          setFromCache(true);
          setCacheAge(cached.ageMs);
          if (cached.stale) checkNetwork(accounts[0]);
        } else {
          checkNetwork(accounts[0]);
        }
      }
    };
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
    setFromCache(false);
    setLoadStep("connecting to Base Sepolia...");
    try {
      setLoadStep("reading wallet data...");
      const data = await fetchOnchainData(addr);
      setLoadStep("computing score...");
      await new Promise(r => setTimeout(r, 400));
      setOnchainData(data);
      const sc = calcScore(data, social).total;
      const claimed = await fetchClaimedBadges(addr, sc);
      // ── Write to cache ──
      writeCache(addr, { onchainData: data, claimedBadges: claimed || {}, social });
      setCacheAge(0);
      // ── Request notification permission and fire expiry alerts ──
      requestNotificationPermission().then(() => {
        notifyExpiringBadges(claimed || {}, BADGES, addr);
      });
    } catch(e) {
      console.error("loadData error:", e);
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
      await loadDemoData(demoAddr);
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

  async function loadDemoData(addr) {
    setLoadingData(true);
    setFromCache(false);
    setLoadStep("fetching balance & tx count...");
    await new Promise(r => setTimeout(r, 600));
    setLoadStep("computing score...");
    await new Promise(r => setTimeout(r, 600));
    const demoData = { balance: 2.4812, txCount: 847, walletAgeMo: 28, ens: null };
    setOnchainData(demoData);
    const sc = calcScore(demoData, social).total;
    const claimed = await fetchClaimedBadges(addr, sc);
    writeCache(addr, { onchainData: demoData, claimedBadges: claimed || {}, social });
    setCacheAge(0);
    setLoadingData(false);
    setLoadStep("");
  }

  function disconnectWallet() {
    if (wallet) clearCache(wallet);
    setWallet(null); setWrongNetwork(false); setOnchainData(null);
    setClaimedBadges({}); setSocial({}); setFromCache(false); setCacheAge(null);
  }

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
  // Returns the badges object so callers can use it for caching.
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
      return demo;
    }
    // Real contract read via eth_call
    try {
      const badges = {};
      for (const b of BADGES) {
        const idNum = parseInt(b.id.replace("b",""));
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
      return badges;
    } catch(e) { console.error("fetchClaimedBadges:", e); return {}; }
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

  const panel = { 
    background: theme === "dark" ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.02)",
    backdropFilter:"blur(24px) saturate(180%)",
    border: theme === "dark" ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)",
    borderRadius: 24, padding:"28px", 
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative", overflow: "hidden",
    boxShadow: theme === "dark" ? "0 1px 0 0 rgba(255,255,255,0.04) inset" : "0 1px 0 0 rgba(255,255,255,0.8) inset"
  };
  const label = { fontSize:9, color:"var(--text)", opacity:.35, letterSpacing:".3em", marginBottom:18, fontFamily:"'Inter',sans-serif", display:"block", textTransform: "uppercase", fontWeight: 600 };

  return (
    <div style={{ background:"var(--bg)", minHeight:"100vh", fontFamily:"'Inter',sans-serif", color:"var(--text)", transition:"background 0.3s, color 0.3s" }}>
      <Grid/>
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 24px 48px", position:"relative", zIndex:1 }}>

        {/* ── Sticky top nav ────────────────────────────────────────────── */}
        <div style={{
          position: "sticky", top: 0, zIndex: 100,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding: "16px 0",
          marginBottom: 40,
          borderBottom: "1px solid var(--border)",
          background: theme === "dark" ? "rgba(0,0,0,0.7)" : "rgba(247,245,240,0.8)",
          backdropFilter: "blur(20px) saturate(160%)",
          flexWrap:"wrap", gap:12
        }}>
          {/* Left — logo & back */}
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"var(--text)", background:"transparent", border:"none", cursor:"pointer", fontFamily:"'Inter',sans-serif", padding:0, opacity:.5, transition:"opacity .15s" }}
              onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity=".5"}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              back
            </button>
            <div style={{ width:1, height:18, background:"var(--border)" }}/>
            <Logo size={22}/>
          </div>

          {/* Right — wallet, network, actions */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {/* Network pill */}
            <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, padding:"5px 12px", borderRadius:999, background: wrongNetwork?"rgba(248,113,113,0.08)":"rgba(74,222,128,0.07)", border: `1px solid ${wrongNetwork?"rgba(248,113,113,0.2)":"rgba(74,222,128,0.2)"}` }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background: wrongNetwork?"#f87171":"#4ade80", animation:"pulse 2s infinite" }}/>
              <span style={{ color: wrongNetwork?"#f87171":"#4ade80", fontWeight:600 }}>{wrongNetwork ? "Wrong Network" : "Base Sepolia"}</span>
            </div>

            {wrongNetwork && (
              <button onClick={switchToMainnet} style={{ padding:"6px 14px", background:"#f87171", color:"#fff", border:"none", borderRadius:999, fontSize:10, fontWeight:700, cursor:"pointer", letterSpacing:".05em" }}>SWITCH →</button>
            )}

            <ThemeToggle theme={theme} toggle={toggleTheme}/>

            {wallet && (
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 12px", border:"1px solid var(--border)", borderRadius:12, fontSize:11, fontWeight:600, color:"var(--text)", background: "rgba(255,255,255,0.03)", cursor:"pointer" }}
                  onClick={() =>{ navigator.clipboard.writeText(wallet); setCopiedAddr(true); setTimeout(()=>setCopiedAddr(false),2000); }}>
                  <div style={{ width:20, height:20, borderRadius:6, background:"linear-gradient(135deg,#5298ff,#a855f7)", flexShrink:0 }}/>
                  {copiedAddr ? <span style={{ color:"#4ade80" }}>Copied ✓</span> : shortAddr(wallet)}
                </div>
                <button onClick={disconnectWallet} style={{ fontSize:10, color:"var(--text)", background:"transparent", border:"1px solid var(--border)", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontFamily:"'Inter',sans-serif", opacity:0.6, transition:"opacity .15s" }}
                  onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity=".6"}>Disconnect</button>
              </div>
            )}

            {!wallet && (
              <button onClick={connectWallet} style={{ padding:"8px 20px", background:"var(--text)", color:"var(--bg)", fontWeight:700, fontSize:11, border:"none", borderRadius:10, cursor:"pointer", fontFamily:"'Inter',sans-serif", letterSpacing:".08em", boxShadow:"0 4px 12px rgba(0,0,0,0.2)" }}
                onMouseEnter={e=>e.currentTarget.style.background="var(--btn-hover)"} onMouseLeave={e=>e.currentTarget.style.background="var(--text)"}>
                {connecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}

            {canInstall && (
              <button onClick={onInstall} style={{ fontSize:11, fontWeight:700, color:"var(--accent)", background:"rgba(169,221,211,0.08)", border:"1px solid rgba(169,221,211,0.25)", borderRadius:8, padding:"6px 14px", cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>↓ Install</button>
            )}
          </div>
        </div>

        {/* ── Connect gate ───────────────────────────────────────────────── */}
        {!wallet && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"70vh", textAlign:"center", gap:0 }}>
            {/* Hero card */}
            <div style={{ ...panel, maxWidth:480, width:"100%", padding:"48px 40px", animation:"fade-up .7s ease both", textAlign:"center" }}>
              {/* Top glow line */}
              <div style={{ position:"absolute", top:0, left:"10%", right:"10%", height:1, background:"linear-gradient(90deg,transparent,var(--accent),transparent)", opacity:0.6 }}/>

              <div style={{ fontSize:10, letterSpacing:".25em", opacity:.4, marginBottom:28, fontWeight:600 }}>VOLUND · REPUTATION SCORE</div>

              <h2 style={{ fontSize:"clamp(32px,6vw,56px)", fontWeight:200, letterSpacing:"-0.03em", lineHeight:1.05, marginBottom:20 }}>
                <span className="shimmer-text">Prove your</span><br/>
                <span className="shimmer-accent">onchain identity.</span>
              </h2>

              <p style={{ fontSize:13, opacity:.55, lineHeight:1.8, maxWidth:320, margin:"0 auto 32px" }}>
                Connect your wallet to compute your reputation score based on onchain activity, wallet age, and linked identities.
              </p>

              {walletError && (
                <div style={{ fontSize:11, color:"#f87171", marginBottom:20, padding:"10px 16px", border:"1px solid rgba(248,113,113,0.2)", borderRadius:10, background:"rgba(248,113,113,0.05)" }}>
                  {walletError}
                </div>
              )}
              {!isLive && (
                <div style={{ fontSize:11, color:"#a9ddd3", marginBottom:20, padding:"10px 16px", border:"1px solid rgba(169,221,211,0.2)", borderRadius:10, background:"rgba(169,221,211,0.04)" }}>
                  Demo mode — MetaMask not detected
                </div>
              )}

              <button onClick={connectWallet} disabled={connecting}
                style={{ width:"100%", padding:"16px 0", background:"var(--text)", color:"var(--bg)", fontWeight:700, fontSize:13, border:"none", cursor:"pointer", letterSpacing:".12em", fontFamily:"'Inter',sans-serif", borderRadius:14, opacity:connecting?0.7:1, boxShadow:"0 8px 24px -8px rgba(0,0,0,0.5)", transition:"all .2s" }}
                onMouseEnter={e=>{ if(!connecting) { e.currentTarget.style.background="var(--btn-hover)"; e.currentTarget.style.transform="translateY(-1px)"; }}}
                onMouseLeave={e=>{ e.currentTarget.style.background="var(--text)"; e.currentTarget.style.transform="none"; }}>
                {connecting ? "CONNECTING..." : isLive ? "CONNECT WALLET →" : "LAUNCH DEMO →"}
              </button>

              <div style={{ fontSize:10, opacity:.3, marginTop:16, letterSpacing:".08em" }}>
                {isLive ? "MetaMask · WalletConnect · Injected" : "Demo · Base Sepolia · Mock Data"}
              </div>
            </div>
          </div>
        )}

        {/* wrong network */}
        {wallet && wrongNetwork && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", textAlign:"center", gap:16 }}>
            <div style={{ fontSize:48 }}>⚠️</div>
            <h2 style={{ fontSize:28, fontWeight:300, color:"#f87171", fontFamily:"'Inter',sans-serif" }}>Wrong Network</h2>
            <p style={{ fontSize:13, color:"var(--text)", opacity:.6, maxWidth:300 }}>Please switch to Base Sepolia to continue.</p>
            <button onClick={switchToMainnet} style={{ padding:"14px 36px", background:"var(--text)", color:"var(--bg)", fontWeight:700, fontSize:13, border:"none", cursor:"pointer", letterSpacing:".12em", fontFamily:"'Inter',sans-serif", borderRadius:8 }}>SWITCH TO BASE SEPOLIA →</button>
          </div>
        )}

        {/* ── Dashboard ──────────────────────────────────────────────────── */}
        {wallet && !wrongNetwork && (
          <>
            {/* Page header row */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--accent)", animation:"pulse 2s infinite", flexShrink:0 }}/>
                <div>
                  <div style={{ fontSize:11, opacity:.35, letterSpacing:".2em", fontWeight:600 }}>DASHBOARD</div>
                </div>
              </div>
              {fromCache && cacheAge !== null && (
                <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:10, opacity:.4, padding:"4px 10px", border:"1px solid var(--border)", borderRadius:999 }}>
                  <span>⬡</span> cached · {formatCacheAge(cacheAge)}
                </div>
              )}
            </div>

            {/* Pill tab bar */}
            <div style={{ display:"flex", gap:4, marginBottom:28, padding:"4px", background: theme==="dark"?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)", borderRadius:14, width:"fit-content", border:"1px solid var(--border)" }}>
              {["score","badges"].map(t=>(
                <button key={t} onClick={()=>setTab(t)} style={{
                  padding:"8px 20px", border:"none",
                  borderRadius:10,
                  background: tab===t ? "var(--text)" : "transparent",
                  color: tab===t ? "var(--bg)" : "var(--text)",
                  cursor:"pointer", fontFamily:"'Inter',sans-serif",
                  fontSize:11, letterSpacing:".08em",
                  fontWeight: tab===t ? 700 : 400,
                  transition:"all .2s cubic-bezier(0.4,0,0.2,1)",
                  opacity: tab===t ? 1 : 0.55,
                  whiteSpace: "nowrap"
                }}>
                  {t==="score" ? "Score" : `Badges · ${unlocked.length}/${BADGES.length}`}
                </button>
              ))}
            </div>

            {tab==="score" && (
              <div style={{ position: "relative", minHeight: "400px" }}>

                {/* Loading state */}
                {loadingData && (
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:400, gap:16, animation:"fade-in 0.5s ease" }}>
                    <div style={{ position:"relative", width:48, height:48 }}>
                      <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"1.5px solid var(--border)" }}/>
                      <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"1.5px solid transparent", borderTopColor:"var(--accent)", animation:"spin 1s linear infinite" }}/>
                    </div>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontSize:11, letterSpacing:".2em", opacity:.5, fontWeight:600, marginBottom:6 }}>COMPUTING SCORE</div>
                      <div style={{ fontSize:11, color:"var(--accent)", opacity:.8 }}>{loadStep}</div>
                    </div>
                  </div>
                )}

                {/* Ready to compute state */}
                {!loadingData && !onchainData && (
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:400, animation:"fade-up 0.8s ease" }}>
                    <div style={{ ...panel, maxWidth:420, width:"100%", padding:"40px 36px", textAlign:"center" }}>
                      <div style={{ position:"absolute", top:0, left:"15%", right:"15%", height:1, background:"linear-gradient(90deg,transparent,var(--accent),transparent)", opacity:0.6 }}/>
                      <div style={{ fontSize:10, letterSpacing:".25em", opacity:.35, fontWeight:600, marginBottom:20 }}>ONCHAIN ANALYSIS</div>
                      <div style={{ fontSize:22, fontWeight:300, letterSpacing:"-0.03em", marginBottom:12 }}>Wallet connected.</div>
                      <div style={{ fontSize:13, opacity:.5, lineHeight:1.7, marginBottom:28 }}>Reads balance, tx count &amp; wallet age from Base Sepolia to compute your score.</div>
                      <button onClick={()=>loadData(wallet)}
                        style={{ width:"100%", padding:"14px 0", background:"var(--text)", color:"var(--bg)", fontWeight:700, fontSize:12, border:"none", borderRadius:12, cursor:"pointer", letterSpacing:".1em", fontFamily:"'Inter',sans-serif", boxShadow:"0 8px 24px -8px rgba(0,0,0,0.5)", transition:"all .2s" }}
                        onMouseEnter={e=>{ e.currentTarget.style.background="var(--btn-hover)"; e.currentTarget.style.transform="translateY(-1px)"; }}
                        onMouseLeave={e=>{ e.currentTarget.style.background="var(--text)"; e.currentTarget.style.transform="none"; }}>
                        COMPUTE REPUTATION SCORE →
                      </button>
                    </div>
                  </div>
                )}

                {onchainData && (
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(12, 1fr)", 
                    gap: "20px",
                    animation: "fade-up 0.6s ease both"
                  }}>
                    {/* Score Hero */}
                    <div style={{ ...panel, gridColumn: isMobile ? "1" : "span 8", gridRow: isMobile ? "auto" : "span 2", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", gap: 40, justifyContent: "center", animationDelay: "0.1s", padding: "40px 48px" }}>
                      <div style={{ position:"absolute", top:0, left:"10%", right:"10%", height:1, background:"linear-gradient(90deg,transparent,var(--accent),transparent)", opacity:0.5 }}/>
                      <Ring s={score}/>
                      <div style={{ textAlign: isMobile ? "center" : "left", flex: 1 }}>
                        <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:999, background:"rgba(169,221,211,0.07)", border:"1px solid rgba(169,221,211,0.18)", marginBottom:20 }}>
                          <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--accent)", animation:"pulse 2s infinite", flexShrink:0 }}/>
                          <span style={{ fontSize:11, fontWeight:700, letterSpacing:".12em", color:"var(--accent)" }}>{tier.toUpperCase()}</span>
                        </div>
                        <div style={{ fontSize: 26, fontWeight:300, letterSpacing:"-0.03em", lineHeight:1.1, marginBottom:12 }}>Reputation Score</div>
                        <p style={{ fontSize: 13, opacity: 0.65, lineHeight: 1.7, maxWidth: 300, marginBottom: 28 }}>
                          Your score reflects your onchain trustworthiness based on activity, age, and linked identities.
                        </p>
                        <div style={{ display: "flex", gap: 10, flexWrap:"wrap", justifyContent: isMobile ? "center" : "flex-start" }}>
                          <button onClick={()=>setShowShare(true)} style={{ padding:"12px 24px", background:"var(--text)", color:"var(--bg)", fontWeight:700, fontSize:11, border:"none", cursor:"pointer", letterSpacing:".1em", fontFamily:"'Inter',sans-serif", borderRadius:10, transition:"all .2s" }}
                            onMouseEnter={e=>{ e.currentTarget.style.background="var(--btn-hover)"; e.currentTarget.style.transform="translateY(-1px)"; }}
                            onMouseLeave={e=>{ e.currentTarget.style.background="var(--text)"; e.currentTarget.style.transform="none"; }}>
                            SHARE SCORE →
                          </button>
                          <button onClick={()=>loadData(wallet)} style={{ padding:"12px 20px", background:"transparent", color:"var(--text)", fontWeight:600, fontSize:11, border:"1px solid var(--border)", cursor:"pointer", letterSpacing:".08em", fontFamily:"'Inter',sans-serif", borderRadius:10, opacity:.65, transition:"all .2s" }}
                            onMouseEnter={e=>{ e.currentTarget.style.opacity="1"; e.currentTarget.style.borderColor="var(--text)"; }}
                            onMouseLeave={e=>{ e.currentTarget.style.opacity=".65"; e.currentTarget.style.borderColor="var(--border)"; }}>
                            Refresh
                          </button>
                        </div>
                      </div>
                    </div>


                    {/* Stats Card */}
                    <div style={{ ...panel, gridColumn: isMobile ? "1" : "span 4", animationDelay: "0.2s" }} className="wallet-id-card" onClick={() => {
                        navigator.clipboard.writeText(wallet);
                        setCopiedAddr(true);
                        setTimeout(() => setCopiedAddr(false), 2000);
                      }}>
                      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:24 }}>
                        {onchainData?.ensAvatar ? (
                          <img src={onchainData.ensAvatar} width={44} height={44} style={{ borderRadius:14, border: "1px solid var(--border)", objectFit:"cover" }} alt="Avatar"/>
                        ) : (
                          <div style={{ width:44, height:44, borderRadius:14, background:"linear-gradient(135deg,#5298ff,#a855f7)", opacity:onchainData?.ens?1:0.3 }}/>
                        )}
                        <div>
                          <div style={{ fontSize:15, fontWeight:700, color:"var(--text)", display:"flex", alignItems:"center", gap:6, overflow:"hidden" }}>
                            <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"140px" }}>
                              {(onchainData?.ens || shortAddr(wallet)).length > 16
                                ? (onchainData?.ens || shortAddr(wallet)).slice(0, 14) + "…"
                                : (onchainData?.ens || shortAddr(wallet))}
                            </span>
                            {copiedAddr && <span style={{ fontSize:10, color: "#4ade80", flexShrink:0 }}>✓</span>}
                          </div>
                          <div style={{ fontSize:11, opacity:0.4, letterSpacing: "0.05em" }}>{shortAddr(wallet)}</div>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <div>
                          <div style={{ fontSize:10, opacity:0.4, textTransform:"uppercase", letterSpacing:".15em", marginBottom: 4 }}>Tx Count</div>
                          <div style={{ fontSize:18, fontWeight:600, fontFamily: "monospace" }}>{onchainData?.txCount ?? "—"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, opacity:0.4, textTransform:"uppercase", letterSpacing:".15em", marginBottom: 4 }}>Age</div>
                          <div style={{ fontSize:18, fontWeight:600 }}>{onchainData?.walletAgeMo ? `${onchainData.walletAgeMo}m` : "—"}</div>
                        </div>
                      </div>
                      <button onClick={()=>loadData(wallet)} style={{ width: "100%", marginTop: 28, padding:"12px", background:"transparent", color:"var(--text)", fontSize:11, border:"1px solid var(--border)", borderRadius:10, cursor:"pointer", letterSpacing:".1em", fontFamily:"'Inter',sans-serif", fontWeight: 700, transition: "0.2s" }}
                        onMouseEnter={e=>e.currentTarget.style.borderColor="var(--text)"} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
                        REFRESH ONCHAIN DATA
                      </button>
                    </div>

                    {/* Breakdown */}
                    <div style={{ ...panel, gridColumn: isMobile ? "1" : "span 4", animationDelay: "0.3s" }}>
                      <span style={label}>Breakdown</span>
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {categories.map((cat,i)=>(
                          <CategoryBar key={cat.id} cat={cat} i={i} activeCat={activeCat} onToggle={()=>setActiveCat(activeCat===cat.id?null:cat.id)}/>
                        ))}
                      </div>
                    </div>

                    {/* Passport / Identity */}
                    <div style={{ ...panel, gridColumn: isMobile ? "1" : "span 12", animationDelay: "0.4s" }}>
                      <span style={label}>Identity Passport</span>
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "20px" }}>
                        {/* GitHub */}
                        <div style={{ padding: "24px", borderRadius: 20, border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", transition: "all 0.3s" }}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent: "space-between", marginBottom: 16 }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--text)" opacity={social.github?1:0.3}><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                            {social.github ? <span style={{ fontSize:10, color:"#4ade80", fontWeight:800, letterSpacing: "0.1em" }}>VERIFIED</span> : <span style={{ fontSize:10, opacity:0.3 }}>IDLE</span>}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>GitHub</div>
                          <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 20 }}>{social.github ? `@${social.github} · Profile linked` : "Link account for +60 pts"}</div>
                          {social.github ? (
                            <button onClick={disconnectGitHub} style={{ width: "100%", padding: "10px", background: "transparent", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 11, cursor: "pointer", opacity: 0.6 }}>Disconnect Account</button>
                          ) : (
                            <button onClick={connectGitHub} disabled={connectingGH} style={{ width: "100%", padding: "10px", background: "var(--text)", border: "none", borderRadius: 10, color: "var(--bg)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{connectingGH ? "LINKING..." : "CONNECT GITHUB"}</button>
                          )}
                        </div>
                        {/* ENS */}
                        <div style={{ padding: "24px", borderRadius: 20, border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", transition: "all 0.3s" }}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent: "space-between", marginBottom: 16 }}>
                            <div style={{ width:24, height:24, borderRadius:"50%", background:"linear-gradient(135deg,#5298ff,#a855f7)", opacity:onchainData?.ens?1:0.3 }}/>
                            {onchainData?.ens ? <span style={{ fontSize:10, color:"#4ade80", fontWeight:800, letterSpacing: "0.1em" }}>ACTIVE</span> : <span style={{ fontSize:10, opacity:0.3 }}>NOT FOUND</span>}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>ENS Protocol</div>
                          <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 20 }}>{onchainData?.ens ? String(onchainData.ens) : "Available on Base Sepolia"}</div>
                          <a href="https://app.ens.domains" target="_blank" rel="noreferrer" style={{ display: "block", textAlign: "center", padding: "10px", background: "transparent", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 11, textDecoration: "none", fontWeight: 700 }}>{onchainData?.ens ? "MANAGE IDENTITY" : "ACQUIRE ENS NAME →"}</a>
                        </div>
                        {/* Twitter */}
                        <div style={{ padding: "24px", borderRadius: 20, border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", opacity: 0.6 }}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent: "space-between", marginBottom: 16 }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--text)" opacity={0.3}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                            <span style={{ fontSize:9, opacity:0.3, letterSpacing: ".1em", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: 6 }}>RESTRICTED</span>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Twitter / X</div>
                          <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 20 }}>Advanced verification logic</div>
                          <button disabled style={{ width: "100%", padding: "10px", background: "transparent", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 11, cursor: "not-allowed", opacity: 0.4 }}>COMING SOON</button>
                        </div>
                      </div>
                    </div>

                    {/* History */}
                    <div style={{ ...panel, gridColumn: isMobile ? "1" : "span 12", animationDelay: "0.5s" }}>
                      <span style={label}>Reputation History (6 Months)</span>
                      <MiniChart data={generateHistory(scoreVal, wallet)}/>
                    </div>
                  </div>
                )}
              </div>
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
                      <div style={{ fontSize:26, fontWeight:300, color:"var(--text)", fontFamily:"'Inter',sans-serif", letterSpacing:"-0.01em" }}>{s.val}</div>
                      <div style={{ fontSize:9, color:"var(--text)", opacity:.5, letterSpacing:".12em", marginTop:4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", marginBottom:14, border:"1px solid var(--border)", borderRadius:12, overflow:"auto" }}>
                  {["All","Common","Rare","Epic","Legendary"].map(r=>{
                    const a=filter===r;
                    return <button key={r} onClick={()=>setFilter(r)} style={{ flex:1, padding:"9px 0", border:"none", background:a?"var(--text)":"transparent", color:a?"var(--bg)":"var(--text)", fontSize:9, fontFamily:"'Inter',sans-serif", cursor:"pointer", letterSpacing:".1em", fontWeight:a?700:400, transition:"all .15s", opacity:a?1:0.5 }}>{r.toUpperCase()}</button>;
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
                      <div key={x.c} style={{ padding:"16px", border:"1px solid var(--border)", borderRadius:12 }}>
                        <div style={{ fontSize:10, color:"var(--text)", opacity:.5, fontFamily:"'Inter',sans-serif", marginBottom:6 }}>{x.c}</div>
                        <div style={{ fontSize:11, color:"var(--text)", opacity:.7, fontFamily:"'Inter',sans-serif", lineHeight:1.6 }}>{x.t}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div style={{ marginTop:36, paddingTop:24, borderTop:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <Logo size={14}/>
              <span style={{ fontSize:9, color:"var(--text)", opacity:.2, fontFamily:"'Inter',sans-serif", letterSpacing:".12em" }}>RRS · DEVNET</span>
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
          theme={theme}
        />
      )}
    </div>
  );
}


// ── Docs ─────────────────────────────────────────────────────────────────────

const DOCS_CSS = `
  /* ── Force dark mode on the docs page ── */
  .docs-root {
    --bg:       #0a0a0a;
    --bg1:      #111111;
    --bg2:      #181818;
    --border:   rgba(232,227,213,0.1);
    --border-hi:rgba(232,227,213,0.18);
    --text:     #e8e3d5;
    --text-dim: rgba(232,227,213,0.4);
    --accent:   #a9ddd3;
    --gold:     #c8b89a;
    --rare:     #b8d4f0;
    --epic:     #a9ddd3;
    background: #0a0a0a;
    color: #e8e3d5;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }

  .docs-root, .docs-root * {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    line-height: 1.8;
  }

  /* scrollbar */
  .docs-root ::-webkit-scrollbar { width: 3px; }
  .docs-root ::-webkit-scrollbar-track { background: #0a0a0a; }
  .docs-root ::-webkit-scrollbar-thumb { background: rgba(232,227,213,0.1); }

  /* ── Layout ── */
  .layout { display: flex; min-height: 100vh; }

  /* ── Sidebar ── */
  .sidebar {
    width: 260px;
    flex-shrink: 0;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    border-right: 1px solid rgba(232,227,213,0.1);
    background: #0a0a0a;
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
    background: rgba(10,10,10,0.92);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(232,227,213,0.1);
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
    color: rgba(232,227,213,0.72);
    margin-bottom: 16px;
    line-height: 1.9;
  }

  .lead {
    font-size: 15px;
    color: rgba(232,227,213,0.82);
    line-height: 2.0;
    margin-bottom: 32px;
  }

  /* ── Accent text ── */
  .accent { color: var(--accent); }

  /* ── Hover Utilities ── */
  .wallet-id-card:hover .copy-icon { opacity: 0.6 !important; }
  .wallet-id-card:active .copy-icon { opacity: 1 !important; transform: scale(0.9); }

  /* ── Callout ── */
  .callout {
    border: 1px solid rgba(232,227,213,0.1);
    border-left: 3px solid #a9ddd3;
    background: rgba(169,221,211,0.04);
    padding: 16px 20px;
    border-radius: 0 8px 8px 0;
    margin: 24px 0;
    font-size: 12px;
    color: rgba(232,227,213,0.8);
  }
  .callout strong { color: #a9ddd3; font-family: 'Inter', sans-serif; }

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
    background: #111111;
    border: 1px solid rgba(232,227,213,0.1);
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

  .code-comment { color: var(--border); }
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

