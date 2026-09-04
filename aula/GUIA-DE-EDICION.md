# Guia de edicion del aula (template reutilizable)

Casi todo el contenido del aula se edita en **un solo archivo: `aula/course.config.js`**.
Las pantallas se arman solas a partir de el. **No hay que editar HTML por modulo ni por unidad.**

> Regla de oro: para cambiar contenido, editas `course.config.js`. La logica (desbloqueos, XP, insignias)
> vive en `progress.js` y normalmente **no se toca**.

> **Sobre las dos versiones del proyecto.** Existe una version con **localStorage** (respaldo) y otra con
> **backend** (persistencia centralizada del progreso). La edicion de contenido es **identica en las dos**:
> en ambas se edita `aula/course.config.js`. Lo unico que cambia entre versiones es donde se guarda el avance
> del alumno, no como se cargan los contenidos.

---

## 0. Como sacar el ID de un video de YouTube
En `https://www.youtube.com/watch?v=**dQw4w9WgXcQ**`, el ID es lo que va despues de `v=` -> `dQw4w9WgXcQ`.
En la config se carga solo el ID (no la URL completa).

## 1. Estructura de `course.config.js`
```js
window.COURSE_CONFIG = {
  name: "Introduccion a la IA",              // nombre del curso (breadcrumb, titulos)
  logo: "img/especializate-logo-blanco.png", // logo del sidebar (fondo oscuro)

  links: {                                   // accesos internos
    rutas:    "inicio.html",                 // enlace "volver al inicio del curso" (boton Volver + breadcrumb)
    progreso: "progreso.html",               // item del sidebar "Mi progreso"
    badges:   "badges.html"                  // item del sidebar "Mis logros"
  },

  intro: { ... },      // "Inicio y bienvenida": los 3 contenidos iniciales
  modules: [ ... ],    // los 5 modulos (con sus unidades y recursos)
  final: { ... }       // evaluacion final + certificacion
};
```
> Nota sobre `links.rutas`: ya **no** es un item del menu lateral (se quito "Rutas de aprendizaje").
> La clave se mantiene porque el aula la reutiliza como enlace "volver al inicio" en el boton Volver y en el
> breadcrumb. No hace falta tocarla.

## 2. Editar los 3 contenidos iniciales (`intro`)
```js
intro: {
  label: "Inicio y bienvenida",
  href:  "inicio.html",
  eyebrow: "Bienvenida",
  title:   "Inicio y bienvenida",
  description: "Texto de bienvenida...",
  resources: [
    { step: "intro.especializate", required: true, label: "Sobre especIAlizate", kind: "video",
      youtubeId: "1XwQ2nPGTQ8", description: "..." },
    { step: "intro.programa", required: true, label: "Programa del curso", kind: "pdf",
      url: "https://.../programa.pdf", description: "..." },
    { step: "intro.introduccion", required: true, label: "Introduccion al curso", kind: "video",
      youtubeId: "wO51weDN_cM", description: "..." }
  ]
}
```
- `kind: "video"` -> mostra un video de YouTube (`youtubeId`). `kind: "pdf"` -> boton para abrir el `url`.
- **No cambies los `step`** (`intro.especializate`, `intro.programa`, `intro.introduccion`): conectan con la logica.
- `required: true` -> **hay que acceder al recurso para poder completar la seccion**: el video se habilita al
  reproducirlo (boton "Reproducir video") y el PDF al abrirlo ("Ver programa"). Recien ahi se habilita el boton
  "Marcar como completado". Si pones `required: false`, se puede completar sin acceder al recurso.
- Cada uno suma **50 XP** al marcarse como completado; los tres completos abren el Modulo 1 y dan la insignia Iniciante.

## 3. Editar un MODULO (lo mas habitual)
Cada objeto dentro de `modules`:
```js
{
  n: 1,                                  // numero de modulo (NO cambiar el orden)
  title: "Fundamentos de IA",
  description: "Texto de introduccion del modulo.",
  href: "modulo.html?m=1",               // NO cambiar
  estimatedTime: "Aprox. 3 hs",          // chip de tiempo (texto libre)
  video: { youtubeId: "F7B3tS6uvAE", duration: null },  // video de intro del modulo
  quizUrl: "https://.../mod/quiz/view.php?id=979580",   // cuestionario del modulo (Moodle)
  objectives: [                          // lista "Que vas a aprender" (opcional)
    "Objetivo 1...",
    "Objetivo 2..."
  ],
  units: [ ... ]                         // 4 unidades (ver punto 4)
}
```
- `video.duration`: texto opcional (ej. `"2:45 min"`). Si es `null`, no se muestra.
- `objectives`: alimenta la seccion **"Que vas a aprender"** de la intro del modulo. Si la dejas vacia (`[]`),
  esa seccion no aparece.
- El XP del modulo (200) se calcula solo (4 unidades x 40 + cuestionario 40).

## 4. Editar una UNIDAD y sus RECURSOS
Cada unidad, dentro de `units`:
```js
{
  n: 1,
  title: "Historia y evolucion de la inteligencia artificial",
  description: null,                     // opcional: texto de contexto de la unidad
  video: { youtubeId: "UY23hIPulFk" },   // video introductorio de la unidad
  resources: [                           // <- los accesos de la unidad (cantidad y tipo libres)
    { id: "m1u1-material", category: "Material de estudio",
      type: "Presentacion (Gamma)", label: "Presentacion del tema",
      required: true,  url: "https://gamma.app/docs/..." },

    { id: "m1u1-doc", category: "Material complementario",
      type: "Documento PDF", label: "Guia practica",
      required: false, url: "https://drive.google.com/..." },

    { id: "m1u1-check", category: "Comproba tus conocimientos",
      type: "Actividad interactiva", label: "Actividad de repaso",
      required: false, url: "https://view.genially.com/..." }
  ]
}
```
Cada **recurso**:
- `id`: identificador unico (usa el patron `m<MODULO>u<UNIDAD>-<algo>`). **Debe ser unico y estable**: es lo que
  guarda el estado "realizado" del recurso. Si lo cambias, se pierde ese registro.
