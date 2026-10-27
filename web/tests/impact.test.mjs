import assert from 'node:assert/strict';
import test from 'node:test';
import loadModule from './load-module.mjs';

const { impactCounts } = await loadModule('impact');
test('impact summary distinguishes uncertainty from operations unchanged in the spec', () => {
  assert.deepEqual(
    impactCounts({
      operations: [
        { change: 'changed', certainty: 'affected' },
        { change: 'unchanged', certainty: 'uncertain' },
        { change: 'unchanged', certainty: 'unaffected' },
      ],
    }),
    { affected: 1, uncertain: 1, unchanged: 1 },
  );
  assert.deepEqual(impactCounts({ operations: [] }), { affected: 0, uncertain: 0, unchanged: 0 });
});
