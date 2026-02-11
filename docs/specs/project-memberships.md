# Feature Specification: Project Memberships (External User Invitations)

## Overview

Organization owners and administrators need the ability to invite external users to access the conversational agents of a specific project. This feature introduces a **Project Membership** system that ties a user to a project via an invitation workflow.

---

## Domain Decision

> **Recommendation**: Place the new controllers, services, and entity within the existing **`projects`** domain.
>
> **Rationale**: Project memberships are tightly scoped to projects — they don't exist independently. The existing `projects` domain already owns CRUD for projects, and project memberships are a natural extension of that ownership. Splitting into a separate domain would introduce cross-module coupling without a clear cohesion benefit. If the feature grows significantly (e.g., invitation emails, invitation workflows, etc.), it can be extracted later.

---

## 1. Database / Entity Layer (API)

### 1.1 New Entity: `ProjectMembership`

**Table name**: `project_membership`

| Column             | Type        | Constraints                                   | Description                                   |
|--------------------|-------------|-----------------------------------------------|-----------------------------------------------|
| `id`               | `uuid`      | PK, auto-generated                            | Primary key                                   |
| `project_id`       | `uuid`      | FK → `project.id`, NOT NULL                   | The project this membership belongs to        |
| `user_id`          | `uuid`      | FK → `user.id`, NOT NULL                      | The invited user                              |
| `invitation_token` | `varchar`   | UNIQUE, NOT NULL                              | Unique token for the invitation link          |
| `status`           | `varchar`   | NOT NULL, default `'sent'`                    | Invitation status: `'sent'` or `'accepted'`   |
| `created_at`       | `timestamp` | auto-generated                                | Creation timestamp                            |
| `updated_at`       | `timestamp` | auto-generated                                | Last update timestamp                         |

**Constraints**:
- `UNIQUE(project_id, user_id)` — A user can only have one membership per project.

**TypeORM Entity**: `apps/api/src/domains/projects/project-membership.entity.ts`

```typescript
@Entity("project_membership")
@Unique(["projectId", "userId"])
export class ProjectMembership {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ type: "uuid", name: "project_id" })
  projectId!: string

  @Column({ type: "uuid", name: "user_id" })
  userId!: string

  @Column({ type: "varchar", name: "invitation_token", unique: true })
  invitationToken!: string

  @Column({ type: "varchar", default: "sent" })
  status!: ProjectMembershipStatus

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date

  // Relations
  @ManyToOne(() => Project)
  @JoinColumn({ name: "project_id" })
  project!: Project

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User
}

export type ProjectMembershipStatus = "sent" | "accepted"
```

**Notes**:
- The `invitation_token` is a UUID generated server-side at creation time. It can later be used for invitation links (e.g., email-based acceptance).
- No roles on project memberships for now — presence in the table implies access.

### 1.2 Relationships

- **`Project`** entity gets a new `@OneToMany` → `ProjectMembership[]` relation (`projectMemberships`).
- **`User`** entity gets a new `@OneToMany` → `ProjectMembership[]` relation (`projectMemberships`).

### 1.3 Migration

- A TypeORM migration will be **generated** (not manually created) via `npm run migration:generate` after the entity is created.

---

## 2. API Contracts (`packages/api-contracts`)

### 2.1 DTOs

**File**: `packages/api-contracts/src/projects/projects.dto.ts` (append to existing file)

```typescript
// --- Project Membership DTOs ---

export type ProjectMembershipDto = {
  id: string
  projectId: string
  userId: string
  userName: string | null
  userEmail: string
  status: "sent" | "accepted"
  createdAt: TimeType
}

export type ListProjectMembershipsResponseDto = {
  memberships: ProjectMembershipDto[]
}

export type InviteProjectMembersRequestDto = {
  emails: string[]
}

export type InviteProjectMembersResponseDto = {
  memberships: ProjectMembershipDto[]
}

export type RemoveProjectMembershipResponseDto = {
  success: true
}
```

### 2.2 Routes

**File**: `packages/api-contracts/src/projects/projects.routes.ts` (append to existing `ProjectsRoutes`)

