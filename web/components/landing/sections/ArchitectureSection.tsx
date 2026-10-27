import { cn } from '@/lib/cn';
import ArchArrow from '@/components/landing/ArchArrow';
import ArchBox from '@/components/landing/ArchBox';
import SectionHeading from '@/components/landing/SectionHeading';
import { ARCH_BROWSER_ITEMS, ARCH_FIXTURE_ITEMS, ARCH_PACKAGES } from '@/constants/landing';
import { LANDING_BAND, LANDING_CARD, LANDING_WRAP } from '@/constants/landing-styles';

const ArchitectureSection = () => (
  <section className={LANDING_BAND}>
    <div className={LANDING_WRAP}>
      <SectionHeading
        id="architecture"
        kicker="Under the hood"
        title={<>One Go binary. Zero magic.</>}
      >
        A small REST API in Go serves both synthetic fixtures and the statically exported Next.js UI
        from a single origin. Fits in one container.
      </SectionHeading>

      <div
        className="mt-16 grid gap-4 lg:grid-cols-[1fr_auto_1.6fr_auto_1fr] lg:items-stretch"
        data-stagger
      >
        <ArchBox
          title="Browser"
          sub="Next.js 16 · React 19 · Tailwind v4 · GSAP"
          items={ARCH_BROWSER_ITEMS}
        />
        <ArchArrow />
        <div className={cn(LANDING_CARD, 'border-brand/25 p-6')}>
          <p className="font-mono text-[11px] uppercase tracking-[.16em] text-brand">
            cmd/server · Go
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {ARCH_PACKAGES.map(([p, d]) => (
              <div key={p} className="rounded-lg border border-white/[.07] bg-black/30 p-3">
                <p className="font-mono text-xs text-ink">{p}</p>
                <p className="mt-1 text-xs text-ink-faint">{d}</p>
              </div>
            ))}
          </div>
        </div>
        <ArchArrow />
        <ArchBox title="Fixtures" sub="internal/assets · synthetic" items={ARCH_FIXTURE_ITEMS} />
      </div>
    </div>
  </section>
);

export default ArchitectureSection;
