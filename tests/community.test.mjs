import { test } from 'node:test';
import assert from 'node:assert/strict';
import { communitySnapshot, getViewer, mutateCommunity } from '../apps/web/src/server/community.ts';

test('posts, replies and helpful marks are shared across visitors', () => {
  const author = getViewer();
  const visitor = getViewer();
  const initial = communitySnapshot(author);
  assert.equal(initial.posts.length, 7);
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
  for (const body of [
    { operation: 'publish', kind: 'signal', topic: 'Riesgo', title: 'Un título válido', text: 'Un texto suficientemente largo.' },
    { operation: 'publish', kind: 'debate', topic: 'Cripto', title: 'Un título válido', text: 'Un texto suficientemente largo.' },
    { operation: 'publish', kind: 'debate', topic: 'Riesgo', title: 'Corto', text: 'Un texto suficientemente largo.' },
  ]) assert.throws(() => mutateCommunity(viewer, body), error => error.status === 400);
});
