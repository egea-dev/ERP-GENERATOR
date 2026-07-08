# Preview local del ERP

Este documento deja una ruta corta para ver la aplicación en local sin Tailscale, Coolify ni servicios externos obligatorios.

## Requisitos

- Node.js 20 o superior
- Docker Desktop activo
- npm

## 1. Instalar dependencias

Desde la raíz del repositorio:

```bash
npm install
```

Si al compilar aparece `"vite" no se reconoce como un comando interno o externo`, significa que este paso no se ha ejecutado correctamente o que se borró `node_modules`. Vuelve a ejecutar `npm install` desde la raíz, no dentro de `apps/frontend`.

## 2. Preparar variables del backend

Copia el ejemplo local:

```bash
copy apps\backend\.env.local.example apps\backend\.env
```

En PowerShell también puedes usar:

```powershell
Copy-Item apps\backend\.env.local.example apps\backend\.env
```

Edita `apps/backend/.env` y cambia como mínimo:

```env
DATABASE_URL=postgresql://postgres:CAMBIA_ESTA_CLAVE@localhost:5434/erp_generator
JWT_SECRET=CAMBIA_ESTE_JWT_LOCAL
ADMIN_EMAIL=admin.local@example.com
ADMIN_PASSWORD=CAMBIA_ESTA_PASSWORD_LOCAL_LARGA
```

Importante: `ADMIN_PASSWORD` debe tener 12 caracteres o más.

## 3. Levantar PostgreSQL local

```bash
npm run preview:db
```

Esto usa `docker-compose.local.yml` y expone PostgreSQL en:

```txt
localhost:5434
```

Si cambiaste la contraseña de `DATABASE_URL`, actualiza también `POSTGRES_PASSWORD` en `docker-compose.local.yml` para que coincidan.

## 4. Arrancar backend

En una terminal:

```bash
npm run preview:backend
```

Debe quedar disponible en:

```txt
http://localhost:3001/health
```

Al arrancar, el backend ejecuta migraciones y crea el admin inicial solo si `ADMIN_EMAIL` y `ADMIN_PASSWORD` existen.

## 5. Arrancar frontend

En otra terminal:

```bash
npm run preview:frontend
```

Abre:

```txt
http://localhost:5173
```

El frontend usa el proxy de Vite para enviar `/api` al backend local `http://localhost:3001`.

## 6. Login

Usa el usuario definido en:

```env
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

## 7. Comprobaciones rápidas

Backend:

```bash
npm run check:backend
```

Build frontend:

```bash
npm run build:frontend
```

## 8. Reset completo de base de datos local

Si ya habías levantado la base antes y quieres recrearla desde cero:

```bash
docker compose -f docker-compose.local.yml down -v
npm run preview:db
```

Esto borra los datos locales del volumen `pgdata-local`.

## Notas de preview

- El chat IA puede mostrar proveedores no disponibles si no tienes LM Studio, OpenAI, Anthropic o Groq configurados.
- El módulo de envíos puede devolver error si no tienes un proxy/API externa real configurada.
- URLGEN no crea carpetas reales desde la preview salvo que configures el worker privado.
- La preview sirve para validar login, paneles, navegación, tickets, tarifas, calculadoras y estructura general.
