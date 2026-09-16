import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSession, mutate, publicSession } from '../apps/web/src/server/sessions.ts';

const answers = { monthlyIncome: 2000, essentialExpenses: 900, highCostDebt: false, riskTolerance: 'high' };

test('guided answers reach the existing agents without inventing missing financial facts', async () => {
  const entry = getSession();
  await mutate(entry, { operation: 'onboarding', answers, revision: 0 });
  assert.deepEqual(publicSession(entry).profile, answers);
  for (const key of Object.keys(answers)) assert.equal(entry.session.provenance[key].source, 'user');
  assert.equal(entry.session.pending, 'goal');
  assert.equal(entry.traces.at(-1).action, 'ASK_CLARIFICATION');
  assert.equal(entry.traces.at(-1).runs.length, 14);
  assert.equal(entry.session.profile.monthlyDebtPayments, undefined);
  assert.equal(entry.session.profile.horizonMonths, undefined);
  assert.equal(entry.provider, 'demo');
  await mutate(entry, { operation: 'message', text: 'Comprar una casa', revision: 1 });
  assert.equal(entry.session.pending, 'horizonMonths');
  assert.equal(entry.session.profile.monthlyIncome, 2000);
});

test('high-cost debt triggers protection even when the user would buy more', async () => {
  const entry = getSession();
  await mutate(entry, { operation: 'onboarding', answers: { ...answers, highCostDebt: true }, revision: 0 });
  assert.equal(entry.traces.at(-1).action, 'PROTECT');
  assert.equal(entry.session.messages.at(-1).advice.action, 'PROTECT');
  assert.equal(entry.session.simulatedBalance, 0);
});

test('invalid and forged onboarding data cannot change the profile', async () => {
  for (const input of [null, [], {}, { ...answers, goal: 'forged' }, { ...answers, monthlyIncome: '2000' }, { ...answers, monthlyIncome: -1 }, { ...answers, monthlyIncome: Infinity }, { ...answers, essentialExpenses: 10000001 }, { ...answers, highCostDebt: 'false' }, { ...answers, riskTolerance: 'aggressive' }, { ...answers, riskTolerance: ['high'] }]) {
    const entry = getSession();
    await assert.rejects(mutate(entry, { operation: 'onboarding', answers: input, revision: 0 }), error => error.status === 400);
    assert.deepEqual(entry.session.profile, {});
    assert.equal(entry.session.revision, 0);
    assert.equal(entry.busy, false);
  }
});

test('zero cash flow is accepted; revisiting, revision checks, save and reset follow chat lifecycle', async () => {
  const entry = getSession(undefined, 'en');
  await mutate(entry, { operation: 'onboarding', answers: { ...answers, monthlyIncome: 0, essentialExpenses: 0 }, revision: 0 });
  assert.equal(entry.session.profile.monthlyIncome, 0);
  assert.match(entry.session.messages.at(-2).text, /My starting point/);
  await assert.rejects(mutate(entry, { operation: 'onboarding', answers, revision: 0 }), error => error.status === 409);
  await mutate(entry, { operation: 'onboarding', answers, revision: 1 });
  assert.equal(entry.session.profile.monthlyIncome, 2000);
  await mutate(entry, { operation: 'save', title: 'My starting point', revision: 2 });
  assert.deepEqual(entry.savedConversations[0].profile, answers);
  assert.deepEqual(entry.session.profile, {});
  await mutate(entry, { operation: 'onboarding', answers, revision: 3 });
  await mutate(entry, { operation: 'reset', revision: 4 });
  assert.deepEqual(entry.session.profile, {});
});
