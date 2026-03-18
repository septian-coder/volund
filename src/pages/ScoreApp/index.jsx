import { useState, useEffect, useRef } from "react";
import { readCache, writeCache, clearCache, formatCacheAge } from "../../hooks/useScoreCache";
import { requestNotificationPermission, notifyExpiringBadges, getExpiringBadges } from "../../hooks/useNotifications";
import { BADGES, RS, ETH_MAINNET, BADGE_CONTRACT_ADDRESS, BADGE_API_URL, BADGE_ABI } from "../../constants";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { useEase } from "../../hooks/useInView";
import { fetchOnchainData, shortAddr, generateHistory } from "../../utils/onchain";
import { calculateScore as calcScore, getTier } from "../../utils/scoreCalculator";
import Logo from "../../components/Logo";
import Tag from "../../components/Tag";
import ThemeToggle from "../../components/ThemeToggle";
import Grid from "../../components/Grid";
import { MiniChart, CategoryBar } from "../../components/Ring";
import { BadgeCard, BADGE_IMG } from "../../components/BadgeCard";
import ScoreSimulator from "../../components/ScoreSimulator";
import ScoreBreakdown from "../../components/ScoreBreakdown";
import OnchainWrapped from "../../components/OnchainWrapped";
import ShareModal from "../../components/ShareModal";
import PerksShowcase from "../../components/PerksShowcase";
import PrivacyProof from "../../components/PrivacyProof";
import TrustNetwork from "../../components/TrustNetwork";
import GovernancePower from "../../components/GovernancePower";
import SoulboundMint from "../../components/SoulboundMint";
import IdentityHub from "../../components/IdentityHub";
import DemoEligibleAccess from "../../components/DemoEligibleAccess";
import ScoreChangeToast from "../../components/ScoreChangeToast";
import ScoreRing from "../../components/ScoreRing";
import ScoreDeltaBadge from "../../components/ScoreDeltaBadge";
import TierUpgradeCelebration from "../../components/TierUpgradeCelebration";
import DemoControls from "../../components/DemoControls";
import PoHStatusCard from "../../components/PoHStatusCard";
import ScoreCapWarning from "../../components/ScoreCapWarning";
import WorldCoinModal from "../../components/WorldCoinModal";
import PeerVouching from "../../components/PeerVouching";
import PoHLevelAccordion from "../../components/PoHLevelAccordion";
import { useReputation } from "../../context/useReputation";
import { ethers } from "ethers";
import { 
  BarChart2, 
  Wallet, 
  Award, 
  ArrowLeftRight, 
  Fingerprint, 
  Globe, 
  SlidersHorizontal, 
  Trophy 
} from "lucide-react";


