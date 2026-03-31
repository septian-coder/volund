import { useEffect, useRef, useState } from "react";

/**
 * AnimatedCounter — Counts up from 0 to a target value when visible.
 * Uses IntersectionObserver to trigger the animation only when in viewport.
 */
export default function AnimatedCounter({ value, duration = 1600, suffix = "", prefix = "", style = {} }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const target = parseFloat(value);
          const isFloat = String(value).includes(".");
          const startTime = performance.now();

          const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = eased * target;
            setDisplay(isFloat ? current.toFixed(1) : Math.floor(current));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} style={style}>
      {prefix}{display}{suffix}
    </span>
  );
}
