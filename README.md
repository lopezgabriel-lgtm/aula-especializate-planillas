# Aula Especializate — Proyecto B · LTI + backend (desarrollo)

Versión de **desarrollo** del aula: frontend completo + **integración LTI 1.3**
con Moodle + **backend con persistencia centralizada del progreso**. Es la versión
sobre la que se continúa evolucionando la arquitectura de backend.

El gateway (Node.js + Express) valida el lanzamiento LTI **en el backend**, crea
una sesión server-side y **sirve el aula sin modificarla**. El progreso se guarda
y recupera vía backend (`/api/progress` → `ProgressStore`), con `localStorage`
usado **solo como caché local** (no como fuente de verdad).

> Fuente de verdad del progreso: **backend / almacenamiento del `ProgressStore`**.
> Este proyecto es autocontenido e independiente del Proyecto A.

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
│   ├── lti/               login OIDC, launch, JWKS, identidad
│   ├── routes/            /lti, /api/me, /api/progress
│   ├── middleware/        protección de sesión
│   └── progress/          ProgressStore (placeholders memory/file)
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

- **Tool / Launch URL** → `PUBLIC_BASE_URL/lti/launch`
- **OIDC login init URL** → `PUBLIC_BASE_URL/lti/login`
- **Public keyset (JWKS)** → `PUBLIC_BASE_URL/lti/jwks`

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

Progreso (por ahora, dejar en local):

```
PROGRESS_MODE=local
```

Todavía **no** hay un almacenamiento remoto elegido (decisión abierta con Backend).
En `local`, el progreso se guarda en el navegador; la autenticación LTI + sesión +
identidad quedan plenamente operativas para probar el flujo Moodle → aula.

Si Moodle abre el aula dentro de un iframe: `EMBED_IN_IFRAME=true` (requiere HTTPS).

Ver `.env.example` para la lista completa y comentada.

## Probar sin Moodle (solo desarrollo)

Con `DEV_FAKE_LAUNCH=true` y `NODE_ENV=development`, entrar a
`PUBLIC_BASE_URL/dev/launch` simula una sesión y abre el aula.
**Nunca** habilitar esto en producción.

---

## Endpoints

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
- El aula (`aula/`) se sirve **sin modificar** salvo `progress.js`, que fue
  desacoplado del almacenamiento (mismo comportamiento en modo local).
- Persistencia remota, indicadores de sincronización en la UI y separación por
  curso están **preparados o pendientes**; ver la documentación técnica del proyecto.
- El store `memory`/`file` es **placeholder**: no usar en producción como fuente
  durable hasta definir la tecnología de almacenamiento.
