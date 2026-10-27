import { AlertOctagon, CheckCircle2, DoorOpen, type LucideIcon } from 'lucide-react';
import type { Fixture } from '@/lib/types';

export const FIXTURES: Fixture[] = ['broken', 'partial', 'fixed'];

export const FIXTURE_LABEL: Record<Fixture, { long: string; short: string }> = {
  broken: { long: 'Seeded defect', short: 'Defect' },
  partial: { long: 'Partial fix', short: 'Partial' },
  fixed: { long: 'Corrected', short: 'Fixed' },
};

export const NO_RUNS: Record<Fixture, null> = { broken: null, partial: null, fixed: null };

export const FIXTURE_DETAILS: Record<
  Fixture,
  { icon: LucideIcon; tone: string; selected: string; text: string }
> = {
  broken: {
    icon: AlertOctagon,
    tone: 'text-fail',
    selected: 'border-fail/40 bg-fail/5',
    text: "The cross-tenant ownership check is skipped on reads and exports. A viewer or editor can read another tenant's asset even though the rule denies it. Updates still enforce tenant and role checks correctly.",
  },
  partial: {
    icon: DoorOpen,
    tone: 'text-attn',
    selected: 'border-attn/40 bg-attn/5',
    text: 'Looks fixed: every approved check passes. But HEAD requests skip the tenant check, and a client-sent X-Tenant-ID header is trusted. Only bypass variants catch it.',
  },
  fixed: {
    icon: CheckCircle2,
    tone: 'text-pass',
    selected: 'border-pass/40 bg-pass/5',
    text: 'The tenant ownership check runs on every request, for reads, updates and exports, and ignores client-sent tenant headers. An approved plan should pass in full, bypass variants included.',
  },
};
