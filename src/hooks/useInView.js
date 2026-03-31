import { useState, useEffect } from "react";

export function useInView(ref, threshold = 0.1) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setVis(true);
        obs.unobserve(ref.current);
      }
    }, { threshold });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref.current]);
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