export default function ScoreApp({ onBack, canInstall, onInstall, theme, toggleTheme }) {
  const { isMobile } = useBreakpoint();
  const [tab, setTab] = useState("score");
  const [activeCat, setActiveCat] = useState(null);
  const [filter, setFilter] = useState("All");
  const [showShare, setShowShare] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [showWrapped, setShowWrapped] = useState(false);
  const [attesting, setAttesting] = useState(false);
  const [attestationId, setAttestationId] = useState(null);
  const [connectingId, setConnectingId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [lastTier, setLastTier] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeTier, setUpgradeTier] = useState("");

  const [wallet, setWallet] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [walletError, setWalletError] = useState("");
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const isLive = typeof window !== "undefined" && !!window.ethereum;

  const [onchainData, setOnchainData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [loadStep, setLoadStep] = useState("");

  const [showFaucetConfirm, setShowFaucetConfirm] = useState(false);
  const [pendingFaucetAddr, setPendingFaucetAddr] = useState(null);

  // ── Cache state ──
  const [cacheAge, setCacheAge] = useState(null);      // ms since last cache
  const [fromCache, setFromCache] = useState(false);   // true when showing cached data
  const [showPohModal, setShowPohModal] = useState(false);

  // Reputation Context
  const { 
    social, 
    pohLevel: contextPohLevel, 
    updateSocial, 
    disconnectSocial,
    initializeSocial
  } = useReputation();

  // Badge claim state
  // claimedBadges: { [badgeId]: { claimed: bool, daysLeft: number } }
  const [claimedBadges, setClaimedBadges] = useState({});
  const [claimingId, setClaimingId] = useState(null);
  const [claimError, setClaimError] = useState("");
  const [claimSuccess, setClaimSuccess] = useState("");

  // Map real data to the requested walletData shape
  const walletData = onchainData ? {
    txCount: onchainData.txCount || 0,
    walletAgeMonths: onchainData.walletAgeMo || 0,
    ethBalance: onchainData.balance || 0,
    rloBalance: social.rialoLinked ? 500 : 0,
    uniqueContracts: Math.min(Math.floor((onchainData.txCount || 0) * 0.3), 30),
    chainCount: social.multiChain || 1,
    gasSpentEth: parseFloat(((onchainData.txCount || 0) * 0.0005).toFixed(4)),
    swapVolumeUsd: (onchainData.txCount || 0) * 50, // Mock
    lpDays: (onchainData.txCount || 0) > 50 ? 30 : 0, // Mock
    hasActiveLending: (onchainData.txCount || 0) > 100, // Mock
    defiTxPerMonth: Math.floor((onchainData.txCount || 0) / 12), // Mock
    isCleanHistory: true,
    farmingProtocols: (onchainData.txCount || 0) > 200 ? 5 : 0, // Mock
    hasENS: !!onchainData.ens,
    github: { 
      connected: !!social.github?.connected, 
      ageMonths: social.github?.ageMonths || 0, 
      repoCount: social.github?.repos || 0 
    },
    twitter: { 
      connected: !!social.twitter?.connected, 
      ageMonths: social.twitter?.ageMonths || 0,
      handle: social.twitter?.handle,
      followerCount: social.twitter?.followerCount || 0,
      isVerified: !!social.twitter?.isVerified
    },
    discord: { 
      connected: !!social.discord?.connected, 
      membershipMonths: social.discord?.membershipMonths || 0 
    },
    badgeCount: Object.keys(claimedBadges).length,
    hasRareBadge: Object.values(claimedBadges).some(b => b.rarity === 'Rare'),
    hasEpicBadge: Object.values(claimedBadges).some(b => b.rarity === 'Epic'),
    hasDivineBadge: Object.values(claimedBadges).some(b => b.rarity === 'Divine'),
    badgeBonusTotal: 0
  } : null;

  const computed   = walletData ? calcScore(walletData, { ...social, attested: !!attestationId }) : null;
  const rawScore   = computed?.rawTotal ?? 0;
  const scoreVal   = computed?.total ?? 0;
  const isCapped   = computed?.isCapped ?? false;
  const gateMsg    = computed?.activeGate;
  const pohLevel   = contextPohLevel; // Use from context
  const tier       = computed ? getTier(scoreVal) : "—";
  const categories = computed?.categories ?? [];

  const score    = useEase(scoreVal, !!onchainData);
  const isVolund = scoreVal >= 850;
  const isDiamond = scoreVal >= 700 && scoreVal < 850;
  const verified = !!attestationId || social.sbtMinted;
  const unlocked = BADGES.filter(b => scoreVal >= b.min);
  const filtered = filter==="All" ? BADGES : BADGES.filter(b=>b.rarity===filter);

  const handleConnect = async (id) => {
    setConnectingId(id);
    await new Promise(r => setTimeout(r, 1500));
    
    let newData = { connected: true };
    let points = 0;
    
    if (id === "github") {
      newData = { ...newData, username: "septian-coder", repos: 42, ageMonths: 24, details: "Verified streak: 12 days" };
      points = 60;
    } else if (id === "twitter") {
      newData = { ...newData, handle: "septian_eth", followerCount: 1250, ageMonths: 12, isVerified: true, details: "1.2k followers · Verified" };
      points = 55;
    } else if (id === "discord") {
      newData = { ...newData, membershipMonths: 6, details: "6 months member · Early Adopter" };
      points = 51;
    }

    updateSocial(id, newData);
    setConnectingId(null);
    addToast(points, id.charAt(0).toUpperCase() + id.slice(1));
  };

  const handleDisconnect = (id) => {
    disconnectSocial(id);
  };

  const handleWorldVerify = () => {
    updateSocial("worldcoin", { verified: true });
    addToast(200, "World ID");
  };

  const handleVouch = (addr, isVoucher = false) => {
    const newVouch = {
      address: addr,
      score: isVoucher ? 450 : 20, // Mock score
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
    updateSocial("vouches", [...(social.vouches || []), newVouch]);
    if (!isVoucher) {
      addToast(10, "Voucher system");
    }
  };

  // Detect if MetaMask is available (won't work in iframe/sandbox)
  const addToast = (points, platform) => {
    const id = Date.now();
    setToasts(prev => [...prev.slice(-4), { id, points, platform }]); // Keep max 5
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  useEffect(() => {
    if (onchainData && lastTier && tier !== lastTier && tier !== "—" && lastTier !== "—") {
      const tiers = ["unverified", "bronze", "silver", "gold", "platinum", "diamond", "volund"];
      if (tiers.indexOf(tier) > tiers.indexOf(lastTier)) {
        setUpgradeTier(tier);
        setShowUpgrade(true);
      }
    }
    if (tier !== "—") setLastTier(tier);
  }, [tier, onchainData]);

  // Sync ENS to reputation context
  useEffect(() => {
    if (onchainData?.ens) {
      updateSocial("ens", { hasENS: true, domain: onchainData.ens });
    }
  }, [onchainData?.ens, updateSocial]);

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
          if (cached.social) initializeSocial(cached.social);
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
          if (cached.social) initializeSocial(cached.social);
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
    if (!wrong && addr) {
      const cached = readCache(addr);
      if (cached && cached.onchainData) {
        loadData(addr);
      } else {
        setPendingFaucetAddr(addr);
        setShowFaucetConfirm(true);
      }
    }
  }

  async function ensureBaseSepolia() {
    if (!window.ethereum) return false;
    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== "0x14a34") {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x14a34" }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: "0x14a34",
                chainName: "Base Sepolia",
                nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://sepolia.base.org"],
                blockExplorerUrls: ["https://sepolia.basescan.org"],
              }]
            });
          } else {
            return false;
          }
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  const handleDemoAction = (action) => {
    // Up the score in social state for simple reactivity
    if (action.label.includes("GitHub")) {
      updateSocial("github", { connected: true, ageMonths: 24, repos: 12 });
    } else if (action.label.includes("PoH")) {
      updateSocial("worldcoin", { verified: true });
    }
    
    // Always trigger toast and animation
    addToast(action.points, action.sub);
    
    // Simulate complex onchain change by nudging txCount if needed
    if (action.sub.includes("DeFi") || action.sub.includes("LP")) {
      setOnchainData(prev => ({
        ...prev,
        txCount: (prev?.txCount || 0) + 1
      }));
    }
  };

  async function switchToBaseSepolia() {
    const success = await ensureBaseSepolia();
    if (success) setWrongNetwork(false);
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

  function handleFaucetConfirm() {
    setShowFaucetConfirm(false);
    if (pendingFaucetAddr) {
      loadData(pendingFaucetAddr);
      setPendingFaucetAddr(null);
    }
  }

  function handleFaucetCancel() {
    setShowFaucetConfirm(false);
    setPendingFaucetAddr(null);
    disconnectWallet();
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

      // Re-create walletData locally for calculation if needed, or rely on state update
      // Better to compute score using a local ephemeral walletData to avoid race conditions
      const tempWalletData = {
        txCount: data.txCount || 0,
        walletAgeMonths: data.walletAgeMo || 0,
        ethBalance: data.balance || 0,
        rloBalance: social.rialoLinked ? 500 : 0,
        uniqueContracts: Math.min(Math.floor((data.txCount || 0) * 0.3), 30),
        chainCount: social.multiChain || 1,
        gasSpentEth: parseFloat(((data.txCount || 0) * 0.0005).toFixed(4)),
      };

      const sc = calcScore(tempWalletData, social).total;
      const claimed = await fetchClaimedBadges(addr, sc);
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
    const demoData = { balance: 0.85, txCount: 42, walletAgeMo: 14, ens: "demo.eth" };
    setOnchainData(demoData);
    
    const demoWalletData = {
      txCount: demoData.txCount,
      walletAgeMonths: demoData.walletAgeMo,
      ethBalance: demoData.balance,
      rloBalance: 0,
      uniqueContracts: 25,
      chainCount: 2,
      gasSpentEth: 0.42
    };

    const sc = calcScore(demoWalletData, social).total;
    const claimed = await fetchClaimedBadges(addr, sc);
    writeCache(addr, { onchainData: demoData, claimedBadges: claimed || {}, social });
    setCacheAge(0);
    setLoadingData(false);
    setLoadStep("");
  }

  function disconnectWallet() {
    if (wallet) clearCache(wallet);
    setWallet(null); setWrongNetwork(false); setOnchainData(null);
    setClaimedBadges({}); setFromCache(false); setCacheAge(null);
    // Add context reset if needed
  }

  async function connectGitHub() {
    if (!wallet) {
      alert("Please connect your wallet first.");
      return;
    }
    setConnectingGH(true);
    
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const message = `Volund Protocol Verification\n\nLink GitHub: @volund-user\nWallet: ${wallet}\nNonce: ${Math.floor(Math.random() * 1000000)}`;
        
        // Request personal signature
        await signer.signMessage(message);
        
        // After signature, proceed with linking
        await new Promise(r => setTimeout(r, 800));
        const mockUser = { login: "volund-user", public_repos: 12, followers: 48 };
        updateSocial("github", { connected: true, username: mockUser.login, repos: mockUser.public_repos, ageMonths: 24 });
      }
    } catch (err) {
      console.warn("Signature rejected or failed:", err);
    } finally {
      setConnectingGH(false);
    }
  }

  function disconnectGitHub() {
    disconnectSocial("github");
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
    background: "var(--card-bg)",
    backdropFilter:"blur(32px) saturate(180%)",
    border: "1px solid var(--border)",
    borderRadius: 24, padding:"32px", 
    transition: "all 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
    position: "relative", overflow: "hidden",
    boxShadow: "0 8px 32px -8px rgba(0,0,0,0.15)"
  };
  const label = { fontSize:10, color:"var(--accent)", opacity:.8, letterSpacing:".2em", marginBottom:20, fontFamily:"'Inter',sans-serif", display:"block", textTransform: "uppercase", fontWeight: 800 };

  return (
    <div style={{ background:"var(--bg)", minHeight:"100vh", fontFamily:"'Inter',sans-serif", color:"var(--text)", transition:"background 0.3s, color 0.3s", overflow: "hidden", position: "relative" }}>
      {showFaucetConfirm && (
        <div style={{ position:"fixed", inset:0, zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.6)", backdropFilter:"blur(8px)", animation:"fade-in .3s ease" }}>
          <div style={{ background:"var(--bg-primary)", border:"1px solid var(--border-subtle)", borderRadius:20, padding:"32px", maxWidth:420, width:"calc(100% - 40px)", textAlign:"center", animation:"fade-up .3s ease" }}>
            <div style={{ fontSize:32, marginBottom:16 }}>🚰</div>
            <h3 style={{ fontSize:20, fontWeight:600, color:"var(--text-primary)", marginBottom:12, letterSpacing:"-.02em" }}>Need Base Sepolia ETH?</h3>
            <p style={{ fontSize:13, color:"var(--text)", opacity:0.6, lineHeight:1.6, marginBottom:28 }}>
              To compute your score and claim badges, you need gas on Base Sepolia. You can get free testnet ETH from a faucet.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <button onClick={handleFaucetConfirm} style={{ padding:"14px", background:"var(--text)", color:"var(--bg)", fontWeight:700, fontSize:12, border:"none", borderRadius:10, cursor:"pointer", letterSpacing:".05em" }}
                onMouseEnter={e=>e.currentTarget.style.background="var(--btn-hover)"} onMouseLeave={e=>e.currentTarget.style.background="var(--text)"}>
                I HAVE ETH, CONTINUE →
              </button>
              <a href="https://www.alchemy.com/faucets/base-sepolia" target="_blank" rel="noreferrer" style={{ padding:"14px", background:"transparent", color:"var(--accent)", fontWeight:600, fontSize:12, border:"1px solid var(--accent-border)", borderRadius:10, cursor:"pointer", letterSpacing:".05em", textDecoration:"none" }}
                onMouseEnter={e=>{e.currentTarget.style.background="var(--accent-glow)"; e.currentTarget.style.borderColor="var(--accent)"}} onMouseLeave={e=>{e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor="var(--accent-border)"}}>
                GET FREE ETH
              </a>
              <button onClick={handleFaucetCancel} style={{ padding:"12px", background:"transparent", color:"var(--text)", opacity:0.5, fontWeight:600, fontSize:12, border:"none", cursor:"pointer", letterSpacing:".05em", marginTop:8 }}
                onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity="0.5"}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 24px 48px", position:"relative", zIndex:1 }}>

         {/* ── Sticky top nav ────────────────────────────────────────────── */}
        <div style={{
          position: "sticky", top: 0, zIndex: 100,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding: "24px 0",
          marginBottom: 48,
          background: "transparent",
          backdropFilter: "blur(20px) saturate(180%)",
          flexWrap:"wrap", gap:16,
          border: "none"
        }}>
          {/* Left — logo & back */}
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, fontWeight:500, color:"var(--text)", background:"transparent", border:"none", cursor:"pointer", opacity:.6, transition:"opacity .2s" }}
              onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity=".6"}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              BACK
            </button>
            <div style={{ width:1, height:24, background:"var(--border)", opacity: 0.3 }}/>
            <Logo size={24}/>
          </div>

          {/* Right — wallet, network, actions */}
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {/* Network pill */}
            <div className="glass-panel" style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, padding:"8px 16px", borderRadius:999, border: `1px solid ${wrongNetwork?"var(--error)":"var(--info)"}`, opacity: 0.8 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background: wrongNetwork?"var(--error)":"var(--info)", boxShadow: `0 0 8px ${wrongNetwork?"var(--error)":"var(--info)"}`, animation:"pulse 2s infinite" }}/>
              <span style={{ color: wrongNetwork?"var(--error)":"var(--info)", fontWeight:700, textTransform:"uppercase", letterSpacing:".05em" }}>{wrongNetwork ? "Wrong Network" : "Base Sepolia"}</span>
            </div>

            <ThemeToggle theme={theme} toggle={toggleTheme}/>

            {wallet && (
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div className="glass-panel" style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 16px", borderRadius:14, fontSize:12, fontWeight:700, color:"var(--text)", cursor:"pointer" }}
                  onClick={() =>{ navigator.clipboard.writeText(wallet); setCopiedAddr(true); setTimeout(()=>setCopiedAddr(false),2000); }}>
                  <div style={{ width:24, height:24, borderRadius:8, background:"var(--accent)", flexShrink:0 }}/>
                  {copiedAddr ? <span style={{ color:"var(--accent)" }}>COPIED ✓</span> : shortAddr(wallet).toUpperCase()}
                </div>
                <button onClick={disconnectWallet} className="secondary-button" style={{ padding:"8px 16px", fontSize:11, borderRadius:14 }}>DISCONNECT</button>
              </div>
            )}

            {!wallet && (
              <button onClick={connectWallet} className="premium-button" style={{ padding:"10px 24px", fontSize:12 }}>
                {connecting ? "CONNECTING..." : "CONNECT WALLET"}
              </button>
            )}
          </div>
        </div>

        {/* ── Connect gate ───────────────────────────────────────────────── */}
        {!wallet && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"70vh", textAlign:"center", paddingBottom: 100 }}>
            {/* Hero card */}
            <div className="glass-panel shiny-card" style={{ maxWidth:540, width:"100%", padding:"64px 48px", borderRadius:40, animation:"fade-up .8s cubic-bezier(0.23, 1, 0.32, 1) both", textAlign:"center" }}>
              <Tag>onchain reputation</Tag>

              <h2 className="chromatic-text" style={{ fontSize:"clamp(36px,6vw,64px)", fontWeight:300, fontFamily:"'Syne', sans-serif", letterSpacing:"-0.04em", lineHeight:0.95, margin: "24px 0 32px" }}>
                <span className="shimmer-text">Prove your</span><br/>
                <span className="shimmer-accent">identity.</span>
              </h2>

              <p style={{ fontSize:16, color:"var(--text-dim)", lineHeight:1.7, maxWidth:400, margin:"0 auto 48px" }}>
                Connect your institutional wallet to verify your onchain footprint and unlock the Rialo ecosystem.
              </p>

              {walletError && (
                <div style={{ fontSize:13, color:"var(--error)", marginBottom:32, padding:"12px 20px", border:"1px solid var(--error)", borderRadius:16, background:"rgba(248,113,113,0.05)" }}>
                  {walletError}
                </div>
              )}
              {!isLive && (
                <div style={{ fontSize:13, color:"var(--accent)", marginBottom:32, padding:"12px 20px", border:"1px solid var(--accent)", borderRadius:16, background:"var(--accent-glow)", fontWeight:700 }}>
                  DEMO MODE — BROWSER WALLET NOT DETECTED
                </div>
              )}

              <button onClick={connectWallet} disabled={connecting} className="premium-button" style={{ width:"100%", padding:"20px 0", fontSize:15, justifyContent:"center" }}>
                {connecting ? "INITIALIZING SECURE SESSION..." : isLive ? "CONNECT WALLET →" : "LAUNCH DEMO PROTOCOL →"}
              </button>

              <div style={{ fontSize:11, opacity:.3, marginTop:24, letterSpacing:".1em", fontWeight:700 }}>
                {isLive ? "METAMASK · COINBASE · WALLETCONNECT" : "ISOLATED DEVNET · MOCK ATTESTATIONS"}
              </div>
            </div>
          </div>
        )}

        {/* wrong network */}
        {wallet && wrongNetwork && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", textAlign:"center", gap:16 }}>
            <div style={{ fontSize:48 }}>⚠️</div>
            <h2 style={{ fontSize:28, fontWeight:300, color:"var(--error)", fontFamily:"'Inter',sans-serif" }}>Wrong Network</h2>
            <p style={{ fontSize:13, color:"var(--text-primary)", opacity:.6, maxWidth:300 }}>Please switch to Base Sepolia to continue.</p>
            <button onClick={switchToBaseSepolia} style={{ padding:"14px 36px", background:"var(--text-primary)", color:"var(--bg-primary)", fontWeight:700, fontSize:13, border:"none", cursor:"pointer", letterSpacing:".12em", fontFamily:"'Inter',sans-serif", borderRadius:8 }}>SWITCH TO BASE SEPOLIA →</button>
          </div>
        )}

        {/* ── Dashboard ──────────────────────────────────────────────────── */}
        {wallet && !wrongNetwork && (
          <>
            {/* Page header row */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:12, height:1, background:"var(--accent)", opacity: 0.6, flexShrink:0 }}/>
                <div>
                  <div style={{ fontSize: 11, color: "var(--accent)", letterSpacing: ".2em", fontWeight: 800 }}>DASHBOARD</div>
                </div>
              </div>
              {fromCache && cacheAge !== null && (
                <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:10, opacity:.4, padding:"4px 10px", border:"1px solid var(--border)", borderRadius:999 }}>
                  <span>⬡</span> cached · {formatCacheAge(cacheAge)}
                </div>
              )}
            </div>

            {/* Navbar Tabs */}
            <div style={{ display:"flex", borderBottom:"1px solid var(--border-subtle)", marginBottom:32, gap:32, overflowX:"auto", scrollbarWidth:"none" }}>
              {[
                {id:"score", label:"DASHBOARD", icon:<BarChart2 size={20} strokeWidth={1.5} color="#a9ddd3" />},
                {id:"poh", label:"POH", icon:<Fingerprint size={20} strokeWidth={1.5} color="#a9ddd3" />},
                {id:"identity", label:"IDENTITY HUB", icon:<Globe size={20} strokeWidth={1.5} color="#a9ddd3" />},
                {id:"badges", label:"COLLECTION", icon:<Award size={20} strokeWidth={1.5} color="#a9ddd3" />},
                {id:"simulator", label:"SIMULATOR", icon:<ArrowLeftRight size={20} strokeWidth={1.5} color="#a9ddd3" />},
                {id:"access", label:"ACCESS", icon:<Wallet size={20} strokeWidth={1.5} color="#a9ddd3" />},
              ].map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)} style={{
                  padding:"12px 0 16px", background:"transparent", border:"none", borderBottom:tab===t.id?"2px solid var(--accent)":"2px solid transparent",
                  color:tab===t.id?"var(--accent)":"var(--text-secondary)", fontSize:11, fontWeight:700, cursor:"pointer",
                  letterSpacing:".1em", transition:"all .2s", opacity:tab===t.id?1:0.5, display:"flex", alignItems:"center", gap:8, whiteSpace:"nowrap"
                }}>
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>

            {tab==="score" && (
              <div className="stagger-container visible" style={{ position: "relative", minHeight: "400px" }}>

                {/* Super God Mode: Onchain Wrapped Loading Sequence */}
                {loadingData && (
                  <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "fade-in 0.3s ease" }}>
                    <div style={{ position:"absolute", inset:0, background: "radial-gradient(circle at center, var(--accent-glow) 0%, transparent 60%)", opacity: 0.5, animation: "pulse 3s infinite" }}/>
                    <div style={{ 
                      width: 160, height: 160, borderRadius: "50%", 
                      border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center",
                      position: "relative", marginBottom: 40
                    }}>
                      <div style={{ position:"absolute", inset:-20, border: "2px dashed var(--accent)", borderRadius: "50%", opacity: 0.2, animation: "spin 12s linear infinite" }}/>
                      <div style={{ position:"absolute", inset:-40, border: "1px solid var(--border-strong)", borderRadius: "50%", opacity: 0.1, animation: "spin 20s linear infinite reverse" }}/>
                      <div className="glitch-text" data-text="V" style={{ fontSize: 48, fontWeight: 300, fontFamily: "'Syne', sans-serif", color: "var(--accent)" }}>V</div>
                    </div>
                    
                    <h2 className="chromatic-text" style={{ fontSize: "clamp(24px, 4vw, 42px)", fontWeight: 300, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em", marginBottom: 16, textAlign: "center" }}>
                      {loadStep === "reading wallet data..." ? "Indexing Immutable Footprint" :
                       loadStep === "computing score..." ? "Synthesizing Reputation Metrics" :
                       loadStep === "connecting to Base Sepolia..." ? "Establishing Secure Enclave" : "Processing"}
                    </h2>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 320, maxWidth: "100%", padding: "0 20px" }}>
                       {[
                         { step: "connecting to Base Sepolia...", label: "Network Synchronization" },
                         { step: "reading wallet data...", label: "Onchain Data Extraction" },
                         { step: "computing score...", label: "Zero-Knowledge Circuit Proof" }
                       ].map((s, i) => {
                         const isActive = loadStep === s.step;
                         const isPassed = loadStep === "computing score..." && i < 2 || loadStep === "reading wallet data..." && i === 0;
                         return (
                           <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 12, opacity: isActive || isPassed ? 1 : 0.3, transition: "all 0.4s" }}>
                             <span style={{ fontSize: 11, letterSpacing: ".05em", color: isActive ? "var(--accent)" : "var(--text)" }}>{s.label}</span>
                             <span style={{ fontSize: 10, fontFamily: "monospace", color: isPassed ? "var(--accent)" : isActive ? "var(--accent)" : "var(--text-tertiary)" }}>
                               {isPassed ? "SUCCESS" : isActive ? "PROCESSING..." : "PENDING"}
                             </span>
                           </div>
                         );
                       })}
                    </div>
                    
                    <div style={{ position: "absolute", bottom: 40, fontSize: 10, letterSpacing: ".2em", opacity: 0.4, fontFamily: "monospace" }}>
                      TARGET: {shortAddr(wallet)}
                    </div>
                    
                    <style>{`
                      @keyframes spin { 100% { transform: rotate(360deg); } }
                    `}</style>
                  </div>
                )}

                {/* Ready to compute state (NOT CONNECTED DATA) */}
                {!loadingData && !onchainData && (
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:400, animation:"fade-up 0.8s ease" }}>
                    <div style={{ ...panel, maxWidth:420, width:"100%", padding:"40px 36px", textAlign:"center" }}>
                      <Tag>ONCHAIN ANALYSIS</Tag>
                       <h2 style={{ fontSize: 28, fontWeight: 300, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.03em", marginBottom: 12, marginTop: 20 }}>Wallet connected.</h2>
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
                  <div style={{ animation: "fade-in 0.8s ease" }}>
                    
                    {/* Identity Status HUD */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, padding: "0 8px" }}>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: ".2em", marginBottom: 12, fontWeight: 800 }}>IDENTITY PROTOCOL v2.1</div>
                        <div style={{ display: "flex", gap: 12 }}>
                          {social.sbtMinted ? (
                            <div className="glass-panel" style={{ fontSize: 10, padding: "6px 14px", color: "var(--accent)", borderRadius: 12, fontWeight: 800, border: "1px solid var(--accent)", background: "var(--accent-glow)" }}>PASSPORT VERIFIED</div>
                          ) : (
                            <div className="glass-panel" style={{ fontSize: 10, padding: "6px 14px", opacity: 0.4, borderRadius: 12, fontWeight: 800 }}>UNVERIFIED PASSPORT</div>
                          )}
                          {social.attested && <div className="glass-panel" style={{ fontSize: 10, padding: "6px 14px", color: "var(--accent)", borderRadius: 12, fontWeight: 800, border: "1px solid var(--accent-border)", background: "var(--accent-glow)" }}>ONCHAIN ATTESTED</div>}
                          {social.zkVerified && <div className="glass-panel" style={{ fontSize: 10, padding: "6px 14px", color: "var(--info)", borderRadius: 12, fontWeight: 800, border: "1px solid var(--accent-border)", background: "var(--accent-glow)" }}>ZK-PROOF ACTIVE</div>}
                        </div>
                      </div>
                      {score >= 850 && (
                        <div className="glass-panel" style={{ padding: "8px 16px", background: "var(--accent-glow)", color: "var(--accent)", borderRadius: 14, fontSize: 11, fontWeight: 900, border: "1px solid var(--accent)", animation: "pulse 2s infinite" }}>
                          ⭐ VOLUND STATUS
                        </div>
                      )}
                    </div>

                    <ScoreCapWarning 
                      rawScore={rawScore} 
                      cappedScore={scoreVal} 
                      pohLevel={pohLevel} 
                      onAction={() => setTab("poh")}
                    />

                    <div style={{ 
                      display: "grid", 
                      gridTemplateColumns: isMobile ? "1fr" : "repeat(12, 1fr)", 
                      gap: "24px",
                      animation: "fade-up 0.8s cubic-bezier(0.23, 1, 0.32, 1) both"
                    }}>
                      {/* Score Hero */}
                      <div className="shiny-card" style={{ ...panel, gridColumn: isMobile ? "1" : "span 8", gridRow: isMobile ? "auto" : "span 2", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", gap: 56, justifyContent: "center", padding: "56px" }}>
                        
                        {/* Decorative HUD Details */}
                        {!isMobile && (
                          <>
                            <div style={{ position: "absolute", top: 12, left: 12, fontSize: 8, fontFamily: "monospace", opacity: 0.2, letterSpacing: ".2em" }}>REF_COORD: [40.7128, -74.0060]</div>
                            <div style={{ position: "absolute", top: 12, right: 12, fontSize: 8, fontFamily: "monospace", opacity: 0.2, letterSpacing: ".2em" }}>SYSTEM_STATUS: STABLE</div>
                            <div style={{ position: "absolute", bottom: 12, left: 12, height: 1, width: 40, background: "var(--accent)", opacity: 0.3 }} />
                            <div style={{ position: "absolute", bottom: 12, right: 12, height: 20, width: 1, background: "var(--accent)", opacity: 0.3 }} />
                          </>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, position: "relative" }}>
                          <ScoreRing score={score} tier={tier} />
                          
                          {/* Score Gate Banner */}
                          {isCapped && (
                            <div style={{
                              marginTop: 20,
                              padding: "12px 24px",
                              background: "rgba(245, 200, 66, 0.08)",
                              border: "1px solid rgba(245, 200, 66, 0.3)",
                              borderRadius: "12px",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 4,
                              animation: "fade-up 0.5s ease both",
                              maxWidth: 400
                            }}>
                              <div style={{ color: "#F5C842", fontSize: 13, fontWeight: 700, letterSpacing: "0.02em" }}>
                                ⚠️ SCORE CAPPED AT {scoreVal}
                              </div>
                              <div style={{ color: "rgba(232, 227, 213, 0.6)", fontSize: 11, textAlign: "center" }}>
                                {gateMsg || "Complete requirements to unlock higher score potential."}
                              </div>
                            </div>
                          )}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                            <div className="glass-panel" style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", background: "var(--accent-glow)", border: "1px solid var(--accent)", padding: "6px 16px", borderRadius: 999, letterSpacing: ".1em" }}>
                               RANK: TOP {score >= 850 ? 1 : score >= 700 ? 5 : score >= 500 ? 12 : score >= 350 ? 25 : score >= 200 ? 40 : score >= 100 ? 60 : 80}%
                            </div>
                            <ScoreDeltaBadge delta={15} reason="Today's Performance" />
                          </div>
                          {/* Floating data bits */}
                          {!isMobile && (
                            <>
                              <div className="floating-data" style={{ position: "absolute", top: -20, right: -40, fontSize: 8, color: "var(--accent)", opacity: 0.4 }}>SIG_LEVEL: 0.942</div>
                              <div className="floating-data" style={{ position: "absolute", bottom: 40, left: -60, fontSize: 8, color: "var(--accent)", opacity: 0.4, animationDelay: "1s" }}>LATENCY: 12ms</div>
                            </>
                          )}
                        </div>
                        <div style={{ textAlign: isMobile ? "center" : "left", flex: 1 }}>
                          <Tag>{tier.toUpperCase()} TIER</Tag>
                          <h2 style={{ fontSize: 40, fontWeight:300, fontFamily: "'Syne', sans-serif", letterSpacing:"-0.03em", lineHeight:1, margin: "20px 0 16px" }}>Reputation Score</h2>
                          <p style={{ fontSize: 15, color: "var(--text-dim)", lineHeight: 1.7, maxWidth: 320, marginBottom: 36 }}>
                            Your institutional footprint verified and computed on the Base network.
                          </p>
                          <div style={{ display: "flex", gap: 12, flexWrap:"wrap", justifyContent: isMobile ? "center" : "flex-start" }}>
                            <button onClick={()=>setShowShare(true)} className="premium-button" style={{ padding:"14px 28px", fontSize:12 }}>
                              SHARE ATTESTATION
                            </button>
                            <button onClick={()=>setShowWrapped(true)} className="secondary-button" style={{ padding:"14px 28px", fontSize:12 }}>
                              VIEW JOURNEY ✦
                            </button>
                          </div>
                        </div>
                      </div>

                      <div style={{ gridColumn: isMobile ? "1" : "span 4", display: "flex", flexDirection: "column", gap: "24px" }}>
                        <PoHStatusCard 
                          currentLevel={pohLevel}
                          rawScore={rawScore}
                          cappedScore={scoreVal}
                          onUpgrade={() => setTab("poh")}
                        />

                        {/* Stats Card */}
                        <div className="shiny-card" style={{ ...panel, margin: 0 }} onClick={() => {
                            navigator.clipboard.writeText(wallet);
                            setCopiedAddr(true);
                            setTimeout(() => setCopiedAddr(false), 2000);
                          }}>
                          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:24 }}>
                            {onchainData?.ensAvatar ? (
                              <img src={onchainData.ensAvatar} width={44} height={44} style={{ borderRadius:14, border: "1px solid var(--border-subtle)", objectFit:"cover" }} alt="Avatar"/>
                            ) : (
                              <div style={{ width:44, height:44, borderRadius:14, background:"var(--accent)", opacity:onchainData?.ens?1:0.3 }}/>
                            )}
                            <div>
                              <div style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)", display:"flex", alignItems:"center", gap:6, overflow:"hidden" }}>
                                <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"140px" }}>
                                  {(onchainData?.ens || shortAddr(wallet)).length > 16
                                    ? (onchainData?.ens || shortAddr(wallet)).slice(0, 14) + "…"
                                    : (onchainData?.ens || shortAddr(wallet))}
                                </span>
                                {copiedAddr && <span style={{ fontSize:10, color: "var(--accent)", flexShrink:0 }}>✓</span>}
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
                          <button onClick={(e)=>{ e.stopPropagation(); loadData(wallet); }} style={{ width: "100%", marginTop: 28, padding:"12px", background:"transparent", color:"var(--text)", fontSize:11, border:"1px solid var(--border)", borderRadius:10, cursor:"pointer", letterSpacing:".1em", fontFamily:"'Inter',sans-serif", fontWeight: 700, transition: "0.2s" }}
                            onMouseEnter={e=>e.currentTarget.style.borderColor="var(--text)"} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
                            REFRESH DATA
                          </button>
                        </div>
                      </div>

                      {/* Breakdown REDESIGN */}
                      <div style={{ gridColumn: isMobile ? "1" : "span 12", marginTop: 24 }}>
                        <ScoreBreakdown categories={categories} walletData={walletData} />
                      </div>

                      {/* Identity Hub Link / Preview */}
                      <div className="shiny-card" style={{ ...panel, gridColumn: isMobile ? "1" : "span 12" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <span style={label}>Identity Passport</span>
                            <h3 style={{ fontSize: 20, fontWeight: 300, marginBottom: 8 }}>Reputation Hub</h3>
                            <p style={{ fontSize: 13, opacity: 0.5, marginBottom: 24 }}>Connect social accounts to boost your global score and unlock institutional perks.</p>
                          </div>
                          <button onClick={() => setTab("identity")} className="premium-button" style={{ padding: "10px 20px", fontSize: 11 }}>MANAGE IDENTITY</button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "16px" }}>
                          {[
                            { name: "GitHub", connected: !!social.github, icon: <Globe size={18} strokeWidth={1.5} color="#a9ddd3" /> },
                            { name: "Twitter", connected: !!social.twitter?.connected, icon: <Globe size={18} strokeWidth={1.5} color="#a9ddd3" /> },
                            { name: "Discord", connected: !!social.discord?.connected, icon: <Globe size={18} strokeWidth={1.5} color="#a9ddd3" /> }
                          ].map(p => (
                            <div key={p.name} style={{ padding: "16px", borderRadius: 16, border: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 12 }}>
                              <span style={{ fontSize: 18, opacity: p.connected ? 1 : 0.3 }}>{p.icon}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 700 }}>{p.name}</div>
                                <div style={{ fontSize: 10, color: p.connected ? "var(--accent)" : "var(--text-secondary)", fontWeight: 800 }}>{p.connected ? "VERIFIED" : "DISCONNECTED"}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* History */}
                      <div className="shiny-card" style={{ ...panel, gridColumn: isMobile ? "1" : "span 12", animationDelay: "0.5s" }}>
                        <span style={label}>Reputation History (6 Months)</span>
                        <MiniChart data={generateHistory(scoreVal, wallet)}/>
                      </div>
                    </div>

                    <PerksShowcase score={scoreVal} tier={tier} zkVerified={social.zkVerified} sbt={social.sbtMinted} />

                    {/* Infrastructure & Social Layer (Phase 13 Integration) */}
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, marginTop: 40 }}>
                      <TrustNetwork
                        score={scoreVal}
                        wallet={wallet}
                        onVouchSuccess={() => setSocial(prev => ({ ...prev, vouchCount: (prev.vouchCount || 0) + 1 }))}
                      />
                      <GovernancePower score={scoreVal} attested={!!social.attested} sbt={social.sbtMinted} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, marginTop: 20 }}>
                      <SoulboundMint
                        score={scoreVal}
                        wallet={wallet}
                        onMinted={() => setSocial(prev => ({ ...prev, sbtMinted: true }))}
                      />
                      <PrivacyProof
                        score={scoreVal}
                        onVerified={() => setSocial(prev => ({ ...prev, zkVerified: true }))}
                      />
                    </div>

                    {/* Attestation Section */}
                    <div style={{ ...panel, marginTop: 40, textAlign: "center", position: "relative", overflow: "hidden", padding: "64px 32px" }}>
                      <Tag>PERSISTENCE LAYER</Tag>
                      <h3 style={{ fontSize: 28, fontWeight: 300, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em", marginBottom: 16, marginTop: 24 }}>On-chain Score Attestation</h3>
                      <p style={{ fontSize: 12, opacity: 0.6, maxWidth: 480, margin: "0 auto 24px", lineHeight: 1.6 }}>
                        Permanently seal your reputation score on Base Sepolia using EAS-style attestations.
                        This makes your score verifiable by other dApps in the ecosystem.
                      </p>

                      {!social.attested ? (
                        <button
                          onClick={async () => {
                            if (!window.ethereum) {
                              alert("Web3 wallet required for attestation.");
                              return;
                            }
                            setAttesting(true);
                            try {
                              const netSuccess = await ensureBaseSepolia();
                              if (!netSuccess) return;

                              const provider = new ethers.BrowserProvider(window.ethereum);
                              const signer = await provider.getSigner();

                              const tx = await signer.sendTransaction({
                                to: await signer.getAddress(),
                                value: 0,
                                data: ethers.hexlify(ethers.toUtf8Bytes("VOLUND_ATTEST_SCORE_" + scoreVal))
                              });

                              setAttestationId(tx.hash);
                              await tx.wait();
                              setSocial(prev => ({ ...prev, attested: true }));
                            } catch (err) {
                              console.error("Attestation failed:", err);
                            } finally {
                              setAttesting(false);
                            }
                          }}
                          disabled={attesting}
                          style={{
                            padding: "14px 48px",
                            background: "var(--text)",
                            color: "var(--bg)",
                            border: "none",
                            borderRadius: 12,
                            fontWeight: 700,
                            cursor: attesting ? "wait" : "pointer",
                            letterSpacing: ".05em",
                            animation: attesting ? "pulse 1.5s infinite" : "none",
                            transition: "all 0.2s"
                          }}
                        >
                          {attesting ? "SIGNING & ATTESTING..." : "ATTEST SCORE ON-CHAIN"}
                        </button>
                      ) : (
                        <div style={{ animation: "fade-up 0.5s ease" }}>
                          <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                            <span>✓</span> SCORE ATTESTED SUCCESSFULLY
                          </div>
                          <div style={{ fontSize: 10, fontFamily: "monospace", opacity: 0.5, background: "var(--bg-elevated)", padding: "10px 16px", borderRadius: 8, display: "inline-block", border: "1px solid var(--border-subtle)" }}>
                            UID: {attestationId?.slice(0, 16)}...{attestationId?.slice(-16)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}


            {tab==="poh" && (
              <div className="stagger-container visible">
                <div style={{ marginBottom: 32 }}>
                  <h2 style={{ fontSize: 32, fontWeight: 300, fontFamily: "'Syne', sans-serif", marginBottom: 12 }}>Proof of Humanity</h2>
                  <p style={{ fontSize: 13, opacity: 0.6, maxWidth: 600 }}>
                    Volund uses Proof of Humanity to prevent Sybil attacks and ensure decentralized truth. Higher levels unlock higher score caps.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 32 }}>
                  <div>
                    <PoHLevelAccordion 
                      level={1} 
                      isActive={pohLevel === 0} 
                      currentPoh={pohLevel}
                      requirements={[
                        { id: "github", label: "GitHub connected > 3mo", met: social.github?.connected && social.github.ageMonths >= 3, actionLabel: "Connect GitHub" },
                        { id: "twitter", label: "Twitter connected > 3mo", met: social.twitter?.connected && social.twitter.ageMonths >= 3, actionLabel: "Connect Twitter" },
                        { id: "discord", label: "Discord connected > 3mo", met: social.discord?.connected && social.discord.membershipMonths >= 3, actionLabel: "Connect Discord" }
                      ]}
                      onAction={(id) => setTab("identity")}
                    />
                    <PoHLevelAccordion 
                      level={2} 
                      isActive={pohLevel === 1} 
                      currentPoh={pohLevel}
                      requirements={[
                        { id: "ens", label: "Primary ENS Name registered", met: social.ens?.hasENS, actionLabel: "Connect Wallet" }
                      ]}
                      onAction={() => connectWallet()} // Wire up to connectWallet
                    />
                    <PoHLevelAccordion 
                      level={3} 
                      isActive={pohLevel === 2} 
                      currentPoh={pohLevel}
                      requirements={[
                        { id: "worldcoin", label: "World ID verified", met: social.worldcoin?.verified, actionLabel: "Verify World ID" }
                      ]}
                      onAction={() => setShowPohModal(true)}
                    />
                    <PoHLevelAccordion 
                      level={4} 
                      isActive={pohLevel === 3} 
                      currentPoh={pohLevel}
                      requirements={[
                        { 
                          id: "vouching", 
                          label: `${(social.vouches || []).filter(v => v.score >= 400).length}/3 Reputable Vouches received`, 
                          met: (social.vouches || []).filter(v => v.score >= 400).length >= 3, 
                          actionLabel: "Request Vouch" 
                        }
                      ]}
                      onAction={() => {}} // Handler below
                    />
                  </div>

                  <div>
                    <div style={{ ...panel, padding: "24px" }}>
                      <span style={label}>DECENTRALIZED VOUCHING</span>
                      <PeerVouching 
                        vouches={social.vouches}
                        onVouchRequested={() => alert("Request link copied: volund.rialo.io/vouch/" + wallet)}
                        onVouchSomeone={(addr) => handleVouch(addr, true)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab==="identity" && (
              <IdentityHub 
                social={social} 
                onConnect={handleConnect} 
                onDisconnect={handleDisconnect}
                connectingId={connectingId}
                hasENS={!!onchainData?.ens}
                ensName={onchainData?.ens}
                ensAvatar={onchainData?.ensAvatar}
                tab={tab}
                setTab={setTab}
              />
            )}

            {tab==="badges" && (
              <div className="stagger-container visible">
                {/* floating toast — always visible */}
                {(claimError || claimSuccess) && (
                  <div style={{ position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)", zIndex:999,
                    padding:"12px 24px", borderRadius:8, fontSize:12, fontFamily:"'Inter',sans-serif",
                    border:`1px solid var(--accent-border)`,
                    background: claimError ? "var(--error)" : "var(--accent-glow)",
                    color: claimError ? "var(--bg-primary)" : "var(--accent)",
                    backdropFilter:"blur(10px)", whiteSpace:"nowrap",
                    boxShadow:"0 8px 32px rgba(0,0,0,0.2)" }}>
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
                      <div style={{ fontSize:26, fontWeight:300, color:"var(--text-primary)", fontFamily:"'Inter',sans-serif", letterSpacing:"-0.01em" }}>{s.val}</div>
                      <div style={{ fontSize:9, color:"var(--text-secondary)", opacity:.5, letterSpacing:".12em", marginTop:4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", marginBottom:14, border:"1px solid var(--border-subtle)", borderRadius:12, overflow:"auto" }}>
                  {["All","Common","Rare","Epic","Legendary"].map(r=>{
                    const a=filter===r;
                    return <button key={r} onClick={()=>setFilter(r)} style={{ flex:1, padding:"9px 0", border:"none", background:a?"var(--text-primary)":"transparent", color:a?"var(--bg-primary)":"var(--text-primary)", fontSize:9, fontFamily:"'Inter',sans-serif", cursor:"pointer", letterSpacing:".1em", fontWeight:a?700:400, transition:"all .15s", opacity:a?1:0.5 }}>{r.toUpperCase()}</button>;
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
                      <div key={x.c} style={{ padding:"16px", border:"1px solid var(--border-subtle)", borderRadius:12 }}>
                        <div style={{ fontSize:10, color:"var(--text-secondary)", opacity:.5, fontFamily:"'Inter',sans-serif", marginBottom:6 }}>{x.c}</div>
                        <div style={{ fontSize:11, color:"var(--text-secondary)", opacity:.7, fontFamily:"'Inter',sans-serif", lineHeight:1.6 }}>{x.t}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab==="simulator" && onchainData && (
              <ScoreSimulator realData={onchainData} social={social} />
            )}

            {tab==="access" && (
              <DemoEligibleAccess />
            )}
          </>
        )}

        <div style={{ marginTop:36, paddingTop:24, borderTop:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <Logo size={14}/>
          <span style={{ fontSize:9, color:"var(--text)", opacity:.2, fontFamily:"'Inter',sans-serif", letterSpacing:".12em" }}>RRS · DEVNET</span>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShare && !!onchainData}
        onClose={()=>setShowShare(false)}
        score={scoreVal}
        tier={tier}
        wallet={wallet}
        social={social}
        categories={categories}
        unlocked={unlocked}
        theme={theme}
      />

      {/* Onchain Wrapped Modal */}
      {showWrapped && onchainData && (
        <OnchainWrapped 
          onClose={() => setShowWrapped(false)}
          scoreVal={scoreVal}
          tier={tier}
          onchainData={onchainData}
          unlocked={unlocked}
        />
      )}
      {/* WorldCoin Modal */}
      <WorldCoinModal 
        isOpen={showPohModal} 
        onClose={() => setShowPohModal(false)} 
        onVerify={handleWorldVerify} 
      />

      {/* Real-time System Components */}
      <ScoreChangeToast toasts={toasts} />
      
      <TierUpgradeCelebration 
        isOpen={showUpgrade} 
        tier={upgradeTier} 
        onClose={() => setShowUpgrade(false)} 
        score={scoreVal}
        wallet={wallet}
      />

      {/* Demo functionality for evaluation */}
      <DemoControls onAction={handleDemoAction} />
    </div>
  );
}

