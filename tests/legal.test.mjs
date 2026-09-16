import { test } from 'node:test';
import assert from 'node:assert/strict';
import { legalVersions } from '../apps/web/src/legal/policy.ts';
import { communitySnapshot, getViewer, mutateCommunity, hasCompletedOnboarding } from '../apps/web/src/server/community.ts';

const submission = () => ({ operation: 'completeOnboarding', goals: ['Aprender a invertir'], visibility: 'PRIVATE', countryCode: 'ES', nationality: 'Española', acceptTerms: true, acknowledgePrivacy: true, acceptRisk: true, dateOfBirth: '1990-05-15', legalVersions: { ...legalVersions } });

test('server rejects absent, false, coerced and stale legal acceptance before changing profile', () => {
  for (const key of ['acceptTerms', 'acknowledgePrivacy', 'acceptRisk', 'dateOfBirth', 'legalVersions']) {
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
  assert.equal(receipt.ageCheck.minimumAge, 18);
  assert.equal(receipt.ageCheck.method, 'declared_birth_date');
  assert.equal('dateOfBirth' in viewer, false);
  assert.equal(JSON.stringify(snapshot).includes(body.dateOfBirth), false);
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


test('nationality is required, bounded, trimmed and independent of residence', () => {
  for (const nationality of [undefined, null, 12, '', '  ', 'E', 'a'.repeat(81)]) {
    const viewer = getViewer();
    assert.throws(() => mutateCommunity(viewer, { ...submission(), nationality }), error => error.status === 400);
    assert.equal(viewer.consentedAt, undefined);
    assert.equal(viewer.nationality, undefined);
  }
  const viewer = getViewer();
  const snapshot = mutateCommunity(viewer, { ...submission(), nationality: '  Mexicana, española  ' });
  assert.equal(snapshot.onboarding.nationality, 'Mexicana, española');
  assert.equal(communitySnapshot(viewer).onboarding.nationality, 'Mexicana, española');
  assert.equal(viewer.countryCode, 'ES');
});

test('the previous privacy version requires renewed acceptance', () => {
  const viewer = getViewer();
  const body = submission();
  body.legalVersions.privacy = '2026-09-16.2';
  assert.throws(() => mutateCommunity(viewer, body), error => error.status === 400);
  assert.equal(viewer.legalAcceptance, undefined);
});
