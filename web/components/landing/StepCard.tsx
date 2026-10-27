import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { LANDING_CARD } from '@/constants/landing-styles';

const StepCard = ({
  n,
  title,
  body,
  detail,
  icon: Icon,
}: {
  n: string;
  title: string;
  body: string;
  detail: string[];
  icon: LucideIcon;
}) => (
  <article
    data-step
    className={cn(
      LANDING_CARD,
      'group relative grid gap-6 p-6 transition-colors duration-500 sm:p-8 md:grid-cols-[auto_1fr_1fr] md:items-start',
      '[&.is-active]:border-brand/30 [&.is-active]:bg-brand/[.035]',
    )}
  >
    <span
      aria-hidden
      className="absolute -left-[46px] top-9 hidden size-3 rounded-full border-2 border-[#0d0f0e] bg-white/20 transition-colors duration-500 group-[.is-active]:bg-brand lg:block"
    />
    <span className="grid size-12 place-items-center rounded-xl border border-white/10 bg-black/30 text-brand">
      <Icon size={20} />
    </span>
    <div>
      <p className="font-mono text-xs text-ink-faint">STEP {n}</p>
      <h3 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h3>
    </div>
    <div>
      <p className="text-[15px] leading-relaxed text-ink-muted">{body}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {detail.map((d) => (
          <code
            key={d}
            className="rounded-md border border-white/[.08] bg-black/30 px-2 py-1 font-mono text-[11px] text-ink-muted"
          >
            {d}
          </code>
        ))}
      </div>
    </div>
  </article>
);

export default StepCard;
