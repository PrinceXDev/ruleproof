"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import { FAQS } from "@/constants/landing-faq";

const Faq = () => (
  <Accordion.Root type="single" collapsible className="divide-y divide-white/[.07] border-y border-white/[.07]">
    {FAQS.map(([q, a]) => (
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

export default Faq;
