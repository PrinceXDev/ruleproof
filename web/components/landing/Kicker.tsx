import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { LANDING_EYEBROW } from '@/constants/landing-styles';

// Eyebrow label; defaults to the short brand rule as its leading marker.
const Kicker = ({
  marker = <span className="h-px w-6 bg-brand" />,
  className,
  children,
}: {
  marker?: ReactNode;
  className?: string;
  children: ReactNode;
}) => (
  <p className={cn(LANDING_EYEBROW, 'flex items-center gap-2', className)}>
    {marker} {children}
  </p>
);

export default Kicker;
