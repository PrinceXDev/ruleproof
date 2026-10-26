"use client";

import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import type { History, Plan } from "@/lib/types";

// The plan on screen plus its revision lineage and runs.
const usePlanHistory = () => {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [history, setHistory] = useState<History | null>(null);

  const refreshHistory = useCallback(async (rootId: string) => {
    try {
      const h = await api.history(rootId);
      setHistory(h);
      return h;
    } catch (e) {
      // Non-fatal: the current plan/run state is already correct without
      // history, so this only degrades the History panel and revision
      // label — but it should still be visible for debugging.
      console.error("failed to refresh history:", e);
      return null;
    }
  }, []);

  const revisionLabel =
    history && plan
      ? `Revision ${history.lineage.findIndex((p) => p.id === plan.id) + 1} of ${history.lineage.length}`
      : plan
        ? "Revision 1"
        : "No revision yet";

  return { plan, setPlan, history, setHistory, refreshHistory, revisionLabel };
};

export type PlanHistory = ReturnType<typeof usePlanHistory>;

export default usePlanHistory;
