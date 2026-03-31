import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Clock, 
  Coins, 
  CircleDollarSign, 
  FileCode, 
  Network, 
  Zap, 
  Droplets, 
  Landmark, 
  LayoutGrid, 
  ShieldCheck, 
  Github, 
  Twitter, 
  MessageCircle, 
  FileText, 
  Vote, 
  Sprout, 
  Tag,
  Info 
} from 'lucide-react';

const ICON_MAP = {
  Activity,
  Clock,
  Coins,
  CircleDollarSign,
  FileCode,
  Network,
  Zap,
  Droplets,
  Landmark,
  LayoutGrid,
  ShieldCheck,
  Github,
  Twitter,
  MessageCircle,
  FileText,
  Vote,
  Sprout,
  Tag
};

export default function ParameterRow({ icon, label, currentValue, earned, max, formula, improveTip, isRLO, index }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showImprove, setShowImprove] = useState(false);
  
  const percent = (earned / max) * 100;
  const color = percent < 50 ? 'var(--warning)' : percent < 80 ? 'var(--info)' : 'var(--accent)';

  const IconComponent = ICON_MAP[icon] || Activity;

  return (
    <div style={{ 
      background: index % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-subtle)'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 16, 
        padding: '16px 20px',
        cursor: 'pointer',
        userSelect: 'none'
      }} onClick={() => setShowImprove(!showImprove)}>
        
        {/* Icon & Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '30%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20 }}>
            <IconComponent size={16} strokeWidth={1.5} color="#a9ddd3" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', opacity: 0.9 }}>{label}</span>
        </div>

        {/* Current Value */}
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', opacity: 0.5, width: '20%', fontFamily: 'monospace' }}>
          {currentValue}
        </div>

        {/* Pts */}
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', width: '20%', textAlign: 'right' }}>
          {earned} <span style={{ opacity: 0.3, color: 'var(--text-secondary)' }}>/ {max} pts</span>
        </div>

        {/* Progress Bar */}
        <div style={{ flex: 1, height: 4, background: 'var(--accent-border)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ height: '100%', background: color }} 
          />
        </div>

        {/* Info Icon / Tooltip */}
        <div style={{ position: 'relative', width: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <div 
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            style={{ display: 'flex', opacity: 0.4, cursor: 'help' }}
          >
            <Info size={14} strokeWidth={1.5} color="#a9ddd3" />
          </div>
          <AnimatePresence>
            {showTooltip && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                style={{ 
                  position: 'absolute', bottom: '100%', right: 0, marginBottom: 8,
                  zIndex: 100, width: 200, padding: '10px 14px',
                  background: 'var(--bg-secondary)', border: '1px solid var(--accent-border)',
                  borderRadius: 8, boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                }}>
                <div style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '.1em', marginBottom: 4 }}>FORMULA</div>
                <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{formula}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* "How to improve" callout */}
      <AnimatePresence>
        {showImprove && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ 
              background: 'var(--bg-elevated)', 
              padding: '12px 20px 20px 52px',
              borderLeft: '3px solid var(--accent)',
              margin: '0 0 1px 0'
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 6, letterSpacing: '.05em' }}>HOW TO IMPROVE</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', opacity: 0.7, lineHeight: 1.5 }}>{improveTip}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
