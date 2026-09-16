import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../apps/web/src/pages/api/community.ts';
import { getViewer } from '../apps/web/src/server/community.ts';
import { legalVersions } from '../apps/web/src/legal/policy.ts';
import { nationalitySuggestions } from '../apps/web/src/community/nationalities.ts';

function submit(extra = {}) {
  const viewer = getViewer();
  const req = {
    method: 'POST', cookies: { kai_community: viewer.id },
    headers: { host: 'localhost', origin: 'http://localhost', 'content-type': 'application/json', 'x-csrf-token': viewer.csrfToken },
    body: { operation: 'completeOnboarding', goals: ['Aprender a invertir'], visibility: 'PRIVATE', countryCode: 'ES', nationality: 'Mexicana', dateOfBirth: '1990-05-15', acceptTerms: true, acknowledgePrivacy: true, acceptRisk: true, legalVersions, ...extra },
  };
  const res = { statusCode: 200, body: undefined, setHeader() {}, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  handler(req, res);
  return { res, viewer };
}

test('the actual signup API accepts the nationality sent by the form', () => {
  const { res, viewer } = submit();
  assert.equal(res.statusCode, 200, res.body.error);
  assert.equal(res.body.onboarding.nationality, 'Mexicana');
  assert.equal(viewer.kycStatus, 'PENDING');
});

test('API errors identify unsupported fields without exposing their values', () => {
  const { res, viewer } = submit({ unexpectedField: 'private-value' });
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /unexpectedField/);
  assert.doesNotMatch(res.body.error, /private-value/);
  assert.equal(viewer.kycStatus, 'UNVERIFIED');
});

test('API errors identify the invalid signup answer or acceptance', () => {
  for (const [extra, expected] of [
    [{ nationality: ' ' }, /Nacionalidad/],
    [{ dateOfBirth: '1990-02-31' }, /fecha de nacimiento/],
    [{ acceptTerms: false }, /Términos y condiciones/],
    [{ acknowledgePrivacy: false }, /Privacidad/],
    [{ acceptRisk: false }, /Riesgos de la simulación/],
    [{ legalVersions: {} }, /versión de los documentos/],
  ]) {
    const { res } = submit(extra);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.error, expected);
  }
});

test('nationality suggestions match accents, countries and multiple nationalities', () => {
  assert.ok(nationalitySuggestions('espa').includes('Española'));
  assert.ok(nationalitySuggestions('MEXICO').includes('Mexicana'));
  assert.ok(nationalitySuggestions('español').includes('Española'));
  assert.ok(nationalitySuggestions('Española, mex').includes('Española, Mexicana'));
  assert.deepEqual(nationalitySuggestions('Española, espa'), []);
  assert.deepEqual(nationalitySuggestions(''), []);
  assert.deepEqual(nationalitySuggestions('no existe'), []);
});
