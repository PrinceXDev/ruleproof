import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { LANDING_CARD } from "@/constants/landing-styles";

const Feature = ({
  icon: Icon,
  title,
  body,
  className,
  children,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  className?: string;
  children?: ReactNode;
}) => (
  <article
    className={cn(
      LANDING_CARD,
      "group relative overflow-hidden p-6 transition-colors duration-300 hover:border-white/15 sm:p-7",
      className,
    )}
  >
    <div
      aria-hidden
      className="absolute -right-16 -top-16 size-40 rounded-full bg-brand/0 blur-3xl transition-colors duration-500 group-hover:bg-brand/10"
    />
    <span className="grid size-10 place-items-center rounded-lg border border-white/10 bg-black/30 text-brand">
      <Icon size={18} />
    </span>
    <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
    <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
    {children}
  </article>
);

export default Feature;
