# Coolify + LMStudio local por Tailscale

Esta es la forma correcta para este proyecto en Coolify:

- `frontend` y `backend` siguen en la red Docker normal del stack
- PostgreSQL sigue interna como `db:5432`
- `tailscale` se usa solo como proxy HTTP saliente hacia la tailnet
- el `backend` llama a LMStudio a traves de ese proxy

Con esto evitamos romper el DNS interno entre `frontend`, `backend` y `db`.

## Arquitectura

```text
Usuario -> Frontend publico -> backend:3001
                               |
                               v
                      tailscale:1055 (proxy HTTP)
                               |
                               v
                LMStudio local en tu red Tailscale
```

## Por que este modelo

El patron `network_mode: service:tailscale` funciona para algunos contenedores, pero en Coolify rompe facilmente la comunicacion interna del stack y el proxy del frontend.

Para este ERP es mas estable:

- dejar `backend` visible como `backend:3001`
- dejar `frontend` apuntando a `backend:3001`
- sacar solo las peticiones de LMStudio por el proxy de Tailscale

## Variables en Coolify

### Obligatorias

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu-password-db
POSTGRES_DB=erp_generator
TS_AUTHKEY=tskey-auth-xxxxx
JWT_SECRET=tu-clave-larga-y-segura
CORS_ORIGIN=https://tu-dominio.com
LMSTUDIO_URL=http://tu-host-lmstudio.tailnet.ts.net:1234/v1
LMSTUDIO_DEFAULT_MODEL=nombre-exacto-del-modelo
```

### Recomendadas

```env
DEFAULT_LLM_PROVIDER=lmstudio
TS_HOSTNAME=erp-backend-ai
TS_EXTRA_ARGS=--advertise-tags=tag:erp-ai
TS_OUTBOUND_HTTP_PROXY_LISTEN=:1055
LMSTUDIO_PROXY_URL=http://tailscale:1055
DB_PORT_BIND=5434
BACKEND_PORT_BIND=3001
FRONTEND_PORT_BIND=5173
VITE_API_URL=/api
RAG_TOP_K=5
RAG_SIMILARITY_THRESHOLD=0.70
EMBEDDING_MODEL=text-embedding-nomic-embed-text-v1.5
```

## Como funciona

1. El frontend llama a `backend:3001` dentro del stack.
2. El backend sigue usando `db:5432` con normalidad.
3. El proveedor `lmstudio` usa `LMSTUDIO_URL` como destino final.
4. Si `LMSTUDIO_PROXY_URL` esta configurada, el cliente OpenAI usa un `ProxyAgent` de `undici`.
5. Ese proxy apunta al contenedor `tailscale` en `tailscale:1055`.
6. El contenedor `tailscale` reenvia la salida HTTP hacia tu tailnet.

## Como obtener el modelo exacto de LMStudio

Desde cualquier maquina dentro de Tailscale:

```bash
curl http://tu-host-lmstudio.tailnet.ts.net:1234/v1/models
```

Luego copia el `id` exacto a `LMSTUDIO_DEFAULT_MODEL`.

## Comprobacion rapida

Una vez desplegado:

1. Abre `GET /api/chat/providers`
2. Comprueba que `lmstudio` sale disponible
3. En la UI del chat, `LMSTUDIO` debe salir en verde
4. Prueba un prompt corto sin RAG

## Fallos tipicos

### El login falla o la app devuelve 502

En este modelo no deberia ser por Tailscale, porque el frontend vuelve a hablar con `backend:3001`.

Revisa:

- que `apps/frontend/nginx.conf` apunte a `http://backend:3001`
- que el backend este healthy

### LMStudio sale en rojo

Revisa:

- `LMSTUDIO_URL`
- `LMSTUDIO_PROXY_URL`
- que el modelo este cargado en LMStudio
- que Tailscale este autenticado con `TS_AUTHKEY`

### El backend arranca pero LMStudio sigue sin responder

Revisa logs del contenedor `tailscale`:

- autenticacion del nodo
- salida del proxy HTTP
- resolucion del hostname tailnet de LMStudio

## Nota

Este modelo mantiene intacta la base de datos actual y evita tocar el enrutado interno del stack publico.
