import { useEffect, useCallback } from "react";

/**
 * useScrollReveal — Fail-safe scroll-triggered animation engine.
 * Observes elements with animation classes and adds `.visible` when they enter viewport.
 * Has a safety fallback: forces all elements visible after 3s regardless.
 */
export function useScrollReveal() {
  const revealAll = useCallback(() => {
    const selectors = [
      ".stagger-container",
      ".reveal-left",
      ".reveal-right",
      ".reveal-scale",
      ".reveal-up-scroll",
    ];
    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        el.classList.add("visible");
      });
    });
  }, []);

  useEffect(() => {
    const selectors = [
      ".stagger-container",
      ".reveal-left",
      ".reveal-right",
      ".reveal-scale",
      ".reveal-up-scroll",
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.05, rootMargin: "100px 0px 100px 0px" }
    );

    // Observe after a small delay for React render
    const timer = setTimeout(() => {
      selectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          observer.observe(el);
        });
      });
    }, 50);

    // SAFETY NET: Force everything visible after 3 seconds
    const safetyTimer = setTimeout(revealAll, 3000);

    // Also reveal on scroll (backup for missed observations)
    const scrollHandler = () => {
      selectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          if (el.classList.contains("visible")) return;
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight + 100 && rect.bottom > -100) {
            el.classList.add("visible");
          }
        });
      });
    };
    window.addEventListener("scroll", scrollHandler, { passive: true });

    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimer);
      observer.disconnect();
      window.removeEventListener("scroll", scrollHandler);
    };
  }, [revealAll]);
}
