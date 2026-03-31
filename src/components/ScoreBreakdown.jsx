import SpiderChart from './SpiderChart';
import CategoryAccordion from './CategoryAccordion';

const MOCK_WALLET_DATA = {
  txCount: 42,
  walletAgeMonths: 14,
  ethBalance: 0.85,
  rloBalance: 450,
  uniqueContracts: 12,
  chainCount: 1,
  gasSpentEth: 0.021,
  swapVolumeUsd: 1200,
  lpDays: 15,
  hasActiveLending: false,
  defiTxPerMonth: 3,
  isCleanHistory: true,
  farmingProtocols: 0,
  pohLevel: 0,
  hasENS: true,
  linkedAccounts: 2,
  github: { connected: true, ageMonths: 4, repoCount: 2 },
  twitter: { connected: true, followerCount: 45 },
  discord: { connected: false, membershipMonths: 0 },
  badgeCount: 1,
  badgeBonusTotal: 10
};

export default function ScoreBreakdown({ categories, walletData = MOCK_WALLET_DATA }) {
  if (!categories || categories.length === 0) return null;
  
  // Use txCount from walletData if available, otherwise default to 0
  const txCount = walletData?.txCount ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Spider Chart Section */}
      <div className="glass-panel" style={{ 
        padding: '32px', 
        borderRadius: 24, 
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          marginBottom: 24
        }}>
          <div style={{ 
            fontSize: 10, 
            color: 'var(--accent)', 
            letterSpacing: '.2em', 
            fontWeight: 800, 
          }}>
            REPUTATION SPECTRUM
          </div>
          <div style={{ fontSize: 10, opacity: 0.4, fontWeight: 700 }}>
            TX COUNT: {txCount}
          </div>
        </div>
        <SpiderChart categories={categories} />
      </div>

      {/* Categories Section */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          fontSize: 10, 
          color: 'var(--text-dim)', 
          letterSpacing: '.2em', 
          fontWeight: 800, 
          marginBottom: 20,
          opacity: 0.6
        }}>
          DETAILED METRICS
        </div>
        {categories.map((cat, idx) => (
          <CategoryAccordion key={cat.id} category={cat} isFirst={idx === 0} />
        ))}
      </div>
    </div>
  );
}
