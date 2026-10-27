import type { ReactNode } from 'react';
import { DEMO_EYEBROW } from '@/constants/landing-styles';

const StageHeading = ({ eyebrow, title }: { eyebrow: string; title: ReactNode }) => (
  <>
    <p className={DEMO_EYEBROW}>{eyebrow}</p>
    <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h3>
  </>
);

export default StageHeading;
