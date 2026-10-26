"use client";

import type { PlanCase } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { ACTION_LABEL, ROLE_LABEL, SCOPE_LABEL } from "@/constants/labels";

const EditSelect = ({
  c,
  onEdit,
  disabled,
}: {
  c: PlanCase;
  onEdit: (id: string, want: number) => void;
  disabled?: boolean;
}) => (
  <div className="flex items-center gap-2 text-xs text-ink-muted">
    Expected
    <Select
      value={String(c.expectedStatus)}
      onValueChange={(value) => onEdit(c.id, Number(value))}
      disabled={disabled}
    >
      <SelectTrigger
        aria-label={`Expected outcome for ${ROLE_LABEL[c.role]} ${ACTION_LABEL[c.action]} ${SCOPE_LABEL[c.scope]}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="200">Allow</SelectItem>
        <SelectItem value="403">Deny</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

export default EditSelect;
