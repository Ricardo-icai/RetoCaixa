import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import handler from '../apps/web/src/pages/api/profile.ts';
import { getViewer, mutateCommunity, profileDetail, updatePersona } from '../apps/web/src/server/community.ts';
import { legalVersions } from '../apps/web/src/legal/policy.ts';
import { sanitizeAvatar } from '../apps/web/src/server/avatar.ts';

function member(visibility = 'PRIVATE') {
  const viewer = getViewer();
  mutateCommunity(viewer, { operation: 'completeOnboarding', goals: ['Aprender a invertir'], visibility, countryCode: 'ES', nationality: 'Española', dateOfBirth: '1990-05-15', acceptTerms: true, acknowledgePrivacy: true, acceptRisk: true, legalVersions });
  mutateCommunity(viewer, { operation: 'verifyIdentityDemo' });
  return viewer;
}
const fields = viewer => ({ name: 'Elena Demo', handle: `elena_${viewer.id.slice(0, 8)}`, bio: 'Aprendiendo cada día', investmentTag: '🤖 Tecnología', revision: 0 });

test('persona persists, is independent of financial profile, and enforces visibility', () => {
  const viewer = member();
  const other = member();
  const result = updatePersona(viewer, fields(viewer), null);
  assert.equal(result.profile.bio, 'Aprendiendo cada día');
  assert.equal(profileDetail(viewer).profile.name, 'Elena Demo');
  assert.equal(result.return1Y, null);
  assert.deepEqual(result.holdings, []);
  assert.throws(() => profileDetail(other, viewer.id), error => error.status === 404);
  viewer.visibility = 'PUBLIC';
  const publicData = profileDetail(other, viewer.id);
  assert.equal(publicData.mine, false);
  for (const key of ['nationality', 'dateOfBirth', 'countryCode', 'legalAcceptance']) assert.equal(key in publicData.profile, false);
});

test('invalid names, handles, biographies, tags and stale writes are rejected atomically', () => {
  const viewer = member();
  for (const extra of [{ name: ' ' }, { handle: 'bad name' }, { handle: 'nora_vega' }, { bio: 'a'.repeat(151) }, { investmentTag: 'anything' }, { revision: 99 }]) {
    assert.throws(() => updatePersona(viewer, { ...fields(viewer), ...extra }, null));
    assert.equal(viewer.persona, undefined);
  }
  updatePersona(viewer, fields(viewer), null);
  const other = member();
  assert.throws(() => updatePersona(other, { ...fields(other), handle: fields(viewer).handle.toUpperCase() }, null), error => error.status === 409);
  assert.throws(() => updatePersona(viewer, fields(viewer), null), error => error.status === 409);
});

test('privacy acceptance must be current before saving persona', () => {
  const viewer = member();
  viewer.legalAcceptance.versions.privacy = '2026-09-16.3';
  assert.throws(() => updatePersona(viewer, fields(viewer), null), error => error.status === 403);
  assert.equal(viewer.persona, undefined);
});

test('avatars are decoded and normalized; corrupt or executable formats are rejected', async () => {
  const png = await sharp({ create: { width: 400, height: 200, channels: 3, background: '#34d399' } }).png().toBuffer();
  const result = await sanitizeAvatar(`data:image/png;base64,${png.toString('base64')}`);
  const metadata = await sharp(Buffer.from(result.split(',')[1], 'base64')).metadata();
  assert.equal(metadata.format, 'jpeg'); assert.equal(metadata.width, 256); assert.equal(metadata.height, 256);
  assert.equal(metadata.exif, undefined);
  assert.equal(await sanitizeAvatar(null), null);
  for (const value of ['data:image/svg+xml;base64,PHN2Zz4=', 'data:image/jpeg;base64,YmFk', 'https://example.com/photo.png', undefined]) await assert.rejects(sanitizeAvatar(value), error => error.status === 400);
});

test('profile API enforces CSRF and owner-only writes, returns actual saved data', async () => {
  const viewer = member();
  async function request(body, token = viewer.csrfToken) {
    const req = { method: 'POST', query: {}, cookies: { kai_community: viewer.id }, headers: { 'content-type': 'application/json', 'x-csrf-token': token }, body };
    const res = { code: 200, body: null, setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await handler(req, res); return res;
  }
  assert.equal((await request({ ...fields(viewer), avatar: null }, 'wrong')).code, 403);
  assert.equal((await request({ ...fields(viewer), avatar: null, userId: 'someone-else' })).code, 400);
  const saved = await request({ ...fields(viewer), avatar: null });
  assert.equal(saved.code, 200); assert.equal(saved.body.profile.name, 'Elena Demo');
  assert.equal(saved.body.revision, 1);
});

test('fictional creators carry explicit sample status, financial examples and reels', () => {
  const data = profileDetail(getViewer(), 'nora-vega');
  assert.equal(data.fictional, true);
  assert.equal(data.holdings.reduce((sum, row) => sum + row.weight, 0), 100);
  assert.ok(data.reels.length);
});
