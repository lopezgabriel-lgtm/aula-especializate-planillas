# Aula virtual — Introducción a la IA (especIAlizate)

Aula gamificada con **avance secuencial**, **XP**, **insignias** y progreso guardado en `localStorage`.
La interfaz es **data-driven**: el contenido vive en un único archivo (`course.config.js`) y las pantallas se
arman solas a partir de él. Para clonar el aula a otro curso, en principio alcanza con editar ese archivo.

> **¿Vas a cambiar contenido, videos, enlaces o clonar el template?** Mirá **`GUIA-DE-EDICION.md`**.

---

## Cómo se entra al aula
- **`index.html`** — portada / puente desde Moodle. Su botón **"Ingresar al aula"** abre `inicio.html`.
- **`inicio.html`** — **entrada real del aula**. El estudiante aterriza acá y navega desde el **sidebar**.

## Estructura del proyecto (carpeta plana, sin build)
```
index.html          <- portada (Moodle) -> entra a inicio.html
inicio.html         <- Inicio y bienvenida (3 contenidos iniciales)
modulo.html         <- Introduccion de modulo   (plantilla unica, lee ?m=N)
unidad.html         <- Pantalla de unidad        (plantilla unica, lee ?m=N&u=K)
cuestionario.html   <- Cierre del modulo (cuestionario final del modulo, ?m=N)
final.html          <- Evaluacion final + certificacion del curso
progreso.html       <- Mi progreso (dashboard)
badges.html         <- Mis logros (insignias)

course.config.js    <- * CONTENIDO DEL CURSO (fuente unica, editable)
progress.js         <- logica de avance/XP/insignias (fuente de verdad - NO tocar salvo necesidad)
shell.js            <- sidebar + header (se montan en todas las pantallas)
screens.js          <- render de las pantallas a partir de course.config.js + progress.js
tour.js             <- ayuda guiada / product tour
aula.css            <- estilos compartidos
img/                <- logos e insignias
```

Las plantillas **`modulo.html`, `unidad.html`, `cuestionario.html`** son **una sola cada una** para todo el
curso: reciben el modulo/unidad por la URL (`?m=`, `?u=`) y se completan con los datos de `course.config.js`.
**No hay un HTML por modulo ni por unidad.**

## Como esta armado el recorrido
```
Inicio y bienvenida        (3 recursos: 50 XP c/u = 150)
  |- Modulo N               (se abre al completar el modulo anterior)
  |    |- Introduccion      (video + objetivos + datos del modulo)
  |    |- Unidad 1..4       (contexto + video + recursos; 40 XP c/u)
  |    |- Cuestionario      (cierre del modulo, en Moodle; 40 XP)
  |- Evaluacion final       (se abre con los 5 modulos completos; 500 XP)
       |- Certificacion     (se activa al aprobar la evaluacion final)
```

- **Sidebar** = navegacion principal. Al desplegar un modulo aparecen **Introduccion -> Unidades -> Cuestionario**.
- **Header** = breadcrumb + progreso general (%) + XP.
- Cada elemento muestra su **estado**: bloqueado (candado) / disponible / en progreso / completado (check).

## XP y total
- 3 recursos iniciales: **50 XP** c/u -> 150.
- Por modulo: 4 unidades x **40 XP** + cuestionario **40 XP** = **200 XP** -> x5 = 1000.
- Evaluacion final: **500 XP**.
- **Total: 1650 XP** (el porcentaje del header se calcula sobre este total).

## Reglas de desbloqueo (secuencial)
1. Los 3 recursos iniciales estan disponibles desde el arranque; completarlos abre el **Modulo 1**.
2. Dentro de un modulo, las **unidades se abren en orden** (la 2 se habilita al completar la 1, etc.).
3. El **cuestionario del modulo** se habilita al completar las **4 unidades**.
4. Un modulo queda **completo** al aprobar su cuestionario (unidades + cuestionario); recien ahi se abre el **modulo siguiente**.
5. Con los **5 modulos** completos se abre la **Evaluacion final**.
6. Al aprobar la evaluacion final se activa la **Certificacion** (100% / 1650 XP).

> **Cuestionarios y Moodle:** los cuestionarios se rinden en **Moodle** (hace falta estar logueado). El aula no
> conoce la nota: el estudiante marca el cuestionario como **aprobado** para registrar su avance. La secuencia real
> (7 o mas para aprobar; no acceder al cuestionario siguiente sin aprobar el anterior) la controla **Moodle**
> -todavia no hay integracion web<->Moodle-. El tour del cuestionario explica todo esto.

## Insignias (logros con imagen + modal de felicitacion)
| Insignia | Se obtiene al... | Imagen |
|---|---|---|
| **Iniciante** | completar los 3 recursos iniciales | `img/insignia-iniciante.png` |
| **Explorador** | completar el **Modulo 1** | `img/insignia-explorador.png` |
| **Arquitecto** | completar el **Modulo 3** | `img/insignia-arquitecto.png` |
| **Experto** | completar el **Modulo 5** | `img/insignia-experto.png` |

Se ven en el **sidebar** (insignia actual + barra de progreso) y en **`badges.html`**. Al desbloquear una nueva,
aparece un modal (una sola vez por insignia). Toda la logica esta en `progress.js`.

## Ayuda guiada (product tour)
`tour.js` muestra recorridos con spotlight + tarjeta, la **primera vez** en cada pantalla, y siempre reabribles con
el boton flotante **"?"**. Hay 4 recorridos (scopes): **inicio**, **modulo**, **unidad** y **cuestionario**
(este ultimo explica la nota minima, los reintentos, Moodle y la certificacion). Los textos y pasos se editan en el
objeto `STEPS` de `tour.js`.

## Persistencia (claves de `localStorage`)
- `especializate_ia_progress_v2` - progreso, XP, insignias, y el tracking por recurso.
- `especializate_ia_shell_v1` - preferencia del sidebar (colapsado).
- `especializate_ia_onboarding_v1` - "ya vi el tour" por pantalla.

## Como probar / reiniciar
Servir la carpeta con un servidor local (para que `localStorage` y los videos funcionen sin friccion):
```
cd "Introduccion a la IA"
python3 -m http.server 8000
# entrar a  http://localhost:8000/inicio.html
```
Reiniciar desde la consola del navegador (F12 -> Console):
```js
AulaProgress.reset();   // borra el progreso (y reinicia el tour)
location.reload();
// solo reiniciar el tour sin tocar el progreso:
AulaTour.reset();
```

## Que NO tocar (salvo que sea imprescindible)
- **`progress.js`** es la fuente de verdad de la logica (desbloqueos, XP, insignias, persistencia). Para cambiar
  **contenido** no hace falta tocarlo: se edita `course.config.js`. Ver `GUIA-DE-EDICION.md`.
