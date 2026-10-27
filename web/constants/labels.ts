import type { ActionKind, ExpectedLabel, PlanKind, Role, Scope } from '@/lib/types';

export const ROLE_LABEL: Record<Role, string> = { viewer: 'Viewer', editor: 'Editor' };

export const ACTION_LABEL: Record<ActionKind, string> = {
  read: 'Read',
  update: 'Update',
  export: 'Export',
};

export const SCOPE_LABEL: Record<Scope, string> = { own: 'Own tenant', other: 'Other tenant' };

export const KIND_LABEL: Record<PlanKind, string> = {
  root: 'Original',
  revision: 'Revised wording',
  edit: 'Edited expectation',
};

export const OUTCOME_LABEL: Record<ExpectedLabel, string> = {
  allow: 'Allow',
  deny: 'Deny',
  unauthenticated: 'Unauthenticated',
  'not found': 'Not found',
  unexpected: 'Unexpected',
};
