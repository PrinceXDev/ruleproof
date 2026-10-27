'use client';

import * as Tabs from '@radix-ui/react-tabs';
import { QUICKSTART_TABS } from '@/constants/landing-faq';
import CopyButton from './CopyButton';

const Quickstart = () => (
  <Tabs.Root
    defaultValue="dev"
    className="overflow-hidden rounded-2xl border border-white/10 bg-[#121513]"
  >
    <Tabs.List
      aria-label="Ways to run RuleProof"
      className="flex overflow-x-auto border-b border-white/[.07] px-2"
    >
      {QUICKSTART_TABS.map((t) => (
        <Tabs.Trigger
          key={t.id}
          value={t.id}
          className="relative shrink-0 px-4 py-3.5 text-[13px] text-ink-muted transition-colors hover:text-ink data-[state=active]:text-ink data-[state=active]:after:absolute data-[state=active]:after:inset-x-3 data-[state=active]:after:bottom-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-brand"
        >
          {t.label}
        </Tabs.Trigger>
      ))}
    </Tabs.List>
    {QUICKSTART_TABS.map((t) => (
      <Tabs.Content key={t.id} value={t.id} className="p-5 outline-none">
        <p className="text-sm text-ink-muted">{t.note}</p>
        <div className="mt-4 space-y-2">
          {t.lines.map((line) => (
            <div
              key={line}
              className="flex items-center gap-3 rounded-lg border border-white/[.06] bg-black/40 py-1 pl-4 pr-1 font-mono text-[13px]"
            >
              <span className="select-none text-brand">$</span>
              <code className="flex-1 overflow-x-auto whitespace-nowrap py-2 text-ink">{line}</code>
              <CopyButton text={line.replace(/\s+#.*$/, '')} />
            </div>
          ))}
        </div>
      </Tabs.Content>
    ))}
  </Tabs.Root>
);

export default Quickstart;
