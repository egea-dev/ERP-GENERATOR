# ERP Generator - Guía de Despliegue en Coolify

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                    Coolify Server                    │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   Frontend   │  │   Backend    │  │    DB      │ │
│  │  (Nginx:80)  │──│  (Node:3001) │──│ (PG:5432)  │ │
│  │              │  │              │  │            │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
│         │                  │                         │
│         └──────────────────┘                         │
│               │                                      │
│         Tu Dominio                                   │
└─────────────────────────────────────────────────────┘
```

## Opción A: Docker Compose (Recomendada)

### 1. Preparar el repositorio

Asegúrate de que tu repositorio contiene:
- `docker-compose.yml`
- `Dockerfile.backend`
- `Dockerfile.frontend`
- `apps/frontend/Dockerfile`
- `apps/frontend/nginx.conf`
- `apps/backend/Dockerfile`
- `database/00_standalone_postgres.sql`

### 2. Crear aplicación en Coolify

1. Ve a tu panel de Coolify
2. Click en **"Add New Resource"** → **"Docker Compose Empty"**
3. Selecciona tu proyecto y entorno
4. Configura:
   - **Name**: `erp-generator`
   - **Repository**: Tu repo de Git
   - **Branch**: `main` (o tu rama principal)
   - **Docker Compose Location**: `docker-compose.yml`

### 3. Configurar variables de entorno

En la sección **Environment Variables** de Coolify, añade:

```bash
# Base de datos
POSTGRES_USER=postgres
POSTGRES_PASSWORD=una-contraseña-segura-aqui
POSTGRES_DB=erp_generator

# Backend
JWT_SECRET=genera-una-clave-aleatoria-larga-aqui
CORS_ORIGIN=https://tu-dominio.com

# Frontend
VITE_API_URL=https://tu-dominio.com/api

# LLM (opcional)
DEFAULT_LLM_PROVIDER=lmstudio
LMSTUDIO_URL=http://host.docker.internal:1234/v1
EMBEDDING_MODEL=text-embedding-nomic-embed-text-v1.5
```

### 4. Configurar dominios

- **Frontend**: `tu-dominio.com` → puerto `80`
- **Backend**: `tu-dominio.com/api` → puerto `3001`

> **Nota**: En Coolify, configura el frontend como servicio principal con el dominio. El backend se accede a través del mismo dominio con proxy.

### 5. Desplegar

Click en **"Deploy"** y espera a que todos los servicios estén healthy.

---

## Opción B: Servicios separados en Coolify

Si prefieres gestionar cada servicio por separado:

### 1. Base de Datos (PostgreSQL + pgvector)

1. **Add New Resource** → **PostgreSQL**
2. Configura:
   - **Name**: `erp-db`
   - **Image**: `ankane/pgvector:latest`
   - **Database**: `erp_generator`
   - **User**: `postgres`
   - **Password**: (genera una segura)
3. Añade el script de inicialización en **Init Scripts**:
   - Sube `database/00_standalone_postgres.sql`

### 2. Backend (Node.js)

1. **Add New Resource** → **Git Based**
2. Configura:
   - **Repository**: Tu repo
   - **Branch**: `main`
   - **Build Pack**: `nixpacks` o `dockerfile`
   - **Dockerfile**: `Dockerfile.backend`
   - **Build Context**: `./apps/backend`
   - **Port**: `3001`
3. **Environment Variables**:
   ```bash
   DATABASE_URL=postgresql://postgres:PASSWORD@erp-db:5432/erp_generator
   JWT_SECRET=tu-clave-secreta
   CORS_ORIGIN=https://tu-dominio.com
   PORT=3001
   ```
4. **Health Check**: `GET /health`

### 3. Frontend (Vite + Nginx)

1. **Add New Resource** → **Git Based**
2. Configura:
   - **Repository**: Tu repo
   - **Branch**: `main`
   - **Dockerfile**: `Dockerfile.frontend`
   - **Port**: `80`
3. **Environment Variables**:
   ```bash
   VITE_API_URL=https://tu-dominio.com/api
   ```
4. **Domain**: `tu-dominio.com`

---

## IA local por Tailscale

Si quieres que el backend consuma `LMStudio` local sin meter toda la VPS en Tailscale, usa el mismo stack Compose del ERP con un sidecar `tailscale` para el backend.

- Compose listo: `docker-compose.yml`
- Guía paso a paso: `COOLIFY_LMSTUDIO_TAILSCALE.md`

La idea es:

- `frontend` sigue publico
- `backend` se despliega con `tailscale` en el mismo stack
- `db` sigue interna en el mismo stack
- `LMStudio` se consume por `LMSTUDIO_URL` dentro de tu tailnet

---

## Opción C: Nixpacks (Más simple)

Coolify soporta Nixpacks automáticamente. Solo necesitas:

1. **Add New Resource** → **Git Based**
2. Selecciona tu repo
3. Coolify detectará automáticamente los `package.json`
4. Configura las variables de entorno como en las opciones anteriores

---

## Configuración de Proxy Inverso

Si usas un solo dominio para frontend y backend, configura el proxy en Coolify:

### Frontend (Nginx) - Añadir proxy al backend

Modifica `apps/frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Proxy al backend
    location /api/ {
        proxy_pass http://erp-backend:3001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    # ... resto de configuración ...
}
```

---

## Verificación Post-Despliegue

### 1. Verificar servicios
```bash
# En Coolify, todos los servicios deben estar "Healthy"
```

### 2. Probar endpoints
```bash
# Health check
curl https://tu-dominio.com/health

