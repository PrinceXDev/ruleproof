import { cn } from '@/lib/cn';
import { LANDING_CARD } from '@/constants/landing-styles';

const ArchBox = ({ title, sub, items }: { title: string; sub: string; items: string[] }) => (
  <div className={cn(LANDING_CARD, 'p-6')}>
    <p className="font-mono text-[11px] uppercase tracking-[.16em] text-ink-faint">{sub}</p>
    <h3 className="mt-2 text-xl font-semibold">{title}</h3>
    <ul className="mt-4 space-y-2 text-sm text-ink-muted">
      {items.map((i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-2 size-1 shrink-0 rounded-full bg-brand" />
          {i}
        </li>
      ))}
    </ul>
  </div>
);

export default ArchBox;
