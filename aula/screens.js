/* =========================================================================
   screens.js — Renderiza las PANTALLAS data-driven del aula desde
   course.config.js + progress.js. (No duplica la lógica de avance: la lee.)

   Modificación 3: pantalla de Introducción de módulo (modulo.html?m=N).
   [La pantalla de Unidad llega en la Modificación 4.]
   ========================================================================= */
window.AulaScreens = (function () {
  'use strict';
  var AP = window.AulaProgress, CFG = window.COURSE_CONFIG;

  function qparam(name) { return new URLSearchParams(location.search).get(name); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  /* ----- reglas de estado (derivadas de progress.js) ----- */
  function modUnlocked(s, n) { return AP.moduleUnlocked(s, n); }
  function unitUnlocked(m, i) { return i === 1 ? true : !!m['u' + (i - 1)]; }
  function unitState(s, n, i) {
    var m = s.modules[String(n)];
    if (!unitUnlocked(m, i)) return 'locked';
    return m['u' + i] ? 'completed' : 'available';
  }
  function moduleXp(mod) { return mod.units.length * 40 + 40; } // 40 por unidad + 40 quiz
  function moduleUnitsDone(m) { return !!(m.u1 && m.u2 && m.u3 && m.u4); }
  function quizState(s, n) {
    if (!modUnlocked(s, n)) return 'locked';
    var m = s.modules[String(n)];
    if (m.quiz) return 'completed';
    if (!moduleUnitsDone(m)) return 'locked';   // se habilita al completar todas las unidades
    return 'available';
  }
  function quizStateChip(st) {
    if (st === 'completed') return '<span class="mi-unit-chip is-done">' + IC.check + 'Completado</span>';
    if (st === 'available') return '<span class="mi-unit-chip is-open">Disponible</span>';
    return '<span class="mi-unit-chip is-locked">' + IC.lock + 'Bloqueado</span>';
  }

  /* ----- íconos ----- */
  var IC = {
    units: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>',
    star:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z"/></svg>',
    target:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    list:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    lock:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    info:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    play:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    back:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    ext:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
    checkC:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l2.5 2.5L16 9"/></svg>',
    chev:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    book:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    file:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    quiz:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    award: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M8.21 13.89 7 22l5-3 5 3-1.21-8.11"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'
  };

  /* ----- chip de estado por unidad ----- */
  function unitStateChip(st) {
    if (st === 'completed') return '<span class="mi-unit-chip is-done">' + IC.check + 'Completada</span>';
    if (st === 'available') return '<span class="mi-unit-chip is-open">Disponible</span>';
    return '<span class="mi-unit-chip is-locked">' + IC.lock + 'Bloqueada</span>';
  }

  /* ----- primera unidad para el CTA "Comenzar" ----- */
  function firstActionableUnit(s, n, mod) {
    for (var i = 1; i <= mod.units.length; i++) {
      var st = unitState(s, n, i);
      if (st === 'available') return i;
    }
    return 1; // todas completas -> volver a la 1
  }

  /* ===================== PANTALLA: INTRO DE MÓDULO ===================== */
  function renderIntro(host, s, mod, n) {
    var xp = moduleXp(mod);
    var vid = mod.video && mod.video.youtubeId;

    // chips
    var chips =
      '<div class="mi-chip"><span class="mi-chip-ic">' + IC.units + '</span><span class="mi-chip-tx"><span>Unidades</span><b>' + mod.units.length + '</b></span></div>' +
      (mod.estimatedTime ? '<div class="mi-chip"><span class="mi-chip-ic">' + IC.clock + '</span><span class="mi-chip-tx"><span>Tiempo estimado</span><b>' + esc(mod.estimatedTime) + '</b></span></div>' : '') +
      '<div class="mi-chip"><span class="mi-chip-ic mi-chip-xp">' + IC.star + '</span><span class="mi-chip-tx"><span>XP del módulo</span><b>' + xp + ' XP</b></span></div>';

    // objetivos (opcional)
    var objectives = '';
    if (mod.objectives && mod.objectives.length) {
      objectives =
        '<section class="mi-obj">' +
          '<div class="mi-obj-head"><span class="mi-obj-ic">' + IC.target + '</span><h2>¿Qué vas a aprender?</h2></div>' +
          '<ul class="mi-obj-list">' +
            mod.objectives.map(function (o) { return '<li><span class="mi-obj-check">' + IC.check + '</span>' + esc(o) + '</li>'; }).join('') +
          '</ul>' +
        '</section>';
    }

    // video
    var video = vid
      ? '<div class="mi-video"><iframe src="https://www.youtube.com/embed/' + esc(vid) + '" title="Video de introducción al Módulo ' + n + '" allow="accelerométer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>'
      : '<div class="mi-video mi-video-empty"><span>' + IC.play + '</span></div>';
    var videoCap = 'Video de introducción al Módulo ' + n + (mod.video && mod.video.duration ? ' &nbsp;·&nbsp; ' + esc(mod.video.duration) : '');

    // lista de unidades + cuestionario final (cierre del módulo)
    var qSt = quizState(s, n);
    var qInner = '<span class="mi-unit-num mi-unit-qnum">' + IC.quiz + '</span>' +
      '<span class="mi-unit-name">Cuestionario final del módulo</span>' + quizStateChip(qSt);
    var quizRow = (qSt === 'locked')
      ? '<li class="mi-unit mi-unit-q" data-state="locked" aria-disabled="true">' + qInner + '</li>'
      : '<li class="mi-unit mi-unit-q" data-state="' + qSt + '"><a href="cuestionario.html?m=' + n + '">' + qInner + '</a></li>';

    var units = '<ul class="mi-units-list">' + mod.units.map(function (u, idx) {
      var i = idx + 1, st = unitState(s, n, i);
      var inner =
        '<span class="mi-unit-num">' + i + '</span>' +
        '<span class="mi-unit-name">' + esc(u.title) + '</span>' +
        unitStateChip(st);
      if (st === 'locked') return '<li class="mi-unit" data-state="locked" aria-disabled="true">' + inner + '</li>';
      return '<li class="mi-unit" data-state="' + st + '"><a href="unidad.html?m=' + n + '&u=' + i + '">' + inner + '</a></li>';
    }).join('') + quizRow + '</ul>';

    var startU = firstActionableUnit(s, n, mod);

    host.innerHTML =
      '<div class="mi">' +
        '<div class="mi-top">' +
          '<div class="mi-left">' +
            '<span class="mi-eyebrow">Módulo ' + n + '</span>' +
            '<h1 class="mi-title">' + esc(mod.title) + '</h1>' +
            '<p class="mi-desc">' + esc(mod.description) + '</p>' +
            '<div class="mi-chips">' + chips + '</div>' +
          '</div>' +
          '<div class="mi-right">' +
            video +
            '<p class="mi-video-cap">' + videoCap + '</p>' +
          '</div>' +
        '</div>' +
        objectives +
        '<section class="mi-units">' +
          '<div class="mi-units-head"><span class="mi-units-ic">' + IC.list + '</span><h2>Unidades del módulo</h2></div>' +
          units +
        '</section>' +
        promptbookCard(mod) +
        '<div class="mi-cta">' +
          '<div class="mi-note">' + IC.info + '<span>Completá todas las unidades y aprobá el <b>quiz final</b> del módulo para sumar XP y <b>desbloquear el siguiente</b> módulo.</span></div>' +
          '<a class="btn btn-complete mi-start" href="unidad.html?m=' + n + '&u=' + startU + '">' + IC.play + ' Comenzar Módulo ' + n + '</a>' +
        '</div>' +
      '</div>';
  }

  /* ===================== PANTALLA: MÓDULO BLOQUEADO ===================== */
  function renderLocked(host, n) {
    host.innerHTML =
      '<div class="locked-notice" data-locked-notice>' +
        '<div class="lock-badge" aria-hidden="true">' + IC.lock + '</div>' +
        '<h2>Este módulo todavía está bloqueado</h2>' +
        '<p>Completá el módulo anterior (sus unidades y su cuestionario) para desbloquear este contenido.</p>' +
        '<a href="' + esc(CFG.links.rutas) + '" class="btn btn-ruta">Volver</a>' +
      '</div>';
  }

  /* ===================== INIT ===================== */
  function initModulo() {
    var host = document.querySelector('[data-modulo-intro]');
    if (!host || !AP || !CFG) return;
    var n = parseInt(qparam('m'), 10);
    var mod = CFG.modules[n - 1];
    if (!mod) { host.innerHTML = '<div class="locked-notice"><h2>Módulo no encontrado</h2></div>'; return; }
    document.title = 'Módulo ' + n + ': ' + mod.title + ' — Especializate';
    var s = AP.load();
    if (!modUnlocked(s, n)) { renderLocked(host, n); return; }
    renderIntro(host, s, mod, n);
  }

  /* ===================== PANTALLA: UNIDAD (Modificación 4) ===================== */
  function catIcon(cat) {
    if (/complementario/i.test(cat)) return IC.file;
    if (/comprob|conocimiento|quiz|actividad/i.test(cat)) return IC.quiz;
    return IC.book;
  }
  function resDone(r) { return AP.getResource(r.id); }
  function groupByCategory(resources) {
    var blocks = [], byCat = {};
    (resources || []).forEach(function (r) {
      if (!byCat[r.category]) { byCat[r.category] = { category: r.category, items: [] }; blocks.push(byCat[r.category]); }
      byCat[r.category].items.push(r);
    });
    return blocks;
  }
  function requiredSatisfied(unit) {
    return (unit.resources || []).filter(function (r) { return r.required; }).every(resDone);
  }
  function unitCounts(unit) {
    var items = unit.resources || [];
    return { done: items.filter(resDone).length, total: items.length };
  }

  function openBtn(r) {
    return '<button type="button" class="ub-open btn" data-open-res="' + esc(r.id) + '" data-url="' + esc(r.url) + '">Abrir ' + IC.ext + '</button>';
  }
  function checkDot(r) {
    return resDone(r)
      ? '<span class="ub-check is-done" aria-label="Realizado">' + IC.checkC + '</span>'
      : '<span class="ub-check" aria-label="Pendiente"></span>';
  }
  function tagFor(required) {
    return required ? '<span class="ub-tag is-req">Obligatorio</span>' : '<span class="ub-tag is-opt">Opcional</span>';
  }

  // Accesos rápidos (secundarios): abren en pestaña nueva, no marcan progreso,
  // no suman XP, no cuentan como recursos. Sólo se renderiza lo que tiene URL.
  function ytId(url) {
    var m = String(url || '').match(/(?:embed\/|youtu\.be\/|v=|shorts\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }
  // Convierte un enlace de Google (Sheets/Docs/Slides/Drive) a su URL de DESCARGA directa.
  function toDownloadUrl(url) {
    url = String(url || ''); var m;
    if ((m = url.match(/docs\.google\.com\/spreadsheets\/d\/([^/?#]+)/))) return 'https://docs.google.com/spreadsheets/d/' + m[1] + '/export?format=xlsx';
    if ((m = url.match(/docs\.google\.com\/document\/d\/([^/?#]+)/)))     return 'https://docs.google.com/document/d/' + m[1] + '/export?format=pdf';
    if ((m = url.match(/docs\.google\.com\/presentation\/d\/([^/?#]+)/))) return 'https://docs.google.com/presentation/d/' + m[1] + '/export/pptx';
    if ((m = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/)))        return 'https://drive.google.com/uc?export=download&id=' + m[1];
    if (/drive\.google\.com/.test(url) && (m = url.match(/[?&]id=([^&]+)/)))  return 'https://drive.google.com/uc?export=download&id=' + m[1];
    return null;
  }
  // Botón de acceso rápido tipado:
  //  · dataset/goldcopy -> descarga directa (sin pestaña)
  //  · video            -> popup (modal)
  function quickBtn(type, label, url) {
    if (type === 'video') {
      var yid = ytId(url);
      return '<a class="ub-quick-btn ub-quick-video" href="' + esc(url) + '" data-video="' + esc(yid || '') + '" data-video-url="' + esc(url) + '">' + IC.play + ' ' + esc(label) + '</a>';
    }
    var dl = toDownloadUrl(url);
    if (dl) return '<a class="ub-quick-btn ub-quick-dl" href="' + esc(dl) + '" data-download="' + esc(dl) + '" download>' + IC.download + ' ' + esc(label) + '</a>';
    return '<a class="ub-quick-btn" href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(label) + ' ' + IC.ext + '</a>';
  }
  function quickBtns(map) {
    var b = [];
    if (map.dataset)  b.push(quickBtn('dataset', 'Dataset', map.dataset));
    if (map.goldcopy) b.push(quickBtn('goldcopy', 'Goldcopy', map.goldcopy));
    if (map.video)    b.push(quickBtn('video', 'Video de resolución', map.video));
    return b;
  }
  // Descarga sin abrir pestaña ni navegar (iframe oculto).
  function triggerDownload(url) {
    if (!url) return;
    var f = document.createElement('iframe'); f.style.display = 'none'; f.src = url;
    document.body.appendChild(f);
    setTimeout(function () { try { document.body.removeChild(f); } catch (e) {} }, 60000);
  }
  // Video de resolución en popup (modal con reproductor embebido).
  function openVideoModal(yid, fallbackUrl) {
    if (!yid) { if (fallbackUrl) window.open(fallbackUrl, '_blank', 'noopener'); return; }
    var ov = document.createElement('div');
    ov.className = 'video-modal';
    ov.innerHTML =
      '<div class="video-modal-backdrop" data-close></div>' +
      '<div class="video-modal-box" role="dialog" aria-modal="true" aria-label="Video de resolución">' +
        '<button type="button" class="video-modal-close" data-close aria-label="Cerrar">&#215;</button>' +
        '<div class="video-modal-frame"><iframe src="https://www.youtube.com/embed/' + yid + '?autoplay=1&rel=0" title="Video de resolución" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>' +
      '</div>';
    function close() { try { document.body.removeChild(ov); } catch (e) {} document.removeEventListener('keydown', onKey); document.body.classList.remove('modal-open'); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    ov.addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(ov); document.body.classList.add('modal-open');
  }
  // Zona de accesos del Sandbox, dentro del componente de Material de estudio.
  function sandboxQuick(sb) {
    var b = quickBtns(sb || {});
    if (!b.length) return '';
    return '<div class="ub-quick ub-quick-sandbox">' +
      '<span class="ub-quick-label">Accesos del Sandbox</span>' +
      '<div class="ub-quick-btns">' + b.join('') + '</div></div>';
  }
  // Componente Proyecto integrador — Búho Escribidor (opcional por unidad).
  function buhoBlock(unit) {
    var b = unit.buho; if (!b) return '';
    var main = b.consigna
      ? '<a class="ub-open btn" href="' + esc(b.consigna) + '" target="_blank" rel="noopener">Abrir consigna ' + IC.ext + '</a>'
      : '';
    var links = quickBtns(b);
    var quick = links.length
      ? '<div class="ub-quick"><span class="ub-quick-label">Recursos para resolverlo</span>' +
        '<div class="ub-quick-btns">' + links.join('') + '</div></div>'
      : '';
    return '<div class="ub-block ub-buho is-single">' +
      '<div class="ub-block-head">' +
        '<span class="ub-block-ic">' + IC.file + '</span>' +
        '<div class="ub-block-tt">' +
          '<div class="ub-block-name">Proyecto integrador — Búho Escribidor <span class="ub-tag is-proj">Proyecto</span></div>' +
          '<div class="ub-item-sub">Consigna del proyecto</div></div>' +
        (main ? '<div class="ub-actions">' + main + '</div>' : '') +
      '</div>' + quick +
    '</div>';
  }
  // Tarjeta del Promptbook (recurso transversal del módulo, opcional).
  function promptbookCard(mod) {
    var pb = mod.promptbook; if (!pb || !pb.url) return '';
    return '<section class="mi-promptbook">' +
      '<div class="mi-pb-ic">' + IC.book + '</div>' +
      '<div class="mi-pb-tx">' +
        '<h2>' + esc(pb.label || 'Promptbook') + '</h2>' +
        '<p>' + esc(pb.description || 'Prompts útiles para acompañarte en las prácticas de este módulo.') + '</p>' +
      '</div>' +
      '<a class="btn mi-pb-btn" href="' + esc(pb.url) + '" target="_blank" rel="noopener">Abrir Promptbook ' + IC.ext + '</a>' +
    '</section>';
  }

  function renderBlock(block) {
    var items = block.items, total = items.length;
    var done = items.filter(resDone).length;
    var required = items.some(function (r) { return r.required; });
    var ic = '<span class="ub-block-ic">' + catIcon(block.category) + '</span>';

    if (total === 1) {
      var r = items[0];
      return '<div class="ub-block is-single" data-state="' + (resDone(r) ? 'done' : 'todo') + '">' +
        '<div class="ub-block-head">' + ic +
          '<div class="ub-block-tt"><div class="ub-block-name">' + esc(block.category) + ' ' + tagFor(required) + '</div>' +
            '<div class="ub-item-sub">' + esc(r.label) + (r.type ? ' · ' + esc(r.type) : '') + '</div></div>' +
          '<div class="ub-actions">' + openBtn(r) + checkDot(r) + '</div>' +
        '</div>' +
        (r.sandbox ? sandboxQuick(r.sandbox) : '') +
      '</div>';
    }
    // bloque con varios recursos (acordeón)
    var rows = items.map(function (r) {
      return '<div class="ub-item" data-state="' + (resDone(r) ? 'done' : 'todo') + '">' +
        '<div class="ub-item-tt"><div class="ub-item-name">' + esc(r.label) + '</div>' +
          (r.type ? '<div class="ub-item-sub">' + esc(r.type) + '</div>' : '') + '</div>' +
        '<div class="ub-actions">' + openBtn(r) + checkDot(r) + '</div>' +
      '</div>';
    }).join('');
    return '<div class="ub-block open">' +
      '<div class="ub-block-head" data-block-toggle role="button" tabindex="0">' + ic +
        '<div class="ub-block-tt"><div class="ub-block-name">' + esc(block.category) + ' ' + tagFor(required) + '</div></div>' +
        '<span class="ub-count">' + done + ' / ' + total + '</span>' +
        '<span class="ub-block-chev">' + IC.chev + '</span>' +
      '</div>' +
      '<div class="ub-items">' + rows + '</div>' +
    '</div>';
  }

  function renderUnit(host, s, mod, n, u) {
    var unit = mod.units[u - 1];
    var counts = unitCounts(unit);
    var isDone = !!s.modules[String(n)]['u' + u];
    var reqOk = requiredSatisfied(unit);
    var pctUnit = counts.total ? Math.round(counts.done / counts.total * 100) : 0;

    var estado = isDone ? 'Completada' : (counts.done > 0 ? 'En progreso' : 'Disponible');
    var estadoCls = isDone ? 'is-done' : (counts.done > 0 ? 'is-progress' : 'is-open');

    var vid = unit.video && unit.video.youtubeId;
    var video = vid
      ? '<div class="mi-video ub-video"><iframe src="https://www.youtube.com/embed/' + esc(vid) + '" title="Video de la unidad ' + u + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>'
      : '';
    var desc = unit.description || ('En esta unidad vas a trabajar los contenidos de «' + unit.title + '». Mirá el video introductorio y completá los recursos.');

    var blocks = groupByCategory(unit.resources).map(renderBlock).join('') + buhoBlock(unit);

    var ctaDisabled = isDone || !reqOk;
    var ctaLabel = isDone ? 'Unidad completada' : 'Marcar unidad como completada';
    var ctaIcon = isDone ? IC.checkC : IC.lock;

    // --- navegación a la siguiente unidad (respeta el desbloqueo: se habilita al completar la actual) ---
    var isLast = (u === mod.units.length);
    var nextHref, nextLabel;
    if (!isLast) {
      nextHref = 'unidad.html?m=' + n + '&u=' + (u + 1);
      nextLabel = 'Continuar a la siguiente unidad';
    } else {
      // última unidad -> pantalla de cierre del módulo (el cuestionario)
      nextHref = 'cuestionario.html?m=' + n;
      nextLabel = 'Ir al cuestionario del módulo';
    }
    var continueBtn = isDone
      ? '<a class="btn ub-continue" href="' + esc(nextHref) + '">' + nextLabel + ' ' + IC.arrow + '</a>'
      : '<button type="button" class="btn ub-continue" disabled title="Completá esta unidad para continuar">' + nextLabel + ' ' + IC.arrow + '</button>';

    host.innerHTML =
      '<div class="ub">' +
        '<a class="ub-back" href="modulo.html?m=' + n + '">' + IC.back + ' Volver al Módulo ' + n + '</a>' +
        '<div class="ub-top">' +
          '<div class="ub-left">' +
            '<span class="mi-eyebrow">Unidad ' + u + '</span>' +
            '<h1 class="mi-title">' + esc(unit.title) + '</h1>' +
            '<p class="mi-desc">' + esc(desc) + '</p>' +
          '</div>' +
          '<div class="ub-right">' + (video || '<div class="ub-novideo">' + IC.play + '</div>') + '</div>' +
        '</div>' +
        '<div class="ub-status">' +
          '<div class="ub-status-cell"><span class="ub-card-k">Estado de la unidad</span><span class="ub-chip ' + estadoCls + '">' + estado + '</span></div>' +
          '<div class="ub-status-cell ub-status-prog"><span class="ub-card-k">Progreso de la unidad</span>' +
            '<div class="ub-bar"><div class="ub-fill" style="width:' + pctUnit + '%"></div></div>' +
            '<span class="ub-card-count">' + counts.done + ' / ' + counts.total + ' completados</span>' +
          '</div>' +
          '<div class="ub-status-cell ub-status-xp"><span class="ub-card-k">XP al completar</span><span class="ub-xp">' + IC.star + ' 40 XP</span></div>' +
        '</div>' +
        '<div class="ub-blocks">' + blocks + '</div>' +
        '<div class="ub-cta">' +
          '<div class="mi-note">' + IC.info + '<span>Completá el <b>recurso obligatorio</b> de la unidad para poder marcarla como completada y <b>desbloquear la próxima unidad</b>.</span></div>' +
          '<div class="ub-cta-actions">' +
            '<button type="button" class="btn btn-complete ub-complete" data-complete-unit ' + (ctaDisabled ? 'disabled' : '') + '>' + ctaIcon + ' ' + ctaLabel + '</button>' +
            continueBtn +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function wireUnit(host, mod, n, u, draw) {
    // abrir recurso => marcar como realizado + refrescar
    Array.prototype.forEach.call(host.querySelectorAll('[data-open-res]'), function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-open-res'), url = btn.getAttribute('data-url');
        if (url) window.open(url, '_blank', 'noopener');
        AP.setResource(id, true);
        draw();
      });
    });
    // dataset/goldcopy => descarga directa (no abre pestaña)
    Array.prototype.forEach.call(host.querySelectorAll('[data-download]'), function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); triggerDownload(el.getAttribute('data-download')); });
    });
    // video de resolución => popup
    Array.prototype.forEach.call(host.querySelectorAll('[data-video]'), function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); openVideoModal(el.getAttribute('data-video'), el.getAttribute('data-video-url')); });
    });
    // acordeones (bloques con varios recursos)
    Array.prototype.forEach.call(host.querySelectorAll('[data-block-toggle]'), function (h) {
      h.addEventListener('click', function () { h.closest('.ub-block').classList.toggle('open'); });
      h.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); h.click(); } });
    });
    // marcar unidad como completada
    var cta = host.querySelector('[data-complete-unit]');
    if (cta) cta.addEventListener('click', function () {
      if (cta.hasAttribute('disabled')) return;
      var before = AP.load();
      AP.complete('modules.' + n + '.u' + u);            // preserva XP, desbloqueos, secuencia
      var after = AP.load();
      if (AP.showToast) AP.showToast('¡Unidad ' + u + ' completada! +40 XP', 'success');
      if (window.AulaShell) window.AulaShell.render();     // refresca sidebar + header
      // celebraciones (si al completar se desbloqueó una insignia)
      try { if (AP.pendingCelebrations && AP.runCelebrations) AP.runCelebrations(AP.pendingCelebrations(after)); } catch (e) {}
      draw();
    });
  }

  function renderUnitLocked(host, n, u) {
    host.innerHTML =
      '<a class="ub-back" href="modulo.html?m=' + n + '">' + IC.back + ' Volver al Módulo ' + n + '</a>' +
      '<div class="locked-notice" data-locked-notice>' +
        '<div class="lock-badge" aria-hidden="true">' + IC.lock + '</div>' +
        '<h2>Esta unidad todavía está bloqueada</h2>' +
        '<p>Completá la unidad anterior para desbloquear este contenido.</p>' +
        '<a href="modulo.html?m=' + n + '" class="btn btn-ruta">Volver al módulo</a>' +
      '</div>';
  }

  function initUnidad() {
    var host = document.querySelector('[data-unidad]');
    if (!host || !AP || !CFG) return;
    if (AP.setupCelebrationModal) AP.setupCelebrationModal();
    var n = parseInt(qparam('m'), 10), u = parseInt(qparam('u'), 10);
    var mod = CFG.modules[n - 1];
    if (!mod || !mod.units[u - 1]) { host.innerHTML = '<div class="locked-notice"><h2>Unidad no encontrada</h2></div>'; return; }
    document.title = 'Unidad ' + u + ' — ' + mod.title + ' · Especializate';
    var s = AP.load();
    if (!modUnlocked(s, n) || !unitUnlocked(s.modules[String(n)], u)) { renderUnitLocked(host, n, u); return; }
    function draw() { renderUnit(host, AP.load(), mod, n, u); wireUnit(host, mod, n, u, draw); }
    draw();
    // por si llegamos con una insignia recién desbloqueada pendiente
    try { if (AP.pendingCelebrations && AP.runCelebrations) AP.runCelebrations(AP.pendingCelebrations(s)); } catch (e) {}
  }

  /* ===================== PANTALLA: INICIO Y BIENVENIDA ===================== */
  function introFlag(s, step) { return !!(s.intro && s.intro[step.split('.')[1]]); }
  // Clave de "recurso accedido" para cada ítem de la bienvenida (persistida en resources).
  function introSeenKey(step) { return 'intro-' + step.split('.')[1] + '-seen'; }
  // Un recurso obligatorio de la bienvenida se considera satisfecho al accederlo.
  function introSeen(r) {
    if (!r.required) return true;
    return !!(AP.getResource && AP.getResource(introSeenKey(r.step)));
  }

  function inicioMedia(r) {
    var seen = introSeen(r);
    if (r.kind === 'video' && r.youtubeId) {
      if (seen) {
        return '<div class="mi-video ini-media"><iframe src="https://www.youtube.com/embed/' + esc(r.youtubeId) + '" title="' + esc(r.label) + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>';
      }
      // Hasta reproducir el video, se muestra un botón que lo revela y marca el
      // recurso como accedido (requisito para poder completar la sección).
      return '<div class="mi-video ini-media">' +
        '<button type="button" class="ini-facade" data-ini-seen="' + esc(r.step) + '" aria-label="Reproducir video: ' + esc(r.label) + '">' +
          '<span class="ini-facade-play">' + IC.play + '</span>' +
          '<span class="ini-facade-tx">Reproducir video</span>' +
        '</button></div>';
    }
    if (r.kind === 'pdf') {
      if (!r.url) {
        // Recurso aún sin enlace cargado: se muestra un aviso, no un botón roto.
        return '<div class="ini-pdf ini-pdf-pending">' +
          '<span class="ini-pdf-ic">' + IC.file + '</span>' +
          '<div class="ini-pdf-tx"><b>' + esc(r.label) + '</b><span>Enlace pendiente de carga</span></div>' +
        '</div>';
      }
      return '<div class="ini-pdf">' +
        '<span class="ini-pdf-ic">' + IC.file + '</span>' +
        '<div class="ini-pdf-tx"><b>' + esc(r.label) + '</b><span>Documento PDF</span></div>' +
        '<a class="btn ub-open" href="' + esc(r.url) + '" target="_blank" rel="noopener" data-ini-seen="' + esc(r.step) + '">Ver programa ' + IC.ext + '</a>' +
      '</div>';
    }
    return '';
  }

  function inicioSection(r, idx, s) {
    var done = introFlag(s, r.step);
    var seen = introSeen(r);
    var action;
    if (done) {
      action = '<span class="ini-done">' + IC.checkC + ' Completado</span>';
    } else if (!seen) {
      var hint = (r.kind === 'pdf')
        ? 'Abrí el programa para poder completar esta sección.'
        : 'Reproducí el video para poder completar esta sección.';
      action = '<button type="button" class="btn btn-complete ini-complete" disabled title="' + esc(hint) + '">Marcar como completado</button>' +
        '<span class="ini-hint">' + IC.info + '<span>' + esc(hint) + '</span></span>';
    } else {
      action = '<button type="button" class="btn btn-complete ini-complete" data-complete-step="' + esc(r.step) + '">Marcar como completado</button>';
    }
    return '<div class="ini-block" data-state="' + (done ? 'done' : 'todo') + '">' +
      '<div class="ini-left">' +
        '<div class="ini-block-head">' +
          '<span class="ini-num">' + (done ? IC.check : (idx + 1)) + '</span>' +
          '<h2>' + esc(r.label) + '</h2>' +
        '</div>' +
        '<p class="mi-desc">' + esc(r.description || '') + '</p>' +
        '<div class="ini-actions">' + action + '</div>' +
      '</div>' +
      '<div class="ini-right">' + inicioMedia(r) + '</div>' +
    '</div>';
  }

  function renderInicio(host, s) {
    var intro = CFG.intro, items = intro.resources || [];
    var doneCount = items.filter(function (r) { return introFlag(s, r.step); }).length;
    var total = items.length, allDone = doneCount === total && total > 0;
    var pct = total ? Math.round(doneCount / total * 100) : 0;

    host.innerHTML =
      '<div class="ini">' +
        '<header class="ini-hero">' +
          '<span class="mi-eyebrow">' + esc(intro.eyebrow || 'Bienvenida') + '</span>' +
          '<h1 class="mi-title">' + esc(intro.title || intro.label) + '</h1>' +
          '<p class="mi-desc">' + esc(intro.description || '') + '</p>' +
          '<div class="ini-status"><div class="ini-status-bar"><div class="ini-status-fill" style="width:' + pct + '%"></div></div>' +
            '<span class="ini-status-tx">' + doneCount + ' / ' + total + ' completados</span></div>' +
        '</header>' +
        items.map(function (r, i) { return inicioSection(r, i, s); }).join('') +
        '<div class="mi-cta">' +
          '<div class="mi-note">' + IC.info + '<span>Al completar los <b>tres recursos</b> se desbloquea el <b>Módulo 1</b>.</span></div>' +
          (allDone
            ? '<a class="btn btn-complete ini-next" href="modulo.html?m=1">' + IC.play + ' Ir al Módulo 1</a>'
            : '<button type="button" class="btn btn-complete ini-next" disabled>' + IC.lock + ' Ir al Módulo 1</button>') +
        '</div>' +
      '</div>';
  }

  function wireInicio(host, draw) {
    // Acceso al recurso (reproducir video / abrir programa) => marca "accedido"
    // y refresca, habilitando el botón de completar.
    Array.prototype.forEach.call(host.querySelectorAll('[data-ini-seen]'), function (el) {
      el.addEventListener('click', function () {
        if (AP.setResource) AP.setResource(introSeenKey(el.getAttribute('data-ini-seen')), true);
        // El <a> del programa abre en pestaña nueva; el <button> revela el player.
        setTimeout(draw, 30);
      });
    });
    Array.prototype.forEach.call(host.querySelectorAll('[data-complete-step]'), function (btn) {
      btn.addEventListener('click', function () {
        if (btn.hasAttribute('disabled')) return;
        AP.complete(btn.getAttribute('data-complete-step'));
        if (AP.showToast) AP.showToast('¡Sección completada! +50 XP', 'success');
        if (window.AulaShell) window.AulaShell.render();
        try { if (AP.pendingCelebrations && AP.runCelebrations) AP.runCelebrations(AP.pendingCelebrations(AP.load())); } catch (e) {}
        draw();
      });
    });
  }

  function initInicio() {
    var host = document.querySelector('[data-inicio]');
    if (!host || !AP || !CFG) return;
    if (AP.setupCelebrationModal) AP.setupCelebrationModal();
    document.title = 'Inicio y bienvenida — ' + CFG.name;
    function draw() { renderInicio(host, AP.load()); wireInicio(host, draw); }
    draw();
    try { if (AP.pendingCelebrations && AP.runCelebrations) AP.runCelebrations(AP.pendingCelebrations(AP.load())); } catch (e) {}
  }

  /* ===================== PANTALLA: CUESTIONARIO / CIERRE DE MÓDULO ===================== */
  function finalHref() { return (CFG && CFG.final && CFG.final.href) || 'final.html'; }
  // Componente llamativo: invita a la Evaluación final tras el último módulo.
  function finalInvite() {
    return '<div class="cq-final-invite">' +
      '<span class="cq-fi-ic">' + IC.award + '</span>' +
      '<div class="cq-fi-tx">' +
        '<h2>¡Completaste todos los módulos!</h2>' +
        '<p>Te queda un último desafío para finalizar tu recorrido: la <b>Evaluación final</b>.</p>' +
      '</div>' +
      '<a class="btn cq-fi-btn" href="' + esc(finalHref()) + '">' + IC.arrow + ' Realizar evaluación final</a>' +
    '</div>';
  }

  function renderCuestionario(host, s, mod, n) {
    var st = quizState(s, n);
    if (st === 'locked') {
      var reason = !modUnlocked(s, n)
        ? 'Este módulo todavía está bloqueado.'
        : 'Completá las <b>' + mod.units.length + ' unidades</b> del módulo para habilitar el cuestionario final.';
      host.innerHTML =
        '<a class="ub-back" href="modulo.html?m=' + n + '">' + IC.back + ' Volver al Módulo ' + n + '</a>' +
        '<div class="locked-notice" data-locked-notice><div class="lock-badge" aria-hidden="true">' + IC.lock + '</div>' +
          '<h2>Cuestionario bloqueado</h2><p>' + reason + '</p>' +
          '<a href="modulo.html?m=' + n + '" class="btn btn-ruta">Volver al módulo</a></div>';
      return;
    }
    var done = (st === 'completed');
    var visited = AP.getResource('m' + n + '-quiz-visited') || done;
    var next = (n < CFG.modules.length);

    var quizCard =
      '<div class="cq-card">' +
        '<span class="cq-card-ic">' + IC.quiz + '</span>' +
        '<div class="cq-card-tx"><b>Cuestionario del módulo</b><span>Se rinde en Moodle. Al aprobarlo, cerrás el módulo.</span></div>' +
        (mod.quizUrl ? '<a class="ub-open btn cq-open" href="' + esc(mod.quizUrl) + '" target="_blank" rel="noopener" data-quiz-visit>Ir al cuestionario ' + IC.ext + '</a>' : '') +
      '</div>';

    var lastDone = done && !next; // último módulo aprobado → invitar a la evaluación final
    var cta = done
      ? (next
          ? '<a class="btn btn-complete" href="modulo.html?m=' + (n + 1) + '">' + IC.arrow + ' Continuar al Módulo ' + (n + 1) + '</a>'
          : '')
      : '<button type="button" class="btn btn-complete" data-close-module ' + (visited ? '' : 'disabled') + '>' + IC.checkC + ' Marcar como aprobado y cerrar el módulo</button>';

    host.innerHTML =
      '<div class="ub">' +
        '<a class="ub-back" href="modulo.html?m=' + n + '">' + IC.back + ' Volver al Módulo ' + n + '</a>' +
        '<div class="ub-top">' +
          '<div class="ub-left">' +
            '<span class="mi-eyebrow">Módulo ' + n + ' · Cierre</span>' +
            '<h1 class="mi-title">Cuestionario final</h1>' +
            '<p class="mi-desc">Es el último paso del módulo. Rendí el cuestionario en Moodle y marcá su aprobación para cerrar el módulo y desbloquear el siguiente.</p>' +
          '</div>' +
          '<div class="ub-right"><div class="cq-badge ' + (done ? 'is-done' : 'is-open') + '">' + (done ? IC.checkC + ' Completado' : IC.quiz + ' Disponible') + '</div></div>' +
        '</div>' +
        quizCard +
        (lastDone ? finalInvite() : '') +
        '<div class="ub-cta">' +
          '<div class="mi-note">' + IC.info + '<span>' + (done ? 'Cuestionario aprobado. El módulo quedó <b>completado</b>.' : 'Primero <b>abrí el cuestionario</b> en Moodle; después vas a poder marcarlo como aprobado.') + '</span></div>' +
          '<div class="ub-cta-actions">' + cta + '</div>' +
        '</div>' +
      '</div>';
  }

  function wireCuestionario(host, mod, n, draw) {
    var visitBtn = host.querySelector('[data-quiz-visit]');
    if (visitBtn) visitBtn.addEventListener('click', function () {
      AP.setResource('m' + n + '-quiz-visited', true);
      setTimeout(draw, 50); // abre Moodle en pestaña nueva y habilita el cierre
    });
    var closeBtn = host.querySelector('[data-close-module]');
    if (closeBtn) closeBtn.addEventListener('click', function () {
      if (closeBtn.hasAttribute('disabled')) return;
      AP.completeModule(n); // fija el quiz y cierra el módulo (4 unidades + cuestionario)
      if (AP.showToast) AP.showToast('¡Módulo ' + n + ' completado!', 'achievement');
      if (window.AulaShell) window.AulaShell.render();
      try { if (AP.pendingCelebrations && AP.runCelebrations) AP.runCelebrations(AP.pendingCelebrations(AP.load())); } catch (e) {}
      draw();
    });
  }

  function initCuestionario() {
    var host = document.querySelector('[data-cuestionario]');
    if (!host || !AP || !CFG) return;
    if (AP.setupCelebrationModal) AP.setupCelebrationModal();
    var n = parseInt(qparam('m'), 10);
    var mod = CFG.modules[n - 1];
    if (!mod) { host.innerHTML = '<div class="locked-notice"><h2>Módulo no encontrado</h2></div>'; return; }
    document.title = 'Cuestionario — ' + mod.title + ' · Especializate';
    function draw() { renderCuestionario(host, AP.load(), mod, n); wireCuestionario(host, mod, n, draw); }
    draw();
    try { if (AP.pendingCelebrations && AP.runCelebrations) AP.runCelebrations(AP.pendingCelebrations(AP.load())); } catch (e) {}
  }

  /* ===================== PANTALLA: MI PROGRESO ===================== */
  function moduleProgressState(s, n) {
    var m = s.modules[String(n)];
    if (moduleUnitsDone(m) && m.quiz) return 'completed';
    if (!modUnlocked(s, n)) return 'locked';
    return (m.u1 || m.u2 || m.u3 || m.u4 || m.quiz) ? 'in-progress' : 'available';
  }
  function prChip(st) {
    if (st === 'completed') return '<span class="pr-chip is-done">' + IC.check + 'Completado</span>';
    if (st === 'locked') return '<span class="pr-chip is-locked">' + IC.lock + 'Bloqueado</span>';
    if (st === 'in-progress') return '<span class="pr-chip is-prog">En progreso</span>';
    return '<span class="pr-chip is-open">Disponible</span>';
  }
  function renderProgreso(host, s) {
    var pct = AP.percent ? AP.percent(s) : 0;
    var xp = (typeof s.xp === 'number') ? s.xp : 0;
    var total = AP.TOTAL_XP || 0;
    var mDone = AP.modulesDone ? AP.modulesDone(s) : 0;
    var goal = AP.nextGoalText ? AP.nextGoalText(s) : '';
    var badge = AP.currentAchievement ? AP.currentAchievement(s) : null;

    var mods = CFG.modules.map(function (mod) {
      var n = mod.n, m = s.modules[String(n)];
      var st = moduleProgressState(s, n);
      var uDone = ['u1', 'u2', 'u3', 'u4'].filter(function (k) { return m[k]; }).length;
      var mpct = Math.round((uDone + (m.quiz ? 1 : 0)) / 5 * 100);
      var inner =
        '<div class="pr-mod-tt"><b>Módulo ' + n + '</b><span>' + esc(mod.title) + '</span></div>' +
        '<div class="pr-mod-mid"><div class="pr-mod-bar"><div class="pr-mod-fill" style="width:' + mpct + '%"></div></div>' +
          '<span class="pr-mod-meta">' + uDone + '/' + m.units.length + ' unidades · Cuestionario ' + (m.quiz ? 'aprobado' : 'pendiente') + '</span></div>' +
        prChip(st);
      return st === 'locked'
        ? '<div class="pr-mod" data-state="locked">' + inner + '</div>'
        : '<a class="pr-mod" data-state="' + st + '" href="modulo.html?m=' + n + '">' + inner + '</a>';
    }).join('');

    host.innerHTML =
      '<div class="pr">' +
        '<header class="pr-hero">' +
          '<span class="mi-eyebrow">Tu recorrido</span>' +
          '<h1 class="mi-title">Mi progreso</h1>' +
        '</header>' +
        '<div class="pr-stats">' +
          '<div class="pr-stat"><span class="pr-stat-ic">' + IC.chart + '</span><div><b>' + pct + '%</b><span>Progreso general</span></div></div>' +
          '<div class="pr-stat"><span class="pr-stat-ic pr-stat-xp">' + IC.star + '</span><div><b>' + xp + ' / ' + total + '</b><span>XP acumulada</span></div></div>' +
          '<div class="pr-stat"><span class="pr-stat-ic">' + IC.list + '</span><div><b>' + mDone + ' / ' + CFG.modules.length + '</b><span>Módulos completados</span></div></div>' +
        '</div>' +
        (goal ? '<div class="mi-note pr-goal">' + IC.info + '<span>Próximo objetivo: <b>' + esc(goal) + '</b></span></div>' : '') +
        '<h2 class="pr-h2">Progreso por módulo</h2>' +
        '<div class="pr-mods">' + mods + '</div>' +
      '</div>';
  }
  function initProgreso() {
    var host = document.querySelector('[data-progreso]');
    if (!host || !AP || !CFG) return;
    document.title = 'Mi progreso — ' + CFG.name;
    renderProgreso(host, AP.load());
  }

  /* ===================== PANTALLA: MIS LOGROS ===================== */
  function achUnlocked(a, s) {
    if (typeof a.unlocked === 'function') return a.unlocked(s);
    if (AP.isAchievementUnlocked) { try { return AP.isAchievementUnlocked(a, s); } catch (e) {} }
    return false;
  }
  function renderBadges(host, s) {
    var list = AP.ACHIEVEMENTS || [];
    var got = list.filter(function (a) { return achUnlocked(a, s); }).length;
    var cards = list.map(function (a) {
      var on = achUnlocked(a, s);
      return '<div class="bd-card" data-state="' + (on ? 'got' : 'locked') + '">' +
        '<div class="bd-img"><img src="' + esc(a.img) + '" alt="Insignia ' + esc(a.name) + '">' +
          (on ? '' : '<span class="bd-lock">' + IC.lock + '</span>') + '</div>' +
        '<div class="bd-name">' + esc(a.name) + '</div>' +
        '<div class="bd-milestone">' + esc(a.milestone) + '</div>' +
        (on ? '<span class="bd-tag is-got">' + IC.check + ' Obtenida</span>' : '<span class="bd-tag is-pending">' + IC.lock + ' Pendiente</span>') +
      '</div>';
    }).join('');
    host.innerHTML =
      '<div class="bd">' +
        '<header class="pr-hero">' +
          '<span class="mi-eyebrow">Logros</span>' +
          '<h1 class="mi-title">Mis logros</h1>' +
          '<p class="mi-desc">Insignias que vas desbloqueando al avanzar en el recorrido. Llevás <b>' + got + ' de ' + list.length + '</b>.</p>' +
        '</header>' +
        '<div class="bd-grid">' + cards + '</div>' +
      '</div>';
  }
  function initBadges() {
    var host = document.querySelector('[data-badges]');
    if (!host || !AP || !CFG) return;
    document.title = 'Mis logros — ' + CFG.name;
    renderBadges(host, AP.load());
  }

  /* ===================== PANTALLA: EVALUACIÓN FINAL + CERTIFICACIÓN ===================== */
  function allModulesDone(s) {
    return CFG.modules.every(function (mod) {
      var m = s.modules[String(mod.n)];
      return m.u1 && m.u2 && m.u3 && m.u4 && m.quiz;
    });
  }
  function finalState(s) {
    if (s.final && s.final.quiz) return 'completed';
    if (!allModulesDone(s)) return 'locked';
    return 'available';
  }

  function renderFinal(host, s) {
    var F = CFG.final || {};
    var closing = {
      title:     F.closingTitle   || '\u00a1Felicitaciones!',
      message:   F.closingMessage || 'Completaste tu recorrido por el curso.',
      certLabel: F.certLabel      || 'Descargá tu certificado'
    };
    var st = finalState(s);

    // Acceso al cuestionario final (reutilizado en ambos estados). Sin URL -> null.
    function quizBtn(cls, label, extraAttr) {
      if (!F.quizUrl) return '';
      return '<a class="' + cls + '" href="' + esc(F.quizUrl) + '" target="_blank" rel="noopener" ' + (extraAttr || '') + '>' + label + ' ' + IC.ext + '</a>';
    }
    function certBtn(cls, label) {
      if (!F.certUrl) return '';
      return '<a class="' + cls + '" href="' + esc(F.certUrl) + '" target="_blank" rel="noopener">' + label + ' ' + IC.ext + '</a>';
    }

    if (st === 'locked') {
      var done = AP.badges(s).filter(function (b) { return b.kind === 'module' && b.earned; }).length;
      host.innerHTML =
        '<a class="ub-back" href="inicio.html">' + IC.back + ' Volver al inicio</a>' +
        '<div class="locked-notice" data-locked-notice><div class="lock-badge" aria-hidden="true">' + IC.lock + '</div>' +
          '<h2>La evaluación final está bloqueada</h2>' +
          '<p>Completá los <b>' + CFG.modules.length + ' módulos</b> (unidades y cuestionarios) para habilitar la evaluación final. Llevás <b>' + done + ' de ' + CFG.modules.length + '</b> completados.</p>' +
          '<a href="progreso.html" class="btn btn-ruta">Ver mi progreso</a></div>';
      return;
    }

    if (st === 'completed') {
      // --- Estado 2: cierre del curso ---
      // Mis logros: reutiliza el sistema de insignias (medallas obtenidas con imagen).
      var earned = AP.badges(s).filter(function (b) { return b.earned && b.medal; });
      var logros = earned.length
        ? '<section class="fn-logros">' +
            '<h2 class="fn-sec-tt">Mis logros</h2>' +
            '<div class="fn-medals">' +
              earned.map(function (b) {
                return '<figure class="fn-medal-item"><img src="' + esc(b.medal) + '" alt="' + esc(b.label) + '" loading="lazy"><figcaption>' + esc(b.label) + '</figcaption></figure>';
              }).join('') +
            '</div>' +
          '</section>'
        : '';

      // Preview del certificado (solo referencia visual, con blur). Opcional por curso.
      var preview = F.certPreview
        ? '<div class="fn-cert-preview"><img src="' + esc(F.certPreview) + '" alt="Vista previa del certificado" loading="lazy"><span class="fn-cert-tagfake">Vista previa</span></div>'
        : '';

      // Acción principal: descargar certificado. Secundaria: acceder a la evaluación.
      var certReqText = F.certRequirement ||
        'Para acceder a la certificación necesitás completar y aprobar con un mínimo de 7 los cuestionarios de todos los módulos y el cuestionario final del curso.';
      var certPrimary = F.certUrl
        ? '<a class="btn fn-cert-btn" href="' + esc(F.certUrl) + '" target="_blank" rel="noopener">' + IC.award + ' ' + esc(closing.certLabel) + '</a>'
        : '<span class="fn-pending">Certificado pendiente de configuración.</span>';
      var evalSecondary = quizBtn('btn btn-ghost fn-eval-again', 'Acceder a la evaluación final', '');

      host.innerHTML =
        '<div class="fn fn-done">' +
          '<div class="fn-hero">' +
            '<span class="fn-medal">' + IC.award + '</span>' +
            '<span class="mi-eyebrow">Cierre del curso</span>' +
            '<h1 class="fn-congrats">' + esc(closing.title) + '</h1>' +
            '<p class="fn-hero-desc">' + esc(closing.message) + '</p>' +
          '</div>' +
          logros +
          '<section class="fn-cert-section">' +
            '<h2 class="fn-sec-tt">Tu certificado</h2>' +
            '<div class="fn-cert-wrap">' +
              preview +
              '<div class="fn-cert-info">' +
                '<p class="fn-cert-msg">Tu certificado ya está disponible. Descargalo desde Moodle, con tu cuenta del aula virtual.</p>' +
                '<div class="fn-cert-actions">' +
                  '<div class="fn-cert-req">' + IC.info + '<span>' + esc(certReqText) + '</span></div>' +
                  certPrimary +
                  evalSecondary +
                '</div>' +
              '</div>' +
            '</div>' +
          '</section>' +
        '</div>';
      return;
    }

    // --- Estado 1: evaluación final pendiente (CTA principal con presencia) ---
    var visited = AP.getResource('final-quiz-visited');
    var mainCta = F.quizUrl
      ? '<a class="btn fn-start-btn" href="' + esc(F.quizUrl) + '" target="_blank" rel="noopener" data-final-visit>' + IC.arrow + ' Realizar Evaluación final</a>'
      : '<span class="fn-pending">Falta configurar el enlace del cuestionario final para este curso.</span>';

    host.innerHTML =
      '<div class="fn fn-pending-state">' +
        '<a class="ub-back" href="inicio.html">' + IC.back + ' Volver al inicio</a>' +
        '<div class="fn-hero fn-hero-start">' +
          '<span class="fn-start-ic">' + IC.quiz + '</span>' +
          '<span class="mi-eyebrow">Último paso del recorrido</span>' +
          '<h1 class="fn-congrats">' + esc(F.label || 'Evaluación final') + '</h1>' +
          '<p class="fn-hero-desc">Llegaste al último desafío del curso. Realizá la evaluación final para completar tu recorrido.</p>' +
          '<div class="fn-start-actions">' + mainCta + '</div>' +
        '</div>' +
        '<div class="ub-cta fn-approve">' +
          '<div class="mi-note">' + IC.info + '<span>Cuando la apruebes en Moodle (7 o más), marcala como aprobada para completar tu recorrido y habilitar tu <b>certificado</b>.</span></div>' +
          '<div class="ub-cta-actions">' +
            '<button type="button" class="btn btn-complete" data-approve-final ' + (visited ? '' : 'disabled') + '>' + IC.checkC + ' Marcar evaluación como aprobada</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function wireFinal(host, draw) {
    var visitBtn = host.querySelector('[data-final-visit]');
    if (visitBtn) visitBtn.addEventListener('click', function () { AP.setResource('final-quiz-visited', true); setTimeout(draw, 50); });
    var approveBtn = host.querySelector('[data-approve-final]');
    if (approveBtn) approveBtn.addEventListener('click', function () {
      if (approveBtn.hasAttribute('disabled')) return;
      AP.complete('final.quiz'); // marca la evaluación final -> activa certificate (recompute)
      if (AP.showToast) AP.showToast('¡Curso completado! Tu certificación está disponible.', 'achievement');
      if (window.AulaShell) window.AulaShell.render();
      try { if (AP.pendingCelebrations && AP.runCelebrations) AP.runCelebrations(AP.pendingCelebrations(AP.load())); } catch (e) {}
      draw();
    });
  }

  function initFinal() {
    var host = document.querySelector('[data-final]');
    if (!host || !AP || !CFG) return;
    if (AP.setupCelebrationModal) AP.setupCelebrationModal();
    document.title = 'Evaluación final — ' + CFG.name;
    function draw() { renderFinal(host, AP.load()); wireFinal(host, draw); }
    draw();
    try { if (AP.pendingCelebrations && AP.runCelebrations) AP.runCelebrations(AP.pendingCelebrations(AP.load())); } catch (e) {}
  }

  return { initModulo: initModulo, initUnidad: initUnidad, initInicio: initInicio, initCuestionario: initCuestionario, initProgreso: initProgreso, initBadges: initBadges, initFinal: initFinal };
})();
