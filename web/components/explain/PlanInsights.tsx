import { AlertTriangle, Eye } from "lucide-react";
import type { Concept } from "@/lib/types";
import PanelHeading from "./PanelHeading";

// What the generator understood from the rule, and what it could not decide.
const PlanInsights = ({
  concepts,
  assumptions,
}: {
  concepts: Concept[] | null;
  assumptions: string[] | null;
}) => (
  <div data-explain-reveal className="mt-8 space-y-4">
    {concepts && concepts.length > 0 && (
      <div>
        <PanelHeading className="mb-2 text-ink-faint">Extracted concepts</PanelHeading>
        <ul className="space-y-1.5">
          {concepts.map((c) => (
            <li
              key={c.label}
              className="flex items-start gap-2 rounded-md border border-border bg-panel px-3 py-2 text-sm"
            >
              <Eye size={14} className="mt-0.5 shrink-0 text-ink-faint" />
              <div>
                <span className="text-ink-muted">{c.label}:</span> <span className="text-ink">{c.value}</span>
                {c.snippet && (
                  <div className="mt-0.5 font-mono-tnum text-[11px] text-ink-faint">“{c.snippet}”</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    )}

    {assumptions && assumptions.length > 0 && (
      <div>
        <PanelHeading icon={<AlertTriangle size={13} />} className="mb-2 text-attn">
          Clarification needed
        </PanelHeading>
        <ul className="space-y-1.5">
          {assumptions.map((a) => (
            <li
              key={a}
              className="rounded-md border border-attn/30 bg-attn/5 px-3 py-2 text-sm text-ink"
            >
              {a}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

export default PlanInsights;
