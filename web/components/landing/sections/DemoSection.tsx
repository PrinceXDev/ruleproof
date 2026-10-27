import { cn } from '@/lib/cn';
import ProductDemo from '@/components/landing/ProductDemo';
import SectionHeading from '@/components/landing/SectionHeading';
import { LANDING_WRAP } from '@/constants/landing-styles';

const DemoSection = () => (
  <section className={cn(LANDING_WRAP, 'py-28 sm:py-36')}>
    <SectionHeading
      id="demo"
      kicker="Try it here"
      title={<>One rule. Eight checks. Now show me the response.</>}
    >
      Walk the full loop without leaving this page: generate the plan, approve it, run it against
      both fixtures, and trace a failure back to the sentence it violates.
    </SectionHeading>
    <div className="mt-14" data-reveal>
      <ProductDemo />
    </div>
  </section>
);

export default DemoSection;
