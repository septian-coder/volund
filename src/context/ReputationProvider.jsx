import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { VOLUND_REGISTRY, VOLUND_VOUCH, VOLUND_SCORE_ORACLE } from '../constants/contracts.json';
import ABIS from '../constants/abis.json';
import { ReputationContext } from './ReputationContext';
import { calcPoHLevel } from '../utils/onchain';
import { calculateScore as calcScore } from '../utils/scoreCalculator';
import { ethers } from 'ethers';
import { fetchOnchainData } from '../utils/onchain';

async function resolveBasename(address) {
  let checksumAddr;
  try { checksumAddr = ethers.getAddress(address); } catch { checksumAddr = address; }
  const baseProvider = new ethers.JsonRpcProvider('https://mainnet.base.org');
  try {
    const BASENAME_NFT = ethers.getAddress("0x03c4738ee98ae44591e1a4a4f3cab6641d95dd9a");
    const nftContract = new ethers.Contract(BASENAME_NFT, ["function balanceOf(address owner) view returns (uint256)"], baseProvider);
    const balance = await Promise.race([ nftContract.balanceOf(checksumAddr), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 6000)) ]);
    if (balance > 0n) {
      try {
        const addrLower = checksumAddr.toLowerCase().replace('0x', '');
        const reverseNode = ethers.namehash(`${addrLower}.addr.reverse`);
        const L2_RESOLVER = ethers.getAddress("0xc6d566a56a1aff6508b41f6c90ff131615583bcd");
        const resolver = new ethers.Contract(L2_RESOLVER, ["function name(bytes32 node) view returns (string)"], baseProvider);
        const baseName = await Promise.race([ resolver.name(reverseNode), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 4000)) ]);
        if (baseName && baseName.length > 0) return { hasENS: true, domain: baseName };
      } catch (e) { console.warn("[Basename] Reverse lookup failed:", e.message); }
      return { hasENS: true, domain: "Basename (Hidden)" };
    }
  } catch (err) { console.warn('[Basename] NFT ownership check failed:', err.message); }
  try {
    const ethProvider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
    const ensName = await Promise.race([ ethProvider.lookupAddress(checksumAddr), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 5000)) ]);
    if (ensName) return { hasENS: true, domain: ensName };
  } catch (err) { console.warn('[Basename] ENS fallback lookup failed:', err.message); }
  return { hasENS: false, domain: null };
}