| Route Name                    | Method   | Path                                                                     | Request DTO                          | Response DTO                            |
|-------------------------------|----------|--------------------------------------------------------------------------|--------------------------------------|-----------------------------------------|
| `listProjectMemberships`      | `GET`    | `organizations/:organizationId/projects/:projectId/memberships`          | —                                    | `ListProjectMembershipsResponseDto`     |
| `inviteProjectMembers`        | `POST`   | `organizations/:organizationId/projects/:projectId/memberships/invite`   | `InviteProjectMembersRequestDto`     | `InviteProjectMembersResponseDto`       |
| `removeProjectMembership`     | `DELETE` | `organizations/:organizationId/projects/:projectId/memberships/:membershipId` | —                                | `RemoveProjectMembershipResponseDto`    |

**Route definitions** (added to the existing `ProjectsRoutes` object):

```typescript
listProjectMemberships: defineRoute<ResponseData<ListProjectMembershipsResponseDto>>({
  method: "get",
  path: "organizations/:organizationId/projects/:projectId/memberships",
}),
inviteProjectMembers: defineRoute<
  ResponseData<InviteProjectMembersResponseDto>,
  RequestPayload<InviteProjectMembersRequestDto>
>({
  method: "post",
  path: "organizations/:organizationId/projects/:projectId/memberships/invite",
}),
removeProjectMembership: defineRoute<ResponseData<RemoveProjectMembershipResponseDto>>({
  method: "delete",
  path: "organizations/:organizationId/projects/:projectId/memberships/:membershipId",
}),
```

### 2.3 Exports

The new DTOs and routes are exported from `packages/api-contracts/src/index.ts` (already covered by the existing `export type * from "./projects/projects.dto"` and `export { ProjectsRoutes }` lines — no changes needed there since we append to existing files).

---

## 3. API Service Layer

### 3.1 Service: `ProjectMembershipsService`

**File**: `apps/api/src/domains/projects/project-memberships.service.ts` (**new file** — dedicated service)

Methods on `ProjectMembershipsService`:

| Method                      | Description                                                                                          |
|-----------------------------|------------------------------------------------------------------------------------------------------|
| `listProjectMemberships(projectId: string)` | Returns all project memberships for a project, with user relations eagerly loaded.   |
| `inviteProjectMembers(projectId: string, emails: string[])` | For each email: find or create a user, create a `ProjectMembership` with status `sent` and a generated `invitationToken`. Skips duplicates (user already a member). Returns the created memberships. |
| `removeProjectMembership(membershipId: string, projectId: string)` | Removes a project membership. Validates it belongs to the given project.           |

**Invitation logic detail** (`inviteProjectMembers`):
1. For each email in the list:
   - Look up the `User` by email.
   - If no user exists, create one with a placeholder `auth0Id` set to `"00000000-0000-0000-0000-000000000000"` and the provided email. The user record acts as a pre-provisioned entry. This placeholder will be updated when the user signs up via Auth0.
   - Check if a `ProjectMembership` already exists for `(projectId, userId)` — if so, skip.
   - Create a `ProjectMembership` with `status: "sent"` and `invitationToken: randomUUID()`.
2. Return all created memberships (with user relations loaded).

> **Open question for later**: Should we send invitation emails? For now, the invitation is simply a database entry. Email delivery can be added as a follow-up feature.

---

## 4. API Controller Layer

### 4.1 Controller: `ProjectMembershipsController`

**File**: `apps/api/src/domains/projects/project-memberships.controller.ts` (**new file** — dedicated controller)

Endpoints:

| Method             | Decorator               | Policy Check                        | Request Type                        | Notes                                                    |
|--------------------|-------------------------|-------------------------------------|-------------------------------------|----------------------------------------------------------|
| `listProjectMemberships`  | `@Get(...)` | `canListProjectMemberships()`       | `EndpointRequestWithProject`        | Returns memberships for the project                      |
| `inviteProjectMembers`    | `@Post(...)` | `canInviteProjectMembers()`        | `EndpointRequestWithProject` + Body | Accepts `{ payload: { emails: string[] } }`              |
| `removeProjectMembership` | `@Delete(...)` | `canRemoveProjectMembership()`  | `EndpointRequestWithProject`        | `:membershipId` from path params                         |

### 4.2 Guards

The existing guard chain applies: `JwtAuthGuard → UserGuard → OrganizationGuard → ProjectsGuard`.

The `ProjectsGuard` already resolves the project from `:projectId` and attaches it to the request, so no new guard is needed.

### 4.3 Policy

