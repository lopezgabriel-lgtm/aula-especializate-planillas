/* =========================================================================
   progress/store.js — Interfaz de almacenamiento del progreso (lado servidor).

   ESTE es el único punto que cambia cuando se elija la tecnología definitiva
   de persistencia (Postgres, Redis, DynamoDB, Moodle-AGS, etc.). El resto del
   sistema —ruta /api/progress, repositorio del cliente y la lógica educativa—
   NO se toca.

   Contrato (todas async):
     get(studentKey)      -> { doc, updatedAt } | null
     put(studentKey, doc) -> { updatedAt }

   `studentKey` SIEMPRE lo provee el servidor desde la sesión LTI
   (req.session.lti.stableId). Nunca viene del navegador.

   Se incluyen dos implementaciones PLACEHOLDER para poder correr ya:
     • MemoryProgressStore → se pierde al reiniciar. Sólo para desarrollo/demo.
     • FileProgressStore    → un archivo JSON por estudiante. Durable en una sola
                              instancia. Útil para pilotos chicos, no para escala.
   ========================================================================= */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

/** Implementación en memoria (volátil). */
export class MemoryProgressStore {
  constructor() { this.map = new Map(); }
  async get(studentKey) {
    return this.map.get(studentKey) || null;
  }
  async put(studentKey, doc) {
    const rec = { doc, updatedAt: new Date().toISOString() };
    this.map.set(studentKey, rec);
    return { updatedAt: rec.updatedAt };
  }
}

/** Implementación en archivos: un JSON por estudiante bajo dataDir/progress/. */
export class FileProgressStore {
  constructor(dataDir) {
    this.dir = path.join(dataDir, 'progress');
    fs.mkdirSync(this.dir, { recursive: true });
  }
  _file(studentKey) {
    // studentKey es un hash base64url (sólo [A-Za-z0-9_-]); seguro como nombre.
    const safe = String(studentKey).replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 200);
    return path.join(this.dir, safe + '.json');
  }
  async get(studentKey) {
    try {
      const raw = await fsp.readFile(this._file(studentKey), 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      if (e.code === 'ENOENT') return null;
      throw e;
    }
  }
  async put(studentKey, doc) {
    const rec = { doc, updatedAt: new Date().toISOString() };
    const file = this._file(studentKey);
    const tmp = file + '.tmp';
    await fsp.writeFile(tmp, JSON.stringify(rec), 'utf8');
    await fsp.rename(tmp, file); // escritura atómica
    return { updatedAt: rec.updatedAt };
  }
}

/** Fábrica: elige la implementación según config. */
export function createProgressStore(progressCfg) {
  switch (progressCfg.store) {
    case 'file': return new FileProgressStore(progressCfg.dataDir);
    case 'memory':
    default: return new MemoryProgressStore();
  }
}
