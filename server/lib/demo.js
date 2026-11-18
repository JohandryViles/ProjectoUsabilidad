// Respuestas deterministas para el modo demo (sin clave de API ni red).
// Sirven para probar la interfaz y los flujos de revisión, no para enseñar.

const STOPWORDS = new Set(
  `a al algo ante antes como con contra cual cuando de del desde donde durante e el ella ellas
  ellos en entre era es esa ese eso esta este esto estos estas fue ha hay la las le les lo los
  mas más me mi muy no nos o otra otro para pero por porque que qué se sea ser si sí sin sobre
  son su sus también tan te tiene tienen todo todos tu un una uno unos unas y ya`.split(/\s+/),
);

export function sentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?¿¡])\s+(?=[A-ZÁÉÍÓÚÑ¿¡0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function words(text) {
  return text.toLocaleLowerCase('es').match(/[a-záéíóúüñ]+/g) ?? [];
}

function truncateWords(text, max) {
  const list = text.split(/\s+/);
  return list.length <= max ? text : `${list.slice(0, max).join(' ')}…`;
}

export const demo = {
  summary({ text }) {
    const list = sentences(text);
    const half = Math.ceil(list.length / 2);
    const groups = [list.slice(0, Math.min(half, 3)), list.slice(half, half + 3)].filter(
      (g) => g.length,
    );
    return {
      sections: groups.map((points, i) => ({
        heading: i === 0 ? 'Idea de partida' : 'Para seguir',
        points: points.map((p) => truncateWords(p, 25)),
      })),
      keyIdeas: list.slice(0, 2).map((p) => truncateWords(p, 20)),
    };
  },

  glossary({ text }) {
    const counts = new Map();
    for (const w of words(text)) {
      if (w.length >= 9 && !STOPWORDS.has(w)) counts.set(w, (counts.get(w) ?? 0) + 1);
    }
    const terms = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
      .slice(0, 5)
      .map(([term]) => ({
        term,
        definition: `Definición de ejemplo para «${term}». El docente debe escribir la definición real.`,
        example: 'Ejemplo cotidiano pendiente de revisión.',
      }));
    return { terms };
  },

  plain({ text }) {
    const simplified = sentences(text)
      .flatMap((s) => s.split(/,\s+(?:que|porque|aunque|y|pero)\s+/i))
      .map((s) => s.trim().replace(/[,;:]$/, ''))
      .map((s) => (/[.!?]$/.test(s) ? s : `${s}.`))
      .map((s) => s.charAt(0).toLocaleUpperCase('es') + s.slice(1))
      .join('\n');
    return {
      simplified,
      changes: [
        'Modo demo: se dividieron las frases largas. Revisa el resultado antes de publicarlo.',
      ],
    };
  },

  altText({ context }) {
    return {
      kind: 'otro',
      short: 'Descripción pendiente: el modo demo no analiza imágenes.',
      long: `Modo demo: escribe aquí qué muestra la imagen y por qué es importante para la clase.${
        context ? ` Contexto indicado: ${context}` : ''
      }`,
      dataPoints: [],
    };
  },
};

export { STOPWORDS };
