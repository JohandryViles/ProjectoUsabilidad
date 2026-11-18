import { useState } from 'react';
import { api, fileUrl, useApiAction } from '../api/client.js';
import { Check, Download, Save, Search } from '../components/icons.jsx';
import { ErrorMessage, formatClock, TextField } from './common.jsx';

const normalize = (value) => value.toLocaleLowerCase('es').normalize('NFD').replace(/[̀-ͯ]/g, '');

/** RF-10: buscar un término, corregir la transcripción y guardar; RF-05: descargar. */
export function TranscriptEditor({ transcript, announce, onSaved }) {
  const [segments, setSegments] = useState(transcript.segments);
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [dirty, setDirty] = useState(false);

  const matches = query.trim()
    ? segments
        .map((s, index) => ({ s, index }))
        .filter(({ s }) => normalize(s.text).includes(normalize(query.trim())))
    : segments.map((s, index) => ({ s, index }));

  const edit = (index, text) => {
    setSegments((list) => list.map((s, i) => (i === index ? { ...s, text } : s)));
    setDirty(true);
  };

  function replaceAll() {
    const term = query.trim();
    if (!term) return;
    const pattern = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let count = 0;
    const next = segments.map((s) => ({
      ...s,
      text: s.text.replace(pattern, () => {
        count++;
        return replacement;
      }),
    }));
    if (count) {
      setSegments(next);
      setDirty(true);
    }
    announce(count ? `Se reemplazaron ${count} coincidencias.` : 'No hay coincidencias exactas.');
  }

  const cleaned = segments.filter((s) => s.text.trim());
  const save = useApiAction(async (status) => {
    const updated = await api(`/transcripts/${transcript.id}`, {
      method: 'PUT',
      body: {
        title: transcript.title,
        materialId: transcript.materialId,
        segments: cleaned,
        status,
      },
    });
    setDirty(false);
    onSaved(updated);
    announce(status === 'approved' ? 'Transcripción aprobada y guardada.' : 'Cambios guardados.');
  });

  return (
    <section className="transcript-editor" aria-labelledby={`editor-${transcript.id}`}>
      <div className="captions-header">
        <h3 id={`editor-${transcript.id}`}>
          Revisar transcripción{transcript.title ? `: ${transcript.title}` : ''}
        </h3>
        <span className="status-pill">
          {transcript.status === 'approved' ? <Check size={14} /> : null}
          {transcript.status === 'approved' ? 'Aprobada' : 'Borrador'}
          {dirty ? ' · cambios sin guardar' : ''}
        </span>
      </div>
      <div className="tool-row">
        <TextField
          label="Buscar un término"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          hint={
            query.trim()
              ? `${matches.length} ${matches.length === 1 ? 'frase coincide' : 'frases coinciden'}.`
              : 'Muestra solo las frases que contienen el término.'
          }
        />
        <TextField
          label="Reemplazar por"
          value={replacement}
          onChange={(e) => setReplacement(e.target.value)}
        />
      </div>
      <div className="tool-actions">
        <button className="button secondary" disabled={!query.trim()} onClick={replaceAll}>
          <Search size={16} /> Reemplazar en todas
        </button>
      </div>
      <ol className="segment-list">
        {matches.map(({ s, index }) => (
          <li key={index}>
            <TextField
              label={`Frase ${index + 1} · ${formatClock(s.start)}`}
              multiline
              rows={2}
              value={s.text}
              onChange={(e) => edit(index, e.target.value)}
            />
          </li>
        ))}
      </ol>
      <div className="tool-actions">
        <button
          className="button secondary"
          disabled={save.loading || !cleaned.length}
          onClick={() => save.run()}
        >
          <Save size={17} /> Guardar cambios
        </button>
        <button
          className="button primary"
          disabled={save.loading || !cleaned.length}
          onClick={() => save.run('approved')}
        >
          <Check size={17} /> Guardar y aprobar
        </button>
      </div>
      <ErrorMessage>
        {cleaned.length ? save.error : 'La transcripción no puede quedar vacía.'}
      </ErrorMessage>
      <div className="tool-actions downloads">
        <a
          className="button secondary"
          href={fileUrl(`/transcripts/${transcript.id}/vtt`)}
          download
        >
          <Download size={16} /> Descargar subtítulos (.vtt)
        </a>
        <a
          className="button secondary"
          href={fileUrl(`/transcripts/${transcript.id}/txt`)}
          download
        >
          <Download size={16} /> Descargar texto (.txt)
        </a>
        {dirty && <p className="field-hint">Guarda los cambios para incluirlos en la descarga.</p>}
      </div>
    </section>
  );
}
