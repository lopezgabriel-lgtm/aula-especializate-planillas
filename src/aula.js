/* =========================================================================
   aula.js — Sirve el aula estática existente SIN modificar sus archivos.

   Sobre cada página .html inyecta, justo antes de </body>, dos líneas:
     - window.__AULA_MOODLE_URL__  (la URL de Moodle, desde config — un solo lugar)
     - <script src="/aula-client/auth.js">  (muestra la identidad y vigila el
       vencimiento de la sesión)

   Los assets (css, js del aula, imágenes) se sirven tal cual con express.static.
   Así el código del aula queda intacto; toda la integración vive en el gateway.
   ========================================================================= */
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import config from './config.js';

const AULA_BASE = path.resolve(config.aula.dir);

function snippet() {
  var progressCfg = JSON.stringify({ mode: config.progress.mode, endpoint: config.progress.endpoint });
  return (
    // Config del progreso (modo local/remoto + endpoint) y capa de persistencia.
    '\n<script>window.__AULA_PROGRESS__=' + progressCfg + ';</script>' +
    '\n<script src="/aula-client/progress.repository.js"></script>' +
    // URL de Moodle (para las pantallas de sesión) e identidad del estudiante.
    '\n<script>window.__AULA_MOODLE_URL__=' + JSON.stringify(config.moodleEffectiveUrl) + ';</script>' +
    '\n<script src="/aula-client/auth.js"></script>\n'
  );
}

// Middleware: intercepta SOLO las páginas .html para inyectar el bootstrap.
export function aulaHtmlInjector() {
  const inject = snippet();
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
      const out = html.includes('</body>')
        ? html.replace('</body>', inject + '</body>')
        : html + inject;
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
