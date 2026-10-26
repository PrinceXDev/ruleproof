"use client";

import * as Tabs from "@radix-ui/react-tabs";
import CopyButton from "./CopyButton";

const tabs = [
  {
    id: "dev",
    label: "Local dev",
    note: "Two terminals: the Go API with both fixtures, and the Next.js UI with hot reload.",
    lines: ["go run ./cmd/server", "cd web && npm install && npm run dev"],
  },
  {
    id: "single",
    label: "Single process",
    note: "Static export served by the Go server — UI and API on one origin.",
    lines: ["cd web && npm run build && cd ..", "go run ./cmd/server   # http://localhost:8080"],
  },
  {
    id: "docker",
    label: "Docker",
    note: "One container: API, fixtures and UI. Listens on $PORT when set.",
    lines: ["docker build -t ruleproof .", "docker run -p 8080:8080 ruleproof"],
  },
  {
    id: "ci",
    label: "CI gate",
    note: "Export an approved plan from the studio, commit it, and fail the build on any mismatch. Exit 0 pass · 1 mismatch · 2 invalid plan.",
    lines: [
      "go run ./cmd/ruleproof-ci -bundle examples/tenant-isolation.bundle.json -fixture fixed",
      "go run ./cmd/ruleproof-ci -bundle plan.json -base-url https://staging.example.com -token viewer=$VIEWER_TOKEN",
    ],
  },
  {
    id: "postgres",
    label: "Postgres",
    note: "SQLite by default. Point DATABASE_URL at Postgres to keep data — the same SQL runs on both.",
    lines: ["DATABASE_URL=postgres://user:pass@localhost:5432/ruleproof go run ./cmd/server"],
  },
];

export default function Quickstart() {
  return (
    <Tabs.Root defaultValue="dev" className="overflow-hidden rounded-2xl border border-white/10 bg-[#121513]">
      <Tabs.List aria-label="Ways to run RuleProof" className="flex overflow-x-auto border-b border-white/[.07] px-2">
        {tabs.map((t) => (
          <Tabs.Trigger
            key={t.id}
            value={t.id}
            className="relative shrink-0 px-4 py-3.5 text-[13px] text-ink-muted transition-colors hover:text-ink data-[state=active]:text-ink data-[state=active]:after:absolute data-[state=active]:after:inset-x-3 data-[state=active]:after:bottom-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-brand"
          >
            {t.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {tabs.map((t) => (
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
                <CopyButton text={line.replace(/\s+#.*$/, "")} />
              </div>
            ))}
          </div>
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
