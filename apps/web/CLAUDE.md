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

## Completion Criteria

Before marking web work as completed:

1. `npm run biome:check` — must pass
2. `npm run typecheck` — must pass

Work is NOT complete until both commands pass with exit code 0.
