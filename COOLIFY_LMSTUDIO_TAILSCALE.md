# Coolify + LMStudio local por Tailscale

Esta guia deja el backend del ERP dentro de Tailscale sin meter toda la VPS en la tailnet y sin separar la base de datos del stack actual.

## Objetivo

- Mantener `frontend` publico.
- Mantener la app accesible desde internet como siempre.
- Hacer que el `backend` use `LMStudio` local por Tailscale.
- No exponer `LMStudio` a internet.

## Archivo listo para usar

Usa el compose principal del proyecto:

- `docker-compose.yml`

## Arquitectura

```text
Usuario -> Frontend publico -> Nginx frontend
                                  |
                                  v
                    host.docker.internal:3001
                                  |
                                  v
                               Backend
                                  |
                    +-------------+-------------+
                    |                           |
                    v                           v
                 db:5432            LMStudio local en tu tailnet
```

## Requisitos previos

### En el servidor de Coolify

- Docker debe tener disponible `/dev/net/tun`
- El host debe permitir contenedores con `cap_add: net_admin`

### En el equipo donde corre LMStudio

- Tailscale instalado y conectado
- LMStudio con servidor API activado
- Un modelo cargado en memoria
- El hostname Tailscale debe resolver desde la tailnet

## Variables que debes poner en Coolify

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
DB_PORT_BIND=5434
BACKEND_PORT_BIND=3001
FRONTEND_PORT_BIND=5173
VITE_API_URL=/api
RAG_TOP_K=5
RAG_SIMILARITY_THRESHOLD=0.70
EMBEDDING_MODEL=text-embedding-nomic-embed-text-v1.5
```

## Como obtener el modelo exacto de LMStudio

Desde una maquina dentro de Tailscale:

```bash
curl http://tu-host-lmstudio.tailnet.ts.net:1234/v1/models
```

Luego copia el `id` exacto y ponlo en `LMSTUDIO_DEFAULT_MODEL`.

## Pasos en Coolify

1. Usa el recurso `Docker Compose` actual del ERP.
2. Sube el `docker-compose.yml` actualizado.
3. Rellena las variables de entorno anteriores.
4. Despliega el stack.
5. Mantén el dominio en `frontend` como antes.

## Importante sobre el proxy interno

Como `backend` usa `network_mode: service:tailscale`, el puerto `3001` vive en el namespace de `tailscale` y se publica solo en localhost del host Docker.

Por eso el frontend ahora hace proxy a:

- `http://host.docker.internal:3001`

Esto evita depender del DNS interno entre servicios de Coolify.

## Tailscale ACL recomendada

Si quieres limitar el acceso del backend solo a LMStudio:

```json
{
  "tagOwners": {
    "tag:erp-ai": ["autogroup:admin"],
    "tag:lmstudio": ["autogroup:admin"]
  },
  "acls": [
    {
      "action": "accept",
      "src": ["tag:erp-ai"],
      "dst": ["tag:lmstudio:1234"]
    }
  ]
}
```

## Comprobacion rapida

Una vez desplegado:

1. Abre `GET /api/chat/providers`
2. Verifica que `lmstudio` aparece como disponible
3. En la UI del chat, el proveedor `LMSTUDIO` debe salir en verde
4. Haz una prueba corta sin RAG

## Fallos tipicos

### LMStudio sale en rojo

Revisa:

- `LMSTUDIO_URL`
- que el modelo este cargado
- que LMStudio responda a `/v1/models`
- que Tailscale vea el host local

### El backend no arranca

Revisa:

- `TS_AUTHKEY`
- existencia de `/dev/net/tun`
- permisos `net_admin`

### El frontend carga pero la API falla

Revisa:

- que `apps/frontend/nginx.conf` apunte a `http://host.docker.internal:3001`
- que `frontend` tenga `extra_hosts: host.docker.internal:host-gateway`
- que el contenedor `tailscale` esté levantado
- que el backend haya arrancado correctamente dentro del namespace de `tailscale`

## Nota operativa

Este modelo mantiene la base de datos interna del mismo stack. No cambia el host de PostgreSQL: sigue siendo `db:5432` dentro del compose.
