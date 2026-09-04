/* =========================================================================
   progress.repository.js — Capa de PERSISTENCIA desacoplada del progreso.

   La lógica educativa (progress.js) es SÍNCRONA y no debe saber DÓNDE se
   persiste. Este repositorio implementa esa frontera:

     • Caché local (síncrona)   → loadLocal() / saveLocal()   [localStorage]
       Es lo que progress.js usa directamente. Comportamiento idéntico al actual.

     • Persistencia remota (async) → loadRemote() / saveRemote()
       Habla con NUESTRO backend (/api/progress). El backend deriva la identidad
       del estudiante desde la SESIÓN LTI: el navegador nunca envía un user_id.

     • Sincronización (async)   → sync()
       Al abrir: trae lo remoto, lo reconcilia con la caché (unión sin pérdida,
       vía AulaProgress.reconcile) y, si hace falta, re-renderiza. Al guardar:
       escribe la caché al instante y empuja al servidor en segundo plano
       (con debounce). Si no hay red, queda en la caché y reintenta.

   MODOS (window.__AULA_PROGRESS__.mode):
     'local'  → sólo caché local. Idéntico a hoy. (por defecto)
     'remote' → servidor = principal, localStorage = caché.

   Cambiar de tecnología de almacenamiento NO toca este archivo ni progress.js:
   sólo cambia la implementación del store en el backend (y, si acaso, el
   endpoint). La lógica educativa queda intacta.
   ========================================================================= */
(function () {
  'use strict';

  var CFG = window.__AULA_PROGRESS__ || { mode: 'local', endpoint: '/api/progress' };
  var MODE = CFG.mode === 'remote' ? 'remote' : 'local';
  var ENDPOINT = CFG.endpoint || '/api/progress';
  var KEY = (window.AulaProgress && window.AulaProgress.STORAGE_KEY) || 'especializate_ia_progress_v2';
  var PUSH_DEBOUNCE_MS = 800;

  /* --------------------------- Caché local --------------------------- */
  var mem = null;
  function storageOk() {
    try { window.localStorage.setItem('__aula_repo_t__', '1'); window.localStorage.removeItem('__aula_repo_t__'); return true; }
    catch (e) { return false; }
  }
  function loadLocal() { return storageOk() ? window.localStorage.getItem(KEY) : mem; }
  function writeLocalRaw(str) { if (storageOk()) window.localStorage.setItem(KEY, str); else mem = str; }
  function saveLocal(str) { writeLocalRaw(str); schedulePush(); }

  /* ------------------------ Adaptador remoto ------------------------- */
  function nullRemote() {
    return { load: function () { return Promise.resolve(null); }, save: function () { return Promise.resolve(); } };
  }
  function httpRemote(ep) {
    return {
      load: function () {
        return fetch(ep, { credentials: 'same-origin', headers: { Accept: 'application/json' } })
          .then(function (r) {
            if (r.status === 401) { var e = new Error('sin_sesion'); e.noSession = true; throw e; }
            if (!r.ok) return null;
            return r.json();
          })
          .then(function (j) { return (j && j.doc != null) ? JSON.stringify(j.doc) : null; });
      },
      save: function (str) {
        var doc; try { doc = JSON.parse(str); } catch (e) { return Promise.resolve(); }
        return fetch(ep, {
          method: 'PUT', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(doc)
        }).then(function (r) { if (!r.ok) throw new Error('save_failed'); });
      }
    };
  }
  var remote = MODE === 'remote' ? httpRemote(ENDPOINT) : nullRemote();
  function loadRemote() { return remote.load(); }
  function saveRemote(str) { return remote.save(str); }

  /* --------------- Empuje al servidor (debounced) -------------------- */
  var pushTimer = null, dirty = false, pushing = false;
  function schedulePush() {
    if (MODE !== 'remote') return;
    dirty = true;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(flush, PUSH_DEBOUNCE_MS);
  }
  function flush() {
    if (MODE !== 'remote' || pushing || !dirty) return Promise.resolve();
    pushing = true;
    var snapshot = loadLocal();
    return saveRemote(snapshot)
      .then(function () { dirty = false; })
      .catch(function () { /* sin red: queda dirty y reintenta luego */ })
      .then(function () { pushing = false; });
  }

  /* ----------------------- Sincronización ---------------------------- */
  var reloadedOnce = false;
  function onHydrated(remoteHadMore) {
    // El servidor/otro dispositivo aportó progreso que la pantalla ya
    // renderizada no refleja. La forma menos invasiva de re-renderizar sin
    // tocar cada pantalla es recargar una vez (idempotente: tras recargar la
    // caché ya contiene todo y no se vuelve a recargar).
    if (remoteHadMore && !reloadedOnce) {
      reloadedOnce = true;
      try { window.location.reload(); } catch (e) {}
    }
  }
  function sync() {
    if (MODE !== 'remote') return Promise.resolve();
    if (!(window.AulaProgress && typeof window.AulaProgress.reconcile === 'function')) return Promise.resolve();
    return loadRemote().then(function (remoteStr) {
      var local = loadLocal();
      if (remoteStr == null) {
        // El servidor aún no tiene nada: si hay progreso local, lo subimos.
        if (local) { dirty = true; return flush(); }
        return;
      }
      var rec = window.AulaProgress.reconcile(remoteStr, local);
      writeLocalRaw(rec.merged);
      var jobs = [];
      if (rec.localHadMore) { dirty = true; jobs.push(flush()); }
      return Promise.all(jobs).then(function () { onHydrated(rec.remoteHadMore); });
    }).catch(function (e) {
      // Sin sesión o sin red: seguimos con la caché local, sin romper nada.
      if (e && e.noSession) { /* la capa de sesión se encarga del vencimiento */ }
    });
  }

  /* ------------------- Flush final al salir -------------------------- */
  window.addEventListener('pagehide', function () {
    if (MODE === 'remote' && dirty) {
      try {
        fetch(ENDPOINT, {
          method: 'PUT', credentials: 'same-origin', keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: loadLocal()
        });
      } catch (e) {}
    }
  });

  /* --------------------------- API pública --------------------------- */
  window.AulaProgressRepo = {
    mode: MODE,
    // caché local (la usa progress.js)
    loadLocal: loadLocal,
    saveLocal: saveLocal,
    // persistencia remota
    loadRemote: loadRemote,
    saveRemote: saveRemote,
    // orquestación
    sync: sync,
    flush: flush
  };

  // Arranque de la sincronización (sólo en modo remoto).
  if (MODE === 'remote') {
    if (document.readyState !== 'loading') sync();
    else document.addEventListener('DOMContentLoaded', sync);
  }
})();
