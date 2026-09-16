import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getViewer, setFollowUser, getFollowers, socialSnapshot, communitySnapshot, mutateCommunity } from '../apps/web/src/server/community.ts';
import { getSession, mutate } from '../apps/web/src/server/sessions.ts';
import { assetSuggestions } from '../apps/web/src/server/assetSuggestions.ts';

function publicProfile(viewer) {
  mutateCommunity(viewer, { operation: 'completeOnboarding', goals: ['Aprender a invertir'], visibility: 'PUBLIC', countryCode: 'ES', acceptTerms: true, acceptBiometric: true, acceptRisk: true });
  mutateCommunity(viewer, { operation: 'verifyIdentityDemo' });
}
const message = (entry, text) => mutate(entry, { operation: 'message', text, revision: entry.session.revision });

test('follow state and counts are shared, idempotent, and private profiles stay private', () => {
  const author = getViewer(), visitor = getViewer(), privateUser = getViewer();
  publicProfile(author); publicProfile(visitor);
  setFollowUser(author, 'nora-vega', true); setFollowUser(author, 'nora-vega', true); setFollowUser(privateUser, 'nora-vega', true);
  const count = communitySnapshot(visitor).channels.find(item => item.id === 'nora-vega').subscriberCount;
  assert.equal(count, 2);
  const listed = getFollowers(visitor, 'nora-vega');
  assert.equal(listed.total, 2);
  assert.deepEqual(listed.profiles.map(item => item.id), [author.id]);
  assert.ok(!socialSnapshot(visitor).members.some(item => item.id === privateUser.id));
  assert.throws(() => setFollowUser(visitor, privateUser.id, true), error => error.status === 404);
  assert.throws(() => setFollowUser(visitor, visitor.id, true), error => error.status === 400);
  setFollowUser(author, 'nora-vega', false);
  assert.equal(communitySnapshot(visitor).channels.find(item => item.id === 'nora-vega').subscriberCount, 1);
  setFollowUser(author, visitor.id, true); setFollowUser(visitor, author.id, true);
  assert.equal(socialSnapshot(visitor).members.find(item => item.id === author.id).friend, true);
  setFollowUser(visitor, author.id, false);
  assert.equal(socialSnapshot(author).members.find(item => item.id === visitor.id).friend, false);
});
test('personalized reels keep the 70/30 mix and never claim verified creators or returns', async () => {
  const entry = getSession(); const viewer = getViewer();
  await message(entry, 'Explícame los ETF y fondos indexados');
  const snapshot = communitySnapshot(viewer, entry.session.id);
  assert.equal(snapshot.reels.length, 10);
  assert.equal(snapshot.reels.filter(reel => reel.recommendation.kind === 'personalized').length, 7);
  assert.equal(new Set(snapshot.reels.map(reel => reel.id)).size, 10);
  assert.ok(snapshot.reels.every(reel => reel.demoVideo && !('verifiedReturn' in reel)));
  assert.ok(snapshot.reels.some(reel => reel.highRisk));
  assert.ok(snapshot.reels.filter(reel => reel.topic === 'Gestionar dinero').every(reel => !reel.asset));
});
test('sector interests drive asset discovery and follow chat save, reset and delete semantics', async () => {
  const entry = getSession();
  await message(entry, 'Quiero aprender sobre chips e inteligencia artificial');
  let suggestions = assetSuggestions([], entry.session.id);
  assert.equal(suggestions.personalized, true);
  assert.equal(suggestions.assets[0].symbol, 'NVDA');
  assert.match(suggestions.assets[0].kaiReason, /semiconductores/);
  await mutate(entry, { operation: 'save', title: 'IA', revision: entry.session.revision });
  assert.equal(assetSuggestions([], entry.session.id).personalized, true);
  await message(entry, 'Ahora me interesa el software y la nube');
  assert.equal(assetSuggestions([], entry.session.id).assets[0].symbol, 'MSFT');
  await mutate(entry, { operation: 'reset', revision: entry.session.revision });
  assert.equal(assetSuggestions([], entry.session.id).assets[0].symbol, 'NVDA');
  await mutate(entry, { operation: 'deleteSaved', savedConversationId: entry.savedConversations[0].id, revision: entry.session.revision });
  assert.equal(assetSuggestions([], entry.session.id).personalized, false);
  assert.equal(assetSuggestions([]).personalized, false);
});
