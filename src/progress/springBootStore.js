/* =========================================================================
   progress/springBootStore.js — Store de progreso respaldado por el backend
   Spring Boot (planillasInteligentes, WAR en Tomcat).

   Cumple la misma interfaz que los demás stores:
     get(studentKey)      -> { doc, updatedAt } | null
     put(studentKey, doc) -> { updatedAt }

   Contrato con el backend (ver README de planillasInteligentes):
     GET/PUT {SPRING_BOOT_URL}/api/v1/progress
     Headers: X-Internal-Secret, X-Student-Key, X-Course-Id
     PUT body: { progress: "<JSON como string>", schemaVersion: <int> }

   El secreto, la clave del estudiante y el curso salen SIEMPRE del gateway
   (config + sesión LTI): el navegador nunca los ve ni los envía.
   Usa fetch nativo (Node >= 18): sin dependencias nuevas.
   ========================================================================= */

const PATH = '/api/v1/progress';

// Error de almacenamiento con un código estable para que la ruta responda bien.
export class ProgressStoreError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = 'ProgressStoreError';
    this.code = code;       // 'store_unavailable' | 'store_rejected'
    this.status = status;   // HTTP del backend, si hubo respuesta
  }
}

// La versión del esquema viaja dentro del documento; debe ser un entero >= 1.
export function schemaVersionOf(doc) {
  const v = doc && doc.schemaVersion;
  return Number.isInteger(v) && v >= 1 ? v : 1;
}

export class SpringBootProgressStore {
  constructor({ baseUrl, secret, courseId, timeoutMs = 5000, fetchImpl = fetch }) {
    if (!baseUrl) throw new Error('SpringBootProgressStore: falta baseUrl.');
    if (!secret) throw new Error('SpringBootProgressStore: falta el secreto interno.');
    if (!courseId) throw new Error('SpringBootProgressStore: falta courseId.');
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.secret = secret;
    this.courseId = courseId;
    this.timeoutMs = timeoutMs;
    this.fetch = fetchImpl;
  }

  _headers(studentKey, extra) {
    return {
      'X-Internal-Secret': this.secret,
      'X-Student-Key': studentKey,
      'X-Course-Id': this.courseId,
      Accept: 'application/json',
      ...extra,
    };
  }

  async _call(method, studentKey, body) {
    let res;
    try {
      res = await this.fetch(this.baseUrl + PATH, {
        method,
        headers: this._headers(studentKey, body === undefined ? {} : { 'Content-Type': 'application/json' }),
        body,
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (e) {
      // Backend caído, sin red o vencido por timeout.
      throw new ProgressStoreError('store_unavailable',
        `Spring Boot no responde (${e.name === 'TimeoutError' ? 'timeout' : e.cause?.code || e.message}).`);
    }
    return res;
  }

  // Un 4xx/5xx del backend: 503 = base caída (reintentable); el resto = rechazo.
  async _fail(res, action) {
    let code = '';
    try { code = (await res.json()).error || ''; } catch { /* cuerpo no JSON */ }
    // Nunca se loguea el secreto ni la clave del estudiante.
    console.error(`[SpringBootProgressStore] ${action}: HTTP ${res.status}${code ? ' ' + code : ''}` +
      (res.status === 401 ? ' (¿INTERNAL_API_SECRET no coincide con el backend?)' : '') +
      (code === 'curso_invalido' ? ' (¿COURSE_ID no coincide con el del backend?)' : ''));
    const unavailable = res.status === 503 || res.status === 502 || res.status === 504;
    throw new ProgressStoreError(unavailable ? 'store_unavailable' : 'store_rejected',
      `Spring Boot respondió ${res.status}.`, res.status);
  }

  async get(studentKey) {
    const res = await this._call('GET', studentKey);
    if (res.status === 404) return null; // todavía no hay progreso guardado
    if (!res.ok) await this._fail(res, 'leyendo progreso');
    const data = await res.json();
    return { doc: data.progress ?? null, updatedAt: data.updatedAt || null };
  }

  async put(studentKey, doc) {
    const payload = JSON.stringify({
      progress: typeof doc === 'string' ? doc : JSON.stringify(doc),
      schemaVersion: schemaVersionOf(typeof doc === 'string' ? safeParse(doc) : doc),
    });
    const res = await this._call('PUT', studentKey, payload);
    if (!res.ok) await this._fail(res, 'guardando progreso');
    const data = await res.json();
    return { updatedAt: data.updatedAt || null };
  }
}

function safeParse(str) { try { return JSON.parse(str); } catch { return null; } }
