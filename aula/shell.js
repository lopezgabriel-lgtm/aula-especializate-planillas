/* =========================================================================
   shell.js — App-shell del aula: sidebar permanente de navegación.
   ----------------------------------------------------------------------
   - Se monta en cualquier página que cargue este script (envuelve el
     contenido existente en una grilla sidebar + contenido).
   - Lee el estado desde progress.js (AulaProgress): NO duplica la lógica de
     avance; solo la refleja. progress.js sigue siendo la fuente de verdad.
   - Toma el contenido (nombre, recursos, módulos, unidades) de course.config.js.
   - Sin almacenamiento del navegador: la preferencia de colapsado vive solo en
     memoria (se reinicia al cambiar de página).
   - Se monta recién cuando el progreso ya se cargó del servidor (AP.whenReady).
   ========================================================================= */
window.AulaShell = (function () {
  'use strict';
  var AP  = window.AulaProgress;
  var CFG = window.COURSE_CONFIG;

  /* ---------- utilidades DOM ---------- */
  function el(tag, cls) { var n = document.createElement(tag); if (cls) n.className = cls; return n; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  /* ---------- preferencia (colapsado): solo en memoria ---------- */
  var pref = {};
  function loadPref() { return pref; }
  function savePref(p) { pref = p; }

  /* ---------- reglas de estado (derivadas de progress.js) ----------
     Se leen del mismo snapshot de estado; las de módulo usan la función
     autoritativa expuesta por progress.js. */
  function introDone(s) { return !!(s.intro && s.intro.especializate && s.intro.programa && s.intro.introduccion); }
  function unitKeysOf(m) { return Object.keys(m || {}).filter(function (k) { return /^u\d+$/.test(k); }); }
  function modUnitsDone(m) { if (!m) return false; var ks = unitKeysOf(m); return ks.length > 0 && ks.every(function (k) { return m[k]; }); }
  function modHasProgress(m) { return !!(m && (unitKeysOf(m).some(function (k) { return m[k]; }) || m.quiz)); }
  function modComplete(m) { return modUnitsDone(m) && !!m.quiz; }
  function modUnlocked(s, n) { return AP.moduleUnlocked(s, n); }
  function unitUnlocked(m, i) { return i === 1 ? true : !!m['u' + (i - 1)]; }
  function introKey(step) { return step.split('.')[1]; } // intro.especializate -> especializate

  function modState(s, n) {
    var m = s.modules[String(n)];
    if (modComplete(m)) return 'completed';
    if (!modUnlocked(s, n)) return 'locked';
    return modHasProgress(m) ? 'in-progress' : 'available';
  }
  function introNodeState(s, loc) {
    if (introDone(s)) return 'completed';
    var some = s.intro && (s.intro.especializate || s.intro.programa || s.intro.introduccion);
    if (loc.scope === 'intro' || loc.scope === 'inicio' || some) return 'in-progress';
    return 'available';
  }
  function introResState(s, step, loc) {
    var done = !!(s.intro && s.intro[introKey(step)]);
    if (loc.scope === 'intro' && loc.resource === step) return 'in-progress'; // "estás acá"
    return done ? 'completed' : 'available';
  }
  function modIntroLeafState(s, n, loc) {
    var m = s.modules[String(n)];
    if (!modUnlocked(s, n)) return 'locked';
    if (loc.scope === 'module' && loc.module === n && loc.leaf === 'intro') return 'in-progress';
    return (modHasProgress(m) || modComplete(m)) ? 'completed' : 'available';
  }
  function unitLeafState(s, n, i, loc) {
    var m = s.modules[String(n)];
    if (!modUnlocked(s, n) || !unitUnlocked(m, i)) return 'locked';
    if (loc.scope === 'module' && loc.module === n && loc.leaf === i) return 'in-progress';
    return m['u' + i] ? 'completed' : 'available';
  }
  function quizLeafState(s, n, loc) {
    var m = s.modules[String(n)];
    if (!modUnlocked(s, n)) return 'locked';
    if (loc.scope === 'module' && loc.module === n && loc.leaf === 'quiz') return 'in-progress';
    if (m.quiz) return 'completed';
    if (!modUnitsDone(m)) return 'locked';   // se habilita al completar todas sus unidades
    return 'available';
  }
  function allModulesDone(s) {
    return CFG.modules.every(function (mod) { return modComplete(s.modules[String(mod.n)]); });
  }
  function finalLeafState(s, loc) {
    if (s.final && s.final.quiz) return 'completed';
    if (!allModulesDone(s)) return 'locked';        // el bloqueo tiene prioridad sobre "estás acá"
    if (loc.scope === 'final') return 'in-progress';
    return 'available';
  }

  /* ---------- ubicación actual (según la página) ---------- */
  function detectLocation() {
    var step = (document.body.getAttribute('data-step') || '');
    if (step.indexOf('intro.') === 0) return { scope: 'intro', resource: step };
    var m = step.match(/^modules\.(\d+)$/);
    if (m) return { scope: 'module', module: parseInt(m[1], 10), leaf: 'intro' };
    // plantillas data-driven (modulo.html?m=N, unidad.html?m=N&u=K)
    var file = (location.pathname.split('/').pop() || '');
    var q = new URLSearchParams(location.search);
    if (file === 'modulo.html' && q.get('m')) return { scope: 'module', module: parseInt(q.get('m'), 10), leaf: 'intro' };
    if (file === 'unidad.html' && q.get('m')) return { scope: 'module', module: parseInt(q.get('m'), 10), leaf: q.get('u') ? parseInt(q.get('u'), 10) : 'intro' };
    if (file === 'cuestionario.html' && q.get('m')) return { scope: 'module', module: parseInt(q.get('m'), 10), leaf: 'quiz' };
    if (file === 'inicio.html') return { scope: 'inicio' };
    if (file === 'progreso.html') return { scope: 'progreso' };
    if (file === 'badges.html') return { scope: 'badges' };
    if (file === 'final.html') return { scope: 'final' };
    return { scope: 'root' };
  }
  // módulo a expandir cuando estamos en la ruta (root): el primero en curso
  function currentModule(s) {
    for (var i = 1; i <= CFG.modules.length; i++) {
      if (modUnlocked(s, i) && !modComplete(s.modules[String(i)])) return i;
    }
    return CFG.modules.length;
  }

  /* ---------- íconos ---------- */
  var IC = {
    progreso: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    badges:   '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M8.21 13.89 7 22l5-3 5 3-1.21-8.11"/></svg>',
    rutas:    '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    help:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    faq:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/><line x1="12" y1="10" x2="12" y2="10.5"/><path d="M10.4 8.6a1.7 1.7 0 0 1 3.1.9c0 1.2-1.5 1.4-1.5 2.5"/></svg>',
    close:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    mail:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
    chevron:  '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    collapse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
    burger:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    final:    '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22V4a1 1 0 0 1 1-1h13l-2.5 4L18 11H5"/></svg>',
    cert:     '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8"/></svg>',
    lock:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
  };
  function finalHref() { return (CFG && CFG.final && CFG.final.href) || 'final.html'; }
  function certUrl() { return (CFG && CFG.final && CFG.final.certUrl) || ''; }
  function markerFor(state) {
    if (state === 'completed') return '<span class="marker"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>';
    if (state === 'in-progress') return '<span class="marker"><span class="dot"></span></span>';
    if (state === 'locked') return '<span class="marker"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>';
    return '<span class="marker"><span class="ring"></span></span>';
  }
  function modRightIcon(state) {
    if (state === 'completed') return '<svg class="mod-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>';
    if (state === 'locked') return '<svg class="mod-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
    return '<svg class="mod-icon chev" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
  }

  /* ---------- chrome estático del sidebar ---------- */
  function modalsHTML() {
    var faq = [
      ['¿Cómo navego el aula?', 'El panel de la izquierda es el mapa del curso: desde ahí entrás al Inicio, a cada módulo, sus unidades y el cuestionario de cierre. Se despliega al tocar un módulo.'],
      ['¿Cómo se avanza?', 'El recorrido es progresivo. Empezás por los contenidos iniciales; al completarlos se abre el Módulo 1, y cada módulo habilita el siguiente.'],
      ['¿Qué es la experiencia (XP)?', 'Es la experiencia que vas sumando al completar contenidos. Funciona como indicador de tu progreso: cuanto más avanzás, más XP acumulás.'],
      ['¿Para qué sirven las insignias?', 'Reconocen tus logros. <strong>Iniciante:</strong> etapa inicial. <strong>Explorador:</strong> Módulo 1. <strong>Arquitecto:</strong> Módulo 3. <strong>Experto:</strong> Módulo 5.'],
      ['¿Cómo se desbloquean unidades y módulos?', 'Dentro de cada módulo las unidades se abren de a una: la siguiente se habilita al completar la anterior. Y el módulo siguiente se abre al terminar el actual.'],
      ['¿Cuándo se habilitan los cuestionarios?', 'El cuestionario de cada módulo se habilita al completar todas sus unidades. Se rinde en Moodle (con tu cuenta del aula virtual) y después lo marcás como realizado para cerrar el módulo.'],
      ['¿Cómo llego a la certificación?', 'Al completar los 5 módulos y aprobar los cuestionarios, se habilita la Evaluación final. Una vez aprobada, podés acceder a tu certificación desde Moodle.'],
      ['¿Qué pasa con mi progreso si salgo del aula?', 'Tu progreso está asociado a tu cuenta de Moodle. Podés salir cuando quieras y, cuando vuelvas, solo tenés que ingresar nuevamente al aula desde Moodle. Vas a continuar desde donde lo dejaste.']
    ].map(function (qa) { return '<dt>' + qa[0] + '</dt><dd>' + qa[1] + '</dd>'; }).join('');

    return '' +
      '<div class="sb-modal" data-modal="faq" hidden>' +
        '<div class="sb-modal-bg" data-modal-close></div>' +
        '<div class="sb-modal-card" role="dialog" aria-modal="true" aria-label="Preguntas frecuentes">' +
          '<button type="button" class="sb-modal-x" data-modal-close aria-label="Cerrar">' + IC.close + '</button>' +
          '<h2 class="sb-modal-tt">Preguntas frecuentes</h2>' +
          '<dl class="faq-list">' + faq + '</dl>' +
        '</div>' +
      '</div>' +
      '<div class="sb-modal" data-modal="contact" hidden>' +
        '<div class="sb-modal-bg" data-modal-close></div>' +
        '<div class="sb-modal-card sb-modal-sm" role="dialog" aria-modal="true" aria-label="Ayuda y contacto">' +
          '<button type="button" class="sb-modal-x" data-modal-close aria-label="Cerrar">' + IC.close + '</button>' +
          '<div class="ct-ic">' + IC.help + '</div>' +
          '<h2 class="sb-modal-tt">¿Necesitás ayuda?</h2>' +
          '<p class="ct-tx">Si tenés dudas sobre el contenido o problemas con la plataforma, escribinos y te damos una mano.</p>' +
          '<a class="ct-mail" href="mailto:especializate@bue.edu.ar">' + IC.mail + ' especializate@bue.edu.ar</a>' +
          '<p class="ct-note">Recordá que los cuestionarios se rinden en Moodle: necesitás estar logueado en tu cuenta del aula virtual.</p>' +
          '<p class="ct-note">Podés seguir avanzando por los contenidos aunque todavía tengas cuestionarios pendientes de aprobación. Por eso, es importante que revises tu avance en Moodle y te asegures de completar y aprobar cada cuestionario para poder acceder a la Evaluación final y a la certificación.</p>' +
        '</div>' +
      '</div>';
  }

  function chrome() {
    return '' +
      '<div class="sb-head">' +
        '<img class="sb-logo" src="' + esc(CFG.logo) + '" alt="' + esc(CFG.name) + '">' +
        '<button class="sb-collapse" data-collapse aria-label="Contraer o expandir menú" title="Contraer / expandir menú">' + IC.collapse + '</button>' +
      '</div>' +
      '<div class="sb-badge" data-sb-badge></div>' +
      '<div class="sb-scroll">' +
        '<a href="' + esc(CFG.links.progreso) + '" class="sb-item" data-nav="progreso">' + IC.progreso + '<span class="lbl">Mi progreso</span></a>' +
        '<a href="' + esc(CFG.links.badges)   + '" class="sb-item" data-nav="badges">' + IC.badges   + '<span class="lbl">Mis logros</span></a>' +
        '<div class="sb-section-gap"></div>' +
        '<div data-sb-tree></div>' +
      '</div>' +
      '<div class="sb-bottom">' +
        '<button type="button" class="sb-item sb-faq" data-open-faq>' + IC.faq + '<span class="lbl">Preguntas frecuentes</span></button>' +
      '</div>' +
      '<button type="button" class="sb-foot" data-open-contact>' +
        '<span class="q">' + IC.help + '</span>' +
        '<span class="sb-foot-tx"><span class="t1">¿Necesitás ayuda?</span><span class="t2">Soporte y consultas</span></span>' +
      '</button>';
  }

  /* ---------- header superior: breadcrumb + progreso + XP ---------- */
  function topbarInner() {
    return '' +
      '<nav class="crumbs" data-crumbs aria-label="Ubicación"></nav>' +
      '<div class="tp-progress">' +
        '<span class="tp-label">Tu progreso en el curso</span>' +
        '<div class="tp-bar"><div class="tp-fill" data-tp-fill></div></div>' +
        '<span class="tp-pct" data-tp-pct>0%</span>' +
      '</div>' +
      '<div class="tp-xp">' +
        '<svg class="tp-star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z"/></svg>' +
        '<span data-tp-xp>0 XP</span>' +
      '</div>';
  }
  function breadcrumb(loc) {
    var courseHref = CFG.links.rutas;
    if (loc.scope === 'module') {
      var mod = CFG.modules[loc.module - 1];
      var last = (loc.leaf === 'quiz') ? 'Cuestionario' : (loc.leaf === 'intro' || loc.leaf == null) ? 'Introducción' : ('Unidad ' + loc.leaf);
      return [{ label: CFG.name, href: courseHref }, { label: 'Módulo ' + loc.module, href: mod ? mod.href : null }, { label: last, current: true }];
    }
    if (loc.scope === 'intro') {
      var r = CFG.intro.resources.filter(function (x) { return x.step === loc.resource; })[0];
      return [{ label: CFG.name, href: courseHref }, { label: CFG.intro.label, href: CFG.intro.href }, { label: r ? r.label : '', current: true }];
    }
    if (loc.scope === 'inicio') {
      return [{ label: CFG.name, href: courseHref }, { label: CFG.intro.label, current: true }];
    }
    if (loc.scope === 'progreso') {
      return [{ label: CFG.name, href: courseHref }, { label: 'Mi progreso', current: true }];
    }
    if (loc.scope === 'badges') {
      return [{ label: CFG.name, href: courseHref }, { label: 'Mis logros', current: true }];
    }
    if (loc.scope === 'final') {
      return [{ label: CFG.name, href: courseHref }, { label: (CFG.final && CFG.final.label) || 'Evaluación final', current: true }];
    }
    return [{ label: CFG.name, current: true }];
  }
  function renderTopbar(s, loc) {
    els.crumbs.innerHTML = breadcrumb(loc).map(function (seg, i) {
      var piece = seg.current ? '<span class="current">' + esc(seg.label) + '</span>'
        : (seg.href ? '<a href="' + esc(seg.href) + '">' + esc(seg.label) + '</a>' : '<span>' + esc(seg.label) + '</span>');
      return (i > 0 ? '<span class="sep">›</span>' : '') + piece;
    }).join('');
    var p = AP.percent ? AP.percent(s) : 0;
    var xp = (s && typeof s.xp === 'number') ? s.xp : 0;
    els.tpFill.style.width = p + '%';
    els.tpPct.textContent = p + '%';
    els.tpXp.textContent = xp + ' XP';
  }

  /* ---------- render de la insignia + progreso ---------- */
  function renderBadge(host, s) {
    var a = AP.currentAchievement ? AP.currentAchievement(s) : null;
    var p = AP.percent ? AP.percent(s) : 0;
    var img = a
      ? '<span class="sb-badge-img"><img src="' + esc(a.img) + '" alt="Insignia ' + esc(a.name) + '"></span>'
      : '<span class="sb-badge-img empty"><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M8.21 13.89 7 22l5-3 5 3-1.21-8.11"/></svg></span>';
    host.innerHTML = img +
      '<span class="sb-badge-tx">' +
        '<span class="sb-badge-eyebrow">' + (a ? 'Insignia actual' : 'Tu progreso') + '</span>' +
        '<span class="sb-badge-name">' + (a ? esc(a.name) : 'Sin insignias aún') + '</span>' +
        '<span class="sb-badge-prog">' +
          '<span class="sb-badge-bar"><span class="sb-badge-fill" style="width:' + p + '%"></span></span>' +
          '<span class="sb-badge-pct">' + p + '%</span>' +
        '</span>' +
      '</span>';
  }

  /* ---------- render del árbol (Inicio + módulos) ---------- */
  function leaf(state, label, href) {
    var inner = markerFor(state) + '<span class="leaf-name">' + esc(label) + '</span>';
    if (state === 'locked' || !href) return '<div class="leaf" data-state="' + state + '" aria-disabled="true">' + inner + '</div>';
    return '<a class="leaf" data-state="' + state + '" href="' + esc(href) + '">' + inner + '</a>';
  }
  function group(openClass, headHtml, bodyHtml, state, current) {
    return '<div class="mod' + (openClass ? ' open' : '') + (current ? ' is-current' : '') + '"' + (state ? ' data-state="' + state + '"' : '') + '>' +
      headHtml + '<div class="mod-units">' + bodyHtml + '</div></div>';
  }

  function renderTree(host, s, loc) {
    var openMod = (loc.scope === 'module') ? loc.module : currentModule(s);
    var html = '<div class="course" data-course>' +
      '<div class="course-head" data-course-toggle><span class="course-name">' + esc(CFG.name).replace(/\bIA\b/g, '<span class="ia">IA</span>').replace(/\bInteligentes\b/g, '<span class="ia">Inteligentes</span>') + '</span>' + IC.chevron + '</div>' +
      '<div class="course-body">';

    /* Nodo "Inicio y bienvenida": una sola entrada -> inicio.html */
    var iState = introNodeState(s, loc);
    var iCurrent = (loc.scope === 'inicio' || loc.scope === 'intro');
    html += '<div class="mod mod-single' + (iCurrent ? ' is-current' : '') + '" data-state="' + iState + '">' +
      '<a class="mod-head mod-head-link" href="' + esc(CFG.intro.href) + '">' +
        '<span class="mod-name">' + esc(CFG.intro.label) + '</span>' +
        (iState === 'completed' ? modRightIcon('completed') : '') +
      '</a></div>';

    /* Módulos */
    CFG.modules.forEach(function (mod) {
      var st = modState(s, mod.n);
      var isOpen = (openMod === mod.n) && st !== 'locked';
      var head = '<div class="mod-head"' + (st !== 'locked' ? ' data-toggle role="button" tabindex="0"' : '') +
                 ' aria-expanded="' + isOpen + '">' +
                 '<span class="mod-name">Módulo ' + mod.n + '</span>' + modRightIcon(st) + '</div>';
      var body = leaf(modIntroLeafState(s, mod.n, loc), 'Introducción', mod.href);
      mod.units.forEach(function (_, idx) {
        var i = idx + 1;
        body += leaf(unitLeafState(s, mod.n, i, loc), 'Unidad ' + i, 'unidad.html?m=' + mod.n + '&u=' + i);
      });
      // Cuestionario como último acceso del módulo (cierre)
      var qLeaf = quizLeafState(s, mod.n, loc);
      body += leaf(qLeaf, 'Cuestionario', qLeaf === 'locked' ? null : 'cuestionario.html?m=' + mod.n);
      html += group(isOpen, head, body, st, loc.scope === 'module' && loc.module === mod.n);
    });

    /* Nodo "Evaluación final" (cierre del curso), después de todos los módulos */
    if (CFG.final) {
      var fState = finalLeafState(s, loc);
      var fCurrent = (loc.scope === 'final' && fState !== 'locked');
      html += '<div class="mod mod-single mod-final' + (fCurrent ? ' is-current' : '') + '" data-state="' + fState + '">' +
        (fState === 'locked'
          ? '<div class="mod-head" aria-disabled="true"><span class="mod-name">' + esc(CFG.final.label) + '</span>' + modRightIcon('locked') + '</div>'
          : '<a class="mod-head mod-head-link" href="' + esc(CFG.final.href) + '"><span class="mod-name">' + esc(CFG.final.label) + '</span>' + (fState === 'completed' ? modRightIcon('completed') : '') + '</a>') +
        '</div>';
    }

    /* Nodo "Descargá tu certificado" (enlace a Moodle), después de la Evaluación final */
    if (CFG.final && CFG.final.certUrl) {
      // Se habilita según el estado real de la evaluación final (final.quiz).
      var certOn = !!(s.final && s.final.quiz);
      if (certOn) {
        html += '<div class="mod mod-single mod-cert mod-cert-cta is-unlocked">' +
          '<a class="mod-head mod-head-link" href="' + esc(CFG.final.certUrl) + '" target="_blank" rel="noopener">' +
            '<span class="mod-cert-ic">' + IC.cert + '</span><span class="mod-name">Descargá tu certificado</span>' +
          '</a></div>';
      } else {
        html += '<div class="mod mod-single mod-cert mod-cert-cta is-locked">' +
          '<span class="mod-head mod-cert-locked" role="link" aria-disabled="true" tabindex="-1" title="Se habilita al marcar la evaluación final como realizada.">' +
            '<span class="mod-cert-ic">' + IC.cert + '</span><span class="mod-name">Descargá tu certificado</span>' +
            '<span class="marker">' + IC.lock + '</span>' +
          '</span></div>';
      }
    }

    html += '</div></div>';
    host.innerHTML = html;
  }

  /* ---------- interacción del árbol (expandir/colapsar) ---------- */
  function wireTree(root) {
    var course = root.querySelector('[data-course]');
    var ct = root.querySelector('[data-course-toggle]');
    if (ct) ct.onclick = function () { course.classList.toggle('collapsed'); };
    Array.prototype.forEach.call(root.querySelectorAll('.mod'), function (modEl) {
      var head = modEl.querySelector('.mod-head[data-toggle]');
      if (!head) return;
      head.onclick = function (e) {
        if (e.target.closest && e.target.closest('a.leaf')) return;
        modEl.classList.toggle('open');
        head.setAttribute('aria-expanded', modEl.classList.contains('open'));
      };
      head.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); head.click(); } };
    });
  }

  /* ---------- render completo ---------- */
  var els = {};
  function render() {
    var s = AP.load();
    var loc = detectLocation();
    renderBadge(els.badge, s);
    renderTopbar(s, loc);
    renderTree(els.tree, s, loc);
    wireTree(els.tree);
    // resaltar el acceso activo (Mi progreso / Mis logros)
    if (els.aside) Array.prototype.forEach.call(els.aside.querySelectorAll('.sb-item[data-nav]'), function (a) {
      a.classList.toggle('is-active', a.getAttribute('data-nav') === loc.scope);
    });
  }

  /* ---------- montaje ---------- */
  function mount() {
    if (!AP || !CFG) return;
    if (document.documentElement.classList.contains('shell-on')) return;
    var body = document.body;
    var container = body.querySelector('.container');
    if (!container) return;

    var app = el('div', 'app');
    var aside = el('aside', 'sidebar'); aside.setAttribute('aria-label', 'Navegación del curso');
    var content = el('div', 'shell-content');
    var topbar = el('header', 'topbar'); topbar.innerHTML = topbarInner();
    var main = el('div', 'shell-main');
    aside.innerHTML = chrome();
    main.appendChild(container);
    content.appendChild(topbar);
    content.appendChild(main);
    app.appendChild(aside);
    app.appendChild(content);
    body.insertBefore(app, body.firstChild);
    document.documentElement.classList.add('shell-on');

    els.app = app; els.aside = aside;
    els.badge = aside.querySelector('[data-sb-badge]');
    els.tree = aside.querySelector('[data-sb-tree]');
    els.crumbs = topbar.querySelector('[data-crumbs]');
    els.tpFill = topbar.querySelector('[data-tp-fill]');
    els.tpPct = topbar.querySelector('[data-tp-pct]');
    els.tpXp = topbar.querySelector('[data-tp-xp]');

    /* colapsar / expandir (persistente en su propia clave) */
    if (loadPref().collapsed) app.classList.add('is-collapsed');
    var cb = aside.querySelector('[data-collapse]');
    if (cb) cb.addEventListener('click', function () {
      var on = app.classList.toggle('is-collapsed');
      var p = loadPref(); p.collapsed = on; savePref(p);
    });

    /* mobile: botón hamburguesa + backdrop (off-canvas) */
    var burger = el('button', 'sb-burger'); burger.setAttribute('aria-label', 'Abrir menú'); burger.innerHTML = IC.burger;
    var backdrop = el('div', 'sb-backdrop');
    burger.addEventListener('click', function () { var open = app.classList.toggle('sidebar-open'); burger.style.display = open ? 'none' : ''; });
    backdrop.addEventListener('click', function () { app.classList.remove('sidebar-open'); burger.style.display = ''; });
    aside.addEventListener('click', function (e) { if (e.target.closest('a')) { app.classList.remove('sidebar-open'); burger.style.display = ''; } });
    app.appendChild(backdrop);
    body.appendChild(burger);

    /* modales de ayuda: Preguntas frecuentes + contacto */
    var modalWrap = el('div', 'sb-modals'); modalWrap.innerHTML = modalsHTML();
    app.appendChild(modalWrap);
    function openModal(name) { var m = modalWrap.querySelector('[data-modal="' + name + '"]'); if (m) { m.hidden = false; body.classList.add('modal-open'); } }
    function closeModals() { Array.prototype.forEach.call(modalWrap.querySelectorAll('[data-modal]'), function (m) { m.hidden = true; }); body.classList.remove('modal-open'); }
    aside.addEventListener('click', function (e) {
      if (e.target.closest('[data-open-faq]')) { e.preventDefault(); openModal('faq'); }
      else if (e.target.closest('[data-open-contact]')) { e.preventDefault(); openModal('contact'); }
    });
    modalWrap.addEventListener('click', function (e) { if (e.target.closest('[data-modal-close]')) closeModals(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModals(); });

    render();
  }

  /* auto-init: espera al DOM y a que el progreso se haya cargado del servidor */
  function init() {
    function go() { AP.whenReady(mount); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
    else go();
  }
  init();

  return { mount: mount, render: render };
})();
