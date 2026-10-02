/* =========================================================================
   progress.repository.js — Capa de PERSISTENCIA desacoplada del progreso.

   El progreso ya NO se guarda en el navegador (sin localStorage / sessionStorage /
   IndexedDB / cookies). La fuente de verdad es el servidor; el navegador solo lo
   mantiene EN MEMORIA mientras la página está abierta.

   La lógica educativa (progress.js) es SÍNCRONA y no sabe dónde se persiste.
   Este repositorio implementa esa frontera:

     • Estado en memoria (síncrono) → loadLocal() / saveLocal()
       Es lo que progress.js usa directamente. Al abrir la página está vacío.

     • `ready` (Promise) → se resuelve cuando el progreso del estudiante ya se
       trajo del servidor. Las páginas esperan a `ready` ANTES de dibujarse
       (vía AulaProgress.whenReady). `ready` NUNCA se rechaza: si el servidor no
       responde, la página se dibuja igual y el repositorio reintenta solo.

     • Persistencia remota (async) → loadRemote() / saveRemote()
       Habla con el gateway (/api/progress). El gateway deriva la identidad del
       estudiante desde la SESIÓN LTI: el navegador nunca envía un user_id.

     • Empuje al servidor: cada guardado actualiza la memoria al instante y se
       envía en segundo plano (debounce corto). Al ocultar/salir de la página se
       envía lo pendiente con keepalive. Si el servidor no responde, queda
       pendiente y se reintenta con espera creciente; mientras tanto se muestra un
       aviso discreto para que el estudiante no cierre la página.

   REGLA DE SEGURIDAD: nunca se escribe en el servidor hasta haber leído una vez
   con éxito (así un fallo de lectura no pisa el progreso guardado con un estado
   vacío). Si la lectura inicial falló y luego funciona, se reconcilia por unión
   (AulaProgress.reconcile): no se pierde nada de ningún lado.

   Multi-pestaña / volver atrás: al volver a una pestaña oculta se resincroniza
   (unión) y una página restaurada desde la caché de "atrás/adelante" se recarga,
   para no guardar encima del progreso hecho en otra pantalla.

   MODOS (window.__AULA_PROGRESS__.mode):
     'remote' → servidor = fuente de verdad (lo configura el gateway).
     'local'  → SIN persistencia: solo memoria (desarrollo, o aula abierta como
                archivos estáticos sin gateway).
   ========================================================================= */
