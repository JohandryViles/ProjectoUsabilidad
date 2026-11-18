// @vitest-environment node
import Anthropic from '@anthropic-ai/sdk';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import { createAiService, MODEL } from '../lib/ai.js';
import { createPictogramService } from '../lib/arasaac.js';
import { createMemoryStore } from '../lib/store.js';

const TEXT =
  'La fotosíntesis es el proceso por el cual las plantas producen su alimento. Usan la luz del sol, el agua y el dióxido de carbono. Como resultado liberan oxígeno.';

async function serve(deps) {
  const app = createApp({
    ai: createAiService(),
    pictos: createPictogramService({ fetchImpl: async () => ({ ok: false }) }),
    store: createMemoryStore(),
    ...deps,
  });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const call = async (path, { method = 'GET', body } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const type = res.headers.get('content-type') ?? '';
    return {
      status: res.status,
      type,
      headers: res.headers,
      body: type.includes('json') ? await res.json() : await res.text(),
    };
  };
  return { server, call };
}

describe('API en modo demo', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await serve();
  });
  afterAll(() => ctx.server.close());

  it('reports the AI mode', async () => {
    expect((await ctx.call('/health')).body).toEqual({ ok: true, mode: 'demo' });
  });

  it('returns editable drafts for summary, glossary and plain language', async () => {
    const summary = await ctx.call('/ai/summary', { method: 'POST', body: { text: TEXT } });
    expect(summary.status).toBe(200);
    expect(summary.body.sections.length).toBeGreaterThan(0);
    expect(summary.body).toMatchObject({ source: 'demo', requiresReview: true });

    const glossary = await ctx.call('/ai/glossary', { method: 'POST', body: { text: TEXT } });
    expect(glossary.body.terms.map((t) => t.term)).toContain('fotosíntesis');

    const plain = await ctx.call('/ai/plain-language', { method: 'POST', body: { text: TEXT } });
    expect(plain.body.original).toBe(TEXT);
    expect(plain.body.simplified.length).toBeGreaterThan(0);
  });

  it('explains invalid input in Spanish and names the field', async () => {
    const empty = await ctx.call('/ai/summary', { method: 'POST', body: {} });
    expect(empty.status).toBe(400);
    expect(empty.body.error.field).toBe('text');
    expect(empty.body.error.message).toMatch(/texto/i);

    const big = 'A'.repeat(Math.ceil((5 * 1024 * 1024 * 4) / 3) + 100);
    const tooBig = await ctx.call('/ai/alt-text', {
      method: 'POST',
      body: { imageBase64: big, mediaType: 'image/png' },
    });
    expect(tooBig.status).toBe(400);
    expect(tooBig.body.error.message).toMatch(/5 MB/);

    const badType = await ctx.call('/ai/alt-text', {
      method: 'POST',
      body: { imageBase64: 'AAAA', mediaType: 'application/pdf' },
    });
    expect(badType.status).toBe(400);
    expect(badType.body.error).toMatchObject({ field: 'mediaType' });
    expect(badType.body.error.message).toMatch(/PNG, JPG/);
  });

  it('stores, corrects and exports transcripts as VTT and TXT', async () => {
    const created = await ctx.call('/transcripts', {
      method: 'POST',
      body: {
        title: 'Clase de Ciencias',
        segments: [{ start: 0, end: 2, text: 'La fotosintesis', speaker: 'Docente' }],
      },
    });
    expect(created.status).toBe(201);
    const { id } = created.body;

    const updated = await ctx.call(`/transcripts/${id}`, {
      method: 'PUT',
      body: {
        title: 'Clase de Ciencias',
        segments: [{ start: 0, end: 2, text: 'La fotosíntesis', speaker: 'Docente' }],
        status: 'approved',
      },
    });
    expect(updated.body.status).toBe('approved');

    const vtt = await ctx.call(`/transcripts/${id}/vtt`);
    expect(vtt.type).toContain('text/vtt');
    expect(vtt.headers.get('content-disposition')).toContain('clase-de-ciencias.vtt');
    expect(vtt.body).toContain('<v Docente>La fotosíntesis');

    const txt = await ctx.call(`/transcripts/${id}/txt`);
    expect(txt.type).toContain('text/plain');
    expect((await ctx.call('/transcripts/no-existe/vtt')).status).toBe(404);
  });

  it('only publishes approved adaptations to students', async () => {
    const draft = { status: 'draft', summary: { sections: [], keyIdeas: ['borrador'] } };
    await ctx.call('/materials/geometria/adaptations', { method: 'PUT', body: draft });
    expect((await ctx.call('/materials/geometria/adaptations')).body.published).toBeNull();
    const teacher = await ctx.call('/materials/geometria/adaptations?view=docente');
    expect(teacher.body.draft.summary.keyIdeas).toEqual(['borrador']);

    await ctx.call('/materials/geometria/adaptations', {
      method: 'PUT',
      body: { ...draft, status: 'approved' },
    });
    await ctx.call('/materials/geometria/adaptations', {
      method: 'PUT',
      body: { status: 'draft', summary: { sections: [], keyIdeas: ['nuevo borrador'] } },
    });
    const student = await ctx.call('/materials/geometria/adaptations');
    expect(student.body.published.summary.keyIdeas).toEqual(['borrador']);
  });
});

