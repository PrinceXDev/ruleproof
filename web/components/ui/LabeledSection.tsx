import type { ReactNode } from "react";
import SectionLabel from "./SectionLabel";

const LabeledSection = ({ label, children, className }: { label: string; children: ReactNode; className?: string }) => (
  <div className={className}>
    <SectionLabel>{label}</SectionLabel>
    {children}
  </div>
);

export default LabeledSection;
