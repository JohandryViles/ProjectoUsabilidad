import * as z from 'zod/v4';

export const MAX_TEXT = 20000;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

const text = z
  .string({ error: 'Escribe o pega el texto del material.' })
  .trim()
  .min(20, 'El texto es muy corto. Escribe al menos 20 caracteres.')
  .max(MAX_TEXT, `El texto supera ${MAX_TEXT} caracteres. Divídelo en partes más cortas.`);

// --- Entradas ------------------------------------------------------------

export const summaryInput = z.object({
  text,
  title: z.string().trim().max(200).optional(),
});

export const textInput = z.object({ text });

export const altTextInput = z
  .object({
    imageBase64: z.string({ error: 'Selecciona una imagen.' }).min(1, 'Selecciona una imagen.'),
    mediaType: z.enum(IMAGE_TYPES, {
      error: 'Formato no admitido. Usa una imagen PNG, JPG, WEBP o GIF.',
    }),
    context: z.string().trim().max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    const bytes = Math.floor((value.imageBase64.replace(/=+$/, '').length * 3) / 4);
    if (bytes > MAX_IMAGE_BYTES) {
      ctx.addIssue({
        code: 'custom',
        path: ['imageBase64'],
        message: 'La imagen pesa más de 5 MB. Elige una imagen más liviana o redúcela.',
      });
    }
  });

const segment = z.object({
  start: z.number().min(0),
  end: z.number().min(0),
  text: z.string().trim().min(1).max(2000),
  speaker: z.string().trim().max(60).optional(),
});

export const transcriptInput = z.object({
  title: z.string().trim().max(200).optional(),
  materialId: z.string().trim().max(100).optional(),
  segments: z
    .array(segment, { error: 'La transcripción no tiene frases.' })
    .min(1, 'La transcripción no tiene frases. Inicia la captura y habla antes de guardar.')
    .max(5000),
  status: z.enum(['draft', 'approved']).optional(),
});

export const adaptationsInput = z.object({
  status: z.enum(['draft', 'approved']),
  summary: z.unknown().optional(),
  glossary: z.unknown().optional(),
  plain: z.unknown().optional(),
  altTexts: z.unknown().optional(),
  pictogramText: z.string().max(MAX_TEXT).optional(),
});

// --- Salidas estructuradas de la IA (JSON Schema simple) ---------------------

export const summaryOutput = z.object({
  sections: z.array(z.object({ heading: z.string(), points: z.array(z.string()) })),
  keyIdeas: z.array(z.string()),
});

export const glossaryOutput = z.object({
  terms: z.array(z.object({ term: z.string(), definition: z.string(), example: z.string() })),
});

export const plainOutput = z.object({
  simplified: z.string(),
  changes: z.array(z.string()),
});

export const altTextOutput = z.object({
  kind: z.enum(['foto', 'grafico', 'diagrama', 'ilustracion', 'captura', 'otro']),
  short: z.string(),
  long: z.string(),
  dataPoints: z.array(z.string()),
});

export function firstIssue(error) {
  const issue = error.issues[0];
  return { message: issue.message, field: issue.path.join('.') || undefined };
}
