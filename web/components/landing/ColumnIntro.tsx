import type { ReactNode } from 'react';
import { SECTION_TITLE } from '@/constants/landing-styles';
import Kicker from './Kicker';

// Kicker + heading + lead paragraph for the two-column sections.
const ColumnIntro = ({
  kicker,
  title,
  bodyWidth = 'max-w-lg',
  children,
}: {
  kicker: string;
  title: string;
  bodyWidth?: 'max-w-lg' | 'max-w-md';
  children: ReactNode;
}) => (
  <>
    <Kicker>{kicker}</Kicker>
    <h2 className={SECTION_TITLE}>{title}</h2>
    <p className={`mt-6 ${bodyWidth} text-[15px] leading-relaxed text-ink-muted`}>{children}</p>
  </>
);

export default ColumnIntro;
