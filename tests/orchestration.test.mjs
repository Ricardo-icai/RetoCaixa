import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSession, mutate, publicSession } from '../apps/web/src/server/sessions.ts';

test('conversation reaches a proposal, records one confirmed simulation, and resets', async () => {
  const entry = getSession(undefined, 'es');
  assert.equal(publicSession(entry).pending, 'goal');
  assert.equal(publicSession(entry).simulatedBalance, 0);

  const answers = [
    'Ahorrar para mi futuro', '10 años', '1500', '900', '0', '0',
    '6000', 'No', 'Estables', '30', 'Esperaría',
    'Estoy empezando', 'No tengo inversiones',
  ];
  for (const text of answers) {
    await mutate(entry, { operation: 'message', text, revision: entry.session.revision });
  }

  const proposal = entry.session.messages.at(-1);
  assert.equal(proposal.advice?.action, 'INVEST');
  assert.equal(proposal.advice?.amount, 30);
  assert.equal(entry.session.pending, undefined);

  await assert.rejects(
    mutate(entry, { operation: 'simulate', recommendationId: proposal.id, confirmed: false, revision: entry.session.revision }),
    error => error.status === 409,
  );
  assert.equal(entry.session.simulatedBalance, 0);

  await mutate(entry, { operation: 'simulate', recommendationId: proposal.id, confirmed: true, revision: entry.session.revision });
  assert.equal(entry.session.simulatedBalance, 30);
  assert.deepEqual(entry.session.executedRecommendations, [proposal.id]);
  await assert.rejects(
    mutate(entry, { operation: 'simulate', recommendationId: proposal.id, confirmed: true, revision: entry.session.revision }),
    error => error.status === 409,
  );

  await mutate(entry, { operation: 'reset', revision: entry.session.revision });
  assert.equal(entry.session.simulatedBalance, 0);
  assert.deepEqual(entry.session.profile, {});
  assert.deepEqual(entry.session.executedRecommendations, []);
  assert.equal(entry.session.pending, 'goal');
});

test('unverified market claims and panic do not trigger a proposal', async () => {
  const entry = getSession(undefined, 'es');
  for (const text of ['¿Qué pasa en el mercado?', 'Tengo miedo, quiero vender todo']) {
    await mutate(entry, { operation: 'message', text, revision: entry.session.revision });
    assert.equal(entry.session.messages.at(-1).advice?.action, 'WAIT');
  }
});
