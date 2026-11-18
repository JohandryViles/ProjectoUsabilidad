import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Switch } from '../components/Switch.jsx';
import { Shapes } from '../components/icons.jsx';
import { PictogramText } from './PictogramView.jsx';

/**
 * Vista de estudiante: muestra solo las adaptaciones aprobadas por el docente
 * (RF-03, RF-15, RF-16, RF-17). Si no hay servidor o nada aprobado, no muestra nada.
 */
export function MaterialAdaptations({ materialId }) {
  const [published, setPublished] = useState(null);
  const [showPictograms, setShowPictograms] = useState(false);

  useEffect(() => {
    let active = true;
    api(`/materials/${encodeURIComponent(materialId)}/adaptations`, { timeoutMs: 8000 })
      .then((data) => active && setPublished(data.published))
      .catch(() => active && setPublished(null));
    return () => {
      active = false;
    };
  }, [materialId]);

  if (!published) return null;
  const { summary, glossary, plain, altTexts, pictogramText } = published;

  return (
    <div className="adaptations">
      {summary?.sections?.length > 0 && (
        <section aria-labelledby="adapt-summary">
          <h3 id="adapt-summary">Resumen en lenguaje claro</h3>
          {summary.keyIdeas?.length > 0 && (
            <div className="key-ideas">
              <h4>Ideas principales</h4>
              <ul>
                {summary.keyIdeas.map((idea) => (
                  <li key={idea}>{idea}</li>
                ))}
              </ul>
            </div>
          )}
          {summary.sections.map((s) => (
            <div key={s.heading}>
              <h4>{s.heading}</h4>
              <ul>
                {s.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
      {glossary?.length > 0 && (
        <section aria-labelledby="adapt-glossary">
          <h3 id="adapt-glossary">Glosario</h3>
          <dl className="glossary">
            {glossary.map((t) => (
              <div key={t.term}>
                <dt>{t.term}</dt>
                <dd>{t.definition}</dd>
                {t.example && <dd className="glossary-example">Ejemplo: {t.example}</dd>}
              </div>
            ))}
          </dl>
        </section>
      )}
      {plain?.simplified && (
        <section aria-labelledby="adapt-plain">
          <h3 id="adapt-plain">Lectura fácil</h3>
          <p className="plain-text">{plain.simplified}</p>
          <details>
            <summary>Ver el texto original</summary>
            <p>{plain.original}</p>
          </details>
        </section>
      )}
      {pictogramText && (
        <section aria-labelledby="adapt-pictos">
          <h3 id="adapt-pictos">Apoyo con pictogramas</h3>
          <Switch
            icon={Shapes}
            label="Mostrar pictogramas"
            description="Añade un pictograma de ARASAAC sobre las palabras principales."
            checked={showPictograms}
            onChange={setShowPictograms}
          />
          {showPictograms ? <PictogramText text={pictogramText} /> : <p>{pictogramText}</p>}
        </section>
      )}
      {altTexts?.length > 0 && (
        <section aria-labelledby="adapt-images">
          <h3 id="adapt-images">Descripción de imágenes</h3>
          {altTexts.map((a) => (
            <div className="image-description" key={a.name}>
              <h4>{a.short}</h4>
              <p>{a.long}</p>
              {a.dataPoints?.length > 0 && (
                <ul>
                  {a.dataPoints.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
