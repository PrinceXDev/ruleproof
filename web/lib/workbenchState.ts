import type { AuditEvent, Revision, Suite } from './workbench';

export interface SuiteState {
  editorVersion: number;
  suite: Suite | null;
  baseline: Suite | null;
  revision: Revision | null;
  revisions: Revision[];
  events: AuditEvent[];
  loading: boolean;
  error: string;
}

export type SuiteAction =
  | {
      type: 'loaded';
      suite: Suite;
      revision: Revision | null;
      revisions: Revision[];
      events: AuditEvent[];
    }
  | { type: 'failed'; message: string }
  | { type: 'changed'; suite: Suite }
  | { type: 'discarded' }
  | { type: 'refreshed'; revisions: Revision[]; events: AuditEvent[] }
  | { type: 'saved'; revision: Revision }
  | { type: 'ran'; event: AuditEvent };

export const createSuiteState = (): SuiteState => ({
  editorVersion: 0,
  suite: null,
  baseline: null,
  revision: null,
  revisions: [],
  events: [],
  loading: true,
  error: '',
});

export const suiteReducer = (state: SuiteState, action: SuiteAction): SuiteState => {
  switch (action.type) {
    case 'loaded':
      return {
        editorVersion: state.editorVersion + 1,
        suite: action.suite,
        baseline: action.suite,
        revision: action.revision,
        revisions: action.revisions,
        events: action.events,
        loading: false,
        error: '',
      };
    case 'failed':
      return { ...state, loading: false, error: action.message };
    case 'changed':
      return { ...state, suite: action.suite };
    case 'discarded':
      return { ...state, suite: state.baseline, editorVersion: state.editorVersion + 1 };
    case 'refreshed':
      return { ...state, revisions: action.revisions, events: action.events };
    case 'saved':
      return {
        ...state,
        editorVersion: state.editorVersion + 1,
        suite: action.revision.suite,
        baseline: action.revision.suite,
        revision: action.revision,
      };
    case 'ran':
      return { ...state, events: [action.event, ...state.events] };
    default:
      return state;
  }
};
