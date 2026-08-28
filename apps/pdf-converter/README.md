# pdf-converter

Dedicated service that rasterizes PDFs into PNG page images for image-only LLMs
(Gemma, MedGemma). Rendering happens in WebAssembly (`go-pdfium` + `wazero`)
and is GCS-native: PDFs are fetched from GCS, rendered in isolation, and pages
are streamed directly to GCS. No local storage or subprocess management needed.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/render-document` | Body: JSON with source PDF path and output prefix. Returns `{ "pageCount": <number> }` with pages uploaded as `{outputPrefix}page-{n}.png`. |
| `POST` | `/page-count` | Body: JSON with the source PDF path (`sourceObject` only). Returns `{ "pageCount": <number> }` without rendering anything. |
| `GET` | `/healthz` | Liveness probe, no auth. |

`POST /render-document` requires a JSON body with:

- `sourceObject` (string, required) — relative GCS object path to the source PDF (e.g., `org/project/document.pdf`).
- `outputPrefix` (string, required) — relative GCS object path prefix where pages are saved; must end with `/` (e.g., `org/project/output/`).
- `maxPages` (integer, 1–100, required) — reject PDFs with more pages (HTTP 422).
- `maxPixelsPerPage` (integer, 1–16000000, required) — clamp each page's rendered bitmap height and width.

`POST /page-count` requires a JSON body with only `sourceObject` (same
constraints) and shares the error semantics below (no 422: it never renders).

All paths must be relative (no leading `/`) and free of `..` traversal.

Response on success: `{ "pageCount": <int> }` (HTTP 200).

Errors are:
- **400** — invalid PDF, malformed JSON body, invalid parameters, or invalid object paths.
- **404** — source PDF not found in GCS.
- **413** — source PDF exceeds `PDF_CONVERTER_MAX_PDF_BYTES`.
- **422** — PDF has more pages than `maxPages`.
- **500** — server error (e.g., failed to upload page to GCS).

## Authentication

The app itself has no auth layer. In production the Cloud Run service runs
with invoker IAM enabled: only identities holding `roles/run.invoker` (the
platform's api service account) can reach the container, and callers must
send a Google ID token minted for the service URL — the main API does this
when `PDF_CONVERTER_AUTH=google-iam` is set (Terraform sets it). Locally the
service is only bound on the developer's machine.

## Environment variables

- `GCS_STORAGE_BUCKET_NAME` (required) — GCS bucket for source PDFs and rendered pages.
- `PORT` (default `3002`) — listen port.
- `PDF_CONVERTER_MAX_PDF_BYTES` (default `52428800`, 50MB) — source PDF size limit.

## Local development

```bash
# Start the converter (requires GOOGLE_APPLICATION_CREDENTIALS pointing to a service account)
PORT=3002 \
  GCS_STORAGE_BUCKET_NAME=<dev-bucket> \
  GOOGLE_APPLICATION_CREDENTIALS=<path-to-service-account-json> \
  go run .

# Smoke-test with a source object and a dev bucket:
curl -sS -X POST -H "Content-Type: application/json" \
  -d '{"sourceObject":"test.pdf","outputPrefix":"output/","maxPages":20,"maxPixelsPerPage":4000000}' \
  "http://localhost:3002/render-document"
```

To make the main API use it locally, set in `apps/api/.env`:

```
PDF_CONVERTER_URL=http://localhost:3002
```

(Leave `PDF_CONVERTER_AUTH` unset locally — no auth header is sent.)

## Tests

```bash
go test ./...
go vet ./...
```

## Deployment

This service is intentionally **not** part of the automatic deploy pipeline
(it changes rarely; the platform deploy does not rebuild it).

Deployment is a manual **"Deploy PDF Converter"** GitHub action in the infra
repo (**to be created** — workflow_dispatch: pick the app-repo ref and the GCP
project), run once per project.

Equivalent local command, once available, if you have the GCP credentials:

```bash
cd infra/platform
make deploy-pdf-converter REGION=eu PROJECT=connect version=<app-repo-short-sha>
```

(`deploy-pdf-converter` is **not yet a Makefile target** — it is planned as
part of the same infra-repo follow-up as the GitHub action above.)
