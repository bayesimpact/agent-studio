# ADR 0007: Keycloak as Local/OSS Identity Provider, Auth0 in Production

* **Status**: Proposed
* **Date**: 2026-04-16
* **Deciders**: Jérémie

---

## 1. Context and Problem Statement

The application currently uses Auth0 as its sole identity provider, in both development and production. Following ADR 0006 (split-repo open source SaaS architecture), the public app repo must be runnable by any contributor without access to proprietary infrastructure or secrets.

Auth0 is a hosted SaaS with no local runtime. Every contributor would need their own Auth0 tenant, would have to configure a SPA client, an M2M client, and an Organization, and would have to populate seven environment variables before the app would start. This is incompatible with an open source project — cloning the repo and running `docker compose up` must produce a working login flow out of the box.

We need a local identity provider that:

1. Requires no external accounts or secrets.
2. Speaks the same protocol as Auth0 (OIDC) so the backend JWT validation path is identical in dev and prod.
3. Exposes a real login UI and an admin UI, so contributors can actually sign in, create users, and exercise the invitation flow.
4. Supports the concepts the app already depends on — organizations, invitations, Management API — closely enough that production-specific code stays thin.

Auth0 stays the production IdP. This ADR is about the local/OSS story, not a full provider migration.

## 2. Decision

We will adopt **Keycloak** as the identity provider for local development and for the open source distribution, while keeping Auth0 in production. The application will be restructured so the IdP is pluggable behind OIDC-standard interfaces.

### Local / OSS runtime

* Keycloak runs in `docker-compose.yaml` as a first-class service alongside Postgres.
* Uses `start-dev` mode with a pre-imported realm JSON (`infra/keycloak/realm-caseai.json`) checked into the public repo.
* The imported realm ships with: one realm, one SPA client (public, PKCE), one confidential M2M client with `realm-admin` service account, one organization matching Auth0's single-org model (ADR 0001), and a seed admin user.
* Contributors run `docker compose up` and reach a working login page at `http://localhost:8080/realms/caseai`. No external signup required.

### Code changes (abstraction boundary)

The backend already has most of what it needs — JWT validation goes through Passport + JWKS, which is OIDC-standard and works unchanged against any compliant IdP. The Auth0-specific surface is narrow:

* `Auth0UserInfoService` → rename to `OidcUserInfoService`. The `/userinfo` endpoint is OIDC-standard; only the issuer URL changes.
* `Auth0UserProvisioningService` and `Auth0InvitationSenderService` → extract a provider-agnostic interface (`IdentityProvisioningService`, `InvitationSenderService`). Keep the Auth0 implementation, add a Keycloak implementation. Select at runtime via `IDENTITY_PROVIDER=auth0|keycloak`.
* `JwtStrategy` reads `OIDC_ISSUER_URL` and `OIDC_AUDIENCE` (already effectively what it does, just renamed from `AUTH0_*`). JWKS discovery is automatic.
* Frontend (`@auth0/auth0-react`) is replaced by a standard OIDC client (`oidc-client-ts` + `react-oidc-context`) that works against both providers. The existing `auth0Client.ts` / `auth0.config.ts` become `oidcClient.ts` / `oidc.config.ts`.

### Organizations

The Auth0 Organizations feature (ADR 0001) is a production concern. A review of the code confirms it has no cross-cutting effect on the app:

* The backend JWT strategy (`jwt.strategy.ts`) validates `audience` and `issuer` only — it never reads `org_id` from the token payload. Authorization is driven by our own `UserMembership` table (ADR 0004), not by an IdP-side org claim.
* `AUTH0_ORGANIZATION_ID` is used only in two places, both Auth0-specific: building Management API URLs in `auth0-user-provisioning.service.ts` / `auth0-invitation-sender.service.ts`, and passing the `organization` hint to Auth0's hosted login page from the frontend.

The Keycloak realm therefore will **not** use Keycloak's Organizations feature and will **not** inject any `org_id` claim. The concept simply does not exist on the Keycloak side. Production keeps calling Auth0's org-scoped endpoints via the Auth0 implementation of `InvitationSenderService`; the Keycloak implementation uses realm-level user creation and invitation endpoints, which is all that's needed for local/OSS use.

The frontend removes the `organization` hint from its login call when `VITE_IDENTITY_PROVIDER=keycloak`.

### Environment variables

Provider-agnostic names replace the `AUTH0_*` set:

```
IDENTITY_PROVIDER=keycloak       # or auth0
OIDC_ISSUER_URL=http://localhost:8080/realms/caseai
OIDC_AUDIENCE=caseai-api
OIDC_ORGANIZATION_ID=...
OIDC_M2M_CLIENT_ID=...
OIDC_M2M_CLIENT_SECRET=...
```

Auth0-specific values (e.g., `AUTH0_DB_CONNECTION_NAME`) remain but are only read when `IDENTITY_PROVIDER=auth0`.

