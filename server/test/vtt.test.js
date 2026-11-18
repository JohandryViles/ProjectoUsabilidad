// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { escapeCueText, formatTimestamp, MAX_LINE, toTxt, toVtt, wrapLines } from '../lib/vtt.js';

describe('WebVTT', () => {
  it('formats timestamps as HH:MM:SS.mmm', () => {
    expect(formatTimestamp(0)).toBe('00:00:00.000');
    expect(formatTimestamp(3.2)).toBe('00:00:03.200');
    expect(formatTimestamp(3725.0456)).toBe('01:02:05.046');
    expect(formatTimestamp(-1)).toBe('00:00:00.000');
  });

  it('escapes characters that break cue text', () => {
    expect(escapeCueText('a --> b & <c>')).toBe('a → b &amp; &lt;c&gt;');
  });

  it('wraps lines without cutting words', () => {
    const lines = wrapLines(
      'La fotosíntesis transforma la energía de la luz en energía química para la planta',
    );
    expect(lines.every((l) => l.length <= MAX_LINE)).toBe(true);
    expect(lines.join(' ')).toContain('fotosíntesis transforma');
  });

  it('builds numbered cues of at most two lines with speaker voice tags', () => {
    const vtt = toVtt(
      [
        { start: 4, end: 6, text: 'Segunda frase.' },
        {
          start: 0,
          end: 4,
          text: 'Hoy hablaremos de la fotosíntesis y de cómo las plantas producen alimento con la luz del sol.',
          speaker: 'Docente',
        },
      ],
      { title: 'Clase' },
    );
    expect(vtt.startsWith('WEBVTT - Clase\n\n1\n00:00:00.000 --> ')).toBe(true);
    const cues = vtt.trim().split('\n\n').slice(1);
    for (const cue of cues) {
      const [, timing, ...text] = cue.split('\n');
      expect(timing).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}$/);
      expect(text.length).toBeLessThanOrEqual(2);
    }
    expect(cues[0]).toContain('<v Docente>Hoy');
    expect(cues.at(-1)).toContain('00:00:04.000 --> 00:00:06.000\nSegunda frase.');
  });

  it('exports readable plain text with times and speakers', () => {
    expect(toTxt([{ start: 65, end: 70, text: 'Hola  a todos', speaker: 'Docente' }])).toBe(
      '[00:01:05] Docente: Hola a todos\n',
    );
  });
});
