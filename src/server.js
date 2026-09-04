/* =========================================================================
   server.js — Gateway LTI 1.3 de Especializate.

   Cadena:
     1) Cabeceras de seguridad (helmet) con framing permitido para Moodle.
     2) Parsers (form_post del launch) + cookies + sesión segura.
     3) Rutas PÚBLICAS:
          /lti/login, /lti/launch, /lti/jwks     (flujo LTI)
          /acceso.html, /sesion-finalizada.html  (pantallas, URL Moodle de config)
          /aula-client/*                         (auth.js que se inyecta)
          /api/me, /api/logout, /healthz
     4) Guard requireSession.
     5) Aula estática existente (protegida) servida SIN modificar, con el
        bootstrap de cliente inyectado al vuelo.
   ========================================================================= */
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import createMemoryStore from 'memorystore';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import config, { validateConfig } from './config.js';
import { initToolKeys } from './lti/keys.js';
import ltiRoutes from './routes/lti.js';
import sessionRoutes from './routes/session.js';
import progressRoutes from './routes/progress.js';
import { requireSession } from './middleware/requireSession.js';
import { aulaHtmlInjector, aulaStatic } from './aula.js';
import { serveAcceso, serveSesionFinalizada } from './pages.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const errors = validateConfig();
  if (errors.length) {
    console.error('\n[config] No se puede arrancar. Revisá el .env:\n');
    errors.forEach((e) => console.error('  • ' + e));
    console.error('\n(Tomá como referencia .env.example)\n');
    process.exit(1);
  }

  await initToolKeys();

  const app = express();
  app.set('trust proxy', 1);

  // --- 1) Seguridad: permitir que Moodle enmarque el aula (frame-ancestors) ---
  const frameAncestors = ["'self'"];
  if (config.moodleEffectiveUrl) frameAncestors.push(config.moodleEffectiveUrl);
  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'frame-ancestors': frameAncestors,
        'upgrade-insecure-requests': null,
      },
    },
    frameguard: false,               // usamos frame-ancestors (CSP), no X-Frame-Options
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  }));

  // --- 2) Parsers + cookies + sesión ---
  app.use(express.urlencoded({ extended: false })); // form_post del launch
  app.use(express.json({ limit: '256kb' }));         // el doc de progreso valida su tope en la ruta
  app.use(cookieParser());

  const MemoryStore = createMemoryStore(session);
  app.use(session({
    name: config.session.cookieName,
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    rolling: true, // renueva la expiración con cada request → sesión "viva" mientras se usa
    store: new MemoryStore({ checkPeriod: 60 * 60 * 1000 }),
    cookie: {
      httpOnly: true,
      secure: config.cookieBase.secure,
      sameSite: config.cookieBase.sameSite,
      maxAge: config.session.ttlMs,
    },
  }));

  // --- 3) Rutas públicas ---
  app.use(ltiRoutes);                                   // /lti/login, /lti/launch, /lti/jwks, (dev)
  app.get('/acceso.html', serveAcceso);                 // "Ingresá desde tu aula de Moodle"
  app.get('/sesion-finalizada.html', serveSesionFinalizada); // "Tu sesión finalizó"
  app.use('/aula-client', express.static(config.aulaClientDir)); // auth.js inyectado
  app.get('/healthz', (req, res) => res.json({ ok: true }));
  app.use(sessionRoutes);                               // /api/me, /api/logout
  app.use(progressRoutes);                              // /api/progress (identidad desde la sesión)

  // --- 4) Guard: de acá en adelante, todo requiere sesión LTI ---
  app.use(requireSession);

  // --- 5) Aula estática (protegida, sin modificar, con bootstrap inyectado) ---
  app.get('/', (req, res) => res.redirect(302, config.aula.entry));
  app.use(aulaHtmlInjector());
  app.use(aulaStatic());

  app.listen(config.port, () => {
    console.log('\n================ Especializate · Gateway LTI 1.3 ================');
    console.log('  Entorno         :', config.env);
    console.log('  Escuchando en   :', config.publicBaseUrl, '(puerto ' + config.port + ')');
    console.log('  Aula servida de :', config.aula.dir);
    console.log('  Entrada aula    :', config.aula.entry);
    console.log('  Moodle URL      :', config.moodleEffectiveUrl);
    console.log('  Progreso        : modo=' + config.progress.mode + '  store=' + config.progress.store);
    console.log('  --- URLs para registrar en Moodle ---');
    console.log('  Tool / Launch   :', config.lti.urls.launch);
    console.log('  OIDC login init :', config.lti.urls.login);
    console.log('  JWKS (keyset)   :', config.lti.urls.jwks);
    if (config.dev.fakeLaunch) console.log('  [DEV] launch sim:', config.publicBaseUrl + '/dev/launch');
    console.log('================================================================\n');
  });
}

main().catch((e) => { console.error('Fallo al arrancar el gateway:', e); process.exit(1); });