**File**: `apps/api/src/domains/projects/project.policy.ts` (extend existing policy)

New policy methods:

```typescript
canListProjectMemberships(): boolean {
  return this.isAdminOrOwner()
}

canInviteProjectMembers(): boolean {
  return this.doesResourceBelongToOrganization() && this.isAdminOrOwner()
}

canRemoveProjectMembership(): boolean {
  return this.doesResourceBelongToOrganization() && this.isAdminOrOwner()
}
```

**Authorization rules**:
- Only **owners** and **admins** of the organization can list, invite, or remove project memberships.
- Regular **members** of the organization cannot perform these actions.
- The sidebar icon in the webapp will be **hidden** for non-admin/non-owner users.

---

## 5. API Module

**File**: `apps/api/src/domains/projects/projects.module.ts`

- Add `ProjectMembership` and `User` to `TypeOrmModule.forFeature([...])`.
- Register `ProjectMembershipsController` in `controllers`.
- Register `ProjectMembershipsService` in `providers`.

---

## 6. Tests (API)

### 6.1 E2E Tests

**Directory**: `apps/api/src/domains/projects/e2e-tests/`

#### `auth.spec.ts` (extend existing)

Add auth test cases for the three new routes:

- `ProjectsRoutes.listProjectMemberships`:
  - Requires authentication token
  - Requires valid organization ID
  - Requires user to be a member of the organization
  - Requires existing project ID
  - Denies `member` role → `403`
  - Allows `admin` role → `200`
  - Allows `owner` role → `200`

- `ProjectsRoutes.inviteProjectMembers`:
  - Same auth checks as above
  - Denies `member` role → `403`
  - Allows `admin` and `owner` → `200`

- `ProjectsRoutes.removeProjectMembership`:
  - Same auth checks
  - Denies `member` role → `403`
  - Requires existing membership ID → `404` if not found
  - Allows `admin` and `owner` → `200`

#### New: `list-project-memberships.spec.ts`

- Returns empty list when no memberships exist
- Returns memberships with user name and email
- Only returns memberships for the specified project (not other projects)

#### New: `invite-project-members.spec.ts`

- Successfully invites a new user (creates user + membership)
- Successfully invites an existing user (creates membership only)
- Skips duplicate invitations (user already a member of the project)
- Creates memberships with `status: "sent"` and a valid `invitationToken`
- Handles multiple emails in a single request
- Validates email format (if implemented)

#### New: `remove-project-membership.spec.ts`

- Successfully removes a membership
- Returns `404` for non-existent membership ID
- Returns `404` if membership belongs to a different project
- Verifies the membership is actually deleted from the database

### 6.2 Service Tests

**File**: `apps/api/src/domains/projects/project-memberships.service.spec.ts` (**new file**)

- Test `listProjectMemberships` method
- Test `inviteProjectMembers` method (user creation, duplicate handling)
- Test `removeProjectMembership` method

### 6.3 Policy Tests

**File**: `apps/api/src/domains/projects/project.policy.spec.ts` (extend existing)

- Test `canListProjectMemberships()` for owner, admin, member
- Test `canInviteProjectMembers()` for owner, admin, member
- Test `canRemoveProjectMembership()` for owner, admin, member

### 6.4 Factory

**File**: `apps/api/src/domains/projects/project-membership.factory.ts`

Create a fishery factory for `ProjectMembership` with transient params for `project` and `user`.

---

## 7. Web Frontend

> **Implementation note**: Every pattern described below is derived from the existing codebase. All code must match the conventions already established — same naming, same file structure, same Redux patterns, same component composition.

### 7.1 Feature Architecture

A new `project-memberships` feature is created following the canonical feature pattern (as established by `me`, `agents`, `documents`, etc.).

> **Note**: Even though the API controllers live in the `projects` domain on the backend, the frontend feature is separate (`project-memberships`) to maintain clear separation of concerns and avoid bloating the existing `projects` feature — same rationale as `agents` vs `projects`.

#### 7.1.1 Domain Model

**File**: `features/project-memberships/project-memberships.models.ts`

Domain-level types that slices and components depend on (not raw DTOs):

```typescript
export type ProjectMembership = {
  id: string
  projectId: string
  userId: string
  userName: string | null
  userEmail: string
  status: "sent" | "accepted"
  createdAt: number
}
```

#### 7.1.2 SPI (Service Provider Interface)