(function () {
  'use strict';

  var CFG = window.__AULA_PROGRESS__ || { mode: 'local', endpoint: '/api/progress' };
  var MODE = CFG.mode === 'remote' ? 'remote' : 'local';
  var ENDPOINT = CFG.endpoint || '/api/progress';
  var PUSH_DEBOUNCE_MS = 300;
  var RETRY_MIN_MS = 2000, RETRY_MAX_MS = 30000;

  /* ------------------------- Estado en memoria ------------------------ */
  var current = null;               // JSON (string) del estado, o null si no hay nada
  var loaded = (MODE !== 'remote'); // ¿ya se leyó del servidor con éxito? (local: no aplica)
  var dirty = false;                // hay cambios sin confirmar en el servidor
  var pushing = false, loading = false, firstAttemptDone = false, reloadedOnce = false;
  var pushTimer = null, retryTimer = null, retryMs = RETRY_MIN_MS;
  var unloadSnapshot = null;        // lo último enviado con keepalive (evita duplicar)
  var status = 'ok';                // 'ok' | 'offline' | 'nosession'

  function loadLocal() { return current; }
  function saveLocal(str) { current = str; schedulePush(); }

  /* --------------------------- Adaptador remoto ----------------------- */
  function httpError(code, retry, noSession) {
    var e = new Error(code); e.retry = retry; e.noSession = !!noSession; return e;
  }
  function loadRemote() {
    if (MODE !== 'remote') return Promise.resolve(null);
    return fetch(ENDPOINT, { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (r.status === 401) throw httpError('sin_sesion', false, true);
        // Cualquier otra falla es un ERROR (nunca "vacío"): no hay que pisar lo guardado.
        if (!r.ok) throw httpError('load_failed', true);
        return r.json();
      })
      .then(function (j) { return (j && j.doc != null) ? JSON.stringify(j.doc) : null; });
  }
  function saveRemote(str) {
    if (MODE !== 'remote') return Promise.resolve();
    var doc;
    try { doc = JSON.parse(str); } catch (e) { return Promise.reject(httpError('doc_invalido', false)); }
    return fetch(ENDPOINT, {
      method: 'PUT', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc)
    }).then(function (r) {
      if (r.status === 401) throw httpError('sin_sesion', false, true);
      // 5xx = backend caído (reintentable). 4xx (400/413) = rechazo: no se reintenta en bucle.
      if (!r.ok) throw httpError('save_failed', r.status >= 500);
    });
  }

  /* ----------------------- Aviso discreto de conexión ------------------ */
  var listeners = [];
  var banner = null;
  var MESSAGES = {
    offline: 'No pudimos sincronizar tu avance con el servidor. Reintentando… No cierres esta página todavía.',
    nosession: 'Tu sesión venció. Volvé a ingresar desde Moodle para que tu avance se guarde.'
  };
  function onStatus(cb) { listeners.push(cb); }
  function setStatus(s) {
    if (s === status) return;
    status = s;
    renderBanner();
    listeners.slice().forEach(function (cb) { try { cb(s); } catch (e) {} });
  }
  function renderBanner() {
    if (!document.body) { document.addEventListener('DOMContentLoaded', renderBanner); return; }
    if (status === 'ok') {
      if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
      banner = null;
      return;
    }
    if (!banner) {
      banner = document.createElement('div');
      banner.setAttribute('role', 'status');
      banner.setAttribute('data-aula-sync-banner', '');
      banner.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:10000;' +
        'max-width:min(92vw,560px);padding:10px 16px;border-radius:10px;background:#3a2a12;color:#ffe2b0;' +
        'border:1px solid #8a6a2f;font:600 13px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;' +
        'box-shadow:0 6px 24px rgba(0,0,0,.35);text-align:center;';
      document.body.appendChild(banner);
    }
    banner.textContent = MESSAGES[status] || MESSAGES.offline;
  }

  /* ---------------------- Empuje al servidor (debounced) --------------- */
  function schedulePush() {
    if (MODE !== 'remote') return;
    dirty = true;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(flush, PUSH_DEBOUNCE_MS);
  }
  function scheduleRetry(fn) {
    clearTimeout(retryTimer);
    retryTimer = setTimeout(fn, retryMs);
    retryMs = Math.min(retryMs * 2, RETRY_MAX_MS);
  }
  function flush() {
    if (MODE !== 'remote' || pushing || !dirty || !loaded) return Promise.resolve();
    pushing = true;
    var snapshot = current;
    return saveRemote(snapshot)
      .then(function () {
        retryMs = RETRY_MIN_MS;
        // Si mientras se enviaba hubo otro guardado, sigue pendiente (no se pierde).
        if (current === snapshot) dirty = false; else schedulePush();
        if (!dirty) setStatus('ok');
      })
      .catch(function (e) {
        if (e && e.noSession) { setStatus('nosession'); return; }   // la sesión la resuelve auth.js
        if (e && e.retry === false) { dirty = false; return; }      // rechazo permanente: no insistir
        setStatus('offline');
        scheduleRetry(flush);
      })
      .then(function () { pushing = false; });
  }

  /* --------------------------- Sincronización -------------------------- */
  // Une (AulaProgress.reconcile) lo remoto con lo que hay en memoria.
  // Devuelve { remoteHadMore, localHadMore }.
  function mergeRemote(remoteStr) {
    var AP = window.AulaProgress;
    if (remoteStr == null) return { remoteHadMore: false, localHadMore: current != null };
    if (current == null || !(AP && typeof AP.reconcile === 'function')) {
      current = remoteStr;
      return { remoteHadMore: true, localHadMore: false };
    }
    var rec = AP.reconcile(remoteStr, current);
    current = rec.merged;
    return { remoteHadMore: rec.remoteHadMore, localHadMore: rec.localHadMore };
  }

  // Lectura inicial (la espera `ready`). Siempre resuelve. Si falla, reintenta sola.
  function initialLoad() {
    if (loaded || loading) return Promise.resolve();
    loading = true;
    var late = firstAttemptDone; // del segundo intento en adelante la pantalla ya se dibujó vacía
    firstAttemptDone = true;
    return loadRemote().then(function (str) {
      loaded = true;
      retryMs = RETRY_MIN_MS;
      if (!late) { current = str; setStatus('ok'); return; }
      // Lectura tardía: unir lo remoto con lo hecho mientras tanto, subir lo local y,
      // si lo remoto aportó algo, recargar UNA vez para que la pantalla lo refleje.
      var r = mergeRemote(str);
      if (r.localHadMore) dirty = true;
      return flush().then(function () {
        setStatus(dirty ? 'offline' : 'ok');
        if (r.remoteHadMore && !dirty && !reloadedOnce) {
          reloadedOnce = true;
          try { window.location.reload(); } catch (e) {}
        }
      });
    }).catch(function (e) {
      if (e && e.noSession) { setStatus('nosession'); return; }
      setStatus('offline');
      scheduleRetry(initialLoad);
    }).then(function () { loading = false; });
  }

  // Al volver a la pestaña: traer lo remoto y unirlo en memoria (sin recargar).
  function resync() {
    if (MODE !== 'remote' || !loaded) return Promise.resolve();
    var go = dirty ? flush() : Promise.resolve();
    return go.then(function () {
      if (dirty || pushing) return;
      return loadRemote().then(function (str) {
        if (dirty || pushing) return; // hubo cambios mientras tanto: los maneja el empuje
        var r = mergeRemote(str);
        if (r.localHadMore) { dirty = true; return flush(); }
      });
    }).catch(function () { /* sin red: seguimos con lo que hay en memoria */ });
  }

  var ready = (MODE === 'remote') ? initialLoad() : Promise.resolve();

  /* -------------- Flush al ocultar / salir + eventos de página --------- */
  function beacon() {
    if (MODE !== 'remote' || !dirty || !loaded || current == null || current === unloadSnapshot) return;
    unloadSnapshot = current;
    try {
      fetch(ENDPOINT, {
        method: 'PUT', credentials: 'same-origin', keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: current
      });
    } catch (e) {}
  }
  window.addEventListener('pagehide', beacon);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') beacon();
    else resync();
  });
  window.addEventListener('online', function () { if (!loaded) initialLoad(); else flush(); });
  // Página restaurada de la caché de "atrás/adelante": su memoria quedó vieja.
  // Se recarga para volver a leer del servidor (antes se envía lo pendiente).
  window.addEventListener('pageshow', function (ev) {
    if (!ev.persisted || MODE !== 'remote') return;
    Promise.resolve(flush()).then(function () { window.location.reload(); });
  });

  /* --------------------------- API pública --------------------------- */
  window.AulaProgressRepo = {
    mode: MODE,
    ready: ready,
    // memoria (la usa progress.js)
    loadLocal: loadLocal,
    saveLocal: saveLocal,
    // persistencia remota
    loadRemote: loadRemote,
    saveRemote: saveRemote,
    // orquestación
    flush: flush,
    resync: resync,
    status: function () { return status; },
    onStatus: onStatus
  };
})();
