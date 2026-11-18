import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LazyMotion, domAnimation } from 'framer-motion';
import App from '../App.jsx';

const approvedTranscript = {
  id: 'simulada-01',
  title: 'Clase ficticia de ecosistemas',
  materialId: 'ecosistemas',
  status: 'approved',
  updatedAt: '2026-11-17T12:00:00.000Z',
  segments: [
    {
      start: 0,
      end: 5,
      speaker: 'Docente',
      text: 'Un ecosistema incluye seres vivos y su entorno.',
    },
  ],
};

const publishedAdaptations = {
  status: 'approved',
  summary: {
    keyIdeas: ['Los seres vivos interactúan con su entorno.'],
    sections: [
      { heading: 'Ecosistema', points: ['Incluye seres vivos y elementos del ambiente.'] },
    ],
  },
  glossary: [
    {
      term: 'Hábitat',
      definition: 'Lugar donde vive un ser vivo.',
      example: 'Un estanque puede ser el hábitat de una rana.',
    },
  ],
};

function renderClassroom() {
  window.history.replaceState(null, '', '/#/clase');
  globalThis.fetch = vi.fn(async (url) => {
    const path = String(url).split('?')[0];
    let data;
    if (path === '/api/health') data = { ok: true, mode: 'demo' };
    else if (path === '/api/transcripts') {
      data = {
        transcripts: [
          {
            id: approvedTranscript.id,
            title: approvedTranscript.title,
            materialId: 'ecosistemas',
            status: 'approved',
            updatedAt: approvedTranscript.updatedAt,
            segmentCount: 1,
          },
          {
            id: 'borrador-02',
            title: 'Borrador ficticio',
            materialId: 'ecosistemas',
            status: 'draft',
            updatedAt: approvedTranscript.updatedAt,
            segmentCount: 1,
          },
        ],
      };
    } else if (path === `/api/transcripts/${approvedTranscript.id}`) data = approvedTranscript;
    else if (path === '/api/materials/ecosistemas/adaptations')
      data = { published: publishedAdaptations };
    else data = { error: { message: 'Ruta simulada no disponible' } };
    return new Response(JSON.stringify(data), {
      status: data.error ? 404 : 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  return render(
    <LazyMotion features={domAnimation} strict>
      <App />
    </LazyMotion>,
  );
}

describe('ensayo simulado con contenido ficticio (no equivale a estudio con participantes)', () => {
  it('U1 encuentra y descarga solo la transcripción aprobada', async () => {
    renderClassroom();
    expect(await screen.findByText(approvedTranscript.segments[0].text)).toBeTruthy();
    expect(screen.queryByText('Borrador ficticio')).toBeNull();
    const download = screen.getByRole('link', { name: 'Descargar texto' });
    expect(download.getAttribute('href')).toBe('/api/transcripts/simulada-01/txt');
  });

  it('U3 abre y cierra la definición sin perder el estado de la página', async () => {
    const user = userEvent.setup();
    renderClassroom();
    const term = await screen.findByText('Hábitat');
    expect(screen.getByText('Los seres vivos interactúan con su entorno.')).toBeTruthy();
    await user.click(term);
    expect(screen.getByText('Lugar donde vive un ser vivo.')).toBeTruthy();
    expect(screen.getByText('Ejemplo: Un estanque puede ser el hábitat de una rana.')).toBeTruthy();
    await user.click(term);
    await waitFor(() => expect(term.closest('details').open).toBe(false));
    expect(document.activeElement).toBe(term);
    expect(screen.getByRole('heading', { name: 'La clase, a tu manera.' })).toBeTruthy();
  });
});
