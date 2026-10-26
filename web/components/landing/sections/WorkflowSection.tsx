import SectionHeading from "@/components/landing/SectionHeading";
import StepCard from "@/components/landing/StepCard";
import { WORKFLOW_STEPS } from "@/constants/landing";
import { LANDING_BAND, LANDING_WRAP } from "@/constants/landing-styles";

const WorkflowSection = () => (
  <section className={LANDING_BAND}>
    <div className={LANDING_WRAP}>
      <SectionHeading
        id="workflow"
        kicker="How it works"
        title={<>Four steps. No silent leaps.</>}
      >
        You write the rule. You approve the checks. Every stage makes the
        next decision visible — nothing jumps from a sentence straight to
        a verdict.
      </SectionHeading>

      <div className="relative mt-16 grid gap-4 lg:pl-16" data-rail>
        <div aria-hidden className="absolute bottom-6 left-6 top-6 hidden w-px bg-white/10 lg:block">
          <div data-rail-fill className="h-full w-full origin-top bg-[linear-gradient(#d5f879,#78dcaa)]" />
        </div>
        {WORKFLOW_STEPS.map((step) => (
          <StepCard key={step.n} {...step} />
        ))}
      </div>
    </div>
  </section>
);

export default WorkflowSection;
