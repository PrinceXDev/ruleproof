import clsx from "clsx";
import { Search } from "lucide-react";
import type { Plan, Run } from "@/lib/types";
import { ACTION_LABEL, ROLE_LABEL, SCOPE_LABEL } from "@/constants/labels";
import { CheckBadge, type RowState } from "../evidence/StatusBadges";

const expectedText = (label: string) => (label === "allow" ? "Allow" : "Deny");

const ResultsTable = ({
  plan,
  run,
  stateFor,
  onSelectResult,
  selectedId,
}: {
  plan: Plan;
  run: Run | null;
  stateFor: (caseId: string) => RowState;
  onSelectResult: (caseId: string) => void;
  selectedId: string | null;
}) => {
  const resultFor = (caseId: string) => run?.results.find((r) => r.id === caseId);

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-border">
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b border-border bg-panel text-left text-xs uppercase tracking-wider text-ink-faint">
            <th className="px-4 py-2.5 font-medium">Role</th>
            <th className="px-4 py-2.5 font-medium">Action</th>
            <th className="px-4 py-2.5 font-medium">Scope</th>
            <th className="px-4 py-2.5 font-medium">Expected</th>
            <th className="px-4 py-2.5 font-medium">Result</th>
            <th className="w-28 px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {plan.cases.map((c) => {
            const state = stateFor(c.id);
            const result = resultFor(c.id);
            return (
              <tr
                key={c.id}
                data-result-row={c.id}
                className={clsx(
                  "border-b border-border last:border-0",
                  state === "fail" && "border-l-2 border-l-fail",
                  selectedId === c.id && "bg-panel-elevated"
                )}
              >
                <td className="px-4 py-2.5 text-ink">{ROLE_LABEL[c.role]}</td>
                <td className="px-4 py-2.5 text-ink-muted">{ACTION_LABEL[c.action]}</td>
                <td className="px-4 py-2.5 text-ink-muted">{SCOPE_LABEL[c.scope]}</td>
                <td className="px-4 py-2.5 text-ink-muted">{expectedText(c.expectedLabel)}</td>
                <td className="px-4 py-2.5">
                  <CheckBadge state={state} />
                </td>
                <td className="px-4 py-2.5 text-right">
                  {result && state === "fail" && (
                    <button
                      type="button"
                      onClick={() => onSelectResult(c.id)}
                      className="flex items-center gap-1 rounded-md border border-fail/30 bg-fail/5 px-2.5 py-1 text-xs font-medium text-fail hover:bg-fail/10"
                    >
                      <Search size={12} />
                      Inspect
                    </button>
                  )}
                  {result && state !== "fail" && (
                    <button type="button" onClick={() => onSelectResult(c.id)} className="text-xs text-ink-faint hover:text-ink">
                      Details
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ul className="divide-y divide-border md:hidden">
        {plan.cases.map((c) => {
          const state = stateFor(c.id);
          return (
            <li
              key={c.id}
              className={clsx("space-y-1.5 bg-panel px-4 py-3 text-sm", state === "fail" && "border-l-2 border-l-fail")}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink">
                  {ROLE_LABEL[c.role]} · {ACTION_LABEL[c.action]}
                </span>
                <CheckBadge state={state} />
              </div>
              <div className="text-ink-muted">
                {SCOPE_LABEL[c.scope]} · expected {expectedText(c.expectedLabel)}
              </div>
              {resultFor(c.id) && (
                <button
                  type="button"
                  onClick={() => onSelectResult(c.id)}
                  className="text-xs font-medium text-brand underline-offset-2 hover:underline"
                >
                  {state === "fail" ? "Inspect evidence" : "View details"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ResultsTable;
