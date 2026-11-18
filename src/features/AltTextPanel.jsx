import { useEffect, useId, useState } from 'react';
import { api, saveAdaptation, useApiAction } from '../api/client.js';
import { ImageIcon, Upload, Wand2 } from '../components/icons.jsx';
import { AiDraftBadge, ApproveButton, ErrorMessage, lines, TextField } from './common.jsx';

export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const SHORT_LIMIT = 125;

export function validateImage(file) {
  if (!file) return 'Selecciona una imagen.';
  if (!IMAGE_TYPES.includes(file.type)) {
    return `El archivo «${file.name}» no es una imagen admitida. Elige un archivo PNG, JPG, WEBP o GIF.`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `La imagen pesa ${mb} MB y el límite es 5 MB. Elige otra imagen o redúcela.`;
  }
  return '';
}

function readBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const KIND = {
  foto: 'Fotografía',
  grafico: 'Gráfico',
  diagrama: 'Diagrama',
  ilustracion: 'Ilustración',
  captura: 'Captura de pantalla',
  otro: 'Otro',
};

/** RF-03 y RF-11: descripción sugerida de imágenes y gráficos, editable antes de publicar. */
export function AltTextPanel({ materialId, announce }) {
  const id = useId();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [fileError, setFileError] = useState('');
  const [context, setContext] = useState('');
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  function choose(candidate) {
    const error = validateImage(candidate);
    setFileError(error);
    setResult(null);
    if (error) {
      setFile(null);
      setPreview('');
      return;
    }
    setFile(candidate);
    setPreview(URL.createObjectURL(candidate));
    announce(`Imagen «${candidate.name}» seleccionada.`);
  }

  const describe = useApiAction(async () => {
    const data = await api('/ai/alt-text', {
      method: 'POST',
      body: {
        imageBase64: await readBase64(file),
        mediaType: file.type,
        context: context.trim() || undefined,
      },
    });
    setResult({ ...data, dataPoints: data.dataPoints.join('\n') });
    announce('Descripción sugerida lista para revisar.');
  });
  const publish = useApiAction(async () => {
    const current = await api(
      `/materials/${encodeURIComponent(materialId)}/adaptations?view=docente`,
    );
    const others = (current.draft?.altTexts ?? []).filter((a) => a.name !== file.name);
    await saveAdaptation(
      materialId,
      'altTexts',
      [
        ...others,
        {
          name: file.name,
          kind: result.kind,
          short: result.short.trim(),
          long: result.long.trim(),
          dataPoints: lines(result.dataPoints),
        },
      ],
      'approved',
    );
    announce('Descripción de la imagen publicada.');
  });

  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const tooLong = result && result.short.length > SHORT_LIMIT;

  return (
    <div className="tool-body">
      <div
        className={`drop-zone ${dragging ? 'dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          choose(e.dataTransfer.files[0]);
        }}
      >
        <ImageIcon size={28} />
        <p id={hintId}>
          Formatos: PNG, JPG, WEBP o GIF. Tamaño máximo: 5 MB. También puedes arrastrar la imagen
          hasta aquí.
        </p>
        <label className="button primary file-button">
          <Upload size={17} /> Seleccionar imagen
          <input
            className="sr-only"
            type="file"
            accept={IMAGE_TYPES.join(',')}
            aria-describedby={[hintId, fileError ? errorId : ''].filter(Boolean).join(' ')}
            aria-invalid={fileError ? true : undefined}
            onChange={(e) => choose(e.target.files[0])}
          />
        </label>
      </div>
      <ErrorMessage id={errorId}>{fileError}</ErrorMessage>

      {file && (
        <div className="image-preview">
          <img src={preview} alt={result?.short || `Vista previa de ${file.name}`} />
          <p className="field-hint">{file.name}</p>
        </div>
      )}
      <TextField
        label="Contexto para la IA (opcional)"
        hint="Ej.: «Gráfico de la clase de Ciencias sobre el ciclo del agua»."
        multiline
        rows={2}
        value={context}
        onChange={(e) => setContext(e.target.value)}
      />
      <div className="tool-actions">
        <button
          className="button primary"
          disabled={!file || describe.loading}
          onClick={() => describe.run()}
        >
          <Wand2 size={17} /> {describe.loading ? 'Analizando imagen…' : 'Sugerir descripción'}
        </button>
      </div>
      <ErrorMessage>{describe.error}</ErrorMessage>

      {result && (
        <fieldset className="ai-result">
          <legend>Descripción de la imagen</legend>
          <AiDraftBadge source={result.source} />
          <div className="field">
            <label htmlFor={`${id}-kind`}>Tipo de imagen</label>
            <select
              id={`${id}-kind`}
              value={result.kind}
              onChange={(e) => setResult((r) => ({ ...r, kind: e.target.value }))}
            >
              {Object.entries(KIND).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <TextField
            label="Texto alternativo breve"
            hint={`${result.short.length} de ${SHORT_LIMIT} caracteres.`}
            error={tooLong ? `Acórtalo a ${SHORT_LIMIT} caracteres o menos.` : ''}
            value={result.short}
            onChange={(e) => setResult((r) => ({ ...r, short: e.target.value }))}
          />
          <TextField
            label="Descripción ampliada"
            multiline
            rows={4}
            value={result.long}
            onChange={(e) => setResult((r) => ({ ...r, long: e.target.value }))}
          />
          <TextField
            label="Datos importantes"
            hint="Uno por línea. En gráficos, incluye los valores principales."
            multiline
            rows={3}
            value={result.dataPoints}
            onChange={(e) => setResult((r) => ({ ...r, dataPoints: e.target.value }))}
          />
          <ApproveButton
            label="Publicar descripción"
            disabled={publish.loading || tooLong || !result.short.trim()}
            onConfirm={() => publish.run()}
          />
          <ErrorMessage>{publish.error}</ErrorMessage>
        </fieldset>
      )}
    </div>
  );
}
