import assert from 'node:assert/strict';
import test from 'node:test';
import loadModule from './load-module.mjs';

const { executionSummary, findRegressions } = await loadModule('executions');
const run = (id, status, verdict, options = {}) => ({
  id,
  status,
  environment: 'staging',
  recoveryRequired: ['cancelled', 'interrupted', 'running'].includes(status),
  evidence: {
    suiteHash: 'reviewed-hash',
    dataVersion: 'snapshot-v1',
    failed: verdict === 'fail' ? 1 : 0,
    results: [{ id: 'cross-tenant-read', verdict }],
    ...options,
  },
});

test('summary separates failed contracts, active work, and uncertain executions', () => {
  assert.deepEqual(
    executionSummary([
      run('1', 'completed', 'fail'),
      run('2', 'completed', 'pass'),
      run('3', 'running', 'pass'),
      run('4', 'interrupted', 'pass'),
    ]),
    { completed: 2, failing: 1, active: 1, recovery: 1 },
  );
  assert.deepEqual(executionSummary([]), { completed: 0, failing: 0, active: 0, recovery: 0 });
});

test('regression requires a previous pass for the identical contract and data snapshot', () => {
  const latest = run('new', 'completed', 'fail');
  const previous = run('old', 'completed', 'pass');
  const comparison = findRegressions([latest, previous]);
  assert.equal(comparison.cases.length, 1);
  assert.equal(comparison.previous.id, 'old');
  assert.equal(findRegressions([latest]), null);
  assert.equal(
    findRegressions([latest, run('other', 'completed', 'pass', { suiteHash: 'changed' })]),
    null,
  );
  assert.equal(
    findRegressions([latest, run('other', 'completed', 'pass', { dataVersion: 'v2' })]),
    null,
  );
  assert.equal(findRegressions([latest, { ...previous, environment: 'production' }]), null);
  assert.equal(
    findRegressions([run('new', 'completed', 'fail', { dataVersion: '' }), previous]),
    null,
  );
});

test('cancelled and interrupted evidence cannot establish regressions', () => {
  assert.equal(
    findRegressions([run('new', 'interrupted', 'fail'), run('old', 'completed', 'pass')]),
    null,
  );
  assert.equal(
    findRegressions([run('new', 'completed', 'fail'), run('old', 'cancelled', 'pass')]),
    null,
  );
  assert.equal(
    findRegressions([run('new', 'completed', 'fail'), run('old', 'completed', 'fail')]).cases
      .length,
    0,
  );
});
