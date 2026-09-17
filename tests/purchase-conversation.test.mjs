import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession, runTurn } from '../services/orchestration/src/index.ts';
import { extractLocally } from '../services/orchestration/src/language.ts';

test('purchase goals accept natural wording, accents and the reported typo', async () => {
  for (const goal of ['quiero comprarme un móvil', 'quiero comparme un movil', 'quiero un móvil', 'comprarme una bicicleta', 'un portátil', 'I want to buy a phone']) {
    const result = await runTurn(createSession(), goal);
    assert.equal(result.session.profile.goal, goal);
    assert.equal(result.session.pending, 'horizonMonths');
    assert.doesNotMatch(result.session.messages.at(-1).text, /Qué te gustaría conseguir/);
  }
});

test('phone purchase progresses to an exact savings calculation and updates it', async () => {
  let session = createSession();
  for (const [input, pending] of [['quiero comprarme un móvil', 'horizonMonths'], ['en seis meses', 'goalAmount'], ['cuesta 800 euros', 'goalSavings'], ['tengo 200 ahorrados', 'monthlyContribution'], ['puedo ahorrar 100 al mes', undefined]]) {
    session = (await runTurn(session, input)).session;
    assert.equal(session.pending, pending);
  }
  const reply = session.messages.at(-1).text;
  assert.match(reply, /600,00/); assert.match(reply, /100,00/); assert.match(reply, /Encaja/);
  session = (await runTurn(session, 'mejor en tres meses')).session;
  assert.equal(session.profile.horizonMonths, 3);
  assert.match(session.messages.at(-1).text, /200,00/);
  assert.match(session.messages.at(-1).text, /Supera/);
  assert.equal(session.profile.emergencySavings, undefined);
  assert.equal(session.simulatedBalance, 0);
});

test('multiple facts in one message are retained and skipped in later questions', async () => {
  const result = await runTurn(createSession(), 'Quiero comprarme un móvil, cuesta 800 euros, en seis meses y tengo 200 ahorrados. Puedo ahorrar 100 al mes.');
  assert.equal(result.session.pending, undefined);
  assert.equal(result.session.profile.goalAmount, 800);
  assert.equal(result.session.profile.horizonMonths, 6);
  assert.equal(result.session.profile.goalSavings, 200);
  assert.equal(result.trace.action, 'LEARN');
  assert.match(result.session.messages.at(-1).text, /600,00/);
});

test('changing purchase clears old price, savings and timing assumptions', async () => {
  let session = (await runTurn(createSession(), 'Quiero comprarme un móvil, cuesta 800, en seis meses, tengo 200 ahorrados y puedo ahorrar 100 al mes.')).session;
  session = (await runTurn(session, 'En realidad quiero comprarme una bicicleta')).session;
  assert.equal(session.profile.goalAmount, undefined);
  assert.equal(session.profile.goalSavings, undefined);
  assert.equal(session.profile.monthlyContribution, undefined);
  assert.equal(session.pending, 'horizonMonths');
});

test('unrelated numbers, hypotheticals and negated goals are not silently assigned', () => {
  const session = createSession(); session.profile.goal = 'Comprar un móvil'; session.pending = 'monthlyIncome';
  assert.equal(extractLocally('el móvil cuesta 800', session).facts.monthlyIncome, undefined);
  assert.equal(extractLocally('si tuviera 800 euros', session).uncertain, true);
  assert.equal(extractLocally('no quiero comprarme un móvil', createSession()).facts.goal, undefined);
  session.pending = 'goalAmount';
  assert.equal(extractLocally('0', session).uncertain, true);
});

test('high-cost debt still takes priority over a complete purchase plan', async () => {
  const result = await runTurn(createSession(), 'Quiero comprarme un móvil, cuesta 800, en seis meses y tengo 200 ahorrados. Puedo ahorrar 100 al mes. Tengo una deuda revolving alta.');
  assert.equal(result.trace.action, 'PROTECT');
});


test('other freely expressed goals and short contextual savings answers advance', async () => {
  const business = await runTurn(createSession(), 'quiero montar mi propio negocio');
  assert.equal(business.session.profile.goal, 'quiero montar mi propio negocio');
  assert.equal(business.session.pending, 'horizonMonths');
  const session = createSession(); session.profile.goal = 'comprar un móvil'; session.pending = 'goalSavings';
  assert.equal(extractLocally('tengo 200', session).facts.goalSavings, 200);
  assert.equal(extractLocally('cuesta 800 o 900', session).uncertain, true);
});
