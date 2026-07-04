# CLAUDE.md

Guidance for working in the Photopia repo.

## What it is

Photopia is a self-contained photo-hosting platform: a **React SPA** (Vite, Tailwind,
headless-ui, framer-motion) served by a **Python FastAPI** backend that also exposes the
API and resizes images with Pillow. Everything ships as a **single Docker image**
(`grekodocker/photopia-bundle`) — frontend built and baked into the backend image.

No external database or object store: metadata lives in YAML files and galleries are just
directories on the filesystem (mounted at `/storage` in the cluster).

## Layout

- `backend/` — FastAPI app. Entry `main.py`; routes under `app/routers/` (mounted at
  `/api/v1`); config in `app/config.py`. Serves the SPA for all non-API routes.
- `frontend/` — Vite/React SPA. Build output is `frontend/dist`.
- `helm-chart/` — Helm chart for cluster deploy.
- `cypress/` — e2e tests (baseUrl `http://127.0.0.1:5173`).
- `Dockerfile` — multi-stage: builds the frontend (node:24), then the Python image
  (python:3.13-slim) with `REACT_BUILD_DIR=/frontend/dist`. Serves on port `8000`.

## Config (env vars)

- `apikey` — single API key; required on POST requests (see `app/dependencies.py`).
- `GALLERIES_ROOT_DIR` — gallery storage root (default `galleries`; `/storage` in-cluster).
- `REACT_BUILD_DIR` — SPA build dir (default `frontend/dist`; `/frontend/dist` in the image).

## Workflow — use the Taskfile

This repo uses **Taskfile.yml** (go-task), not a Makefile. `task` with no args lists everything.

Dev:
- `task dev` — backend (uvicorn :8000) + Vite dev server (:5173) together.
- `task backend:run` / `task frontend:dev` — run one side.
- `task frontend:install` / `task backend:install` — install deps.
- `task test` — Cypress e2e headless (`task test:open` for the runner).

Ship:
- `task ship` — build+push the amd64 image (tagged with the short git hash and `latest`),
  then `helm upgrade --install`. This is the one-shot deploy.
- `task docker:release` / `task docker:build` — image only (push / local load).
- `task deploy` — helm only, pinned to the current git hash.
- `task docker:k8s-secret` — (re)create the `dockerhub-creds` pull secret + namespace.
- `task lint` / `task template` / `task status` / `task logs` / `task rollback`.

**Versioning is commit-based**: image tag = `git rev-parse --short HEAD`. `deploy` always
pins `image.tag` to that hash — no `:latest` in the cluster.

## Deployment target

- Cluster context `default-germany`, namespace `photopia`, release `photopia`.
- Public URL: **https://photo.alexgr.space**.
- Ingress: Traefik (`ingressClassName: traefik`) with a http→https redirect Middleware,
  TLS via cert-manager (`cluster-issuer: letsencrypt-prod`, secret `photopia-tls`).
- Image pulled with the `dockerhub-creds` secret; galleries persisted on a PVC (default
  StorageClass) mounted at `/storage`.

Building for the cluster requires amd64: the Docker tasks use `docker buildx` with the
`multiarch-builder` builder and `--platform linux/amd64`. OrbStack must be running.

The chart mirrors the pattern used by the other apps in this cluster (see
`../consens_family` for the reference Taskfile + helm structure).
