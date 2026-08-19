# Extraction settings version picker implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a Studio user choose which agent settings version an extraction runs with, on both the single-document and the CSV batch flow, the way the conversation playground already does.

**Architecture:** Both extraction flows already persist the settings they resolved on the run row, and their async workers read from there, so the version is pinned at creation. Each create endpoint gains an optional `agentSettingsRevision`, resolved server-side with a draft-first default. On the web, the choice lives in the existing `agentSettings` Redux slice keyed by agent, and the existing `AgentSettingsVersionSelect` becomes presentational so both surfaces can mount it.

**Tech Stack:** NestJS + TypeORM (api), React + Redux Toolkit + Vite (web), shared `@caseai-connect/api-contracts` package, Jest for api tests, Vitest for web tests, Storybook for route stories.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-10-extraction-settings-version-picker-design.md`
- Never use single-letter variables in loops or callbacks; use descriptive names (`version`, not `v`).
- Sample data in stories and fixtures stays domain-neutral.
- Commit messages follow Conventional Commits, matching repo history (`feat(...)`, `fix(...)`, `docs: ...`).
- Do not run `npm install` in a worktree; use `npm ci`.
- Completion gates, run from the repo root: `npm run biome:check`, `npm run typecheck`, `npm run test`.
- `npm run biome:check` rewrites files. Run it before staging, never after.
- Single-file api specs need `node --experimental-vm-modules`, not a plain `npx jest`.
- The revision reaches TypeORM as-is, so every endpoint accepting one rejects a non-integer before use.
- Out of scope, do not add: eval extraction runs, persisting the choice across reloads, archived version selection, sub-agent versions, reducing `CsvExtractor`'s `useState` count.

---

## File Structure

**Contracts**
- Modify `packages/api-contracts/src/agents/extraction-agent-sessions/extraction-agent-sessions.routes.ts` — `executeOne` payload gains `agentSettingsRevision?: number`
- Modify `packages/api-contracts/src/agents/agent-csv-extraction-runs/agent-csv-extraction-runs.dto.ts` — `CreateAgentCsvExtractionRunRequestDto` gains `agentSettingsRevision?: number`

**API**
- Modify `apps/api/src/domains/agents/extraction-agent-sessions/extraction-agent-sessions.controller.ts` — resolve the revision on `executeOne`
- Create `apps/api/src/domains/agents/extraction-agent-sessions/e2e-tests/execute-one-version.spec.ts` — version resolution cases
- Modify `apps/api/src/domains/agents/csv-extraction-runs/agent-csv-extraction-runs.controller.ts` — resolve the revision on `createOne`, pin settings on `retryOne`
- Modify `apps/api/src/domains/agents/csv-extraction-runs/e2e-tests/create-one.spec.ts` — version resolution cases
- Modify `apps/api/src/domains/agents/csv-extraction-runs/e2e-tests/retry-one.spec.ts` — retry reuses pinned settings

**Web state**
- Modify `apps/web/src/common/features/agents/agent-settings/agent-settings.slice.ts` — `extractionRevisionByAgentId` + `setExtractionRevision`
- Modify `apps/web/src/common/features/agents/agent-settings/agent-settings.selectors.ts` — `selectPlaygroundRevision`
- Modify `apps/web/src/common/features/agents/agent-sessions/extraction/extraction-agent-sessions.spi.ts` and `external/extraction-agent-sessions.api.ts` and `extraction-agent-sessions.thunks.ts`
- Create `apps/web/src/common/features/agents/agent-sessions/extraction/extraction-agent-sessions.thunks.spec.ts`
- Modify `apps/web/src/common/features/agents/csv-extraction-runs/agent-csv-extraction-runs.spi.ts` and `external/agent-csv-extraction-runs.api.ts` and `agent-csv-extraction-runs.thunks.ts`
- Create `apps/web/src/common/features/agents/csv-extraction-runs/agent-csv-extraction-runs.thunks.spec.ts`

**Web UI**
- Modify `apps/web/src/studio/features/agents/agent-settings/components/AgentSettingsVersionSelect.tsx` — presentational
- Create `apps/web/src/studio/features/agents/agent-settings/components/PlaygroundVersionSelect.tsx`
- Create `apps/web/src/studio/features/agents/agent-settings/components/ExtractionVersionSelect.tsx`
- Modify `apps/web/src/studio/routes/StudioAgentSessionRoute.tsx` — use the playground wrapper
- Modify `apps/web/src/common/routes/agents/extraction/AgentExtractionRoute.tsx` — accept and pass `renderVersionPicker`
- Modify `apps/web/src/common/features/agents/csv-extraction-runs/components/CsvExtractor.tsx` — accept and render `renderVersionPicker`
- Modify `apps/web/src/studio/routes/StudioRoutes.tsx` and `apps/web/src/desk/routes/DeskRoutes.tsx`
- Modify `apps/web/src/common/features/agents/agent-settings/locales/agent-settings.{en,fr}.json`
- Modify `apps/web/src/stories/seed.ts` — `seed.studio.playgroundRevision`
- Create `apps/web/src/stories/routes/studio/agent/AgentExtractionRoute.stories.tsx`

**Docs**
- Modify `CHANGELOG.md`

---

### Task 1: Single-document extraction resolves an explicit revision

**Files:**
- Modify: `packages/api-contracts/src/agents/extraction-agent-sessions/extraction-agent-sessions.routes.ts:17-22`
- Modify: `apps/api/src/domains/agents/extraction-agent-sessions/extraction-agent-sessions.controller.ts:46-67`
- Test: `apps/api/src/domains/agents/extraction-agent-sessions/e2e-tests/execute-one-version.spec.ts` (create)

**Interfaces:**
- Consumes: `AgentSettingsService.get({ connectScope, agentId, revision }): Promise<AgentSettings | undefined>` and `AgentSettingsService.getLast({ connectScope, agentId, includesDraft? }): Promise<AgentSettings>`, both already existing in `apps/api/src/domains/agents/settings/agent-settings.service.ts`.
- Produces: `ExtractionAgentSessionsRoutes.executeOne` request payload `{ type, documentId, agentSettingsRevision?: number }`, consumed by Task 4.

Note: the sibling `execute-one.spec.ts` is `describe.skip` with an unresolved FIXME. Do not add cases there, they would never run. This task creates a new spec that asserts on the session row, which `executeExtraction` saves synchronously with `agentSettingsId` before handing off to the worker, so no waiting on the LLM mock is needed.

- [ ] **Step 1: Widen the contract**

In `packages/api-contracts/src/agents/extraction-agent-sessions/extraction-agent-sessions.routes.ts`, replace the `executeOne` entry:

```ts
  executeOne: defineRoute<
    ResponseData<ExtractionAgentSessionResultDto>,
    Request<
      Pick<ExtractionAgentSessionSummaryDto, "documentId"> & { agentSettingsRevision?: number }
    >
  >({
    method: "post",
    path: `${prefix}/execute`,
  }),
