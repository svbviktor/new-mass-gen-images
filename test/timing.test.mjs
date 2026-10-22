import assert from 'node:assert/strict';
import test from 'node:test';
import { bounded } from '../timing.mjs';

test('a browser command that never resolves has a real deadline', async () => {
  await assert.rejects(bounded(new Promise(() => {}), 15, 'Chrome stalled'), error => error.kind === 'timeout' && error.message === 'Chrome stalled');
  assert.equal(await bounded(Promise.resolve('image'), 1000, 'late'), 'image');
  await assert.rejects(bounded(Promise.reject(new Error('protocol error')), 1000, 'late'), /protocol error/);
});

test('abort interrupts a hung browser command and keeps a timeout reason', async () => {
  const controller = new AbortController();
  const waiting = bounded(new Promise(() => {}), 1000, 'late', controller.signal);
  controller.abort(Object.assign(new Error('Attempt deadline'), { kind: 'timeout' }));
  await assert.rejects(waiting, error => error.kind === 'timeout' && error.message === 'Attempt deadline');
  const cancelled = new AbortController(); cancelled.abort();
  await assert.rejects(bounded(Promise.resolve(), 1000, 'late', cancelled.signal), error => error.kind === 'interrupted');
});
