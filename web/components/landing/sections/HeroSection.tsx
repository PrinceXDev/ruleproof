import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { buttonVariants } from '@/components/ui/button';
import HeroConsole from '@/components/landing/HeroConsole';
import { HERO_STATS } from '@/constants/landing';
import { LANDING_WRAP } from '@/constants/landing-styles';

const HeroSection = () => (
  <section className="relative isolate pt-28 sm:pt-36">
    <div
      aria-hidden
      className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_40%,transparent_100%)]"
    />
    <div
      aria-hidden
      className="absolute left-1/2 top-[-280px] -z-10 h-[620px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(213,248,121,.14),transparent)]"
    />
    <div
      className={cn(
        LANDING_WRAP,
        'grid items-center gap-14 pb-20 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pb-28',
      )}
    >
      <div>
        <a
          href="#problem"
          data-hero
          className="group inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[.03] py-1 pl-1 pr-3.5 text-xs text-ink-muted backdrop-blur transition-colors hover:border-brand/40"
        >
          <span className="rounded-full bg-brand px-2 py-0.5 font-medium text-brand-ink">New</span>
          Speak a rule. Get request-level proof.
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </a>
        <h1
          data-hero-title
          className="mt-7 text-balance text-[44px] font-semibold leading-[0.98] tracking-[-0.045em] sm:text-7xl lg:text-[84px]"
        >
          Your UI says no. Does your{' '}
          <span className="text-brand underline decoration-brand/30 decoration-[6px] underline-offset-[10px]">
            API?
          </span>
        </h1>
        <p data-hero className="mt-7 max-w-xl text-pretty text-lg leading-relaxed text-ink-muted">
          RuleProof turns a plain-language access rule into a reviewable, approved test plan — then
          fires real HTTP requests and shows you, with evidence, exactly where the API breaks the
          rule.
        </p>
        <div data-hero className="mt-9 flex flex-wrap items-center gap-3">
          <Link href="/studio/" className={buttonVariants({ size: 'lg' })}>
            Open the Evidence Studio
            <ArrowUpRight
              size={18}
              className="transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5"
            />
          </Link>
          <a href="#demo" className={buttonVariants({ variant: 'secondary', size: 'lg' })}>
            Try the 60-second demo
          </a>
        </div>
        <dl
          data-hero
          className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/[.07] pt-6"
        >
          {HERO_STATS.map(([v, l]) => (
            <div key={l}>
              <dt className="sr-only">{l}</dt>
              <dd className="font-mono-tnum text-3xl font-semibold tracking-tight text-ink">{v}</dd>
              <dd className="mt-1 text-xs leading-snug text-ink-faint">{l}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div data-hero>
        <HeroConsole />
      </div>
    </div>
  </section>
);

export default HeroSection;
