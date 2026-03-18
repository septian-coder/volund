import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Github, 
  Twitter, 
  AtSign, 
  MessageCircle, 
  Radio, 
  Aperture, 
  CheckCircle2, 
  Circle,
  Globe
} from 'lucide-react';

export default function PlatformCard({ 
  platform, 
  status, 
  onConnect, 
  onDisconnect, 
  connecting,
  data,
  simulated
}) {
  const [showPreview, setShowPreview] = useState(false);
  
  const isConnected = status === "connected" || simulated;
  const isComingSoon = status === "coming_soon";

  // Design Tokens (fallback if not in tokens.css yet, but mostly using var(--))
  const cardStyle = {
    position: "relative",
    padding: "24px",
    borderRadius: "20px",
    background: "var(--bg-secondary)",
    border: isConnected 
      ? "2px solid var(--accent)" 
      : "1px solid var(--border-subtle)",
    transition: "all 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
    boxShadow: isConnected ? "0 0 20px var(--accent-glow)" : "none",
    opacity: isComingSoon ? 0.6 : 1,
    cursor: isComingSoon ? "not-allowed" : "default"
  };

  const getPlatformIcon = () => {
    let Icon = Globe;
    let color = "#a9ddd3";

    switch(platform.id) {
      case "github": Icon = Github; break;
      case "twitter": Icon = Twitter; break;
      case "ens": Icon = AtSign; break;
      case "discord": Icon = MessageCircle; break;
      case "farcaster": 
        Icon = Radio; 
        color = "#706b61";
        break;
      case "lens": 
        Icon = Aperture; 
        color = "#706b61";
        break;
    }

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: 'rgba(169,221,211,0.08)',
        border: '1px solid rgba(169,221,211,0.18)',
        flexShrink: 0
      }}>
        <Icon size={20} strokeWidth={1.5} color={color} />
      </span>
    );
  };

  return (
    <div 
      className={`glass-panel ${!isConnected && !isComingSoon ? 'hover-mint' : ''}`}
      style={cardStyle}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>{getPlatformIcon()}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isConnected ? (
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <CheckCircle2 size={14} strokeWidth={1.5} color="#a9ddd3" />
            </motion.div>
          ) : (
            !isComingSoon && <Circle size={14} strokeWidth={1.5} color="#706b61" />
          )}
          <span style={{ 
            fontSize: 10, 
            fontWeight: 800, 
            letterSpacing: "0.1em", 
            color: isConnected ? "var(--accent)" : "var(--text-secondary)",
            opacity: isConnected ? 1 : 0.4
          }}>
            {isComingSoon ? "COMING SOON" : isConnected ? "CONNECTED" : "DISCONNECTED"}
          </span>
        </div>
      </div>

      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>
        {platform.name}
      </div>

      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24, minHeight: 40, display: "flex", alignItems: "center", gap: 12 }}>
        {isComingSoon ? (
          <i style={{ color: "var(--text-tertiary)", fontSize: 12, fontStyle: "italic" }}>New identity protocol integration</i>
        ) : isConnected ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Avatar Placeholder */}
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent-glow)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
              {getPlatformIcon()}
            </div>
            <div>
              <div style={{ 
                fontSize: 14, 
                fontWeight: 700, 
                color: platform.id === "ens" ? "#f5f0e8" : "var(--text-primary)", 
                display: "flex", 
                alignItems: "center", 
                gap: 6 
              }}>
                {data?.handle || data?.username || "Verified User"}
                {(platform.id === "ens" && data?.isVerifiedChip) && (
                  <span style={{ fontSize: 9, background: "var(--accent)", color: "var(--bg-primary)", padding: "2px 6px", borderRadius: 4, fontWeight: 900 }}>VERIFIED</span>
                )}
              </div>
              <div style={{ fontSize: 10, opacity: 0.5 }}>{data?.details || "Account linked successfully"}</div>
            </div>
          </div>
        ) : (
          <div style={{ width: "100%" }}>
            {platform.id === "ens" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontWeight: 600 }}>No ENS found</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>
                  <a href="https://ens.domains" target="_blank" rel="noreferrer" style={{ color: "var(--accent)", textDecoration: "none" }}>ens.domains</a> · +30 pts if you register
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, lineHeight: 1.5 }}>{platform.description}</div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        {!isConnected && !isComingSoon && (
          <>
            <button 
              onClick={onConnect}
              disabled={connecting}
              className="premium-button"
              style={{ flex: 1, padding: "10px", fontSize: 11, justifyContent: "center" }}
            >
              {connecting ? (
                <div className="spinner-ring" style={{ width: 14, height: 14, border: "2px solid var(--bg-primary)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              ) : "CONNECT"}
            </button>
            <button 
              onClick={() => setShowPreview(true)}
              className="secondary-button"
              style={{ 
                flex: 1, 
                padding: "10px", 
                fontSize: 11, 
                borderColor: "var(--accent)", 
                color: "var(--accent)",
                background: "transparent"
              }}
            >
              PREVIEW
            </button>
          </>
        )}
        
        {isConnected && !isComingSoon && (
          <button 
            onClick={onDisconnect}
            className="secondary-button"
            style={{ flex: 1, padding: "10px", fontSize: 11, opacity: 0.6 }}
          >
            DISCONNECT
          </button>
        )}
      </div>

      {/* Preview Popover */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              background: "var(--bg-secondary)",
              padding: "24px",
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              border: "1px solid var(--accent-border)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
              backdropFilter: "blur(10px)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", letterSpacing: "0.1em" }}>PREVIEW IMPACT</span>
              <button onClick={() => setShowPreview(false)} style={{ background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer", fontSize: 18 }}>×</button>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ padding: "4px 10px", borderRadius: 20, background: "var(--accent-glow)", color: "var(--accent)", fontSize: 11, fontWeight: 700 }}>
                +{platform.impact} PTS
              </div>
              <span style={{ fontSize: 11, opacity: 0.6 }}>Reputation Gain</span>
            </div>
            
            <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--text-secondary)", marginBottom: "auto" }}>
              {platform.requirements}
            </p>

            <button 
              onClick={() => { setShowPreview(false); onConnect(); }}
              className="premium-button"
              style={{ padding: "12px", width: "100%", marginTop: 20 }}
            >
              CONNECT {platform.name.toUpperCase()}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .hover-mint:hover {
          border-color: var(--accent) !important;
          box-shadow: 0 0 15px var(--accent-glow);
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
