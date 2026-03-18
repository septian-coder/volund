import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * PoHLevelAccordion
 * One accordion item per level showing requirements and status.
 */
export default function PoHLevelAccordion({ level, isActive, currentPoh, requirements = [], onAction }) {
  const [isOpen, setIsOpen] = useState(isActive);
  const isActiveLevel = (currentPoh + 1) === level;
  const isLocked = level > (currentPoh + 1);

  return (
    <div 
      title={isLocked ? "Complete previous levels first" : ""}
      style={{
      border: "1px solid var(--border-subtle)",
      borderLeft: isActiveLevel ? "3px solid #a9ddd3" : "1px solid var(--border-subtle)",
      borderRadius: "16px",
      marginBottom: 12,
      overflow: "hidden",
      background: isActiveLevel ? "rgba(169, 221, 211, 0.03)" : "transparent",
      opacity: isLocked ? 0.35 : 1
    }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          background: isCompleted ? "rgba(169, 221, 211, 0.05)" : "transparent"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 24, height: 24, borderRadius: "50%",
            border: isCompleted ? "none" : "1px solid var(--text-secondary)",
            background: isCompleted ? "#a9ddd3" : "transparent",
            color: isCompleted ? "#010101" : "var(--text-secondary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 800
          }}>
            {isCompleted ? "✓" : level}
          </div>
          <div style={{ 
            fontSize: 14, 
            fontWeight: 700, 
            color: isCompleted ? "#a9ddd3" : "var(--text-primary)"
          }}>
            {level === 1 && "Social Identity"}
            {level === 2 && "Primary Name (ENS)"}
            {level === 3 && "Unique Humanity (World ID)"}
            {level === 4 && "Community Vouching"}
          </div>
        </div>
        <div style={{ fontSize: 10, color: "var(--text-secondary)", opacity: 0.5 }}>
          {isOpen ? "Collapse" : "View details"}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div style={{ padding: "0 20px 20px 56px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {requirements.map((req, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ 
                        color: req.met ? "#a9ddd3" : "rgba(232,227,213,0.3)", 
                        fontSize: 12 
                      }}>
                        {req.met ? "●" : "○"}
                      </span>
                      <span style={{ 
                        fontSize: 12, 
                        color: "var(--text-primary)", 
                        opacity: req.met ? 1 : 0.5 
                      }}>
                        {req.label}
                      </span>
                    </div>
                    {!req.met && req.actionLabel && (
                      <button 
                        onClick={() => !isLocked && onAction(req.id)}
                        disabled={isLocked}
                        style={{
                          background: "none", border: "none", color: "#a9ddd3",
                          fontSize: 11, cursor: isLocked ? "not-allowed" : "pointer", padding: 0,
                          borderBottom: "1px solid rgba(169,221,211,0.3)",
                          opacity: 0.8,
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={e => {
                          if (!isLocked) {
                            e.currentTarget.style.opacity = "1";
                            e.currentTarget.style.borderColor = "#a9ddd3";
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isLocked) {
                            e.currentTarget.style.opacity = "0.8";
                            e.currentTarget.style.borderColor = "rgba(169,221,211,0.3)";
                          }
                        }}
                      >
                        {req.actionLabel}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
