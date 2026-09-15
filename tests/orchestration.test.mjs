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

test('every turn runs all specialist agents', async () => {
  const entry = getSession(undefined, 'es');
  await mutate(entry, { operation: 'message', text: 'Quiero ahorrar para mi futuro', revision: entry.session.revision });
  const runs = entry.traces.at(-1).runs;
  assert.equal(runs.length, 14);
  assert.equal(new Set(runs.map(run => run.id)).size, 14);
});

test('saving archives the conversation and reset forgets only the active conversation', async () => {
  const entry = getSession(undefined, 'es');
  await mutate(entry, { operation: 'message', text: 'Quiero aprender a invertir', revision: entry.session.revision });
  const archivedMessages = entry.session.messages.length;
  await mutate(entry, { operation: 'save', title: 'Primeros pasos', revision: entry.session.revision });
  let view = publicSession(entry);
  assert.equal(view.savedConversations.length, 1);
  assert.equal(view.savedConversations[0].title, 'Primeros pasos');
  assert.equal(view.savedConversations[0].messages.length, archivedMessages);
  assert.equal(view.messages.length, 1);
  assert.deepEqual(view.profile, {});

  await mutate(entry, { operation: 'message', text: 'Nueva conversación', revision: entry.session.revision });
  await mutate(entry, { operation: 'reset', revision: entry.session.revision });
  view = publicSession(entry);
  assert.equal(view.messages.length, 1);
  assert.equal(view.savedConversations.length, 1);

  await mutate(entry, { operation: 'deleteSaved', savedConversationId: view.savedConversations[0].id, revision: entry.session.revision });
  assert.equal(publicSession(entry).savedConversations.length, 0);
});
