import { cn } from "@/lib/cn";
import ColumnIntro from "@/components/landing/ColumnIntro";
import { API_ENDPOINTS, METHOD_COLOR } from "@/constants/landing";
import { LANDING_CARD, LANDING_WRAP } from "@/constants/landing-styles";

const ApiSection = () => (
  <section className={cn(LANDING_WRAP, "grid gap-14 py-28 sm:py-36 lg:grid-cols-[1fr_1.3fr]")}>
    <div id="api" className="scroll-mt-24" data-reveal>
      <ColumnIntro kicker="API" title="Every click is an endpoint." bodyWidth="max-w-md">
        The studio is a thin client. Script the same explain → approve →
        run → export flow from CI, a notebook or curl.
      </ColumnIntro>
      <pre className="mt-8 overflow-x-auto rounded-xl border border-white/[.07] bg-black/40 p-5 font-mono text-[12.5px] leading-relaxed text-ink-muted">
        <span className="text-brand">curl</span> -X POST localhost:8080/api/plans \{"\n"}
        {"  "}-d <span className="text-attn">{`'{"text":"Viewers can read assets in their own tenant."}'`}</span>
      </pre>
    </div>
    <div className={cn(LANDING_CARD, "divide-y divide-white/[.05] overflow-hidden")} data-reveal>
      {API_ENDPOINTS.map(([m, path, desc]) => (
        <div key={m + path} className="grid grid-cols-[64px_1fr] items-baseline gap-x-4 gap-y-1 px-5 py-3.5 sm:grid-cols-[64px_1fr_1fr]">
          <span className={cn("font-mono text-[11px] font-semibold", METHOD_COLOR[m])}>{m}</span>
          <code className="font-mono text-[13px] text-ink">{path}</code>
          <span className="col-start-2 text-xs text-ink-faint sm:col-start-auto sm:text-right">{desc}</span>
        </div>
      ))}
    </div>
  </section>
);

export default ApiSection;
