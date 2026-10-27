import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { buttonVariants } from '@/components/ui/button';
import { LANDING_EYEBROW, LANDING_WRAP } from '@/constants/landing-styles';

const FinalCtaSection = () => (
  <section className={cn(LANDING_WRAP, 'py-28 sm:py-36')}>
    <div
      className="relative isolate overflow-hidden rounded-3xl border border-brand/20 px-6 py-20 text-center sm:px-12 sm:py-28"
      data-reveal
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(70%_90%_at_50%_0%,rgba(213,248,121,.18),transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,#000,transparent_75%)]"
      />
      <p className={LANDING_EYEBROW}>Make the rule testable</p>
      <h2 className="mx-auto mt-6 max-w-3xl text-balance text-5xl font-semibold leading-[1] tracking-[-0.045em] sm:text-7xl">
        Don’t stop at “it should.” See what it does.
      </h2>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/studio/" className={buttonVariants({ size: 'lg' })}>
          Open the Evidence Studio <ArrowUpRight size={18} />
        </Link>
        <a href="#start" className={buttonVariants({ variant: 'secondary', size: 'lg' })}>
          Run it locally
        </a>
      </div>
    </div>
  </section>
);

export default FinalCtaSection;
