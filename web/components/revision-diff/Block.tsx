import type { ReactNode } from "react";
import SectionLabel from "../ui/SectionLabel";

const Block = ({ title, children }: { title: string; children: ReactNode }) => (
  <div>
    <SectionLabel className="mb-2">{title}</SectionLabel>
    {children}
  </div>
);

export default Block;
