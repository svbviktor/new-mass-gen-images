import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { ROOT } from '../server.mjs';
import { isHeadlessChrome, assertBackgroundChrome, runningChrome, accountBrowserProfile, verifyHiddenSession, loginChromeArguments, manualLoginActive, openLogin } from '../oracle.mjs';

test('headless detection distinguishes hidden Chrome from a normal visible browser', () => {
  assert.equal(isHeadlessChrome({ Browser: 'Chrome/148', 'User-Agent': 'Mozilla/5.0 HeadlessChrome/148.0' }), true);
  assert.equal(isHeadlessChrome({ Browser: 'Chrome/148', 'User-Agent': 'Mozilla/5.0 Chrome/148.0' }), false);
  assert.equal(isHeadlessChrome({}), false);
  assert.equal(isHeadlessChrome({ product: 'Chrome/148', userAgent: 'HeadlessChrome/148' }), true);
});

test('background account folders are isolated and reject path traversal', () => {
  const profile = path.join(ROOT, '.data/browser-profile');
  assert.equal(accountBrowserProfile(profile, 'main'), profile);
  const id = '0d8eeb70-b010-43af-a3ac-a13efe16dc3d';
  assert.equal(accountBrowserProfile(profile, id), path.join(ROOT, '.data/account-profiles', id));
  for (const value of ['../Default', '', 'Default', 'C:\\Chrome']) assert.throws(() => accountBrowserProfile(profile, value));
});

test('hidden mode refuses a visible session even if the browser launcher returned it', async () => {
  await assert.rejects(verifyHiddenSession({ Browser: { getVersion: async () => ({ product: 'Chrome/148', userAgent: 'Chrome/148' }) } }), error => error.kind === 'browser-setup');
  await verifyHiddenSession({ Browser: { getVersion: async () => ({ product: 'Chrome/148', userAgent: 'HeadlessChrome/148' }) } });
});

test('manual sign-in uses the saved profile without remote debugging or automation flags', () => {
  const profile = path.join(ROOT, '.data/account-profiles/account');
  const args = loginChromeArguments(profile, 'https://gemini.google.com/app');
  assert.equal(args[0], `--user-data-dir=${profile}`);
  assert.equal(args.at(-1), 'https://gemini.google.com/app');
  assert.equal(args.some(arg => /remote-debugging|headless|automation|disable-web-security|no-sandbox/i.test(arg)), false);
});

test('background generation waits for the normal manual sign-in browser to close even without a debugging port', async () => {
  const profile = await fs.mkdtemp(path.join(ROOT, '.test-manual-login-'));
  try {
    assert.equal(await manualLoginActive(profile), false);
    await fs.writeFile(path.join(profile, '.manual-login-pid'), String(process.pid));
    assert.equal(await runningChrome(profile), null);
    assert.equal(await manualLoginActive(profile), true);
    await assert.rejects(assertBackgroundChrome(profile), /закрийте окреме вікно Gemini/);
    await fs.unlink(path.join(profile, '.manual-login-pid'));
    await assertBackgroundChrome(profile);
  } finally { assert.equal(path.dirname(profile), ROOT); await fs.rm(profile, { recursive: true, force: true }); }
});

test('background mode rejects an open visible profile before creating tabs', async () => {
  const root = await fs.mkdtemp(path.join(ROOT, '.test-background-')); let headless = false; let requests = 0;
  const server = http.createServer((req, res) => {
    requests++; assert.equal(req.url, '/json/version');
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ Browser: 'Chrome/148', 'User-Agent': headless ? 'HeadlessChrome/148' : 'Chrome/148' }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    assert.equal(await runningChrome(root), null);
    await fs.writeFile(path.join(root, 'DevToolsActivePort'), `${server.address().port}\n/devtools/browser/test`);
    await assert.rejects(assertBackgroundChrome(root), /закрийте окреме вікно Gemini/);
    headless = true; await assertBackgroundChrome(root);
    assert.equal(requests, 2);
    headless = false;
    const previousChromePath = process.env.CHROME_PATH;
    process.env.CHROME_PATH = process.execPath;
    try { await assert.rejects(openLogin(root), /Закрийте попереднє окреме вікно входу/); }
    finally { if (previousChromePath === undefined) delete process.env.CHROME_PATH; else process.env.CHROME_PATH = previousChromePath; }
    assert.equal(requests, 4);
  } finally {
    await new Promise(resolve => server.close(resolve)); assert.equal(path.dirname(root), ROOT);
    await fs.rm(root, { recursive: true, force: true });
  }
});
