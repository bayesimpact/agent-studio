# Agent Settings Version Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface which agent settings revision produced each playground message and which revision the playground currently runs with, in Studio.

**Architecture:** The API exposes the revision already recorded on every `agent_message` row (via its `agent_settings_id` FK) as `agentRevision` on the message DTO. Studio loads the agent settings history at the agent route level so revision names are available, then renders clickable revision badges in the assistant message footer and in the session grid header; both open the existing version history sheet preselected on that revision.

**Tech Stack:** NestJS + TypeORM (`apps/api`), Zod-free plain TS DTOs (`packages/api-contracts`), React + Redux Toolkit + react-i18next (`apps/web`), vitest (web unit tests), jest + supertest (API e2e), Storybook.

**Spec:** `docs/superpowers/specs/2026-07-29-agent-settings-version-visibility-design.md`

## Global Constraints

- No database migration. `agent_message.agent_settings_id` already exists and is non-nullable.
- Streaming keeps resolving the latest **published** settings. Do not change `AgentSettingsService.getLast()` call sites.
- Version indicators are **manager-only**: gated on `abilities.canManageAgent({ agentId })` from `useAbility()`. The history endpoint policy (`canUpdate`) is NOT relaxed.
- Header indicator shows the newest **non-draft** revision from the history list, never `agent.revision` (in Studio that is often the draft).
- Desk, Tester, reviewer and public chat must render exactly as today. The shared message components get an **optional** slot that only Studio fills.
- Loops use descriptive variable names, never single letters (root `CLAUDE.md`).
- Sample data in stories/factories stays domain-neutral ("Helpful Assistant", `{ title, summary }`).
- Reuse `status:draft` / `status:published`; new feature keys go under `agent:history.*` in **both** `agent.en.json` and `agent.fr.json`.
- No `any`, no `@ts-ignore`, no `@ts-expect-error` in `apps/web`.
- Completion gates: `npm run biome:check` and `npm run typecheck` from the repo root; `npm run test` in `apps/api` for API work; `npx vitest run <file>` in `apps/web` for web specs.

---

## File Structure

**`packages/api-contracts`**
- Modify `src/agents/shared/agent-session-messages/agent-session-messages.dto.ts` — add `agentRevision?: number` to `AgentSessionMessageDto`.

**`apps/api`**
- Modify `src/domains/agents/conversation-agent-sessions/conversation-agent-sessions.service.ts` — load the `agentSettings` relation in `listMessagesForSession` and `getMessageById`.
- Modify `src/domains/agents/shared/agent-session-messages/agent-messages.controller.ts` — map `agentRevision` in `toDto`.
- Modify `src/domains/agents/shared/agent-session-messages/e2e-tests/list-messages.spec.ts` — assert the revision, including a session spanning two revisions.

**`apps/web`**
- Modify `src/studio/features/agents/agent-history.functions.ts` — add `resolveMessageRevision` and `findVersion`.
- Create `src/studio/features/agents/agent-history.functions.spec.ts` — unit spec for both helpers.
- Create `src/studio/features/agents/components/AgentVersionHistorySheet.tsx` — sheet chrome shared by the editor button and the badges.
- Modify `src/studio/features/agents/components/AgentVersionHistory.tsx` — becomes the editor trigger, wrapped in the new sheet; loses its `useMount`.
- Modify `src/studio/features/agents/components/AgentVersionExplorer.tsx` — optional `initialRevision` prop.
- Create `src/studio/features/agents/components/AgentRevisionBadge.tsx` — clickable `v{n}` badge opening the sheet at a revision.
- Create `src/studio/routes/StudioAgentRoute.tsx` — loads history on agent route mount, manager-gated.
- Modify `src/studio/routes/StudioRoutes.tsx` — wire `StudioAgentRoute` at `StudioRoutes.agent.path`.
- Modify `src/common/features/agents/agent-sessions/shared/agent-session-messages/components/AgentSessionMessages.tsx` — optional `renderMessageVersion` prop, drilled to `Messages`.
- Modify `src/common/features/agents/agent-sessions/shared/agent-session-messages/components/AgentSessionMessage.tsx` — render the slot in `MessageFooter` after `CopyToClipboard`.
- Modify `src/studio/routes/StudioAgentSessionRoute.tsx` — supply the renderer and the header badge.
- Modify `src/common/features/agents/locales/agent.en.json` + `agent.fr.json` — new `history.*` keys.
- Modify `src/stories/routes/studio/agent/AgentSessionRoute.stories.tsx` — history seed + revision-spanning messages + controls.

---

### Task 1: API exposes the revision on each message

**Files:**
- Modify: `packages/api-contracts/src/agents/shared/agent-session-messages/agent-session-messages.dto.ts:15-29`
- Modify: `apps/api/src/domains/agents/conversation-agent-sessions/conversation-agent-sessions.service.ts:53-74`
- Modify: `apps/api/src/domains/agents/shared/agent-session-messages/agent-messages.controller.ts:158-170`
- Test: `apps/api/src/domains/agents/shared/agent-session-messages/e2e-tests/list-messages.spec.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: `AgentSessionMessageDto.agentRevision?: number` — the revision of the agent settings that produced the message. Consumed by Tasks 2, 5, 6.

**Context an implementer needs:**
`AgentMessage` already has the relation (`apps/api/src/domains/agents/shared/agent-session-messages/agent-message.entity.ts:16-22`):

```ts
@Column({ type: "uuid", name: "agent_settings_id", nullable: false })
agentSettingsId!: string
@ManyToOne("AgentSettings", (agentSettings: AgentSettings) => agentSettings.id, { onDelete: "CASCADE" })
@JoinColumn({ name: "agent_settings_id" })
agentSettings!: AgentSettings
```

So no migration and no new relation — only the read path needs the join.

- [ ] **Step 1: Write the failing test**

In `apps/api/src/domains/agents/shared/agent-session-messages/e2e-tests/list-messages.spec.ts`, add these imports to the existing import block:

```ts
import { agentSettingsFactory } from "@/domains/agents/settings/agent.settings.factory"
import { agentMessageFactory } from "../agent-messages.factory"
```

Then add a second test inside the existing `describe("listMessages", ...)` block, after the existing `it("should return messages for a session", ...)`:

```ts
    it("should report each message's own revision when a session spans two revisions", async () => {
      const { organization, project, agent, agentSession } = await createContext()

      // A newer published revision, as `publish` would produce after a settings change.
      const secondRevision = agentSettingsFactory
        .transient({ organization, project, agent })
        .build({ revision: 2 })
      await repositories.agentSettingsRepository.save(secondRevision)

      // A later turn, answered by the newer revision.
      const laterMessage = agentMessageFactory
        .assistant()
        .transient({
          organization,
          project,
          session: agentSession,
          agentSettings: secondRevision,
        })
        .build({ content: "Answered by v2", createdAt: new Date(Date.now() + 60 * 1000) })
      await repositories.agentMessageRepository.save(laterMessage)

      const response = await subject()

      expect(response.status).toBe(201)
      const messages = response.body.data
      expect(messages).toHaveLength(3)
      expect(messages[0]?.agentRevision).toBe(1)
      expect(messages[1]?.agentRevision).toBe(1)
      expect(messages[2]?.content).toBe("Answered by v2")
      expect(messages[2]?.agentRevision).toBe(2)
    })