## 3. Alternatives Considered

* **Dex**: Lightweight OIDC provider (~20 MB, instant startup). Rejected as the primary dev IdP because it has no login UI beyond a minimal stub and no admin UI — contributors can't create users interactively or simulate invitations. Good fit for automated tests, poor fit for "click around the app as a new contributor."
* **oauth2-mock-server (or similar npm mocks)**: Embeds in the test process, zero infra. Rejected as the dev IdP for the same reason — it's a stub, not a real flow. Already effectively what `setupUserGuardForTesting` provides at the guard level, which is sufficient for tests; we don't need to also mock the transport.
* **Ory Hydra + Kratos**: OIDC-compliant and production-grade, but the split between Hydra (OAuth2) and Kratos (identity) doubles the moving parts for a dev-only dependency. Not worth the complexity when Keycloak is a single image.
* **Self-rolled JWT issuer**: Minimal code, but diverges from the production code path (no real OIDC discovery, no refresh token flow, no userinfo endpoint). Every divergence is a class of bug that only shows up in prod.
* **Stay on Auth0 only, document a free-tier setup in the README**: Rejected because it forces every contributor to create an Auth0 account and configure a tenant before the app will run — directly contradicts the OSS goal from ADR 0006.
* **Ship only Keycloak in the public repo, move the Auth0 adapter to the private infra repo**: A stricter reading of ADR 0006 (anything prod-specific lives in the private repo). The public repo would expose `IdentityProvisioningService` / `InvitationSenderService` interfaces with a Keycloak implementation; the private repo would provide the Auth0 implementations as a mounted NestJS module at build time. Cleaner boundary, zero Auth0 SDK surface in OSS code, and matches how mature OSS projects (Authelia, Ory, Hasura) handle managed-service integrations. Deferred for now — starting with both implementations in the public repo is simpler to land, and the interfaces introduced in this ADR are the exact seam that would make the split a mechanical follow-up if the Auth0-in-public surface becomes a maintenance burden.

## 4. Consequences

* **Positive Impacts**:
    * **Zero-config onboarding**: `docker compose up` gives contributors a working login flow with no external accounts or secrets.
    * **Production parity**: Both providers speak OIDC, so the JWT validation code path is identical in dev and prod. The divergence is confined to the Management API adapter.
    * **Clean abstraction**: Extracting `IdentityProvisioningService` and `InvitationSenderService` interfaces means future IdP swaps (Authelia, Azure AD, Okta) are a single-implementation change.
    * **Realistic UX testing**: Contributors can exercise the real login page, password reset, and invitation flows — not just stubs.
    * **OSS-friendly**: No proprietary SaaS dependency in the public repo.
* **Negative Impacts / Risks**:
    * **Heavier docker-compose**: Keycloak is ~500 MB image, 10–20 s cold start, 300–500 MB idle RAM. Noticeable but acceptable for a dev-only dependency; already less than the JVM services some contributors run.
    * **Two Management API implementations to maintain**: Any new provisioning/invitation feature must be implemented against both Auth0 and Keycloak Admin REST APIs. Mitigated by the interface boundary and by the fact that most changes are additive, not structural.
    * **Realm JSON drift**: The committed realm export must stay in sync with what the code expects (client IDs, organization name, scopes). Mitigated by keeping the realm minimal and documenting required fields.
    * **No local equivalent of Auth0 Organizations**: Contributors can't exercise Auth0's org-scoped login UX or branded org pages locally — they'd need an Auth0 tenant for that. Acceptable since the backend does not depend on the org claim, and authorization is driven by the `UserMembership` table.
    * **Test mocks unaffected**: `setupUserGuardForTesting` already bypasses real IdP calls, so e2e tests don't depend on either provider at runtime — no change needed there.

## 5. Implementation Notes

Rough order of work (each step independently shippable):

1. Rename `AUTH0_*` env vars to `OIDC_*` in the backend, keep Auth0 as the only implementation. No behavior change.
2. Extract `IdentityProvisioningService` and `InvitationSenderService` interfaces; move the current code into `auth0-*.provider.ts` implementations. Wire selection via `IDENTITY_PROVIDER` env var (defaults to `auth0`).
3. Add Keycloak to `docker-compose.yaml` with a committed realm export.
4. Implement `keycloak-user-provisioning.service.ts` and `keycloak-invitation-sender.service.ts` against the Keycloak Admin REST API.
5. Swap the frontend Auth0 SDK for `oidc-client-ts` / `react-oidc-context`; drive config from a single `VITE_OIDC_*` env set.
6. Update `apps/api/.env-example` and `apps/web/.env-example` with both provider profiles documented.
7. Document the local flow in `docs/specs/` (replacing or complementing `auth0-invitation-sending.md` with a provider-agnostic version).

The production deployment keeps setting `IDENTITY_PROVIDER=auth0` in the private infra repo — no prod-side change on day one.