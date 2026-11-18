import { Fragment, useEffect, useState } from 'react';
import { api, saveAdaptation, useApiAction } from '../api/client.js';
import { Shapes } from '../components/icons.jsx';
import { ApproveButton, ErrorMessage } from './common.jsx';

/**
 * Texto acompañado de pictogramas de ARASAAC (RF-17). La palabra se muestra
 * siempre debajo del pictograma, por eso la imagen es decorativa (alt="").
 */
export function PictogramText({ text }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setError('');
    api(`/pictograms?text=${encodeURIComponent(text)}`)
      .then((result) => active && setData(result))
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [text]);

  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (!data) return <p className="field-hint">Cargando pictogramas…</p>;
  return (
    <figure className="pictogram-figure">
      <p className="pictogram-text">
        {data.tokens.map((token, i) => (
          <Fragment key={i}>
            {token.pictogram ? (
              <span className="picto">
                <img src={token.pictogram.url} alt="" width="72" height="72" loading="lazy" />
                <span>{token.word}</span>
              </span>
            ) : (
              <span className="picto-plain">{token.word}</span>
            )}{' '}
          </Fragment>
        ))}
      </p>
      <figcaption>
        <a href={data.attribution.url} target="_blank" rel="noreferrer">
          {data.attribution.text}
        </a>
      </figcaption>
    </figure>
  );
}

/** Vista previa y publicación de la versión con pictogramas (RF-13). */
export function PictogramPanel({ sourceText, materialId, announce }) {
  const [shown, setShown] = useState('');
  const publish = useApiAction(async () => {
    await saveAdaptation(materialId, 'pictogramText', shown, 'approved');
    announce('Versión con pictogramas publicada.');
  });
  const short =
    sourceText
      .split(/\n\s*\n/)[0]
      ?.trim()
      .slice(0, 400) ?? '';

  return (
    <div className="tool-body">
      <p className="field-hint">
        Se usa el primer párrafo del texto de la clase (hasta 400 caracteres). Los pictogramas
        funcionan mejor con frases cortas en lectura fácil.
      </p>
      <div className="tool-actions">
        <button
          className="button primary"
          disabled={short.length < 20}
          onClick={() => {
            setShown(short);
            announce('Vista con pictogramas generada.');
          }}
        >
          <Shapes size={17} /> Ver con pictogramas
        </button>
      </div>
      {short.length < 20 && (
        <p className="field-hint">Escribe al menos 20 caracteres en el texto de la clase.</p>
      )}
      {shown && (
        <div className="ai-result">
          <PictogramText text={shown} />
          <p className="field-hint">
            Revisa que cada pictograma corresponda al sentido de la palabra antes de publicar.
          </p>
          <ApproveButton
            label="Publicar versión con pictogramas"
            disabled={publish.loading}
            onConfirm={() => publish.run()}
          />
          <ErrorMessage>{publish.error}</ErrorMessage>
        </div>
      )}
    </div>
  );
}
