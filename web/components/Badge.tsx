import clsx from 'clsx';
import type { ReactNode } from 'react';

type Tone = 'neutral' | 'pass' | 'fail' | 'attn' | 'brand';

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-panel-elevated text-ink-muted border-border',
  pass: 'bg-pass/10 text-pass border-pass/30',
  fail: 'bg-fail/10 text-fail border-fail/30',
  attn: 'bg-attn/10 text-attn border-attn/30',
  brand: 'bg-brand text-brand-ink border-brand',
};

const Badge = ({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) => (
  <span
    className={clsx(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5',
      toneClasses[tone],
      className,
    )}
  >
    {children}
  </span>
);

export default Badge;
