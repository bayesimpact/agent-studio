# Web Rules (Next.js — apps/web)

## Redux & Feature Architecture

### API Calls Must Go Through Redux + Services

**Rule**: All API calls MUST go through Redux thunks, which call the shared `services` object. Components MUST NOT call the API client (Axios, `fetch`) directly.

- All API calls use `createAsyncThunk`
- Thunks call `extra.services.{feature}` methods only
- Components dispatch thunks, never call API directly
- API routes and DTOs come from `@caseai-connect/api-contracts`

**Structure**:
```
features/{domain}/{domain}.slice.ts
features/{domain}/{domain}.thunks.ts
features/{domain}/{domain}.selectors.ts
external/axios.ts            # Singleton Axios with auth interceptors
external/axios.services.ts   # Builds concrete services
di/services.ts               # Typed Services + getServices()
```

**Store wiring** (`store/index.ts`):
- Registers feature reducers under domain keys
- Configures `thunk.extraArgument` with `{ services: getServices() }` (typed as `ThunkExtraArg`)

```typescript
// ✅ Correct
dispatch(fetchMe())

// ❌ Wrong
const response = await fetch('/me')
```

### Feature Service Pattern (SPI + External API + Models)

Each feature MUST follow this canonical pattern (the "me" feature is the reference):

| File | Purpose |
|------|---------|
| `features/{domain}/{domain}.models.ts` | Domain types (not raw DTOs) |
| `features/{domain}/{domain}.spi.ts` | Service Provider Interface (`I{Domain}Spi`) |
| `features/{domain}/external/{domain}.api.ts` | Concrete SPI implementation using Axios + `api-contracts` |
| `external/axios.services.ts` | Wires implementation: `{domain}: {domain}Api` |
| `di/services.ts` | `Services` type + `getServices()` |
| `features/{domain}/{domain}.thunks.ts` | `createAsyncThunk` calling `extra.services.{domain}` |
| `features/{domain}/{domain}.slice.ts` | State typed on domain models |
| `features/{domain}/{domain}.selectors.ts` | Selectors returning domain models |

**Requirements for new/refactored features**:
- Define domain models in `*.models.ts` — components and slices use these, not raw DTOs
- Define SPI in `*.spi.ts` — hides transport details, exposes domain models
- Implement SPI in `external/*.api.ts` — use `satisfies I{Domain}Spi`, map DTOs → domain models
- Register in `external/axios.services.ts` and update `di/services.ts`
- Thunks use `createAsyncThunk<DomainModel, ...>` and call `extra.services.{domain}`

**Migration note**: Legacy features (`projects`, `organizations`, `agents`, etc.) that use `services/{domain}.ts` and return DTOs directly SHOULD be refactored over time to follow this pattern.

### Data Loading: Marker Action + Middleware, Not `useEffect`

**Rule**: page components MUST NOT dispatch fetch thunks from `useEffect`. They dispatch a `mount` / `unmount` marker action; a Redux listener middleware reacts to `mount` and dispatches the loaders by reading current URL-driven state (the `selectCurrent*Id` slices populated by `useSetCurrentIds`).

**Pattern** (mirrors `apps/web/src/eval/features/evaluation-extraction-runs/evaluation-extraction-runs.middleware.ts`):

1. Slice exposes no-op `mount` / `unmount` reducers:
   ```ts
   reducers: {
     mount: () => {},
     unmount: () => {},
     // ...
   }
   ```
2. Each route component fires them from a single `useEffect`:
   ```ts
   useEffect(() => {
     dispatch(featureActions.mount())
     return () => dispatch(featureActions.unmount())
   }, [dispatch])
   ```
3. Middleware listens on `featureActions.mount`, reads URL-driven state, dispatches loaders:
   ```ts
   listenerMiddleware.startListening({
     actionCreator: featureActions.mount,
     effect: async (_, listenerApi) => {
       const state = listenerApi.getState()
       const id = selectCurrentXxxId(state)
       if (id) listenerApi.dispatch(loadXxx(id))
     },
   })
   ```

**Why not `dispatch(thunk())` in `useEffect` directly**: silent failure mode — different entry points (e.g. tester flow re-using a studio component) end up with no fetcher because nobody remembers to add the useEffect, OR the page's useEffect duplicates work the listener already does.

**Why not URL-change predicates only** (`hasXxxIdChanged`): scope-bound middleware (registered via `injectXxxSlices`) only sees state changes after registration. On hard reload to a deep URL, `useSetCurrentIds` runs in `ProtectedRoute` *before* the Shell mounts (because `ProtectedRoute` shows `<LoadingRoute />` while Auth0 resolves), so a predicate listener misses the initial null → id transition. The `mount` marker fires *after* Shell mount, sidestepping the ordering issue. Predicate listeners ARE fine for **tier-1 (static) middleware** registered at boot — see `common/features/agents/agents.middleware.ts` listening for `hasProjectChanged`.

