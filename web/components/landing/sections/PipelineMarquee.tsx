import { ArrowRight } from "lucide-react";
import { PIPELINE } from "@/constants/landing";

const PipelineMarquee = () => (
  <div className="relative border-y border-white/[.07] bg-[#0d0f0e] py-5 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
    <div className="flex w-max animate-marquee gap-10 motion-reduce:animate-none">
      {[...PIPELINE, ...PIPELINE].map((p, i) => (
        <span key={i} className="flex items-center gap-10 font-mono text-xs uppercase tracking-[.16em] text-ink-faint">
          {p}
          <ArrowRight size={13} className="text-brand/70" />
        </span>
      ))}
    </div>
  </div>
);

export default PipelineMarquee;