**File**: `features/project-memberships/project-memberships.spi.ts`

Declares the interface — only exposes domain models, hides transport details:

```typescript
import type { ProjectMembership } from "./project-memberships.models"

export interface IProjectMembershipsSpi {
  getAll: (params: { organizationId: string; projectId: string }) => Promise<ProjectMembership[]>
  invite: (
    params: { organizationId: string; projectId: string },
    emails: string[],
  ) => Promise<ProjectMembership[]>
  removeOne: (params: {
    organizationId: string
    projectId: string
    membershipId: string
  }) => Promise<void>
}
```

> **Convention note**: SPI params use object destructuring (`params: { ... }`) to match the `agents.spi.ts` pattern — not positional arguments.

#### 7.1.3 API Implementation

**File**: `features/project-memberships/external/project-memberships.api.ts`

Concrete Axios implementation. Follows the exact same structure as `agents.api.ts`:

- Uses `getAxiosInstance()` from `@/external/axios`
- Imports routes & DTOs from `@caseai-connect/api-contracts`
- Uses `satisfies IProjectMembershipsSpi` at the end
- Has `fromDto` / `toDto` mapping functions at the bottom of the file
- Default export (like `agents.api.ts`)

```typescript
import { type ProjectMembershipDto, ProjectsRoutes } from "@caseai-connect/api-contracts"
import { getAxiosInstance } from "@/external/axios"
import type { ProjectMembership } from "../project-memberships.models"
import type { IProjectMembershipsSpi } from "../project-memberships.spi"

export default {
  getAll: async ({ organizationId, projectId }) => {
    const axios = getAxiosInstance()
    const response = await axios.get<typeof ProjectsRoutes.listProjectMemberships.response>(
      ProjectsRoutes.listProjectMemberships.getPath({ organizationId, projectId }),
    )
    return response.data.data.memberships.map(fromDto)
  },
  invite: async ({ organizationId, projectId }, emails) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof ProjectsRoutes.inviteProjectMembers.response>(
      ProjectsRoutes.inviteProjectMembers.getPath({ organizationId, projectId }),
      { payload: { emails } },
    )
    return response.data.data.memberships.map(fromDto)
  },
  removeOne: async ({ organizationId, projectId, membershipId }) => {
    const axios = getAxiosInstance()
    await axios.delete(
      ProjectsRoutes.removeProjectMembership.getPath({ organizationId, projectId, membershipId }),
    )
  },
} satisfies IProjectMembershipsSpi

const fromDto = (dto: ProjectMembershipDto): ProjectMembership => ({
  id: dto.id,
  projectId: dto.projectId,
  userId: dto.userId,
  userName: dto.userName,
  userEmail: dto.userEmail,
  status: dto.status,
  createdAt: dto.createdAt,
})
```

#### 7.1.4 Service Registration

**File**: `external/axios.services.ts` — add import + key:

```typescript
import projectMembershipsApi from "@/features/project-memberships/external/project-memberships.api"

export const services = {
  // ... existing services ...
  projectMemberships: projectMembershipsApi,
}
```

**File**: `di/services.ts` — add to `Services` type:

```typescript
import type { IProjectMembershipsSpi } from "@/features/project-memberships/project-memberships.spi"

export type Services = {
  // ... existing services ...
  projectMemberships: IProjectMembershipsSpi
}
```

#### 7.1.5 Redux Thunks

**File**: `features/project-memberships/project-memberships.thunks.ts`

Follows the exact pattern from `agents.thunks.ts` and `projects.thunks.ts`:

```typescript
import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import type { ProjectMembership } from "./project-memberships.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const listProjectMemberships = createAsyncThunk<
  ProjectMembership[],
  { organizationId: string; projectId: string },
  ThunkConfig
>(
  "projectMemberships/list",
  async (params, { extra: { services } }) =>
    await services.projectMemberships.getAll(params),
)

export const inviteProjectMembers = createAsyncThunk<
  ProjectMembership[],
  { organizationId: string; projectId: string; emails: string[] },
  ThunkConfig
>(
  "projectMemberships/invite",
  async ({ organizationId, projectId, emails }, { extra: { services } }) =>
    await services.projectMemberships.invite({ organizationId, projectId }, emails),
)

export const removeProjectMembership = createAsyncThunk<
  void,
  { organizationId: string; projectId: string; membershipId: string },
  ThunkConfig
>(
  "projectMemberships/remove",
  async (params, { extra: { services } }) =>
    await services.projectMemberships.removeOne(params),
)
```

