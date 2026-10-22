import assert from 'node:assert/strict';
import test from 'node:test';
import { maskEmail, redactEmails, redactState } from '../privacy.mjs';

test('a Chrome account address is shown masked and never in full', () => {
  assert.equal(maskEmail('user@example.org'), 'u***@example.org');
  assert.equal(maskEmail('work.account@gmail.com'), 'w***@gmail.com');
  assert.equal(maskEmail(''), '');
  assert.equal(maskEmail(undefined), '');
  assert.equal(maskEmail('not-an-address'), '');
});

test('addresses are removed from journals and page snapshots', () => {
  assert.equal(redactEmails('write to viktor@gmail.com please'), 'write to [email] please');
  assert.equal(redactEmails('no addresses here'), 'no addresses here');
  const state = redactState({ url: 'https://gemini.google.com/app', text: 'user@mail.com said hi', buttons: ['user@mail.com'] });
  assert.equal(state.text, '[email] said hi');
  assert.deepEqual(state.buttons, ['[email]']);
  assert.equal(state.url, 'https://gemini.google.com/app');
});
