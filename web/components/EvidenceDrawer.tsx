'use client';

import { useRef } from 'react';
import { X } from 'lucide-react';
import type { CheckResult, Plan, PlanCase, Run } from '@/lib/types';
import { useDialog } from '@/lib/useDialog';
import { useGSAP, gsap } from '@/lib/gsap';
import { evidenceJson } from '@/lib/evidence';
import { ACTION_LABEL, ROLE_LABEL, SCOPE_LABEL } from '@/constants/labels';
import { ResultBadge } from './evidence/StatusBadges';
import EvidenceBody from './evidence/EvidenceBody';
import EvidenceActions from './evidence/EvidenceActions';

const EvidenceDrawer = ({
  open,
  onClose,
  result,
  planCase,
  plan,
  run,
  revisionLabel,
}: {
  open: boolean;
  onClose: () => void;
  result: CheckResult | null;
  planCase: PlanCase | null;
  plan: Plan;
  run: Run | null;
  revisionLabel: string;
}) => {
  const dialogRef = useDialog<HTMLDivElement>(open, onClose);
  const panelRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!open) return undefined;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          panelRef.current,
          { opacity: 0, x: 24 },
          { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' },
        );
      });
      return () => mm.revert();
    },
    { dependencies: [open, result?.id] },
  );

  if (!open || !result || !planCase) return null;

  return (
    <div
      className="fixed inset-0 z-30 md:pointer-events-none md:bg-transparent"
      role="presentation"
    >
      <div className="absolute inset-0 bg-black/50 md:hidden" onClick={onClose} aria-hidden />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-title"
        className="pointer-events-auto absolute inset-y-0 right-0 flex w-full flex-col border-l border-border bg-panel shadow-2xl md:w-[420px]"
      >
        <div ref={panelRef} className="flex h-full flex-col">
          <div className="flex items-start justify-between border-b border-border px-5 py-4">
            <div>
              <h2 id="evidence-title" className="text-sm font-semibold text-ink">
                {ROLE_LABEL[planCase.role]} → {ACTION_LABEL[planCase.action]} →{' '}
                {SCOPE_LABEL[planCase.scope]}
              </h2>
              {result.variant && (
                <p className="mt-0.5 text-xs text-ink-muted">
                  Bypass attempt: {result.variant.label}
                </p>
              )}
              <div className="mt-1.5">
                <ResultBadge verdict={result.verdict} isVariant={Boolean(result.variant)} />
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close evidence inspector"
              className="rounded p-1 text-ink-faint hover:bg-panel-elevated hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>

          <EvidenceBody
            result={result}
            planCase={planCase}
            plan={plan}
            run={run}
            revisionLabel={revisionLabel}
          />
          <EvidenceActions
            resultId={result.id}
            json={evidenceJson(result, planCase, plan, run, revisionLabel)}
          />
        </div>
      </div>
    </div>
  );
};

export default EvidenceDrawer;
