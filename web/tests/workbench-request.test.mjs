import assert from 'node:assert/strict';
import test from 'node:test';
import loadModule from './load-module.mjs';

const { workbenchRequest } = await loadModule('workbench');

test('authenticated writes preserve payload and cancellation signal', async (context) => {
  const abort = new AbortController();
  const payload = { suite: { name: 'Draft' } };
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/workbench/revisions');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer workspace-token');
    assert.equal(options.signal, abort.signal);
    assert.deepEqual(JSON.parse(options.body), payload);
    return Response.json({ id: 'revision-1' }, { status: 201 });
  });
  assert.deepEqual(await workbenchRequest('workspace-token', 'revisions', payload, abort.signal), {
    id: 'revision-1',
  });
});

test('demo reads omit authorization and request bodies', async (context) => {
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(options.method, 'GET');
    assert.equal(options.headers.Authorization, undefined);
    assert.equal(options.body, undefined);
    return Response.json({ demo: true });
  });
  assert.deepEqual(await workbenchRequest('', 'session'), { demo: true });
});

test('server denials propagate without treating them as successful data', async (context) => {
  context.mock.method(globalThis, 'fetch', async () =>
    Response.json({ error: 'Reviewer required' }, { status: 403 }),
  );
  await assert.rejects(workbenchRequest('', 'revisions/id/approve', {}), /Reviewer required/);
});

test('cancellation propagates for stale analysis requests', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => {
    throw new DOMException('Cancelled', 'AbortError');
  });
  await assert.rejects(workbenchRequest('', 'analyze', {}), { name: 'AbortError' });
});
