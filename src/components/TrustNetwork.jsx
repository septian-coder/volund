import { useState } from "react";
import { ethers } from "ethers";

export default function TrustNetwork({ score, wallet }) {
  const [address, setAddress] = useState("");
  const [vouching, setVouching] = useState(false);
  const [vouches, setVouches] = useState([]);
  const [error, setError] = useState(null);

  const isEligible = score >= 400;

  const handleVouch = async () => {
    if (!address || !isEligible) return;
    if (!window.ethereum || !wallet || wallet === "0x3f4a8c2e1d9b7f6a5c4d3e2f1a0b9c8d7e6f5a4b") {
      alert("Please connect your ACTUAL wallet to vouch. Demo accounts cannot perform on-chain actions.");
      return;
    }

    setVouching(true);
    setError(null);
    
    try {
      // Ensure Base Sepolia
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== "0x14a34") {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x14a34" }],
        });
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Real wallet confirmation: Vouching action
      const tx = await signer.sendTransaction({
        to: await signer.getAddress(),
        value: 0,
        data: ethers.hexlify(ethers.toUtf8Bytes("VOLUND_VOUCH_" + address))
      });

      await tx.wait();
      
      setVouches(prev => [...prev, { addr: address, date: "Confirmed on-chain" }]);
      setAddress("");
    } catch (err) {
      console.error("Vouch failed:", err);
      setError("Vouching cancelled or failed.");
    } finally {
      setVouching(false);
    }
  };

  return (
    <div className="glass-panel" style={{
      marginTop: 24,
      padding: "32px",
      borderRadius: 24,
      position: "relative"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#a855f7" }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", opacity: 0.6 }}>SOCIAL TRUST LAYER</span>
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 300, marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>Trust Network (Vouching)</h3>
      <p style={{ fontSize: 11, opacity: 0.5, marginBottom: 20 }}>
        Create an on-chain web of trust. Verified high-reputation members can vouch for other addresses.
      </p>

      {!isEligible ? (
        <div style={{ padding: "12px", background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.1)", borderRadius: 10, fontSize: 10, color: "#f87171" }}>
          ⚠️ REQUIRES 400+ SCORE TO VOUCH OTHERS
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10 }}>
          <input 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Search address to vouch..."
            style={{ 
              flex: 1, 
              background: "rgba(0,0,0,0.2)", 
              border: "1px solid var(--border)", 
              borderRadius: 8, 
              padding: "10px 14px", 
              fontSize: 12, 
              color: "var(--text)",
              outline: "none"
            }}
          />
          <button 
            onClick={handleVouch}
            disabled={vouching || !address}
            style={{ 
              padding: "0 20px", 
              background: vouching ? "var(--border)" : "var(--text)", 
              color: "var(--bg)", 
              border: "none", 
              borderRadius: 8, 
              fontSize: 11, 
              fontWeight: 700, 
              cursor: "pointer" 
            }}
          >
            {vouching ? "VOUCHING..." : "VOUCH"}
          </button>
        </div>
      )}

      {vouches.length > 0 && (
        <div style={{ marginTop: 20, animation: "fade-up 0.5s ease" }}>
          <div style={{ fontSize: 9, opacity: 0.4, marginBottom: 10, letterSpacing: ".05em" }}>RECENT VOUCHES</div>
          {vouches.map((v, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 10, marginBottom: 4 }}>
              <div style={{ fontSize: 11, fontFamily: "monospace", opacity: 0.8 }}>{v.addr.slice(0, 8)}...{v.addr.slice(-8)}</div>
              <div style={{ fontSize: 9, opacity: 0.4 }}>{v.date}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
