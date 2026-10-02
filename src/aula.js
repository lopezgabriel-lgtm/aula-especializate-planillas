/* =========================================================================
   aula.js — Sirve el aula estática existente SIN modificar sus archivos.

   Sobre cada página .html inyecta:
     - en <head>: la config del progreso + /aula-client/progress.repository.js
       (antes de progress.js; las páginas esperan su promesa `ready`);
     - antes de </body>: window.__AULA_MOODLE_URL__ (desde config — un solo lugar) y
       /aula-client/auth.js (muestra la identidad y vigila el vencimiento de la sesión).
   Todas las URLs llevan el prefijo BASE_PATH.

   Los assets (css, js del aula, imágenes) se sirven tal cual con express.static.
   Así el código del aula queda intacto; toda la integración vive en el gateway.
   ========================================================================= */
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import config from './config.js';

const AULA_BASE = path.resolve(config.aula.dir);

// Serializa a JSON seguro para incrustar dentro de un <script> (evita cerrar la etiqueta).
function jsonForScript(v) { return JSON.stringify(v).replace(/</g, '\\u003c'); }

// HEAD: va ANTES de progress.js, porque las páginas esperan a que el progreso se
// cargue del servidor (AulaProgressRepo.ready) antes de dibujarse.
function headSnippet(nonce) {
  var progressCfg = { mode: config.progress.mode, endpoint: config.progress.endpoint };
  return (
    '\n<script nonce="' + nonce + '">window.__AULA_BASE__=' + jsonForScript(config.basePath) + ';' +
    'window.__AULA_PROGRESS__=' + jsonForScript(progressCfg) + ';</script>' +
    '\n<script src="' + config.url('/aula-client/progress.repository.js') + '"></script>\n'
  );
}

// COLA: URL de Moodle (para las pantallas de sesión) e identidad del estudiante.
function tailSnippet(nonce) {
  return (
    '\n<script nonce="' + nonce + '">window.__AULA_MOODLE_URL__=' + jsonForScript(config.moodleEffectiveUrl) + ';</script>' +
    '\n<script src="' + config.url('/aula-client/auth.js') + '"></script>\n'
  );
}

// Marca con el nonce de la request cada <script> INLINE del aula (los que no traen src).
// Los externos ya los cubre 'self'. Si un inline ya trae nonce, no se toca.
function nonceInlineScripts(html, nonce) {
  return html.replace(/<script(?![^>]*\bsrc\s*=)(?![^>]*\bnonce\s*=)([^>]*)>/gi, function (m, attrs) {
    return '<script nonce="' + nonce + '"' + attrs + '>';
  });
}

function injectInto(html, nonce) {
  html = nonceInlineScripts(html, nonce);
  var head = headSnippet(nonce);
  var tail = tailSnippet(nonce);
  // Bootstrap del repositorio: al final de <head> (o, si no hay, al inicio del documento).
  var out = /<\/head>/i.test(html)
    ? html.replace(/<\/head>/i, function () { return head + '</head>'; })
    : head + html;
  // Identidad/sesión: justo antes de </body> (o al final).
  return /<\/body>/i.test(out)
    ? out.replace(/<\/body>/i, function () { return tail + '</body>'; })
    : out + tail;
}

// Middleware: intercepta SOLO las páginas .html para inyectar el bootstrap.
export function aulaHtmlInjector() {
  return function (req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    let rel;
    try { rel = decodeURIComponent(req.path); } catch { return next(); }
    if (!rel.toLowerCase().endsWith('.html')) return next();

    const filePath = path.join(AULA_BASE, rel);
    // Guarda contra path traversal: el archivo debe quedar dentro de AULA_BASE.
    if (filePath !== AULA_BASE && !filePath.startsWith(AULA_BASE + path.sep)) {
      return res.status(403).type('text/plain').send('Ruta no permitida.');
    }
    fs.readFile(filePath, 'utf8', (err, html) => {
      if (err) return next(); // no existe → que siga la cadena (404 de static)
      const out = injectInto(html, res.locals.cspNonce);
      res.set('Content-Type', 'text/html; charset=utf-8');
      res.set('Cache-Control', 'no-cache');
      if (req.method === 'HEAD') return res.end();
      res.send(out);
    });
  };
}

// Estáticos del aula (todo lo que no sea .html: css, js, img, pdf, etc.).
export function aulaStatic() {
  return express.static(AULA_BASE, { index: false });
}
