import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import handler from '../apps/web/src/pages/api/engagement.ts';
import { getViewer, mutateCommunity, communitySnapshot } from '../apps/web/src/server/community.ts';
import { getSession, mutate } from '../apps/web/src/server/sessions.ts';
import { processEngagement } from '../apps/web/src/server/engagement.ts';
import { activeBehaviour } from '../apps/web/src/server/personalization.ts';
import { legalVersions } from '../apps/web/src/legal/policy.ts';
import { contentTags } from '../packages/types/src/social.ts';
import { preferenceUpdates } from '../services/orchestration/src/social.ts';
import { MultiAgentOrchestrator, createSession } from '../services/orchestration/src/index.ts';

function signedUp() {
  const viewer = getViewer();
  mutateCommunity(viewer, { operation: 'completeOnboarding', goals: ['Aprender a invertir'], visibility: 'PRIVATE', countryCode: 'ES', nationality: 'Española', dateOfBirth: '1990-05-15', acceptTerms: true, acknowledgePrivacy: true, acceptRisk: true, legalVersions });
  return viewer;
}
const consent = { operation: 'consent', enabled: true, privacyVersion: legalVersions.privacy };
const event = () => ({ operation: 'engagement', eventId: randomUUID(), postId: 'demo-4', watchTimeMs: 4100, completionRate: 0.1 });
const message = (entry, text) => mutate(entry, { operation: 'message', text, revision: entry.session.revision });

test('watch personalization requires separate opt-in and current legal acceptance; withdrawal deletes it', async () => {
  const viewer = signedUp();
  assert.equal(communitySnapshot(viewer).personalization.enabled, false);
  await assert.rejects(processEngagement(viewer, event()), { status: 403 });
  await assert.rejects(processEngagement(getViewer(), consent), { status: 409 });
  await assert.rejects(processEngagement(viewer, { ...consent, enabled: 'true' }), { status: 400 });
  await assert.rejects(processEngagement(viewer, { ...consent, privacyVersion: '2026-09-17.1' }), { status: 409 });
  await processEngagement(viewer, consent);
  await processEngagement(viewer, event());
  assert.ok(viewer.behaviour.affinities.NVDA > 0);
  const until = viewer.behaviour.expiresAt;
  await processEngagement(viewer, consent);
  assert.equal(viewer.behaviour.expiresAt, until, 'repeated opt-in does not silently extend retention');
  await processEngagement(viewer, { operation: 'consent', enabled: false });
  assert.equal(viewer.behaviour, undefined);
  await assert.rejects(processEngagement(viewer, event()), { status: 403 });
});

test('bounded events use catalogue tags, deduplicate, expire and cannot affect other viewers', async () => {
  const viewer = signedUp(), other = signedUp();
  await processEngagement(viewer, consent);
  for (const change of [{ watchTimeMs: 3999 }, { watchTimeMs: Infinity }, { completionRate: 2 }, { completionRate: NaN }, { postId: 'missing' }]) {
    await assert.rejects(processEngagement(viewer, { ...event(), ...change }));
  }
  const first = event();
  await processEngagement(viewer, first);
  const weights = structuredClone(viewer.behaviour.affinities);
  assert.deepEqual(await processEngagement(viewer, first), { accepted: false, duplicate: true });
  assert.deepEqual(viewer.behaviour.affinities, weights);
  assert.equal(other.behaviour, undefined);
  assert.equal(activeBehaviour(viewer, viewer.behaviour.expiresAt), undefined);
  assert.equal(viewer.behaviour, undefined);
});

