import { useState } from 'react';
import { api, saveAdaptation, useApiAction } from '../api/client.js';
import { BookA, Plus, ScrollText, Trash2, Wand2 } from '../components/icons.jsx';
import {
  AiDraftBadge,
  ApproveButton,
  countWords,
  ErrorMessage,
  lines,
  TextField,
} from './common.jsx';

const MAX_SUMMARY_WORDS = 150;

function toEditable(summary) {
  return {
    source: summary.source,
    sections: summary.sections.map((s) => ({ heading: s.heading, points: s.points.join('\n') })),
    keyIdeas: summary.keyIdeas.join('\n'),
  };
}

export function fromEditable(edit) {
  return {
    sections: edit.sections
      .map((s) => ({ heading: s.heading.trim(), points: lines(s.points) }))
      .filter((s) => s.heading || s.points.length),
    keyIdeas: lines(edit.keyIdeas),
  };
}

/** RF-12 y RF-15: resumen en lenguaje claro y glosario, editables y con aprobación docente. */
export function SummaryGlossaryPanel({ text, title, materialId, announce }) {
  const [summary, setSummary] = useState(null);
  const [glossary, setGlossary] = useState(null);

  const generateSummary = useApiAction(async () => {
    setSummary(toEditable(await api('/ai/summary', { method: 'POST', body: { text, title } })));
    announce('Resumen sugerido listo para revisar.');
  });
  const generateGlossary = useApiAction(async () => {
    const result = await api('/ai/glossary', { method: 'POST', body: { text } });
    setGlossary({ source: result.source, terms: result.terms });
    announce(`Glosario sugerido con ${result.terms.length} términos.`);
  });
  const publish = useApiAction(async () => {
    if (summary) await saveAdaptation(materialId, 'summary', fromEditable(summary), 'approved');
    if (glossary) {
      const terms = glossary.terms.filter((t) => t.term.trim() && t.definition.trim());
      await saveAdaptation(materialId, 'glossary', terms, 'approved');
    }
    announce('Resumen y glosario publicados para los estudiantes.');
  });

  const words = summary
    ? countWords(
        summary.sections.map((s) => `${s.heading} ${s.points}`).join(' ') + ' ' + summary.keyIdeas,
      )
    : 0;
  const updateSection = (i, key, value) =>
    setSummary((s) => ({
      ...s,
      sections: s.sections.map((sec, j) => (j === i ? { ...sec, [key]: value } : sec)),
    }));
  const updateTerm = (i, key, value) =>
    setGlossary((g) => ({
      ...g,
      terms: g.terms.map((t, j) => (j === i ? { ...t, [key]: value } : t)),
    }));

  return (
    <div className="tool-body">
      <div className="tool-actions">
        <button
          className="button primary"
          disabled={generateSummary.loading}
          onClick={() => generateSummary.run()}
        >
          <ScrollText size={17} />{' '}
          {generateSummary.loading ? 'Generando resumen…' : 'Sugerir resumen'}
        </button>
        <button
          className="button primary"
          disabled={generateGlossary.loading}
          onClick={() => generateGlossary.run()}
        >
          <BookA size={17} />{' '}
          {generateGlossary.loading ? 'Generando glosario…' : 'Sugerir glosario'}
        </button>
      </div>
      <ErrorMessage>{generateSummary.error || generateGlossary.error}</ErrorMessage>

      {summary && (
        <fieldset className="ai-result" aria-busy={generateSummary.loading}>
          <legend>Resumen</legend>
          <AiDraftBadge source={summary.source} />
          <p className={`word-count ${words > MAX_SUMMARY_WORDS ? 'over' : ''}`}>
            {words} de {MAX_SUMMARY_WORDS} palabras
            {words > MAX_SUMMARY_WORDS ? ' · acórtalo para facilitar la lectura' : ''}
          </p>
          {summary.sections.map((section, i) => (
            <div className="section-editor" key={i}>
              <TextField
                label={`Encabezado del apartado ${i + 1}`}
                value={section.heading}
                onChange={(e) => updateSection(i, 'heading', e.target.value)}
              />
              <TextField
                label={`Puntos del apartado ${i + 1}`}
                hint="Un punto por línea."
                multiline
                rows={3}
                value={section.points}
                onChange={(e) => updateSection(i, 'points', e.target.value)}
              />
            </div>
          ))}
          <TextField
            label="Ideas principales"
            hint="Una idea por línea."
            multiline
            rows={3}
            value={summary.keyIdeas}
            onChange={(e) => setSummary((s) => ({ ...s, keyIdeas: e.target.value }))}
          />
        </fieldset>
      )}

      {glossary && (
        <fieldset className="ai-result">
          <legend>Glosario</legend>
          <AiDraftBadge source={glossary.source} />
          {glossary.terms.length === 0 && (
            <p className="field-hint">La IA no encontró términos difíciles. Puedes añadirlos.</p>
          )}
          {glossary.terms.map((term, i) => (
            <div className="term-editor" key={i}>
              <TextField
                label={`Término ${i + 1}`}
                value={term.term}
                onChange={(e) => updateTerm(i, 'term', e.target.value)}
              />
              <TextField
                label={`Definición de «${term.term || `término ${i + 1}`}»`}
                multiline
                rows={2}
                value={term.definition}
                onChange={(e) => updateTerm(i, 'definition', e.target.value)}
              />
              <TextField
                label="Ejemplo cotidiano"
                value={term.example}
                onChange={(e) => updateTerm(i, 'example', e.target.value)}
              />
              <button
                className="text-button"
                onClick={() => {
                  setGlossary((g) => ({ ...g, terms: g.terms.filter((_, j) => j !== i) }));
                  announce(`Término ${i + 1} eliminado.`);
                }}
              >
                <Trash2 size={15} /> Quitar término {i + 1}
              </button>
            </div>
          ))}
          <button
            className="button secondary"
            onClick={() =>
              setGlossary((g) => ({
                ...g,
                terms: [...g.terms, { term: '', definition: '', example: '' }],
              }))
            }
          >
            <Plus size={16} /> Añadir término
          </button>
        </fieldset>
      )}

      {(summary || glossary) && (
        <div className="tool-actions">
          <ApproveButton
            disabled={publish.loading}
            label={`Aprobar y publicar ${summary && glossary ? 'resumen y glosario' : summary ? 'resumen' : 'glosario'}`}
            onConfirm={() => publish.run()}
          />
          <ErrorMessage>{publish.error}</ErrorMessage>
        </div>
      )}
      {!summary && !glossary && (
        <p className="field-hint">
          <Wand2 size={15} /> Las sugerencias usan el texto de la clase escrito arriba.
        </p>
      )}
    </div>
  );
}
