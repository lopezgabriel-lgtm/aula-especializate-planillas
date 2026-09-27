/* =========================================================================
   tour.js — Onboarding Walkthrough / Product Tour
   Aula gamificada "Introducción a la IA" — Especializate
   -------------------------------------------------------------------------
   Capa de AYUDA GUIADA, independiente de la lógica de avance (progress.js).
   No lee ni escribe el progreso del estudiante: solo guarda si ya vio el tour.

   Dónde corre:
     - ruta.html        -> tour de la RUTA (se muestra automático la 1ª vez)
     - modulo-N.html    -> tour del MÓDULO (solo manual, con el botón "?")
     - index.html       -> NO corre (ahí hay una guía textual, no un tour)

   Uso:
     <script src="tour.js"></script>
     <script>AulaTour.init('ruta');</script>     // o 'modulo'

   API pública (window.AulaTour):
     init(scope)  -> cablea el botón "?" y auto-inicia si corresponde
     start()      -> inicia el tour manualmente
     stop()       -> cierra el tour
     reset()      -> olvida el "ya lo vi" (para volver a probarlo)
   ========================================================================= */

window.AulaTour = (function () {
  'use strict';

  /* Clave propia: NO toca la clave del progreso (especializate_ia_progress_v2) */
  var TOUR_KEY = 'especializate_' + ((window.COURSE_CONFIG && window.COURSE_CONFIG.slug) || 'ia') + '_onboarding_v1';

  /* ----------------------------------------------------------------------
     1) PASOS DEL TOUR
        target: selector CSS del elemento a señalar.
                Si el elemento NO existe o está oculto, el paso se SALTA
                (salvo que tenga fallback: true, y entonces se muestra
                centrado como explicación general).
     ---------------------------------------------------------------------- */
  var STEPS = {
    /* ---------- Onboarding en INICIO (shell + flujo inicial) ---------- */
    inicio: [
      { target: '.sidebar', title: 'Tu navegación', text: 'Este panel es el mapa del aula. Desde acá accedés al Inicio, a cada módulo, sus unidades y el cuestionario. Se despliega al tocar un módulo.' },
      { target: '[data-sb-badge]', title: 'Tu insignia y tu avance', text: 'Acá ves tu insignia actual y una barra con el progreso general del curso. Cambian a medida que completás contenidos.' },
      { target: '.tp-progress', title: 'Progreso del curso', text: 'En la barra superior está tu progreso general en porcentaje. Se actualiza automáticamente con cada avance.' },
      { target: '.tp-xp', title: 'Tu experiencia (XP)', text: 'La XP es la experiencia que vas sumando a medida que completás contenidos del curso. Funciona como un indicador de tu progreso: cuanto más avanzás, más XP acumulás. No compite con nadie — es tu propio termómetro de avance.' },
      { target: '[data-sb-tree]', title: 'El recorrido del curso', text: 'Los módulos se habilitan de a uno. Lo que todavía no desbloqueaste aparece con candado y no se puede abrir.' },
      { target: '.ini-block', title: 'Empezá por acá', text: 'En esta pantalla tenés los tres contenidos iniciales. Miralos y marcá cada uno como completado.' },
      { target: '.ini-next', title: 'Desbloqueá el Módulo 1', text: 'Cuando completes los tres, se habilita el Módulo 1 y podés empezar el recorrido.' },
      { target: '[data-tour-open]', title: 'Ayuda siempre a mano', text: 'Podés volver a ver esta guía cuando quieras desde este botón:', demo: '<span class="tour-demo-btn" aria-hidden="true"><span class="tour-demo-q">?</span><span class="tour-demo-tx">Ayuda</span></span>' }
    ],

    /* ---------- Dentro de un MÓDULO (introducción) ---------- */
    modulo: [
      { target: '.mi-chips', title: 'Datos del módulo', text: 'Un resumen rápido: cantidad de unidades, tiempo estimado y la XP que podés sumar en este módulo.' },
      { target: '.mi-video', title: 'Video de introducción', text: 'Arrancá por el video del módulo: te da el panorama general antes de recorrer las unidades.' },
      { target: '.mi-units', title: 'El recorrido del módulo', text: 'Estas son las unidades. Se abren de a una: al completar cada una, se desbloquea la siguiente.' },
      { target: '.mi-unit-q', title: 'El cierre: el cuestionario', text: 'El cuestionario final es el último paso. Se habilita al completar todas las unidades y, al marcarlo como realizado, cerrás el módulo.' },
      { target: '.mi-promptbook', title: 'Tu Promptbook', text: 'En cada módulo vas a encontrar un Promptbook: una colección de prompts listos para usar, adaptar y experimentar durante las prácticas. Es un recurso de consulta que te va a acompañar a lo largo del módulo.' },
      { target: '.mi-start', title: 'Comenzá el módulo', text: 'Cuando quieras arrancar, entrá a la primera unidad desde este botón.' }
    ],

    /* ---------- Dentro de una UNIDAD ---------- */
    unidad: [
      { target: '.ub-top', title: 'Contexto y video', text: 'Cada unidad arranca con una breve introducción y su video. Miralo antes de trabajar los recursos.' },
      { target: '.ub-status', title: 'Tu avance en la unidad', text: 'Acá ves el estado de la unidad, cuántos recursos llevás realizados y la XP que sumás al completarla.' },
      { target: '.ub-blocks', title: 'Los recursos', text: 'Cada recurso indica si es Obligatorio u Opcional. Con "Abrir" accedés al contenido y queda marcado como realizado.' },
      { target: '.ub-complete', title: 'Marcar la unidad', text: 'Cuando completes los recursos obligatorios, se habilita este botón para dar la unidad por terminada.' },
      { target: '.ub-continue', title: 'Seguir avanzando', text: 'Al completar la unidad podés continuar a la siguiente (o, en la última, ir al cuestionario del módulo).' }
    ],

    /* ---------- Proyecto integrador — Búho Escribidor (solo unidades con Búho) ---------- */
    buho: [
      { target: '.ub-buho', title: 'Tu Proyecto integrador', text: 'Este proyecto te va a acompañar a lo largo de todo el curso. En cada módulo vas a avanzar una nueva parte y retomar lo que hiciste anteriormente, aplicando los contenidos que vayas aprendiendo. Guardá tu trabajo, porque lo vas a seguir utilizando en los próximos módulos.' },
      { target: '[data-buho-consigna]', title: 'Empezá por la consigna', text: 'Acá vas a encontrar el desafío, el contexto y las indicaciones de lo que tenés que resolver.' },
      { target: '[data-buho-resource="dataset"]', title: 'Dataset', text: 'Es el archivo base con los datos que vas a utilizar para resolver el proyecto. Descargalo y trabajá sobre él.' },
      { target: '[data-buho-resource="video"]', title: 'Video de resolución', text: 'Acá podés ver una forma posible de resolver el proyecto y revisar el proceso paso a paso.' },
      { target: '[data-buho-resource="goldcopy"]', title: 'Goldcopy', text: 'Es una versión de referencia del proyecto resuelto. Podés utilizarla para comparar tu trabajo y revisar el resultado final.' }
    ],

    /* ---------- Sandbox (solo la primera unidad que lo tenga) ---------- */
    sandbox: [
      { target: '[data-sandbox]', title: 'Momento de practicar', text: 'El Sandbox es un ejercicio práctico para poner a prueba lo que acabás de aprender. Es una actividad puntual de esta unidad: podés experimentar, probar y aplicar el contenido sin que forme parte de tu Proyecto integrador.' },
      { target: '[data-sandbox-consigna]', title: 'Empezá por la consigna', text: 'Acá vas a encontrar el desafío y las indicaciones para realizar la práctica. Están dentro del material de estudio: revisalas antes de empezar.' },
      { target: '[data-sandbox] .ub-quick-btns', title: 'Recursos para practicar', text: 'Acá vas a encontrar los materiales que necesitás para resolver el ejercicio. Usalos como punto de partida para hacer la práctica.' }
    ],

    /* ---------- CUESTIONARIO / cierre de módulo (concepto + navegación) ---------- */
    cuestionario: [
      { target: '.cq-card', title: 'El cierre del módulo', text: 'Este es el último paso del módulo: el cuestionario final. Al marcarlo como realizado, cerrás el módulo y desbloqueás el siguiente.' },
      { target: '.cq-card', title: 'Se rinde en Moodle', text: 'El cuestionario se realiza en Moodle. Para acceder necesitás estar logueado en tu cuenta del aula virtual. Se abre en una pestaña nueva.' },
      { target: null, fallback: true, title: 'Cómo se aprueba', text: 'Para aprobar necesitás una calificación de 7 o más en Moodle. Con esa nota, volvé al aula y marcá el cuestionario como realizado para cerrar el módulo.' },
      { target: null, fallback: true, title: 'Si todavía no llegás a 7', text: 'Podés volver a intentarlo las veces que necesites. Te recomendamos aprobar antes de avanzar. Moodle controla la secuencia de los cuestionarios: aunque puedas continuar con algunos contenidos desde esta aula, el siguiente cuestionario permanecerá bloqueado hasta que apruebes el anterior.' },
      { target: null, fallback: true, title: 'La certificación del curso', text: 'Recordá que para acceder a la certificación necesitás tener todos los cuestionarios aprobados. Por eso conviene ir completándolos a medida que avanzás.' },
      { target: '[data-close-module]', title: 'Cuando termines el cuestionario', text: 'Una vez que completes el cuestionario en Moodle, volvé al aula y marcá esta instancia como realizada para registrar tu avance y continuar con el recorrido.' },
      { target: '[data-tour-open]', title: 'Ayuda siempre a mano', text: 'Podés volver a ver esta guía cuando quieras desde este botón:', demo: '<span class="tour-demo-btn" aria-hidden="true"><span class="tour-demo-q">?</span><span class="tour-demo-tx">Ayuda</span></span>' }
    ]
  };

  /* ----------------------------------------------------------------------
     2) PERSISTENCIA (solo del "ya vi el tour") — con fallback en memoria
     ---------------------------------------------------------------------- */
  var memory = null;
  function storageOk() {
    try {
      var t = '__tour__'; window.localStorage.setItem(t, '1'); window.localStorage.removeItem(t); return true;
    } catch (e) { return false; }
  }
  function loadSeen() {
    try {
      var raw = storageOk() ? window.localStorage.getItem(TOUR_KEY) : memory;
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }
  function markSeen(scope) {
    var s = loadSeen();
    s[scope] = true;
    var str = JSON.stringify(s);
    try { if (storageOk()) window.localStorage.setItem(TOUR_KEY, str); else memory = str; } catch (e) {}
  }
  function reset() {
    try { if (storageOk()) window.localStorage.removeItem(TOUR_KEY); } catch (e) {}
    memory = null;
  }

  /* ----------------------------------------------------------------------
     3) ESTADO DEL TOUR
     ---------------------------------------------------------------------- */
  var scope = 'ruta';
  var mainScope = 'inicio';   // flujo principal de la página (para el botón Ayuda)
  var queue = [];      // flujos pendientes a ejecutar en secuencia
  var steps = [];      // pasos válidos (los que tienen elemento o son fallback)
  var idx = 0;
  var active = false;
  var els = {};        // nodos del overlay

  function isVisible(el) {
    if (!el) return false;
    if (el.hidden) return false;
    var r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    var cs = window.getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden';
  }

  // Filtra los pasos: si el elemento no existe/está oculto, se salta
  // (salvo fallback, que se muestra centrado como explicación general).
  function buildSteps() {
    var list = STEPS[scope] || [];
    return list.filter(function (s) {
      if (!s.target) return !!s.fallback;
      return isVisible(document.querySelector(s.target));
    });
  }

  /* ----------------------------------------------------------------------
     4) UI DEL TOUR (overlay + spotlight + tarjeta flotante)
     ---------------------------------------------------------------------- */
  function buildUI() {
    if (els.root) return;
    var root = document.createElement('div');
    root.className = 'tour-root';
    root.setAttribute('aria-live', 'polite');
    root.innerHTML =
      '<div class="tour-overlay" data-tour-skip></div>' +
      '<div class="tour-spot" aria-hidden="true"></div>' +
      '<div class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tour-title">' +
        '<button type="button" class="tour-close" data-tour-skip aria-label="Cerrar la ayuda">&times;</button>' +
        '<span class="tour-count" data-tour-count>Paso 1 de 1</span>' +
        '<h3 class="tour-title" id="tour-title" data-tour-title>Título</h3>' +
        '<p class="tour-text" data-tour-text>Texto</p>' +
        '<div class="tour-demo" data-tour-demo hidden></div>' +
        '<div class="tour-actions">' +
          '<button type="button" class="tour-btn ghost" data-tour-prev>Anterior</button>' +
          '<button type="button" class="tour-btn primary" data-tour-next>Siguiente</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(root);

    els.root  = root;
    els.spot  = root.querySelector('.tour-spot');
    els.card  = root.querySelector('.tour-card');
    els.title = root.querySelector('[data-tour-title]');
    els.text  = root.querySelector('[data-tour-text]');
    els.demo  = root.querySelector('[data-tour-demo]');
    els.count = root.querySelector('[data-tour-count]');
    els.prev  = root.querySelector('[data-tour-prev]');
    els.next  = root.querySelector('[data-tour-next]');

    Array.prototype.forEach.call(root.querySelectorAll('[data-tour-skip]'), function (el) {
      el.addEventListener('click', stop);
    });
    els.prev.addEventListener('click', function () { go(idx - 1); });
    els.next.addEventListener('click', function () {
      if (idx >= steps.length - 1) finish(); else go(idx + 1);
    });

    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
  }

  function onKey(e) {
    if (!active) return;
    if (e.key === 'Escape') { stop(); }
    else if (e.key === 'ArrowRight') { if (idx >= steps.length - 1) finish(); else go(idx + 1); }
    else if (e.key === 'ArrowLeft') { go(idx - 1); }
  }

  function go(i) {
    if (i < 0 || i >= steps.length) return;
    idx = i;
    render();
  }

  function render() {
    var step = steps[idx];
    if (!step) return;

    els.title.textContent = step.title;
    els.text.textContent = step.text;
    if (els.demo) {
      if (step.demo) { els.demo.innerHTML = step.demo; els.demo.hidden = false; }
      else { els.demo.innerHTML = ''; els.demo.hidden = true; }
    }
    els.count.textContent = 'Paso ' + (idx + 1) + ' de ' + steps.length;
    els.prev.disabled = (idx === 0);
    els.next.textContent = (idx === steps.length - 1) ? 'Finalizar' : 'Siguiente';

    var el = step.target ? document.querySelector(step.target) : null;
    if (el && isVisible(el)) {
      // Centra el elemento en pantalla y luego posiciona (esperamos al scroll)
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      setTimeout(function () { placeOn(el); }, 260);
    } else {
      placeCentered();
    }
    els.card.focus && els.card.focus();
  }

  // Señala un elemento: recorta el overlay (spotlight) y ubica la tarjeta.
  function placeOn(el) {
    var r = el.getBoundingClientRect();
    var pad = 8;
    els.spot.style.display = 'block';
    els.spot.style.top    = (r.top - pad) + 'px';
    els.spot.style.left   = (r.left - pad) + 'px';
    els.spot.style.width  = (r.width + pad * 2) + 'px';
    els.spot.style.height = (r.height + pad * 2) + 'px';

    var card = els.card;
    card.classList.remove('centered');
    var cw = card.offsetWidth || 320;
    var ch = card.offsetHeight || 160;
    var gap = 14;
    var vw = window.innerWidth, vh = window.innerHeight;

    // Debajo del elemento si entra; si no, arriba; si tampoco, centrado vertical.
    var top;
    if (r.bottom + gap + ch <= vh - 10) top = r.bottom + gap;
    else if (r.top - gap - ch >= 10) top = r.top - gap - ch;
    else top = Math.max(10, Math.min(vh - ch - 10, r.top));

    var left = r.left + (r.width / 2) - (cw / 2);
    left = Math.max(12, Math.min(left, vw - cw - 12));

    card.style.top = top + 'px';
    card.style.left = left + 'px';
  }

  // Paso general (sin elemento): tarjeta centrada, sin spotlight.
  function placeCentered() {
    els.spot.style.display = 'none';
    els.card.classList.add('centered');
    els.card.style.top = '';
    els.card.style.left = '';
  }

  function reposition() {
    if (!active) return;
    var step = steps[idx];
    if (!step) return;
    var el = step.target ? document.querySelector(step.target) : null;
    if (el && isVisible(el)) placeOn(el); else placeCentered();
  }

  /* ----------------------------------------------------------------------
     5) CONTROL
     ---------------------------------------------------------------------- */
  function start() {
    steps = buildSteps();
    if (!steps.length) return;   // nada que mostrar
    buildUI();
    idx = 0;
    active = true;
    document.body.classList.add('tour-open');
    els.root.classList.add('show');
    render();
  }

  function stop() {
    if (!active) return;
    active = false;
    document.body.classList.remove('tour-open');
    if (els.root) els.root.classList.remove('show');
    markSeen(scope);   // cerrarlo también cuenta como "ya lo vi"
    runNext();         // si hay otro flujo en cola (p. ej. Búho), arranca
  }
  // Arranca los flujos encolados de a uno (saltea los que no tienen pasos visibles).
  function runNext() {
    while (queue.length) {
      scope = queue.shift();
      start();
      if (active) return;   // arrancó bien; se seguirá al cerrarse
    }
  }

  function finish() {
    markSeen(scope);
    stop();
  }

  /* Botón flotante de ayuda "?" (se inyecta si la página no lo trae) */
  function ensureHelpButton() {
    var btn = document.querySelector('[data-tour-open]');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tour-fab';
      btn.setAttribute('data-tour-open', '');
      btn.setAttribute('aria-label', 'Ver ayuda guiada');
      btn.innerHTML = '<span aria-hidden="true">?</span><span class="tour-fab-tx">Ayuda</span>';
      document.body.appendChild(btn);
    }
    if (!btn.__wired) {
      btn.__wired = true;
      btn.addEventListener('click', function (e) { e.preventDefault(); var qq = pageTours(true); if (qq.length) { queue = qq; runNext(); } });
    }
  }

  /* ----------------------------------------------------------------------
     6) INIT
     scope: 'ruta' | 'modulo'
     El tour se muestra AUTOMÁTICAMENTE solo la primera vez en:
       - la RUTA (ruta.html), y
       - el MÓDULO 1 (primer módulo del recorrido).
     En el resto de los módulos, solo se abre manualmente con el botón "?".
     ---------------------------------------------------------------------- */
  // Flujos de recorrido relevantes para la página actual.
  //  all=false -> solo los que aún no se vieron (arranque automático).
  //  all=true  -> todos los relevantes (botón Ayuda), incluidos Sandbox/Búho de la unidad.
  function pageTours(all) {
    var seen = loadSeen();
    var q; try { q = new URLSearchParams(window.location.search); } catch (e) { q = { get: function () { return null; } }; }
    var list = [];
    if (mainScope === 'inicio') {
      if (all || !seen.inicio) list.push('inicio');
    } else if (mainScope === 'modulo') {
      if (all || ((parseInt(q.get('m'), 10) === 1) && !seen.modulo)) list.push('modulo');
    } else if (mainScope === 'unidad') {
      if (all || ((parseInt(q.get('m'), 10) === 1 && parseInt(q.get('u'), 10) === 1) && !seen.unidad)) list.push('unidad');
      if (document.querySelector('[data-sandbox]') && (all || !seen.sandbox)) list.push('sandbox');
      if (document.querySelector('.ub-buho') && (all || !seen.buho)) list.push('buho');
    } else if (mainScope === 'cuestionario') {
      if ((all || !seen.cuestionario) && document.querySelector('.cq-card')) list.push('cuestionario');
    }
    return list;
  }

  function init(pageScope) {
    scope = (['modulo', 'unidad', 'inicio', 'cuestionario'].indexOf(pageScope) >= 0) ? pageScope : 'inicio';
    mainScope = scope;
    ensureHelpButton();

    // Cola de flujos a ejecutar automáticamente (solo los que aún no se vieron).
    var toRun = pageTours(false);
    if (!toRun.length) return;

    setTimeout(function () {
      if (document.body.classList.contains('modal-open')) return; // no pisar un modal (celebración, etc.)
      queue = toRun;
      runNext();
    }, 900);
  }

  return {
    init: init,
    start: start,
    stop: stop,
    reset: reset,
    STEPS: STEPS,
    TOUR_KEY: TOUR_KEY
  };
})();