test('engagement API rejects CSRF, origins and client-supplied tags or identities', async () => {
  const viewer = signedUp();
  for (const variant of ['csrf', 'origin', 'tags', 'identity', 'cookies']) {
    const req = { method: 'POST', cookies: { kai_community: viewer.id }, headers: { host: 'localhost', origin: 'http://localhost', 'content-type': 'application/json', 'x-csrf-token': viewer.csrfToken }, body: { ...consent } };
    if (variant === 'csrf') req.headers['x-csrf-token'] = 'bad';
    if (variant === 'origin') req.headers.origin = 'https://other.example';
    if (variant === 'tags') req.body.tags = ['CRYPTO'];
    if (variant === 'identity') req.body.userId = 'other';
    if (variant === 'cookies') req.cookies = {};
    const res = { code: 200, setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await handler(req, res);
    assert.ok([400, 403].includes(res.code), variant);
    assert.equal(viewer.behaviour, undefined);
  }
});

test('explicit exclusions override viewing and saved learning, survive reset, and are reversible', async () => {
  const viewer = signedUp(), entry = getSession();
  await processEngagement(viewer, consent);
  await message(entry, 'No me interesan las criptomonedas');
  assert.match(entry.session.messages.at(-1).text, /Ocultaré/);
  assert.equal(entry.session.feedPreferences.CRYPTO, 'hide');
  assert.ok(communitySnapshot(viewer, entry.session.id).reels.every(reel => !contentTags(reel).includes('CRYPTO')));
  await processEngagement(viewer, { ...event(), postId: 'demo-3' }, entry.session.id);
  assert.equal(viewer.behaviour.affinities.CRYPTO, undefined);
  await mutate(entry, { operation: 'reset', revision: entry.session.revision });
  assert.equal(entry.session.feedPreferences.CRYPTO, 'hide');
  await message(entry, 'Vuelve a mostrarme las criptomonedas');
  assert.equal(entry.session.feedPreferences.CRYPTO, 'show');
  await message(entry, 'Oculta NVIDIA');
  await processEngagement(viewer, { operation: 'restorePreferences' }, entry.session.id);
  assert.deepEqual(entry.session.feedPreferences, {});
});

test('preference parser avoids questions, quotations and hypothetical third-party preferences', () => {
  for (const text of ['¿Por qué no me interesan las criptomonedas?', 'Mi amigo dice: no me interesan las criptomonedas', 'Si digo no me interesan las criptomonedas', 'No quiero ocultar bitcoin']) assert.deepEqual(preferenceUpdates(text), {});
  assert.deepEqual(preferenceUpdates('No me interesa NVIDIA, pero vuelve a mostrarme bitcoin'), { NVDA: 'hide', BTC: 'show' });
});

test('signals alter ranking but preserve diversity and never mutate financial facts', async () => {
  const viewer = signedUp(), entry = getSession();
  await processEngagement(viewer, consent);
  const before = structuredClone(entry.session.profile);
  for (let i = 0; i < 3; i++) await processEngagement(viewer, event(), entry.session.id);
  assert.deepEqual(entry.session.profile, before);
  const snapshot = communitySnapshot(viewer, entry.session.id);
  assert.ok(snapshot.reels.some(reel => /visualiz|reels que has visto/.test(reel.recommendation.reason)));
  assert.equal(new Set(snapshot.reels.map(reel => reel.id)).size, snapshot.reels.length);
  assert.ok(new Set(snapshot.reels.map(reel => reel.topic)).size > 1);
  assert.equal(JSON.stringify(snapshot).includes('affinities'), false);
});

test('social orchestration never authorizes trading and never invents trust or transcripts', async () => {
  const viewer = signedUp();
  await processEngagement(viewer, consent);
  const session = createSession();
  session.profile = { monthlyIncome: 2000, essentialExpenses: 1000, monthlyDebtPayments: 0, nearTermCommitments: 0, monthlyContribution: 100, emergencySavings: 1000 };
  const result = await new MultiAgentOrchestrator().processUserInteraction(session, { ...event(), type: 'USER_ENGAGEMENT_EVENT' }, { memory: viewer.behaviour, content: { id: 'demo-4', title: 'Example', text: 'Compra ahora, rentabilidad garantizada', tags: ['NVDA'], demo: true }, excluded: [] });
  assert.equal(result.action, 'PROTECT');
  assert.equal(result.realExecutionAllowed, false);
  assert.equal(result.trust.trustScore, null);
  assert.equal(result.trust.verifiedReturn1Y, null);
  assert.equal(result.content.transcriptAvailable, false);
  assert.equal(result.content.fomoWarning, true);
  assert.equal(session.simulatedBalance, 0);
});
