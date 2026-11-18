import { useEffect, useState } from 'react';

const BAND = 56;

/**
 * Guía de lectura: deja visible una franja horizontal y oscurece el resto.
 * Sigue al puntero y, al navegar con teclado, al elemento enfocado. Es decorativa.
 */
export function ReadingGuide() {
  const [y, setY] = useState(() => (typeof window === 'undefined' ? 200 : window.innerHeight / 3));

  useEffect(() => {
    const onMove = (e) => setY(e.clientY);
    const onFocus = (e) => {
      const rect = e.target.getBoundingClientRect?.();
      if (rect) setY(rect.top + rect.height / 2);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('focusin', onFocus);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('focusin', onFocus);
    };
  }, []);

  const top = Math.max(0, y - BAND / 2);
  return (
    <div className="reading-guide" aria-hidden="true">
      <div className="reading-guide-shade" style={{ top: 0, height: top }} />
      <div className="reading-guide-band" style={{ top, height: BAND }} />
      <div className="reading-guide-shade" style={{ top: top + BAND, bottom: 0 }} />
    </div>
  );
}
