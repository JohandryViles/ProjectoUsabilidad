import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LazyMotion, domAnimation } from 'framer-motion';
import App from '../App.jsx';
import { DEFAULTS, initialPrefs } from '../preferences.js';

function renderApp() {
  return render(
    <LazyMotion features={domAnimation} strict>
      <App />
    </LazyMotion>,
  );
}

async function openPreferences(user) {
  await user.click(screen.getByRole('button', { name: 'Accesibilidad' }));
  return screen.getByRole('dialog', { name: 'Preferencias de accesibilidad' });
}

afterEach(() => {
  delete window.speechSynthesis;
  delete window.SpeechSynthesisUtterance;
  for (const key of Object.keys(document.documentElement.dataset)) {
    delete document.documentElement.dataset[key];
  }
});

describe('preferencias de accesibilidad ampliadas', () => {
  it('applies, persists and resets the new visual and navigation options', async () => {
    const user = userEvent.setup();
    renderApp();
    const dialog = await openPreferences(user);
    await user.click(within(dialog).getByRole('radio', { name: /Extra grande/ }));
    await user.click(within(dialog).getByRole('radio', { name: /Grises/ }));
    for (const name of [
      'Letra más legible',
      'Foco más visible',
      'Resaltar enlaces',
      'Cursor grande',
      'Subtítulos grandes',
      'Pictogramas por defecto',
    ]) {
      await user.click(within(dialog).getByRole('switch', { name }));
    }
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--font-scale')).toBe('1.5');
    expect(root.dataset).toMatchObject({
      saturation: 'gray',
      font: 'legible',
      strongFocus: 'true',
      links: 'underline',
      cursor: 'large',
      captions: 'large',
    });
    expect(initialPrefs()).toMatchObject({
      size: 150,
      saturation: 'gray',
      legibleFont: true,
      strongFocus: true,
      underlineLinks: true,
      bigCursor: true,
      captionsLarge: true,
      pictograms: true,
    });
    await user.click(within(dialog).getByRole('button', { name: 'Restablecer' }));
    expect(initialPrefs()).toEqual(DEFAULTS);
  });

  it('keeps a visible exit control in reading mode', async () => {
    const user = userEvent.setup();
    renderApp();
    const dialog = await openPreferences(user);
    await user.click(within(dialog).getByRole('switch', { name: 'Modo lectura' }));
    await user.click(within(dialog).getByRole('button', { name: 'Listo' }));
    expect(document.documentElement.dataset.reading).toBe('true');
    const bar = screen.getByRole('region', { name: 'Modo lectura activo' });
    await user.click(within(bar).getByRole('button', { name: 'Salir del modo lectura' }));
    expect(document.documentElement.dataset.reading).toBe('false');
    expect(screen.queryByRole('region', { name: 'Modo lectura activo' })).toBeNull();
  });

  it('reads the page aloud at the chosen speed and announces the speed value', async () => {
    const user = userEvent.setup();
    const speak = vi.fn();
    window.speechSynthesis = {
      speak,
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: () => [],
    };
    window.SpeechSynthesisUtterance = class {
      constructor(text) {
        this.text = text;
      }
    };
    renderApp();
    const dialog = await openPreferences(user);
    await user.click(within(dialog).getByRole('switch', { name: 'Lectura en voz alta' }));
    const speed = within(dialog).getByRole('slider', { name: 'Velocidad de lectura' });
    fireEvent.change(speed, { target: { value: '4' } });
    expect(speed.getAttribute('aria-valuetext')).toBe('1,5 veces');
    await user.click(within(dialog).getByRole('button', { name: 'Listo' }));

    const player = screen.getByRole('region', { name: 'Lectura en voz alta' });
    await user.click(within(player).getByRole('button', { name: 'Leer' }));
    expect(speak).toHaveBeenCalledTimes(1);
    expect(speak.mock.calls[0][0]).toMatchObject({ lang: 'es-ES', rate: 1.5 });
    expect(within(player).getByRole('button', { name: 'Pausar' })).toBeTruthy();
    await user.click(within(player).getByRole('button', { name: 'Detener' }));
    expect(within(player).getByRole('button', { name: 'Leer' })).toBeTruthy();
  });

  it('tells the user when the browser has no speech synthesis', async () => {
    const user = userEvent.setup();
    renderApp();
    const dialog = await openPreferences(user);
    expect(within(dialog).getByText('Este navegador no ofrece voz sintética.')).toBeTruthy();
    await user.click(within(dialog).getByRole('switch', { name: 'Lectura en voz alta' }));
    const player = screen.getByRole('region', { name: 'Lectura en voz alta' });
    expect(within(player).getByText(/no ofrece lectura en voz alta/)).toBeTruthy();
  });

  it('ignores invalid stored values for the new options', () => {
    localStorage.setItem(
      'incluaula.preferences.v1',
      JSON.stringify({ saturation: 'neon', ttsRate: 9, tts: 'yes', size: 175 }),
    );
    expect(initialPrefs()).toEqual(DEFAULTS);
  });
});
