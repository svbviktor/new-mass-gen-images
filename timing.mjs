export function bounded(promise, ms, message, signal) {
  return new Promise((resolve, reject) => {
    let timer;
    const finish = (fn, value) => { clearTimeout(timer); signal?.removeEventListener('abort', abort); fn(value); };
    const abort = () => finish(reject, signal.reason?.kind ? signal.reason : Object.assign(new Error('Запит перервано. Перевірте Gemini перед повтором.'), { kind: 'interrupted' }));
    Promise.resolve(promise).then(value => finish(resolve, value), error => finish(reject, error));
    if (signal?.aborted) { abort(); return; }
    signal?.addEventListener('abort', abort, { once: true });
    timer = setTimeout(() => finish(reject, Object.assign(new Error(message), { kind: 'timeout' })), ms);
  });
}
