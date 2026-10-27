import { cn } from '@/lib/cn';
import ScopeCard from '@/components/landing/ScopeCard';
import SectionHeading from '@/components/landing/SectionHeading';
import { SCOPE_CARDS } from '@/constants/landing';
import { LANDING_WRAP } from '@/constants/landing-styles';

const ScopeSection = () => (
  <section className={cn(LANDING_WRAP, 'py-28 sm:py-36')}>
    <SectionHeading
      id="scope"
      kicker="Honest by design"
      title={<>Evidence you can inspect. Limits you can see.</>}
    />
    <div className="mt-14 grid gap-4 md:grid-cols-2" data-stagger>
      {SCOPE_CARDS.map((card) => (
        <ScopeCard
          key={card.title}
          title={card.title}
          items={card.items}
          icon={card.icon}
          tone={card.tone}
        />
      ))}
    </div>
  </section>
);

export default ScopeSection;