#### 7.1.6 Redux Slice

**File**: `features/project-memberships/project-memberships.slice.ts`

State shape follows the `agents` pattern — keyed by `projectId` using `AsyncData`:

```typescript
import { createSlice } from "@reduxjs/toolkit"
import { ADS, type AsyncData, defaultAsyncData } from "@/store/async-data-status"
import type { Project } from "../projects/projects.models"
import type { ProjectMembership } from "./project-memberships.models"
import { inviteProjectMembers, listProjectMemberships, removeProjectMembership } from "./project-memberships.thunks"

type DataType = Record<Project["id"], ProjectMembership[]>

interface State {
  data: AsyncData<DataType>
}

const initialState: State = {
  data: defaultAsyncData,
}

const slice = createSlice({
  name: "projectMemberships",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(listProjectMemberships.pending, (state) => {
        if (!ADS.isFulfilled(state.data)) state.data.status = ADS.Loading
        state.data.error = null
      })
      .addCase(listProjectMemberships.fulfilled, (state, action) => {
        const projectId = action.meta.arg.projectId
        state.data = {
          status: ADS.Fulfilled,
          error: null,
          value: { ...state.data.value, [projectId]: action.payload },
        }
      })
      .addCase(listProjectMemberships.rejected, (state, action) => {
        state.data.status = ADS.Error
        state.data.error = action.error.message || "Failed to list project memberships"
      })
  },
})

export type { State as ProjectMembershipsState }
export const projectMembershipsInitialState = initialState
export const projectMembershipsActions = { ...slice.actions }
export const projectMembershipsSliceReducer = slice.reducer
```

#### 7.1.7 Redux Selectors

**File**: `features/project-memberships/project-memberships.selectors.ts`

Follows `agents.selectors.ts` pattern with `AsyncData` returns:

```typescript
import { createSelector } from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import { ADS, type AsyncData } from "@/store/async-data-status"
import type { ProjectMembership } from "./project-memberships.models"

const selectProjectMembershipsData = (state: RootState) => state.projectMemberships.data

export const selectProjectMembershipsFromProjectId = (projectId?: string | null) =>
  createSelector(
    [selectProjectMembershipsData],
    (membershipsData): AsyncData<ProjectMembership[]> => {
      if (!projectId)
        return { status: ADS.Error, value: null, error: "No project selected" }

      if (!ADS.isFulfilled(membershipsData)) return { ...membershipsData }

      if (!membershipsData.value?.[projectId])
        return { status: ADS.Fulfilled, value: [], error: null }

      return { status: ADS.Fulfilled, value: membershipsData.value[projectId], error: null }
    },
  )
```

#### 7.1.8 Redux Middleware (Listener)

**File**: `features/project-memberships/project-memberships.middleware.ts`

Follows the exact `documents.middleware.ts` / `agents.middleware.ts` pattern:

- Refreshes memberships list after invite/remove
- Shows success/error notifications via `notificationsActions.show()`
- Uses `createListenerMiddleware<RootState, AppDispatch>()`

```typescript
import type { TypedStartListening } from "@reduxjs/toolkit"
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import type { AppDispatch, RootState } from "@/store/types"
import { notificationsActions } from "../notifications/notifications.slice"
import { selectCurrentOrganizationId } from "../organizations/organizations.selectors"
import { selectCurrentProjectId } from "../projects/projects.selectors"
import {
  inviteProjectMembers,
  listProjectMemberships,
  removeProjectMembership,
} from "./project-memberships.thunks"

const listenerMiddleware = createListenerMiddleware<RootState, AppDispatch>()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

// Refresh memberships after invite or remove
listenerMiddleware.startListening({
  matcher: isAnyOf(inviteProjectMembers.fulfilled, removeProjectMembership.fulfilled),
  effect: async (_, listenerApi) => {
    const state = listenerApi.getState()
    const organizationId = selectCurrentOrganizationId(state)
    const projectId = selectCurrentProjectId(state)
    if (!organizationId || !projectId) return
    await listenerApi.dispatch(listProjectMemberships({ organizationId, projectId }))
  },
})

// Notification listeners (invite success/error, remove success/error)
listenerMiddleware.startListening({
  actionCreator: inviteProjectMembers.fulfilled,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({ title: "Members invited successfully", type: "success" }),
    )
  },
})
listenerMiddleware.startListening({
  actionCreator: inviteProjectMembers.rejected,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({ title: "Failed to invite members", type: "error" }),
    )
  },
})
listenerMiddleware.startListening({
  actionCreator: removeProjectMembership.fulfilled,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({ title: "Member removed successfully", type: "success" }),
    )
  },
})
listenerMiddleware.startListening({
  actionCreator: removeProjectMembership.rejected,
  effect: async (_, listenerApi) => {
    listenerApi.dispatch(
      notificationsActions.show({ title: "Failed to remove member", type: "error" }),
    )
  },
})

export { listenerMiddleware as projectMembershipsMiddleware }
```