describe('API con Claude', () => {
  function fakeClient(response) {
    return { beta: { messages: { parse: vi.fn(async () => response) } } };
  }

  it('sends the schema and the material as data, and returns the parsed output', async () => {
    const client = fakeClient({
      stop_reason: 'end_turn',
      parsed_output: { sections: [{ heading: 'Idea', points: ['Punto'] }], keyIdeas: ['Idea'] },
    });
    const { server, call } = await serve({ ai: createAiService({ client }) });
    const res = await call('/ai/summary', {
      method: 'POST',
      body: { text: TEXT, title: 'Plantas' },
    });
    server.close();

    expect(res.body).toMatchObject({ source: 'claude', keyIdeas: ['Idea'] });
    const params = client.beta.messages.parse.mock.calls[0][0];
    expect(params.model).toBe(MODEL);
    expect(params.output_config.format.type).toBe('json_schema');
    expect(params.messages[0].content).toContain(`<material>\n${TEXT}\n</material>`);
  });

  it('sends images as base64 content blocks', async () => {
    const client = fakeClient({
      stop_reason: 'end_turn',
      parsed_output: { kind: 'grafico', short: 'Barras', long: 'Largo', dataPoints: [] },
    });
    const { server, call } = await serve({ ai: createAiService({ client }) });
    await call('/ai/alt-text', {
      method: 'POST',
      body: { imageBase64: 'iVBORw0KGgo=', mediaType: 'image/png' },
    });
    server.close();
    const [image] = client.beta.messages.parse.mock.calls[0][0].messages[0].content;
    expect(image).toEqual({
      type: 'image',
      source: { type: 'base64', media_type: 'image/png', data: 'iVBORw0KGgo=' },
    });
  });

  it('turns a refusal into a 502 with guidance instead of empty content', async () => {
    const client = fakeClient({ stop_reason: 'refusal', parsed_output: null });
    const { server, call } = await serve({ ai: createAiService({ client }) });
    const res = await call('/ai/glossary', { method: 'POST', body: { text: TEXT } });
    server.close();
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('ai_refusal');
  });

  it('maps SDK rate limits to a 503 in Spanish', async () => {
    const error = new Anthropic.RateLimitError(429, {}, 'rate limited', new Headers());
    const client = { beta: { messages: { parse: vi.fn(async () => Promise.reject(error)) } } };
    const { server, call } = await serve({ ai: createAiService({ client }) });
    const res = await call('/ai/plain-language', { method: 'POST', body: { text: TEXT } });
    server.close();
    expect(res.status).toBe(503);
    expect(res.body.error.message).toMatch(/ocupado/);
  });
});

describe('Pictogramas ARASAAC', () => {
  it('looks up content words once, skips stopwords and includes attribution', async () => {
    const fetchImpl = vi.fn(async (url) => {
      const word = decodeURIComponent(url.split('/').at(-1));
      if (word === 'perro') return { ok: true, json: async () => [{ _id: 2517 }] };
      return { ok: false };
    });
    const service = createPictogramService({ fetchImpl });
    const result = await service.forText('El perro y el perro.');
    expect(result.tokens.map((t) => t.word)).toEqual(['El', 'perro', 'y', 'el', 'perro', '.']);
    expect(result.tokens[1].pictogram).toEqual({
      id: 2517,
      url: 'https://static.arasaac.org/pictograms/2517/2517_300.png',
      keyword: 'perro',
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.attribution.license).toMatch(/CC BY-NC-SA/);
  });
});
