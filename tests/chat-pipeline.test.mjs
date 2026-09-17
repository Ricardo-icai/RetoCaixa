import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession, runTurn } from '../services/orchestration/src/index.ts';

test('a stalled interpreter falls back within the five-second processing budget', async () => {
  let signal;
  const started = performance.now();
  const result = await runTurn(createSession(), 'Quiero aprender a invertir', { provider: { extract(input) { signal = input.signal; return new Promise(() => {}); } } });
  assert.ok(performance.now() - started < 5000);
  assert.equal(signal.aborted, true);
  assert.equal(result.provider, 'fallback');
  assert.equal(result.trace.action, 'ASK_CLARIFICATION');
  assert.equal(result.trace.runs.length, 14);
});

test('free text retains protection rules and user facts without preset buttons', async () => {
  const result = await runTurn(createSession(), 'Tengo una deuda revolving alta');
  assert.equal(result.session.profile.highCostDebt, true);
  assert.equal(result.trace.action, 'PROTECT');
  assert.equal(result.session.simulatedBalance, 0);
});
