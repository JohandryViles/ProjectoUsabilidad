import { useEffect, useId, useRef, useState } from 'react';
import { api, useApiAction } from '../api/client.js';
import { Switch } from '../components/Switch.jsx';
import { Captions, Mic, MicOff, Pause, Play, Plus, Save } from '../components/icons.jsx';
import { ErrorMessage, formatClock, TextField } from './common.jsx';
import { TranscriptEditor } from './TranscriptEditor.jsx';
import { useSpeechRecognition } from './useSpeechRecognition.js';

/** RF-01, RF-08: subtítulos en directo y estado del micrófono. */
export function LiveCaptions({ announce, materialId, onUseAsText }) {
  const [segments, setSegments] = useState([]);
  const [speaker, setSpeaker] = useState('Docente');
  const [title, setTitle] = useState('');
  const [manual, setManual] = useState('');
  const [follow, setFollow] = useState(true);
  const [speak, setSpeak] = useState(false);
  const [transcript, setTranscript] = useState(null);
  const [savedList, setSavedList] = useState([]);
  const logRef = useRef(null);
  const statusId = useId();

  const addSegment = (segment) =>
    setSegments((list) => [...list, { ...segment, speaker: speaker.trim() || undefined }]);

  const speech = useSpeechRecognition({ onFinal: addSegment });
  const lastEnd = segments.at(-1)?.end ?? 0;

  useEffect(() => {
    if (follow && logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [segments, speech.interim, follow]);

  useEffect(() => {
    api('/transcripts', { timeoutMs: 5000 })
      .then((data) => setSavedList(data.transcripts))
      .catch(() => {});
  }, [transcript]);

  const save = useApiAction(async () => {
    const created = await api('/transcripts', {
      method: 'POST',
      body: { title: title.trim() || undefined, materialId, segments },
    });
    setTranscript(created);
    announce('Transcripción guardada. Ya puedes revisarla y descargarla.');
  });
  const open = useApiAction(async (id) => setTranscript(await api(`/transcripts/${id}`)));

  function addManual(event) {
    event.preventDefault();
    const text = manual.trim();
    if (!text) return;
    const start = speech.listening ? speech.elapsed() : lastEnd;
    const duration = Math.max(1.5, (text.match(/\S+/g)?.length ?? 1) * 0.4);
    addSegment({ text, start, end: start + duration });
    setManual('');
  }

  const micStatus = speech.listening
    ? 'Micrófono activo: se están generando subtítulos.'
    : 'Micrófono inactivo.';

  return (
    <div className="tool-body">
      {!speech.supported && (
        <p className="help-note" role="note">
          <MicOff size={20} />
          <span>
            Este navegador no ofrece reconocimiento de voz. Usa Chrome o Edge para generar
            subtítulos automáticos, o escribe las frases a mano en el campo de abajo.
          </span>
        </p>
      )}
      <div className="tool-row">
        <TextField
          label="Título de la clase"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej.: La fotosíntesis"
        />
        <TextField
          label="Quién habla"
          hint="Se añade a cada frase del VTT."
          value={speaker}
          onChange={(e) => setSpeaker(e.target.value)}
        />
      </div>
      <div className="tool-actions">
        {speech.supported && (
          <button
            className="button primary"
            aria-describedby={statusId}
            onClick={() => (speech.listening ? speech.stop() : speech.start(lastEnd))}
          >
            {speech.listening ? <MicOff size={18} /> : <Mic size={18} />}
            {speech.listening ? 'Detener captura' : 'Iniciar captura'}
          </button>
        )}
        <p id={statusId} className={`mic-status ${speech.listening ? 'on' : ''}`} role="status">
          <span className="mic-dot" aria-hidden="true" />
          {speech.supported ? micStatus : 'Subtítulos manuales.'}
        </p>
      </div>
      <ErrorMessage>{speech.error}</ErrorMessage>

      <div className="captions-header">
        <h3>
          <Captions size={18} /> Subtítulos
        </h3>
        <button className="button secondary" onClick={() => setFollow((f) => !f)}>
          {follow ? <Pause size={16} /> : <Play size={16} />}
          {follow ? 'Pausar desplazamiento' : 'Volver al directo'}
        </button>
      </div>
      <div
        ref={logRef}
        className="captions-log"
        tabIndex={0}
        role="log"
        aria-label="Subtítulos de la clase"
        aria-live={speak ? 'polite' : 'off'}
      >
        {segments.length === 0 && !speech.interim && (
          <p className="captions-empty">Los subtítulos aparecerán aquí.</p>
        )}
        {segments.map((s, i) => (
          <p key={i}>
            <span className="caption-time">{formatClock(s.start)}</span>
            {s.speaker && <strong>{s.speaker}: </strong>}
            {s.text}
          </p>
        ))}
        {speech.interim && (
          <p className="caption-interim" aria-hidden="true">
            {speech.interim}…
          </p>
        )}
      </div>
      <Switch
        icon={Captions}
        label="Leer los subtítulos con el lector de pantalla"
        description="Desactivado por defecto para no interrumpir el audio de la clase."
        checked={speak}
        onChange={setSpeak}
      />
      <form className="manual-caption" onSubmit={addManual}>
        <TextField
          label="Añadir una frase a mano"
          hint="Útil si el reconocimiento falla o para corregir en directo."
          value={manual}
          onChange={(e) => setManual(e.target.value)}
        />
        <button className="button secondary" type="submit">
          <Plus size={16} /> Añadir frase
        </button>
      </form>
      <div className="tool-actions">
        <button
          className="button primary"
          disabled={!segments.length || save.loading || speech.listening}
          onClick={() => save.run()}
        >
          <Save size={17} /> {save.loading ? 'Guardando…' : 'Guardar transcripción'}
        </button>
        {segments.length > 0 && (
          <button
            className="button secondary"
            onClick={() => {
              onUseAsText(segments.map((s) => s.text).join(' '));
              announce('Transcripción copiada al texto de la clase.');
            }}
          >
            Usar como texto de la clase
          </button>
        )}
        {speech.listening && segments.length > 0 && (
          <p className="field-hint">Detén la captura para guardar.</p>
        )}
      </div>
      <ErrorMessage>{save.error}</ErrorMessage>

      {savedList.length > 0 && (
        <div className="field">
          <label htmlFor={`${statusId}-open`}>Abrir una transcripción guardada</label>
          <select
            id={`${statusId}-open`}
            value={transcript?.id ?? ''}
            onChange={(e) => e.target.value && open.run(e.target.value)}
          >
            <option value="">Selecciona una transcripción…</option>
            {savedList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title || 'Sin título'} · {t.segmentCount} frases ·{' '}
                {t.status === 'approved' ? 'aprobada' : 'borrador'}
              </option>
            ))}
          </select>
          <ErrorMessage>{open.error}</ErrorMessage>
        </div>
      )}

      {transcript && (
        <TranscriptEditor
          key={transcript.id}
          transcript={transcript}
          announce={announce}
          onSaved={setTranscript}
        />
      )}
    </div>
  );
}
