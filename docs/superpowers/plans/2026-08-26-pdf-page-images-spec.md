# Spec: GCS-native PDF page images for image-only models (Gemma / MedGemma)

## Problem

Gemma and MedGemma only accept images, so PDFs must be sent as one PNG per page.
Today the API is a byte pump: it downloads the whole PDF from GCS (≤32MB in heap),
POSTs the bytes to `apps/pdf-renderer`, parses a giant JSON of base64 PNGs, decodes
every page to `Uint8Array`, and the AI SDK re-encodes them all as base64 `data:` URLs
for the model. Peak transient allocations reach hundreds of MB per conversion, which
OOM-killed the production API Cloud Run instance (503s on every request, including
CORS preflights). Nothing is cached: retries re-render the same PDF.

## Solution

Make the API a **URL broker**. Bytes flow GCS → converter → GCS; the model fetches
page images itself via stable redirect URLs.

1. **New Go service `apps/pdf-converter`** (replaces `apps/pdf-renderer` long-term).
   Uses `klippa-app/go-pdfium` (MIT) with the **WebAssembly backend** (wazero):
   `CGO_ENABLED=0`, PDFium embedded, sandboxed against malicious PDFs (no host FS
   mounted), a PDF crash cannot kill the process. Contract is URL-in/URL-out:
   - `POST /render-document` JSON `{sourceObject, outputPrefix, maxPages, maxPixelsPerPage}`
     → downloads the PDF from GCS with its own service account, renders each page
     (scale 2 ≈ 144dpi, aspect-fit capped at `maxPixelsPerPage`), uploads
     `{outputPrefix}page-{n}.png` to GCS, returns `{"pageCount": n}`.
   - Errors: `{"message"}` with 400 (bad body/pdf), 404 (source object missing),
     413 (source too large), 422 (page limit exceeded).
   - No in-app auth: Cloud Run invoker IAM, same pattern as pdf-renderer
     (`PDF_CONVERTER_AUTH=google-iam` on the API mints a Google ID token).

2. **Eager rendering + Postgres cache.** New nullable `pdf_page_count` integer column
   on `agent_message_attachment_document` (chat attachments) and `document`
   (extraction runs). At LLM-request build time, when the model requires PDFs as
   images: if `pdfPageCount` is null, call the converter once and persist the count;
   otherwise skip conversion entirely. Rendering never happens inside the redirect
   endpoint (vLLM's image fetch timeout is 5s).

3. **Stable 302 redirect endpoints** (same pattern as `downloadResourceFile`:
   public, unguessable-UUID capability URLs, org/project prefix defense, fresh
   signed URL per hit):
   - `GET organizations/:organizationId/projects/:projectId/agent-attachment-documents/:attachmentDocumentId/pdf-pages/:pageNumber`
   - `GET organizations/:organizationId/projects/:projectId/documents/:documentId/pdf-pages/:pageNumber`
   Both 404 unless the row exists in that org/project, is a PDF, has been rendered,
   and `1 ≤ pageNumber ≤ pdfPageCount`. On success: 302 to a fresh **V4** signed GCS
   URL for `{derived prefix}page-{n}.png`.

4. **URL passthrough to the model.** Message building pushes
   `{type: "image", image: new URL(stableUrl)}` parts instead of PDF file parts.
   - Gemma uses `@ai-sdk/openai` chat models whose `supportedUrls` already allows
     `image/*` https URLs → the URL reaches vLLM verbatim as `image_url`, vLLM
     fetches it server-side and follows the 302 (verified behavior, no auth headers
     possible — hence the public capability endpoint).
   - MedGemma's `CustomMedGemmaLanguageModel` gets its placeholder `supportedUrls`
     broadened to `{"image/*": [/^https?:\/\/.*$/]}` and a URL branch in `toInput`
     emitting `image_url: {url}`.
   The API never holds PDF or image bytes.

5. **Byte pump removed.** `convertPdfPartsToImageParts` and the fetch-to-pdf-renderer
   code are deleted; `modelRequiresPdfAsImages` moves to `external/llm/agent-provider.ts`.
   `getTemporaryUrl` switches to V4 signing (uploads already use V4).

## Derived object layout

Source `{org}/{proj}/{uuid}.pdf` → pages `{org}/{proj}/derived/{uuid}/page-{n}.png`.
The derived path stays under the org/project prefix so the redirect endpoints'
defense-in-depth check works unchanged. Page numbers are 1-based. Limits stay
`maxPages=20`, `maxPixelsPerPage=4_000_000`. The 32MiB HTTP cap disappears
(no bytes over HTTP); the converter enforces a 50MB source-object cap.

## Environment variables

| Var | Where | Meaning |
| --- | --- | --- |
| `PDF_CONVERTER_URL` | api, workers | Base URL of the Go converter |
| `PDF_CONVERTER_AUTH` | api, workers | `google-iam` in prod (ID-token auth), unset locally |
| `API_PUBLIC_BASE_URL` | api, workers | Public base URL of the API, used to build stable page URLs |
| `GCS_STORAGE_BUCKET_NAME` | pdf-converter | Bucket to read PDFs from / write pages to |
| `PDF_CONVERTER_MAX_PDF_BYTES` | pdf-converter | Source-object size cap (default 50MB) |
| `PORT` | pdf-converter | default 3002 |

## Local development

The converter is GCS-native, so PDF→image for Gemma/MedGemma requires a real GCS
bucket even locally. When `GCS_STORAGE_BUCKET_NAME` is unset on the API, the
Gemma/MedGemma PDF path throws a clear error instead of silently degrading. All
other flows (images, other models, the hard-coded demo-URL fallback) are unchanged.

## Failure semantics

Converter errors surface as thrown `Error`s with the converter's `message` (shown in
the chat error bubble). PDFs above 20 pages are rejected (422) like today, not
truncated. `ensureRenderedPages` uses a 120s request timeout. Concurrent renders of
the same document are idempotent (same output objects, benign overwrite).

## Out of scope / follow-ups (infra repo)

- Terraform: new Cloud Run service `pdf-converter` (min instances 0, 1–2GB RAM),
  SA with `roles/storage.objectAdmin` on the bucket, `roles/run.invoker` for the
  API/workers SA, plus the three new API env vars. `API_PUBLIC_BASE_URL` must be the
  URL the vLLM containers can reach (the public Cloud Run URL of the API).
- "Deploy PDF Converter" GitHub action in the infra repo (clone of Deploy PDF Renderer).
- Verify once in prod that the MedGemma/Gemma vLLM endpoints have public egress:
  send a chat completion with `image_url` pointing at any public PNG.
- Decommission `apps/pdf-renderer` (separate PR once the converter is live:
  remove app, Makefile targets, trivy scan entry, `PDF_RENDERER_*` envs).
