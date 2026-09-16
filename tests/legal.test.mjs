import { test } from 'node:test';
import assert from 'node:assert/strict';
import { legalVersions } from '../apps/web/src/legal/policy.ts';
import { communitySnapshot, getViewer, mutateCommunity, hasCompletedOnboarding } from '../apps/web/src/server/community.ts';

const submission = () => ({ operation: 'completeOnboarding', goals: ['Aprender a invertir'], visibility: 'PRIVATE', countryCode: 'ES', acceptTerms: true, acknowledgePrivacy: true, acceptRisk: true, confirmAdult: true, legalVersions: { ...legalVersions } });

test('server rejects absent, false, coerced and stale legal acceptance before changing profile', () => {
  for (const key of ['acceptTerms', 'acknowledgePrivacy', 'acceptRisk', 'confirmAdult', 'legalVersions']) {
    for (const value of [undefined, false, 'true', null]) {
      const viewer = getViewer();
      assert.throws(() => mutateCommunity(viewer, { ...submission(), [key]: value }), error => error.status === 400);
      assert.equal(viewer.consentedAt, undefined);
      assert.equal(viewer.kycStatus, 'UNVERIFIED');
    }
  }
  for (const key of Object.keys(legalVersions)) {
    const viewer = getViewer();
    const body = submission();
    body.legalVersions[key] = 'old';
    assert.throws(() => mutateCommunity(viewer, body), error => error.status === 400);
    assert.equal(viewer.legalAcceptance, undefined);
  }
});

test('receipt records server time, version and country without biometric or marketing consent', () => {
  const viewer = getViewer();
  const body = submission();
  const before = Date.now();
  const snapshot = mutateCommunity(viewer, body);
  const receipt = snapshot.onboarding.legalAcceptance;
  assert.deepEqual(receipt.versions, legalVersions);
  assert.ok(Date.parse(receipt.acceptedAt) >= before && Date.parse(receipt.acceptedAt) <= Date.now());
  assert.equal(receipt.countryCode, 'ES');
  assert.equal(receipt.adultConfirmed, true);
  body.legalVersions.terms = 'tampered';
  assert.equal(viewer.legalAcceptance.versions.terms, legalVersions.terms);
  assert.equal('consentIp' in viewer, false);
  assert.equal('acceptedBiometricAt' in receipt, false);
  assert.equal(hasCompletedOnboarding(viewer.id), false);
  mutateCommunity(viewer, { operation: 'verifyIdentityDemo' });
  assert.equal(hasCompletedOnboarding(viewer.id), true);
});

test('old receipts cannot verify, publish or reply and can be renewed', () => {
  const viewer = getViewer();
  mutateCommunity(viewer, submission());
  mutateCommunity(viewer, { operation: 'verifyIdentityDemo' });
  viewer.legalAcceptance.versions.terms = 'old';
  assert.equal(hasCompletedOnboarding(viewer.id), false);
  assert.equal(communitySnapshot(viewer).onboarding.completed, false);
  assert.throws(() => mutateCommunity(viewer, { operation: 'verifyIdentityDemo' }), error => error.status === 409);
  assert.throws(() => mutateCommunity(viewer, { operation: 'publish' }), error => error.status === 403);
  assert.throws(() => mutateCommunity(viewer, { operation: 'reply' }), error => error.status === 403);
  mutateCommunity(viewer, submission());
  mutateCommunity(viewer, { operation: 'verifyIdentityDemo' });
  assert.equal(hasCompletedOnboarding(viewer.id), true);
});
