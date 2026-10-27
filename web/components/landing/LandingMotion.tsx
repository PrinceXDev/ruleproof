'use client';

import { useGSAP, gsap, SplitText } from '@/lib/gsap';

const LandingMotion = () => {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const split = SplitText.create('[data-hero-title]', {
        type: 'lines,words',
        mask: 'lines',
      });
      gsap.from(split.words, {
        yPercent: 110,
        duration: 0.9,
        stagger: 0.045,
        ease: 'power4.out',
      });
      gsap.from('[data-hero]', {
        y: 18,
        opacity: 0,
        duration: 0.8,
        delay: 0.35,
        stagger: 0.1,
        ease: 'power3.out',
      });

      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          y: 28,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach((group) => {
        gsap.from(group.children, {
          y: 24,
          opacity: 0,
          duration: 0.7,
          stagger: 0.07,
          ease: 'power3.out',
          scrollTrigger: { trigger: group, start: 'top 88%', once: true },
        });
      });

      // Workflow rail fills as the reader scrolls through the four steps.
      gsap.from('[data-rail-fill]', {
        scaleY: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: '[data-rail]',
          start: 'top 60%',
          end: 'bottom 60%',
          scrub: true,
        },
      });
      gsap.utils.toArray<HTMLElement>('[data-step]').forEach((step) => {
        gsap.to(step, {
          scrollTrigger: {
            trigger: step,
            start: 'top 62%',
            end: 'bottom 62%',
            toggleClass: 'is-active',
          },
        });
      });

      return () => split.revert();
    });
    return () => mm.revert();
  }, []);

  return null;
};

export default LandingMotion;
