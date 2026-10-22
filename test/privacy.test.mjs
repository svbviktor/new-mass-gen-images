import assert from 'node:assert/strict';
import test from 'node:test';
import { maskEmail } from '../privacy.mjs';

test('a Chrome account address is shown masked and never in full', () => {
  assert.equal(maskEmail('user@example.org'), 'u***@example.org');
  assert.equal(maskEmail('work.account@gmail.com'), 'w***@gmail.com');
  assert.equal(maskEmail(''), '');
  assert.equal(maskEmail(undefined), '');
  assert.equal(maskEmail('not-an-address'), '');
});
