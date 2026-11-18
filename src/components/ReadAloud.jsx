import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Square, Volume2 } from './icons.jsx';

export const speechSupported = () =>
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  'SpeechSynthesisUtterance' in window;

function readableText(element) {
  return (element?.textContent || '').trim();
}

function clearWordHighlight() {
  if (typeof CSS !== 'undefined' && CSS.highlights) CSS.highlights.delete('incluaula-reading-word');
}

function highlightWord(element, start, length) {
  if (
    !element ||
    typeof Highlight === 'undefined' ||
    typeof CSS === 'undefined' ||
    !CSS.highlights ||
    !length
  )
    return false;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let node;
  let offset = 0;
  let startPoint;
  let endPoint;
  while ((node = walker.nextNode())) {
    const end = offset + node.textContent.length;
    if (!startPoint && start >= offset && start < end) startPoint = [node, start - offset];
    if (start + length > offset && start + length <= end)
      endPoint = [node, start + length - offset];
    offset = end;
  }
  if (!startPoint || !endPoint) return false;
  const range = document.createRange();
  range.setStart(...startPoint);
  range.setEnd(...endPoint);
  CSS.highlights.set('incluaula-reading-word', new Highlight(range));
  return true;
}

/** Reproductor TTS con resaltado sincronizado cuando el navegador lo admite (RF-02, RF-18). */
export function ReadAloud({ rate }) {
  const [state, setState] = useState('idle');
  const [highlightAvailable, setHighlightAvailable] = useState(true);
  const selectionRef = useRef('');
  const supported = speechSupported();

  useEffect(() => {
    const remember = () => {
      const text = window.getSelection?.().toString().trim();
      if (text) selectionRef.current = text;
    };
    document.addEventListener('selectionchange', remember);
    return () => {
      document.removeEventListener('selectionchange', remember);
      if (supported) window.speechSynthesis?.cancel();
      clearWordHighlight();
    };
  }, [supported]);

  function read() {
    const main = document.getElementById('main');
    const selected = window.getSelection?.().toString().trim() || selectionRef.current;
    const pageText = readableText(main);
    const text = selected || pageText;
    const textOffset = selected ? Math.max(0, pageText.indexOf(selected)) : 0;
    selectionRef.current = '';
    if (!text) return;
    window.speechSynthesis.cancel();
    clearWordHighlight();
    setHighlightAvailable(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = rate;
    const voice = window.speechSynthesis.getVoices().find((item) => item.lang?.startsWith('es'));
    if (voice) utterance.voice = voice;
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        setHighlightAvailable(highlightWord(main, textOffset + event.charIndex, event.charLength));
      }
    };
    utterance.onend = () => {
      clearWordHighlight();
      setState('idle');
    };
    utterance.onerror = () => {
      clearWordHighlight();
      setState('idle');
    };
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
    clearWordHighlight();
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
            {status}
            {state === 'playing' && !highlightAvailable
              ? ' El resaltado palabra a palabra no está disponible en este navegador.'
              : ''}{' '}
            <span className="read-aloud-rate">{String(rate).replace('.', ',')}×</span>
          </p>
        </>
      ) : (
        <p role="status">Este navegador no ofrece lectura en voz alta.</p>
      )}
    </section>
  );
}
