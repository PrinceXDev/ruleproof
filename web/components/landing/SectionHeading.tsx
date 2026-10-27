import type { ReactNode } from 'react';
import Kicker from './Kicker';

const SectionHeading = ({
  id,
  kicker,
  title,
  children,
}: {
  id?: string;
  kicker: string;
  title: ReactNode;
  children?: ReactNode;
}) => (
  <div
    id={id}
    className="grid scroll-mt-24 gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end"
    data-reveal
  >
    <div>
      <Kicker>{kicker}</Kicker>
      <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-ink sm:text-5xl lg:text-[56px]">
        {title}
      </h2>
    </div>
    {children && (
      <p className="max-w-md text-pretty text-[15px] leading-relaxed text-ink-muted lg:justify-self-end">
        {children}
      </p>
    )}
  </div>
);

export default SectionHeading;
