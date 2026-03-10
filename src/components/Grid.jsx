import { useMemo } from "react";
import { useBreakpoint } from "../hooks/useBreakpoint";

export default function Grid() {
  const { w, isMobile } = useBreakpoint();

  const particles = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 20,
      dur: 15 + Math.random() * 25,
      size: 1 + Math.random() * 3,
      type: Math.random() > 0.5 ? "dot" : "cross",
    }));
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)", backgroundSize: "60px 60px" }}/>

      {!isMobile && particles.map(p => (
        <div key={p.id} style={{ position: "absolute", bottom: -20, left: `${p.left}%`, width: p.size, height: p.size, opacity: 0, animation: `float-particle ${p.dur}s ${p.delay}s linear infinite`, color: "var(--particle-color, rgba(232,227,213,0.25))" }}>
          {p.type === "dot" ? (
            <div style={{ width: "100%", height: "100%", background: "currentColor", borderRadius: "50%" }}/>
          ) : (
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
              <div style={{ position: "absolute", width: "100%", height: "1px", background: "currentColor", top: "50%" }}/>
              <div style={{ position: "absolute", width: "1px", height: "100%", background: "currentColor", left: "50%" }}/>
            </div>
          )}
        </div>
      ))}

      {!isMobile && (
        <>
          <div style={{ position: "absolute", top: "20%", left: "-5%", width: "40%", height: "60%", background: "radial-gradient(circle, rgba(169,221,211,0.05) 0%, transparent 70%)", filter: "blur(80px)" }}/>
          <div style={{ position: "absolute", bottom: "10%", right: "-5%", width: "30%", height: "50%", background: "radial-gradient(circle, rgba(232,227,213,0.03) 0%, transparent 70%)", filter: "blur(80px)" }}/>
        </>
      )}
    </div>
  );
}
