'use client';

import { useRef, useState } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import DemoToolbar from './product-demo/DemoToolbar';
import DemoStepper from './product-demo/DemoStepper';
import ExplainStage from './product-demo/ExplainStage';
import ReviewStage from './product-demo/ReviewStage';
import VerifyStage from './product-demo/VerifyStage';

const ProductDemo = () => {
  const [stage, setStage] = useState(0);
  const [approved, setApproved] = useState(false);
  const [fixed, setFixed] = useState(false);
  const [selected, setSelected] = useState(1);
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('[data-demo-content]', { y: 10, opacity: 0, duration: 0.35, ease: 'power2.out' });
        gsap.from('[data-matrix-item]', { opacity: 0, y: 8, duration: 0.3, stagger: 0.04 });
        const evidence = ref.current?.querySelector('[data-evidence]');
        if (evidence) gsap.from(evidence, { x: 10, opacity: 0.4, duration: 0.3 });
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [stage, selected, fixed], revertOnUpdate: true },
  );

  const reset = () => {
    setStage(0);
    setApproved(false);
    setFixed(false);
    setSelected(1);
  };

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-2xl border border-white/10 bg-[#121513] shadow-[0_50px_140px_-40px_rgba(0,0,0,.9)]"
    >
      <DemoToolbar onReset={reset} />
      <DemoStepper stage={stage} approved={approved} onSelect={setStage} />

      <div className="min-h-[520px] p-4 sm:p-7" data-demo-content>
        {stage === 0 && <ExplainStage onNext={() => setStage(1)} />}
        {stage === 1 && (
          <ReviewStage
            approved={approved}
            onApprove={() => {
              setApproved(true);
              setStage(2);
            }}
          />
        )}
        {stage === 2 && (
          <VerifyStage
            fixed={fixed}
            selected={selected}
            onFixedChange={setFixed}
            onSelect={setSelected}
          />
        )}
      </div>
    </div>
  );
};

export default ProductDemo;
