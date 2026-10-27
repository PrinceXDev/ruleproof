import { cn } from '@/lib/cn';
import Feature from '@/components/landing/Feature';
import { FEATURE_VISUALS } from '@/components/landing/FeatureVisuals';
import SectionHeading from '@/components/landing/SectionHeading';
import { FEATURES } from '@/constants/landing-features';
import { LANDING_WRAP } from '@/constants/landing-styles';

const FeaturesSection = () => (
  <section className={cn(LANDING_WRAP, 'py-28 sm:py-36')}>
    <SectionHeading
      id="features"
      kicker="What’s inside"
      title={<>Built for evidence, not vibes.</>}
    >
      Every design decision pushes the same way: make the claim checkable, make the limits visible,
      and never let an approval outlive the thing it approved.
    </SectionHeading>

    <div className="mt-16 grid gap-4 md:grid-cols-6" data-stagger>
      {FEATURES.map(({ visual, ...feature }) => (
        <Feature
          key={feature.title}
          title={feature.title}
          body={feature.body}
          icon={feature.icon}
          className={feature.className}
        >
          {visual && FEATURE_VISUALS[visual]}
        </Feature>
      ))}
    </div>
  </section>
);

export default FeaturesSection;
