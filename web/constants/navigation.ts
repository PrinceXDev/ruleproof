import { FlaskConical, History, ShieldCheck, Layers3, type LucideIcon } from 'lucide-react';

export type Section = 'checks' | 'history' | 'fixtures' | 'workbench';

export const STUDIO_SECTIONS: {
  id: Section;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: 'workbench', label: 'Workbench', icon: Layers3 },
  { id: 'checks', label: 'Checks', icon: ShieldCheck },
  { id: 'history', label: 'Run history', icon: History },
  { id: 'fixtures', label: 'Fixtures', icon: FlaskConical },
];

export const STUDIO_STEPS: { n: string; label: string }[] = [
  { n: '01', label: 'Explain' },
  { n: '02', label: 'Review' },
  { n: '03', label: 'Verify' },
];
