import express from 'express';
import { AiError } from './lib/ai.js';
import {
  adaptationsInput,
  altTextInput,
  firstIssue,
  summaryInput,
  textInput,
  transcriptInput,
} from './lib/schemas.js';
import { toTxt, toVtt } from './lib/vtt.js';

function sendError(res, status, code, message, field) {
  res.status(status).json({ error: { code, message, ...(field ? { field } : {}) } });
}

/** Valida el cuerpo con Zod y responde 400 con el campo y la forma de corregirlo. */
function validate(schema, body, res) {
  const parsed = schema.safeParse(body ?? {});
  if (parsed.success) return parsed.data;
  const { message, field } = firstIssue(parsed.error);
  sendError(res, 400, 'invalid_input', message, field);
  return null;
}

function rateLimit({ windowMs = 60_000, max = 30 } = {}) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const entry = hits.get(req.ip);
    if (!entry || now - entry.start > windowMs) {
      hits.set(req.ip, { start: now, count: 1 });
      return next();
    }
    if (++entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.start + windowMs - now) / 1000)));
      return sendError(
        res,
        429,
        'rate_limited',
        'Hiciste muchas solicitudes seguidas. Espera un minuto e inténtalo de nuevo.',
      );
    }
    next();
  };
}

const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

export function createApp({ ai, pictos, store, aiRateLimit } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '8mb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true, mode: ai.mode }));

  // --- IA: todas las respuestas son borradores para revisión docente ---------
  const ai_ = express.Router();
  ai_.use(rateLimit(aiRateLimit));
  const aiRoute = (schema, task) =>
    asyncRoute(async (req, res) => {
      const input = validate(schema, req.body, res);
      if (input) res.json(await ai[task](input));
    });
  ai_.post('/summary', aiRoute(summaryInput, 'summary'));
  ai_.post('/glossary', aiRoute(textInput, 'glossary'));
  ai_.post('/plain-language', aiRoute(textInput, 'plain'));
  ai_.post('/alt-text', aiRoute(altTextInput, 'altText'));
  app.use('/api/ai', ai_);

  // --- Pictogramas ARASAAC ---------------------------------------------------
  app.get(
    '/api/pictograms',
    asyncRoute(async (req, res) => {
      const input = validate(textInput, { text: String(req.query.text ?? '') }, res);
      if (input) res.json(await pictos.forText(input.text));
    }),
  );

  // --- Transcripciones y subtítulos -------------------------------------------
  app.get(
    '/api/transcripts',
    asyncRoute(async (_req, res) => res.json({ transcripts: await store.listTranscripts() })),
  );
  app.post(
    '/api/transcripts',
    asyncRoute(async (req, res) => {
      const input = validate(transcriptInput, req.body, res);
      if (input) res.status(201).json(await store.createTranscript(input));
    }),
  );
  const findTranscript = async (req, res) => {
    const transcript = await store.getTranscript(req.params.id);
    if (!transcript) sendError(res, 404, 'not_found', 'No encontramos esa transcripción.');
    return transcript;
  };
  app.get(
    '/api/transcripts/:id',
    asyncRoute(async (req, res) => {
      const transcript = await findTranscript(req, res);
      if (transcript) res.json(transcript);
    }),
  );
  app.put(
    '/api/transcripts/:id',
    asyncRoute(async (req, res) => {
      const input = validate(transcriptInput, req.body, res);
      if (!input) return;
      const updated = await store.updateTranscript(req.params.id, input);
      if (!updated) return sendError(res, 404, 'not_found', 'No encontramos esa transcripción.');
      res.json(updated);
    }),
  );
  for (const [format, type, render] of [
    ['vtt', 'text/vtt', toVtt],
    ['txt', 'text/plain', toTxt],
  ]) {
    app.get(
      `/api/transcripts/:id/${format}`,
      asyncRoute(async (req, res) => {
        const transcript = await findTranscript(req, res);
        if (!transcript) return;
        const name = (transcript.title || 'transcripcion')
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .replace(/[^\w-]+/g, '-')
          .toLowerCase();
        res.type(`${type}; charset=utf-8`);
        res.attachment(`${name}.${format}`);
        res.send(render(transcript.segments, { title: transcript.title }));
      }),
    );
  }

  // --- Adaptaciones por material (borrador del docente / versión publicada) ---
  app.get(
    '/api/materials/:id/adaptations',
    asyncRoute(async (req, res) => {
      const record = await store.getAdaptations(req.params.id);
      // La vista de estudiante solo recibe lo aprobado (RF-12, RF-13).
      if (req.query.view === 'docente') return res.json(record ?? { draft: null, published: null });
      res.json({ published: record?.published ?? null });
    }),
  );
  app.put(
    '/api/materials/:id/adaptations',
    asyncRoute(async (req, res) => {
      const input = validate(adaptationsInput, req.body, res);
      if (!input) return;
      const { status, ...content } = input;
      const previous = (await store.getAdaptations(req.params.id)) ?? {};
      const version = {
        ...content,
        approvedAt: status === 'approved' ? new Date().toISOString() : undefined,
      };
      const saved = await store.saveAdaptations(req.params.id, {
        draft: version,
        published: status === 'approved' ? version : (previous.published ?? null),
      });
      res.json(saved);
    }),
  );

  app.use('/api', (_req, res) => sendError(res, 404, 'not_found', 'Ruta de la API no encontrada.'));

  app.use((error, _req, res, _next) => {
    if (error instanceof AiError) return sendError(res, error.status, error.code, error.message);
    if (error.type === 'entity.too.large') {
      return sendError(res, 413, 'too_large', 'El archivo es demasiado grande. El límite es 5 MB.');
    }
    if (error.type === 'entity.parse.failed') {
      return sendError(res, 400, 'invalid_json', 'La solicitud no tiene un formato válido.');
    }
    console.error(error);
    sendError(res, 500, 'internal', 'Ocurrió un error inesperado en el servidor.');
  });

  return app;
}