```

`createContext()` already returns `{ organization, user, project, agent, agentSession }` and seeds two messages (`"Hello"` from the user, `"Hi!"` from the assistant) on revision 1 via `createChitChatConversation`. Messages are ordered `createdAt: "ASC"`, which is why the new message is stamped a minute into the future.

- [ ] **Step 2: Run the test to verify it fails**

Run from `apps/api`:

```bash
npx jest --colors --runInBand --forceExit src/domains/agents/shared/agent-session-messages/e2e-tests/list-messages.spec.ts
```

Expected: FAIL. The new test fails on `expect(messages[0]?.agentRevision).toBe(1)` receiving `undefined`; TypeScript may also flag `agentRevision` as not existing on the DTO. The pre-existing test still passes.

- [ ] **Step 3: Add the DTO field**

In `packages/api-contracts/src/agents/shared/agent-session-messages/agent-session-messages.dto.ts`, extend `AgentSessionMessageDto`:

```ts
export type AgentSessionMessageDto = {
  id: string
  role: "user" | "assistant" | "tool"
  content: string
  attachmentDocumentId?: string
  status?: "streaming" | "completed" | "aborted" | "error"
  createdAt?: TimeType
  startedAt?: TimeType
  completedAt?: TimeType
  /**
   * Revision of the agent settings that produced this message. Absent on messages built
   * client-side during a live stream, which are never refetched.
   */
  agentRevision?: number
  toolCalls?: Array<{
    id: string
    name: AgentSessionToolName
    arguments: Record<string, unknown>
  }>
}
```

- [ ] **Step 4: Load the relation on the read path**

In `apps/api/src/domains/agents/conversation-agent-sessions/conversation-agent-sessions.service.ts`, add the relation to both readers:

```ts
  async listMessagesForSession({
    agentSessionId,
    connectScope,
  }: {
    agentSessionId: string
    connectScope: RequiredConnectScope
  }): Promise<AgentMessage[]> {
    return this.agentMessageConnectRepository.find(connectScope, {
      where: { sessionId: agentSessionId },
      order: { createdAt: "ASC" },
      // Joined so the DTO can report the revision that produced each message.
      relations: { agentSettings: true },
    })
  }

  async getMessageById({
    id,
    connectScope,
  }: {
    id: string
    connectScope: RequiredConnectScope
  }): Promise<AgentMessage | null> {
    return this.agentMessageConnectRepository.getOneById(connectScope, id, {
      relations: ["agentSettings"],
    })
  }
```

Note the two different relation syntaxes, which is not a typo: `find` forwards TypeORM `FindManyOptions`, so it takes the object form `relations: { agentSettings: true }`; `getOneById` builds a query builder and takes a string array (`apps/api/src/common/entities/connect-repository.ts:63-76`), so it takes `relations: ["agentSettings"]`.

- [ ] **Step 5: Map the field in the DTO mapper**

In `apps/api/src/domains/agents/shared/agent-session-messages/agent-messages.controller.ts`:

```ts
function toDto(message: AgentMessage): AgentSessionMessageDto {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    status: message.status ?? undefined,
    createdAt: message.createdAt.getTime(),
    startedAt: message.startedAt?.getTime(),
    completedAt: message.completedAt?.getTime(),
    agentRevision: message.agentSettings?.revision,
    toolCalls: (message.toolCalls as AgentSessionMessageDto["toolCalls"]) ?? undefined,
    attachmentDocumentId: message.attachmentDocumentId ?? undefined,
  }
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run from `apps/api`:

```bash
npx jest --colors --runInBand --forceExit src/domains/agents/shared/agent-session-messages/e2e-tests/list-messages.spec.ts
```

Expected: PASS, both tests.

- [ ] **Step 7: Run the neighbouring specs and the gates**

Run from `apps/api`:

```bash
npx jest --colors --runInBand --forceExit src/domains/agents/shared/agent-session-messages
npm run check:boundaries
```

Then from the repo root:

```bash
npm run biome:check
npm run typecheck
```

Expected: all pass. `check:boundaries` must be clean without regenerating baselines — no new relation was introduced, only a join on an existing one. If it does report a new cycle, stop and report rather than regenerating.

- [ ] **Step 8: Commit**

```bash
git add packages/api-contracts/src/agents/shared/agent-session-messages/agent-session-messages.dto.ts \
  apps/api/src/domains/agents/conversation-agent-sessions/conversation-agent-sessions.service.ts \
  apps/api/src/domains/agents/shared/agent-session-messages/agent-messages.controller.ts \
  apps/api/src/domains/agents/shared/agent-session-messages/e2e-tests/list-messages.spec.ts
git commit -m "feat(agents): expose the settings revision that produced each message"
```

---

### Task 2: Revision resolution helpers

**Files:**
- Modify: `apps/web/src/studio/features/agents/agent-history.functions.ts`
- Modify: `apps/web/src/common/features/agents/agent-sessions/agent-session.factory.ts:98-104`
- Test: `apps/web/src/studio/features/agents/agent-history.functions.spec.ts` (create)

**Interfaces:**
- Consumes: `AgentSessionMessageDto.agentRevision` from Task 1.
- Produces:
  - `findPublishedVersion(versions: Agent[]): Agent | undefined` — newest non-draft version.
  - `findVersion(versions: Agent[], revision: number): Agent | undefined` — exact match by revision.
  - `resolveMessageRevision(message: AgentSessionMessage, versions: Agent[]): number | undefined`
  - Consumed by Tasks 4, 5, 6.

