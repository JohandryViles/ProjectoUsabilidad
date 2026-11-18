import { afterEach, beforeEach, vi } from 'vitest';

// Las pruebas del servidor (server/test) se ejecutan en entorno node, sin DOM.
const hasDom = typeof window !== 'undefined';

if (hasDom) {
  const { cleanup } = await import('@testing-library/react');

  // jsdom has no browser top layer; application behaviour is tested separately
  // from the native dialog's browser-provided focus containment.
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  window.scrollTo = vi.fn();
  window.matchMedia = vi.fn((query) => ({
    matches: false,
    media: query,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));

  // Las pruebas de interfaz no deben llegar a la red: sin servidor, la API falla
  // como si estuviera apagada. Cada prueba puede sustituir este comportamiento.
  beforeEach(() => {
    globalThis.fetch = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')));
    URL.createObjectURL ??= () => 'blob:preview';
    URL.revokeObjectURL ??= () => {};
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    window.history.replaceState(null, '', '/');
    delete document.documentElement.dataset.theme;
  });
}
