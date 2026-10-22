import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeGeminiURL, geminiAccountIndex, validateGeminiAccount } from '../gemini-accounts.mjs';

test('Gemini account links preserve indexed routes and query parameters and reject other destinations', () => {
  const url = 'https://gemini.google.com/u/2/app?pageId=none';
  assert.equal(normalizeGeminiURL(url), url);
  assert.equal(normalizeGeminiURL(' https://gemini.google.com/app '), 'https://gemini.google.com/app');
  for (const invalid of ['http://gemini.google.com/u/2/app', 'https://gemini.google.com.evil.test/app', 'https://user:secret' + '@gemini.google.com/app', 'https://gemini.google.com:8443/app', 'https://gemini.google.com/u/2/app/private-chat', 'javascript:alert(1)', 'https://gemini.google.com/u/1/app?authuser=2']) assert.throws(() => normalizeGeminiURL(invalid));
});

test('account identity treats default and u/0 as the same slot and detects mismatched redirects', () => {
  assert.equal(geminiAccountIndex('https://gemini.google.com/app'), 0);
  assert.equal(geminiAccountIndex('https://gemini.google.com/u/0/app?pageId=none'), 0);
  assert.equal(geminiAccountIndex('https://gemini.google.com/app?authuser=2'), 2);
  assert.equal(geminiAccountIndex('https://gemini.google.com/u/2/app/conversation'), 2);
  assert.equal(geminiAccountIndex('https://gemini.google.com/u/2/app?authuser=1'), null);
  assert.equal(geminiAccountIndex('https://example.org/u/2/app'), null);
});

test('account labels and enabled switches are validated before saving', () => {
  const url = 'https://gemini.google.com/u/2/app?pageId=none';
  assert.deepEqual(validateGeminiAccount({ name: ' Робочий ', url, enabled: false }), { name: 'Робочий', url, enabled: false });
  for (const name of ['', ' ', 'x'.repeat(101)]) assert.throws(() => validateGeminiAccount({ name, url, enabled: true }));
  assert.throws(() => validateGeminiAccount({ name: 'Робочий', url, enabled: 'true' }));
});
