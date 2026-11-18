import { useCallback, useEffect, useRef, useState } from 'react';

const ERRORS = {
  'not-allowed':
    'El navegador no tiene permiso para usar el micrófono. Actívalo desde el icono del candado en la barra de direcciones.',
  'service-not-allowed':
    'El navegador bloqueó el reconocimiento de voz. Revisa los permisos del sitio.',
  'audio-capture': 'No se detecta ningún micrófono. Conecta uno y vuelve a intentarlo.',
  network: 'Se perdió la conexión con el servicio de reconocimiento de voz del navegador.',
};

export function getRecognitionClass() {
  return typeof window === 'undefined'
    ? undefined
    : (window.SpeechRecognition ?? window.webkitSpeechRecognition);
}

/**
 * Reconocimiento de voz en directo con la Web Speech API (Chrome y Edge).
 * Llama a onFinal({ text, start, end }) con tiempos en segundos desde que empezó la sesión.
 */
export function useSpeechRecognition({ lang = 'es-ES', onFinal }) {
  const Recognition = getRecognitionClass();
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const wantedRef = useRef(false);
  const sessionStartRef = useRef(0);
  const utteranceStartRef = useRef(null);
  const onFinalRef = useRef(onFinal);
  useEffect(() => {
    onFinalRef.current = onFinal;
  });

  const elapsed = () => (performance.now() - sessionStartRef.current) / 1000;

  const start = useCallback(
    (offsetSeconds = 0) => {
      if (!Recognition || wantedRef.current) return;
      const recognition = new Recognition();
      recognition.lang = lang;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onstart = () => setListening(true);
      recognition.onresult = (event) => {
        let partial = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          utteranceStartRef.current ??= elapsed();
          if (result.isFinal) {
            const text = result[0].transcript.trim();
            if (text) {
              onFinalRef.current?.({
                text,
                start: utteranceStartRef.current,
                end: Math.max(elapsed(), utteranceStartRef.current + 0.5),
              });
            }
            utteranceStartRef.current = null;
          } else partial += result[0].transcript;
        }
        setInterim(partial);
      };
      recognition.onerror = (event) => {
        if (event.error === 'no-speech' || event.error === 'aborted') return;
        setError(ERRORS[event.error] ?? 'El reconocimiento de voz se detuvo por un error.');
        wantedRef.current = false;
      };
      recognition.onend = () => {
        // Chrome corta la sesión tras un silencio: se reanuda si el docente no la detuvo.
        if (wantedRef.current) {
          try {
            recognition.start();
            return;
          } catch {
            wantedRef.current = false;
          }
        }
        setListening(false);
        setInterim('');
      };
      setError('');
      wantedRef.current = true;
      sessionStartRef.current = performance.now() - offsetSeconds * 1000;
      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        wantedRef.current = false;
        setError('No se pudo iniciar el reconocimiento de voz.');
      }
    },
    [Recognition, lang],
  );

  const stop = useCallback(() => {
    wantedRef.current = false;
    recognitionRef.current?.stop();
  }, []);

  useEffect(
    () => () => {
      wantedRef.current = false;
      recognitionRef.current?.abort?.();
    },
    [],
  );

  return { supported: Boolean(Recognition), listening, interim, error, start, stop, elapsed };
}
