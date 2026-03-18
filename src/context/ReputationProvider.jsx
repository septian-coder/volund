import React, { useState, useEffect, useCallback } from 'react';
import { ReputationContext } from './ReputationContext';
import { calcPoHLevel } from '../utils/onchain';

export const ReputationProvider = ({ children }) => {
  const [social, setSocial] = useState({
    github: { connected: false, ageMonths: 0 },
    twitter: { connected: false, ageMonths: 0 },
    discord: { connected: false, membershipMonths: 0 },
    ens: { hasENS: false },
    worldcoin: { verified: false },
    vouches: []
  });

  const [score, setScore] = useState(0);
  const [tier, setTier] = useState('unverified');
  const [pohLevel, setPohLevel] = useState(0);
  const [badges, setBadges] = useState([]);
  const [walletData, setWalletData] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addUpgradeToast = useCallback((level) => {
    const id = Date.now();
    const newToast = {
      id,
      message: `🎉 PoH Level ${level} Unlocked!`,
      sub: level === 1 ? "Score cap lifted: 300 → 500 pts" : "Reputation upgraded",
      type: "poh-upgrade"
    };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  // Auto-recalculate whenever social state changes
  useEffect(() => {
    const newLevel = calcPoHLevel(social);

    if (newLevel !== pohLevel) {
      setPohLevel(newLevel);
      if (newLevel > pohLevel) {
        addUpgradeToast(newLevel);
      }
    }
  }, [
    social.github?.connected,
    social.github?.ageMonths,
    social.twitter?.connected,
    social.twitter?.ageMonths,
    social.discord?.connected,
    social.discord?.membershipMonths,
    social.ens?.hasENS,
    social.worldcoin?.verified,
    social.vouches,
    pohLevel,
    addUpgradeToast
  ]);

  const updateSocial = useCallback((platform, data) => {
    setSocial(prev => ({
      ...prev,
      [platform]: data
    }));
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
      // If a platform is not in defaults, fallback to null (or we could just use null)
      newState[platform] = defaults[platform] || null;
      return newState;
    });
  }, []);

  const initializeSocial = useCallback((data) => {
    setSocial(data);
  }, []);

  return (
    <ReputationContext.Provider value={{ 
      social, 
      score, 
      setScore,
      tier, 
      setTier,
      pohLevel, 
      setPohLevel,
      badges, 
      setBadges,
      walletData, 
      setWalletData,
      updateSocial, 
      disconnectSocial,
      initializeSocial,
      toasts,
      setToasts
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
