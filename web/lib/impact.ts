import type { Identity } from './workbench';

export interface ImpactOperation {
  operation: string;
  change: 'added' | 'changed' | 'removed' | 'unchanged';
  certainty: 'affected' | 'unaffected' | 'uncertain';
  reasons: string[];
  checkIds: string[];
  missing: string[];
  missingCount: number;
  exclusion?: string;
}
export interface ImpactCheck {
  id: string;
  identity: Identity;
  scope: string;
  scenario?: string;
  assertions: number;
  observesState: boolean;
  reasons: string[];
}
export interface ImpactReport {
  suiteHash: string;
  beforeSpecHash: string;
  afterSpecHash: string;
  requiresFullRun: boolean;
  operations: ImpactOperation[];
  recommended: ImpactCheck[];
  unchangedCheckIds: string[];
  orphanedCheckIds: string[];
  warnings: string[];
}
export const impactCounts = (report: ImpactReport) => ({
  affected: report.operations.filter((operation) => operation.certainty === 'affected').length,
  uncertain: report.operations.filter((operation) => operation.certainty === 'uncertain').length,
  unchanged: report.operations.filter((operation) => operation.certainty === 'unaffected').length,
});
