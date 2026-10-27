import { Mic } from 'lucide-react';
import { cn } from '@/lib/cn';
import ColumnIntro from '@/components/landing/ColumnIntro';
import { LANDING_CARD, LANDING_WRAP } from '@/constants/landing-styles';

const VoiceSection = () => (
  <section className="relative isolate overflow-hidden border-y border-white/[.07] py-28 sm:py-36">
    <div
      aria-hidden
      className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_100%,rgba(213,248,121,.1),transparent)]"
    />
    <div className={cn(LANDING_WRAP, 'grid gap-12 lg:grid-cols-2 lg:items-center')}>
      <div data-reveal>
        <ColumnIntro kicker="Built with Wispr Flow" title="Say the rule. Out loud.">
          Access rules are usually spoken first — in standups, reviews and Slack huddles. RuleProof
          meets them there: dictate straight into the Explain editor with Wispr Flow and the parser
          handles the way people actually phrase permissions.
        </ColumnIntro>
      </div>
      <div className={cn(LANDING_CARD, 'p-6')} data-reveal>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-brand text-brand-ink animate-pulse-ring">
            <Mic size={18} />
          </span>
          <div className="flex h-8 flex-1 items-center gap-[3px]" aria-hidden>
            {Array.from({ length: 48 }, (_, i) => (
              <span
                key={i}
                className="w-[3px] rounded-full bg-brand/60"
                style={{ height: `${20 + Math.round(Math.abs(Math.sin(i * 1.7)) * 80)}%` }}
              />
            ))}
          </div>
        </div>
        <p className="mt-6 text-lg leading-relaxed text-ink">
          “Viewers can read assets in their own tenant. Editors can also update them. Neither role
          can access another tenant’s assets.”
        </p>
        <p className="mt-4 font-mono text-[11px] text-ink-faint">
          → 6 concepts · 0 assumptions · 8 checks ready for review
        </p>
      </div>
    </div>
  </section>
);

export default VoiceSection;
