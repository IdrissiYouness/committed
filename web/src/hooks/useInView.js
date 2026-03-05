import { useEffect, useRef, useState } from 'react';

/**
 * useInView
 *
 * Observes when an element enters the viewport using IntersectionObserver.
 * Once the element is visible, `inView` is set to true and the observer
 * disconnects — so the animation only triggers once (on scroll in).
 *
 * Usage:
 *   const [ref, inView] = useInView();
 *   <div ref={ref} className={inView ? 'animate-slide-up' : 'opacity-0'} />
 *
 * @param {IntersectionObserverInit} options - Optional observer config
 * @returns {[React.RefObject, boolean]}
 */
export function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect(); // trigger once only
        }
      },
      { threshold: 0.15, ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, inView];
}

/**
 * useCountUp
 *
 * Animates a number from 0 to `target` over `duration` ms.
 * Only starts when `inView` is true — pair with useInView.
 *
 * Usage:
 *   const [ref, inView] = useInView();
 *   const count = useCountUp(500, 2000, inView);
 *   <span ref={ref}>{count}+</span>
 *
 * @param {number}  target   - Final number to count up to
 * @param {number}  duration - Animation duration in ms (default 2000)
 * @param {boolean} inView   - Whether the element is visible (starts the animation)
 * @returns {number} current count value
 */
export function useCountUp(target, duration = 2000, inView = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;

    let startTime = null;
    let frame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out curve: fast start, slow finish
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [inView, target, duration]);

  return count;
}