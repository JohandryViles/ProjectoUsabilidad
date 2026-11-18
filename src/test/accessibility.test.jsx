import { describe, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LazyMotion, domAnimation } from 'framer-motion';
import App from '../App.jsx';

function renderApp(hash = '#/inicio') {
  window.history.replaceState(null, '', `/${hash}`);
  return render(
    <LazyMotion features={domAnimation} strict>
      <App />
    </LazyMotion>,
  );
}

async function expectNoAxeViolations() {
  // jsdom no tiene canvas real; color-contrast se valida por separado desde los tokens CSS.
  const canvas = vi
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockImplementation(function () {
      return {
        canvas: this,
        measureText: (text) => ({ width: text.length * 10 }),
        fillText: () => {},
        clearRect: () => {},
        getImageData: (_x, _y, width, height) => ({
          data: new Uint8ClampedArray(Math.ceil(width * height * 4)).fill(255),
        }),
      };
    });
  let results;
  try {
    results = await axe.run(document.body, {
      rules: { 'color-contrast': { enabled: false } },
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      },
    });
  } finally {
    canvas.mockRestore();
  }
  const summary = results.violations
    .map(
      (violation) =>
        `${violation.id}: ${violation.nodes.map((node) => node.target.join(', ')).join('; ')}`,
    )
    .join('\n');
  expect(results.violations, summary).toEqual([]);
}

describe('axe accessibility audit', () => {
  it('checks the home and library views', async () => {
    renderApp();
    await expectNoAxeViolations();
    await userEvent.setup().click(
      within(screen.getByRole('navigation', { name: 'Navegación principal' })).getByRole('link', {
        name: 'Biblioteca',
      }),
    );
    await waitFor(() => expect(window.location.hash).toBe('#/biblioteca'));
    await expectNoAxeViolations();
  });

  it('checks the student classroom view', async () => {
    renderApp('#/clase');
    await screen.findAllByRole('alert');
    await expectNoAxeViolations();
  });

  it('checks published glossary disclosures and their keyboard accessible content', async () => {
    const responses = {
      'GET /api/health': { ok: true, mode: 'demo' },
      'GET /api/transcripts': { transcripts: [] },
      'GET /api/materials/ecosistemas/adaptations': {
        published: {
          status: 'approved',
          glossary: [
            {
              term: 'Ecosistema',
              definition: 'Los seres vivos y su entorno.',
              example: 'Un bosque.',
            },
          ],
        },
      },
    };
    globalThis.fetch = vi.fn(async (url, init = {}) => {
      const key = `${init.method ?? 'GET'} ${String(url).split('?')[0]}`;
      const data = responses[key];
      return new Response(JSON.stringify(data ?? { error: { message: 'No encontrado' } }), {
        status: data ? 200 : 404,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    const user = userEvent.setup();
    renderApp('#/clase');
    const term = await screen.findByText('Ecosistema');
    await user.click(term);
    expect(screen.getByText('Los seres vivos y su entorno.')).toBeTruthy();
    expect(screen.getByText('Ejemplo: Un bosque.')).toBeTruthy();
    await expectNoAxeViolations();
  });

  it('checks the teacher tools and accessibility preferences dialog', async () => {
    const user = userEvent.setup();
    renderApp('#/herramientas');
    await screen.findByText(/El servidor no está disponible/);
    await expectNoAxeViolations();
    await user.click(screen.getByRole('button', { name: 'Accesibilidad' }));
    await screen.findByRole('dialog', { name: 'Preferencias de accesibilidad' });
    await expectNoAxeViolations();
  });
});
