import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

test('public release exposes an editable shared style and explains when it applies', async () => {
  const html = await fs.readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.match(html, /<textarea id="style"[^>]*maxlength="12000"/);
  assert.match(html, /Основний стиль запиту/);
  assert.match(html, /Зберегти налаштування/);
  assert.match(html, /додається до кожного нового запиту/);
});