- `category`: el titulo del bloque (Material de estudio, Material complementario, Promptbook, Sandbox, etc.).
  Podes agrupar varios recursos en la misma categoria: se muestran juntos.
- `type`: subtitulo/tipo (texto libre).
- `label`: nombre del recurso.
- `required`: `true` = **obligatorio** para poder marcar la unidad como completada. `false` = opcional.
  - Por defecto, "Material de estudio" es obligatorio (preserva la regla original: hay que abrirlo).
  - Podes marcar como obligatorio cualquier recurso que quieras.
  - El mensaje al alumno es: "Completa el recurso obligatorio de la unidad para poder marcarla como completada
    y desbloquear la proxima unidad."
- `url`: enlace del recurso (se abre en pestana nueva y queda marcado como realizado).

> **Cantidad y tipo de recursos**: no todas las unidades necesitan los mismos. Agregas/sacas objetos del array
> `resources` y la pantalla se adapta sola.

## 5. Editar la EVALUACION FINAL y la certificacion (`final`)
```js
final: {
  label: "Evaluacion final",
  href:  "final.html",
  description: "...",
  quizUrl: "https://.../mod/quiz/view.php?id=979585",   // enlace al cuestionario final en Moodle
  certUrl: ""    // enlace para descargar el certificado en Moodle  (CARGAR)
}
```
- Mientras `quizUrl`/`certUrl` esten vacios, la pantalla muestra un aviso de "falta cargar el enlace".
- Al aprobar la evaluacion final se suma **500 XP** y se activa la certificacion (100% / 1650 XP).

## 6. Cuestionarios, LTI y Moodle (importante)
- **Autenticacion (LTI 1.3):** el aula ya se integra con Moodle mediante LTI 1.3. El alumno entra desde su curso
  en Moodle, Moodle valida el lanzamiento contra el backend y se crea su sesion: **no hay un segundo login**.
  De eso se encarga el gateway (no se toca desde la config de contenido).
- **Cuestionarios:** los cuestionarios (de modulo y final) se rinden en **Moodle**; el estudiante ya esta
  logueado por el lanzamiento LTI. Se cargan como `quizUrl` (modulo) y `final.quizUrl`.
- **La nota:** el aula **no conoce la nota**. El estudiante marca el cuestionario como aprobado para registrar
  su avance en el aula. La secuencia y la correccion real las controla **Moodle**.

## 7. Clonar el aula a OTRO curso
1. Copia toda la carpeta del proyecto (la version que uses: localStorage o backend).
2. Edita `aula/course.config.js`: `name`, `logo`, los 3 recursos de `intro`, los `modules` (titulos, videos,
   quizUrl, objetivos y las `units` con sus `resources`) y el `final`.
3. Reemplaza las imagenes de `aula/img/` si corresponde (logo e insignias).
4. Ajusta la config LTI del nuevo despliegue (ver README del proyecto: es una **aula por curso**).
5. Listo: las pantallas se arman solas con el contenido nuevo.

> El template asume **5 modulos x 4 unidades**. Cambiar esa cantidad implica ajustar tambien la logica en
> `progress.js` (XP y desbloqueos); no se resuelve solo desde la config.

## 8. Que NO tocar (y como reiniciar)
- **`progress.js`** (logica), **`shell.js`** (sidebar/header) y **`screens.js`** (render) no se editan para cambiar
  contenido. Solo se tocan para cambiar comportamiento o disenio.
- Reiniciar para probar de cero (consola del navegador, F12 -> Console):
  ```js
  AulaProgress.reset(); location.reload();   // borra progreso + reinicia el tour
  AulaTour.reset();                          // reinicia solo el tour
  ```

## 9. Como previsualizar mientras editas
La app se sirve con el **gateway Node** (no es un sitio estatico). Para probar el recorrido completo (con LTI y
sesion) se levanta el proyecto: `npm install` y `npm start`, y con `DEV_FAKE_LAUNCH=true` se entra por
`/dev/launch` para simular una sesion (ver README del proyecto). La entrada del aula es **`index.html`** (portada);
su boton lleva al recorrido (`inicio.html`).

> Para una **vista rapida solo del contenido** (sin LTI ni sesion) podes abrir el aula como estatico apuntando un
> servidor simple a la carpeta `aula/` (`cd aula && python3 -m http.server 8000` -> `index.html`). En ese modo
> el progreso queda en localStorage y no hay identidad de alumno; sirve para revisar textos y recursos.

## 10. Checklist antes de publicar
- [ ] `name`, `logo` y los 3 recursos de `intro` cargados (videos/PDF reales, no placeholders) con `required` segun corresponda.
- [ ] Cada modulo: `title`, `description`, `video.youtubeId`, `quizUrl` y (opcional) `objectives`.
- [ ] Cada unidad: `title`, `video.youtubeId` y sus `resources` (con `url` reales y `required` correcto).
- [ ] `final.quizUrl` (cargado) y `final.certUrl` (cargar cuando este disponible).
- [ ] Titulos en formato oracion (ej. "Introduccion al pensamiento estrategico", no "Introduccion al Pensamiento Estrategico").
- [ ] Probar el recorrido completo levantando el proyecto (`npm start` + `/dev/launch`).
- [ ] Revisar que ningun recurso quede con `url` vacia o de ejemplo.
