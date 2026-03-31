import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  TrendingUp, 
  UserCheck, 
  MessageSquare, 
  Award, 
  Lightbulb, 
  ChevronDown 
} from 'lucide-react';
import ParameterRow from './ParameterRow';

const ICON_MAP = {
  Layers: Layers,
  TrendingUp: TrendingUp,
  UserCheck: UserCheck,
  MessageSquare: MessageSquare,
  Award: Award
};

export default function CategoryAccordion({ category, isFirst }) {
  const [isOpen, setIsOpen] = useState(isFirst);
  const IconComponent = ICON_MAP[category.icon] || Layers;

  return (
    <div style={{ 
      border: '1px solid var(--border-subtle)', 
      borderRadius: 16, 
      overflow: 'hidden',
      marginBottom: 16,
      background: 'var(--bg-secondary)',
      backdropFilter: 'blur(20px)'
    }}>
      {/* Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          padding: '20px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          cursor: 'pointer',
          background: 'var(--bg-elevated)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24 }}>
            <IconComponent size={18} strokeWidth={1.5} color="#a9ddd3" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '.1em' }}>
            {category.label}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 18, fontWeight: 300, color: 'var(--text-primary)' }}>{category.score}</span>
            <span style={{ fontSize: 12, opacity: 0.3, marginLeft: 4, color: 'var(--text-secondary)' }}>/ {category.max}</span>
          </div>
          <motion.div 
            animate={{ rotate: isOpen ? 180 : 0 }}
            style={{ color: 'var(--accent)', display: 'flex' }}
          >
            <ChevronDown size={14} strokeWidth={2} />
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
              {category.rows.map((row, idx) => (
                <ParameterRow key={idx} {...row} index={idx} />
              ))}
              
              {/* Footer / Quick Win */}
              {category.quickWin && (
                <div style={{ padding: '16px 24px', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Lightbulb size={14} strokeWidth={1.5} color="#a9ddd3" />
                  <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, letterSpacing: '.02em' }}>
                    Quickest win: <span style={{ color: 'var(--text-primary)', fontWeight: 400, opacity: 0.8 }}>{category.quickWin}</span>
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
