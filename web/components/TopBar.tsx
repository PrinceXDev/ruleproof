import clsx from "clsx";
import { ChevronRight, Loader2, Menu } from "lucide-react";
import type { Fixture } from "@/lib/types";
import { FIXTURES, FIXTURE_LABEL } from "@/constants/fixtures";
import Stepper from "./Stepper";

const TopBar = ({
  revisionLabel,
  fixture,
  onFixtureChange,
  fixtureDisabled,
  primaryAction,
  stepperCurrent,
  stepperViewing,
  onStepNavigate,
  onOpenMobileNav,
}: {
  revisionLabel: string;
  fixture: Fixture;
  onFixtureChange: (f: Fixture) => void;
  fixtureDisabled: boolean;
  primaryAction: { label: string; onClick: () => void; disabled?: boolean; loading?: boolean } | null;
  stepperCurrent: 0 | 1 | 2;
  stepperViewing?: 0 | 1 | 2;
  onStepNavigate?: (i: 0 | 1 | 2) => void;
  onOpenMobileNav: () => void;
}) => (
  <header className="border-b border-border bg-canvas/80 px-4 py-3 backdrop-blur sm:px-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-1.5 text-sm text-ink-muted">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
          className="-ml-1 mr-1 rounded p-1 text-ink-muted hover:text-ink md:hidden"
        >
          <Menu size={18} />
        </button>
        <span className="truncate">Asset Workspace</span>
        <ChevronRight size={14} className="shrink-0 text-ink-faint" />
        <span className="text-ink">Tenant access</span>
        <span className="mx-2 h-3 w-px bg-border" aria-hidden />
        <span className="font-mono-tnum text-xs text-ink-faint">{revisionLabel}</span>
      </div>

      <div className="flex items-center gap-3">
        <div
          role="radiogroup"
          aria-label="Fixture"
          className={clsx(
            "flex items-center gap-0.5 rounded-md border border-border bg-panel p-0.5",
            fixtureDisabled && "opacity-50"
          )}
        >
          {FIXTURES.map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={fixture === f}
              disabled={fixtureDisabled}
              onClick={() => onFixtureChange(f)}
              className={clsx(
                "whitespace-nowrap rounded px-2 py-1 text-xs font-medium capitalize transition-colors sm:px-2.5",
                fixture === f ? "bg-panel-elevated text-ink" : "text-ink-muted hover:text-ink",
                !fixtureDisabled && "cursor-pointer"
              )}
            >
              <span className="sm:hidden">{FIXTURE_LABEL[f].short}</span>
              <span className="hidden sm:inline">{FIXTURE_LABEL[f].long}</span>
            </button>
          ))}
        </div>

        {primaryAction && (
          <button
            type="button"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled || primaryAction.loading}
            className="flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-1.5 text-sm font-medium text-brand-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {primaryAction.loading && <Loader2 size={14} className="animate-spin" />}
            {primaryAction.label}
          </button>
        )}
      </div>
    </div>

    <div className="mt-3">
      <Stepper current={stepperCurrent} viewing={stepperViewing} onNavigate={onStepNavigate} />
    </div>
  </header>
);

export default TopBar;
