import type { PlanCase } from "./types";
import { ACTION_LABEL, ROLE_LABEL } from "@/constants/labels";

type CaseLike = Pick<PlanCase, "role" | "action" | "method" | "assetId">;

// "Viewer · Read"
export const caseTitle = (c: CaseLike) => `${ROLE_LABEL[c.role]} · ${ACTION_LABEL[c.action]}`;

// "GET /assets/a-2/export" — export is its own sub-route of the asset.
export const casePath = (c: CaseLike) =>
  `${c.method} /assets/${c.assetId}${c.action === "export" ? "/export" : ""}`;
