import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import Faq from '@/components/landing/Faq';
import Kicker from '@/components/landing/Kicker';
import Quickstart from '@/components/landing/Quickstart';
import { LANDING_BAND, LANDING_WRAP } from '@/constants/landing-styles';

const Column = ({
  id,
  kicker,
  title,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  children: ReactNode;
}) => (
  <div id={id} className="scroll-mt-24" data-reveal>
    <Kicker>{kicker}</Kicker>
    <h2 className="mb-8 mt-5 text-4xl font-semibold tracking-[-0.035em]">{title}</h2>
    {children}
  </div>
);

const QuickstartFaqSection = () => (
  <section className={LANDING_BAND}>
    <div className={cn(LANDING_WRAP, 'grid gap-16 lg:grid-cols-2')}>
      <Column id="start" kicker="Quickstart" title="Running in a minute.">
        <Quickstart />
      </Column>
      <Column id="faq" kicker="FAQ" title="Fair questions.">
        <Faq />
      </Column>
    </div>
  </section>
);

export default QuickstartFaqSection;