export const ReputationProvider = ({ children }) => {
  // 1. Basic State
  const [social, setSocial] = useState({
    github: { connected: false, ageMonths: 0 },
    twitter: { connected: false, ageMonths: 0 },
    discord: { connected: false, membershipMonths: 0 },
    ens: { hasENS: false },
    worldcoin: { verified: false },
    vouches: []
  });

  const [onchainData, setOnchainData] = useState(null);
  const [localScore, setLocalScore] = useState(0);
  const [computed, setComputed] = useState(null);
  const [tier, setTier] = useState('unverified');
  const [pohLevel, setPohLevel] = useState(0);
  const [badges, setBadges] = useState([]);
  const [claimedBadges, setClaimedBadges] = useState({});
  const [toasts, setToasts] = useState([]);
  const [pohSyncing, setPohSyncing] = useState(false);
  const [scoreSyncing, setScoreSyncing] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [loadStep, setLoadStep] = useState("");

  const prevLevelRef = useRef(0);

  // 2. External Hooks (Account, Reads, Writes)
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // On-chain Score Reader
  const { data: rawScores, refetch: refreshOnchainScore } = useReadContract({
    address: VOLUND_SCORE_ORACLE,
    abi: ABIS.VolundScoreOracle,
    functionName: 'scores',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 20000,
    }
  });

  // PoH Identity Reader
  const { data: identity } = useReadContract({
    address: VOLUND_REGISTRY,
    abi: ABIS.VolundRegistry,
    functionName: 'getIdentity',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    }
  });

  // Vouches Reader
  const { data: rawVouches } = useReadContract({
    address: VOLUND_VOUCH,
    abi: ABIS.VOLUND_VOUCH,
    functionName: 'getVouches',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 15000,
    }
  });

  // 3. Derived Helpers
  // Note: `scores` mapping returns an unnamed tuple array by default via Wagmi/viem.
  const onchainScore = (rawScores && Array.isArray(rawScores)) ? Number(rawScores[0]) : 0;
  
  // Note: `getIdentity` returns named properties via it's custom struct getter
  const livePohLevel = identity ? Number(identity.pohLevel) : 0;
  const isRegistered = identity ? identity.registered : false;

  const addToast = useCallback((message, sub, type = "poh-upgrade") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, sub, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  }, []);

  // 4. Action Functions (useCallback)
  const loadData = useCallback(async (addr) => {
    if (!addr) return;
    setLoadingData(true);
    setLoadStep("reading wallet data...");
    try {
      const data = await fetchOnchainData(addr);
      setLoadStep("computing score...");
      setOnchainData(data);
      if (data.ens) {
        setSocial(prev => ({ ...prev, ens: { hasENS: true, domain: data.ens } }));
      }
      resolveBasename(addr).then(ens => {
        if (ens.hasENS) setSocial(prev => ({ ...prev, ens }));
      });
    } catch (err) {
      console.error("loadData failed:", err);
    } finally {
      setLoadingData(false);
      setLoadStep("");
    }
  }, []);

  const syncScoreOnchain = useCallback(async (walletAddr, scoresObj) => {
    if (!walletAddr || !scoresObj) return null;
    setScoreSyncing(true);
    try {
      const res = await fetch('/api/updateScore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletAddr, ...scoresObj })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Score sync request failed');
      await refreshOnchainScore();
      return data.txHash;
    } catch (err) {
      console.error('Score sync failed:', err);
      return null;
    } finally {
      setScoreSyncing(false);
    }
  }, [refreshOnchainScore]);

  const registerOnchain = useCallback(async (ensName = "") => {
    try {
      const txHash = await writeContractAsync({
        address: VOLUND_REGISTRY,
        abi: ABIS.VolundRegistry,
        functionName: 'registerIdentity',
        args: [ensName],
      });
      return txHash;
    } catch(err) {
      console.error(err);
      throw err;
    }
  }, [writeContractAsync]);

  const syncPohOnchain = useCallback(async (walletAddr, level) => {
    if (!walletAddr || level === undefined || level < 1 || level > 4) return null;
    setPohSyncing(true);
    try {
      const res = await fetch('/api/updatePoH', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletAddr, level })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'PoH sync request failed');
      return data.txHash;
    } catch (err) {
      console.error('PoH sync failed:', err);
      return null;
    } finally {
      setPohSyncing(false);
    }
  }, []);

  const vouchOnchain = useCallback(async (targetAddr) => {
    try {
      const txHash = await writeContractAsync({
        address: VOLUND_VOUCH,
        abi: ABIS.VOLUND_VOUCH,
        functionName: 'vouch',
        args: [targetAddr],
      });
      return txHash;
    } catch(err) {
      console.error("Vouch failed:", err);
      throw err;
    }
  }, [writeContractAsync]);

  const updateSocial = useCallback((platform, data) => {
    setSocial(prev => ({ ...prev, [platform]: data }));
  }, []);

  const disconnectSocial = useCallback((platform) => {
    setSocial(prev => {
      const newState = { ...prev };
      const defaults = {
        github: { connected: false, ageMonths: 0 },
        twitter: { connected: false, ageMonths: 0 },
        discord: { connected: false, membershipMonths: 0 },
        ens: { hasENS: false },
        worldcoin: { verified: false },
        vouches: []
      };
      newState[platform] = defaults[platform] || null;
      return newState;
    });
  }, []);

  const initializeSocial = useCallback((data) => {
    setSocial(data);
  }, []);

  // 5. Side Effects (useEffect)
  
  // Score Recalculation
  useEffect(() => {
    if (!onchainData) return;

    const walletData = {
      txCount: onchainData.txCount || 0,
      ageMonths: onchainData.walletAgeMo || 0,
      ethBalance: onchainData.balance || 0,
      rloBalance: social.rialoLinked ? 500 : 0,
      uniqueContracts: Math.min(Math.floor((onchainData.txCount || 0) * 0.3), 30),
      chains: social.multiChain || 1,
      gasSpentEth: parseFloat(((onchainData.txCount || 0) * 0.0005).toFixed(4)),
      swapVolumeUsd: (onchainData.txCount || 0) * 50,
      lpDays: (onchainData.txCount || 0) > 50 ? 30 : 0,
      lendActive: (onchainData.txCount || 0) > 100,
      defiTxPerMonth: Math.floor((onchainData.txCount || 0) / 12),
      cleanHistory: true,
      farmProtocols: (onchainData.txCount || 0) > 200 ? 5 : 0,
      hasENS: !!onchainData.ens,
      github: social.github,
      twitter: social.twitter,
      discord: social.discord,
      badgeCount: Object.keys(claimedBadges).length,
      pohLevel: pohLevel,
      linkedCount: (social.github?.connected ? 1 : 0) + (social.twitter?.connected ? 1 : 0) + (social.discord?.connected ? 1 : 0),
    };

    const result = calcScore(walletData);
    setComputed(result);
    setLocalScore(result.total);
  }, [onchainData, social, claimedBadges, pohLevel]);

  // Sync raw on-chain vouches into social state
  useEffect(() => {
    if (rawVouches && Array.isArray(rawVouches)) {
      const mappedVouches = rawVouches.map(addr => ({
        address: addr,
        score: 450,
        date: "On-chain"
      }));
      setSocial(prev => ({ ...prev, vouches: mappedVouches }));
    }
  }, [rawVouches]);

  // PoH Level Logic
  useEffect(() => {
    const localLevel = calcPoHLevel(social);
    const newLevel = Math.max(livePohLevel, localLevel);
    const previousLevel = prevLevelRef.current;

    if (newLevel === previousLevel) return;
    prevLevelRef.current = newLevel;
    setPohLevel(newLevel);

    if (newLevel > previousLevel) {
      if (address && isRegistered && newLevel > livePohLevel) {
        syncPohOnchain(address, newLevel).then(txHash => {
          if (txHash) {
            addToast(`PoH Level ${newLevel} Unlocked!`, "Synced on-chain");
          } else {
            addToast(`PoH Level ${newLevel} Unlocked!`, "Reputation upgraded (sync pending)");
          }
        });
      } else {
        addToast(`PoH Level ${newLevel} Unlocked!`, "Reputation upgraded");
      }
    }
  }, [social, livePohLevel, isRegistered, address, addToast, syncPohOnchain]);

  return (
    <ReputationContext.Provider value={{ 
      social, localScore, onchainScore, refreshOnchainScore,
      syncScoreOnchain, scoreSyncing, onchainData, setOnchainData,
      computed, loadData, loadingData, loadStep, claimedBadges, setClaimedBadges,
      tier, setTier, pohLevel, setPohLevel, badges, setBadges,
      updateSocial, disconnectSocial, initializeSocial, toasts, setToasts,
      isRegistered, registerOnchain, syncPohOnchain, vouchOnchain, pohSyncing
    }}>
      {children}
      
      {/* Portaled Toasts Container */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{
            background: "#0d0d0d",
            border: "1px solid #a9ddd3",
            borderRadius: "12px",
            padding: "16px 20px",
            color: "#e8e3d5",
            animation: "fade-up 0.4s cubic-bezier(0.23, 1, 0.32, 1) both",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            minWidth: 260
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#a9ddd3", marginBottom: 2 }}>{toast.message}</div>
            <div style={{ opacity: 0.6, fontSize: 11 }}>{toast.sub}</div>
          </div>
        ))}
      </div>
    </ReputationContext.Provider>
  );
};
