import { STOPWORDS } from './demo.js';

// API pública de ARASAAC (https://arasaac.org). Los pictogramas tienen licencia
// CC BY-NC-SA y deben mostrarse con su atribución.
export const ARASAAC_API = 'https://api.arasaac.org/v1';
export const ATTRIBUTION = {
  text: 'Pictogramas: Sergio Palao. Origen: ARASAAC (https://arasaac.org). Licencia: CC BY-NC-SA. Propiedad: Gobierno de Aragón (España).',
  url: 'https://arasaac.org',
  license: 'CC BY-NC-SA 4.0',
};
export const MAX_WORDS = 60;

export function pictogramUrl(id) {
  return `https://static.arasaac.org/pictograms/${id}/${id}_300.png`;
}

/** Separa el texto en palabras, conservando la puntuación como parte del texto mostrado. */
export function tokenize(text) {
  return (text.match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]+/gu) ?? []).slice(0, MAX_WORDS * 3);
}

export function isContentWord(word) {
  return /\p{L}/u.test(word) && word.length > 2 && !STOPWORDS.has(word.toLocaleLowerCase('es'));
}

export function createPictogramService({ fetchImpl = globalThis.fetch, timeoutMs = 4000 } = {}) {
  const cache = new Map();

  async function lookup(word) {
    const key = word.toLocaleLowerCase('es');
    if (cache.has(key)) return cache.get(key);
    const promise = (async () => {
      try {
        const res = await fetchImpl(
          `${ARASAAC_API}/pictograms/es/bestsearch/${encodeURIComponent(key)}`,
          { signal: AbortSignal.timeout(timeoutMs) },
        );
        if (!res.ok) return null;
        const [first] = await res.json();
        if (!first?._id) return null;
        return { id: first._id, url: pictogramUrl(first._id), keyword: key };
      } catch {
        cache.delete(key); // No guardar fallos de red: se reintentará más tarde.
        return null;
      }
    })();
    cache.set(key, promise);
    return promise;
  }

  return {
    async forText(text) {
      const tokens = tokenize(text);
      let looked = 0;
      const result = await Promise.all(
        tokens.map(async (word) => {
          if (!isContentWord(word) || looked++ >= MAX_WORDS) return { word, pictogram: null };
          return { word, pictogram: await lookup(word) };
        }),
      );
      return { tokens: result, attribution: ATTRIBUTION };
    },
  };
}
