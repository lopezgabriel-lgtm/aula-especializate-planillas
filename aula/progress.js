/* =========================================================================
   progress.js — Lógica de avance y gamificación del aula "Introducción a la IA"
   Especializate
   -------------------------------------------------------------------------
   Estructura del curso:
     A. Inicio  -> 3 recursos (Sobre especIAlizate video, Programa PDF, Introducción video)  50 XP c/u
     B. Módulos -> 5 módulos; cada módulo = 4 unidades (40 XP c/u)
                   + 1 cuestionario del módulo en Moodle (50 XP)     = 200 XP
     C. Evaluación final -> cuestionario final (única instancia)      500 XP
     D. Certificación (meta, sin XP)

   Reglas de avance:
     - Los 3 recursos iniciales están disponibles desde el arranque.
     - Completar los 3 abre el Módulo 1.
     - Dentro de un módulo desbloqueado, sus 4 unidades están disponibles.
     - El cuestionario del módulo (Moodle) se habilita cuando las 4 unidades
       de ese módulo están completadas.
     - Un módulo se considera COMPLETO con sus 4 unidades + su cuestionario;
       recién ahí se abre el módulo siguiente.
     - Con los 5 módulos completos se abre la Evaluación final.
     - El cuestionario final activa la Certificación.

   Uso:
     ruta.html            -> AulaProgress.initRuta();
     páginas de módulo    -> window.MODULE_CONFIG = {...};
                             AulaProgress.initModulePage();
     páginas de contenido -> <body data-step="intro.especializate"> + initContentPage();

   Todo queda expuesto en window.AulaProgress para depuración manual.
   ========================================================================= */

