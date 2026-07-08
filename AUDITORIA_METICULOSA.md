# Auditoría meticulosa ERP-GENERATOR

Fecha de revisión: 2026-07-03

## 1. Resumen ejecutivo

El repositorio es un monorepo con frontend React/Vite y backend Express/PostgreSQL. La arquitectura general es válida para una primera versión interna, pero necesita separar mejor responsabilidades, endurecer seguridad, completar tests y limpiar varios puntos de deuda técnica.

La revisión anterior detectó riesgos críticos. En esta pasada se han corregido varios de ellos y se deja preparada una ruta de preview local.

## 2. Cambios aplicados durante la auditoría

### Seguridad y configuración

- Eliminado el log que imprimía `JWT_SECRET`.
- Centralizada la lectura de `JWT_SECRET` desde `apps/backend/config.js`.
- Eliminados fallbacks inseguros `default-dev-secret` y `default-secret`.
- Eliminado el admin por defecto con contraseña conocida desde `seedAdmin.js`.
- Eliminado el seed SQL de admin por defecto en `database/00_standalone_postgres.sql`.
- Añadido seed opcional con `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `ADMIN_FULL_NAME`.
- Añadido límite simple de intentos de login en `/api/auth/login` sin dependencias nuevas.
- Añadidas cabeceras HTTP básicas de seguridad sin dependencias nuevas.
- Bloqueado `CORS_ORIGIN=*` en producción.
- Cambiado `.env.example` para no recomendar CORS abierto.
- Eliminada puerta falsa de frontend que mostraba Backoffice por email fijo `admin@oko.com`.

### Preview local

- Añadido `docker-compose.local.yml` para levantar solo PostgreSQL/pgvector en local.
- Añadido `apps/backend/.env.local.example`.
- Añadido `LOCAL_PREVIEW.md` con pasos de arranque.
- Añadidos scripts raíz:
  - `preview:db`
  - `preview:backend`
  - `preview:frontend`
  - `check:backend`

### Scripts

- Corregidos scripts raíz `dev:frontend` y `dev:backend`, que apuntaban a nombres de workspace incorrectos.
- Simplificado `install:all` a `npm install`, porque npm workspaces ya instala todo desde raíz.

## 3. Arquitectura actual

```txt
apps/frontend   React 19 + Vite
apps/backend    Express 5 + PostgreSQL + JWT + RAG/LLM
database        SQL inicial + migraciones sueltas
scripts         utilidades de migración, hash y RAG
docker-compose  despliegue completo con db, tailscale, backend y frontend
```

## 4. Hallazgos críticos pendientes

### 4.1 Migraciones mezcladas

Existen varias fuentes de verdad:

```txt
database/00_standalone_postgres.sql
database/01_esquema_inicial.sql
database/02_urlgen_schema.sql
database/03_tickets_schema.sql
database/04_calculators_schema.sql
database/99_FIX_DEFINITIVO.sql
database/99_fix_tickets_total.sql
apps/backend/migrate.js
scripts/migrate.js
```

Riesgo: una base nueva y una base existente pueden acabar con esquemas diferentes.

Recomendación:

```txt
1. Crear tabla schema_migrations.
2. Convertir todo a migraciones versionadas.
3. No usar archivos 99_FIX_* como fuente permanente.
4. Separar migrate de start en producción.
```

### 4.2 Migración automática al arrancar

`apps/backend/index.js` ejecuta migraciones y seed al iniciar.

Riesgo: un reinicio de producción puede modificar estructura de base de datos sin control operativo.

Recomendación:

```txt
npm run migrate
npm start
```

separados.

### 4.3 Middlewares JWT duplicados

La autenticación se repite en:

```txt
index.js
routes/auth.js
routes/chat.js
routes/data.js
routes/ingest.js
routes/tarifas.js
routes/calculadoras.js
```

Riesgo: diferencias de comportamiento, fallos de seguridad y mantenimiento difícil.

Recomendación: crear `apps/backend/middleware/auth.js` y usarlo en todos los routers.

### 4.4 SQL dentro de rutas

Las rutas mezclan controller, validación, negocio y SQL.

Riesgo: difícil testear, difícil auditar permisos y duplicación.

Recomendación:

```txt
repositories/usersRepository.js
repositories/ticketsRepository.js
repositories/tarifasRepository.js
services/auditService.js
services/authService.js
```

### 4.5 Auditoría no garantizada en backend

El frontend llama a `dbService.insertLog` en algunos módulos, pero no todos los endpoints sensibles registran auditoría desde servidor.

Deben auditarse desde backend:

```txt
login correcto
creación de usuario
cambio de rol
eliminación de usuario
creación/borrado de proveedor
importación de tarifas
activación/borrado de versiones
uso de chat IA
ingesta RAG
cálculos
cambios de panel_config
solicitudes URLGEN
```

### 4.6 Calculadoras saltan parcialmente `dbService`

Varios subcomponentes llaman directamente a `/api/calculadora/calculate` con `fetch` y `localStorage`. Esto rompe la regla del proyecto de centralizar acceso en `dbService`.

Archivos afectados:

```txt
apps/frontend/src/components/Calculadora/subcomponents/*.jsx
```

Además, `CalculadoraPanel` llama después a `dbService.saveCalculation`, lo que puede duplicar guardados porque el backend ya guarda la operación al calcular.

Recomendación:

```txt
1. Añadir dbService.calculate(type, inputs).
2. Hacer que cada calculadora reciba una función onCalculate.
3. Eliminar fetch/localStorage directo de subcomponentes.
4. Eliminar doble guardado.
```

### 4.7 Token en localStorage

El token JWT se guarda en `localStorage`.

Riesgo: si hay XSS, el token es robable.

Para uso interno puede aceptarse temporalmente. Para producción pública, mover a cookie HttpOnly/Secure/SameSite.

### 4.8 Falta validación formal de payloads

Hay validaciones manuales, pero no hay esquemas formales.

Recomendación: Zod o Joi en backend para:

```txt
login
register
tickets
tarifas
importaciones
calculadoras
panel_config
ingest RAG
chat
```

### 4.9 Tests inexistentes

Backend tiene:

```txt
"test": "echo \"Error: no test specified\" && exit 1"
```

Recomendación mínima:

```txt
backend: node:test o vitest + supertest
frontend: vitest + React Testing Library
e2e: Playwright
```

## 5. Hallazgos importantes de frontend

### Puntos positivos

- `dbService.js` centraliza gran parte del acceso API.
- `AuthContext` está separado.
- `ProtectedRoute` existe.
- Vite proxy está bien para preview local.
- Lazy loading reduce carga inicial.

### Puntos pendientes

- Subcomponentes de calculadora hacen `fetch` directo.
- Hay archivo backup dentro de `src`: `CalculadoraPanel.jsx.backup`.
- Hay `testDb.mjs` y `testDb2.mjs` dentro de frontend; deberían moverse a scripts o eliminarse.
- Muchos `console.error` quedan visibles en cliente.

## 6. Hallazgos importantes de backend

### Puntos positivos

- SQL parametrizado con `$1`, `$2`, etc. en la mayoría de endpoints.
- Límite de JSON body a `1mb`.
- Rutas principales protegidas desde `index.js`.
- `requireAdmin` existe en varias rutas sensibles.
- `pgvector` y RAG están contemplados.

### Puntos pendientes

- `requireAdmin` duplicado y no centralizado.
- Algunos errores todavía devuelven `err.message` en módulos no auth.
- `panel-config` tiene GET público dentro del router, aunque queda protegido por montaje en `index.js`; conviene evitar depender de ese detalle.
- `envios.js` no declara auth interno y depende del montaje protegido.
- `ingest` debería requerir admin/editor, no solo usuario autenticado.
- `chat` debería auditar uso y limitar tamaño de `messages`.

## 7. Hallazgos de Docker y despliegue

### Producción actual

`docker-compose.yml` asume:

```txt
PostgreSQL/pgvector
Tailscale
Backend
Frontend
LM Studio
API externa de tarifas/envíos
```

Es correcto para despliegue completo, pero demasiado pesado para preview local.

### Preview local añadida

`docker-compose.local.yml` levanta solo DB para desarrollo local.

Riesgo: si ya existe volumen previo, el SQL inicial no se reaplica.

Solución documentada:

```bash
docker compose -f docker-compose.local.yml down -v
npm run preview:db
```

## 8. Checklist de validación manual local

Después de arrancar la preview:

```txt
1. Abrir http://localhost:3001/health.
2. Abrir http://localhost:5173.
3. Login con ADMIN_EMAIL / ADMIN_PASSWORD.
4. Confirmar que Backoffice solo aparece con rol admin.
5. Crear ticket.
6. Crear referencia REFGEN.
7. Abrir URLGEN sin crear carpeta real.
8. Abrir Tarifas.
9. Abrir Calculadora y probar una operación.
10. Ver logs en Backoffice.
```

## 9. Próxima fase recomendada

Prioridad 1:

```txt
- Centralizar middleware auth/requireAdmin.
- Añadir auditService en backend.
- Corregir calculadoras para no usar fetch/localStorage directo.
- Separar migraciones de start.
```

Prioridad 2:

```txt
- Validación con esquemas.
- Tests de auth y rutas críticas.
- Limpieza de archivos backup/test sueltos.
- Sanitizar errores en tarifas, data, chat, ingest y calculadoras.
```

Prioridad 3:

```txt
- Cookie HttpOnly para JWT.
- CI mínimo: install, lint, build, backend syntax.
- E2E Playwright para login y navegación principal.
```

## 10. Estado actual tras esta auditoría

### Comprobado el 2026-07-07:

```txt
npm install                                          ✅ (49 paquetes añadidos)
npm run build:frontend                               ✅ (build exitoso, 1 warning css menor)
npm run check:backend                                ✅ (5 archivos sin errores)
```

### No comprobable sin Docker Desktop corriendo:

```txt
npm run preview:db                                  ❌ (requiere Docker Engine activo)
npm run preview:backend                             ❌ (requiere PostgreSQL)
npm run preview:frontend                            ❌ (requiere backend para proxy)
http://localhost:3001/health                         ❌ (requiere backend)
http://localhost:5173                                ❌ (requiere frontend corriendo)
login admin                                          ❌ (requiere DB + backend)
```

### Comprobaciones manuales pendientes (con Docker activo):

```txt
npm run preview:db
npm run preview:backend
npm run preview:frontend
curl http://localhost:3001/health
login con admin.local@example.com / password-local-larga-123
```
