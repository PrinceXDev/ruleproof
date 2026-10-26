"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";

const faqs = [
  [
    "Does a green matrix mean my app is secure?",
    "No. It means the approved scenarios passed against that fixture. RuleProof is deliberately explicit about what was checked — and what wasn’t.",
  ],
  [
    "Is an AI model guessing my policy?",
    "No. A bounded, deterministic parser in Go reads a small known vocabulary (viewer/editor, read/update, own/other tenant) sentence by sentence. Anything outside it becomes an assumption a human must acknowledge.",
  ],
  [
    "What happens if I edit an expectation after approving?",
    "Plans are immutable. Any edit creates a new child revision in the same lineage, and the old approval does not carry over — you must approve again.",
  ],
  [
    "Can I point it at my own API?",
    "Not from the hosted studio — it only targets the two bundled fixtures, so the public demo can’t be used against arbitrary URLs. The ruleproof-ci command you run yourself can target your own API with -base-url and your own tokens.",
  ],
  [
    "How does it stay enforced after today?",
    "Export the approved plan and run ruleproof-ci on every push. It verifies the plan is approved and unmodified, re-runs every check, and fails the build on any mismatch — with GitHub annotations, a job summary and JUnit XML.",
  ],
  [
    "How is a 500 or a redirect treated?",
    "As a mismatch. Statuses are compared exactly, so a crash or redirect never silently counts as a ‘denial’.",
  ],
  [
    "Are credentials stored in the evidence?",
    "No. Demo tokens are public labels, request headers are redacted in the inspector, and only the synthetic response body is captured.",
  ],
  [
    "Where does Wispr Flow fit in?",
    "Rules are meant to be spoken. Dictate into the normal Explain textarea with Wispr Flow — no fake microphone UI — and the parser handles natural spoken phrasing.",
  ],
];

export default function Faq() {
  return (
    <Accordion.Root type="single" collapsible className="divide-y divide-white/[.07] border-y border-white/[.07]">
      {faqs.map(([q, a]) => (
        <Accordion.Item key={q} value={q}>
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-center justify-between gap-6 py-5 text-left text-[15px] font-medium text-ink transition-colors hover:text-brand sm:text-base">
              {q}
              <Plus
                size={18}
                className="shrink-0 text-ink-faint transition-transform duration-300 group-data-[state=open]:rotate-45 group-data-[state=open]:text-brand"
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <p className="max-w-2xl pb-5 text-sm leading-relaxed text-ink-muted">{a}</p>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
