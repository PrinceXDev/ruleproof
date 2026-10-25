import { AlertOctagon, CheckCircle2 } from "lucide-react";
import type { Fixture } from "@/lib/types";
import clsx from "clsx";

export default function FixturesPanel({
  fixture,
  onSelect,
}: {
  fixture: Fixture;
  onSelect: (f: Fixture) => void;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-xl font-semibold tracking-tight text-ink">Fixtures</h1>
      <p className="mt-1 text-sm text-ink-muted">
        A synthetic asset API with two versions, so the same approved plan can run against either one.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelect("broken")}
          className={clsx(
            "rounded-lg border p-4 text-left transition-colors",
            fixture === "broken" ? "border-fail/40 bg-fail/5" : "border-border bg-panel hover:border-ink-faint"
          )}
        >
          <div className="flex items-center gap-2 text-fail">
            <AlertOctagon size={16} />
            <span className="text-sm font-medium">Seeded defect</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink-muted">
            The cross-tenant ownership check is skipped on reads only. A viewer or editor can read another
            tenant&apos;s asset even though the rule denies it. Updates still enforce tenant and role checks
            correctly.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onSelect("fixed")}
          className={clsx(
            "rounded-lg border p-4 text-left transition-colors",
            fixture === "fixed" ? "border-pass/40 bg-pass/5" : "border-border bg-panel hover:border-ink-faint"
          )}
        >
          <div className="flex items-center gap-2 text-pass">
            <CheckCircle2 size={16} />
            <span className="text-sm font-medium">Corrected</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink-muted">
            The tenant ownership check runs on every request, for both reads and updates. An approved plan that
            denies cross-tenant access should pass in full against this version.
          </p>
        </button>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-ink-faint">
        Both fixtures are synthetic, started locally for this demo. RuleProof never executes checks against an
        arbitrary user-supplied target. A passing run means the approved scenarios passed against this fixture —
        it does not prove the whole application is secure.
      </p>
    </div>
  );
}