```

- [ ] **Step 2: Write the failing test**

Create `apps/api/src/domains/agents/extraction-agent-sessions/e2e-tests/execute-one-version.spec.ts`:

```ts
import { ExtractionAgentSessionsRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import {
  type AllRepositories,
  clearTestDatabase,
  setupE2eTestDatabase,
  teardownE2eTestDatabase,
} from "@/common/test/test-database"
import { removeNullish } from "@/common/utils/remove-nullish"
import { documentFactory } from "@/domains/documents/document.factory"
import type { Agent } from "@/domains/agents/agent.entity"
import { agentSettingsFactory } from "@/domains/agents/settings/agent.settings.factory"
import { createOrganizationWithAgent } from "@/domains/organizations/organization.factory"
import type { Organization } from "@/domains/organizations/organization.entity"
import type { Project } from "@/domains/projects/project.entity"
import { setupUserGuardForTesting } from "../../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../../test/request"
import { AgentsModule } from "../../agents.module"

const mockLlmProvider = {
  streamChatResponse: jest.fn(),
  generateChatResponse: jest.fn(),
  generateStructuredOutput: jest.fn(),
}

/** Every seeded version needs a schema and instructions, or executeExtraction rejects with 422. */
const outputJsonSchema = {
  type: "object",
  properties: { title: { type: "string" } },
  required: ["title"],
}

describe("ExtractionAgentSessions - executeOne settings version", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupE2eTestDatabase>>
  let repositories: AllRepositories

  let organizationId: string
  let projectId: string
  let agentId: string
  let documentId: string
  let accessToken: string | undefined = "token"
  let auth0Id = "auth0|123"

  beforeAll(async () => {
    setup = await setupE2eTestDatabase({
      additionalImports: [AgentsModule],
      applyOverrides: (moduleBuilder) =>
        setupUserGuardForTesting(moduleBuilder, () => auth0Id)
          .overrideProvider("LLMProvider")
          .useValue(mockLlmProvider),
    })
    repositories = setup.getAllRepositories()
    app = setup.module.createNestApplication()
    await app.init()
    request = testRequester(app)
  })

  beforeEach(async () => {
    await clearTestDatabase(setup.dataSource)
    accessToken = "token"
    auth0Id = "auth0|123"
    jest.clearAllMocks()
    mockLlmProvider.generateStructuredOutput.mockResolvedValue({ title: "Sample" })
  })

  afterAll(async () => {
    await teardownE2eTestDatabase(setup)
    await app.close()
  })

  let organization: Organization
  let project: Project
  let agent: Agent

  const createContext = async () => {
    const context = await createOrganizationWithAgent(repositories, {
      agent: { type: "extraction" },
      agentSettings: { outputJsonSchema },
    })
    organization = context.organization
    project = context.project
    agent = context.agent

    const document = documentFactory.transient({ organization, project }).build({
      sourceType: "extraction",
      mimeType: "application/pdf",
      storageRelativePath: "documents/sample.pdf",
    })
    await repositories.documentRepository.save(document)

    organizationId = organization.id
    projectId = project.id
    agentId = agent.id
    documentId = document.id
    auth0Id = context.user.auth0Id
    return context
  }

  const seedRevision = async ({
    revision,
    isDraft = false,
    isArchived = false,
  }: {
    revision: number
    isDraft?: boolean
    isArchived?: boolean
  }) => {
    const settings = agentSettingsFactory
      .transient({ organization, project, agent })
      .build({ revision, isDraft, isArchived, outputJsonSchema })
    await repositories.agentSettingsRepository.save(settings)
    return settings
  }

  const subject = async ({
    type = "playground",
    agentSettingsRevision,
  }: {
    type?: "playground" | "live"
    agentSettingsRevision?: number
  } = {}) =>
    request({
      route: ExtractionAgentSessionsRoutes.executeOne,
      pathParams: removeNullish({ organizationId, projectId, agentId }),
      token: accessToken,
      request: { payload: { documentId, type, agentSettingsRevision } },
    })

  /** Settings row the run was pinned to, which is what the worker will run. */
  const findRunSettingsId = async (runId: string) => {
    const run = await repositories.extractionAgentSessionRepository.findOne({
      where: { id: runId },
    })
    return run?.agentSettingsId
  }

  it("runs the draft when the playground asks for its revision", async () => {
    await createContext()
    const draft = await seedRevision({ revision: 2, isDraft: true })

    const response = await subject({ agentSettingsRevision: 2 })

    expectResponse(response, 201)
    expect(await findRunSettingsId(response.body.data.runId)).toBe(draft.id)
  })

  it("runs the published revision the playground asks for", async () => {
    const { agentSettings } = await createContext()
    await seedRevision({ revision: 2, isDraft: true })

    const response = await subject({ agentSettingsRevision: 1 })

    expectResponse(response, 201)
    expect(await findRunSettingsId(response.body.data.runId)).toBe(agentSettings.id)
  })

  it("defaults a playground run with no revision to the draft", async () => {
    await createContext()
    const draft = await seedRevision({ revision: 2, isDraft: true })

    const response = await subject()

    expectResponse(response, 201)
    expect(await findRunSettingsId(response.body.data.runId)).toBe(draft.id)
  })

  it("returns 404 for a revision the agent does not have", async () => {
    await createContext()

    expectResponse(await subject({ agentSettingsRevision: 9 }), 404)
  })

  it("returns 422 for an archived revision", async () => {
    await createContext()
    await seedRevision({ revision: 2, isArchived: true })

    expectResponse(await subject({ agentSettingsRevision: 2 }), 422)
  })

  it("returns 403 when a live run asks for a revision", async () => {
    await createContext()
    await seedRevision({ revision: 2, isDraft: true })

    expectResponse(await subject({ type: "live", agentSettingsRevision: 2 }), 403)
  })

  it("keeps a live run with no revision on the published version", async () => {
    const { agentSettings } = await createContext()
    await seedRevision({ revision: 2, isDraft: true })

    const response = await subject({ type: "live" })

    expectResponse(response, 201)
    expect(await findRunSettingsId(response.body.data.runId)).toBe(agentSettings.id)
  })

  it("rejects a revision that is not an integer", async () => {
    // The revision reaches TypeORM as-is, so anything else must be turned away here rather than
    // surface as a driver error.
    await createContext()

    const response = await request({
      route: ExtractionAgentSessionsRoutes.executeOne,
      pathParams: removeNullish({ organizationId, projectId, agentId }),
      token: accessToken,
      request: {
        payload: { documentId, type: "playground", agentSettingsRevision: "2" },
      } as unknown as typeof ExtractionAgentSessionsRoutes.executeOne.request,
    })

    expectResponse(response, 403)
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd apps/api && node --experimental-vm-modules ../../node_modules/.bin/jest src/domains/agents/extraction-agent-sessions/e2e-tests/execute-one-version.spec.ts`
Expected: FAIL. The draft cases run the published revision, and the 404/422/403 cases return 201.

- [ ] **Step 4: Resolve the revision in the controller**

In `apps/api/src/domains/agents/extraction-agent-sessions/extraction-agent-sessions.controller.ts`, add to the existing `@nestjs/common` import: `ForbiddenException`, `NotFoundException`, `UnprocessableEntityException`. Add these type imports:

```ts
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import type { AgentSettings } from "@/domains/agents/settings/agent-settings.entity"
```

Replace the body of `executeOne` with:

```ts
  async executeOne(
    @Req() request: EndpointRequestWithAgent,
    @Body() { payload }: typeof ExtractionAgentSessionsRoutes.executeOne.request,
  ): Promise<typeof ExtractionAgentSessionsRoutes.executeOne.response> {
    const { documentId, type, agentSettingsRevision } = payload

    if (agentSettingsRevision !== undefined && !Number.isInteger(agentSettingsRevision)) {
      throw new ForbiddenException("Settings version must be an integer")
    }
    if (agentSettingsRevision !== undefined && type !== "playground") {
      throw new ForbiddenException(
        "Choosing a settings version is only available in the playground",
      )
    }

    const connectScope = getRequiredConnectScope(request)
    const agentSettings = await this.resolveAgentSettings({
      connectScope,
      agentId: request.agent.id,
      sessionType: type,
      revision: agentSettingsRevision,
    })
    const run = await this.extractionAgentSessionsService.executeExtraction({
      connectScope,
      agent: request.agent,
      agentSettings,
      userId: request.user.id,
      documentId,
      type,
    })
    return { data: { runId: run.id } }
  }

  /**
   * Settings the run is pinned to, which is what its worker will use.
   *
   * A playground run with no explicit revision uses the draft when there is one. The extraction
   * screen renders before its settings history has loaded, so the client cannot always name a
   * revision, and defaulting that window to the published one would run a version the picker does
   * not claim. A live run keeps using the newest published revision; it can never reach here with
   * a revision, that is rejected in the handler.
   */
  private async resolveAgentSettings({
    connectScope,
    agentId,
    sessionType,
    revision,
  }: {
    connectScope: RequiredConnectScope
    agentId: string
    sessionType: BaseAgentSessionType
    revision: number | undefined
  }): Promise<AgentSettings> {
    if (revision === undefined) {
      return sessionType === "playground"
        ? this.agentSettingsService.getLast({ connectScope, agentId, includesDraft: true })
        : this.agentSettingsService.getLast({ connectScope, agentId })
    }

    const agentSettings = await this.agentSettingsService.get({ connectScope, agentId, revision })
    if (!agentSettings) {
      throw new NotFoundException(`Version ${revision} not found for agent ${agentId}`)
    }
    if (agentSettings.isArchived) {
      throw new UnprocessableEntityException(`Version ${revision} is archived and cannot be run`)
    }
    return agentSettings
  }
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd apps/api && node --experimental-vm-modules ../../node_modules/.bin/jest src/domains/agents/extraction-agent-sessions/e2e-tests/execute-one-version.spec.ts`
Expected: PASS, 8 tests.

- [ ] **Step 6: Typecheck and commit**

```bash
npm run biome:check
cd apps/api && npx tsc --noEmit && cd ../..
git add packages/api-contracts/src/agents/extraction-agent-sessions/extraction-agent-sessions.routes.ts apps/api/src/domains/agents/extraction-agent-sessions
git commit -m "feat(extraction): run a chosen settings version on single-document extraction"
```

---

### Task 2: CSV run creation resolves an explicit revision

**Files:**
- Modify: `packages/api-contracts/src/agents/agent-csv-extraction-runs/agent-csv-extraction-runs.dto.ts:70-73`
- Modify: `apps/api/src/domains/agents/csv-extraction-runs/agent-csv-extraction-runs.controller.ts:75-98`
- Test: `apps/api/src/domains/agents/csv-extraction-runs/e2e-tests/create-one.spec.ts`

**Interfaces:**
- Consumes: `AgentSettingsService.get` and `getLast` as in Task 1. `createCsvExtractionRunContext({ repositories, auth0Id, role? })` from `./csv-extraction-run.helpers`, where `role` is `"owner" | "admin" | "member"`.
- Produces: `CreateAgentCsvExtractionRunRequestDto` with `agentSettingsRevision?: number`, consumed by Task 5.

CSV runs carry no playground/live discriminator, so the gate is the caller's project role. Project admins and owners are exactly the people who can list versions at all, since `AgentSettingsController.getAll` sits behind `policy.canUpdate()`.

- [ ] **Step 1: Widen the contract**

In `packages/api-contracts/src/agents/agent-csv-extraction-runs/agent-csv-extraction-runs.dto.ts`, replace `CreateAgentCsvExtractionRunRequestDto`:

```ts
export type CreateAgentCsvExtractionRunRequestDto = {
  csvDocumentId: string
  columnSchema: AgentCsvExtractionRunColumnSchemaDto
  /** Settings version to pin the run to. Project admins and owners only. */
  agentSettingsRevision?: number
}
```

- [ ] **Step 2: Write the failing tests**

In `apps/api/src/domains/agents/csv-extraction-runs/e2e-tests/create-one.spec.ts`, add these imports to the existing list:

```ts
import type { ProjectMembershipRoleDto } from "@caseai-connect/api-contracts"
import { agentSettingsFactory } from "@/domains/agents/settings/agent.settings.factory"
```

Replace `createContext` and `subject`, then append the new cases:

```ts
  let context: Awaited<ReturnType<typeof createCsvExtractionRunContext>>

  const createContext = async (role: ProjectMembershipRoleDto = "owner") => {
    context = await createCsvExtractionRunContext({ repositories, auth0Id, role })
    organizationId = context.organization.id
    projectId = context.project.id
    agentId = context.agent.id
    csvDocumentId = context.csvDocument.id
    auth0Id = context.user.auth0Id
  }

  const seedRevision = async ({
    revision,
    isDraft = false,
    isArchived = false,
  }: {
    revision: number
    isDraft?: boolean
    isArchived?: boolean
  }) => {
    const settings = agentSettingsFactory
      .transient({
        organization: context.organization,
        project: context.project,
        agent: context.agent,
      })
      .build({ revision, isDraft, isArchived })
    await repositories.agentSettingsRepository.save(settings)
    return settings
  }

  const subject = async (agentSettingsRevision?: number) =>
    request({
      route: AgentCsvExtractionRunsRoutes.createOne,
      pathParams: removeNullish({ organizationId, projectId, agentId }),
      token: accessToken,
      request: { payload: { csvDocumentId, columnSchema, agentSettingsRevision } },
    })
```

Append after the existing `it("creates a pending run and persists it", ...)`:

```ts
  it("pins the run to the draft when an admin asks for its revision", async () => {
    await createContext("admin")
    const draft = await seedRevision({ revision: 2, isDraft: true })

    const response = await subject(2)

    expectResponse(response, 201)
    expect(response.body.data.agentSettingsId).toBe(draft.id)
  })

  it("pins the run to the published version when no revision is asked for", async () => {
    await createContext()
    await seedRevision({ revision: 2, isDraft: true })

    const response = await subject()

    expectResponse(response, 201)
    expect(response.body.data.agentSettingsId).toBe(context.agentSettings.id)
  })

  it("returns 403 when a plain member asks for a revision", async () => {
    // Only the roles that can list the versions may choose one. A member creating a run keeps
    // getting the published version.
    await createContext("member")
    await seedRevision({ revision: 2, isDraft: true })

    expectResponse(await subject(2), 403)
  })

  it("returns 404 for a revision the agent does not have", async () => {
    await createContext()

    expectResponse(await subject(9), 404)
  })

  it("returns 422 for an archived revision", async () => {
    await createContext()
    await seedRevision({ revision: 2, isArchived: true })

    expectResponse(await subject(2), 422)
  })

  it("rejects a revision that is not an integer", async () => {
    await createContext()

    const response = await request({
      route: AgentCsvExtractionRunsRoutes.createOne,
      pathParams: removeNullish({ organizationId, projectId, agentId }),
      token: accessToken,
      request: {
        payload: { csvDocumentId, columnSchema, agentSettingsRevision: "2" },
      } as unknown as typeof AgentCsvExtractionRunsRoutes.createOne.request,
    })

    expectResponse(response, 403)
  })
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd apps/api && node --experimental-vm-modules ../../node_modules/.bin/jest src/domains/agents/csv-extraction-runs/e2e-tests/create-one.spec.ts`
Expected: FAIL. The draft case pins the published version, and the 403/404/422 cases return 201.

- [ ] **Step 4: Resolve and gate the revision in the controller**

In `apps/api/src/domains/agents/csv-extraction-runs/agent-csv-extraction-runs.controller.ts`, add to the existing `@nestjs/common` import: `ForbiddenException`, `NotFoundException`, `UnprocessableEntityException`. Add these type imports:

```ts
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import type { AgentSettings } from "@/domains/agents/settings/agent-settings.entity"
```

Replace the body of `createOne`:

```ts
  async createOne(
    @Req() request: EndpointRequestWithAgent,
    @Body() { payload }: typeof AgentCsvExtractionRunsRoutes.createOne.request,
  ): Promise<typeof AgentCsvExtractionRunsRoutes.createOne.response> {
    const connectScope = getRequiredConnectScope(request)
    const agentSettings = await this.resolveAgentSettings({
      connectScope,
      agentId: request.agent.id,
      role: request.projectMembership?.role,
      revision: payload.agentSettingsRevision,
    })
    const run = await this.agentCsvExtractionRunsService.createRun({
      connectScope,
      fields: {
        agentId: request.agent.id,
        agentSettingsId: agentSettings.id,
        csvDocumentId: payload.csvDocumentId,
        columnSchema: payload.columnSchema,
      },
    })
    run.agentSettings = agentSettings
    return { data: toAgentCsvExtractionRunDto(run) }
  }

  /**
   * Settings the run is pinned to.
   *
   * A CSV run has no playground/live distinction to branch on, so choosing a version is gated on
   * the caller's project role instead. Admins and owners are exactly the roles that can list the
   * versions, since the settings history endpoint sits behind the same check. Everyone else keeps
   * getting the newest published revision.
   */
  private async resolveAgentSettings({
    connectScope,
    agentId,
    role,
    revision,
  }: {
    connectScope: RequiredConnectScope
    agentId: string
    role: string | undefined
    revision: number | undefined
  }): Promise<AgentSettings> {
    if (revision === undefined) {
      return this.agentSettingsService.getLast({ connectScope, agentId })
    }
    if (!Number.isInteger(revision)) {
      throw new ForbiddenException("Settings version must be an integer")
    }
    if (role !== "admin" && role !== "owner") {
      throw new ForbiddenException("Choosing a settings version requires managing the agent")
    }

    const agentSettings = await this.agentSettingsService.get({ connectScope, agentId, revision })
    if (!agentSettings) {
      throw new NotFoundException(`Version ${revision} not found for agent ${agentId}`)
    }
    if (agentSettings.isArchived) {
      throw new UnprocessableEntityException(`Version ${revision} is archived and cannot be run`)
    }
    return agentSettings
  }
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd apps/api && node --experimental-vm-modules ../../node_modules/.bin/jest src/domains/agents/csv-extraction-runs/e2e-tests/create-one.spec.ts`
Expected: PASS, 7 tests.

- [ ] **Step 6: Typecheck and commit**

```bash
npm run biome:check
cd apps/api && npx tsc --noEmit && cd ../..
git add packages/api-contracts/src/agents/agent-csv-extraction-runs/agent-csv-extraction-runs.dto.ts apps/api/src/domains/agents/csv-extraction-runs
git commit -m "feat(extraction): run a chosen settings version on CSV batch extraction"
```

---

### Task 3: CSV retry reuses the run's pinned version

**Files:**
- Modify: `apps/api/src/domains/agents/csv-extraction-runs/agent-csv-extraction-runs.controller.ts:120-145` (the `retryOne` handler)
- Test: `apps/api/src/domains/agents/csv-extraction-runs/e2e-tests/retry-one.spec.ts`

**Interfaces:**
- Consumes: `AgentCsvExtractionRunsService.retryRun({ agentCsvExtractionRun, connectScope, agent, agentSettings })`, unchanged.
- Produces: nothing new. This is a behaviour fix.

`retryOne` currently calls `getLast` and enqueues records against the newest published version, while the run row keeps its original `agentSettingsId`. That makes a retried draft run silently become a published run.

- [ ] **Step 1: Write the failing test**

In `apps/api/src/domains/agents/csv-extraction-runs/e2e-tests/retry-one.spec.ts`, add this import:

```ts
import { agentSettingsFactory } from "@/domains/agents/settings/agent.settings.factory"
```

Change `createContext` to keep the context around, and append the new case:

```ts
  let context: Awaited<ReturnType<typeof createCsvExtractionRunContext>>

  const createContext = async () => {
    context = await createCsvExtractionRunContext({ repositories, auth0Id })
    const run = await createCsvExtractionRun({ repositories, context, status: "failed" })

    const erroredRecord = agentCsvExtractionRunRecordFactory
      .transient({
        organization: context.organization,
        project: context.project,
        agentCsvExtractionRun: run,
      })
      .build({ status: "error", rowIndex: 0, errorDetails: "boom" })
    await repositories.agentCsvExtractionRunRecordRepository.save(erroredRecord)

    organizationId = context.organization.id
    projectId = context.project.id
    agentId = context.agent.id
    agentCsvExtractionRunId = run.id
    auth0Id = context.user.auth0Id
  }
```

Append after the existing cases:

```ts
  it("re-enqueues against the version the run was pinned to, not the newest published one", async () => {
    // Otherwise retrying a run started on an older or draft version silently promotes it to the
    // latest published version, and the run's own revision badge stops being true.
    await createContext()
    const newer = agentSettingsFactory
      .transient({
        organization: context.organization,
        project: context.project,
        agent: context.agent,
      })
      .build({ revision: 2 })
    await repositories.agentSettingsRepository.save(newer)

    expectResponse(await subject(), 201)

    expect(mockBatchService.retryRunRecords).toHaveBeenCalledTimes(1)
    const [payloads] = mockBatchService.retryRunRecords.mock.calls[0]
    expect(payloads[0].agentWithSettings.agentSettings.id).toBe(context.agentSettings.id)
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/api && node --experimental-vm-modules ../../node_modules/.bin/jest src/domains/agents/csv-extraction-runs/e2e-tests/retry-one.spec.ts`
Expected: FAIL, the enqueued settings id is the newer revision's rather than the pinned one.

If the assertion path `agentWithSettings.agentSettings.id` does not match what `toAgentWithSettingsRunJobPayload` produces, read `apps/api/src/domains/agents/csv-extraction-runs/` for the payload shape and assert on the equivalent field. Do not weaken the assertion to "was called".

- [ ] **Step 3: Add `getById` to the settings service**

`AgentSettingsService` has no by-id lookup yet. Add one directly above `get` in `apps/api/src/domains/agents/settings/agent-settings.service.ts`, mirroring how `AgentCsvExtractionRunStarterService` already loads run settings. `NotFoundException` and `RequiredConnectScope` are already imported in that file, and `this.agentSettingsConnectRepository` is already constructed.

```ts
  /** The exact settings row a run was pinned to, so a re-run uses the version it advertises. */
  async getById({
    connectScope,
    agentSettingsId,
  }: {
    connectScope: RequiredConnectScope
    agentSettingsId: string
  }): Promise<AgentSettings> {
    const found = await this.agentSettingsConnectRepository.getOneById(
      connectScope,
      agentSettingsId,
    )
    if (!found) throw new NotFoundException(`AgentSettings with id ${agentSettingsId} not found`)
    return found
  }
```

- [ ] **Step 4: Load the run's own settings on retry**

In `retryOne`, replace the `getLast` call:

```ts
    const agentSettings = await this.agentSettingsService.getLast({
      connectScope,
      agentId: agent.id,
    })
```

with a load of the run's pinned settings:

```ts
    // The run advertises its own revision, so a retry must use that one. Re-resolving the newest
    // published version here would silently change what a retried run executes.
    const agentSettings = await this.agentSettingsService.getById({
      connectScope,
      agentSettingsId: agentCsvExtractionRun.agentSettingsId,
    })
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd apps/api && node --experimental-vm-modules ../../node_modules/.bin/jest src/domains/agents/csv-extraction-runs/e2e-tests/retry-one.spec.ts`
Expected: PASS, 3 tests.

- [ ] **Step 6: Typecheck and commit**

```bash
npm run biome:check
cd apps/api && npx tsc --noEmit && cd ../..
git add apps/api/src/domains/agents/csv-extraction-runs apps/api/src/domains/agents/settings
git commit -m "fix(extraction): retry a CSV run with the version it was pinned to"
```

---

### Task 4: Web state and the single-document thunk

**Files:**
- Modify: `apps/web/src/common/features/agents/agent-settings/agent-settings.slice.ts`
- Modify: `apps/web/src/common/features/agents/agent-settings/agent-settings.selectors.ts`
- Modify: `apps/web/src/common/features/agents/agent-sessions/extraction/extraction-agent-sessions.spi.ts:20-26`
- Modify: `apps/web/src/common/features/agents/agent-sessions/extraction/external/extraction-agent-sessions.api.ts:33-42`
- Modify: `apps/web/src/common/features/agents/agent-sessions/extraction/extraction-agent-sessions.thunks.ts:52-87`
- Test: `apps/web/src/common/features/agents/agent-sessions/extraction/extraction-agent-sessions.thunks.spec.ts` (create)

**Interfaces:**
- Consumes: `ExtractionAgentSessionsRoutes.executeOne` payload from Task 1. `resolveEffectiveRevision({ versions, chosenRevision }): number | undefined` from `agent-settings.functions.ts`.
- Produces:
  - `agentSettingsActions.setExtractionRevision({ agentId: string, revision: number })`
  - `selectPlaygroundRevision({ agentId: string })` returning `number | undefined`
  - `State.extractionRevisionByAgentId: Record<string, number>` on the `agentSettings` slice

  All three are consumed by Tasks 5, 7 and 8.

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/common/features/agents/agent-sessions/extraction/extraction-agent-sessions.thunks.spec.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest"
import { agentFactory } from "@/common/features/agents/agent.factory"
import { agentSettingsFactory } from "@/common/features/agents/agent-settings/agent-settings.factory"
import { organizationFactory } from "@/common/features/organizations/organization.factory"
import { projectFactory } from "@/common/features/projects/projects.factory"
import type { RootState } from "@/common/store"
import { ADS } from "@/common/store/async-data-status"
import type { Services } from "@/di/services"
import { documentFactory } from "@/studio/features/documents/documents.factory"
import { isStudioInterface } from "@/studio/routes/helpers"
import { extractionAgentSessionsThunks } from "./extraction-agent-sessions.thunks"

// `isStudioInterface` reads `window.location`, which doesn't exist under vitest's default node
// environment.
vi.mock("@/studio/routes/helpers", () => ({ isStudioInterface: vi.fn() }))

// The documents thunks pull the Auth0 client in transitively, which also needs `window`. The
// thunk under test only reaches them on the file-upload path, which these cases do not take.
vi.mock("@/studio/features/documents/documents.thunks", () => ({ uploadDocument: vi.fn() }))

const mockedIsStudioInterface = vi.mocked(isStudioInterface)

const organizationId = "org-1"
const projectId = "project-1"
const agentId = "agent-1"

const organization = organizationFactory.build({ id: organizationId })
const project = projectFactory.transient({ organization }).build({ id: projectId })
const agent = agentFactory.transient({ project }).build({ id: agentId })
const document = documentFactory.transient({ project }).build({ id: "document-1" })

const executeOne = vi.fn()
const extra = { services: { extractionAgentSessions: { executeOne } } as unknown as Services }

/**
 * A fixture shaped like only the slices the thunk reads, not a full `RootState` — the real type is
 * a many-scope union not meant to be hand-built.
 */
function buildState({
  history = {},
  chosenRevision,
}: {
  history?: Record<string, ReturnType<typeof agentSettingsFactory.build>[]>
  chosenRevision?: number
} = {}): RootState {
  return {
    currentIds: { organizationId, projectId, agentId },
    agentSettings: {
      history: Object.fromEntries(
        Object.entries(history).map(([historyAgentId, versions]) => [
          historyAgentId,
          { status: ADS.Fulfilled, error: null, value: versions },
        ]),
      ),
      playgroundRevisionBySessionId: {},
      extractionRevisionByAgentId:
        chosenRevision === undefined ? {} : { [agentId]: chosenRevision },
    },
  } as unknown as RootState
}

const run = (state: RootState) =>
  extractionAgentSessionsThunks.executeOne({ agentId, document, onSuccess: vi.fn() })(
    vi.fn(),
    () => state,
    extra,
  )

beforeEach(() => {
  vi.clearAllMocks()
  executeOne.mockResolvedValue({ runId: "run-1" })
})

describe("executeOne", () => {
  it("carries the chosen revision in Studio", async () => {
    mockedIsStudioInterface.mockReturnValue(true)
    const versions = [agentSettingsFactory.transient({ agent }).build({ revision: 2 })]

    await run(buildState({ history: { [agentId]: versions }, chosenRevision: 2 }))

    expect(executeOne).toHaveBeenCalledWith(
      expect.objectContaining({ agentSettingsRevision: 2, type: "playground" }),
    )
  })

  it("defaults to the draft when no version was chosen", async () => {
    mockedIsStudioInterface.mockReturnValue(true)
    const versions = [
      agentSettingsFactory.transient({ agent }).build({ revision: 2, isDraft: true }),
      agentSettingsFactory.transient({ agent }).build({ revision: 1 }),
    ]

    await run(buildState({ history: { [agentId]: versions } }))

    expect(executeOne).toHaveBeenCalledWith(expect.objectContaining({ agentSettingsRevision: 2 }))
  })

  it("forwards no revision outside Studio even when one is chosen", async () => {
    mockedIsStudioInterface.mockReturnValue(false)
    const versions = [agentSettingsFactory.transient({ agent }).build({ revision: 2 })]

    await run(buildState({ history: { [agentId]: versions }, chosenRevision: 2 }))

    expect(executeOne).toHaveBeenCalledWith(
      expect.objectContaining({ agentSettingsRevision: undefined, type: "live" }),
    )
  })

  it("forwards no revision while the settings history has not loaded", async () => {
    mockedIsStudioInterface.mockReturnValue(true)

    await run(buildState())

    expect(executeOne).toHaveBeenCalledWith(
      expect.objectContaining({ agentSettingsRevision: undefined }),
    )
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/web && npx vitest run src/common/features/agents/agent-sessions/extraction/extraction-agent-sessions.thunks.spec.ts`
Expected: FAIL, `executeOne` is called without `agentSettingsRevision`.

- [ ] **Step 3: Add the slice field and action**

In `apps/web/src/common/features/agents/agent-settings/agent-settings.slice.ts`, extend `State`, `initialState` and `reducers`:

```ts
interface State {
  history: DataType
  /**
   * Version the playground runs, per session. Deliberately not persisted: a reload starts over
   * from the draft-first default, which is the version a tester wants nine times out of ten.
   */
  playgroundRevisionBySessionId: Record<string, number>
  /**
   * Version an extraction runs, per agent. Keyed by agent rather than by session because the
   * choice is made before any run exists. Not persisted, for the same reason as above.
   */
  extractionRevisionByAgentId: Record<string, number>
}

const initialState: State = {
  history: {},
  playgroundRevisionBySessionId: {},
  extractionRevisionByAgentId: {},
}
```

and, next to `setPlaygroundRevision`:

```ts
    setExtractionRevision: (
      state,
      action: PayloadAction<{ agentId: string; revision: number }>,
    ) => {
      state.extractionRevisionByAgentId[action.payload.agentId] = action.payload.revision
    },
```

- [ ] **Step 4: Add the selector**

In `apps/web/src/common/features/agents/agent-settings/agent-settings.selectors.ts`, next to `selectPlaygroundRevisions`:

```ts
const selectExtractionRevisions = (state: RootState) =>
  state.agentSettings.extractionRevisionByAgentId
```

and at the end of the file:

```ts
/**
 * Revision an extraction run is started with for this agent. Keyed by agent because the choice is
 * made before a run exists. `undefined` while the history is still loading — callers must then
 * send no revision and let the API apply its own draft-first default.
 */
export const selectPlaygroundRevision = ({ agentId }: { agentId: string }) =>
  createSelector(
    [selectAgentSettingsHistoryData, selectExtractionRevisions],
    (history, revisionByAgentId): number | undefined => {
      const agentHistory = history[agentId]
      if (!agentHistory || !ADS.isFulfilled(agentHistory)) return undefined

      return resolveEffectiveRevision({
        versions: agentHistory.value,
        chosenRevision: revisionByAgentId[agentId],
      })
    },
  )
```

- [ ] **Step 5: Thread the revision through the SPI, API and thunk**

In `extraction-agent-sessions.spi.ts`, widen `executeOne`:

```ts
  executeOne: (
    params: BaseParams & {
      documentId: string
      agentSettingsRevision?: number
    },
  ) => Promise<ExtractionAgentSessionResult>
```

In `external/extraction-agent-sessions.api.ts`, replace `executeOne`:

```ts
  executeOne: async ({ documentId, type, agentSettingsRevision, ...params }) => {
    const axios = getAxiosInstance()
    const response = await axios.post<typeof ExtractionAgentSessionsRoutes.executeOne.response>(
      ExtractionAgentSessionsRoutes.executeOne.getPath(params),
      {
        payload: { documentId, type, agentSettingsRevision },
      } satisfies typeof ExtractionAgentSessionsRoutes.executeOne.request,
    )
    return fromExtractionAgentSessionResultDto(response.data.data)
  },
```

In `extraction-agent-sessions.thunks.ts`, add the import:

```ts
import { selectPlaygroundRevision } from "@/common/features/agents/agent-settings/agent-settings.selectors"
```

and replace the tail of `executeOne`:

```ts
    const organizationId = getCurrentId({ state, name: "organizationId" })
    const projectId = getCurrentId({ state, name: "projectId" })
    const agentId = getCurrentId({ state, name: "agentId" })

    // Only Studio may name a version; a Desk run is a live run and the API rejects a revision on
    // one. `undefined` while the history is loading, which lets the API apply its own default.
    const agentSettingsRevision = isStudio
      ? selectPlaygroundRevision({ agentId })(state)
      : undefined

    return await services.extractionAgentSessions.executeOne({
      organizationId,
      projectId,
      agentId,
      documentId: document.id,
      type: isStudio ? "playground" : "live",
      agentSettingsRevision,
    })
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cd apps/web && npx vitest run src/common/features/agents/agent-sessions/extraction/extraction-agent-sessions.thunks.spec.ts`
Expected: PASS, 4 tests.

- [ ] **Step 7: Typecheck and commit**

```bash
npm run biome:check
cd apps/web && npx tsc --noEmit && cd ../..
git add apps/web/src/common/features/agents/agent-settings apps/web/src/common/features/agents/agent-sessions/extraction
git commit -m "feat(extraction): send the chosen settings version on single-document runs"
```

---

### Task 5: CSV thunk sends the chosen version

**Files:**
- Modify: `apps/web/src/common/features/agents/csv-extraction-runs/agent-csv-extraction-runs.spi.ts:10-19`
- Modify: `apps/web/src/common/features/agents/csv-extraction-runs/external/agent-csv-extraction-runs.api.ts:15-22`
- Modify: `apps/web/src/common/features/agents/csv-extraction-runs/agent-csv-extraction-runs.thunks.ts:84-113`
- Test: `apps/web/src/common/features/agents/csv-extraction-runs/agent-csv-extraction-runs.thunks.spec.ts` (create)

**Interfaces:**
- Consumes: `CreateAgentCsvExtractionRunRequestDto.agentSettingsRevision` (Task 2), `selectPlaygroundRevision({ agentId })` (Task 4).
- Produces: nothing new.

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/common/features/agents/csv-extraction-runs/agent-csv-extraction-runs.thunks.spec.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest"
import { agentFactory } from "@/common/features/agents/agent.factory"
import { agentSettingsFactory } from "@/common/features/agents/agent-settings/agent-settings.factory"
import { organizationFactory } from "@/common/features/organizations/organization.factory"
import { projectFactory } from "@/common/features/projects/projects.factory"
import type { RootState } from "@/common/store"
import { ADS } from "@/common/store/async-data-status"
import type { Services } from "@/di/services"
import { isStudioInterface } from "@/studio/routes/helpers"
import { agentCsvExtractionRunsThunks } from "./agent-csv-extraction-runs.thunks"

vi.mock("@/studio/routes/helpers", () => ({ isStudioInterface: vi.fn() }))

const mockedIsStudioInterface = vi.mocked(isStudioInterface)

const organizationId = "org-1"
const projectId = "project-1"
const agentId = "agent-1"

const organization = organizationFactory.build({ id: organizationId })
const project = projectFactory.transient({ organization }).build({ id: projectId })
const agent = agentFactory.transient({ project }).build({ id: agentId })

const createOne = vi.fn()
const executeOne = vi.fn()
const extra = {
  services: { agentCsvExtractionRuns: { createOne, executeOne } } as unknown as Services,
}

const columnSchema = {
  "col-title": {
    id: "col-title",
    originalName: "title",
    finalName: "title",
    role: "input" as const,
    index: 0,
  },
}

function buildState({
  history = {},
  chosenRevision,
}: {
  history?: Record<string, ReturnType<typeof agentSettingsFactory.build>[]>
  chosenRevision?: number
} = {}): RootState {
  return {
    currentIds: { organizationId, projectId, agentId },
    agentSettings: {
      history: Object.fromEntries(
        Object.entries(history).map(([historyAgentId, versions]) => [
          historyAgentId,
          { status: ADS.Fulfilled, error: null, value: versions },
        ]),
      ),
      playgroundRevisionBySessionId: {},
      extractionRevisionByAgentId:
        chosenRevision === undefined ? {} : { [agentId]: chosenRevision },
    },
  } as unknown as RootState
}

const run = (state: RootState) =>
  agentCsvExtractionRunsThunks.createAndExecute({
    agentId,
    documentId: "document-1",
    columnSchema,
    recordLimit: null,
    onSuccess: vi.fn(),
  })(vi.fn(), () => state, extra)

beforeEach(() => {
  vi.clearAllMocks()
  createOne.mockResolvedValue({ id: "run-1" })
  executeOne.mockResolvedValue({ id: "run-1" })
})

describe("createAndExecute", () => {
  it("carries the chosen revision in Studio", async () => {
    mockedIsStudioInterface.mockReturnValue(true)
    const versions = [agentSettingsFactory.transient({ agent }).build({ revision: 2 })]

    await run(buildState({ history: { [agentId]: versions }, chosenRevision: 2 }))

    expect(createOne).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ agentSettingsRevision: 2 }),
      }),
    )
  })

  it("defaults to the draft when no version was chosen", async () => {
    mockedIsStudioInterface.mockReturnValue(true)
    const versions = [
      agentSettingsFactory.transient({ agent }).build({ revision: 2, isDraft: true }),
      agentSettingsFactory.transient({ agent }).build({ revision: 1 }),
    ]

    await run(buildState({ history: { [agentId]: versions } }))

    expect(createOne).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ agentSettingsRevision: 2 }),
      }),
    )
  })

  it("forwards no revision outside Studio", async () => {
    mockedIsStudioInterface.mockReturnValue(false)
    const versions = [agentSettingsFactory.transient({ agent }).build({ revision: 2 })]

    await run(buildState({ history: { [agentId]: versions }, chosenRevision: 2 }))

    expect(createOne).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ agentSettingsRevision: undefined }),
      }),
    )
  })

  it("forwards no revision while the settings history has not loaded", async () => {
    mockedIsStudioInterface.mockReturnValue(true)

    await run(buildState())

    expect(createOne).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ agentSettingsRevision: undefined }),
      }),
    )
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/web && npx vitest run src/common/features/agents/csv-extraction-runs/agent-csv-extraction-runs.thunks.spec.ts`
Expected: FAIL, `createOne` is called without `agentSettingsRevision`.

- [ ] **Step 3: Thread the revision through the SPI, API and thunk**

In `agent-csv-extraction-runs.spi.ts`, widen `createOne`:

```ts
  createOne(
    params: BaseParams & {
      payload: {
        csvDocumentId: string
        columnSchema: AgentCsvExtractionRunColumnSchemaDto
        agentSettingsRevision?: number
      }
    },
  ): Promise<AgentCsvExtractionRun>
