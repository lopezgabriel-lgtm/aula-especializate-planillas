/* =========================================================================
   config.js — Carga y valida la configuración desde variables de entorno.
   Falla temprano y con mensajes claros si falta algo crítico, para evitar
   arrancar un gateway de autenticación mal configurado.

   La URL de Moodle vive SOLO acá (config): las pantallas de acceso / sesión
   vencida y el frontend la reciben desde este único lugar, nunca hardcodeada
   en varios archivos.
   ========================================================================= */
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

function str(name, def) {
  const v = process.env[name];
  return (v === undefined || v === '') ? def : v;
}
function bool(name, def = false) {
  const v = process.env[name];
  if (v === undefined || v === '') return def;
  return /^(1|true|yes|on)$/i.test(v);
}
function int(name, def) {
  const v = parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(v) ? v : def;
}
function stripSlash(u) { return typeof u === 'string' ? u.replace(/\/+$/, '') : u; }

const NODE_ENV = str('NODE_ENV', 'development');
const isProd = NODE_ENV === 'production';

const sessionCookieName = str('SESSION_COOKIE_NAME', 'especializate_lti_sid');

const config = {
  env: NODE_ENV,
  isProd,
  port: int('PORT', 3000),
  publicBaseUrl: stripSlash(str('PUBLIC_BASE_URL', 'http://localhost:3000')),

  aula: {
    // Carpeta del aula estática existente (se sirve sin modificar).
    dir: path.resolve(PROJECT_ROOT, str('AULA_DIR', './aula')),
    // Entrada tras un lanzamiento válido. index.html es la pantalla EMBEBIDA
    // (portada); su CTA lleva al recorrido real (inicio.html).
    entry: str('AULA_ENTRY', '/index.html'),
  },
  // Carpeta con el helper de cliente (auth.js) que el gateway inyecta.
  aulaClientDir: path.resolve(PROJECT_ROOT, str('AULA_CLIENT_DIR', './aula-client')),

  // Datos de la plataforma (Moodle). Fuente: administrador de Moodle.
  lti: {
    issuer: stripSlash(str('LTI_ISSUER', '')),
    clientId: str('LTI_CLIENT_ID', ''),
    deploymentId: str('LTI_DEPLOYMENT_ID', ''),
    authLoginUrl: str('LTI_AUTH_LOGIN_URL', ''),
    jwksUrl: str('LTI_JWKS_URL', ''),
    tokenUrl: str('LTI_TOKEN_URL', ''),
    toolPrivateKeyPem: str('LTI_TOOL_PRIVATE_KEY', '').replace(/\\n/g, '\n'),
    toolKid: str('LTI_TOOL_KID', ''),
    paths: {
      login: '/lti/login',
      launch: '/lti/launch',
      jwks: '/lti/jwks',
    },
  },

  moodleUrl: stripSlash(str('MOODLE_URL', '')),

  session: {
    secret: str('SESSION_SECRET', ''),
    cookieName: sessionCookieName,
    // Cookie NO sensible (marcador booleano) para distinguir "sesión vencida"
    // de "acceso directo por primera vez" en navegaciones completas.
    seenCookieName: sessionCookieName + '_seen',
    ttlMs: int('SESSION_TTL_MIN', 240) * 60 * 1000,
    // El marcador "ya entró alguna vez" vive más que la sesión (para reconocer
    // vencimientos posteriores). 30 días.
    seenTtlMs: 30 * 24 * 60 * 60 * 1000,
    embedInIframe: bool('EMBED_IN_IFRAME', false),
  },

  // Persistencia del progreso. La lógica educativa NO depende de esto:
  // sólo define dónde persiste el repositorio (caché local vs servidor) y,
  // en el servidor, qué implementación de store se usa (placeholder por ahora).
  progress: {
    // 'local'  → sólo caché en el navegador (idéntico a hoy). Por defecto.
    // 'remote' → servidor = principal, localStorage = caché.
    mode: (str('PROGRESS_MODE', 'local') === 'remote') ? 'remote' : 'local',
    // Implementación del store en el backend: 'memory' | 'file' (placeholders).
    store: str('PROGRESS_STORE', 'memory'),
    // Carpeta de datos para el store 'file'.
    dataDir: path.resolve(PROJECT_ROOT, str('PROGRESS_DATA_DIR', './.data')),
    // Identificador de curso: aísla el progreso remoto por curso cuando varias
    // aulas comparten el mismo almacén/origen. Se antepone a la clave del store.
    courseId: str('COURSE_ID', ''),
    endpoint: '/api/progress',
  },

  dev: {
    fakeLaunch: bool('DEV_FAKE_LAUNCH', false) && !isProd,
  },

  keysDir: path.resolve(PROJECT_ROOT, '.keys'),
};

// URL de Moodle efectiva para los botones "Ir/Volver a Moodle": MOODLE_URL si
// está, si no el issuer (que en Moodle es la URL base del campus).
config.moodleEffectiveUrl = config.moodleUrl || config.lti.issuer || '';

// Atributos comunes de cookies (coherentes entre sesión y marcador "seen").
config.cookieBase = {
  httpOnly: true,
  secure: config.isProd || config.session.embedInIframe,
  sameSite: config.session.embedInIframe ? 'none' : 'lax',
  path: '/',
};

// URLs absolutas derivadas (las que se registran en Moodle).
config.lti.urls = {
  login: config.publicBaseUrl + config.lti.paths.login,
  launch: config.publicBaseUrl + config.lti.paths.launch,
  jwks: config.publicBaseUrl + config.lti.paths.jwks,
};

/* --------------------------- Validación ------------------------------- */
export function validateConfig() {
  const errors = [];
  const required = {
    LTI_ISSUER: config.lti.issuer,
    LTI_CLIENT_ID: config.lti.clientId,
    LTI_DEPLOYMENT_ID: config.lti.deploymentId,
    LTI_AUTH_LOGIN_URL: config.lti.authLoginUrl,
    LTI_JWKS_URL: config.lti.jwksUrl,
    SESSION_SECRET: config.session.secret,
  };
  for (const [k, v] of Object.entries(required)) {
    if (!v) errors.push(`Falta la variable de entorno obligatoria: ${k}`);
  }
  if (config.session.secret && config.session.secret.length < 32) {
    errors.push('SESSION_SECRET es demasiado corto: usá al menos 32 caracteres aleatorios.');
  }
  if (!config.moodleEffectiveUrl) {
    errors.push('Falta MOODLE_URL (o LTI_ISSUER) para los botones "Ir a Moodle".');
  }
  if (config.isProd && config.publicBaseUrl.startsWith('http://')) {
    errors.push('En producción PUBLIC_BASE_URL debe ser https:// (las cookies de sesión y OIDC lo requieren).');
  }
  if (config.session.embedInIframe && config.publicBaseUrl.startsWith('http://')) {
    errors.push('EMBED_IN_IFRAME=true requiere https:// (SameSite=None; Secure no funciona sobre http).');
  }
  return errors;
}

export default config;
