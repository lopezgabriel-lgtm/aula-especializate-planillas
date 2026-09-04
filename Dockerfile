# ---- Aula Especializate · Gateway LTI 1.3 ------------------------------
# Imagen mínima y reproducible. El progreso remoto todavía no se eligió, así
# que la imagen solo necesita Node; no incluye cliente de base de datos.
FROM node:20-alpine

# Zona horaria opcional (ajustar si hace falta)
ENV NODE_ENV=production

WORKDIR /app

# 1) Dependencias (capa cacheable): copiamos manifiestos e instalamos prod.
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund

# 2) Código de la aplicación + aula + cliente.
COPY src ./src
COPY public ./public
COPY aula ./aula
COPY aula-client ./aula-client

# El servidor lee el puerto de PORT (default 3000).
EXPOSE 3000

# Persistencia de la clave de la herramienta (JWKS) y, si se usa store=file,
# de los datos. Montar un volumen en producción para que sobrevivan reinicios.
VOLUME ["/app/.keys", "/app/.data"]

# Healthcheck contra el endpoint /healthz del gateway.
HEALTHCHECK --interval=30s --timeout=4s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