**Context an implementer needs:**
`agent-history.functions.ts` already exists and holds the diff helpers for the version explorer; these are its natural neighbours. `Agent` is `apps/web/src/common/features/agents/agents.models.ts` (an `AgentDto` alias) and carries `revision: number`, `revisionName: string`, `revisionDesc: string`, `isDraft: boolean`. `AgentSessionMessage` is an `AgentSessionMessageDto` alias. The history endpoint returns versions **newest first**, so "newest non-draft" is the first `!isDraft` entry — the same derivation `AgentVersionList.tsx:19` already uses.

- [ ] **Step 1: Default the new field in the message factory**

`apps/web/CLAUDE.md` requires every model field to be defaulted in its sibling factory with
`params.X ?? <default>`. `AgentSessionMessage` gained `agentRevision` in Task 1, so add it to
`apps/web/src/common/features/agents/agent-sessions/agent-session.factory.ts`:

```ts
export const agentSessionMessageFactory = AgentSessionMessageFactory.define(({ params }) => ({
  id: params.id ?? faker.string.uuid(),
  role: params.role ?? "user",
  content: params.content ?? faker.lorem.sentence(),
  status: params.status ?? "completed",
  agentRevision: params.agentRevision,
  toolCalls: params.toolCalls,
}))
```

Left `undefined` by default, mirroring `toolCalls`: an unspecified revision is the realistic
shape for a message built during streaming, and the tests below depend on that being absent.

- [ ] **Step 2: Write the failing test**

Create `apps/web/src/studio/features/agents/agent-history.functions.spec.ts`:

```ts
import { describe, expect, it } from "vitest"
import { agentFactory } from "@/common/features/agents/agent.factory"
import { agentSessionMessageFactory } from "@/common/features/agents/agent-sessions/agent-session.factory"
import { organizationFactory } from "@/common/features/organizations/organization.factory"
import { projectFactory } from "@/common/features/projects/projects.factory"
import { findPublishedVersion, findVersion, resolveMessageRevision } from "./agent-history.functions"

const project = projectFactory.transient({ organization: organizationFactory.build() }).build()

/** Revisions newest first, as the history endpoint returns them. */
const buildVersions = (...revisions: { revision: number; isDraft?: boolean }[]) =>
  revisions.map(({ revision, isDraft }) =>
    agentFactory.transient({ project }).build({ id: "agent-id", revision, isDraft }),
  )

describe("findPublishedVersion", () => {
  it("returns the newest non-draft version", () => {
    const versions = buildVersions({ revision: 5, isDraft: true }, { revision: 4 }, { revision: 3 })

    expect(findPublishedVersion(versions)?.revision).toBe(4)
  })

  it("returns undefined when every version is a draft", () => {
    expect(findPublishedVersion(buildVersions({ revision: 1, isDraft: true }))).toBeUndefined()
  })
})

describe("findVersion", () => {
  it("returns the version matching the revision", () => {
    const versions = buildVersions({ revision: 4 }, { revision: 3 })

    expect(findVersion(versions, 3)?.revision).toBe(3)
  })

  it("returns undefined for a revision missing from the list", () => {
    expect(findVersion(buildVersions({ revision: 4 }), 2)).toBeUndefined()
  })
})

describe("resolveMessageRevision", () => {
  it("uses the revision recorded on the message", () => {
    const message = agentSessionMessageFactory.build({ role: "assistant", agentRevision: 3 })

    expect(resolveMessageRevision(message, buildVersions({ revision: 4 }))).toBe(3)
  })

  it("labels a message with no recorded revision with the published revision", () => {
    // Streamed messages are built client-side and carry no revision; streaming always
    // runs the latest published settings, so that is the correct label.
    const message = agentSessionMessageFactory.build({ role: "assistant" })
    const versions = buildVersions({ revision: 5, isDraft: true }, { revision: 4 })

    expect(resolveMessageRevision(message, versions)).toBe(4)
  })

  it("returns undefined when there is no recorded revision and no published version", () => {
    const message = agentSessionMessageFactory.build({ role: "assistant" })

    expect(resolveMessageRevision(message, [])).toBeUndefined()
  })

  it("keeps a recorded revision that is absent from the history list", () => {
    const message = agentSessionMessageFactory.build({ role: "assistant", agentRevision: 2 })

    expect(resolveMessageRevision(message, buildVersions({ revision: 4 }))).toBe(2)
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run from `apps/web`:

```bash
npx vitest run src/studio/features/agents/agent-history.functions.spec.ts
```

Expected: FAIL — `findPublishedVersion`, `findVersion` and `resolveMessageRevision` are not exported from `./agent-history.functions`.

- [ ] **Step 4: Implement the helpers**

Append to `apps/web/src/studio/features/agents/agent-history.functions.ts` (its existing import of `Agent` covers the first type; add the message import at the top of the file):

```ts
import type { AgentSessionMessage } from "@/common/features/agents/agent-sessions/shared/agent-session-messages/agent-session-messages.models"
```

```ts
/**
 * The published revision the agent actually runs with: the newest one that is not a draft.
 * `versions` is ordered by revision descending, as the history endpoint returns it.
 */
export function findPublishedVersion(versions: Agent[]): Agent | undefined {
  return versions.find((version) => !version.isDraft)
}

/** The version carrying `revision`, when the history list is loaded and contains it. */
export function findVersion(versions: Agent[], revision: number): Agent | undefined {
  return versions.find((version) => version.revision === revision)
}

/**
 * Revision to label a message with: the one the API recorded, else the published revision.
 * The fallback covers messages created client-side during streaming, which always ran the
 * latest published settings. Returns `undefined` when neither is available, so the caller
 * hides the badge rather than showing a wrong number.
 */
