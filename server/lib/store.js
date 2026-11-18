import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

/**
 * Almacén mínimo en un archivo JSON. Suficiente para el prototipo y las pruebas
 * con usuarios; no sustituye una base de datos con cuentas.
 */
export function createFileStore(dir) {
  const file = join(dir, 'db.json');
  let data = null;
  let queue = Promise.resolve();

  async function load() {
    if (data) return data;
    try {
      data = JSON.parse(await readFile(file, 'utf8'));
    } catch {
      data = {};
    }
    data.transcripts ??= {};
    data.adaptations ??= {};
    return data;
  }

  function persist() {
    queue = queue.then(async () => {
      await mkdir(dir, { recursive: true });
      const tmp = `${file}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(data, null, 2));
      await rename(tmp, file);
    });
    return queue;
  }

  return createStore(load, persist);
}

export function createMemoryStore() {
  const data = { transcripts: {}, adaptations: {} };
  return createStore(
    async () => data,
    async () => {},
  );
}

function createStore(load, persist) {
  return {
    async createTranscript(input) {
      const db = await load();
      const now = new Date().toISOString();
      const id = randomUUID();
      db.transcripts[id] = { id, status: 'draft', ...input, createdAt: now, updatedAt: now };
      await persist();
      return db.transcripts[id];
    },
    async getTranscript(id) {
      return (await load()).transcripts[id] ?? null;
    },
    async listTranscripts() {
      return Object.values((await load()).transcripts)
        .map(({ id, title, materialId, status, updatedAt, segments }) => ({
          id,
          title,
          materialId,
          status,
          updatedAt,
          segmentCount: segments.length,
        }))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    async updateTranscript(id, input) {
      const db = await load();
      if (!db.transcripts[id]) return null;
      db.transcripts[id] = { ...db.transcripts[id], ...input, updatedAt: new Date().toISOString() };
      await persist();
      return db.transcripts[id];
    },
    async getAdaptations(materialId) {
      return (await load()).adaptations[materialId] ?? null;
    },
    async saveAdaptations(materialId, input) {
      const db = await load();
      db.adaptations[materialId] = { materialId, ...input, updatedAt: new Date().toISOString() };
      await persist();
      return db.adaptations[materialId];
    },
  };
}
