"use client";

import clsx from "clsx";
import { FlaskConical, History as HistoryIcon, ShieldCheck, X } from "lucide-react";

export type Section = "checks" | "history" | "fixtures";

const items: { id: Section; label: string; icon: typeof ShieldCheck }[] = [
  { id: "checks", label: "Checks", icon: ShieldCheck },
  { id: "history", label: "Run history", icon: HistoryIcon },
  { id: "fixtures", label: "Fixtures", icon: FlaskConical },
];

export default function Sidebar({
  section,
  onSelect,
  driver,
  mobileOpen,
  onMobileClose,
}: {
  section: Section;
  onSelect: (s: Section) => void;
  driver?: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onMobileClose} aria-hidden />
      )}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex h-full w-56 shrink-0 flex-col justify-between border-r border-border bg-sidebar px-3 py-4 transition-transform duration-200",
          "md:static md:z-auto md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div>
          <div className="flex items-center justify-between px-2 pb-6">
            <div className="flex items-center gap-2">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
                <rect x="1" y="1" width="20" height="20" rx="6" stroke="#D5F879" strokeWidth="1.6" />
                <path
                  d="M7 11.2l2.6 2.6L15.4 8"
                  stroke="#D5F879"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[13px] font-semibold tracking-tight text-ink">RuleProof</span>
            </div>
            <button
              type="button"
              onClick={onMobileClose}
              aria-label="Close navigation"
              className="rounded p-1 text-ink-faint hover:text-ink md:hidden"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mb-4 px-2">
            <div className="text-[10px] font-medium uppercase tracking-wider text-ink-faint">Project</div>
            <div className="mt-1 truncate text-sm text-ink-muted">Asset Workspace</div>
          </div>

          <nav className="flex flex-col gap-0.5" aria-label="Sections">
            {items.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onSelect(id);
                  onMobileClose();
                }}
                aria-current={section === id ? "page" : undefined}
                className={clsx(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                  section === id
                    ? "bg-panel-elevated text-ink"
                    : "text-ink-muted hover:bg-panel-elevated/60 hover:text-ink"
                )}
              >
                <Icon size={16} strokeWidth={1.8} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="rounded-md border border-border bg-panel px-2.5 py-2 text-[11px] text-ink-faint">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-attn" aria-hidden />
            Sample environment
          </div>
          <div className="mt-0.5">Synthetic fixtures · {driver ?? "…"}</div>
        </div>
      </aside>
    </>
  );
}
