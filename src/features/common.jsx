import { useId, useState } from 'react';
import { Check, CircleAlert, Sparkles } from '../components/icons.jsx';

/** Aviso de que el contenido es una sugerencia de IA. Usa texto e icono, no solo color (1.4.1). */
export function AiDraftBadge({ source }) {
  return (
    <p className="ai-badge">
      <Sparkles size={15} />
      <span>
        Sugerencia de IA{source === 'demo' ? ' (modo demo)' : ''} · revisa y edita antes de publicar
      </span>
    </p>
  );
}

export function ErrorMessage({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className="field-error" role="alert">
      <CircleAlert size={16} />
      <span>{children}</span>
    </p>
  );
}

/** Campo de texto con etiqueta visible, ayuda y error asociados (1.3.1, 3.3.1, 3.3.2). */
export function TextField({ label, hint, error, multiline = false, rows = 4, ...props }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}
      <Tag
        id={id}
        rows={multiline ? rows : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      <ErrorMessage id={errorId}>{error}</ErrorMessage>
    </div>
  );
}

/**
 * Botón de publicación con un paso de confirmación (3.3.4): el contenido de IA
 * solo llega a los estudiantes cuando el docente lo confirma.
 */
export function ApproveButton({ onConfirm, disabled, label = 'Aprobar y publicar', question }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button className="button primary" disabled={disabled} onClick={() => setAsking(true)}>
        <Check size={17} /> {label}
      </button>
    );
  }
  return (
    <div className="confirm-row" role="group" aria-label="Confirmar publicación">
      <p>{question ?? '¿Publicar esta versión para los estudiantes?'}</p>
      <button
        className="button primary"
        autoFocus
        onClick={async () => {
          await onConfirm();
          setAsking(false);
        }}
      >
        Sí, publicar
      </button>
      <button className="button secondary" onClick={() => setAsking(false)}>
        Cancelar
      </button>
    </div>
  );
}

export const lines = (value) =>
  value
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

export const countWords = (value) => (value.match(/\S+/g) ?? []).length;

export function formatClock(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
