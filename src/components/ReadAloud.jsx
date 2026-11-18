import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Square, Volume2 } from './icons.jsx';

export const speechSupported = () =>
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  'SpeechSynthesisUtterance' in window;

function readableText(element) {
  if (!element) return '';
  return (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
}

/**
 * Reproductor de lectura en voz alta (RF-02). Lee el texto seleccionado o, si
 * no hay selección, el contenido principal, a la velocidad elegida.
 */
export function ReadAloud({ rate }) {
  const [state, setState] = useState('idle');
  const selectionRef = useRef('');
  const supported = speechSupported();

  useEffect(() => {
    // Al pulsar el botón algunos navegadores pierden la selección: se recuerda la última.
    const remember = () => {
      const text = window.getSelection?.().toString().trim();
      if (text) selectionRef.current = text;
    };
    document.addEventListener('selectionchange', remember);
    return () => {
      document.removeEventListener('selectionchange', remember);
      if (supported) window.speechSynthesis?.cancel();
    };
  }, [supported]);

  function read() {
    const text =
      window.getSelection?.().toString().trim() ||
      selectionRef.current ||
      readableText(document.getElementById('main'));
    selectionRef.current = '';
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = rate;
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang?.startsWith('es'));
    if (voice) utterance.voice = voice;
    utterance.onend = () => setState('idle');
    utterance.onerror = () => setState('idle');
    window.speechSynthesis.speak(utterance);
    setState('playing');
  }

  function togglePause() {
    if (state === 'playing') {
      window.speechSynthesis.pause();
      setState('paused');
    } else {
      window.speechSynthesis.resume();
      setState('playing');
    }
  }

  function stop() {
    window.speechSynthesis.cancel();
    setState('idle');
  }

  const status = {
    idle: 'Selecciona un texto o lee toda la página.',
    playing: 'Leyendo en voz alta…',
    paused: 'Lectura en pausa.',
  }[state];

  return (
    <section className="read-aloud" aria-label="Lectura en voz alta">
      <Volume2 size={18} />
      {supported ? (
        <>
          {state === 'idle' ? (
            <button className="button primary" onClick={read}>
              <Play size={16} /> Leer
            </button>
          ) : (
            <button className="button secondary" onClick={togglePause}>
              {state === 'playing' ? <Pause size={16} /> : <Play size={16} />}
              {state === 'playing' ? 'Pausar' : 'Reanudar'}
            </button>
          )}
          <button className="button secondary" onClick={stop} disabled={state === 'idle'}>
            <Square size={14} /> Detener
          </button>
          <p role="status">
            {status} <span className="read-aloud-rate">{String(rate).replace('.', ',')}×</span>
          </p>
        </>
      ) : (
        <p role="status">Este navegador no ofrece lectura en voz alta.</p>
      )}
    </section>
  );
}
