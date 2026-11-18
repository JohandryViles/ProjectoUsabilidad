import { useEffect, useId, useState } from 'react';
import { api, fileUrl } from '../api/client.js';
import { Download } from '../components/icons.jsx';
import { materials } from '../data/materials.js';
import { MaterialAdaptations } from './MaterialAdaptations.jsx';

/** Vista de estudiante: solo expone transcripciones aprobadas y adaptaciones publicadas. */
export function ClassroomPage({ defaultPictograms = false }) {
  const selectId = useId();
  const [materialId, setMaterialId] = useState(materials[0].id);
  const [transcripts, setTranscripts] = useState([]);
  const [transcript, setTranscript] = useState(null);
  const [selectedTranscriptId, setSelectedTranscriptId] = useState('');
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  const material = materials.find((item) => item.id === materialId);
  const approved = transcripts.filter(
    (item) => item.status === 'approved' && item.materialId === materialId,
  );
  const latestApprovedId = approved[0]?.id;

  useEffect(() => {
    let active = true;
    api('/transcripts')
      .then(({ transcripts: items }) => {
        if (!active) return;
        setTranscripts(items);
        setState('ready');
      })
      .catch((cause) => {
        if (!active) return;
        setError(cause.message);
        setState('error');
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setError('');
    setTranscript(null);
    setSelectedTranscriptId(latestApprovedId ?? '');
  }, [latestApprovedId]);

  useEffect(() => {
    let active = true;
    setTranscript(null);
    if (!selectedTranscriptId)
      return () => {
        active = false;
      };
    api(`/transcripts/${encodeURIComponent(selectedTranscriptId)}`)
      .then((item) => active && setTranscript(item))
      .catch((cause) => active && setError(cause.message));
    return () => {
      active = false;
    };
  }, [selectedTranscriptId]);

  return (
    <div className="classroom-page">
      <section className="tool-card" aria-labelledby={`${selectId}-heading`}>
        <h2 id={`${selectId}-heading`}>Contenido de la clase</h2>
        <div className="field">
          <label htmlFor={selectId}>Selecciona una clase</label>
          <select
            id={selectId}
            value={materialId}
            onChange={(event) => setMaterialId(event.target.value)}
          >
            {materials.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} · {item.subject}
              </option>
            ))}
          </select>
        </div>
        <h3>{material.title}</h3>
        <p>{material.description}</p>
      </section>

      <section className="tool-card" aria-labelledby={`${selectId}-transcript`}>
        <div className="tool-heading">
          <div>
            <h2 id={`${selectId}-transcript`}>Transcripción de la clase</h2>
            <p>Solo se muestran transcripciones revisadas y aprobadas por el docente.</p>
          </div>
        </div>
        {state === 'loading' && <p role="status">Cargando transcripciones…</p>}
        {state === 'error' && <p role="alert">{error}</p>}
        {state === 'ready' && error && <p role="alert">{error}</p>}
        {state === 'ready' && !approved.length && (
          <p role="status">Todavía no hay una transcripción aprobada para esta clase.</p>
        )}
        {approved.length > 1 && (
          <div className="field">
            <label htmlFor={`${selectId}-version`}>Versión aprobada</label>
            <select
              id={`${selectId}-version`}
              value={selectedTranscriptId || approved[0].id}
              onChange={(event) => {
                setError('');
                setSelectedTranscriptId(event.target.value);
              }}
            >
              {approved.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title || 'Clase'} · {new Date(item.updatedAt).toLocaleDateString('es')}
                </option>
              ))}
            </select>
          </div>
        )}
        {selectedTranscriptId && !transcript && !error && state === 'ready' && (
          <p role="status">Cargando la transcripción aprobada…</p>
        )}
        {transcript && (
          <>
            <ol className="student-transcript" aria-label="Texto de la clase">
              {transcript.segments.map((segment, index) => (
                <li key={`${segment.start}-${index}`}>
                  <span className="transcript-time">
                    {`${Math.floor(segment.start / 60)}:${String(segment.start % 60).padStart(2, '0')}`}
                  </span>
                  <p>
                    {segment.speaker && <strong>{segment.speaker}: </strong>}
                    {segment.text}
                  </p>
                </li>
              ))}
            </ol>
            <div className="tool-actions">
              <a
                className="button secondary"
                href={fileUrl(`/transcripts/${encodeURIComponent(transcript.id)}/txt`)}
              >
                <Download size={16} /> Descargar texto
              </a>
              <a
                className="button secondary"
                href={fileUrl(`/transcripts/${encodeURIComponent(transcript.id)}/vtt`)}
              >
                <Download size={16} /> Descargar subtítulos
              </a>
            </div>
          </>
        )}
      </section>

      <section className="tool-card" aria-labelledby={`${selectId}-supports`}>
        <h2 id={`${selectId}-supports`}>Material de apoyo aprobado</h2>
        <MaterialAdaptations
          key={materialId}
          materialId={materialId}
          defaultPictograms={defaultPictograms}
        />
      </section>
    </div>
  );
}