```

`external/agent-csv-extraction-runs.api.ts` forwards `payload` wholesale already, so it needs no change.

In `agent-csv-extraction-runs.thunks.ts`, add the imports:

```ts
import { selectPlaygroundRevision } from "@/common/features/agents/agent-settings/agent-settings.selectors"
import { isStudioInterface } from "@/studio/routes/helpers"
```

and replace the body of `createAndExecute`:

```ts
  async (
    { documentId, columnSchema, recordLimit, onSuccess },
    { extra: { services }, getState },
  ) => {
    const state = getState()
    const params = getBaseParams(state)
    // Only Studio may name a version; the API rejects a revision from anyone who cannot manage
    // the agent. `undefined` while the history is loading, so the API applies its own default.
    const agentSettingsRevision = isStudioInterface()
      ? selectPlaygroundRevision({ agentId: params.agentId })(state)
      : undefined

    const run = await services.agentCsvExtractionRuns.createOne({
      ...params,
      payload: { csvDocumentId: documentId, columnSchema, agentSettingsRevision },
    })
    await services.agentCsvExtractionRuns.executeOne({
      ...params,
      agentCsvExtractionRunId: run.id,
      recordLimit,
    })
    onSuccess(run.id)
    return run
  },
```

`getBaseParams` currently takes `getState()` at the call site; keep it taking a `RootState` and pass the captured `state`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd apps/web && npx vitest run src/common/features/agents/csv-extraction-runs/agent-csv-extraction-runs.thunks.spec.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Typecheck and commit**

```bash
npm run biome:check
cd apps/web && npx tsc --noEmit && cd ../..
git add apps/web/src/common/features/agents/csv-extraction-runs
git commit -m "feat(extraction): send the chosen settings version on CSV batch runs"
```

---

### Task 6: Make the version select presentational

**Files:**
- Modify: `apps/web/src/studio/features/agents/agent-settings/components/AgentSettingsVersionSelect.tsx`
- Create: `apps/web/src/studio/features/agents/agent-settings/components/PlaygroundVersionSelect.tsx`
- Modify: `apps/web/src/studio/routes/StudioAgentSessionRoute.tsx:28,124-130`
- Modify: `apps/web/src/common/features/agents/agent-settings/locales/agent-settings.en.json:156-161`
- Modify: `apps/web/src/common/features/agents/agent-settings/locales/agent-settings.fr.json:156-161`

**Interfaces:**
- Consumes: `agentSettingsActions.setPlaygroundRevision` (existing), `selectStreaming` (existing).
- Produces:
  - `AgentSettingsVersionSelect({ agentId, revision, ariaLabel, onChange, disabled })` where `onChange: (revision: number) => void` and `disabled?: boolean`
  - `PlaygroundVersionSelect({ agentId, agentSessionId, revision })`

  Both consumed by Task 7.

The select keeps reading the version list, the `canManageAgent` check and the "fewer than two versions" early return for itself, because both call sites want the same answer from those. Only the value, the change handler, the disabled flag and the aria label move out.

- [ ] **Step 1: Add the extraction aria label**

In `agent-settings.en.json`, inside `agentSettings.version`:

```json
    "version": {
      "ariaLabel": "Settings version new messages run with",
      "extractionAriaLabel": "Settings version extractions run with",
      "placeholder": "Select a version",
      "item": "v{{revision}} — {{detail}}",
      "current": "Current ({{date}})"
    },
