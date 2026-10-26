import clsx from "clsx";
import type { CheckResult, Plan, PlanCase, Run } from "@/lib/types";
import LabeledSection from "../ui/LabeledSection";
import DefinitionGrid from "../ui/DefinitionGrid";
import RequestBlock from "./RequestBlock";
import ResponseBody from "./ResponseBody";

const EvidenceBody = ({
  result,
  planCase,
  plan,
  run,
  revisionLabel,
}: {
  result: CheckResult;
  planCase: PlanCase;
  plan: Plan;
  run: Run | null;
  revisionLabel: string;
}) => {
  const { variant } = result;
  const passed = result.verdict === "pass";
  // HEAD leaks carry no body, so only claim leaked data when there is some.
  const isCrossTenantLeak = planCase.scope === "other" && result.verdict === "fail" && !!result.body;

  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm">
      {variant && (
        <p
          className={clsx(
            "rounded-md border px-3 py-2.5 text-ink",
            result.verdict === "fail" ? "border-fail/30 bg-fail/5" : "border-border bg-panel-elevated"
          )}
        >
          {result.verdict === "fail"
            ? "The approved request is denied, but this variant of it got through. "
            : "A variant of an approved, denied request. "}
          <span className="text-ink-muted">{variant.why}</span>
        </p>
      )}
      {isCrossTenantLeak && (
        <p className="rounded-md border border-fail/30 bg-fail/5 px-3 py-2.5 text-ink">
          The {planCase.role} belongs to tenant {planCase.assetOwner === "A" ? "B" : "A"}. This response contains an
          asset from tenant {planCase.assetOwner}.
        </p>
      )}

      <LabeledSection label="Requirement excerpt">
        <p className="text-ink-muted">“{plan.ruleText}”</p>
      </LabeledSection>

      <LabeledSection label="Revision & plan">
        <DefinitionGrid rows={[["Revision", revisionLabel], ["Plan", plan.id]]} />
      </LabeledSection>

      <LabeledSection label="Expected vs. actual">
        <div className="flex items-center gap-3 font-mono-tnum text-xs">
          <span className="rounded border border-border px-2 py-1 text-ink-muted">
            {variant ? "expected a refusal" : `expected ${result.expected_status}`}
          </span>
          <span className="text-ink-faint">→</span>
          <span className={clsx("rounded border px-2 py-1", passed ? "border-pass/30 text-pass" : "border-fail/30 text-fail")}>
            observed {result.actual_status ?? "no response"}
          </span>
        </div>
      </LabeledSection>

      <LabeledSection label="Request">
        <DefinitionGrid
          rows={[
            ["Method", result.method],
            ["Endpoint", result.path],
            ["Identity", `demo-${planCase.role}-a (tenant A)`],
            ["Asset tenant", `tenant ${planCase.assetOwner}`],
          ]}
        />
      </LabeledSection>

      <LabeledSection label="Request headers (redacted)">
        <RequestBlock result={result} showLine={false} />
      </LabeledSection>

      <LabeledSection label="Response body">
        <ResponseBody body={result.body} />
      </LabeledSection>

      <LabeledSection label="Assertion">
        <p className="text-xs text-ink-muted">{result.detail}</p>
      </LabeledSection>

      <LabeledSection label="Timing">
        <DefinitionGrid
          rows={[
            ["Observed", run ? new Date(run.createdAt).toLocaleTimeString() : "—"],
            ["Duration", `${result.duration_ms} ms`],
          ]}
        />
      </LabeledSection>

      <p className="text-[11px] leading-relaxed text-ink-faint">
        This reflects the approved scenarios for this plan only. It does not prove the whole application is secure.
      </p>
    </div>
  );
};

export default EvidenceBody;
