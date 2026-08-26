# pdf-renderer

> **Deprecated**: replaced by `apps/pdf-converter`; remove once the converter is live in all environments.

Dedicated API that rasterizes PDFs into PNG page images for image-only LLMs
(Gemma, MedGemma). Rendering is RAM-heavy (up to ~1GB per document), so it runs
here — isolated and independently scalable — instead of inside the main API or
the workers.

Each request spawns a short-lived subprocess (`pdf-pages-to-png.script.mjs`,
pdfjs + `@napi-rs/canvas`) with a hard timeout and heap cap, so a malicious or
degenerate PDF can only take down that child process.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/render-pages` | Body: raw `application/pdf` bytes. Returns `{ "pages": ["<base64 png>", ...] }`, one entry per page. |
| `GET` | `/healthz` | Liveness probe, no auth. |

`POST /render-pages` accepts optional query parameters (safe defaults apply):

- `maxPages` (default 20) — reject PDFs with more pages (HTTP 422).
- `maxPixelsPerPage` (default 4000000) — clamp each page's rendered bitmap.
- `scale` (default 2) — pdf.js render scale (1 = 72dpi).

Errors are `{ "message": "..." }` with 400 (invalid pdf/body/params), 413
(body too large) or 422 (page limit exceeded).

## Authentication

The app itself has no auth layer. In production the Cloud Run service runs
with invoker IAM enabled: only identities holding `roles/run.invoker` (the
platform's api service account) can reach the container, and callers must
send a Google ID token minted for the service URL — the main API does this
when `PDF_RENDERER_AUTH=google-iam` is set (Terraform sets it). Locally the
service is only bound on the developer's machine.

## Environment variables

- `PORT` (default `3001`)
- `PDF_RENDERER_MAX_PDF_BYTES` (default `52428800`, 50MB) — request body limit.
  Note: behind Cloud Run the effective cap is 32MiB (HTTP/1 request limit);
  the main API pre-checks this and fails with a clear message. Responses are
  streamed chunked, which Cloud Run does not cap.

## Local development

```bash
npx turbo dev --filter=@caseai-connect/pdf-renderer     # starts on http://localhost:3001

# Smoke-test with any pdf:
curl -sS -X POST -H "Content-Type: application/pdf" \
  --data-binary @some-document.pdf \
  "http://localhost:3001/render-pages" | head -c 200
```

To make the main API use it locally, set in `apps/api/.env`:

```
PDF_RENDERER_URL=http://localhost:3001
```

(Leave `PDF_RENDERER_AUTH` unset locally — no auth header is sent.)

## Tests

```bash
npx turbo test --filter=@caseai-connect/pdf-renderer
```

## Deployment

This service is intentionally **not** part of the automatic deploy pipeline
(it changes rarely; the platform deploy does not rebuild it). When this app
changes, trigger the **"Deploy PDF Renderer"** GitHub action in the infra
repo (workflow_dispatch: pick the app-repo ref and the GCP project), once per
project. Equivalent local command, if you have the GCP credentials:

```bash
cd infra/platform
make deploy-pdf-renderer REGION=eu PROJECT=connect version=<app-repo-short-sha>
```