**Cleanup actions** (e.g. `clearSelectedContext`) belong in middleware too — listener on `unmount` or post-action — not in `useEffect` cleanups.

**Exceptions where `useEffect` is fine**: dynamic slice injection lifecycle (`use-init-store.ts`), DOM subscriptions, focus/scroll, third-party widget mount/unmount, AND the `mount`/`unmount` marker dispatches described above.

---

## Form Component Architecture

### Separation of Create and Update Forms

**Rule**: A `CreateXXXForm` MUST NEVER handle both creating and updating. Always use separate components and extract shared logic into a base form.

```
components/{domain}/{Domain}Form.tsx       # Shared presentational form
components/{domain}/Create{Domain}Form.tsx # Create logic only
components/{domain}/Update{Domain}Form.tsx # Update logic only
```

```typescript
// ✅ Correct - shared form component
export function ProjectForm({ defaultName, isLoading, onSubmit, submitLabelIdle, ... }: ProjectFormProps) {
  // Shared fields, validation, layout
}

// ✅ Correct - create only
export function CreateProjectForm({ organizationId, onSuccess }: CreateProjectFormProps) {
  const dispatch = useAppDispatch()
  const handleSubmit = async (data) => {
    await dispatch(createProject({ name: data.name, organizationId })).unwrap()
    onSuccess?.()
  }
  return <ProjectForm onSubmit={handleSubmit} submitLabelIdle="Create Project" ... />
}

// ✅ Correct - update only
export function UpdateProjectForm({ project, onSuccess }: UpdateProjectFormProps) {
  const dispatch = useAppDispatch()
  const handleSubmit = async (data) => {
    await dispatch(updateProject({ projectId: project.id, payload: { name: data.name } })).unwrap()
    onSuccess?.()
  }
  return <ProjectForm defaultName={project.name} onSubmit={handleSubmit} submitLabelIdle="Update Project" ... />
}

// ❌ Wrong - single form with if/else for create vs update
```

---

## TypeScript Type Safety

### Never Use `any` to Fix TypeScript Errors

**Rule**: NEVER use `any`, `as any`, `// @ts-ignore`, or `// @ts-expect-error` to suppress type errors.

```typescript
// ❌ Wrong
const result = someFunction() as any
dispatch(action as any)

// ✅ Correct - use proper types
const result: ExpectedType = someFunction()

// ✅ Correct - use type guards for unknown types
function isExpectedType(value: unknown): value is ExpectedType {
  return typeof value === 'object' && value !== null && 'property' in value
}
```

---

## Storybook-First for Non-Trivial UI Slices

When starting a new admin/studio UI slice with meaningful UX surface (list + editor + lifecycle actions), the preferred phasing is:

1. **Phase A — Storybook slice**: presentational components with mock data, wired into a handful of **scenario-driven** stories (one per user-facing lifecycle state, e.g. `DraftEditable`, `ActiveLocked`, `ClosedReadOnly`) — NOT a prop catalog with one story per component. Components live in `apps/web/src/{studio,tester,reviewer}/features/<domain>/components/`; stories in `apps/web/src/stories/<domain>/`. Hard-coded English strings are fine; i18n waits for phase B.
2. **Phase B — wire Redux + routes**: models / spi / external api / slice / thunks / selectors / middleware / register in services / page wrappers / route registration / i18n. Connects phase-A components to the API.

**Why**: lets the UX be reviewed visually before Redux plumbing, prevents rework. Presentational components stay small (one per file); stories are what consolidate them into scenes.

### Storybook Mock Services Are Factories, Not Singletons

Page wrappers that dispatch list thunks on mount (e.g. `CampaignListPage`) will overwrite seeded Redux state if the mock service returns hardcoded data — the page's `mount` handler dispatches `listX()`, the `fulfilled` reducer overwrites whatever was seeded in `withRedux({ list: [] })`, and your `Empty` story flashes 3 fixtures.

**Don't**: export a singleton mock service with fixed return values.

**Do**: export a factory that accepts per-story overrides:

```typescript
export function buildMockReviewCampaignsService(
  overrides: { campaigns?: ReviewCampaignDto[] } = {},
): IReviewCampaignsSpi {
  const campaigns = overrides.campaigns ?? defaultFixtures
  return { async getAll() { return campaigns }, /* ... */ }
}

// In the story:
servicesMock: {
  reviewCampaigns: buildMockReviewCampaignsService({ campaigns: [] }),
}
```

Each story passes both (a) the seeded state for the decorator AND (b) the matching mock return values. Symptom of getting this wrong: a story briefly renders the seeded state then switches to the mock service's default return.

---

## Completion Criteria

Before marking web work as completed:

1. `npm run biome:check` — must pass
2. `npm run typecheck` — must pass

Work is NOT complete until both commands pass with exit code 0.
