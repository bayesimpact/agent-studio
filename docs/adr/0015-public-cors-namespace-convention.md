# ADR 0015: Public CORS Namespace Convention over Per-Controller Declaration

* **Status**: Accepted
* **Date**: 2026-08-24
* **Deciders**: engineering (jdoucy)
* **Scope**: API CORS policy selection — `apps/api/src/config/cors.ts`, `PUBLIC_PATH_PREFIX` in api-contracts

---

## Decision

The API runs two CORS policies, selected per request by a path prefix (see #366): paths under the public namespace reflect the request origin (embed widget, secured by `EmbedTokenGuard`), every other path pins origins to `FRONTEND_URL`.

The public namespace is a **convention**: every open-CORS endpoint lives under the `PUBLIC_PATH_PREFIX` constant exported by `api-contracts`. Route files build their paths from that constant, and the CORS delegate matches on it. One source of truth, no duplicated string between route definitions and bootstrap.

## Rejected alternative: per-controller CORS declaration

A decorator such as `@PublicCors()` on the controller, collected at bootstrap via `DiscoveryService`/`MetadataScanner`, was considered and rejected:

- CORS must answer the `OPTIONS` preflight **before** Nest routing. No guard or interceptor sees the preflight, so the decision is always taken on the raw path by a middleware. A decorator cannot change that; it can only feed the same path list through reflection machinery.
- The scan would produce exactly what the convention already provides: a list of path prefixes consulted by the delegate. For two controllers, the machinery does not pay for itself.

Revisit if an endpoint ever needs open CORS **outside** the public namespace. That change breaks the convention and justifies the per-controller declaration in its own ADR.

## Consequences

- A new public endpoint must define its route under `PUBLIC_PATH_PREFIX` in api-contracts. Nothing else to register: CORS follows the path.
- Renaming the public namespace is a one-constant change, but it is a breaking change for deployed embed snippets — do not rename it casually.
- `main.ts` knows no path strings; it only wires `buildCorsOptionsDelegate(frontendUrls)`.
