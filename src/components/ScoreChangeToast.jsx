import { motion, AnimatePresence } from "framer-motion";

/**
 * ScoreChangeToast
 * Now handles an array of toasts and stacks them in the top-right.
 */
export default function ScoreChangeToast({ toasts }) {
  return (
    <div style={{
      position: "fixed",
      top: 32,
      right: 32,
      zIndex: 10000,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      alignItems: "flex-end",
      pointerEvents: "none"
    }}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            style={{
              background: "#111111",
              borderLeft: "3px solid #a9ddd3",
              padding: "16px 24px",
              borderRadius: "4px 12px 12px 4px",
              boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
              minWidth: "220px",
              pointerEvents: "auto"
            }}
          >
            <div style={{ 
              fontSize: 24, 
              fontWeight: 700, 
              color: "#a9ddd3", 
              fontFamily: "'Space Mono', monospace",
              marginBottom: 4
            }}>
              +{toast.points} pts
            </div>
            <div style={{ 
              fontSize: 12, 
              color: "#e8e3d5",
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity: 0.9
            }}>
              <span style={{ fontSize: 14 }}>📊</span>
              {toast.platform} Activity Updated
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
