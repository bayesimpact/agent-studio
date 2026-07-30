# RBAC Permission Matrix

Source of truth in code:

- Roles and grants: `apps/api/src/domains/rbac/rbac.constants.ts`
- Global permission contract (exposed on `/me`): `packages/api-contracts/src/rbac/permissions.ts`

This document mirrors those files. Whenever a role or a role/permission grant changes, update the matching table here in the same PR (see `.cursor/rules/permission-matrix.mdc` and the `check-permission-matrix` Claude skill).

## Global roles

Global roles are stored as `user_membership` rows with `resource_type = 'global'`. `platform_staff` is seeded once by the `PlatformRolesAndPermissions` migration from `ORGANIZATION_CREATOR_EMAIL_DOMAIN`; `platform_superadmin` is assigned manually. The app itself never reads env vars for authorization.

| Permission | `platform_staff` | `platform_superadmin` |
|---|---|---|
| `backoffice.read` — access `/backoffice` routes | ✅ | ✅ |
| `trace.read` — see Langfuse trace links | ✅ | ✅ |
| `terms.update` — manage terms documents | ✅ | ✅ |
| `backoffice.organization.read` — see every organization in the backoffice | — | ✅ |
| `backoffice.project.read` — see every project in the backoffice | — | ✅ |
| `backoffice.agent.read` — see every agent in the backoffice | — | ✅ |
| `backoffice.user.read` — see every user in the backoffice | — | ✅ |
| `organization.create` — create organizations | — | ✅ |

## Organization roles

Scoped to one organization via `user_membership` (`resource_type = 'organization'`). Org roles deliberately do not grant `project.read`: project visibility is governed by project memberships only.

| Permission | `org_owner` | `org_admin` | `org_member` |
|---|---|---|---|
| `organization.read` | ✅ | ✅ | ✅ |
| `organization.update` | ✅ | ✅ | — |
| `organization.delete` | ✅ | — | — |
| `project.create` | ✅ | ✅ | — |
| `user.read` — see the organization's members | ✅ | ✅ | — |
| `backoffice.organization.read` — see the organization in the backoffice | ✅ | ✅ | — |
| `backoffice.project.read` — see the organization's projects in the backoffice | ✅ | ✅ | — |

## Project roles

Scoped to one project via `user_membership` (`resource_type = 'project'`).

| Permission | `project_owner` | `project_admin` | `project_member` |
|---|---|---|---|
| `project.read` | ✅ | ✅ | ✅ |
| `project.update` | ✅ | ✅ | — |
| `project.delete` | ✅ | ✅ | — |
| `agent.create` | ✅ | ✅ | — |
| `agent.read` | ✅ | ✅ | — |
| `user.read` — see the project's members | ✅ | ✅ | — |
| `backoffice.project.read` — see the project in the backoffice | ✅ | ✅ | — |
