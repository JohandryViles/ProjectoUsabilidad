import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { createDefaultAiService, MODEL } from './lib/ai.js';
import { createPictogramService } from './lib/arasaac.js';
import { createFileStore } from './lib/store.js';

const here = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 8787;
const ai = createDefaultAiService();

const app = createApp({
  ai,
  pictos: createPictogramService(),
  store: createFileStore(process.env.DATA_DIR || join(here, 'data')),
});

app.listen(port, () => {
  console.log(`IncluAula IA · API en http://localhost:${port}/api`);
  console.log(
    ai.mode === 'claude'
      ? `Modo IA: Claude (${MODEL}).`
      : 'Modo IA: demo (sin ANTHROPIC_API_KEY o con AI_MODE=demo). Las respuestas son de ejemplo.',
  );
});
