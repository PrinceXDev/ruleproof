import { AlertTriangle, Minus } from "lucide-react";

const AssumptionChanges = ({ added, removed }: { added: string[]; removed: string[] }) => (
  <ul className="space-y-1.5 text-sm">
    {added.map((a) => (
      <li key={a} className="flex gap-2 rounded-lg border border-attn/30 bg-attn/5 px-3 py-2 text-ink">
        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-attn" />
        <span>
          <span className="mr-1.5 text-xs text-attn">New</span>
          {a}
        </span>
      </li>
    ))}
    {removed.map((a) => (
      <li key={a} className="flex gap-2 rounded-lg border border-border px-3 py-2 text-ink-faint">
        <Minus size={14} className="mt-0.5 shrink-0" />
        <span>
          <span className="mr-1.5 text-xs">Resolved</span>
          <span className="line-through">{a}</span>
        </span>
      </li>
    ))}
  </ul>
);

export default AssumptionChanges;
