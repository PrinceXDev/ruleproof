import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

// Uppercase h2 for the Explain side panels, optionally led by an icon.
const PanelHeading = ({
  icon,
  className,
  children,
}: {
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) => (
  <h2
    className={cn(
      'text-xs font-medium uppercase tracking-wider',
      Boolean(icon) && 'flex items-center gap-1.5',
      className,
    )}
  >
    {icon}
    {children}
  </h2>
);

export default PanelHeading;
