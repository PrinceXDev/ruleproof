import { AlertOctagon, CheckCircle2, DoorOpen, type LucideIcon } from "lucide-react";
import type { Fixture } from "@/lib/types";
import { FIXTURES, FIXTURE_LABEL } from "@/lib/fixtures";
import clsx from "clsx";

const DETAILS: Record<Fixture, { icon: LucideIcon; tone: string; selected: string; text: string }> = {
  broken: {
    icon: AlertOctagon,
    tone: "text-fail",
    selected: "border-fail/40 bg-fail/5",
    text: "The cross-tenant ownership check is skipped on reads and exports. A viewer or editor can read another tenant's asset even though the rule denies it. Updates still enforce tenant and role checks correctly.",
  },
  partial: {
    icon: DoorOpen,
    tone: "text-attn",
    selected: "border-attn/40 bg-attn/5",
    text: "Looks fixed: every approved check passes. But HEAD requests skip the tenant check, and a client-sent X-Tenant-ID header is trusted. Only bypass variants catch it.",
  },
  fixed: {
    icon: CheckCircle2,
    tone: "text-pass",
    selected: "border-pass/40 bg-pass/5",
    text: "The tenant ownership check runs on every request, for reads, updates and exports, and ignores client-sent tenant headers. An approved plan should pass in full, bypass variants included.",
  },
};

export default function FixturesPanel({
  fixture,
  onSelect,
}: {
  fixture: Fixture;
  onSelect: (f: Fixture) => void;
}) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-xl font-semibold tracking-tight text-ink">Fixtures</h1>
      <p className="mt-1 text-sm text-ink-muted">
        A synthetic asset API with three versions, so the same approved plan can run against any of them.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {FIXTURES.map((f) => {
          const d = DETAILS[f];
          const Icon = d.icon;
          return (
            <button
              key={f}
              type="button"
              onClick={() => onSelect(f)}
              className={clsx(
                "rounded-lg border p-4 text-left transition-colors",
                fixture === f ? d.selected : "border-border bg-panel hover:border-ink-faint"
              )}
            >
              <div className={clsx("flex items-center gap-2", d.tone)}>
                <Icon size={16} />
                <span className="text-sm font-medium">{FIXTURE_LABEL[f].long}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink-muted">{d.text}</p>
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-ink-faint">
        All fixtures are synthetic, started locally for this demo. RuleProof never executes checks against an
        arbitrary user-supplied target. A passing run means the approved scenarios passed against this fixture —
        it does not prove the whole application is secure.
      </p>
    </div>
  );
}
