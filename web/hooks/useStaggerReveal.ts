'use client';

import type { RefObject } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';

type RevealOptions = { y: number; duration: number; stagger: number };

// Fades and lifts every element matching `selector` inside `scope` into place,
// skipped entirely for users who prefer reduced motion.
const useStaggerReveal = (
  scope: RefObject<HTMLElement | null>,
  selector: string,
  { y, duration, stagger }: RevealOptions,
  dependencies: unknown[] = [],
) => {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(selector, {
          opacity: 0,
          y,
          duration,
          ease: 'power2.out',
          stagger,
        });
      });
      return () => mm.revert();
    },
    { scope, dependencies },
  );
};

export default useStaggerReveal;
