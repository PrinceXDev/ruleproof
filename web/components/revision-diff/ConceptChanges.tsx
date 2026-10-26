import { Minus, Plus } from "lucide-react";
import type { Concept } from "@/lib/types";

const ConceptChanges = ({ added, removed }: { added: Concept[]; removed: Concept[] }) => (
  <div className="flex flex-wrap gap-1.5">
    {added.map((c) => (
      <span
        key={`+${c.label}${c.value}`}
        className="inline-flex items-center gap-1 rounded-md border border-pass/30 bg-pass/10 px-2 py-0.5 text-xs text-pass"
      >
        <Plus size={11} /> {c.label}: {c.value}
      </span>
    ))}
    {removed.map((c) => (
      <span
        key={`-${c.label}${c.value}`}
        className="inline-flex items-center gap-1 rounded-md border border-fail/30 bg-fail/10 px-2 py-0.5 text-xs text-fail/90 line-through"
      >
        <Minus size={11} /> {c.label}: {c.value}
      </span>
    ))}
  </div>
);

export default ConceptChanges;
