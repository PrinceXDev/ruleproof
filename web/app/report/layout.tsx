import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Evidence report · RuleProof",
  description: "Read-only evidence for one RuleProof run: the approved plan, every check, and the captured responses.",
  robots: { index: false },
};

const ReportLayout = ({ children }: { children: ReactNode }) => children;

export default ReportLayout;
