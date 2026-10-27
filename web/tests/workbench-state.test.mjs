import assert from 'node:assert/strict';
import test from 'node:test';
import loadModule from './load-module.mjs';

const { createSuiteState, suiteReducer } = await loadModule('workbenchState');
const suite = Object.freeze({ name: 'Reviewed suite', cases: [] });
const revision = Object.freeze({ id: 'rev-1', suite, approvedBy: 'Reviewer' });
const loaded = () =>
  suiteReducer(createSuiteState(), {
    type: 'loaded',
    suite,
    revision,
    revisions: [revision],
    events: [],
  });

test('editing leaves the reviewed contract immutable; discard restores editor contents', () => {
  const initial = loaded();
  const changed = suiteReducer(initial, { type: 'changed', suite: { ...suite, name: 'Draft' } });
  assert.equal(changed.baseline.name, 'Reviewed suite');
  assert.equal(changed.revision, revision);
  assert.notEqual(changed.suite, changed.baseline);
  const discarded = suiteReducer(changed, { type: 'discarded' });
  assert.equal(discarded.suite, suite);
  assert.ok(discarded.editorVersion > changed.editorVersion);
  assert.equal(initial.suite, suite);
});

test('saving a child revision replaces the approval baseline without inheriting approval', () => {
  const initial = loaded();
  const child = { id: 'rev-2', parentId: revision.id, suite: { ...suite, name: 'Revised' } };
  const saved = suiteReducer(initial, { type: 'saved', revision: child });
  assert.equal(saved.revision.approvedBy, undefined);
  assert.equal(saved.suite, saved.baseline);
  assert.equal(saved.baseline, child.suite);
  assert.ok(saved.editorVersion > initial.editorVersion);
});

test('opening a new suite clears prior approval and evidence', () => {
  const initial = suiteReducer(loaded(), { type: 'ran', event: { id: 'run-1' } });
  const fresh = suiteReducer(initial, {
    type: 'loaded',
    suite,
    revision: null,
    revisions: [revision],
    events: [],
  });
  assert.equal(fresh.revision, null);
  assert.deepEqual(fresh.events, []);
  assert.equal(initial.events.length, 1);
  assert.ok(fresh.editorVersion > initial.editorVersion);
});

test('refreshing audit history never overwrites an unsaved draft', () => {
  const draft = { ...suite, name: 'Unsaved' };
  const changed = suiteReducer(loaded(), { type: 'changed', suite: draft });
  const refreshed = suiteReducer(changed, {
    type: 'refreshed',
    revisions: [],
    events: [{ id: 'run-2' }],
  });
  assert.equal(refreshed.suite, draft);
  assert.equal(refreshed.baseline, suite);
  assert.equal(refreshed.events[0].id, 'run-2');
});
