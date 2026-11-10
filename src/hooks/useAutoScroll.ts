// Single Responsibility Hook: Manages smooth sub-pixel auto-scrolling on any scrollable container

import { useEffect, useState, type RefObject } from 'react';

export function useAutoScroll(
  scrollContainerRef: RefObject<HTMLElement | null>,
  initialSpeed = 3
) {
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(initialSpeed);

  useEffect(() => {
    if (!isAutoScrolling) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    let subPixelAccumulator = 0;

    const step = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const el = scrollContainerRef.current;
      if (el) {
        const pixelsPerSecond = scrollSpeed * 12;
        subPixelAccumulator += pixelsPerSecond * dt;

        if (subPixelAccumulator >= 1) {
          const wholePixels = Math.floor(subPixelAccumulator);
          el.scrollTop += wholePixels;
          subPixelAccumulator -= wholePixels;
        }

        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
          setIsAutoScrolling(false);
          return;
        }
      }

      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isAutoScrolling, scrollSpeed, scrollContainerRef]);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return {
    isAutoScrolling,
    setIsAutoScrolling,
    scrollSpeed,
    setScrollSpeed,
    scrollToTop,
  };
}

