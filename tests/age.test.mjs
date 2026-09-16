import { test } from 'node:test';
import assert from 'node:assert/strict';
import { birthDateToISO } from '../apps/web/src/community/birthDate.ts';
import { birthDateError, demoToday } from '../apps/web/src/legal/age.ts';
import { legalVersions } from '../apps/web/src/legal/policy.ts';
import { getViewer, mutateCommunity } from '../apps/web/src/server/community.ts';

test('age changes on the birthday, including month/year boundaries', () => {
  assert.equal(birthDateError('2008-09-16', '2026-09-16'), null);
  assert.match(birthDateError('2008-09-17', '2026-09-16'), /18 años/);
  assert.equal(birthDateError('2008-09-15', '2026-09-16'), null);
  assert.match(birthDateError('2008-12-31', '2026-01-01'), /18 años/);
  assert.equal(birthDateError('2008-01-01', '2026-01-01'), null);
});

test('invalid dates, future dates and forged types are rejected', () => {
  for (const value of [undefined, null, true, 19900515, '', '15/05/1990', '1990-5-15', '2007-02-29', '1900-02-29', '2000-04-31', '2000-00-01', '2000-13-01', '2000-01-00', '0000-01-01', '2000-01-01T00:00:00Z', '2099-01-01']) {
    assert.ok(birthDateError(value, '2026-09-16'), String(value));
  }
  assert.equal(birthDateError('2000-02-29', '2026-09-16'), null);
});

test('leap-day birthdays follow the documented demo policy', () => {
  assert.match(birthDateError('2008-02-29', '2026-02-28'), /18 años/);
  assert.equal(birthDateError('2008-02-29', '2026-03-01'), null);
});

test('civil date is fixed to Madrid across UTC midnight and daylight saving', () => {
  assert.equal(demoToday(new Date('2026-09-15T22:30:00Z')), '2026-09-16');
  assert.equal(demoToday(new Date('2026-01-15T22:30:00Z')), '2026-01-15');
  assert.equal(demoToday(new Date('2026-01-15T23:30:00Z')), '2026-01-16');
});

test('server independently refuses underage signup and the former checkbox bypass', () => {
  const body = { operation: 'completeOnboarding', goals: ['Aprender a invertir'], visibility: 'PRIVATE', countryCode: 'ES', nationality: 'Española', acceptTerms: true, acknowledgePrivacy: true, acceptRisk: true, legalVersions };
  for (const extra of [{ dateOfBirth: demoToday() }, { confirmAdult: true }, { dateOfBirth: '2007-02-29' }]) {
    const viewer = getViewer();
    assert.throws(() => mutateCommunity(viewer, { ...body, ...extra }), error => error.status === 400);
    assert.equal(viewer.legalAcceptance, undefined);
    assert.equal(viewer.kycStatus, 'UNVERIFIED');
  }
});


test('typed and pasted birth dates normalize without swapping day and month', () => {
  for (const input of ['15051990', '15/05/1990', '15-05-1990', '15.05.1990', ' 15/5/1990 ']) {
    assert.equal(birthDateToISO(input), '1990-05-15');
  }
  assert.equal(birthDateToISO('1/2/2000'), '2000-02-01');
  for (const input of ['', '15/05/90', '1505199', '//1990', '1990-05-15', 'hello']) {
    assert.equal(birthDateToISO(input), '');
  }
  assert.ok(birthDateError(birthDateToISO('31022000'), '2026-09-16'));
});
