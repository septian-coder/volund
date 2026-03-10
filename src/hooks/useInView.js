import { useState, useEffect } from "react";

export function useInView(ref, threshold = 0.15) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return vis;
}

export function useEase(target, active, dur = 1800) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) { setV(0); return; }
    let s = null;
    const run = ts => {
      if (!s) s = ts;
      const p = Math.min((ts - s) / dur, 1), e = 1 - Math.pow(1 - p, 4);
      setV(Math.round(target * e));
      if (p < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  }, [active, target]);
  return v;
}