```

In `agent-settings.fr.json`:

```json
    "version": {
      "ariaLabel": "Version des paramètres utilisée par les nouveaux messages",
      "extractionAriaLabel": "Version des paramètres utilisée par les extractions",
      "placeholder": "Sélectionner une version",
      "item": "v{{revision}} — {{detail}}",
      "current": "Actuelle ({{date}})"
    },
```

- [ ] **Step 2: Make the select presentational**

In `AgentSettingsVersionSelect.tsx`, drop the `selectStreaming`, `agentSettingsActions`, `useAppDispatch` and `useAppSelector` imports, and replace the doc comment, signature and handler:

```tsx
/**
 * Which settings version a surface runs with. Presentational: the caller owns the value, the
 * change handler and the disabled flag, so the playground and the extraction screens can each
 * store their choice where it belongs.
 *
 * The draft is called out twice over — the trigger reads "v7 — Draft" and turns amber — because a
 * bare version number is not enough to stop someone demoing an unpublished agent to a client by
 * accident (issue #622).
 *
 * Items carry the version name under the label, as the version history does, so versions are
 * recognisable by what they changed and not only by their number.
 *
 * `versions` is the history list, newest first and already free of archived revisions: the history
 * endpoint omits them, so an archived version is never offered here.
 */
export function AgentSettingsVersionSelect({
  agentId,
  revision,
  ariaLabel,
  onChange,
  disabled = false,
}: {
  agentId: string
  revision: number | undefined
  ariaLabel: string
  onChange: (revision: number) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const { abilities } = useAbility()
  const canManageAgent = abilities.canManageAgent({ agentId })

  const versions = useValue(
    selectAgentSettingsHistoryDataByAgentId({ agentId, includeDraft: true }),
  )

  if (!canManageAgent || versions.length < 2) {
    return null
  }
```

Delete the local `const isStreaming`, `const disabled` and `handleRevisionChange` lines. In the JSX, replace the `Select` props and the aria label:

```tsx
    <Select
      value={revision !== undefined ? String(revision) : undefined}
      onValueChange={(value) => {
        const parsed = Number.parseInt(value, 10)
        if (!Number.isNaN(parsed)) onChange(parsed)
      }}
      disabled={disabled || versions.length < 2}
    >
      <SelectTrigger
        size="sm"
        aria-label={ariaLabel}
```

The rest of the JSX is unchanged.

- [ ] **Step 3: Add the playground wrapper**

Create `apps/web/src/studio/features/agents/agent-settings/components/PlaygroundVersionSelect.tsx`:

```tsx
import { selectStreaming } from "@/common/features/agents/agent-sessions/shared/agent-session-messages/agent-session-messages.selectors"
import { agentSettingsActions } from "@/common/features/agents/agent-settings/agent-settings.slice"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { useTranslation } from "react-i18next"
import { AgentSettingsVersionSelect } from "./AgentSettingsVersionSelect"

/**
 * The playground's version picker. Locked while a reply is streaming, since switching mid-answer
 * would misattribute the reply to the version the picker ends up showing.
 */
export function PlaygroundVersionSelect({
  agentId,
  agentSessionId,
  revision,
}: {
  agentId: string
  agentSessionId: string
  revision: number | undefined
}) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const isStreaming = useAppSelector(selectStreaming)

  return (
    <AgentSettingsVersionSelect
      agentId={agentId}
      revision={revision}
      ariaLabel={t("agentSettings:version.ariaLabel")}
      disabled={isStreaming}
      onChange={(nextRevision) =>
        dispatch(agentSettingsActions.setPlaygroundRevision({ agentSessionId, revision: nextRevision }))
      }
    />
  )
}
```

- [ ] **Step 4: Point the playground route at the wrapper**

In `StudioAgentSessionRoute.tsx`, replace the import on line 28:

```tsx
import { PlaygroundVersionSelect } from "@/studio/features/agents/agent-settings/components/PlaygroundVersionSelect"
```

and the `renderVersionSelect` prop:

```tsx
          renderVersionSelect={
            <PlaygroundVersionSelect
              agentId={agent.id}
              agentSessionId={agentSession.id}
              revision={runningRevision}
            />
          }
```

- [ ] **Step 5: Verify the playground picker still works**

`apps/web`'s test script is `vitest run`, which does not execute `.stories.tsx`, so the story is checked by the compiler and by eye.

Run: `cd apps/web && npx tsc --noEmit`
Expected: no errors. A missed call site shows up here, since `ariaLabel` and `onChange` are required props.

Then run `npm run storybook`, open `routes/studio/project/agent/session` with `withPendingDraft` on, and confirm the picker still reads amber "v2 — Draft", switching versions still sticks, and it is disabled while a reply streams.

- [ ] **Step 6: Commit**

```bash
npm run biome:check
cd apps/web && npx tsc --noEmit && cd ../..
git add apps/web/src/studio/features/agents/agent-settings/components apps/web/src/studio/routes/StudioAgentSessionRoute.tsx apps/web/src/common/features/agents/agent-settings/locales
git commit -m "refactor(playground): make the settings version select presentational"
```

---

### Task 7: Mount the picker on both extraction screens

**Files:**
- Create: `apps/web/src/studio/features/agents/agent-settings/components/ExtractionVersionSelect.tsx`
- Modify: `apps/web/src/common/routes/agents/extraction/AgentExtractionRoute.tsx`
- Modify: `apps/web/src/common/features/agents/csv-extraction-runs/components/CsvExtractor.tsx`
- Modify: `apps/web/src/studio/routes/StudioRoutes.tsx:160-165`
- Modify: `apps/web/src/desk/routes/DeskRoutes.tsx`
- Modify: `apps/web/src/stories/seed.ts:354-368`
- Create: `apps/web/src/stories/routes/studio/agent/AgentExtractionRoute.stories.tsx`

**Interfaces:**
- Consumes: `AgentSettingsVersionSelect` and its props (Task 6), `selectPlaygroundRevision` and `agentSettingsActions.setExtractionRevision` (Task 4).
- Produces:
  - `ExtractionVersionSelect({ agentId })`
  - `AgentExtractionRoute({ buildCsvRunPath, renderVersionPicker? })` where `renderVersionPicker?: React.ReactNode`
  - `CsvExtractor({ documentId, onBack, buildCsvRunPath, renderVersionPicker? })`
  - `seed.studio.playgroundRevision({ agentId, revision })`

Both route files live in `common/` and are shared with Desk, so the picker arrives by prop injection, the way `renderRevisionBadge` already does. Desk passes nothing and keeps running published.

- [ ] **Step 1: Add the extraction wrapper**

Create `apps/web/src/studio/features/agents/agent-settings/components/ExtractionVersionSelect.tsx`:

```tsx
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { selectPlaygroundRevision } from "@/common/features/agents/agent-settings/agent-settings.selectors"
import { agentSettingsActions } from "@/common/features/agents/agent-settings/agent-settings.slice"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import { AgentSettingsVersionSelect } from "./AgentSettingsVersionSelect"

/**
 * The extraction screens' version picker. Keyed by agent rather than by session, because the
 * choice is made before any run exists, and it drives both the single-document and the CSV fork.
 */
export function ExtractionVersionSelect({ agentId }: { agentId: string }) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const selectRevision = useMemo(() => selectPlaygroundRevision({ agentId }), [agentId])
  const revision = useAppSelector(selectRevision)

  return (
    <AgentSettingsVersionSelect
      agentId={agentId}
      revision={revision}
      ariaLabel={t("agentSettings:version.extractionAriaLabel")}
      onChange={(nextRevision) =>
        dispatch(agentSettingsActions.setExtractionRevision({ agentId, revision: nextRevision }))
      }
    />
  )
}
```

- [ ] **Step 2: Thread the prop through the extraction route**

In `AgentExtractionRoute.tsx`, add `renderVersionPicker` to every hop. Replace the four component signatures and the `GridHeader` action:

```tsx
export function AgentExtractionRoute(props: {
  buildCsvRunPath: BuildAgentExtractionCsvRunRoute
  /** Studio-only version picker; Desk passes nothing and keeps running the published version. */
  renderVersionPicker?: React.ReactNode
}) {
```

Pass `{...props}` through to `WithData` as it already does, then widen `WithData`:

```tsx
function WithData({
  buildCsvRunPath,
  renderVersionPicker,
  agentId,
  csvDocumentId,
  setCsvDocumentId,
}: {
  buildCsvRunPath: BuildAgentExtractionCsvRunRoute
  renderVersionPicker?: React.ReactNode
  agentId: string
  csvDocumentId: string | null
  setCsvDocumentId: (id: string | null) => void
}) {
```

Pass it into both branches:

```tsx
  if (csvDocumentId)
    return (
      <CsvExtractor
        buildCsvRunPath={buildCsvRunPath}
        onBack={() => setCsvDocumentId(null)}
        documentId={csvDocumentId}
        renderVersionPicker={renderVersionPicker}
      />
    )
  return (
    <FileManager
      agentId={agentId}
      renderVersionPicker={renderVersionPicker}
      onCsvSuccess={handleCsvSuccess}
      onExtractionRunSuccess={handleExtractionRunSuccess}
    />
  )
```

and widen `FileManager`, rendering the picker beside the uploader:

```tsx
function FileManager({
  agentId,
  renderVersionPicker,
  onCsvSuccess,
  onExtractionRunSuccess,
}: {
  agentId: string
  renderVersionPicker?: React.ReactNode
  onCsvSuccess: (documentId: string) => void
  onExtractionRunSuccess: (runId: string) => void
}) {
```

```tsx
        action={
          <>
            {renderVersionPicker}
            <FileUploader
              maxFiles={1}
              maxSize={25 * 1024 * 1024} // 25 MB
              allowedMimeTypes={{
                "application/pdf": true,
                "image/jpeg": true,
                "text/csv": true,
                "text/markdown": true,
                "text/plain": true,
              }}
              onDropFiles={(files) => {
                const file = files[0]
                if (!file) return
                handleSubmit({ file })
              }}
            />
          </>
        }
```

`GridHeader`'s `CardAction` already lays its children out with `flex items-center gap-2 flex-wrap`, so no extra wrapper styling is needed.

- [ ] **Step 3: Render the picker on the CSV screen**

In `CsvExtractor.tsx`, widen the signature:

```tsx
export function CsvExtractor({
  documentId,
  onBack,
  buildCsvRunPath,
  renderVersionPicker,
}: {
  onBack: () => void
  documentId: string
  buildCsvRunPath: BuildAgentExtractionCsvRunRoute
  renderVersionPicker?: React.ReactNode
}) {
```

This component's `GridHeader` carries only a title, description and back button; its Run button lives at the bottom of the form, in the `flex justify-end gap-2` row. Put the picker there, immediately left of Run, so it sits beside the action it drives:

```tsx
            <div className="flex justify-end items-center gap-2">
              {renderVersionPicker}
              <Button onClick={handleRun} disabled={isExecuting}>
                {isExecuting
                  ? t("agentCsvExtractionRun:results.running")
                  : t("agentCsvExtractionRun:dialog.run")}
              </Button>
            </div>
```

`items-center` is added so the small select and the button line up.

- [ ] **Step 4: Wire Studio and leave Desk alone**

In `StudioRoutes.tsx`, add the import:

```tsx
import { ExtractionVersionSelect } from "@/studio/features/agents/agent-settings/components/ExtractionVersionSelect"
```

The extraction route element needs the current agent id. It sits under `AgentRoute`, so read it the way the route table's other Studio-only injections do. Replace the element:

```tsx
              element: (
                <AgentExtractionRoute
                  buildCsvRunPath={StudioRoutes.agentExtractionCsvRun.build}
                  renderVersionPicker={<StudioExtractionVersionPicker />}
                />
              ),
```

and add, at the bottom of `StudioRoutes.tsx`:

```tsx
/** Reads the current agent from the store so the route table stays hook-free. */
function StudioExtractionVersionPicker() {
  const agent = useValue(selectCurrentAgentData)
  return <ExtractionVersionSelect agentId={agent.id} />
}
```

with the imports `useValue` from `@/common/hooks/use-value` and `selectCurrentAgentData` from `@/common/features/agents/agents.selectors` if they are not already there.

`DeskRoutes.tsx` needs no change: `renderVersionPicker` is optional and Desk omits it. Confirm the Desk element still typechecks.

- [ ] **Step 5: Add the story seed helper**

In `apps/web/src/stories/seed.ts`, next to `playgroundRevision`:

```ts
    playgroundRevision({
      agentId,
      revision,
    }: {
      agentId: string
      revision: number
    }): StoryPreloadedState {
      return {
        agentSettings: {
          playgroundRevisionByAgentId: { [agentId]: revision },
        },
      }
    },
```

- [ ] **Step 6: Add the route story**

Create `apps/web/src/stories/routes/studio/agent/AgentExtractionRoute.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite"
import { agentFactory } from "@/common/features/agents/agent.factory"
import { agentSettingsFactory } from "@/common/features/agents/agent-settings/agent-settings.factory"
import { documentFactory } from "@/studio/features/documents/documents.factory"
import { buildDecorator, render } from "@/stories/decorators"
import {
  buildStudioData,
  type StudioStoryArgs,
  studioStoryArgs,
  studioStoryArgTypes,
} from "@/stories/routes/studio/helpers"
import { mergeSeeds, seed } from "@/stories/seed"
import { StudioRoutes } from "@/studio/routes/helpers"
import { studioRoutes } from "@/studio/routes/StudioRoutes"

type StoryArgs = StudioStoryArgs & {
  /** Whether the agent has an unpublished draft, which the picker defaults to. */
  withPendingDraft?: boolean
}

const meta = {
  title: "routes/studio/project/agent/extraction",
  parameters: { layout: "fullscreen" },
  argTypes: {
    ...studioStoryArgTypes,
    withAgents: { control: undefined },
    withPendingDraft: { control: "boolean" },
  },
  args: {
    ...studioStoryArgs,
    withAgents: true,
    withPendingDraft: true,
  },
  render: render({ routes: studioRoutes, path: StudioRoutes.agentExtraction.path }),
} satisfies Meta<StoryArgs>

export default meta
type Story = StoryObj<typeof meta>

/** One decorator body for every story; `chosenRevision` is the only thing that varies. */
const buildExtractionDecorator = (chosenRevision?: number) =>
  buildDecorator<StoryArgs>(({ withPendingDraft, ...args }) => {
    const { baseSeeds, project, agents } = buildStudioData(args)
    const [firstAgent, ...restAgents] = agents
    const currentAgent = agentFactory.transient({ project }).build({
      ...firstAgent,
      type: "extraction",
      currentRevision: { number: 1 },
      draftRevision: withPendingDraft ? { number: 2 } : undefined,
    })
    const versions = [
      ...(withPendingDraft
        ? [
            agentSettingsFactory
              .transient({ agent: currentAgent })
              .build({ revision: 2, isDraft: true, name: "Stricter title rules" }),
          ]
        : []),
      agentSettingsFactory.transient({ agent: currentAgent }).build({ revision: 1 }),
    ]
    const document = documentFactory
      .transient({ project })
      .build({ fileName: "sample-report.pdf", mimeType: "application/pdf" })

    return {
      state: mergeSeeds(
        baseSeeds,
        seed.agents([...restAgents, currentAgent], { currentId: currentAgent.id }),
        seed.extractionAgentSessions({
          [currentAgent.id]: { csvSessions: [], others: [] },
        }),
        seed.extractionAgentSessionDocuments([document]),
        seed.studio.agentHistory({ agentId: currentAgent.id, versions }),
        ...(chosenRevision === undefined
          ? []
          : [seed.studio.playgroundRevision({ agentId: currentAgent.id, revision: chosenRevision })]),
      ),
    }
  })

/** No explicit choice, so the picker falls to the draft-first default. */
export const Default: Story = {
  decorators: [buildExtractionDecorator()],
}

/** An explicit choice of the published version wins over the draft default. */
export const PublishedChosen: Story = {
  decorators: [buildExtractionDecorator(1)],
}
```

Both shapes match what already exists: the web `agentSettingsFactory` carries a `name` field, and `draftRevision: withPendingDraft ? { number: N } : undefined` is the exact form `AgentSessionRoute.stories.tsx` uses.

- [ ] **Step 7: Verify**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no errors.

Run: `npx turbo lint`
Expected: pass, including the project's route-story and factory audits.

Open the story with `npm run storybook` and confirm: the picker shows on the New Extraction header reading amber "v2 — Draft", switching to v1 sticks, and dropping a CSV carries the choice onto the CsvExtractor header.

- [ ] **Step 8: Commit**

```bash
npm run biome:check
git add apps/web/src/studio apps/web/src/common/routes/agents/extraction apps/web/src/common/features/agents/csv-extraction-runs/components apps/web/src/stories apps/web/src/desk
git commit -m "feat(extraction): choose the settings version from the extraction screens"
```

---

### Task 8: Changelog and full gates

**Files:**
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: everything above.
- Produces: nothing.

- [ ] **Step 1: Add the changelog entries**

In `CHANGELOG.md`, under `## [Unreleased]` → `### Added`, after the existing Studio extraction line:

```markdown
- Studio extraction agents: a version picker on the New Extraction screen and on the CSV column setup screen chooses which settings version a run uses, listing the draft and the published versions with their names and dates; a run defaults to the draft when the agent has one, so a draft can be tested against a document without publishing it, and the picker turns amber and reads "Draft" so an unpublished version is never run by accident
```

and under `### Fixed`:

```markdown
- Retrying a CSV extraction run now re-runs the records with the settings version the run was started on, instead of silently switching to the latest published version
```

- [ ] **Step 2: Run the full gates**

```bash
npm run biome:check
npm run typecheck
npm run test
```

Expected: all three exit 0. Per the repo's known flakiness, if `test:parallel` reports SIGTERM'd jest workers or the csv-extraction cancel-one case, re-run those specs in isolation before treating them as real failures.

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: changelog entry for the extraction settings version picker"
```

---

## Self-review notes

Spec coverage checked section by section:

- API contract, both payloads: Tasks 1 and 2
- Backend resolution for single-document, all four branches: Task 1
- Backend resolution for CSV including the role gate: Task 2
- CSV retry reusing the pinned settings: Task 3
- Frontend state, slice field, selector, both thunks: Tasks 4 and 5
- UI, presentational select and both mount points, Desk left on published: Tasks 6 and 7
- Testing: Task 1 covers the seven single-document cases, Task 2 the four CSV creation cases plus the member 403, Task 3 the retry case; Tasks 4 and 5 cover the web behaviour, Task 7 the stories
- Out of scope items are restated under Global Constraints

Two deliberate deviations from the spec, both noted where they occur:

1. The spec asks for unit tests on `selectPlaygroundRevision`. The web app has no `*.selectors.spec.ts` anywhere, so the same four cases are covered through the thunk specs instead, matching the pattern `agent-session-messages.thunks.spec.ts` already set for the playground. The pure `resolveEffectiveRevision` underneath is already unit-tested in `agent-settings.functions.spec.ts`.
2. The spec describes one generalised component. The plan adds two thin wrappers around it, because the extraction mount point lives in a route table where hooks cannot be called inline. The presentational component is exactly as the spec describes it.
