export const DEFAULT_GEMINI_URL = 'https://gemini.google.com/app';

export function accountProfileKey(browserMode, chromeProfile) {
  return browserMode === 'existing' ? `chrome:${chromeProfile}` : 'dedicated';
}

export function geminiAccountIndex(value) {
  try {
    const url = new URL(value);
    const match = url.pathname.match(/^\/(?:u\/(0|[1-9]\d*)\/)?app(?:\/|$)/);
    if (url.origin !== 'https://gemini.google.com' || !match) return null;
    const query = url.searchParams.get('authuser');
    if (query !== null && !/^(0|[1-9]\d*)$/.test(query)) return null;
    if (match[1] !== undefined && query !== null && Number(match[1]) !== Number(query)) return null;
    const index = Number(match[1] ?? query ?? 0);
    return Number.isSafeInteger(index) ? index : null;
  } catch { return null; }
}

export function normalizeGeminiURL(value) {
  const invalid = () => new Error('Вкажіть посилання Gemini на кшталт https://gemini.google.com/u/2/app?pageId=none.');
  if (typeof value !== 'string' || value.length > 2000 || /[\x00-\x1f]/.test(value)) throw invalid();
  let url; try { url = new URL(value.trim()); } catch { throw invalid(); }
  if (url.origin !== 'https://gemini.google.com' || url.username || url.password ||
      !/^\/(?:u\/(0|[1-9]\d*)\/)?app\/?$/.test(url.pathname) || geminiAccountIndex(url.href) === null) throw invalid();
  url.hash = ''; return url.href;
}

export function validateGeminiAccount({ name, url, enabled }) {
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) throw new Error('Вкажіть назву акаунта до 100 символів.');
  if (typeof enabled !== 'boolean') throw new Error('Некоректний перемикач акаунта.');
  return { name: name.trim(), url: normalizeGeminiURL(url), enabled };
}
