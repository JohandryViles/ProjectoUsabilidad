import { useRef, useState } from 'react';
import { api, saveAdaptation, useApiAction } from '../api/client.js';
import { Wand2 } from '../components/icons.jsx';
import { AiDraftBadge, ApproveButton, ErrorMessage, TextField } from './common.jsx';

/** RF-21 «Explicar más fácil» y RF-13 versión de lectura fácil, sin perder el original. */
export function PlainLanguagePanel({ sourceText, materialId, announce }) {
  const [paragraph, setParagraph] = useState('');
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  const simplify = useApiAction(async () => {
    const data = await api('/ai/plain-language', { method: 'POST', body: { text: paragraph } });
    setResult(data);
    announce('Versión más fácil lista. El texto original se conserva al lado.');
  });
  const publish = useApiAction(async () => {
    await saveAdaptation(
      materialId,
      'plain',
      { original: result.original, simplified: result.simplified },
      'approved',
    );
    announce('Versión de lectura fácil publicada.');
  });

  const firstParagraph = sourceText.split(/\n\s*\n/)[0]?.trim();

  return (
    <div className="tool-body">
      <TextField
        label="Párrafo a simplificar"
        hint="Pega un párrafo o cópialo del texto de la clase."
        multiline
        rows={4}
        value={paragraph}
        ref={inputRef}
        onChange={(e) => setParagraph(e.target.value)}
      />
      <div className="tool-actions">
        {firstParagraph && (
          <button className="button secondary" onClick={() => setParagraph(firstParagraph)}>
            Copiar el primer párrafo de la clase
          </button>
        )}
        <button
          className="button primary"
          disabled={simplify.loading || !paragraph.trim()}
          onClick={() => simplify.run()}
        >
          <Wand2 size={17} /> {simplify.loading ? 'Simplificando…' : 'Explicar más fácil'}
        </button>
      </div>
      <ErrorMessage>{simplify.error}</ErrorMessage>

      {result && (
        <div className="ai-result">
          <AiDraftBadge source={result.source} />
          <div className="compare">
            <section aria-labelledby="plain-original">
              <h3 id="plain-original">Texto original</h3>
              <p className="original-text">{result.original}</p>
            </section>
            <section aria-labelledby="plain-simple">
              <h3 id="plain-simple">Versión más fácil</h3>
              <TextField
                label="Edita la versión más fácil"
                multiline
                rows={6}
                value={result.simplified}
                onChange={(e) => setResult((r) => ({ ...r, simplified: e.target.value }))}
              />
            </section>
          </div>
          {result.changes?.length > 0 && (
            <>
              <h3>Qué cambió</h3>
              <ul className="change-list">
                {result.changes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </>
          )}
          <div className="tool-actions">
            <button
              className="button secondary"
              onClick={() => {
                setResult(null);
                announce('Se muestra de nuevo el texto original.');
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
            >
              Volver al original
            </button>
            <ApproveButton
              label="Publicar como lectura fácil"
              disabled={publish.loading}
              onConfirm={() => publish.run()}
            />
          </div>
          <ErrorMessage>{publish.error}</ErrorMessage>
        </div>
      )}
    </div>
  );
}
