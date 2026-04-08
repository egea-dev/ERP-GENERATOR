# URLGEN private worker over Tailscale

This document describes the private model implemented in code for URLGEN remote folder creation.

## Overview

- The public ERP frontend/backend remain public.
- URLGEN stores a folder request job in PostgreSQL.
- A private worker processes the job over Tailscale and creates the folder on a Windows SMB share.
- No public endpoint is exposed on the Windows server.

## Windows side

1. Install Tailscale on the Windows server.
2. Share the real target directory as a dedicated SMB share.
   - Recommended share name: `ERP_PRESUPUESTOS_2026`
   - Share target: the real path behind `X:\PRESUPUESTOS 2026`
3. Create a dedicated user with write permissions only on that share.
4. Tag that Windows node in Tailscale as `tag:urlgen-target`.

## Backend env

The public backend uses:

- `URLGEN_DISPLAY_BASE_PATH`

This is only the display path shown to users and stored in the audit trail.

## Private worker env

The worker expects:

- `DATABASE_URL`
- `URLGEN_WORKER_POLL_MS`
- `URLGEN_JOB_STALE_MS`
- `URLGEN_DEFAULT_SUBFOLDERS`
- `URLGEN_SMB_HOST`
- `URLGEN_SMB_SHARE`
- `URLGEN_SMB_USER`
- `URLGEN_SMB_PASSWORD`
- `URLGEN_SMB_DOMAIN`
- `URLGEN_SMB_PROTOCOL`
- `URLGEN_SMB_TIMEOUT_MS`

## Coolify compose example

```yaml
services:
  tailscale:
    image: tailscale/tailscale:latest
    hostname: tailscale-urlgen-worker
    environment:
      TS_AUTHKEY: ${TS_AUTHKEY}
      TS_EXTRA_ARGS: --advertise-tags=tag:urlgen-worker
      TS_STATE_DIR: /var/lib/tailscale
      TS_USERSPACE: false
    volumes:
      - urlgen_tailscale_state:/var/lib/tailscale
    devices:
      - /dev/net/tun:/dev/net/tun
    cap_add:
      - net_admin
    restart: unless-stopped

  urlgen-worker:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
    command: npm run urlgen-worker
    network_mode: service:tailscale
    depends_on:
      - tailscale
    environment:
      DATABASE_URL: ${DATABASE_URL}
      URLGEN_WORKER_POLL_MS: 5000
      URLGEN_JOB_STALE_MS: 300000
      URLGEN_DEFAULT_SUBFOLDERS: ''
      URLGEN_SMB_HOST: win-urlgen
      URLGEN_SMB_SHARE: ERP_PRESUPUESTOS_2026
      URLGEN_SMB_USER: svc_urlgen_smb
      URLGEN_SMB_PASSWORD: ${URLGEN_SMB_PASSWORD}
      URLGEN_SMB_DOMAIN: ''
      URLGEN_SMB_PROTOCOL: SMB3
      URLGEN_SMB_TIMEOUT_MS: 15000
    restart: unless-stopped

volumes:
  urlgen_tailscale_state:
```

## Tailscale ACL idea

Allow only the worker tag to reach the Windows share over SMB `445`.

```json
{
  "tagOwners": {
    "tag:urlgen-worker": ["autogroup:admin"],
    "tag:urlgen-target": ["autogroup:admin"]
  },
  "acls": [
    {
      "action": "accept",
      "src": ["tag:urlgen-worker"],
      "dst": ["tag:urlgen-target:445"]
    }
  ]
}
```

## Application flow

1. User saves a URLGEN directory.
2. UI calls `POST /api/data/directorios/:id/request-folder`.
3. Backend creates or requeues a row in `urlgen_folder_jobs`.
4. Worker polls pending jobs.
5. Worker creates the folder over SMB.
6. Worker updates the job to `done` or `error`.
7. UI polls `GET /api/data/directorios/:id/folder-status`.

## Notes

- The worker is idempotent for existing folders.
- If the worker dies mid-job, stale `processing` jobs are requeued automatically.
- If you run the worker in a separate Coolify resource, make sure `DATABASE_URL` points to a PostgreSQL host reachable from that resource.
