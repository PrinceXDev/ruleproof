'use client';

import { ArrowRight, Check, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { SAMPLE_CASES } from '@/constants/landing-demo';

const CheckList = ({
  fixed,
  selected,
  onSelect,
}: {
  fixed: boolean;
  selected: number;
  onSelect: (index: number) => void;
}) => (
  <div className="flex flex-col gap-1.5" aria-label="Sample check results">
    {SAMPLE_CASES.map((item, i) => {
      const failed = !fixed && item.action === 'read' && item.scope === 'other';
      return (
        <button
          type="button"
          key={`${item.role}-${item.action}-${item.scope}`}
          aria-pressed={selected === i}
          onClick={() => onSelect(i)}
          className={cn(
            'group flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left text-sm transition-all',
            selected === i
              ? 'border-brand/50 bg-brand/[.06]'
              : 'border-white/[.06] bg-white/[.015] hover:border-white/15',
          )}
        >
          <span
            className={cn(
              'grid size-5 place-items-center rounded-full',
              failed ? 'bg-fail/20 text-fail' : 'bg-pass/15 text-pass',
            )}
          >
            {failed ? <X size={11} strokeWidth={3} /> : <Check size={11} strokeWidth={3} />}
          </span>
          <span className="flex-1 capitalize text-ink">
            {item.role} · {item.action}
            <span className="ml-2 text-xs normal-case text-ink-faint">{item.scope} tenant</span>
          </span>
          <span className={cn('text-xs', failed ? 'text-fail' : 'text-pass')}>
            {failed ? 'Failed' : 'Passed'}
          </span>
          <ArrowRight
            size={14}
            className="text-ink-faint transition-transform group-hover:translate-x-0.5"
          />
        </button>
      );
    })}
  </div>
);

export default CheckList;