# API
curl https://tu-dominio.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 3. Acceder a la aplicación
- URL: `https://tu-dominio.com`
- Email: `test@example.com`
- Password: `password`

---

## Solución de Problemas

### Error: "No se pudo conectar con el servidor"
- Verifica que `VITE_API_URL` apunta correctamente al backend
- En Docker Compose, usa el nombre del servicio: `http://erp-backend:3001/api`
- En producción con dominio, usa: `https://tu-dominio.com/api`

### Error: "Token inválido"
- Asegúrate de que `JWT_SECRET` es el mismo en todos los despliegues
- No cambies el JWT_SECRET después de que los usuarios hayan iniciado sesión

### Error de base de datos
- Verifica que `DATABASE_URL` usa el nombre correcto del servicio de DB
- En Docker Compose: `postgresql://postgres:password@db:5432/erp_generator`
- En Coolify con servicios separados: usa la URL interna que proporciona Coolify

### Error: CORS
- Configura `CORS_ORIGIN` con tu dominio exacto: `https://tu-dominio.com`
- No uses `*` en producción

---

## Variables de Entorno Completas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `POSTGRES_USER` | Usuario de PostgreSQL | `postgres` |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL | `tu-contraseña-segura` |
| `POSTGRES_DB` | Nombre de la base de datos | `erp_generator` |
| `JWT_SECRET` | Clave secreta para JWT | `clave-aleatoria-larga` |
| `CORS_ORIGIN` | Dominio permitido | `https://tu-dominio.com` |
| `VITE_API_URL` | URL de la API | `https://tu-dominio.com/api` |
| `DEFAULT_LLM_PROVIDER` | Proveedor de IA | `lmstudio`, `openai`, `ollama` |
| `OPENAI_API_KEY` | API Key de OpenAI | `sk-...` |
| `LMSTUDIO_URL` | URL de LM Studio | `http://host:1234/v1` |
| `EMBEDDING_MODEL` | Modelo de embeddings | `text-embedding-nomic-embed-text-v1.5` |
| `RAG_TOP_K` | Número de resultados RAG | `5` |
| `RAG_SIMILARITY_THRESHOLD` | Umbral de similitud | `0.70` |

---

## Seguridad en Producción

1. **Cambia todas las contraseñas por defecto**
2. **Genera un JWT_SECRET aleatorio**: `openssl rand -hex 32`
3. **Configura CORS con tu dominio exacto** (no uses `*`)
4. **Activa HTTPS** (Coolify lo hace automáticamente con Let's Encrypt)
5. **Elimina el usuario de prueba** (`test@example.com`) o cámbiale la contraseña
6. **Configura backups automáticos** de la base de datos en Coolify
