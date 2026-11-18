import { useCallback, useEffect, useRef, useState } from 'react';

export class ApiError extends Error {
  constructor(message, { status, code, field } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.field = field;
  }
}

const OFFLINE =
  'No se pudo conectar con el servidor de IncluAula. Comprueba que esté en marcha con «npm run dev».';

export async function api(path, { method = 'GET', body, timeoutMs = 90_000 } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    throw new ApiError(
      error?.name === 'TimeoutError'
        ? 'El servidor tardó demasiado en responder. Intenta de nuevo.'
        : OFFLINE,
    );
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.error?.message ?? OFFLINE, {
      status: res.status,
      code: data?.error?.code,
      field: data?.error?.field,
    });
  }
  return data;
}

export const fileUrl = (path) => `/api${path}`;

/** Guarda un campo de las adaptaciones de un material conservando el resto del borrador. */
export async function saveAdaptation(materialId, field, value, status) {
  const current = await api(
    `/materials/${encodeURIComponent(materialId)}/adaptations?view=docente`,
  );
  const draft = { ...(current.draft ?? current.published) };
  delete draft.approvedAt;
  return api(`/materials/${encodeURIComponent(materialId)}/adaptations`, {
    method: 'PUT',
    body: { ...draft, [field]: value, status },
  });
}

/** Ejecuta una llamada a la API y expone su estado de carga y su error en texto. */
export function useApiAction(fn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });
  const run = useCallback(async (...args) => {
    setLoading(true);
    setError('');
    try {
      return await fnRef.current(...args);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Ocurrió un error inesperado.');
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);
  return { run, loading, error, setError };
}

export function useApiMode() {
  const [mode, setMode] = useState('checking');
  useEffect(() => {
    let active = true;
    api('/health', { timeoutMs: 5000 })
      .then((data) => active && setMode(data.mode))
      .catch(() => active && setMode('offline'));
    return () => {
      active = false;
    };
  }, []);
  return mode;
}
