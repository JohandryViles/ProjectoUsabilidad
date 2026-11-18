import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LazyMotion, domAnimation } from 'framer-motion';
import App from '../App.jsx';
import { validateImage } from '../features/AltTextPanel.jsx';

const TEXT =
  'La fotosíntesis es el proceso por el cual las plantas producen su alimento. Usan la luz del sol.';

function jsonResponse(body, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

/** Simula el backend: cada ruta devuelve lo indicado; el resto, 404. */
function mockApi(routes) {
  globalThis.fetch = vi.fn((url, init = {}) => {
    const key = `${init.method ?? 'GET'} ${String(url).split('?')[0]}`;
    const handler = routes[key];
    if (!handler) return jsonResponse({ error: { message: 'No encontrado' } }, 404);
    return jsonResponse(...[].concat(handler(init)));
  });
}

function renderTools() {
  window.history.replaceState(null, '', '/#/herramientas');
  return render(
    <LazyMotion features={domAnimation} strict>
      <App />
    </LazyMotion>,
  );
}

describe('herramientas de IA (integrante B)', () => {
  it('exposes each tool as a named region and reports when the server is offline', async () => {
    renderTools();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Herramientas de IA para el aula.',
    );
    for (const name of [
      'Subtítulos en directo y transcripción',
      'Resumen y glosario',
      'Explicar más fácil',
      'Descripción de imágenes',
      'Pictogramas',
    ]) {
      expect(screen.getByRole('region', { name })).toBeTruthy();
    }
    expect(await screen.findByText(/El servidor no está disponible/)).toBeTruthy();
  });

  it('offers manual captions when the browser has no speech recognition', async () => {
    const user = userEvent.setup();
    renderTools();
    const captions = screen.getByRole('region', { name: 'Subtítulos en directo y transcripción' });
    expect(within(captions).getByText(/no ofrece reconocimiento de voz/)).toBeTruthy();
    expect(within(captions).queryByRole('button', { name: 'Iniciar captura' })).toBeNull();
    await user.type(within(captions).getByLabelText('Añadir una frase a mano'), 'Hola a todos');
    await user.click(within(captions).getByRole('button', { name: 'Añadir frase' }));
    const log = within(captions).getByRole('log', { name: 'Subtítulos de la clase' });
    expect(log.textContent).toContain('Hola a todos');
    // Los subtítulos no se leen en voz alta por defecto (F3 4.1.3).
    expect(log.getAttribute('aria-live')).toBe('off');
  });

  it('keeps the original paragraph when returning from the simplified version', async () => {
    const user = userEvent.setup();
    mockApi({
      'GET /api/health': () => ({ ok: true, mode: 'demo' }),
      'POST /api/ai/plain-language': (init) => ({
        original: JSON.parse(init.body).text,
        simplified: 'Las plantas hacen su comida con luz.',
        changes: ['Frases más cortas.'],
        source: 'demo',
        requiresReview: true,
      }),
    });
    renderTools();
    const panel = screen.getByRole('region', { name: 'Explicar más fácil' });
    const input = within(panel).getByLabelText('Párrafo a simplificar');
    await user.type(input, TEXT);
    await user.click(within(panel).getByRole('button', { name: 'Explicar más fácil' }));
    expect(await within(panel).findByText(/Sugerencia de IA \(modo demo\)/)).toBeTruthy();
    expect(within(panel).getByLabelText('Edita la versión más fácil').value).toBe(
      'Las plantas hacen su comida con luz.',
    );
    expect(within(panel).getByRole('region', { name: 'Texto original' }).textContent).toContain(
      TEXT,
    );
    await user.click(within(panel).getByRole('button', { name: 'Volver al original' }));
    expect(within(panel).getByLabelText('Párrafo a simplificar').value).toBe(TEXT);
  });

  it('publishes the summary only after the teacher confirms', async () => {
    const user = userEvent.setup();
    const saved = [];
    mockApi({
      'GET /api/health': () => ({ ok: true, mode: 'demo' }),
      'POST /api/ai/summary': () => ({
        sections: [{ heading: 'Las plantas', points: ['Producen su alimento.'] }],
        keyIdeas: ['Las plantas usan la luz.'],
        source: 'claude',
        requiresReview: true,
      }),
      'GET /api/materials/ecosistemas/adaptations': () => ({ draft: null, published: null }),
      'PUT /api/materials/ecosistemas/adaptations': (init) => {
        saved.push(JSON.parse(init.body));
        return { ok: true };
      },
    });
    renderTools();
    await user.type(screen.getByLabelText('Texto de la clase'), TEXT);
    const panel = screen.getByRole('region', { name: 'Resumen y glosario' });
    await user.click(within(panel).getByRole('button', { name: 'Sugerir resumen' }));
    const heading = await within(panel).findByLabelText('Encabezado del apartado 1');
    await user.clear(heading);
    await user.type(heading, 'Cómo comen las plantas');
    await user.click(within(panel).getByRole('button', { name: 'Aprobar y publicar resumen' }));
    expect(saved).toHaveLength(0);
    await user.click(within(panel).getByRole('button', { name: 'Sí, publicar' }));
    await waitFor(() => expect(saved).toHaveLength(1));
    expect(saved[0]).toMatchObject({
      status: 'approved',
      summary: { sections: [{ heading: 'Cómo comen las plantas' }] },
    });
  });

  it('rejects unsupported or oversized images with a text explanation', async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderTools();
    const panel = screen.getByRole('region', { name: 'Descripción de imágenes' });
    expect(within(panel).getByText(/PNG, JPG, WEBP o GIF. Tamaño máximo: 5 MB/)).toBeTruthy();
    const input = within(panel).getByLabelText('Seleccionar imagen');
    await user.upload(input, new File(['%PDF'], 'tema.pdf', { type: 'application/pdf' }));
    expect(within(panel).getByRole('alert').textContent).toMatch(/«tema.pdf» no es una imagen/);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(within(panel).getByRole('button', { name: 'Sugerir descripción' }).disabled).toBe(true);

    expect(validateImage({ name: 'g.png', type: 'image/png', size: 6 * 1024 * 1024 })).toMatch(
      /6.0 MB y el límite es 5 MB/,
    );
    expect(validateImage({ name: 'g.png', type: 'image/png', size: 1024 })).toBe('');
  });
});