#### 7.1.9 Store Registration

**File**: `store/index.ts` — add reducer + middleware:

```typescript
import { projectMembershipsMiddleware } from "@/features/project-memberships/project-memberships.middleware"
import { projectMembershipsSliceReducer } from "@/features/project-memberships/project-memberships.slice"

// In reducer:
projectMemberships: projectMembershipsSliceReducer,

// In middleware .prepend():
projectMembershipsMiddleware.middleware,
```

**File**: `store/types.ts` — add to `RootState`:

```typescript
import type { projectMembershipsSliceReducer } from "@/features/project-memberships/project-memberships.slice"

// In RootState:
projectMemberships: ReturnType<typeof projectMembershipsSliceReducer>
```

### 7.2 Routing

#### Route Name

**File**: `routes/helpers.ts` — add new enum value:

```typescript
PROJECT_MEMBERSHIPS = "/o/:organizationId/p/:projectId/members"
```

Also add a `buildProjectMembershipsPath` helper (matches the existing `buildDocumentsPath` pattern):

```typescript
export const buildProjectMembershipsPath = ({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) => {
  return buildAdminPath(
    RouteNames.PROJECT_MEMBERSHIPS.toString()
      .replace(":organizationId", organizationId)
      .replace(":projectId", projectId),
  )
}
```

#### Router Config

**File**: `routes/Router.tsx` — add as a child of the `PROJECT` route in the **admin section only** (same level as `DOCUMENTS`):

```typescript
{
  path: buildAdminPath(RouteNames.PROJECT_MEMBERSHIPS),
  element: <ProjectMembershipsRoute />,
},
```

#### Elements

**File**: `routes/Elements.tsx` — add element mapping (if using the `getElement` pattern), or import directly in `Router.tsx`.

#### Route Component

**File**: `routes/admin/ProjectMembershipsRoute.tsx`

Follows the exact `DocumentsRoute.tsx` pattern:
- Reads `selectCurrentProjectId` and `selectProjectData` from Redux
- Reads `selectProjectMembershipsFromProjectId(projectId)` from the new selectors
- Handles `ADS.isError` → `NotFoundRoute`, loading → `LoadingRoute`, fulfilled → `WithData`
- `WithData` renders `ProjectMembershipsList` and calls `useHandleHeader` to set the layout header title + right slot (the invite button)

```typescript
export function ProjectMembershipsRoute() {
  const projectId = useAppSelector(selectCurrentProjectId)
  const project = useAppSelector(selectProjectData)
  const membershipsData = useAppSelector(selectProjectMembershipsFromProjectId(projectId))

  if (!projectId) return <NotFoundRoute />
  if (ADS.isError(membershipsData) || ADS.isError(project)) return <NotFoundRoute />
  if (ADS.isFulfilled(membershipsData) && ADS.isFulfilled(project))
    return <WithData project={project.value} memberships={membershipsData.value} />
  return <LoadingRoute />
}
```

### 7.3 Sidebar Navigation

**File**: `components/sidebar/projects/NavProjectMemberships.tsx` (**new file**)

Follows the exact `NavDocuments.tsx` pattern:
- Uses `SidebarMenu > SidebarMenuItem > SidebarMenuButton` from `@caseai-connect/ui/shad/sidebar`
- Uses `UsersIcon` from `lucide-react`
- Uses `Link` from `react-router-dom`
- Uses `useAbility()` hook — returns `null` if `!isAdminInterface`
- Uses `buildProjectMembershipsPath` from `routes/helpers`
- Uses `useTranslation("common")` to get the localized label
- Checks active state via `useLocation().pathname`

