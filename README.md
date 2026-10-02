# Aula Especializate — Proyecto B · LTI + backend (desarrollo)

Versión de **desarrollo** del aula: frontend completo + **integración LTI 1.3**
con Moodle + **backend con persistencia centralizada del progreso**. Es la versión
sobre la que se continúa evolucionando la arquitectura de backend.

El gateway (Node.js + Express) valida el lanzamiento LTI **en el backend**, crea
una sesión server-side y sirve el aula. El progreso se guarda y recupera vía
backend (`/api/progress` → `ProgressStore` → **Spring Boot `planillasInteligentes`**).

> **Sin `localStorage`.** El navegador no guarda nada: el progreso vive en el
> servidor y la página lo mantiene solo en memoria. Cada página espera a que el
> progreso llegue del servidor antes de dibujarse (`AulaProgress.whenReady`).
> Este proyecto es independiente del aula de iniciación (su propio backend, base,
> secreto y despliegue).

```
Moodle ──LTI 1.3──▶ Nginx /aula/planillas/ ──▶ Gateway Express (:3001) ──HTTP interno──▶ Tomcat /planillas ──▶ MariaDB
```

La validación criptográfica la hace [`jose`](https://github.com/panva/jose)
(librería JOSE estándar); no hay criptografía artesanal.

---

## Estructura

```
aula-especializate/
├── package.json         Proyecto (scripts: start / dev / check)
├── .env.example         Plantilla de configuración (copiar a .env)
├── Dockerfile           Ejecución reproducible en contenedor
├── .dockerignore
├── .gitignore
├── README.md            (este archivo)
├── src/                 Gateway LTI 1.3
│   ├── server.js          arranque + cadena de middlewares
│   ├── config.js          configuración desde entorno
│   ├── lti/               login OIDC, launch, JWKS, identidad, destino seguro (target.js)
│   ├── routes/            /lti, /api/me, /api/progress
│   ├── middleware/        protección de sesión
│   └── progress/          ProgressStore: springBootStore.js (producción) + memory/file (desarrollo)
├── test/                Tests (node --test): store de Spring y destino del launch
├── public/              Pantallas del gateway (acceso / sesión vencida)
├── aula-client/         auth.js + progress.repository.js (el gateway los inyecta)
└── aula/                El aula (HTML/CSS/JS del recorrido, con progress.js desacoplado)
```

Los defaults del `.env` ya apuntan a `./aula` y `./aula-client`, así que no hay
que tocar rutas si se conserva esta estructura.

---

## Requisitos

- Node.js ≥ 18.17 (probado en Node 20/22).
- HTTPS público en producción (LTI 1.3 y las cookies de sesión lo requieren).

## Puesta en marcha (Node directo)

```bash
cp .env.example .env     # completar valores (ver "Configuración")
npm install
npm start                # o: npm run dev  (recarga en caliente)
```

Al arrancar imprime las tres URLs que hay que registrar en Moodle:

- **Tool / Launch URL** → `PUBLIC_BASE_URL` + `BASE_PATH` + `/lti/launch`
- **OIDC login init URL** → `PUBLIC_BASE_URL` + `BASE_PATH` + `/lti/login`
- **Public keyset (JWKS)** → `PUBLIC_BASE_URL` + `BASE_PATH` + `/lti/jwks`

(con `BASE_PATH=/aula/planillas`: `https://especializate.bue.edu.ar/aula/planillas/lti/launch`, etc.)

Tests: `npm test` (no necesitan backend ni red).

## Ejecución en un servidor

Elegí **una** de estas opciones según tu infraestructura.

### A) Docker (recomendado)

```bash
docker build -t aula-especializate .
docker run -d --name aula \
  --env-file .env \
  -p 3000:3000 \
  -v aula_keys:/app/.keys \
  -v aula_data:/app/.data \
  aula-especializate
```

En producción, poné un reverse proxy con TLS (nginx / Caddy / el del PaaS)
delante del contenedor y configurá `PUBLIC_BASE_URL` con la URL `https://` pública.

### B) Node + pm2

```bash
npm install --omit=dev
pm2 start src/server.js --name aula-especializate
pm2 save && pm2 startup    # para que levante al reiniciar el server
```

### C) Node + systemd

`/etc/systemd/system/aula.service`:

```ini
[Unit]
Description=Aula Especializate (Gateway LTI 1.3)
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/aula-especializate
EnvironmentFile=/opt/aula-especializate/.env
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now aula
```

---

## Configuración (`.env`)

Obligatorias (las provee el admin de Moodle):
`LTI_ISSUER`, `LTI_CLIENT_ID`, `LTI_DEPLOYMENT_ID`, `LTI_AUTH_LOGIN_URL`,
`LTI_JWKS_URL`, `SESSION_SECRET`, `PUBLIC_BASE_URL`, `MOODLE_URL`.

Ruta pública y cookies:

```
PUBLIC_BASE_URL=https://especializate.bue.edu.ar   # solo el ORIGEN
BASE_PATH=/aula/planillas                          # prefijo de TODAS las rutas
```

El gateway cuelga todo de `BASE_PATH` (Nginx reenvía la ruta completa sin reescribirla).
La cookie de sesión se llama `planillas_lti_sid` y va acotada a `BASE_PATH`, así no se
mezcla con la de iniciación (mismo dominio). El launch solo redirige a destinos bajo
`BASE_PATH` y nunca a `/lti/...` (si Moodle manda como `target_link_uri` la propia URL
del launch, el estudiante entra por la portada del aula).

Progreso (backend Spring Boot):

```
PROGRESS_MODE=remote
PROGRESS_STORE=springboot
SPRING_BOOT_URL=http://localhost:8080/planillas   # incluye el contexto del WAR
INTERNAL_API_SECRET=<mínimo 32 caracteres; el mismo que PLANILLAS_INTERNAL_API_SECRET>
COURSE_ID=planillas                               # debe coincidir con PLANILLAS_COURSE_ID
```

- `PROGRESS_MODE=local` = **sin persistencia** (solo memoria; para desarrollo).
- En `NODE_ENV=production` el gateway **no arranca** si el store no es `springboot`
  o si falta alguna variable del backend (mejor fallar al arrancar que perder progreso).
- `studentKey` = hash estable `sha256(issuer + deployment_id + sub)`; el curso viaja
  aparte (`X-Course-Id`). Sin prefijo de curso en la clave.
- El documento de progreso lleva `schemaVersion: 2` (incluye `quizVisited`, `matVisited`
  y `tourSeen`); el gateway lo envía al backend como `schemaVersion`.
- Si Spring no responde, el aula se dibuja igual, muestra un aviso y reintenta; **no
  escribe en el servidor hasta haber leído una vez con éxito** (no pisa lo guardado) y,
  al recuperarse, une lo de ambos lados sin perder nada.

Si Moodle abre el aula dentro de un iframe: `EMBED_IN_IFRAME=true` (requiere HTTPS).

Ver `.env.example` para la lista completa y comentada.

## Probar sin Moodle (solo desarrollo)

Con `DEV_FAKE_LAUNCH=true` y `NODE_ENV=development`, entrar a
`PUBLIC_BASE_URL` + `BASE_PATH` + `/dev/launch` simula una sesión y abre el aula.
**Nunca** habilitar esto en producción.

---

## Endpoints

Todas las rutas cuelgan de `BASE_PATH` (salvo `/healthz` en la raíz, solo para chequeos locales).

| Método | Ruta | Descripción |
|---|---|---|
| GET/POST | `/lti/login` | OIDC Login Initiation |
| POST | `/lti/launch` | Launch: valida el `id_token` y crea la sesión |
| GET | `/lti/jwks` | JWKS público de la herramienta |
| GET | `/api/me` | Identidad del estudiante autenticado (`{ name, role }`) |
| POST | `/api/logout` | Cierra la sesión |
| GET/PUT | `/api/progress` | Progreso del estudiante (identidad desde la sesión) |
| GET | `/healthz` | Healthcheck |

La identidad sale **siempre** de la sesión LTI; nunca de la URL o el cuerpo.

---

## Despliegue en la VM junto a iniciación

Un gateway por aula (puertos 3000 iniciación, 3001 planillas, ambos en loopback) y un
solo Nginx. Checkout **separado por aula** (`/opt/especializate/<aula>`): la clave de la
herramienta vive en `.keys/` dentro de cada checkout.

```nginx
location = /aula/planillas { return 301 /aula/planillas/; }
location /aula/planillas/ {
    proxy_pass http://127.0.0.1:3001;      # sin barra final: conserva la ruta completa
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    # La sesión usa cookie "secure": Express tiene que enterarse de que el acceso fue https.
    # Igualá lo que ya hace el bloque de iniciación (Application Gateway → Nginx).
    proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;
}
```

`/etc/systemd/system/especializate-gateway@.service` (plantilla; instancia `planillas`):

```ini
[Unit]
Description=Especializate gateway (%i)
After=network.target

[Service]
WorkingDirectory=/opt/especializate/%i
EnvironmentFile=/etc/especializate/%i.env
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now especializate-gateway@planillas
```

El backend (`planillas.war` en Tomcat, contexto `/planillas`) **no se expone** por Nginx:
solo el gateway le habla, por loopback. Ver el README de `planillasInteligentes`.

---

## Datos a pedirle al administrador de Moodle

Registrar la herramienta como **LTI 1.3 / LTI Advantage** y obtener:

| Dato | Variable | En Moodle |
|---|---|---|
| Issuer / Platform ID | `LTI_ISSUER` | URL base del campus |
| Client ID | `LTI_CLIENT_ID` | al registrar la herramienta |
| Deployment ID | `LTI_DEPLOYMENT_ID` | al desplegarla |
| Authentication request URL | `LTI_AUTH_LOGIN_URL` | `/mod/lti/auth.php` |
| Public keyset URL | `LTI_JWKS_URL` | `/mod/lti/certs.php` |
| Access token URL (AGS/NRPS futuros) | `LTI_TOKEN_URL` | `/mod/lti/token.php` |

Y entregarle a Moodle las tres URLs que imprime el server al arrancar (Launch,
Initiate login, Public keyset). Pedir además que comparta nombre, apellido, email
y contexto del curso (si no los comparte, la identificación por `sub` igual funciona).

---

## Notas

- `node_modules/` no viene incluido: se regenera con `npm install`.
- El aula (`aula/`) ya no usa almacenamiento del navegador: `progress.js`, `shell.js`
  y `tour.js` dependen del repositorio en memoria (`aula-client/progress.repository.js`)
  y las páginas se dibujan dentro de `AulaProgress.whenReady(...)`. El sidebar
  colapsado vive solo en memoria (se reinicia al cambiar de página).
- Abrir la carpeta `aula/` como archivos estáticos (sin gateway) sigue funcionando para
  editar contenido, pero **no persiste nada** (todo queda en memoria).
- El store `memory`/`file` es **solo desarrollo**: no es durable.
- Límite conocido: si el mismo estudiante usa dos pestañas a la vez, al volver a una pestaña
  oculta se une lo remoto (sin perder nada), pero la pantalla no se redibuja sola hasta navegar.
