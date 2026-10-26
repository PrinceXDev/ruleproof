import clsx from "clsx";
import { CheckCircle2, DoorOpen, Search } from "lucide-react";
import type { CheckResult, Plan, Run } from "@/lib/types";
import { ACTION_LABEL, ROLE_LABEL, SCOPE_LABEL } from "@/constants/labels";
import { VariantBadge } from "../evidence/StatusBadges";
import HeldAttempts from "../evidence/HeldAttempts";

// Bypass attempts that got in (or were inconclusive) are listed in full; held
// ones fold away, since a healthy API refuses dozens of them.
const BypassSection = ({
  run,
  plan,
  bypassOn,
  onSelect,
  selectedId,
}: {
  run: Run;
  plan: Plan;
  bypassOn: boolean;
  onSelect: (id: string) => void;
  selectedId: string | null;
}) => {
  if (!run.bypass) {
    if (!bypassOn) return null;
    return (
      <p className="mt-4 text-sm text-ink-faint" data-verify-reveal>
        This run did not try bypass variants. Run again to include them.
      </p>
    );
  }
  const byId = new Map(plan.cases.map((c) => [c.id, c]));
  const open = [
    ...run.variants.filter((v) => v.verdict === "fail"),
    ...run.variants.filter((v) => v.verdict === "error"),
  ];
  const held = run.variants.filter((v) => v.verdict === "pass");
  const { leaked, inconclusive } = run.bypass;

  const row = (r: CheckResult) => {
    const c = byId.get(r.variant!.of);
    const headers = Object.entries(r.headers ?? {});
    return (
      <li
        key={r.id}
        className={clsx(
          "flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 text-sm",
          r.verdict === "fail" && "border-l-2 border-l-fail",
          selectedId === r.id && "bg-panel-elevated"
        )}
      >
        <VariantBadge verdict={r.verdict} />
        <div className="min-w-0 flex-1">
          <div className="text-ink">
            {r.variant!.label}
            {c && (
              <span className="text-ink-muted">
                {" "}· {ROLE_LABEL[c.role]} {ACTION_LABEL[c.action].toLowerCase()}, {SCOPE_LABEL[c.scope].toLowerCase()}
              </span>
            )}
          </div>
          <div className="mt-0.5 truncate font-mono-tnum text-xs text-ink-faint">
            {r.method} {r.path}
            {headers.map(([k, v]) => ` · ${k}: ${v}`).join("")}
            {r.actual_status ? ` → ${r.actual_status}` : ""}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSelect(r.id)}
          className={clsx(
            "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs",
            r.verdict === "fail"
              ? "border border-fail/30 bg-fail/5 font-medium text-fail hover:bg-fail/10"
              : "text-ink-faint hover:text-ink"
          )}
        >
          {r.verdict === "fail" && <Search size={12} />}
          {r.verdict === "fail" ? "Inspect" : "Details"}
        </button>
      </li>
    );
  };

  return (
    <section data-verify-reveal className="mt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-medium text-ink">
          <DoorOpen size={16} className={leaked > 0 ? "text-fail" : "text-brand"} /> Bypass attempts
        </h2>
        <span className="font-mono-tnum text-xs text-ink-faint">
          {run.variants.length} tried · {held.length} held · {leaked} leaked
          {inconclusive > 0 && ` · ${inconclusive} inconclusive`} · catalog {run.bypass.catalog}
        </span>
      </div>
      <p className="mt-1.5 text-sm text-ink-muted">
        Every check that expects a deny, sent again in shapes that often slip past an access check. A refusal (401,
        403, 404, 405) holds; any 2xx is a leak.
      </p>
      <div className="mt-3 overflow-hidden rounded-lg border border-border">
        {open.length > 0 ? (
          <ul className="divide-y divide-border bg-panel">{open.map(row)}</ul>
        ) : (
          <p className="flex items-center gap-2 bg-panel px-4 py-3 text-sm text-pass">
            <CheckCircle2 size={15} /> All {held.length} attempts were refused.
          </p>
        )}
        <HeldAttempts count={held.length}>{held.map(row)}</HeldAttempts>
      </div>
    </section>
  );
};

export default BypassSection;
