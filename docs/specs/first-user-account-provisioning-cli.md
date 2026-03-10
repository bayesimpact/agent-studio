# Feature Specification: First User Account Provisioning CLI

## Overview

For demo onboarding, we need an internal CLI that provisions first users from email addresses by coordinating:

1. Auth0 user creation (or retrieval) in the shared Auth0 organization setup.
2. Auth0 password reset email sending (always).
3. Local DB bootstrap for one organization + one owner user membership.

This spec enforces a clean architecture where the CLI is a thin adapter and all business logic lives in domain services.

## Confirmed Decisions

- Local role for first user: `owner`
- Provisioning entrypoint: CLI script
- Duplicate behavior: skip
- Reset email timing: always send

## Goals and Non-Goals

### Goals

- Idempotent batch provisioning from a CSV file.
- Clear per-row status (`created`, `skipped_duplicate`, `failed`).
- Domain-driven service placement.
- CLI code calls services only.

### Non-Goals

- Public API endpoint for provisioning.
- Self-service signup changes in frontend.
- Auth0 invitation-link flow reuse for this feature.

## Domain Service Placement

### `auth` domain (Auth0 integration only)

Place Auth0-specific provisioning logic in:

- `apps/api/src/domains/auth/auth0-user-provisioning.service.ts`

Responsibilities:

- Acquire and cache Auth0 Management API token.
- Find/create Auth0 DB user from email.
- Ensure Auth0 user belongs to `AUTH0_ORGANIZATION_ID`.
- Trigger password reset email (`/dbconnections/change_password`).

The service should expose explicit methods, for example:

- `findOrCreateAuth0UserByEmail(...)`
- `ensureUserInDefaultOrganization(...)`
- `sendPasswordResetEmail(...)`

### `organizations` domain (local organization bootstrapping)

Place local DB bootstrap logic in:

- `apps/api/src/domains/organizations/organization-account-provisioning.service.ts`

Responsibilities:

- Create local organization.
- Upsert local user by Auth0 identity and email.
- Create `UserMembership` with role `owner`.
- Detect duplicate local provisioning and return skip outcome.
- Execute DB writes transactionally.

### `users` domain (optional helper only)

If needed, add a small helper in `UsersService` for explicit upsert-by-auth0/email behavior, but keep orchestration in the new organizations provisioning service.

## Orchestration Service

Create a small app-level orchestrator service in:

- `apps/api/src/domains/organizations/first-user-provisioning.service.ts`

Responsibilities:

- Coordinate the two domain services in order:
  1. Auth0 user ensure
  2. Local DB bootstrap
  3. Always send reset email
- Apply duplicate policy:
  - If already provisioned locally, skip local creation but still send reset email.
- Return structured result for reporting.

Rationale:

- Keeps the CLI thin.
- Keeps Auth0 concerns in `auth`.
- Keeps org/user/membership persistence in `organizations`.

## CLI Placement and Structure

### Right place for CLI code

Use:

- `apps/api/src/scripts/provision-first-users.ts`

Reasoning:

- Internal operational command for backend.
- Not part of HTTP controller layer.
- No existing scripts folder exists, so this creates a clear convention.

### CLI design rule

- The script must only:
  - parse args (`--file`, `--dry-run`)
  - parse CSV
  - bootstrap Nest app context
  - call orchestrator service per row
  - print summary/report
- The script must not contain business logic or direct repository/Auth0 calls.

### Package script wiring

Add in `apps/api/package.json`:

- `"provision:first-users": "ts-node -r tsconfig-paths/register src/scripts/provision-first-users.ts"`

Optional root shortcut:

- `"provision:first-users": "npm --workspace @caseai-connect/api run provision:first-users --"`

## Input and Output Contract

### CSV input

Columns:

- `email` (required)
- `organizationName` (required)
- `fullName` (optional)

### Row output

Per row:

- `status`: `created | skipped_duplicate | failed`
- `email`
- `organizationName`
- `message`

Final summary:

- total rows
- created count
- skipped count
- failed count

## Operational Flow

For each CSV row:

1. Normalize and validate input.
2. Call Auth0 provisioning service:
   - find/create user
   - ensure org membership
3. Call local organization provisioning service:
   - create org + owner membership unless duplicate
4. Call Auth0 reset email method (always).
5. Return row result.

## Error Handling

- Process rows independently; continue on row failure.
- Capture actionable failure reason (validation/Auth0/DB).
- If Auth0 succeeds but DB fails, mark row failed and log remediation info.
- Do not partially commit DB work outside transaction.

## Testing Requirements

### Service tests

- `auth0-user-provisioning.service.spec.ts`
  - find existing user
  - create user
  - ensure org membership
  - reset email API call
  - token caching/error paths

- `organization-account-provisioning.service.spec.ts`
  - create org + owner membership
  - duplicate skip
  - transaction rollback paths

- `first-user-provisioning.service.spec.ts`
  - happy path created
  - duplicate skip + reset email still sent
  - Auth0 failures and DB failures

### CLI tests

- basic parsing and integration smoke test with mocked orchestrator.

## Environment Variables

Required:

- `AUTH0_ISSUER_URL`
- `AUTH0_AUDIENCE`
- `AUTH0_ORGANIZATION_ID`
- `AUTH0_CLIENT_ID`
- `AUTH0_M2M_CLIENT_ID`
- `AUTH0_M2M_CLIENT_SECRET`
- `AUTH0_DB_CONNECTION_NAME`

## Implementation Checklist

1. Add auth provisioning service + tests in `auth` domain.
2. Add local account provisioning service + tests in `organizations` domain.
3. Add orchestrator service + tests in `organizations` domain.
4. Add CLI script in `apps/api/src/scripts/`.
5. Wire npm scripts.
6. Run `npm run biome:check`.
7. Run `npm run typecheck`.
8. Run `npm run test`.
