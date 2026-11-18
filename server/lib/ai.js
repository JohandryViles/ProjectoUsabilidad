import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { prompts } from './prompts.js';
import { demo } from './demo.js';
import { altTextOutput, glossaryOutput, plainOutput, summaryOutput } from './schemas.js';

export const MODEL = 'claude-opus-5-5';

export class AiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function translateError(error) {
  if (error instanceof AiError) return error;
  if (error instanceof Anthropic.AuthenticationError) {
    return new AiError(
      502,
      'ai_auth',
      'La clave de la API de IA no es válida. Revisa el archivo .env.',
    );
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new AiError(
      503,
      'ai_busy',
      'El servicio de IA está ocupado. Intenta de nuevo en un minuto.',
    );
  }
  if (error instanceof Anthropic.BadRequestError) {
    return new AiError(502, 'ai_bad_request', 'El servicio de IA no pudo procesar este contenido.');
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new AiError(
      503,
      'ai_offline',
      'No hay conexión con el servicio de IA. Revisa tu conexión.',
    );
  }
  if (error instanceof Anthropic.APIError) {
    return new AiError(
      502,
      'ai_error',
      'El servicio de IA respondió con un error. Intenta de nuevo.',
    );
  }
  return new AiError(500, 'internal', 'Ocurrió un error inesperado al generar la sugerencia.');
}

/**
 * Servicio de IA. Con `client` usa Claude; sin él responde en modo demo.
 * Todas las salidas son borradores que el docente debe revisar.
 */
export function createAiService({ client } = {}) {
  const mode = client ? 'claude' : 'demo';

  async function run(task, schema, input, content) {
    if (!client) return { ...demo[task](input), source: 'demo', requiresReview: true };
    try {
      const prompt = prompts[task];
      const response = await client.beta.messages.parse({
        model: MODEL,
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'medium', format: betaZodOutputFormat(schema) },
        system: prompt.system,
        messages: [{ role: 'user', content: content ?? prompt.user(input) }],
      });
      if (response.stop_reason === 'refusal') {
        throw new AiError(
          502,
          'ai_refusal',
          'La IA no generó una sugerencia para este contenido. Escribe la versión manualmente.',
        );
      }
      if (response.stop_reason === 'max_tokens' || !response.parsed_output) {
        throw new AiError(
          502,
          'ai_incomplete',
          'La respuesta de la IA llegó incompleta. Intenta de nuevo.',
        );
      }
      return { ...response.parsed_output, source: 'claude', requiresReview: true };
    } catch (error) {
      throw translateError(error);
    }
  }

  return {
    mode,
    summary: (input) => run('summary', summaryOutput, input),
    glossary: (input) => run('glossary', glossaryOutput, input),
    plain: async (input) => ({ original: input.text, ...(await run('plain', plainOutput, input)) }),
    altText: (input) =>
      run('altText', altTextOutput, input, [
        {
          type: 'image',
          source: { type: 'base64', media_type: input.mediaType, data: input.imageBase64 },
        },
        { type: 'text', text: prompts.altText.user(input) },
      ]),
  };
}

export function createDefaultAiService(env = process.env) {
  const wantsDemo = env.AI_MODE === 'demo' || !env.ANTHROPIC_API_KEY;
  return createAiService({ client: wantsDemo ? undefined : new Anthropic() });
}