```typescript
export function NavProjectMemberships({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) {
  const { t } = useTranslation("common")
  const { isAdminInterface } = useAbility()
  const isActive = useIsProjectMembershipsActive(projectId)
  if (!isAdminInterface) return null
  const path = buildProjectMembershipsPath({ organizationId, projectId })
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton isActive={isActive} asChild>
          <Link to={path} className="font-medium">
            <UsersIcon />
            <span>{t("members")}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
```

**File**: `components/sidebar/NavProjects.tsx` — in `ProjectItem`, render `NavProjectMemberships` alongside the existing `NavDocuments`:

```typescript
<NavDocuments organizationId={project.organizationId} projectId={project.id} />
<NavProjectMemberships organizationId={project.organizationId} projectId={project.id} />
```

### 7.4 UI Components

#### `components/project-memberships/ProjectMembershipsList.tsx`

- Renders a list/table of project memberships
- Each row shows: user name (or "Pending" if null), user email, status badge (`sent` / `accepted`), remove button (`Trash2Icon`)
- Remove button dispatches `removeProjectMembership` thunk
- Uses `useAppDispatch` and `useAppSelector` hooks
- Uses `useTranslation("projectMemberships")` for i18n keys

#### `components/project-memberships/InviteProjectMembersDialog.tsx`

Uses `Dialog` / `DialogContent` / `DialogHeader` / `DialogTitle` / `DialogDescription` from `@caseai-connect/ui/shad/dialog` (same pattern as `DeleteAgentDialog.tsx`):

- Controlled via `open` / `onOpenChange` state
- Form with a textarea for emails (comma or newline separated)
- Submit button dispatches `inviteProjectMembers` thunk
- Disabled while `ADS.isLoading(status)`
- On success: dialog closes (middleware handles list refresh + notification)
- Uses `useTranslation("projectMemberships", { keyPrefix: "invite" })`

### 7.5 Internationalization

**File**: `locales/en.json` — add new `projectMemberships` namespace:

```json
{
  "common": {
    "members": "Members",
    ...existing keys...
  },
  "projectMemberships": {
    "header": {
      "title": "Manage {{projectName}}'s members"
    },
    "list": {
      "name": "Name",
      "email": "Email",
      "status": "Status",
      "statusSent": "Invited",
      "statusAccepted": "Accepted",
      "pending": "Pending",
      "empty": {
        "title": "No members yet",
        "description": "Invite members to give them access to this project's agents."
      },
      "remove": "Remove member",
      "removing": "Removing..."
    },
    "invite": {
      "title": "Invite Members",
      "description": "Enter email addresses to invite members to this project.",
      "labelEmails": "Email addresses",
      "placeholderEmails": "Enter email addresses separated by commas or new lines",
      "submit": "Invite",
      "submitting": "Inviting..."
    }
  }
}
```

**File**: `locales/fr.json` — add matching French translations.

### 7.6 Data Flow Summary

```
User clicks "Invite Members" button (in route header right slot)
  → InviteProjectMembersDialog opens (Dialog from shadcn/ui)
  → User enters emails and clicks "Invite"
  → dispatch(inviteProjectMembers({ organizationId, projectId, emails }))
  → thunk calls extra.services.projectMemberships.invite(...)
  → Axios POST /organizations/:orgId/projects/:projId/memberships/invite
  → API creates User records (if needed) + ProjectMembership records
  → Response returns created memberships
  → Middleware: inviteProjectMembers.fulfilled triggers listProjectMemberships refresh
  → Middleware: notificationsActions.show({ title: "Members invited successfully", type: "success" })
  → Slice updates state for the projectId key
  → List re-renders with new memberships
```

---

## 8. File Summary

### API (`apps/api/src/domains/projects/`)

