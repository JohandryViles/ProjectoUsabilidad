// Generación de subtítulos WebVTT y texto plano a partir de segmentos
// { start, end, text, speaker? } con tiempos en segundos.

export const MAX_LINE = 42;
export const MAX_LINES = 2;

export function formatTimestamp(seconds) {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const ms = totalMs % 1000;
  const totalS = Math.floor(totalMs / 1000);
  const pad = (n, size = 2) => String(n).padStart(size, '0');
  return `${pad(Math.floor(totalS / 3600))}:${pad(Math.floor(totalS / 60) % 60)}:${pad(totalS % 60)}.${pad(ms, 3)}`;
}

export function escapeCueText(text) {
  return text
    .replace(/-->/g, '→')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Divide el texto en líneas de hasta MAX_LINE caracteres sin cortar palabras. */
export function wrapLines(text, max = MAX_LINE) {
  const lines = [];
  let current = '';
  for (const word of text.split(' ').filter(Boolean)) {
    if (!current) current = word;
    else if (current.length + 1 + word.length <= max) current += ` ${word}`;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Convierte un segmento en uno o más cues de hasta MAX_LINES líneas, repartiendo el tiempo. */
function toCues(segment) {
  const lines = wrapLines(escapeCueText(segment.text));
  const groups = [];
  for (let i = 0; i < lines.length; i += MAX_LINES) groups.push(lines.slice(i, i + MAX_LINES));
  const totalChars = lines.join('').length || 1;
  const duration = Math.max(segment.end - segment.start, 0.5);
  let cursor = segment.start;
  return groups.map((group) => {
    const share = (group.join('').length / totalChars) * duration;
    const cue = { start: cursor, end: cursor + share, lines: group };
    cursor += share;
    return cue;
  });
}

export function toVtt(segments, { title } = {}) {
  const header = title ? `WEBVTT - ${escapeCueText(title)}` : 'WEBVTT';
  const blocks = [];
  let n = 1;
  for (const segment of [...segments].sort((a, b) => a.start - b.start)) {
    const speaker = segment.speaker
      ? segment.speaker.replace(/[<>&]/g, '').replace(/\s+/g, ' ').trim()
      : '';
    for (const cue of toCues(segment)) {
      const body = speaker ? [`<v ${speaker}>${cue.lines[0]}`, ...cue.lines.slice(1)] : cue.lines;
      blocks.push(
        `${n++}\n${formatTimestamp(cue.start)} --> ${formatTimestamp(cue.end)}\n${body.join('\n')}`,
      );
    }
  }
  return `${header}\n\n${blocks.join('\n\n')}\n`;
}

export function toTxt(segments, { title } = {}) {
  const lines = [...segments]
    .sort((a, b) => a.start - b.start)
    .map((s) => {
      const time = formatTimestamp(s.start).slice(0, 8);
      return `[${time}] ${s.speaker ? `${s.speaker}: ` : ''}${s.text.replace(/\s+/g, ' ').trim()}`;
    });
  return `${title ? `${title}\n\n` : ''}${lines.join('\n')}\n`;
}
