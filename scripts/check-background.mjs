import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from '../server.mjs';
import { oracleBrowserConfig, isHeadlessChrome, closeBackgroundChrome, runningChrome } from '../oracle.mjs';

const profile = await fs.mkdtemp(path.join(ROOT, '.test-chrome-'));
let chrome;
try {
  const modulePath = path.join(ROOT, 'node_modules/@steipete/oracle/dist/src/browser/chromeLifecycle.js');
  const { launchChrome } = await import(pathToFileURL(modulePath).href);
  chrome = await launchChrome(oracleBrowserConfig(profile, true), profile, () => {});
  const response = await fetch(`http://127.0.0.1:${chrome.port}/json/version`, { signal: AbortSignal.timeout(5000) });
  assert.ok(response.ok);
  const version = await response.json();
  assert.ok(isHeadlessChrome(version), 'Chrome must report HeadlessChrome');
  await fs.writeFile(path.join(profile, 'DevToolsActivePort'), `${chrome.port}\n/devtools/browser`);
  await closeBackgroundChrome(profile, ROOT);
  assert.equal(await runningChrome(profile), null);
  console.log('PASS: Chrome starts and stops without visible windows using Oracle. No account or image requests were used.');
} finally {
  await chrome?.kill();
  assert.equal(path.dirname(profile), ROOT); assert.ok(path.basename(profile).startsWith('.test-chrome-'));
  await fs.rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