| File                                | Action   | Description                                |
|-------------------------------------|----------|--------------------------------------------|
| `project-membership.entity.ts`      | **New**  | TypeORM entity                             |
| `project-membership.factory.ts`     | **New**  | Test factory (fishery)                     |
| `project-memberships.controller.ts` | **New**  | Dedicated controller for membership endpoints |
| `project-memberships.service.ts`    | **New**  | Dedicated service for membership logic     |
| `project-memberships.service.spec.ts` | **New** | Service tests                             |
| `project.entity.ts`                 | Modify   | Add `@OneToMany` to `ProjectMembership`    |
| `project.policy.ts`                 | Modify   | Add 3 new policy methods                   |
| `project.policy.spec.ts`            | Modify   | Add tests for new policy methods           |
| `projects.module.ts`                | Modify   | Register new controller, service, and entities |
| `e2e-tests/auth.spec.ts`            | Modify   | Add auth tests for 3 new routes            |
| `e2e-tests/list-project-memberships.spec.ts` | **New** | Functional e2e tests             |
| `e2e-tests/invite-project-members.spec.ts`   | **New** | Functional e2e tests             |
| `e2e-tests/remove-project-membership.spec.ts` | **New** | Functional e2e tests            |

### API Contracts (`packages/api-contracts/src/projects/`)

| File               | Action | Description                              |
|--------------------|--------|------------------------------------------|
| `projects.dto.ts`  | Modify | Add project membership DTOs              |
| `projects.routes.ts` | Modify | Add 3 new route definitions            |

### Web (`apps/web/src/`)

| File                                                                | Action   | Description                                |
|---------------------------------------------------------------------|----------|--------------------------------------------|
| `features/project-memberships/project-memberships.models.ts`        | **New**  | Domain models                              |
| `features/project-memberships/project-memberships.spi.ts`           | **New**  | SPI interface (params as objects)           |
| `features/project-memberships/external/project-memberships.api.ts`  | **New**  | Axios implementation (`satisfies` SPI)     |
| `features/project-memberships/project-memberships.slice.ts`         | **New**  | Redux slice (keyed by projectId)           |
| `features/project-memberships/project-memberships.thunks.ts`        | **New**  | Redux thunks (list, invite, remove)        |
| `features/project-memberships/project-memberships.selectors.ts`     | **New**  | Redux selectors (returns `AsyncData`)      |
| `features/project-memberships/project-memberships.middleware.ts`    | **New**  | Listener middleware (refresh + notifications) |
| `components/project-memberships/ProjectMembershipsList.tsx`         | **New**  | Memberships list view                      |
| `components/project-memberships/InviteProjectMembersDialog.tsx`     | **New**  | Dialog (shadcn/ui) with email form         |
| `components/sidebar/projects/NavProjectMemberships.tsx`             | **New**  | Sidebar nav item (matches `NavDocuments`)  |
| `routes/admin/ProjectMembershipsRoute.tsx`                          | **New**  | Route component (matches `DocumentsRoute`) |
| `routes/Router.tsx`                                                 | Modify   | Add admin-only route child of PROJECT      |
| `routes/helpers.ts`                                                 | Modify   | Add `PROJECT_MEMBERSHIPS` + path builder   |
| `routes/Elements.tsx`                                               | Modify   | Add element mapping (if needed)            |
| `components/sidebar/NavProjects.tsx`                                | Modify   | Render `NavProjectMemberships` in `ProjectItem` |
| `external/axios.services.ts`                                        | Modify   | Register `projectMemberships` service      |
| `di/services.ts`                                                    | Modify   | Add `projectMemberships` to `Services` type |
| `store/index.ts`                                                    | Modify   | Register reducer + middleware              |
| `store/types.ts`                                                    | Modify   | Add `projectMemberships` to `RootState`    |
| `locales/en.json`                                                   | Modify   | Add `projectMemberships` + `common.members` keys |
| `locales/fr.json`                                                   | Modify   | Add matching French translations           |

### Database

| Action                        | Description                                        |
|-------------------------------|----------------------------------------------------|
| Generate migration            | `npm run migration:generate src/migrations/AddProjectMembership` |

---

## 9. Resolved Decisions

3. **User creation for unknown emails**: Placeholder users will use `auth0Id = "00000000-0000-0000-0000-000000000000"`. This will be updated when the user signs up via Auth0.
4. **Bulk operations**: No bulk removal — out of scope for now.
5. **Pagination**: No pagination on the memberships list endpoint for now.

## 10. Open Questions / Future Considerations

1. **Email notifications**: Should we send invitation emails when inviting users? (Deferred — not in scope for this iteration.)
2. **Invitation acceptance flow**: How does a user "accept" an invitation? Via a magic link with the `invitationToken`? Or auto-accept on first login? (Deferred — the `status` field is there to support this later.)
