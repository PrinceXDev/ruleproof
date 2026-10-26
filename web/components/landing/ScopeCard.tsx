import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { LANDING_CARD } from "@/constants/landing-styles";

const ScopeCard = ({
  title,
  icon: Icon,
  tone,
  items,
}: {
  title: string;
  icon: LucideIcon;
  tone: string;
  items: string[];
}) => (
  <div className={cn(LANDING_CARD, "p-7")}>
    <h3 className={cn("flex items-center gap-2 text-lg font-semibold", tone)}>
      <Icon size={18} /> {title}
    </h3>
    <ul className="mt-5 space-y-3 text-[15px] text-ink-muted">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  </div>
);

export default ScopeCard;
