import { TerminalSquare } from "lucide-react";
import type { Plan } from "@/lib/types";
import CopyButton from "../landing/CopyButton";

// Points from a one-off run to keeping the rule enforced: the exported
// bundle is exactly what cmd/ruleproof-ci verifies and re-runs.
const CiHint = ({ plan, bypass }: { plan: Plan; bypass: boolean }) => {
  const flags = bypass ? "-fixture fixed -bypass" : "-fixture fixed";
  const commands = [
    `go run ./cmd/ruleproof-ci -bundle ruleproof-plan-${plan.id}.json ${flags}`,
    `go run ./cmd/ruleproof-ci -server http://localhost:8080 -plan ${plan.id} ${flags}`,
  ];
  return (
    <section data-verify-reveal className="mt-8 rounded-xl border border-border bg-panel p-5">
      <h2 className="flex items-center gap-2 text-sm font-medium text-ink">
        <TerminalSquare size={16} className="text-brand" /> Keep this rule enforced in CI
      </h2>
      <p className="mt-1.5 text-sm text-ink-muted">
        Export this approved plan and run it on every push. The build fails on any mismatch, and the CLI refuses
        plans that are unapproved or were edited after approval.
      </p>
      <div className="mt-4 space-y-2">
        {commands.map((cmd) => (
          <div
            key={cmd}
            className="flex items-center gap-3 rounded-lg border border-border bg-canvas py-1 pl-3.5 pr-1 font-mono text-xs"
          >
            <span className="select-none text-brand">$</span>
            <code className="flex-1 overflow-x-auto whitespace-nowrap py-2 text-ink">{cmd}</code>
            <CopyButton text={cmd} />
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Exit code 0 = all checks passed · 1 = mismatch · 2 = invalid or unapproved plan. Writes GitHub annotations,
        a job summary, and JUnit XML with <code className="font-mono">-junit</code>.
      </p>
    </section>
  );
};

export default CiHint;