export function resolveMessageRevision(
  message: AgentSessionMessage,
  versions: Agent[],
): number | undefined {
  return message.agentRevision ?? findPublishedVersion(versions)?.revision
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run from `apps/web`:

```bash
npx vitest run src/studio/features/agents/agent-history.functions.spec.ts
```

Expected: PASS, 8 tests.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/studio/features/agents/agent-history.functions.ts \
  apps/web/src/studio/features/agents/agent-history.functions.spec.ts \
  apps/web/src/common/features/agents/agent-sessions/agent-session.factory.ts
git commit -m "feat(agents): add revision resolution helpers for message version labels"
```

---

### Task 3: Shared version sheet and clickable revision badge

**Files:**
- Create: `apps/web/src/studio/features/agents/components/AgentVersionHistorySheet.tsx`
- Create: `apps/web/src/studio/features/agents/components/AgentRevisionBadge.tsx`
- Modify: `apps/web/src/studio/features/agents/components/AgentVersionHistory.tsx`
- Modify: `apps/web/src/studio/features/agents/components/AgentVersionExplorer.tsx:91-123`
- Modify: `apps/web/src/common/features/agents/locales/agent.en.json`
- Modify: `apps/web/src/common/features/agents/locales/agent.fr.json`
- Test: `apps/web/src/studio/features/agents/components/AgentVersionExplorer.spec.ts` (must keep passing, unchanged)

**Interfaces:**
- Consumes: `findVersion` from Task 2; `selectAgentHistoryData` from `../agent-history.selectors`.
- Produces:
  - `<AgentVersionHistorySheet agent={agent} trigger={node} initialRevision?={number} />`
  - `<AgentRevisionBadge agent={agent} revision={number} versions={Agent[]} />`
  - `<AgentVersionExplorer initialRevision?={number} />`
  - Consumed by Tasks 5 and 6.

**Context an implementer needs:**
`AgentVersionHistory.tsx` currently owns the whole sheet: trigger button, `SheetHeader`, an `AsyncRoute` gate on the history data, and `<AgentVersionExplorer />`. Two more call sites now need that sheet, so the chrome moves into `AgentVersionHistorySheet` and `AgentVersionHistory` keeps only the editor's trigger button. `AgentVersionExplorer` holds its selection in `useState<number | null>(null)`; `buildComparison` already resolves a sensible default for `null` and clamps an unknown revision to that default (`AgentVersionExplorer.spec.ts` covers this), so seeding the state is the whole change.

- [ ] **Step 1: Add the i18n keys**

In `apps/web/src/common/features/agents/locales/agent.en.json`, inside the existing `history` object (after `"currentBadge": "Current",`):

```json
      "revisionBadge": "v{{revision}}",
      "revisionBadgeAria": "Version {{revision}} of the agent settings",
      "messageRevisionTooltip": "Answered with version {{revision}}",
      "headerRevisionTooltip": "New messages run with version {{revision}}",
      "draftPending": "version {{revision}} draft not published",
```

In `apps/web/src/common/features/agents/locales/agent.fr.json`, same position inside `history`:

```json
      "revisionBadge": "v{{revision}}",
      "revisionBadgeAria": "Version {{revision}} des paramètres de l'agent",
      "messageRevisionTooltip": "Répondu avec la version {{revision}}",
      "headerRevisionTooltip": "Les nouveaux messages utilisent la version {{revision}}",
      "draftPending": "version {{revision}} brouillon non publiée",
```

- [ ] **Step 2: Add `initialRevision` to the explorer**

In `apps/web/src/studio/features/agents/components/AgentVersionExplorer.tsx`, change only the component signature and its state initialiser (`buildComparison` and everything below stay as they are):

```tsx
/**
 * Two-pane version explorer: revision timeline on the left, comparison on the right.
 * `initialRevision` preselects a revision — used when the explorer is opened from a
 * revision badge rather than from the editor's history button.
 */
export function AgentVersionExplorer({ initialRevision }: { initialRevision?: number }) {
  const versions = useValue(selectAgentHistoryData)
  const [selectedRevision, setSelectedRevision] = useState<number | null>(initialRevision ?? null)
  const [mode, setMode] = useState<AgentVersionCompareMode>("current")
```

- [ ] **Step 3: Verify the explorer spec still passes**

Run from `apps/web`:

```bash
npx vitest run src/studio/features/agents/components/AgentVersionExplorer.spec.ts
```

Expected: PASS, unchanged. The spec tests `buildComparison` directly, which was not touched.

- [ ] **Step 4: Extract the sheet**

Create `apps/web/src/studio/features/agents/components/AgentVersionHistorySheet.tsx`:

```tsx
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@caseai-connect/ui/shad/sheet"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { Agent } from "@/common/features/agents/agents.models"
import { AsyncRoute } from "@/common/routes/AsyncRoute"
import { useAppSelector } from "@/common/store/hooks"
import { selectAgentHistoryData } from "../agent-history.selectors"
import { AgentVersionExplorer } from "./AgentVersionExplorer"

/**
 * Side sheet holding the revision timeline, per-field diffs and restore. Shared by the
 * editor's history button and the revision badges in the playground, which open it
 * preselected on the revision they label.
 */
export function AgentVersionHistorySheet({
  agent,
  trigger,
  initialRevision,
}: {
  agent: Agent
  trigger: React.ReactNode
  initialRevision?: number
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const history = useAppSelector(selectAgentHistoryData)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-4xl">
        <SheetHeader className="border-b">
          <SheetTitle>{t("agent:history.title")}</SheetTitle>
          <SheetDescription>
            {t("agent:history.description", { name: agent.name })}
          </SheetDescription>
        </SheetHeader>

        <AsyncRoute data={[history]}>
          <AgentVersionExplorer initialRevision={initialRevision} />
        </AsyncRoute>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 5: Reduce `AgentVersionHistory` to the editor trigger**

Replace the whole body of `apps/web/src/studio/features/agents/components/AgentVersionHistory.tsx` with:

```tsx
import { Badge } from "@caseai-connect/ui/shad/badge"
import { Button } from "@caseai-connect/ui/shad/button"
import { HistoryIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Agent } from "@/common/features/agents/agents.models"
import { AgentVersionHistorySheet } from "./AgentVersionHistorySheet"

/**
 * Entry point of the agent settings versioning UI in the editor: a trigger button showing
 * the current revision, opening the version history sheet.
 */
export function AgentVersionHistory({ agent }: { agent: Agent }) {
  const { t } = useTranslation()

  return (
    <AgentVersionHistorySheet
      agent={agent}
      trigger={
        <Button type="button" variant="outline" size="sm">
          <HistoryIcon className="size-4" />
          {t("agent:history.button")}
          <Badge variant="secondary">v{agent.revision}</Badge>
          <Badge variant={agent.isDraft ? "warning" : "success"}>
            {agent.isDraft ? t("status:draft") : t("status:published")}
          </Badge>
        </Button>
      }
    />
  )
}
```

The `useMount` that used to live here is deliberately gone — Task 4 moves history loading to the agent route. Between this task and Task 4 the sheet will show its loading state until the editor is visited via a path that has already fetched; that is expected and resolved by Task 4.

- [ ] **Step 6: Create the badge**

Create `apps/web/src/studio/features/agents/components/AgentRevisionBadge.tsx`:

```tsx
import { Badge } from "@caseai-connect/ui/shad/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@caseai-connect/ui/shad/tooltip"
import { useTranslation } from "react-i18next"
import type { Agent } from "@/common/features/agents/agents.models"
import { buildDate } from "@/common/utils/build-date"
import { findVersion } from "../agent-history.functions"
import { AgentVersionHistorySheet } from "./AgentVersionHistorySheet"

/**
 * Clickable `v{revision}` badge. Opens the version history sheet preselected on the
 * revision it labels. The tooltip adds the revision name and date when the matching
 * history entry is loaded.
 */
export function AgentRevisionBadge({
  agent,
  revision,
  versions,
  tooltipKey,
}: {
  agent: Agent
  revision: number
  versions: Agent[]
  /** Which `agent:history.*` key describes what this revision means in context. */
  tooltipKey: "messageRevisionTooltip" | "headerRevisionTooltip"
}) {
  const { t } = useTranslation()
  const version = findVersion(versions, revision)

  return (
    <AgentVersionHistorySheet
      agent={agent}
      initialRevision={revision}
      trigger={
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              asChild
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/70"
              aria-label={t("agent:history.revisionBadgeAria", { revision })}
            >
              <button type="button">{t("agent:history.revisionBadge", { revision })}</button>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <span className="block">{t(`agent:history.${tooltipKey}`, { revision })}</span>
            {version?.revisionName.trim() && (
              <span className="block font-medium">{version.revisionName}</span>
            )}
            {version && <span className="block">{buildDate(version.updatedAt)}</span>}
          </TooltipContent>
        </Tooltip>
      }
    />
  )
}
```

`Badge` accepts `asChild` and renders a `Slot.Root` when set (`packages/ui/src/shad/badge.tsx:34-49`), so the badge styling lands on the inner `<button>` and there is exactly one interactive element. `SheetTrigger asChild` and `TooltipTrigger asChild` both need a single element child that forwards props, which this nesting satisfies.

- [ ] **Step 7: Verify the gates**

Run from the repo root:

```bash
npm run biome:check
npm run typecheck
```

Then from `apps/web`:

```bash
npx vitest run src/studio/features/agents
```

Expected: all pass.

- [ ] **Step 8: Verify the editor sheet still renders in Storybook**

Run from `apps/web`:

```bash
npx storybook build --quiet
```

Expected: the build succeeds. (`routes/studio/project/agent/AgentVersionHistory` renders `AgentVersionExplorer` directly with a seeded history, so it exercises the new optional prop path.) If a full Storybook build is too slow in this environment, run `npm run typecheck` and skip it, noting the skip.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/studio/features/agents/components/AgentVersionHistorySheet.tsx \
  apps/web/src/studio/features/agents/components/AgentRevisionBadge.tsx \
  apps/web/src/studio/features/agents/components/AgentVersionHistory.tsx \
  apps/web/src/studio/features/agents/components/AgentVersionExplorer.tsx \
  apps/web/src/common/features/agents/locales/agent.en.json \
  apps/web/src/common/features/agents/locales/agent.fr.json
git commit -m "feat(agents): extract the version history sheet and add a clickable revision badge"
```

---

### Task 4: Load the settings history when the Studio agent route mounts

**Files:**
- Create: `apps/web/src/studio/routes/StudioAgentRoute.tsx`
- Modify: `apps/web/src/studio/routes/StudioRoutes.tsx` (the `StudioRoutes.agent.path` entry)

**Interfaces:**
- Consumes: `agentHistoryActions` from `@/studio/features/agents/agent-history.slice`; `useAbility`, `useMount`, `selectCurrentAgentData`.
- Produces: `<StudioAgentRoute>{children}</StudioAgentRoute>` — guarantees `state.agentHistory.data` is being fetched for the current agent whenever the user can manage it. Relied on by Tasks 5 and 6.

**Context an implementer needs:**
- `useMount` (`apps/web/src/common/hooks/use-mount.ts`) dispatches `mount` on effect run and `unmount` on cleanup, skips entirely when `condition === false`, and re-runs when any `refreshOn` entry changes.
- `agentHistoryMiddleware` already listens on `agentHistoryActions.mount` and dispatches `listAgentHistory()`. No middleware change is needed.
- `agentHistoryActions.unmount` is a no-op reducer with no listener, so leaving the route does not clear loaded history; `refreshOn: [agent.id]` is what keeps it correct when switching agents.
- `agentHistory` is registered in `apps/web/src/studio/store/slices.ts`, so it is available anywhere under the Studio tree.
- Deliberately **no** `AsyncRoute` gate on the history: the playground must render immediately and indicators fill in when the fetch lands.
- Per `apps/web/CLAUDE.md`, data loading belongs in route wrappers plus middleware, never in leaf components — which is exactly what this task fixes.

- [ ] **Step 1: Create the route wrapper**

Create `apps/web/src/studio/routes/StudioAgentRoute.tsx`:

```tsx
import { selectCurrentAgentData } from "@/common/features/agents/agents.selectors"
import { useAbility } from "@/common/hooks/use-ability"
import { useMount } from "@/common/hooks/use-mount"
import { useValue } from "@/common/hooks/use-value"
import { agentHistoryActions } from "@/studio/features/agents/agent-history.slice"

/**
 * Loads the agent settings history for the whole Studio agent subtree, so the playground
 * can label message and header revisions without waiting for the editor's sheet to open.
 *
 * Manager-only: the history endpoint requires the manage-agent policy, and a member who
 * cannot manage the agent sees no version indicators.
 *
 * Rendering is not gated on the history — the playground shows immediately and the
 * indicators appear once the fetch lands.
 */
export function StudioAgentRoute({ children }: { children: React.ReactNode }) {
  const agent = useValue(selectCurrentAgentData)
  const { abilities } = useAbility()

  useMount({
    actions: agentHistoryActions,
    condition: abilities.canManageAgent({ agentId: agent.id }),
    refreshOn: [agent.id],
  })

  return children
}
```

`useValue(selectCurrentAgentData)` unwraps the async data and is safe here because this wrapper sits inside `<AgentRoute>`, which already gates on the agent being loaded (see `apps/web/src/common/routes/AgentRoute.tsx`). Check how `useValue` is used in `AgentEditorRoute.tsx:18` for the established pattern.

- [ ] **Step 2: Wire it into the route tree**

In `apps/web/src/studio/routes/StudioRoutes.tsx`, add the import next to the other route imports:

```tsx
import { StudioAgentRoute } from "./StudioAgentRoute"
```

and wrap the agent subtree's element (currently `<AgentRoute><AgentSessionsHandler /></AgentRoute>`):

```tsx
        {
          path: StudioRoutes.agent.path,
          element: (
            <AgentRoute>
              <StudioAgentRoute>
                <AgentSessionsHandler />
              </StudioAgentRoute>
            </AgentRoute>
          ),
          children: [
```

The `children` array below it is unchanged. `StudioAgentRoute` goes **inside** `AgentRoute` so the agent is already loaded when it reads `selectCurrentAgentData`.

- [ ] **Step 3: Verify the gates**

Run from the repo root:

```bash
npm run biome:check
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Verify the route stories still render**

Run from `apps/web`:

```bash
npx vitest run src/studio/features/agents
npx storybook build --quiet
```

Expected: pass. The studio agent stories (`routes/studio/project/agent/*`) mount the real route tree, so a broken wrapper would surface here. If the Storybook build is impractical in this environment, note the skip and rely on `npm run typecheck` plus Task 7's story work.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/studio/routes/StudioAgentRoute.tsx apps/web/src/studio/routes/StudioRoutes.tsx
git commit -m "feat(agents): load the settings history when the Studio agent route mounts"
```

---

### Task 5: Revision badge in the assistant message footer

**Files:**
- Modify: `apps/web/src/common/features/agents/agent-sessions/shared/agent-session-messages/components/AgentSessionMessages.tsx:48-112`
- Modify: `apps/web/src/common/features/agents/agent-sessions/shared/agent-session-messages/components/AgentSessionMessage.tsx:31-110`
- Modify: `apps/web/src/studio/routes/StudioAgentSessionRoute.tsx`

**Interfaces:**
- Consumes: `resolveMessageRevision` (Task 2), `AgentRevisionBadge` (Task 3), history loaded by `StudioAgentRoute` (Task 4).
- Produces: `AgentSessionMessages` accepts `renderMessageVersion?: (message: AgentSessionMessage) => React.ReactNode`. Studio fills it; every other surface omits it.

**Context an implementer needs:**
`AgentSessionMessage` is shared by Studio, Desk, Tester and public chat, so the badge cannot be imported there directly — it arrives as an optional render slot, prop-drilled `AgentSessionMessages` → `Messages` → `AgentSessionMessage`. The footer (`MessageFooter`) only renders for **completed assistant** turns (`{!isStreaming && (...)}` inside `case "assistant"`), which is the intended scope: user bubbles have no footer, and a streaming turn has no footer either. `CopyToClipboard` is at `AgentSessionMessage.tsx:86`; the slot goes directly after it.

- [ ] **Step 1: Add the slot to `AgentSessionMessages`**

In `AgentSessionMessages.tsx`, extend the props and pass the slot to `Messages`:

```tsx
export function AgentSessionMessages({
  session,
  messages,
  onFillFormToolEvent,
  formSubSessions = [],
  formResultSchema,
  renderMessageVersion,
}: {
  session: AgentSession
  messages: AgentSessionMessageType[]
  onFillFormToolEvent?: () => void
  formSubSessions?: ConversationSubSession[]
  formResultSchema?: Record<string, unknown>
  /**
   * Optional per-message affordance rendered in the footer, after the copy button.
   * Studio uses it for the agent settings revision badge; the other surfaces omit it.
   */
  renderMessageVersion?: (message: AgentSessionMessageType) => React.ReactNode
}) {
```

and in the JSX, replace `<Messages messages={messages} />` with:

```tsx
                <Messages messages={messages} renderMessageVersion={renderMessageVersion} />
```

Then extend the local `Messages` component:

```tsx
function Messages({
  messages,
  renderMessageVersion,
}: {
  messages: AgentSessionMessageType[]
  renderMessageVersion?: (message: AgentSessionMessageType) => React.ReactNode
}) {
  return (
    <MessageScroller className="flex-1">
      <MessageScrollerViewport className="p-6">
        <MessageScrollerContent className="gap-4">
          {messages.map((message, index) => (
            <MessageScrollerItem
              key={index.toString()}
              messageId={message.id}
              // Anchor on user turns so jumps land on a question with prior context peeking above.
              scrollAnchor={message.role === "user"}
            >
              <AgentSessionMessage message={message} renderMessageVersion={renderMessageVersion} />
            </MessageScrollerItem>
          ))}
        </MessageScrollerContent>
      </MessageScrollerViewport>
      <MessageScrollerButton className="shadow-md" direction="end" />
    </MessageScroller>
  )
}
```

- [ ] **Step 2: Render the slot in the footer**

In `AgentSessionMessage.tsx`, extend the component signature:

```tsx
export function AgentSessionMessage({
  message,
  renderMessageVersion,
}: {
  message: AgentSessionMessageType
  renderMessageVersion?: (message: AgentSessionMessageType) => React.ReactNode
}) {
```

and inside `case "assistant"`, in the `MessageFooter`, add the slot right after `CopyToClipboard`:

```tsx
              <MessageFooter className="gap-0 px-1">
                <FeedbackCreator message={message} />

                <CopyToClipboard content={message.content} />

                {renderMessageVersion?.(message)}

                {filledForm && formResult && (
```

Everything else in the file is unchanged.

- [ ] **Step 3: Supply the renderer from Studio**

In `apps/web/src/studio/routes/StudioAgentSessionRoute.tsx`, add these imports:

```tsx
import type { AgentSessionMessage } from "@/common/features/agents/agent-sessions/shared/agent-session-messages/agent-session-messages.models"
import { useAbility } from "@/common/hooks/use-ability"
import { selectAgentHistoryData } from "@/studio/features/agents/agent-history.selectors"
import { resolveMessageRevision } from "@/studio/features/agents/agent-history.functions"
import { AgentRevisionBadge } from "@/studio/features/agents/components/AgentRevisionBadge"
```

Inside the component, after the existing `const agentRoute = useGetAgentRoute()` line:

```tsx
  const { abilities } = useAbility()
  const canManageAgent = abilities.canManageAgent({ agentId: agent.id })
  // Loaded by StudioAgentRoute; empty until it lands, or when the user cannot manage the agent.
  const versions = useAppSelector(selectAgentHistoryData).value ?? []

  const renderMessageVersion = (message: AgentSessionMessage) => {
    if (!canManageAgent) return null
    const revision = resolveMessageRevision(message, versions)
    if (revision === undefined) return null
    return (
      <AgentRevisionBadge
        agent={agent}
        revision={revision}
        versions={versions}
        tooltipKey="messageRevisionTooltip"
      />
    )
  }
```

`selectAgentHistoryData` returns the raw `AsyncData<Agent[]>`, so read `.value` directly rather than using `useValue` (which gates on fulfilment and would suspend the whole route on the history fetch). Every `AsyncData` variant declares `value` — `null` for uninitialized, loading and error (`apps/web/src/common/store/async-data-status.ts:8-28`) — so `.value ?? []` type-checks and degrades to "no indicators" on failure, which is the behaviour the spec asks for.

Then pass the renderer to the messages component:

```tsx
        <AgentSessionMessages
          session={agentSession}
          messages={messages}
          formSubSessions={formSubSessions}
          formResultSchema={agent.fillFormEnabled ? agent.outputJsonSchema : undefined}
          renderMessageVersion={renderMessageVersion}
        />
```

- [ ] **Step 4: Verify no other surface changed**

Run:

```bash
grep -rn "<AgentSessionMessages" apps/web/src --include=*.tsx
```

Expected: every call site other than `StudioAgentSessionRoute.tsx` is untouched and omits `renderMessageVersion`, so Desk, Tester and public chat render exactly as before.

- [ ] **Step 5: Verify the gates**

Run from the repo root:

```bash
npm run biome:check
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/common/features/agents/agent-sessions/shared/agent-session-messages/components/AgentSessionMessages.tsx \
  apps/web/src/common/features/agents/agent-sessions/shared/agent-session-messages/components/AgentSessionMessage.tsx \
  apps/web/src/studio/routes/StudioAgentSessionRoute.tsx
git commit -m "feat(agents): show the settings revision of each message in the Studio playground"
```

---

### Task 6: Current revision in the playground grid header

**Files:**
- Modify: `apps/web/src/studio/routes/StudioAgentSessionRoute.tsx:37-50`

**Interfaces:**
- Consumes: `findPublishedVersion` (Task 2), `AgentRevisionBadge` (Task 3), `versions` / `canManageAgent` already computed in Task 5.
- Produces: nothing consumed downstream.

**Context an implementer needs:**
The header must show the **published** revision, not `agent.revision` — in Studio the current agent comes from `getAllWithDrafts`, so `agent.revision` is often an unpublished draft that the playground does not run. The published revision is `findPublishedVersion(versions)`, mirroring the "Current" badge derivation in `AgentVersionList.tsx:19`. When the newest version is a draft, a muted hint says so, so the badge can never be read as "the draft is live".

- [ ] **Step 1: Derive the header values**

In `StudioAgentSessionRoute.tsx`, add the import:

```tsx
import { findPublishedVersion, resolveMessageRevision } from "@/studio/features/agents/agent-history.functions"
```

(replacing the single-symbol import added in Task 5) and, next to the `renderMessageVersion` definition:

```tsx
  const publishedVersion = findPublishedVersion(versions)
  // The newest version is a pending draft, so the running revision is not the latest one.
  const pendingDraft = versions[0]?.isDraft ? versions[0] : undefined
```

- [ ] **Step 2: Render the badge and hint in the header**

Replace the `description` prop of the existing `GridHeader`:

```tsx
        description={
          <div className="flex items-center gap-2 flex-wrap">
            <span className="capitalize-first">{agent.name}</span> •
            <span className="capitalize-first">{t(`agent:create.typeDialog.${agent.type}`)}</span>
            <Icon /> • {date}
            {canManageAgent && publishedVersion && (
              <>
                •
                <AgentRevisionBadge
                  agent={agent}
                  revision={publishedVersion.revision}
                  versions={versions}
                  tooltipKey="headerRevisionTooltip"
                />
                {pendingDraft && (
                  <span className="text-xs text-muted-foreground">
                    {t("agent:history.draftPending", { revision: pendingDraft.revision })}
                  </span>
                )}
              </>
            )}
          </div>
        }
```

- [ ] **Step 3: Verify the gates**

Run from the repo root:

```bash
npm run biome:check
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/studio/routes/StudioAgentSessionRoute.tsx
git commit -m "feat(agents): show the running settings revision in the playground header"
```

---

### Task 7: Stories covering every indicator state

**Files:**
- Modify: `apps/web/src/stories/routes/studio/agent/AgentSessionRoute.stories.tsx`

**Interfaces:**
- Consumes: everything from Tasks 1-6.
- Produces: nothing consumed downstream.

**Context an implementer needs:**
- `buildStudioData(args)` (`apps/web/src/stories/routes/studio/helpers.tsx`) already builds agent memberships from the `agentMembershipRole` story arg, and `canManageAgent` is true only for `owner`/`admin` (`SUPER_ROLES` in `me.models.ts`). So the non-manager scenario is just `agentMembershipRole: "member"` — no new plumbing.
- `seed.studio.agentHistory(versions)` already exists (`apps/web/src/stories/seed.ts:319`) and wraps the list in `ads.fulfilled`.
- The history endpoint returns versions **newest first**; the fixtures must respect that or `findPublishedVersion` picks the wrong entry.
- `agentSessionMessageFactory` accepts `agentRevision` through its params once Task 1 lands (`AgentSessionMessage` is a DTO alias).
- Keep sample data domain-neutral per the root `CLAUDE.md`.

- [ ] **Step 1: Add the story args and controls**

In `AgentSessionRoute.stories.tsx`, extend `StoryArgs` and the meta:

```tsx
type StoryArgs = StudioStoryArgs & {
  fillForm?: boolean
  withMessages?: boolean
  withSubAgentForms?: boolean
  withVersionHistory?: boolean
  withPendingDraft?: boolean
}
```

```tsx
  argTypes: {
    ...studioStoryArgTypes,
    withAgents: { control: undefined },
    fillForm: { control: "boolean" },
    withMessages: { control: "boolean" },
    withSubAgentForms: { control: "boolean" },
    withVersionHistory: { control: "boolean" },
    withPendingDraft: { control: "boolean" },
  },
  args: {
    ...studioStoryArgs,
    withAgents: true,
    fillForm: false,
    withMessages: true,
    withSubAgentForms: false,
    withVersionHistory: true,
    withPendingDraft: false,
  },
```

- [ ] **Step 2: Seed the history and revision-spanning messages**

In the `Default` decorator, destructure the new args and build the fixtures. Replace the decorator's argument list and the `messages` / return block:

```tsx
    buildDecorator<StoryArgs>(
      ({ fillForm, withMessages, withSubAgentForms, withVersionHistory, withPendingDraft, ...args }) => {
        const { baseSeeds, project, agents } = buildStudioData(args)
```

(keep the existing `currentAgent`, `sessionFactory`, `session`, `subSessions` and `toolCalls` code as it is, then:)

```tsx
        // Versions newest first, as the history endpoint returns them. The playground runs
        // the newest published one; a pending draft is newer but not live.
        const versions: Agent[] = withVersionHistory
          ? [
              ...(withPendingDraft
                ? [{ ...currentAgent, revision: 3, isDraft: true, updatedAt: Date.now() }]
                : []),
              {
                ...currentAgent,
                revision: 2,
                isDraft: false,
                revisionName: "Tighter tone",
                updatedAt: Date.now() - 1000 * 60 * 60,
              },
              {
                ...currentAgent,
                revision: 1,
                isDraft: false,
                revisionName: "First release",
                updatedAt: Date.now() - 1000 * 60 * 60 * 48,
              },
            ]
          : []

        const assistantMessage = agentSessionMessageFactory.build({
          role: "assistant",
          agentRevision: 1,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        })

        // The last turn ran on the newer revision, so the footers show different versions.
        const messages = withMessages
          ? [
              agentSessionMessageFactory.build({ role: "user", agentRevision: 1 }),
              assistantMessage,
              agentSessionMessageFactory.build({ role: "user", agentRevision: 2 }),
              agentSessionMessageFactory.build({ role: "assistant", agentRevision: 2 }),
            ]
          : []

        return {
          state: mergeSeeds(
            baseSeeds,
            seed.agents([...restAgents, currentAgent], { currentId: currentAgent.id }),
            seed.conversationAgentSessions({ [currentAgent.id]: [session] }),
            subSessions.length > 0
              ? seed.conversationSubSessions({ [session.id]: subSessions })
              : {},
            seed.currentAgentSessionId(session.id),
            seed.agentSessionMessages(messages),
            versions.length > 0 ? seed.studio.agentHistory(versions) : {},
          ),
        }
      },
    ),
```

Add the `Agent` type import if it is not already present:

```tsx
import type { Agent } from "@/common/features/agents/agents.models"
```

- [ ] **Step 3: Add the scenario stories**

After the existing `WithSubAgentForms` story:

```tsx
/** A draft exists but is not published, so the header warns the running revision is older. */
export const WithPendingDraft: Story = {
  args: { withVersionHistory: true, withPendingDraft: true },
  decorators: Default.decorators,
}

/** A member who cannot manage the agent sees no version indicators. */
export const NonManager: Story = {
  args: { agentMembershipRole: "member", withVersionHistory: true },
  decorators: Default.decorators,
}

/** History not loaded (or failed): the playground renders, message badges fall back to nothing. */
export const WithoutVersionHistory: Story = {
  args: { withVersionHistory: false },
  decorators: Default.decorators,
}
```

- [ ] **Step 4: Verify the stories build and check each scenario**

Run from `apps/web`:

```bash
npm run typecheck
npx storybook build --quiet
```

Expected: PASS. Then, running Storybook (`npx storybook dev`), confirm under `routes/studio/project/agent/session`:
- `Default` — assistant footers show `v1` and `v2` badges; the header shows `v2`; clicking a badge opens the history sheet with that revision selected in the timeline.
- `WithPendingDraft` — header shows `v2` plus the "version 3 draft not published" hint.
- `NonManager` — no badges anywhere, no header badge.
- `WithoutVersionHistory` — no header badge; message badges still show the revision recorded on each message.

If Storybook cannot be run in this environment, say so explicitly in the report rather than claiming the scenarios were checked.

- [ ] **Step 5: Final gates**

Run from the repo root:

```bash
npm run biome:check
npm run typecheck
```

From `apps/web`:

```bash
npx vitest run src/studio/features/agents
```

From `apps/api`:

```bash
npm run test:parallel
npm run check:boundaries
```

Expected: all pass. Per the repo's memory notes, `test:parallel` can produce SIGTERM'd-worker and known-flaky `csv-extraction` cancel-one failures; re-run any failure in isolation with `npx jest --colors --runInBand --forceExit <path>` before reporting it as a real break.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/stories/routes/studio/agent/AgentSessionRoute.stories.tsx
git commit -m "test(agents): cover playground revision indicator states in stories"
```

---

## Verification Summary

| Spec requirement | Task |
|---|---|
| `agentRevision` on the message DTO, relation loaded, mapper updated | 1 |
| e2e coverage incl. a session spanning two revisions | 1 |
| `resolveMessageRevision` + unit spec (4 cases) | 2 |
| `agentRevision` defaulted in the web message factory (ADR 0010 rule) | 2 |
| `findPublishedVersion` used for the header | 2, 6 |
| `AgentVersionHistorySheet` extraction, `initialRevision`, `AgentRevisionBadge` | 3 |
| i18n keys (en + fr), reusing `status:*` | 3 |
| History loaded at the Studio agent route, manager-gated, no `AsyncRoute` gate | 4 |
| `useMount` removed from `AgentVersionHistory` (no double fetch) | 3 (removal), 4 (replacement) |
| Message footer badge after the copy button, Studio-only slot | 5 |
| Desk / Tester / public chat unchanged | 5 (step 4) |
| Header badge for the published revision + draft-pending hint | 6 |
| Stories for manager / pending draft / non-manager / no-history | 7 |
| Completion gates (biome, typecheck, API tests, boundaries) | 1, 3-7 |
