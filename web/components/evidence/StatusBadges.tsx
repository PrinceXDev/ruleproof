import { Ban, CheckCircle2, Clock, DoorOpen, Loader2, XCircle } from "lucide-react";
import type { Verdict } from "@/lib/types";
import Badge from "../Badge";

export type RowState = "queued" | "running" | Verdict | "cancelled";

export const CheckBadge = ({ state }: { state: RowState }) => {
  switch (state) {
    case "queued":
      return (
        <Badge tone="neutral">
          <Clock size={11} /> Queued
        </Badge>
      );
    case "running":
      return (
        <Badge tone="neutral">
          <Loader2 size={11} className="animate-spin" /> Running
        </Badge>
      );
    case "pass":
      return (
        <Badge tone="pass">
          <CheckCircle2 size={11} /> Passed
        </Badge>
      );
    case "fail":
      return (
        <Badge tone="fail">
          <XCircle size={11} /> Failed
        </Badge>
      );
    case "error":
      return (
        <Badge tone="attn">
          <Ban size={11} /> Error
        </Badge>
      );
    case "cancelled":
      return <Badge tone="neutral">Cancelled</Badge>;
  }
};

// A bypass attempt holds on any refusal and leaks on any 2xx.
export const VariantBadge = ({ verdict }: { verdict: Verdict }) => {
  if (verdict === "pass")
    return (
      <Badge tone="pass">
        <CheckCircle2 size={11} /> Held
      </Badge>
    );
  if (verdict === "fail")
    return (
      <Badge tone="fail">
        <DoorOpen size={11} /> Leaked
      </Badge>
    );
  return (
    <Badge tone="attn">
      <Ban size={11} /> Inconclusive
    </Badge>
  );
};

export const ResultBadge = ({ verdict, isVariant }: { verdict: Verdict; isVariant: boolean }) =>
  isVariant ? <VariantBadge verdict={verdict} /> : <CheckBadge state={verdict} />;