window.AulaProgress = (function () {
  'use strict';

  function courseSlug() { var c = window.COURSE_CONFIG; return (c && c.slug) ? String(c.slug) : 'ia'; }
  var STORAGE_KEY = 'especializate_' + courseSlug() + '_progress_v2';
  // Clave del onboarding (la usa tour.js). Se declara acá solo para poder
  // limpiarla en reset(): "borrar el avance" también reinicia la ayuda guiada.
  var ONBOARDING_KEY = 'especializate_ia_onboarding_v1';
  // Registra que el estudiante ENTRÓ al cuestionario de un módulo (no valida
  // aprobación: eso vive en Moodle). Habilita el botón "Completar módulo".
  var QUIZVISIT_KEY = 'especializate_' + courseSlug() + '_quizvisited_v1';
  function loadQuizVisited() {
    try { var r = window.localStorage.getItem(QUIZVISIT_KEY); return r ? JSON.parse(r) : {}; }
    catch (e) { return {}; }
  }
  function quizVisited(num) { return !!loadQuizVisited()[String(num)]; }
  function markQuizVisited(num) {
    try { var o = loadQuizVisited(); o[String(num)] = true; window.localStorage.setItem(QUIZVISIT_KEY, JSON.stringify(o)); }
    catch (e) {}
  }

  // Registra el acceso al "Material de estudio" de CADA unidad, por separado
  // (clave "modulo.unidad", p. ej. "1.u2"). Habilita marcar esa unidad como
  // completada. Visitar el material de una unidad NO habilita el de las demás.
  var MATVISIT_KEY = 'especializate_' + courseSlug() + '_matvisited_v1';
  function loadMatVisited() {
    try { var r = window.localStorage.getItem(MATVISIT_KEY); return r ? JSON.parse(r) : {}; }
    catch (e) { return {}; }
  }
  function matVisited(num, uKey) { return !!loadMatVisited()[String(num) + '.' + uKey]; }
  function markMatVisited(num, uKey) {
    try { var o = loadMatVisited(); o[String(num) + '.' + uKey] = true; window.localStorage.setItem(MATVISIT_KEY, JSON.stringify(o)); }
    catch (e) {}
  }

  var UNIT_XP   = 40;   // cada unidad (4 unidades × 40 = 160)
  var MQUIZ_XP  = 40;   // cuestionario de módulo (160 + 40 = 200 por módulo)
  var INTRO_XP  = 50;   // cada recurso inicial (3 recursos × 50 = 150)
  var FINAL_XP  = 500;  // cuestionario final (única instancia de evaluación)
  // Estructura DATA-DRIVEN: la cantidad de unidades por módulo sale de COURSE_CONFIG.
  function moduleList() { var c = window.COURSE_CONFIG; return (c && c.modules) ? c.modules : []; }
  function unitCountOf(n) { var m = moduleList()[n - 1]; return (m && m.units) ? m.units.length : 4; }
  function unitKeysFor(n) { var a = [], c = unitCountOf(n); for (var i = 1; i <= c; i++) a.push('u' + i); return a; }
  var MODULES = moduleList().length || 5;

  /* ----------------------------------------------------------------------
     1) RECORRIDO GRANULAR — única fuente de verdad para XP y porcentaje.
        id con puntos: grupo.clave  ó  modules.N.uX / modules.N.quiz
        Etapa inicial: 3 recursos — Sobre especIAlizate (video),
        Programa del curso (PDF) e Introducción al curso (video), 50 XP c/u.
     ---------------------------------------------------------------------- */
  var GRANULAR = [];
  GRANULAR.push({ id: 'intro.especializate', xp: INTRO_XP });
  GRANULAR.push({ id: 'intro.programa',      xp: INTRO_XP });
  GRANULAR.push({ id: 'intro.introduccion',  xp: INTRO_XP });
  for (var m = 1; m <= MODULES; m++) {
    unitKeysFor(m).forEach(function (k) { GRANULAR.push({ id: 'modules.' + this.m + '.' + k, xp: UNIT_XP }); }, { m: m });
    GRANULAR.push({ id: 'modules.' + m + '.quiz', xp: MQUIZ_XP });
  }
  GRANULAR.push({ id: 'final.quiz', xp: FINAL_XP });

  var CERT = { id: 'certificate', label: 'Certificación', page: 'certificacion.html' };

  var TOTAL_XP    = GRANULAR.reduce(function (s, g) { return s + g.xp; }, 0); // 1650
  var TOTAL_STEPS = GRANULAR.length;                                          // 35

  // Metadatos de módulos (para etiquetas de ruta e insignias)
  var MODULE_META = {
    1: { label: 'Introducción a la Inteligencia Artificial' },
    2: { label: 'Diseño de Prompts: Comunicarse con la IA' },
    3: { label: 'Laboratorio de Prompts' },
    4: { label: 'Herramientas de IA para entornos educativos y laborales' },
    5: { label: 'Ética y uso responsable de la IA' }
  };

  /* ----------------------------------------------------------------------
     2) ESTADO POR DEFECTO
     ---------------------------------------------------------------------- */
  function emptyModule(n) {
    var o = {}; unitKeysFor(n).forEach(function (k) { o[k] = false; }); o.quiz = false; return o;
  }
  function defaultModules() {
    var mods = {}; for (var i = 1; i <= MODULES; i++) mods[String(i)] = emptyModule(i); return mods;
  }
  function defaultState() {
    return {
      intro:   { especializate: false, programa: false, introduccion: false },
      modules: defaultModules(),
      final:   { quiz: false },
      certificate: false,
      // Tracking por recurso (rediseño): { "<resourceId>": true }. Aditivo:
      // NO afecta XP ni %. Sólo alimenta el progreso y el gate de cada unidad.
      resources: {},
      // Insignias gamificadas: guarda qué modales de felicitación ya se mostraron
      // (el "desbloqueo" en sí se deriva del progreso; esto evita repetir el modal).
      achievements: { seen: { iniciante: false, explorador: false, arquitecto: false, experto: false } },
      xp: 0,
      lastUpdated: ''
    };
  }

  /* ----------------------------------------------------------------------
     3) ALMACENAMIENTO (con fallback en memoria si localStorage no está
        disponible, p. ej. algunos navegadores al abrir con file://)
     ---------------------------------------------------------------------- */
  var memoryStore = null;

  function storageAvailable() {
    try {
      var t = '__aula_test__';
      window.localStorage.setItem(t, '1');
      window.localStorage.removeItem(t);
      return true;
    } catch (e) { return false; }
  }
  // Acceso a la CACHÉ LOCAL. Si existe un ProgressRepository (capa de
  // persistencia desacoplada), delega en él; si no, usa localStorage como
  // siempre. La lógica educativa no cambia: sigue leyendo/escribiendo de forma
  // síncrona. El repositorio se encarga, aparte y en segundo plano, de
  // sincronizar con el servidor (persistencia principal). Ver progress.repository.js.
  function readRaw() {
    var repo = window.AulaProgressRepo;
    if (repo && typeof repo.loadLocal === 'function') {
      try { return repo.loadLocal(); } catch (e) { /* cae al fallback */ }
    }
    return storageAvailable() ? window.localStorage.getItem(STORAGE_KEY) : memoryStore;
  }
  function writeRaw(str) {
    var repo = window.AulaProgressRepo;
    if (repo && typeof repo.saveLocal === 'function') {
      try { repo.saveLocal(str); return; } catch (e) { /* cae al fallback */ }
    }
    if (storageAvailable()) window.localStorage.setItem(STORAGE_KEY, str); else memoryStore = str;
  }

  /* Combina lo guardado con el default (tolerante a cambios de estructura) */
  function merge(base, saved) {
    if (!saved || typeof saved !== 'object') return base;
    if (saved.intro) ['especializate', 'programa', 'introduccion'].forEach(function (k) {
      if (typeof saved.intro[k] === 'boolean') base.intro[k] = saved.intro[k];
    });
    if (saved.modules) Object.keys(base.modules).forEach(function (n) {
      var sm = saved.modules[n];
      if (sm && typeof sm === 'object') {
        Object.keys(base.modules[n]).forEach(function (k) {
          if (typeof sm[k] === 'boolean') base.modules[n][k] = sm[k];
        });
      }
    });
    if (saved.final) ['quiz'].forEach(function (k) {
      if (typeof saved.final[k] === 'boolean') base.final[k] = saved.final[k];
    });
    if (saved.achievements && saved.achievements.seen) {
      ['iniciante', 'explorador', 'arquitecto', 'experto'].forEach(function (k) {
        if (typeof saved.achievements.seen[k] === 'boolean') base.achievements.seen[k] = saved.achievements.seen[k];
      });
    }
    if (saved.resources && typeof saved.resources === 'object') {
      Object.keys(saved.resources).forEach(function (k) {
        if (typeof saved.resources[k] === 'boolean') base.resources[k] = saved.resources[k];
      });
    }
    return base;
  }

  function load() {
    var state = defaultState();
    try {
      var raw = readRaw();
      if (raw) state = merge(state, JSON.parse(raw));
    } catch (e) { state = defaultState(); }
    recompute(state);
    // Si el saneo secuencial corrigió una inconsistencia, lo persistimos para
    // que la corrección quede firme (no reescribe si no hubo cambios reales).
    if (state.__healed) {
      try { state.lastUpdated = new Date().toISOString(); writeRaw(JSON.stringify(state)); } catch (e) {}
    }
    delete state.__healed;
    return state;
  }

  function save(state) {
    recompute(state);
    state.lastUpdated = new Date().toISOString();
    delete state.__healed;
    try { writeRaw(JSON.stringify(state)); } catch (e) {}
    return state;
  }

  /* ----------------------------------------------------------------------
     4) LECTURA / ESCRITURA POR id
        Soporta: 'certificate' | 'intro.x' | 'final.x'
                 'modules.N'      (derivado: módulo completo)
                 'modules.N.uX' | 'modules.N.quiz'
     ---------------------------------------------------------------------- */
  function getFlag(state, id) {
    if (id === 'certificate') return !!state.certificate;
    var p = id.split('.');
    if (p[0] === 'modules') {
      var mod = state.modules[p[1]];
      if (!mod) return false;
      if (p.length === 2) return moduleComplete(mod);      // derivado
      return !!mod[p[2]];
    }
    return !!(state[p[0]] && state[p[0]][p[1]]);
  }

  function setFlag(state, id, value) {
    if (id === 'certificate') { state.certificate = !!value; return; }
    var p = id.split('.');
    if (p[0] === 'modules') {
      var mod = state.modules[p[1]];
      if (mod && p.length === 3) mod[p[2]] = !!value;
      return;
    }
    if (state[p[0]]) state[p[0]][p[1]] = !!value;
  }

  /* ----------------------------------------------------------------------
     5) DERIVADOS
     ---------------------------------------------------------------------- */
  function unitKeysOf(mod) {
    return Object.keys(mod || {}).filter(function (k) { return /^u\d+$/.test(k); });
  }
  function moduleComplete(mod) {
    if (!mod || !mod.quiz) return false;
    var ks = unitKeysOf(mod);
    return ks.length > 0 && ks.every(function (k) { return mod[k]; });
  }
  function moduleUnitsDone(mod) {
    if (!mod) return false;
    var ks = unitKeysOf(mod);
    return ks.length > 0 && ks.every(function (k) { return mod[k]; });
  }
  // Desbloqueo secuencial de unidades: la unidad 1 está siempre disponible;
  // la unidad i se habilita cuando la unidad (i-1) tiene el check marcado.
  function unitUnlocked(mod, i) {
    if (i <= 1) return true;
    return !!(mod && mod['u' + (i - 1)]);
  }
  function moduleUnitsCount(mod) {
    var n = 0; unitKeysOf(mod).forEach(function (k) { if (mod[k]) n++; }); return n;
  }
  function moduleHasProgress(mod) {
    return moduleUnitsCount(mod) > 0 || (mod && mod.quiz);
  }

  function recompute(state) {
    state.__healed = normalizeSequential(state);
    var xp = 0;
    GRANULAR.forEach(function (g) { if (getFlag(state, g.id)) xp += g.xp; });
    state.xp = xp;
    state.certificate = getFlag(state, 'final.quiz');
    return state;
  }

  // INTEGRIDAD SECUENCIAL: si un módulo está completo, todos los anteriores
  // también deben estarlo (no puede haber un módulo posterior completado con uno
  // anterior "en progreso"/"disponible"). Sanea estados inconsistentes heredados.
  function normalizeSequential(state) {
    var changed = false;
    var highest = 0;
    for (var i = MODULES; i >= 1; i--) {
      if (moduleComplete(state.modules[String(i)])) { highest = i; break; }
    }
    for (var m = 1; m < highest; m++) {
      var mod = state.modules[String(m)];
      if (mod && !moduleComplete(mod)) {
        unitKeysOf(mod).forEach(function (k) { mod[k] = true; }); mod.quiz = true;
        changed = true;
      }
    }
    return changed;
  }

  function completedCount(state) {
    var n = 0; GRANULAR.forEach(function (g) { if (getFlag(state, g.id)) n++; }); return n;
  }
  // El porcentaje se calcula por XP acumulada (misma base que "X / TOTAL XP"),
  // para que el % y la experiencia sean SIEMPRE consistentes. Antes se contaba
  // por cantidad de pasos, lo que divergía por los pesos distintos (p. ej. el
  // cuestionario final vale mucho más que una unidad).
  function percent(state) {
    if (!TOTAL_XP) return 0;
    return Math.round((xpOf(state) / TOTAL_XP) * 100);
  }
  function xpOf(state) {
    return GRANULAR.reduce(function (sum, g) {
      return sum + (getFlag(state, g.id) ? g.xp : 0);
    }, 0);
  }

  /* ----------------------------------------------------------------------
     5-bis) RECONCILIACIÓN (para la sincronización servidor <-> caché local)
        La usa el ProgressRepository al sincronizar. Es una función PURA:
        no lee ni escribe almacenamiento, sólo combina dos estados.

        Estrategia: UNIÓN monotónica. El progreso es (casi siempre) acumulativo,
        así que combinamos por OR: nunca se pierde algo ya completado en ningún
        lado (ideal al cambiar de dispositivo o volver de una edición offline).
        Luego recompute() recalcula XP/certificado y sanea la integridad
        secuencial, reutilizando EXACTAMENTE la misma lógica educativa.
     ---------------------------------------------------------------------- */
  function parseState(str) {
    var s = defaultState();
    try { if (str) s = merge(s, JSON.parse(str)); } catch (e) { s = defaultState(); }
    recompute(s); delete s.__healed;
    return s;
  }
  function unionInto(target, src) {
    ['especializate', 'programa', 'introduccion'].forEach(function (k) {
      target.intro[k] = target.intro[k] || src.intro[k];
    });
    Object.keys(target.modules).forEach(function (n) {
      ['u1', 'u2', 'u3', 'u4', 'quiz'].forEach(function (k) {
        target.modules[n][k] = target.modules[n][k] || (src.modules[n] && src.modules[n][k]);
      });
    });
    target.final.quiz = target.final.quiz || src.final.quiz;
    if (src.resources) Object.keys(src.resources).forEach(function (k) {
      if (src.resources[k]) target.resources[k] = true;
    });
    ['iniciante', 'explorador', 'arquitecto', 'experto'].forEach(function (k) {
      target.achievements.seen[k] = target.achievements.seen[k] || src.achievements.seen[k];
    });
  }
  function completedSet(state) {
    var set = {};
    GRANULAR.forEach(function (g) { if (getFlag(state, g.id)) set[g.id] = true; });
    return set;
  }
  function isSubset(a, b) { // ¿todo lo de a está en b?
    return Object.keys(a).every(function (k) { return b[k]; });
  }
  /**
   * reconcile(remoteStr, localStr) -> { merged, remoteHadMore, localHadMore }
   *   merged        : string JSON del estado combinado (para guardar en la caché)
   *   remoteHadMore : el combinado tiene ítems que la caché local NO tenía
   *                   (el servidor/otro dispositivo aportó progreso → re-render)
   *   localHadMore  : el combinado tiene ítems que el servidor NO tenía
   *                   (hay progreso local sin subir → hay que empujar al servidor)
   */
  function reconcile(remoteStr, localStr) {
    var remote = parseState(remoteStr);
    var local = parseState(localStr);
    var merged = defaultState();
    unionInto(merged, remote);
    unionInto(merged, local);
    recompute(merged);
    delete merged.__healed;
    merged.lastUpdated = new Date().toISOString();

    var mSet = completedSet(merged);
    var rSet = completedSet(remote);
    var lSet = completedSet(local);
    return {
      merged: JSON.stringify(merged),
      remoteHadMore: !isSubset(mSet, lSet),
      localHadMore: !isSubset(mSet, rSet)
    };
  }

  function introDone(state) {
    return state.intro.especializate && state.intro.programa && state.intro.introduccion;
  }
  function moduleUnlocked(state, n) {
    n = parseInt(n, 10);
    if (n === 1) return introDone(state);
    if (n >= 2 && n <= MODULES) return moduleComplete(state.modules[String(n - 1)]);
    return false;
  }
  function modulesDone(state) {
    var n = 0; for (var i = 1; i <= MODULES; i++) if (moduleComplete(state.modules[String(i)])) n++; return n;
  }
  function allModulesDone(state) { return modulesDone(state) === MODULES; }

  /* ----------------------------------------------------------------------
     6) DESBLOQUEO (para proteger páginas y renderizar la ruta)
     ---------------------------------------------------------------------- */
  function isUnlocked(id, state) {
    if (id === 'intro.especializate' || id === 'intro.programa' || id === 'intro.introduccion') return true;

    if (id.indexOf('modules.') === 0) {
      var p = id.split('.');
      var n = parseInt(p[1], 10);
      if (p.length === 2) return moduleUnlocked(state, n);            // hub del módulo
      if (p[2] === 'quiz') return moduleUnlocked(state, n) && moduleUnitsDone(state.modules[String(n)]);
      return moduleUnlocked(state, n);                                // unidad: disponible si el módulo lo está
    }
    if (id === 'final.quiz') return allModulesDone(state);
    if (id === 'certificate') return getFlag(state, 'final.quiz');
    return false;
  }

  /* Primer paso granular desbloqueado y sin completar (para "En progreso") */
  function currentStepId(state) {
    for (var i = 0; i < GRANULAR.length; i++) {
      var g = GRANULAR[i];
      if (isUnlocked(g.id, state) && !getFlag(state, g.id)) return g.id;
    }
    return null;
  }

  /* Estado visual de un nodo de la ruta: completed|in-progress|available|locked */
  function nodeState(id, state, current) {
    // Nodo de módulo: usa lógica derivada (completo / con progreso / disponible / bloqueado)
    if (/^modules\.\d+$/.test(id)) {
      var n = parseInt(id.split('.')[1], 10);
      var mod = state.modules[String(n)];
      if (moduleComplete(mod)) return 'completed';
      if (!moduleUnlocked(state, n)) return 'locked';
      return moduleHasProgress(mod) ? 'in-progress' : 'available';
    }
    if (getFlag(state, id)) return 'completed';
    if (!isUnlocked(id, state)) return 'locked';
    if (id === (current || currentStepId(state))) return 'in-progress';
    return 'available';
  }

  /* ----------------------------------------------------------------------
     7) MUTACIÓN
     ---------------------------------------------------------------------- */
  function complete(id)   { var s = load(); setFlag(s, id, true);  save(s); return s; }
  function uncomplete(id) { var s = load(); setFlag(s, id, false); save(s); return s; }

  /* Tracking por recurso (rediseño). Aditivo: no afecta XP/%. */
  function getResource(id) { return !!load().resources[id]; }
  function setResource(id, val) { var s = load(); if (!s.resources) s.resources = {}; s.resources[id] = !!val; save(s); return s; }

  /* ----------------------------------------------------------------------
     FUNCIÓN ÚNICA DE COMPLETADO DE MÓDULO
     Se ejecuta al marcar el módulo como completado (botón "Completar").
     Es la única responsable de: guardar el progreso, sumar experiencia,
     desbloquear el módulo siguiente y las insignias, y actualizar localStorage.
     El desbloqueo de módulos/insignias se deriva del estado (ver isUnlocked /
     moduleUnlocked / ACHIEVEMENTS), por eso alcanza con marcar y guardar.
     NO depende de "Volver a la ruta": el avance queda firme apenas se llama.
     ---------------------------------------------------------------------- */
  function completeModule(num) {
    var s = load();
    var mod = s.modules[String(num)];
    if (!mod) return s;
    // Requiere las 4 unidades hechas (contenido del módulo)
    if (!moduleUnitsDone(mod)) return s;
    setFlag(s, 'modules.' + num + '.quiz', true); // cierra el módulo (4 unidades + cuestionario)
    save(s); // save() recalcula XP y el certificado, y persiste en localStorage
    return s;
  }
  function reset() {
    try { if (storageAvailable()) window.localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    memoryStore = null;
    // "Volver a empezar" = experiencia de estudiante nuevo: también se olvida el
    // onboarding, para que el product tour vuelva a mostrarse automáticamente
    // (la ayuda vive en su propia clave, ver tour.js).
    try { if (storageAvailable()) window.localStorage.removeItem(ONBOARDING_KEY); } catch (e) {}
    try { if (storageAvailable()) window.localStorage.removeItem(QUIZVISIT_KEY); } catch (e) {}
    try { if (storageAvailable()) window.localStorage.removeItem(MATVISIT_KEY); } catch (e) {}
    try { if (window.AulaTour && window.AulaTour.reset) window.AulaTour.reset(); } catch (e) {}
    return defaultState();
  }

  /* ======================================================================
     8) INSIGNIAS (etapas)
     ====================================================================== */
  // Etapas que otorgan una medalla ilustrada (para mostrar la mini medalla como ícono).
  var STAGE_MEDAL = {
    inicio: 'img/insignia-iniciante.png',
    m1:     'img/insignia-explorador.png',
    m3:     'img/insignia-arquitecto.png',
    m5:     'img/insignia-experto.png'
  };

  function badges(state) {
    var list = [];
    list.push({ id: 'inicio', label: 'Inicio', kind: 'inicio', medal: STAGE_MEDAL.inicio,
                earned: introDone(state), unlocked: true });
    for (var i = 1; i <= MODULES; i++) {
      list.push({ id: 'm' + i, label: 'Módulo ' + i, kind: 'module', num: i,
                  medal: STAGE_MEDAL['m' + i] || null,
                  earned: moduleComplete(state.modules[String(i)]),
                  unlocked: moduleUnlocked(state, i) });
    }
    list.push({ id: 'evaluacion', label: 'Evaluación', kind: 'final',
                earned: getFlag(state, 'final.quiz'),
                unlocked: allModulesDone(state) });
    list.push({ id: 'certificacion', label: 'Certificación', kind: 'cert',
                earned: !!state.certificate, unlocked: !!state.certificate });
    return list;
  }

  function badgeState(b) { return b.earned ? 'earned' : (b.unlocked ? 'unlocked' : 'locked'); }

  var BADGE_ICON = {
    inicio:        '<path d="M13 3l-9 12h6l-1 6 9-12h-6z"/>',
    module:        '<path d="M12 2 3 7l9 5 9-5-9-5zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
    final:         '<path d="M9 16.17l-3.5-3.5L4 14.17 9 19l11-11-1.5-1.5z"/>',
    cert:          '<path d="M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm-3 1.5L8 22l4-2 4 2-1-5.5"/>'
  };

  function renderBadges(state) {
    var host = document.querySelector('[data-badges]');
    if (!host) return;
    var items = badges(state);
    var html = items.map(function (b) {
      var st = badgeState(b);
      var iconKey = b.kind === 'module' ? 'module' : b.kind;
      var stateText = st === 'earned' ? 'Obtenida' : (st === 'unlocked' ? 'Desbloqueada' : 'Bloqueada');
      var stroke = (iconKey === 'module');
      var corner = (st === 'earned' ? '<span class="badge-tick" aria-hidden="true">✓</span>'
                   : (st === 'locked' ? '<span class="badge-lock" aria-hidden="true">🔒</span>' : ''));
      // Si la etapa tiene medalla ilustrada, la usamos como ícono (mini medalla);
      // si no, mostramos el emblema SVG temático.
      var emblem = b.medal
        ? '<span class="badge-emblem medal" aria-hidden="true">' +
            '<img class="badge-medal-img" src="' + b.medal + '" alt="" loading="lazy">' + corner +
          '</span>'
        : '<span class="badge-emblem" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" ' + (stroke ? 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"' : 'fill="currentColor"') + '>' +
              BADGE_ICON[iconKey] +
            '</svg>' + corner +
          '</span>';
      return '' +
        '<div class="badge-chip ' + st + (b.medal ? ' has-medal' : '') + '" role="listitem" ' +
             'aria-label="Insignia ' + b.label + ': ' + stateText + '">' +
          emblem +
          '<span class="badge-label">' + b.label + '</span>' +
          '<span class="badge-state">' + stateText + '</span>' +
        '</div>';
    }).join('');
    host.innerHTML = html;

    var earnedCount = items.filter(function (b) { return b.earned; }).length;
    setText('badges-count', earnedCount + ' / ' + items.length);
  }

  /* ======================================================================
     8-bis) INSIGNIAS GAMIFICADAS (logros con imagen + modal de felicitación)
     ----------------------------------------------------------------------
     Sistema de reconocimiento visual del progreso. Cuatro insignias que se
     desbloquean al alcanzar ciertos hitos del recorrido. Cada una:
       - tiene estado bloqueado (gris/opaco) y desbloqueado (a color, con brillo);
       - al desbloquearse por primera vez dispara un modal de felicitación;
       - el "ya vi el modal" se guarda en localStorage (state.achievements.seen)
         para no repetirlo tras recargar la página.
     ====================================================================== */

  /* --- 8-bis.1) DEFINICIÓN DE INSIGNIAS ---------------------------------
     id        : clave interna y de persistencia
     name      : nombre visible en la insignia
     img       : ruta de la imagen (PNG con fondo transparente)
     milestone : hito que la otorga (texto informativo)
     unlocked  : función que, dado el estado, indica si está desbloqueada
     modalTitle / modalText : contenido del modal de felicitación
     -------------------------------------------------------------------- */
  var ACHIEVEMENTS = [
    {
      id: 'iniciante',
      name: 'Iniciante',
      img: 'img/insignia-iniciante.png',
      milestone: 'Etapa 1 completada',
      unlocked: function (s) { return introDone(s); },
      modalTitle: '¡Felicitaciones!',
      modalText:
        'Completaste la Etapa 1 y desbloqueaste tu primera insignia.\n\n' +
        'Se te asignó la insignia Iniciante, que representa el comienzo de tu recorrido de aprendizaje.\n\n' +
        'Seguí avanzando para descubrir nuevas herramientas, desafíos y reconocimientos.'
    },
    {
      id: 'explorador',
      name: 'Explorador',
      img: 'img/insignia-explorador.png',
      milestone: 'Módulo 1 completado',
      unlocked: function (s) { return moduleComplete(s.modules['1']); },
      modalTitle: '¡Felicitaciones!',
      modalText:
        'Completaste el Módulo 1 y desbloqueaste una nueva insignia.\n\n' +
        'Se te asignó la insignia Explorador, que representa tu avance en el recorrido y tu disposición para seguir descubriendo nuevas posibilidades.\n\n' +
        'Seguí explorando el curso para alcanzar los próximos logros.'
    },
    {
      id: 'arquitecto',
      name: 'Arquitecto',
      img: 'img/insignia-arquitecto.png',
      milestone: 'Módulo 3 completado',
      unlocked: function (s) { return moduleComplete(s.modules['3']); },
      modalTitle: '¡Felicitaciones!',
      modalText:
        'Completaste el Módulo 3 y desbloqueaste una nueva insignia.\n\n' +
        'Se te asignó la insignia Arquitecto, que representa tu capacidad para construir ideas, organizar procesos y aplicar lo aprendido de manera estratégica.\n\n' +
        'Seguí avanzando: ya estás cada vez más cerca de completar el recorrido.'
    },
    {
      id: 'experto',
      name: 'Experto',
      img: 'img/insignia-experto.png',
      milestone: 'Módulo 5 completado',
      unlocked: function (s) { return moduleComplete(s.modules['5']); },
      modalTitle: '¡Felicitaciones!',
      modalText:
        'Completaste el Módulo 5 y desbloqueaste la insignia final.\n\n' +
        'Se te asignó la insignia Experto, que representa el logro alcanzado y el dominio de los contenidos principales del recorrido.\n\n' +
        '¡Excelente trabajo! Completaste una parte clave de tu camino de aprendizaje.'
    }
  ];

  /* --- 8-bis.2) CONSULTAS DE DESBLOQUEO -------------------------------- */
  function achievementById(id) {
    for (var i = 0; i < ACHIEVEMENTS.length; i++) if (ACHIEVEMENTS[i].id === id) return ACHIEVEMENTS[i];
    return null;
  }
  function isAchievementUnlocked(state, id) {
    var a = achievementById(id);
    return a ? !!a.unlocked(state) : false;
  }
  // Devuelve las insignias desbloqueadas cuyo modal todavía NO se mostró.
  function pendingCelebrations(state) {
    return ACHIEVEMENTS.filter(function (a) {
      return a.unlocked(state) && !(state.achievements && state.achievements.seen[a.id]);
    });
  }

  /* --- 8-bis.3) GUARDADO EN localStorage ------------------------------- */
  // Marca el modal de una insignia como ya mostrado y persiste el estado.
  function markCelebrationSeen(id) {
    var s = load();
    if (s.achievements && s.achievements.seen && Object.prototype.hasOwnProperty.call(s.achievements.seen, id)) {
      s.achievements.seen[id] = true;
      save(s);
    }
    return s;
  }

  /* --- 8-bis.4) RENDERIZADO VISUAL DE INSIGNIAS (strip compacto) ------- */
  // Aclaración pequeña (texto secundario) de cuándo se habilita cada insignia.
  var ACHV_HINT = {
    iniciante:  'Se habilita al completar la etapa inicial.',
    explorador: 'Se habilita al completar el módulo 1.',
    arquitecto: 'Se habilita al completar el módulo 3.',
    experto:    'Se habilita al completar el módulo 5.'
  };
  function renderAchievements(state) {
    var host = document.querySelector('[data-achievements]');
    if (!host) return;
    var html = ACHIEVEMENTS.map(function (a) {
      var on = a.unlocked(state);
      return '' +
        '<div class="achv ' + (on ? 'unlocked' : 'locked') + '" data-achv="' + a.id + '" ' +
             'role="listitem" aria-label="Insignia ' + a.name + ': ' + (on ? 'obtenida' : 'bloqueada') + '">' +
          '<div class="achv-medal">' +
            '<img src="' + a.img + '" alt="Insignia ' + a.name + '" loading="lazy" draggable="false">' +
            (on ? '<span class="achv-shine" aria-hidden="true"></span>' : '<span class="achv-lock" aria-hidden="true">' +
              '<svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zM9 6a3 3 0 0 1 6 0v2H9V6z"/></svg>' +
            '</span>') +
          '</div>' +
          '<div class="achv-tx">' +
            '<span class="achv-name">' + a.name + '</span>' +
            '<span class="achv-state">' + (on ? 'Obtenida' : 'Bloqueada') + '</span>' +
            '<span class="achv-hint">' + (ACHV_HINT[a.id] || '') + '</span>' +
          '</div>' +
        '</div>';
    }).join('');
    host.innerHTML = html;

    var got = ACHIEVEMENTS.filter(function (a) { return a.unlocked(state); }).length;
    setText('achievements-count', got + ' / ' + ACHIEVEMENTS.length);
  }

  /* --- 8-bis.4b) INSIGNIA ACTUAL EN GRANDE (hero) ----------------------
     Devuelve la insignia más alta ya obtenida (la última en el orden del
     recorrido) y la muestra con protagonismo en el panel superior.
     -------------------------------------------------------------------- */
  function currentAchievement(state) {
    var cur = null;
    ACHIEVEMENTS.forEach(function (a) { if (a.unlocked(state)) cur = a; }); // el último desbloqueado = el más alto
    return cur;
  }

  function renderCurrentBadge(state) {
    var host = document.querySelector('[data-current-badge]');
    if (!host) return;
    var a = currentAchievement(state);
    if (a) {
      host.className = 'dash-hero has-badge';
      host.innerHTML =
        '<div class="dash-hero-medal">' +
          '<span class="dash-hero-glow" aria-hidden="true"></span>' +
          '<img src="' + a.img + '" alt="Insignia actual: ' + a.name + '">' +
        '</div>' +
        '<div class="dash-hero-tx">' +
          '<span class="dash-hero-kicker">Insignia actual</span>' +
          '<span class="dash-hero-name">' + a.name + '</span>' +
          '<span class="dash-hero-sub">¡Buen trabajo! Seguí sumando logros.</span>' +
        '</div>';
    } else {
      host.className = 'dash-hero empty';
      host.innerHTML =
        '<div class="dash-hero-medal locked">' +
          '<img src="img/insignia-iniciante.png" alt="">' +
          '<span class="dash-hero-lock" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zM9 6a3 3 0 0 1 6 0v2H9V6z"/></svg>' +
          '</span>' +
        '</div>' +
        '<div class="dash-hero-tx">' +
          '<span class="dash-hero-kicker">Todavía sin insignias</span>' +
          '<span class="dash-hero-name muted">Completá la Etapa 1</span>' +
          '<span class="dash-hero-sub">Tu primera medalla te espera.</span>' +
        '</div>';
    }
  }

  /* --- 8-bis.5) ACTIVACIÓN DE MODALES ---------------------------------
     Muestra un modal por cada insignia recién desbloqueada. Si se desbloquea
     más de una a la vez, se encolan y se muestran de a una. Cada modal se
     marca como "visto" en el momento de mostrarse (persistente), de modo que
     no vuelve a aparecer aunque se recargue la página.
     -------------------------------------------------------------------- */
  var celebrationQueue = [];
  var celebrationActive = false;

  function runCelebrations(list) {
    if (!list || !list.length) return;
    // Marcamos como vistas de entrada para garantizar "solo una vez"
    list.forEach(function (a) { markCelebrationSeen(a.id); });
    celebrationQueue = celebrationQueue.concat(list);
    if (!celebrationActive) showNextCelebration();
  }

  function showNextCelebration() {
    var modal = document.getElementById('achv-modal');
    if (!modal) { celebrationQueue = []; celebrationActive = false; return; }
    if (!celebrationQueue.length) { celebrationActive = false; return; }

    celebrationActive = true;
    var a = celebrationQueue.shift();

    var img = document.getElementById('achv-modal-img');
    if (img) { img.src = a.img; img.alt = 'Insignia ' + a.name; }
    setText('achv-modal-title', a.modalTitle);
    setText('achv-modal-badge', a.name);

    // El texto puede tener saltos de párrafo (\n\n)
    var body = document.getElementById('achv-modal-text');
    if (body) {
      body.innerHTML = '';
      a.modalText.split('\n\n').forEach(function (para) {
        var p = document.createElement('p');
        p.textContent = para;
        body.appendChild(p);
      });
    }

    modal.hidden = false;
    // reinicia la animación de entrada
    var dialog = modal.querySelector('.achv-modal-dialog');
    if (dialog) { dialog.classList.remove('pop'); void dialog.offsetWidth; dialog.classList.add('pop'); }
    document.body.classList.add('modal-open');

    var closeBtn = modal.querySelector('[data-achv-close]');
    if (closeBtn) closeBtn.focus();

    // refresca las insignias visibles (por si el render previo era viejo)
    renderAchievements(load());
  }

  function closeCelebration() {
    var modal = document.getElementById('achv-modal');
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    // ¿queda otra en la cola?
    if (celebrationQueue.length) { setTimeout(showNextCelebration, 220); }
    else { celebrationActive = false; }
  }

  function setupCelebrationModal() {
    var modal = document.getElementById('achv-modal');
    if (!modal || modal.__wired) return;
    modal.__wired = true;
    Array.prototype.forEach.call(modal.querySelectorAll('[data-achv-close]'), function (el) {
      el.addEventListener('click', closeCelebration);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) closeCelebration();
    });
  }

  /* ======================================================================
     9) RENDER DE ruta.html
     ====================================================================== */
  function initRuta() {
    var state = load();

    var pct = percent(state);
    setText('progress-pct', pct + '%');
    var fill = document.getElementById('progress-fill');
    if (fill) {
      fill.style.width = pct + '%';
      var bar = fill.closest('[role="progressbar"]');
      if (bar) bar.setAttribute('aria-valuenow', String(pct));
    }
    setText('xp-current', String(state.xp));
    setText('xp-total', String(TOTAL_XP));
    setText('modules-count', modulesDone(state) + ' / ' + MODULES);
    setText('status-general', generalStatusText(state));

    setText('cert-msg', isUnlocked('certificate', state)
      ? 'Accedé a Moodle para consultar y descargar tu certificado. La aprobación y la disponibilidad se validan allí.'
      : 'Completá la Evaluación final para habilitar este acceso.');

    // --- Insignias gamificadas: insignia actual (hero) + strip + modales ---
    renderCurrentBadge(state);
    renderAchievements(state);
    setupCelebrationModal();
    setupHelpModal();   // guía textual del footer ("Ver ayuda de navegación")
    var pend = pendingCelebrations(state); // desbloqueadas cuyo modal aún no se mostró
    if (pend.length) runCelebrations(pend);

    var current = currentStepId(state);
    var nodes = document.querySelectorAll('[data-step]');
    Array.prototype.forEach.call(nodes, function (node) {
      applyNodeState(node, node.getAttribute('data-step'), state, current);
    });

    setupFinalQuizModal(state);   // el "Cuestionario final" abre un modal (no navega)
    setupCertModal(state);        // el "Certificado del curso" abre un modal (no navega)
    setupToast();
  }

  /* ---- Modal de CERTIFICADO (felicitación + CTA a Moodle para descargarlo) ---- */
  function setupCertModal(state) {
    var card = document.querySelector('.cert-card[data-step="certificate"]');
    var modal = document.getElementById('cert-modal');
    if (!card || !modal) return;

    if (isUnlocked('certificate', state)) {
      card.removeAttribute('href');
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.onclick = function (e) { e.preventDefault(); openCertModal(); };
      card.onkeydown = function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCertModal(); }
      };
    }

    var go = modal.querySelector('[data-cert-go]');
    var url = safeHref(card.getAttribute('data-cert-url'));
    if (go && !isPlaceholderUrl(url)) go.setAttribute('href', url);

    if (modal.__wired) return;
    modal.__wired = true;

    if (go) {
      go.addEventListener('click', function (e) {
        if (isPlaceholderUrl(card.getAttribute('data-cert-url'))) {
          e.preventDefault();
          showToast('Pendiente: cargá el enlace del certificado (data-cert-url).', 'warning');
        }
      });
    }
    Array.prototype.forEach.call(modal.querySelectorAll('[data-cert-close]'), function (el) {
      el.addEventListener('click', closeCertModal);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) closeCertModal();
    });
  }
  function openCertModal() {
    var modal = document.getElementById('cert-modal');
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    var dialog = modal.querySelector('.final-modal-dialog');
    if (dialog) { dialog.classList.remove('pop'); void dialog.offsetWidth; dialog.classList.add('pop'); }
    var go = modal.querySelector('[data-cert-go]');
    if (go) go.focus();
  }
  function closeCertModal() {
    var modal = document.getElementById('cert-modal');
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
  }

  /* ---- Modal del CUESTIONARIO FINAL (contexto + felicitación + CTA a Moodle) ---- */
  function setupFinalQuizModal(state) {
    var card = document.querySelector('.stage-card[data-step="final.quiz"]');
    var modal = document.getElementById('final-quiz-modal');
    if (!card || !modal) return;

    // Si está desbloqueado, la tarjeta abre el modal en vez de navegar.
    if (isUnlocked('final.quiz', state)) {
      card.removeAttribute('href');           // evita navegación; el modal toma el control
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.onclick = function (e) { e.preventDefault(); openFinalQuizModal(); };
      card.onkeydown = function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFinalQuizModal(); }
      };
    }

    // CTA -> enlace de Moodle (o aviso "pendiente" si es placeholder).
    // El href se actualiza en cada init (por si cambia la URL); el listener,
    // una sola vez.
    var go = modal.querySelector('[data-fq-go]');
    var url = safeHref(card.getAttribute('data-quiz-url'));
    if (go && !isPlaceholderUrl(url)) go.setAttribute('href', url);

    // Refleja el estado ya-completado (autodeclarado) al render/reabrir.
    refreshFinalQuizModal();

    if (modal.__wired) return;
    modal.__wired = true;

    if (go) {
      go.addEventListener('click', function (e) {
        if (isPlaceholderUrl(card.getAttribute('data-quiz-url'))) {
          e.preventDefault();
          showToast('Pendiente: cargá el enlace del cuestionario final (data-quiz-url).', 'warning');
          return;
        }
        // Abrió el cuestionario -> habilita el botón de "marcar como completado".
        modal.__opened = true;
        refreshFinalQuizModal();
      });
    }

    // Botón "Ya rendí — marcar como completado" (autodeclarado, con confirmación).
    var done = modal.querySelector('[data-fq-done]');
    if (done) {
      done.addEventListener('click', function () {
        if (getFlag(load(), 'final.quiz')) return; // ya estaba marcado
        var ok = window.confirm('¿Confirmás que ya rendiste el cuestionario final en Moodle? Con esto se habilitará tu certificación.');
        if (!ok) return;
        complete('final.quiz');
        showToast('¡Cuestionario final completado! Ya podés acceder a tu certificación.', 'achievement');
        refreshFinalQuizModal();
        // refresca la ruta (tarjeta, XP, %, certificación) sin recargar
        initRuta();
      });
    }

    Array.prototype.forEach.call(modal.querySelectorAll('[data-fq-close]'), function (el) {
      el.addEventListener('click', closeFinalQuizModal);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) closeFinalQuizModal();
    });
  }

  // Ajusta el modal según si el cuestionario ya está marcado y si ya abrió Moodle.
  function refreshFinalQuizModal() {
    var modal = document.getElementById('final-quiz-modal');
    if (!modal) return;
    var card = document.querySelector('.stage-card[data-step="final.quiz"]');
    var isDone = getFlag(load(), 'final.quiz');
    var isPlaceholder = card ? isPlaceholderUrl(card.getAttribute('data-quiz-url')) : true;

    var done = modal.querySelector('[data-fq-done]');
    var hint = modal.querySelector('[data-fq-hint]');
    var doneMsg = modal.querySelector('[data-fq-donemsg]');
    var label = modal.querySelector('[data-fq-done-label]');

    if (isDone) {
      if (done) { done.disabled = true; done.classList.add('is-done'); }
      if (label) label.textContent = 'Cuestionario final completado';
      if (hint) hint.hidden = true;
      if (doneMsg) doneMsg.hidden = false;
      return;
    }
    if (doneMsg) doneMsg.hidden = true;
    if (label) label.textContent = 'Ya rendí el cuestionario — marcar como completado';
    // Habilitado solo tras abrir Moodle (evita marcar sin haber rendido).
    // Si la URL es placeholder, no se puede abrir todavía: queda deshabilitado.
    var canMark = !!modal.__opened && !isPlaceholder;
    if (done) done.disabled = !canMark;
    if (hint) {
      hint.hidden = false;
      hint.textContent = isPlaceholder
        ? 'El enlace del cuestionario todavía no está cargado.'
        : (canMark
            ? 'Cuando lo hayas rendido, marcalo como completado.'
            : 'Primero abrí el cuestionario; después vas a poder marcarlo como completado.');
    }
  }

  function openFinalQuizModal() {
    var modal = document.getElementById('final-quiz-modal');
    if (!modal) return;
    refreshFinalQuizModal();
    modal.hidden = false;
    document.body.classList.add('modal-open');
    var dialog = modal.querySelector('.final-modal-dialog');
    if (dialog) { dialog.classList.remove('pop'); void dialog.offsetWidth; dialog.classList.add('pop'); }
    var go = modal.querySelector('[data-fq-go]');
    if (go) go.focus();
  }
  function closeFinalQuizModal() {
    var modal = document.getElementById('final-quiz-modal');
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
  }

  function applyNodeState(node, id, state, current) {
    var st = nodeState(id, state, current);

    node.classList.remove('completed', 'locked', 'in-progress', 'available');
    node.classList.add(st);
    // marca de estado también en la node-row contenedora (para el punto de la línea)
    var row = node.closest('.node-row');
    if (row) {
      row.classList.remove('completed', 'locked', 'in-progress', 'available');
      row.classList.add(st);
    }

    var labelText = ({ 'completed': 'Completado', 'locked': 'Bloqueado', 'in-progress': 'En progreso', 'available': 'Disponible' })[st];
    var statusEl = node.querySelector('[data-status]');
    if (statusEl) statusEl.textContent = labelText;

    var isLink = node.tagName === 'A';
    if (st === 'locked') {
      node.setAttribute('aria-disabled', 'true');
      node.setAttribute('aria-label', (node.getAttribute('data-label') || labelText) + ' — bloqueado. Completá la etapa anterior.');
      if (isLink) {
        if (node.getAttribute('href')) node.setAttribute('data-href', node.getAttribute('href'));
        node.removeAttribute('href');
        node.setAttribute('tabindex', '0');
      }
      node.onclick = function (e) { e.preventDefault(); showToast('Completá la etapa anterior para desbloquear esta sección.', 'info'); };
    } else {
      node.removeAttribute('aria-disabled');
      node.onclick = null;
      if (isLink && !node.getAttribute('href') && node.getAttribute('data-href')) {
        node.setAttribute('href', node.getAttribute('data-href'));
      }
      var suffix = st === 'completed' ? ' — completado' : (st === 'in-progress' ? ' — en progreso' : '');
      if (node.getAttribute('data-label')) node.setAttribute('aria-label', node.getAttribute('data-label') + suffix);
    }
  }

  function generalStatusText(state) {
    if (state.certificate) return '¡Recorrido completo! Certificación disponible.';
    if (allModulesDone(state)) return 'Módulos completos. Encará la evaluación final.';
    if (introDone(state)) return 'En módulos del curso (' + modulesDone(state) + ' de ' + MODULES + ' completos).';
    if (completedCount(state) > 0) return 'Completando la información inicial.';
    return 'Comenzá por la información inicial.';
  }

  /* ======================================================================
     9-bis) PÁGINA DE INICIO (index.html) — pantalla puente desde Moodle
     Solo LEE el progreso guardado (no lo modifica) para mostrar un resumen:
     % de avance, XP, insignia actual, próximo objetivo e insignias.
     ====================================================================== */

  // Próximo objetivo en lenguaje claro, derivado del estado real.
  function nextGoalText(state) {
    if (state.certificate) return 'Acceder a tu certificación';
    if (allModulesDone(state) && !getFlag(state, 'final.quiz')) return 'Realizar el cuestionario final';
    if (!introDone(state)) return 'Completar la etapa inicial';
    // Módulo en curso = el primero no completo
    for (var i = 1; i <= MODULES; i++) {
      if (!moduleComplete(state.modules[String(i)])) return 'Completar el Módulo ' + i;
    }
    return 'Continuar el recorrido';
  }

  function initIndex() {
    var state = load();
    var started = completedCount(state) > 0;

    // --- Resumen de avance ---
    var pct = percent(state);
    setText('idx-progress-pct', pct + '%');
    var fill = document.getElementById('idx-progress-fill');
    if (fill) {
      fill.style.width = pct + '%';
      var bar = fill.closest('[role="progressbar"]');
      if (bar) bar.setAttribute('aria-valuenow', String(pct));
    }
    setText('idx-xp', state.xp + ' / ' + TOTAL_XP + ' XP');
    setText('idx-modules', modulesDone(state) + ' / ' + MODULES);
    setText('idx-goal', nextGoalText(state));

    var cur = currentAchievement(state);
    setText('idx-badge-name', cur ? cur.name : 'Todavía sin insignias');
    var badgeImg = document.getElementById('idx-badge-img');
    if (badgeImg) {
      badgeImg.src = cur ? cur.img : 'img/insignia-iniciante.png';
      badgeImg.alt = cur ? ('Insignia actual: ' + cur.name) : '';
      badgeImg.classList.toggle('is-locked', !cur);
    }

    // Estado "empezado" vs "sin empezar"
    var startedBox = document.querySelector('[data-idx-started]');
    var emptyBox = document.querySelector('[data-idx-empty]');
    if (startedBox) startedBox.hidden = !started;
    if (emptyBox) emptyBox.hidden = started;

    // --- Insignias del recorrido (mismo render que la ruta) ---
    renderAchievements(state);

    // --- Ayuda de navegación (modal) ---
    setupHelpModal();
  }

  /* Modal de ayuda de navegación (se abre desde "Ver ayuda de navegación") */
  function setupHelpModal() {
    var modal = document.getElementById('help-modal');
    if (!modal || modal.__wired) return;
    modal.__wired = true;
    Array.prototype.forEach.call(document.querySelectorAll('[data-help-open]'), function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); openHelp(); });
    });
    Array.prototype.forEach.call(modal.querySelectorAll('[data-help-close]'), function (el) {
      el.addEventListener('click', closeHelp);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) closeHelp();
    });
  }
  function openHelp() {
    var modal = document.getElementById('help-modal');
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    var dialog = modal.querySelector('.help-modal-dialog');
    if (dialog) { dialog.classList.remove('pop'); void dialog.offsetWidth; dialog.classList.add('pop'); }
    var close = modal.querySelector('[data-help-close]');
    if (close) close.focus();
  }
  function closeHelp() {
    var modal = document.getElementById('help-modal');
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
  }

  /* ======================================================================
     10) PÁGINAS DE MÓDULO (hub con grilla de unidades + cuestionario)
         Requiere window.MODULE_CONFIG y un contenedor [data-module-grid].
     ====================================================================== */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function safeHref(url) {
    if (!url) return '';
    var u = String(url).trim();
    if (/^javascript:/i.test(u)) return '';
    return u;
  }
  function isPlaceholderUrl(url) {
    var u = safeHref(url);
    return (!u || u === '#' || /^REEMPLAZAR/i.test(u));
  }

  var UNIT_BTN_ICON = {
    video:    '<path d="M8 5v14l11-7z"/>',
    material: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    doc:      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    check:    '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'
  };
  function unitBtnSvg(kind, filled) {
    return '<svg viewBox="0 0 24 24" ' +
      (filled ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"') +
      '>' + UNIT_BTN_ICON[kind] + '</svg>';
  }

  // Inserta el iframe del video destacado del módulo en [data-module-video].
  function renderModuleVideo(videoId) {
    var host = document.querySelector('[data-module-video]');
    if (!host) return;
    if (videoId && !/^REEMPLAZAR/i.test(videoId)) {
      host.innerHTML =
        '<div class="module-video-frame">' +
          '<iframe src="https://www.youtube.com/embed/' + encodeURIComponent(videoId) + '?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3" ' +
            'title="Video del módulo" loading="lazy" ' +
            'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ' +
            'referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>' +
        '</div>';
      host.hidden = false;
    } else {
      // Sin ID cargado: marcador editable
      host.innerHTML =
        '<div class="module-video-frame placeholder">' +
          '<div class="mv-placeholder">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
            '<span>Video del módulo — cargá el ID de YouTube en <code>moduleVideoId</code></span>' +
          '</div>' +
        '</div>';
      host.hidden = false;
    }
  }

  function initModulePage() {
    var cfg = window.MODULE_CONFIG;
    var grid = document.querySelector('[data-module-grid]');
    if (!cfg || !grid) return;
    var num = parseInt(cfg.num, 10);
    var moduleId = 'modules.' + num;
    var state = load();

    setText('page-xp-total', String(TOTAL_XP));
    setText('page-xp-current', String(state.xp));
    setText('module-title', cfg.title || (MODULE_META[num] && MODULE_META[num].label) || ('Módulo ' + num));

    // Protección: módulo bloqueado -> aviso y salir
    if (!moduleUnlocked(state, num)) { showLockedNotice(); return; }

    // --- Video destacado del módulo (iframe de YouTube, arriba de las unidades) ---
    renderModuleVideo(cfg.moduleVideoId);

    // --- Construcción de la grilla (4 unidades + celda de cuestionario) ---
    var units = cfg.units || [];
    var cardsHtml = '';
    for (var i = 0; i < UNITS_PER_MODULE; i++) {
      var uNum = i + 1;
      var uKey = 'u' + uNum;
      var data = units[i] || {};
      var uTitle = data.title || 'Título de la unidad';
      var vid = data.videoId ? esc(data.videoId) : '';
      cardsHtml +=
        '<article class="unit-card" data-unit="' + uKey + '">' +
          '<header class="unit-card-head">' +
            '<div class="unit-card-titles">' +
              '<span class="unit-kicker">Unidad ' + uNum + '</span>' +
              '<h3 class="unit-name">' + esc(uTitle) + '</h3>' +
            '</div>' +
            '<button type="button" class="unit-check" data-unit-check="' + uKey + '" ' +
                    'role="switch" aria-checked="false" aria-label="Marcar Unidad ' + uNum + ' como completada">' +
              '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>' +
            '</button>' +
          '</header>' +
          '<div class="unit-actions">' +
            '<button type="button" class="unit-btn" data-video="' + vid + '">' +
              '<span class="unit-btn-ic">' + unitBtnSvg('video', true) + '</span>' +
              '<span class="unit-btn-tx">Video introductorio</span>' +
              '<svg class="unit-btn-chev" viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>' +
            '</button>' +
            unitLink('material', 'Material de estudio', data.materialUrl, uKey) +
            unitLink('doc', 'Material complementario', data.docUrl) +
            unitLink('check', 'Comprobá tus conocimientos', data.checkUrl) +
          '</div>' +
          (uNum === 1
            ? '<div class="unit-hint" data-unit-hint>' +
                '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.17l-3.5-3.5L4 14.17 9 19l11-11-1.5-1.5z"/></svg>' +
                '<span>Para desbloquear la siguiente unidad, marcá el check.</span>' +
              '</div>'
            : '<div class="unit-lock-note" data-unit-lock hidden>' +
                '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zM9 6a3 3 0 0 1 6 0v2H9V6z"/></svg>' +
                '<span>Completá y marcá la unidad anterior para desbloquear.</span>' +
              '</div>') +
        '</article>';
    }

    // Celda de cuestionario del módulo
    var quizHtml =
      '<article class="quiz-cell" data-quiz-cell>' +
        '<div class="quiz-cell-emblem" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>' +
            '<rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/>' +
          '</svg>' +
        '</div>' +
        '<h3 class="quiz-cell-title">Cuestionario final del módulo</h3>' +
        '<p class="quiz-cell-desc" data-quiz-desc>Completá las 4 unidades para habilitar el cuestionario.</p>' +
        '<div class="quiz-cell-actions" data-quiz-actions hidden>' +
          '<a class="btn btn-complete quiz-open" data-quiz-open target="_blank" rel="noopener">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>' +
            'Ir al cuestionario' +
          '</a>' +
        '</div>' +
        '<div class="quiz-cell-done" data-quiz-doneview hidden>' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.17l-3.5-3.5L4 14.17 9 19l11-11-1.5-1.5z"/></svg>' +
          '<span>Cuestionario realizado</span>' +
        '</div>' +
        '<div class="unit-lock-note" data-quiz-lock hidden>' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zM9 6a3 3 0 0 1 6 0v2H9V6z"/></svg>' +
          '<span>Completá y marcá todas las unidades para desbloquear.</span>' +
        '</div>' +
      '</article>';

    grid.innerHTML = cardsHtml + quizHtml;

    // --- BLOQUEO FUNCIONAL de unidades bloqueadas ---
    // Guardia en fase de captura: intercepta cualquier clic (mouse o teclado)
    // dentro de una unidad bloqueada ANTES de que actúen sus botones/enlaces,
    // evitando abrir el video, seguir enlaces o marcar el check.
    grid.addEventListener('click', function (e) {
      var card = e.target.closest ? e.target.closest('.unit-card') : null;
      if (card && card.classList.contains('is-locked')) {
        e.preventDefault();
        e.stopPropagation();
        showToast('Completá y marcá el check de la unidad anterior para desbloquear esta unidad.', 'warning');
      }
    }, true);

    // --- Cableado de eventos ---
    // 1) Botones de video -> modal (la guardia de captura bloquea los de unidades bloqueadas)
    Array.prototype.forEach.call(grid.querySelectorAll('[data-video]'), function (btn) {
      btn.addEventListener('click', function () { openVideo(btn.getAttribute('data-video')); });
    });

    // 2) Check de unidad (solo funciona si la unidad está desbloqueada)
    // Registrar acceso al "Material de estudio" de cada unidad (habilita su check)
    Array.prototype.forEach.call(grid.querySelectorAll('[data-material-link]'), function (a) {
      a.addEventListener('click', function () {
        // no registrar si es placeholder (no abre nada)
        if (a.getAttribute('data-ext-placeholder') === '1') return;
        markMatVisited(num, a.getAttribute('data-material-link'));
        renderModuleState();
      });
    });

    Array.prototype.forEach.call(grid.querySelectorAll('[data-unit-check]'), function (btn) {
      btn.addEventListener('click', function () {
        var uKey = btn.getAttribute('data-unit-check');
        var idx = parseInt(uKey.slice(1), 10);
        var s = load();
        var mod = s.modules[String(num)];
        // Seguridad: no permitir marcar una unidad bloqueada
        if (!unitUnlocked(mod, idx)) {
          showToast('Primero completá y marcá el check de la unidad anterior.', 'warning');
          return;
        }
        // Requisito: haber ingresado al "Material de estudio" de ESTA unidad.
        // (Solo al marcar; si la desmarca no hace falta volver a entrar.)
        if (!mod[uKey] && !matVisited(num, uKey)) {
          showToast('Antes de dar por completada la unidad, debes ingresar a sus materiales.', 'warning');
          return;
        }
        // Bloqueo de desmarca: si el módulo ya está completo, habilitó la etapa
        // siguiente y no se puede deshacer (el recorrido queda registrado). El
        // estudiante puede volver a entrar a consultar los materiales.
        if (mod[uKey] && moduleComplete(mod)) {
          showToast('Este módulo ya está completado y habilitó el siguiente; no se puede desmarcar. Podés seguir consultando sus materiales.', 'info');
          return;
        }
        var nowDone = !mod[uKey];
        setFlag(s, moduleId + '.' + uKey, nowDone);
        // Al DESMARCAR una unidad, se cae en cascada todo lo que dependía de ella:
        // las unidades siguientes se bloquean/limpian y el cuestionario deja de ser válido.
        if (!nowDone) {
          for (var j = idx + 1; j <= UNITS_PER_MODULE; j++) setFlag(s, moduleId + '.u' + j, false);
          setFlag(s, moduleId + '.quiz', false);
        }
        save(s);
        renderModuleState();
      });
    });

    // 3) Abrir cuestionario Moodle
    var openLink = grid.querySelector('[data-quiz-open]');
    if (openLink) {
      var moodle = safeHref(cfg.moodleQuizUrl);
      if (!isPlaceholderUrl(moodle)) openLink.setAttribute('href', moodle);
      openLink.addEventListener('click', function (e) {
        if (isPlaceholderUrl(cfg.moodleQuizUrl)) {
          e.preventDefault();
          showToast('Pendiente: cargá el enlace del cuestionario (moodleQuizUrl).', 'warning');
          return;
        }
        // Registramos que ingresó al cuestionario -> habilita "Completar módulo".
        markQuizVisited(num);
        renderModuleState();
      });
    }

    // 4) Botón "Completar" del módulo (barra de acciones final).
    //    Marca el módulo como completado usando la ÚNICA función completeModule().
    var completeBtn = document.querySelector('[data-module-complete]');
    if (completeBtn) {
      completeBtn.addEventListener('click', function () {
        var s = load();
        if (!moduleUnitsDone(s.modules[String(num)])) {
          showToast('Completá las 4 unidades del módulo para poder marcarlo como completado.', 'warning');
          return;
        }
        if (!quizVisited(num)) {
          showToast('Primero ingresá al cuestionario del módulo; después vas a poder marcarlo como completado.', 'warning');
          return;
        }
        if (moduleComplete(s.modules[String(num)])) return; // ya estaba completo
        completeModule(num); // guarda progreso, suma XP, desbloquea módulo e insignias, actualiza localStorage
        renderModuleState();
        var msg = document.querySelector('[data-completed-msg]');
        if (msg) { msg.hidden = false; if (msg.focus) msg.focus(); }
        if (num === MODULES) {
          // Último módulo: modal informativo de la etapa final (además de la insignia y la etapa 3)
          showFinalStageModal();
        } else {
          showToast('¡Módulo completado! Sumaste ' + MQUIZ_XP + ' XP. Se desbloqueó el Módulo ' + (num + 1) + '.', 'achievement');
        }
      });
    }

    // Estado inicial + modal de video
    setupVideoModal();
    setupToast();
    setupFinalStageModal();
    renderModuleState();

    /* -- refresco de estados de la página del módulo -- */
    function renderModuleState() {
      var s = load();
      var mod = s.modules[String(num)];

      // Unidades — estado (completada / desbloqueada / bloqueada)
      Array.prototype.forEach.call(grid.querySelectorAll('.unit-card'), function (card) {
        var uKey = card.getAttribute('data-unit');
        var idx = parseInt(uKey.slice(1), 10);
        var done = !!mod[uKey];
        var unlocked = unitUnlocked(mod, idx);

        card.classList.toggle('done', done);
        card.classList.toggle('is-locked', !unlocked);

        // aviso de bloqueo dentro de la tarjeta
        var lockNote = card.querySelector('[data-unit-lock]');
        if (lockNote) lockNote.hidden = unlocked;

        // aviso permanente de la Unidad 1: desaparece al marcarla como completada
        var hint = card.querySelector('[data-unit-hint]');
        if (hint) hint.hidden = done;

        // check: marcado + bloqueado (no se puede marcar una unidad bloqueada)
        var chk = card.querySelector('[data-unit-check]');
        if (chk) {
          chk.setAttribute('aria-checked', done ? 'true' : 'false');
          chk.classList.toggle('is-done', done);
          chk.disabled = !unlocked;
          if (!unlocked) chk.setAttribute('aria-disabled', 'true'); else chk.removeAttribute('aria-disabled');
          // Desbloqueada pero sin acceder al material aún: el check se ve bloqueado
          // (sigue clickeable para poder mostrar el aviso al intentar marcarla).
          var needsMat = unlocked && !done && !matVisited(num, uKey);
          chk.classList.toggle('needs-material', needsMat);
          // Módulo completo: los checks quedan fijados (no se pueden desmarcar).
          var lockedIn = moduleComplete(mod);
          chk.classList.toggle('locked-in', lockedIn);
          if (needsMat) chk.setAttribute('title', 'Ingresá al "Material de estudio" para habilitar el check.');
          else if (lockedIn) chk.setAttribute('title', 'Módulo completado: el recorrido queda registrado.');
          else chk.removeAttribute('title');
        }

        // enlaces/botones de una unidad bloqueada: fuera del tab-order y marcados
        Array.prototype.forEach.call(card.querySelectorAll('.unit-actions .unit-btn'), function (el) {
          if (!unlocked) { el.setAttribute('tabindex', '-1'); el.setAttribute('aria-disabled', 'true'); }
          else { el.removeAttribute('tabindex'); el.removeAttribute('aria-disabled'); }
        });
      });

      // Progreso del módulo (contadores y barra en la cabecera de la página)
      var doneUnits = moduleUnitsCount(mod);
      setText('module-units-done', String(doneUnits));
      setText('module-units-total', String(UNITS_PER_MODULE));
      var mfill = document.getElementById('module-progress-fill');
      if (mfill) {
        var mpct = Math.round((doneUnits / UNITS_PER_MODULE) * 100);
        mfill.style.width = mpct + '%';
        var mbar = mfill.closest('[role="progressbar"]');
        if (mbar) mbar.setAttribute('aria-valuenow', String(mpct));
      }
      setText('page-xp-current', String(s.xp));

      // Cuestionario del módulo (celda) — enlace a Moodle
      var cell = grid.querySelector('[data-quiz-cell]');
      var actions = grid.querySelector('[data-quiz-actions]');
      var doneview = grid.querySelector('[data-quiz-doneview]');
      var desc = grid.querySelector('[data-quiz-desc]');
      var quizLock = grid.querySelector('[data-quiz-lock]');
      var unitsDone = moduleUnitsDone(mod);
      var modDone = moduleComplete(mod);

      cell.classList.remove('locked', 'available', 'done');
      if (modDone) {
        // Módulo completo: mostramos el sello "realizado" PERO el botón sigue
        // activo por si el estudiante necesita volver a entrar al cuestionario.
        cell.classList.add('done');
        if (actions) actions.hidden = false;
        if (doneview) doneview.hidden = false;
        if (quizLock) quizLock.hidden = true;
        if (desc) desc.textContent = '¡Módulo completo! Podés volver a entrar al cuestionario cuando quieras.';
      } else if (unitsDone) {
        cell.classList.add('available');
        if (actions) actions.hidden = false;
        if (doneview) doneview.hidden = true;
        if (quizLock) quizLock.hidden = true;
        if (desc) desc.textContent = 'Rendí el cuestionario y luego marcá el módulo como completado abajo.';
      } else {
        cell.classList.add('locked');
        if (actions) actions.hidden = true;
        if (doneview) doneview.hidden = true;
        if (quizLock) quizLock.hidden = false;   // aviso de bloqueo visible
        if (desc) desc.textContent = 'Disponible al completar todas las unidades (' + doneUnits + '/' + UNITS_PER_MODULE + ').';
      }

      // Botón "Completar" del módulo (barra de acciones final)
      var cbtn = document.querySelector('[data-module-complete]');
      var chint = document.querySelector('[data-complete-hint]');
      if (cbtn) {
        var label = cbtn.querySelector('[data-complete-label]') || cbtn;
        if (modDone) {
          cbtn.classList.add('is-done');
          cbtn.classList.remove('is-blocked');
          cbtn.setAttribute('aria-pressed', 'true');
          cbtn.disabled = true;
          label.textContent = 'Completado ✓';
          if (chint) chint.textContent = '¡Módulo completado!';
        } else if (unitsDone) {
          if (quizVisited(num)) {
            cbtn.classList.remove('is-done', 'is-blocked');
            cbtn.setAttribute('aria-pressed', 'false');
            cbtn.disabled = false;
            label.textContent = 'Completar módulo';
            if (chint) chint.textContent = 'Al completar sumás ' + MQUIZ_XP + ' XP';
          } else {
            // 4 unidades hechas pero todavía no ingresó al cuestionario.
            cbtn.classList.remove('is-done');
            cbtn.classList.add('is-blocked');
            cbtn.setAttribute('aria-pressed', 'false');
            cbtn.disabled = false; // clickeable para mostrar el aviso
            label.textContent = 'Completar módulo';
            if (chint) chint.textContent = 'Primero ingresá al cuestionario para habilitar';
          }
        } else {
          cbtn.classList.remove('is-done');
          cbtn.classList.add('is-blocked');
          cbtn.setAttribute('aria-pressed', 'false');
          cbtn.disabled = false; // clickeable para mostrar el aviso
          label.textContent = 'Completar módulo';
          if (chint) chint.textContent = 'Completá las 4 unidades para habilitar';
        }
      }
    }

    // expuesto por si se quiere refrescar manualmente
    initModulePage._render = renderModuleState;
  }

  function unitLink(kind, label, url, uKey) {
    var href = safeHref(url);
    var placeholder = isPlaceholderUrl(url);
    var attrs = placeholder
      ? 'href="#" data-ext-placeholder="1"'
      : 'href="' + esc(href) + '" target="_blank" rel="noopener"';
    // El "Material de estudio" lleva un marcador para registrar su acceso por unidad.
    var mat = (kind === 'material' && uKey) ? ' data-material-link="' + esc(uKey) + '"' : '';
    return '' +
      '<a class="unit-btn"' + mat + ' ' + attrs + '>' +
        '<span class="unit-btn-ic">' + unitBtnSvg(kind, false) + '</span>' +
        '<span class="unit-btn-tx">' + esc(label) + '</span>' +
        '<svg class="unit-btn-chev" viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>' +
      '</a>';
  }

  /* ---- Modal de video (compartido) ---- */
  function setupVideoModal() {
    var modal = document.getElementById('video-modal');
    if (!modal || modal.__wired) return;
    modal.__wired = true;
    Array.prototype.forEach.call(modal.querySelectorAll('[data-close-modal]'), function (el) {
      el.addEventListener('click', closeVideo);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) closeVideo();
    });
    // delegación para enlaces externos aún sin cargar
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-ext-placeholder]');
      if (a) { e.preventDefault(); showToast('Pendiente: cargá el enlace externo de este material.', 'warning'); }
    });
  }
  function openVideo(videoId) {
    var modal = document.getElementById('video-modal');
    var slot = document.getElementById('video-modal-slot');
    if (!modal || !slot) return;
    if (!videoId || /^REEMPLAZAR/i.test(videoId)) {
      showToast('Pendiente: cargá el ID del video de YouTube de esta unidad.', 'warning');
      return;
    }
    slot.innerHTML = '<iframe src="https://www.youtube.com/embed/' + encodeURIComponent(videoId) + '?rel=0&autoplay=1&modestbranding=1&playsinline=1&iv_load_policy=3" ' +
      'title="Video introductorio" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ' +
      'referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
    modal.hidden = false;
    document.body.classList.add('modal-open');
    var closeBtn = modal.querySelector('.video-modal-close');
    if (closeBtn) closeBtn.focus();
  }
  function closeVideo() {
    var modal = document.getElementById('video-modal');
    var slot = document.getElementById('video-modal-slot');
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    if (slot) slot.innerHTML = ''; // detiene la reproducción
  }

  /* ---- Modal informativo de ETAPA FINAL (al completar el módulo 5) ---- */
  function setupFinalStageModal() {
    var modal = document.getElementById('final-stage-modal');
    if (!modal || modal.__wired) return;
    modal.__wired = true;
    // El backdrop y Escape cierran; la CTA "Ir a la etapa final" navega sola.
    Array.prototype.forEach.call(modal.querySelectorAll('[data-final-close]'), function (el) {
      el.addEventListener('click', closeFinalStageModal);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) closeFinalStageModal();
    });
  }
  function showFinalStageModal() {
    var modal = document.getElementById('final-stage-modal');
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    var dialog = modal.querySelector('.final-modal-dialog');
    if (dialog) { dialog.classList.remove('pop'); void dialog.offsetWidth; dialog.classList.add('pop'); }
    var cta = modal.querySelector('[data-final-go]');
    if (cta) cta.focus();
  }
  function closeFinalStageModal() {
    var modal = document.getElementById('final-stage-modal');
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
  }

  /* ======================================================================
     11) PÁGINAS DE CONTENIDO SIMPLES (intro, final; certificado solo protege)
     ====================================================================== */
  function initContentPage() {
    var stepId = document.body.getAttribute('data-step');
    if (!stepId) return;
    var state = load();

    setText('page-xp-total', String(TOTAL_XP));
    setText('page-xp-current', String(state.xp));

    if (!isUnlocked(stepId, state)) { showLockedNotice(); return; }
    if (stepId === 'certificate') return;

    var btn = document.querySelector('[data-complete]');
    if (!btn) return;

    if (getFlag(state, stepId)) {
      renderCompleted(btn);
    } else {
      btn.addEventListener('click', function () {
        complete(stepId);
        renderCompleted(btn);
        var msg = document.querySelector('[data-completed-msg]');
        if (msg) { msg.hidden = false; if (msg.focus) msg.focus(); }
        setText('page-xp-current', String(load().xp));
        showToast('¡Sección completada! Ya podés continuar en la ruta.', 'success');
      });
    }
  }

  function renderCompleted(btn) {
    btn.classList.add('is-done');
    btn.setAttribute('aria-pressed', 'true');
    btn.disabled = true;
    var label = btn.querySelector('[data-complete-label]') || btn;
    label.textContent = 'Completado ✓';
    var msg = document.querySelector('[data-completed-msg]');
    if (msg) msg.hidden = false;
  }

  function showLockedNotice() {
    var main = document.querySelector('[data-page-main]');
    var notice = document.querySelector('[data-locked-notice]');
    if (main) main.hidden = true;
    if (notice) {
      notice.hidden = false;
      notice.setAttribute('role', 'status');
      var f = notice.querySelector('a, button');
      if (f) f.focus();
    } else {
      window.location.href = 'inicio.html';
    }
  }

  /* ----------------------------------------------------------------------
     12) Utilidades de UI
     ---------------------------------------------------------------------- */
  function setText(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; }

  /* ----------------------------------------------------------------------
     TOAST con lógica de color por tipo de mensaje:
       success     -> verde suave  (avance/sección completada)
       achievement -> amarillo/dorado (logro, XP, insignia)
       info        -> celeste/azul suave (orientación)
       warning     -> naranja suave (advertencia / acción pendiente)
     ---------------------------------------------------------------------- */
  var TOAST_ICON = {
    success:     '<path d="M9 16.17l-3.5-3.5L4 14.17 9 19l11-11-1.5-1.5z"/>',
    achievement: '<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>',
    info:        '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>',
    warning:     '<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>'
  };
  var toastTimer = null;
  function setupToast() {}
  function showToast(message, type) {
    var toast = document.getElementById('toast');
    var msg = document.getElementById('toast-message');
    if (!toast || !msg) return;
    var t = TOAST_ICON[type] ? type : 'info';
    msg.textContent = message;
    // ícono según tipo
    var iconEl = toast.querySelector('[data-toast-icon]');
    if (iconEl) iconEl.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + TOAST_ICON[t] + '</svg>';
    // clase de color
    toast.classList.remove('toast-success', 'toast-achievement', 'toast-info', 'toast-warning');
    toast.classList.add('toast-' + t);
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 4200);
  }

  /* ----------------------------------------------------------------------
     API pública
     ---------------------------------------------------------------------- */
  return {
    STORAGE_KEY: STORAGE_KEY,
    GRANULAR: GRANULAR,
    TOTAL_XP: TOTAL_XP,
    TOTAL_STEPS: TOTAL_STEPS,
    MODULE_META: MODULE_META,
    // estado
    load: load, save: save, reset: reset,
    // reconciliación pura para la sincronización (la usa ProgressRepository)
    reconcile: reconcile,
    // mutación
    complete: complete, uncomplete: uncomplete, completeModule: completeModule,
    // tracking por recurso (rediseño)
    getResource: getResource, setResource: setResource,
    // consultas
    isUnlocked: isUnlocked, nodeState: nodeState, currentStepId: currentStepId,
    percent: percent, modulesDone: modulesDone, completedCount: completedCount,
    moduleUnlocked: moduleUnlocked, moduleComplete: function (n) { return moduleComplete(load().modules[String(n)]); },
    badges: badges,
    // insignias gamificadas (logros con imagen + modal)
    ACHIEVEMENTS: ACHIEVEMENTS,
    isAchievementUnlocked: isAchievementUnlocked,
    pendingCelebrations: pendingCelebrations,
    runCelebrations: runCelebrations,
    setupCelebrationModal: setupCelebrationModal,
    currentAchievement: currentAchievement,
    renderAchievements: renderAchievements,
    renderCurrentBadge: renderCurrentBadge,
    // render
    initRuta: initRuta, initModulePage: initModulePage, initContentPage: initContentPage,
    initIndex: initIndex, nextGoalText: nextGoalText, openHelp: openHelp,
    openVideo: openVideo, closeVideo: closeVideo, showToast: showToast
  };
})();
