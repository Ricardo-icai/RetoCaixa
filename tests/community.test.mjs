import { test } from 'node:test';
import assert from 'node:assert/strict';
import { communitySnapshot, getViewer, mutateCommunity } from '../apps/web/src/server/community.ts';

function verify(viewer, goals = ['Aprender a invertir']) {
  mutateCommunity(viewer, { operation: 'completeOnboarding', goals, visibility: 'PRIVATE', countryCode: 'ES', acceptTerms: true, acceptBiometric: true, acceptRisk: true });
  mutateCommunity(viewer, { operation: 'verifyIdentityDemo' });
}

test('posts, replies and helpful marks are shared across visitors', () => {
  const author = getViewer();
  const visitor = getViewer();
  verify(author);
  verify(visitor);
  const initial = communitySnapshot(author);
  assert.ok(initial.posts.length >= 10);
  assert.deepEqual(initial.feed.preview, { total: 10, personalized: 7, discovery: 3 });
  assert.ok(initial.posts.every(post => post.demo));
  assert.equal(initial.channels.length, 3);

  const published = mutateCommunity(author, {
    operation: 'publish', kind: 'debate', topic: 'Primeros pasos',
    title: 'Mi primera pregunta', text: '¿Qué debería entender sobre las comisiones antes de empezar?',
  });
  const post = published.posts[0];
  assert.equal(post.mine, true);
  assert.equal(post.demo, false);
  assert.equal(communitySnapshot(visitor).posts[0].mine, false);

  const withReply = mutateCommunity(visitor, { operation: 'reply', postId: post.id, text: 'Compararía el coste total anual.' });
  const replyId = withReply.posts[0].replies[0].id;
  assert.equal(communitySnapshot(author).posts[0].replies.length, 1);
  assert.equal(communitySnapshot(author).posts[0].replies[0].mine, false);
  assert.throws(() => mutateCommunity(author, { operation: 'deleteReply', postId: post.id, replyId }), error => error.status === 403);

  mutateCommunity(visitor, { operation: 'helpful', postId: post.id });
  assert.equal(communitySnapshot(author).posts[0].helpfulCount, 1);
  assert.equal(communitySnapshot(visitor).posts[0].helpful, true);
  mutateCommunity(visitor, { operation: 'helpful', postId: post.id });
  assert.equal(communitySnapshot(author).posts[0].helpfulCount, 0);

  mutateCommunity(visitor, { operation: 'deleteReply', postId: post.id, replyId });
  assert.equal(communitySnapshot(author).posts[0].replies.length, 0);

  assert.throws(() => mutateCommunity(visitor, { operation: 'delete', postId: post.id }), error => error.status === 403);
  mutateCommunity(author, { operation: 'delete', postId: post.id });
  assert.ok(!communitySnapshot(visitor).posts.some(item => item.id === post.id));
});

test('following a free creator channel changes only the current visitor feed', () => {
  const follower = getViewer();
  const other = getViewer();
  const channelId = communitySnapshot(follower).channels[0].id;
  const followed = mutateCommunity(follower, { operation: 'subscribe', channelId });
  assert.equal(followed.channels[0].subscribed, true);
  assert.equal(followed.channels[0].subscriberCount >= 1, true);
  assert.equal(communitySnapshot(other).channels[0].subscribed, false);
  assert.ok(followed.posts.some(post => post.channelId === channelId && post.kind === 'movimiento'));
  const unfollowed = mutateCommunity(follower, { operation: 'subscribe', channelId });
  assert.equal(unfollowed.channels[0].subscribed, false);
  assert.throws(() => mutateCommunity(follower, { operation: 'subscribe', channelId: 'unknown' }), error => error.status === 404);
});

test('publication validates format, topic and content length', () => {
  const viewer = getViewer();
  verify(viewer);
  for (const body of [
    { operation: 'publish', kind: 'signal', topic: 'Riesgo', title: 'Un título válido', text: 'Un texto suficientemente largo.' },
    { operation: 'publish', kind: 'debate', topic: 'Cripto', title: 'Un título válido', text: 'Un texto suficientemente largo.' },
    { operation: 'publish', kind: 'debate', topic: 'Riesgo', title: 'Corto', text: 'Un texto suficientemente largo.' },
  ]) assert.throws(() => mutateCommunity(viewer, body), error => error.status === 400);
});

test('onboarding requires legal consent and verification before publishing', () => {
  const viewer = getViewer();
  assert.equal(communitySnapshot(viewer).onboarding.completed, false);
  assert.throws(() => mutateCommunity(viewer, { operation: 'publish', kind: 'debate', topic: 'Riesgo', title: 'Una pregunta', text: 'Este contenido tiene longitud suficiente.' }), error => error.status === 403);
  assert.throws(() => mutateCommunity(viewer, { operation: 'completeOnboarding', goals: ['Gestionar mi dinero'], visibility: 'PRIVATE', countryCode: 'ES', acceptTerms: true, acceptBiometric: false, acceptRisk: true }), error => error.status === 400);
  mutateCommunity(viewer, { operation: 'completeOnboarding', goals: ['Gestionar mi dinero'], visibility: 'PUBLIC', countryCode: 'ES', acceptTerms: true, acceptBiometric: true, acceptRisk: true });
  assert.equal(communitySnapshot(viewer).onboarding.kycStatus, 'PENDING');
  mutateCommunity(viewer, { operation: 'verifyIdentityDemo' });
  const ready = communitySnapshot(viewer);
  assert.equal(ready.onboarding.completed, true);
  assert.equal(ready.onboarding.identityVerified, true);
  assert.equal(ready.onboarding.visibility, 'PUBLIC');
  assert.equal(ready.onboarding.goals[0], 'Gestionar mi dinero');
  assert.equal(ready.posts[0].topic, 'Gestionar dinero');
});
