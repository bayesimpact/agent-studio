# Agent settings version visibility in the Studio playground

**Date:** 2026-07-29
**Status:** Approved (design)
**Scope:** `apps/api`, `packages/api-contracts`, `apps/web` (no DB migration)

## Problem

Agent settings are versioned: every save produces an `agent_settings` row with a
`revision`, an optional draft state, and an optional revision name/description.
The Studio agent editor exposes that history through a side sheet
(`AgentVersionHistory` → `AgentVersionExplorer`), but the playground shows nothing:
a user reading a conversation cannot tell which version of the agent produced a
given answer, nor which version the next message will run with.

This matters because a single session can span several revisions. Streaming always
resolves the latest **published** settings (`AgentSettingsService.getLast()` without
`includesDraft`, see `streaming.controller.ts`), so publishing mid-session silently
changes the agent behind the conversation.

The information is already persisted — `agent_message.agent_settings_id` is a
non-nullable FK on every message — it is simply never surfaced.

## Goals

1. Load the agent settings history when the Studio **agent route** mounts, not only
   when the version sheet is opened, so the playground can label versions.
2. Show the revision of the agent settings that produced each message, next to the
   copy button. The badge is **clickable** and opens the version history sheet
   preselected on that revision. This is assistant turns only: the footer holding the
   copy and feedback actions is not rendered for user messages, nor while streaming.
3. Show the revision the playground is currently running with in the session
   `GridHeader`, with a hint when an unpublished draft exists.

## Non-goals

- No database migration. `agent_message.agent_settings_id` already exists.
- No change to which settings streaming resolves. Behaviour stays "latest published".
- No new version indicators in Desk, Tester, reviewer, or public chat. The shared
  message components gain an opt-in slot that only Studio fills.
- No relaxation of the history endpoint's authorization. Version indicators are
  manager-only (see "Authorization" below).
- No restore/publish affordances beyond what the existing sheet already provides.

## Decisions

### Header semantics: the published revision in use

In Studio, `selectCurrentAgentData` is fed by `getAllWithDrafts`, so `agent.revision`
is often the **draft** revision — which the playground does *not* run. The header must
therefore not use `agent.revision`. It shows the newest non-draft revision from the
history list (`versions.find((version) => !version.isDraft)`), the same derivation
`AgentVersionList` already uses for its "current" badge, plus a muted "draft pending"
hint when `versions[0].isDraft`.

### Per-message revision comes from the API, not from client-side mapping

The message DTO gains the revision number directly. The rejected alternative was
exposing `agent_settings_id` on the message and mapping it client-side against the
history list — that would additionally require the settings row id on `AgentDto`
(today `AgentDto.id` is the *agent* id, not the settings id), and would leave badges
blank whenever history has not loaded.

### Authorization: manager-only indicators

The history endpoint (`AgentSettingsRoutes.getAll`) is gated on
`@CheckPolicy((policy) => policy.canUpdate())`, while the Studio agent route is
reachable by project members who cannot manage the agent. Rather than relax the
policy and build a read-only sheet mode, both indicators and the history fetch are
gated on `abilities.canManageAgent({ agentId })`. Non-managers see the playground
exactly as they do today, and no 403 is ever triggered.

## Design

### 1. API: revision on each message

`packages/api-contracts/src/agents/shared/agent-session-messages/agent-session-messages.dto.ts`

```ts
export type AgentSessionMessageDto = {
  // …existing fields
  /** Revision of the agent settings that produced this message. */
  agentRevision?: number
}
```

Optional, for one reason: messages created during a live stream are constructed
client-side by the `startStreaming` reducer and never refetched, so they carry no
revision until the session is reloaded. The frontend falls back to the current
published revision for those, which is exactly the revision streaming used.

`apps/api/src/domains/agents/conversation-agent-sessions/conversation-agent-sessions.service.ts`
- `listMessagesForSession` and `getMessageById` load `relations: { agentSettings: true }`.
  One join, no N+1.

`apps/api/src/domains/agents/shared/agent-session-messages/agent-messages.controller.ts`
- `toDto` maps `agentRevision: message.agentSettings?.revision`.

### 2. History loaded at the Studio agent route

A new wrapper `apps/web/src/studio/routes/StudioAgentRoute.tsx` sits at
`StudioRoutes.agent.path` in `StudioRoutes.tsx`, inside the existing `<AgentRoute>`:

```tsx
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

- The existing `agentHistoryMiddleware` listener on `agentHistoryActions.mount`
  already dispatches `listAgentHistory()`; no middleware change.
- The `useMount` currently living in `AgentVersionHistory` is **removed**, so the
  sheet no longer refetches on open and there is no double fetch.
- No `AsyncRoute` gate on the history data. The playground renders immediately and
  indicators appear when the history arrives. The sheet keeps its own gate.

`agentHistory` is a Studio dynamic slice (registered in `studio/store/slices.ts`),
so it is available everywhere under the Studio route tree. `agentHistoryActions.unmount`
is a no-op reducer with no middleware listener, so leaving the route does not clear the
loaded history — `refreshOn: [agent.id]` is what keeps it correct when switching agents.

### 3. Shared version sheet and badge

Extract the sheet chrome out of `AgentVersionHistory` so the editor button and the
new badges share one implementation:

- **`AgentVersionHistorySheet`** (new) — `Sheet` + header + `AsyncRoute` on the
  history data + `AgentVersionExplorer`. Props: `agent`, `trigger: ReactNode`,
  `initialRevision?: number`.
- **`AgentVersionHistory`** (existing) — becomes the editor's trigger button
  (`History` icon, `v{agent.revision}`, draft/published badge) wrapped in the new
  sheet component. Behaviour unchanged for the editor.
- **`AgentVersionExplorer`** — gains an optional `initialRevision?: number` prop,
  seeding its existing `useState<number | null>` selection. `buildComparison` is
  untouched: it already resolves a default when the selection is `null` and clamps
  an unknown revision to the default index.
- **`AgentRevisionBadge`** (new) — a `Badge`-styled button reading `v{revision}`,
  used as the trigger of `AgentVersionHistorySheet` with that revision preselected.
  Tooltip carries the revision name and date when the matching history entry is
  loaded, falling back to the bare revision label.

### 4. Message footer badge

`AgentSessionMessages` gains an optional render slot, drilled two levels to the
footer:

```tsx
renderMessageVersion?: (message: AgentSessionMessage) => React.ReactNode
```

`AgentSessionMessages` → `Messages` → `AgentSessionMessage`, rendered inside
`MessageFooter` directly after `<CopyToClipboard />`. The footer only exists on
completed assistant turns, which is the intended scope. Desk, Tester and public chat
omit the prop and are unaffected.

`StudioAgentSessionRoute` supplies the renderer:

```tsx
const renderMessageVersion = (message: AgentSessionMessage) => {
  const revision = resolveMessageRevision(message, versions)
  if (!canManageAgent || revision === undefined) return null
  return <AgentRevisionBadge agent={agent} revision={revision} versions={versions} />
}
```

### 5. Playground grid header

In `StudioAgentSessionRoute`'s `GridHeader` `description`, after the existing
name / type / date row, append (manager-only, and only once history is loaded):

- `<AgentRevisionBadge>` for the published revision.
- A muted "draft pending" hint when `versions[0].isDraft`, so the badge can never be
  read as "the draft is live".

### 6. Revision resolution helper

A pure function, unit-tested, mirroring the `AgentVersionExplorer.spec.ts` precedent:

```ts
/**
 * Revision to label a message with: the one the API recorded, else the published
 * revision — the fallback for messages created client-side during streaming, which
 * always ran the latest published settings.
 */
export function resolveMessageRevision(
  message: AgentSessionMessage,
  versions: Agent[],
): number | undefined
```

Cases: recorded revision present; recorded revision absent with a published version
available; recorded revision absent and history empty (returns `undefined`, badge
hidden); recorded revision not present in the history list (still labelled, tooltip
falls back to the bare revision).

## Data flow

```
agent_settings ──FK── agent_message
       │                    │
       │ getAllHistory      │ listMessagesForSession (relations: agentSettings)
       ▼                    ▼
  Agent[] (agentHistory) …… AgentSessionMessageDto.agentRevision
       │                    │
       │                    ▼
       │        resolveMessageRevision(message, versions)
       │                    │
       ├────────────────────┴──► AgentRevisionBadge ──► AgentVersionHistorySheet
       │                                                 (initialRevision)
       └──► published = versions.find(v => !v.isDraft) ──► GridHeader badge + hint
```

## Error handling

- History fetch fails: `agentHistory.data` goes to `Error`. Indicators render nothing
  (`resolveMessageRevision` still returns the API-recorded revision, so message badges
  survive; the header badge, which depends on history, is hidden). The playground and
  chat keep working. The editor sheet surfaces the error through its `AsyncRoute` gate,
  as it does today.
- Non-manager users: fetch never dispatched, indicators never rendered.
- `agentRevision` missing on a message with no published version in history: badge
  hidden for that message rather than showing a wrong number.

## Testing

**API**
- Extend `agent-session-messages` list e2e spec: messages expose `agentRevision`;
  a session whose messages span two revisions reports each message's own revision.
- Existing auth specs unchanged (no policy change).

**Web**
- Unit spec for `resolveMessageRevision` covering the four cases above.
- Update `stories/routes/studio/agent/AgentSessionRoute.stories.tsx` with
  `seed.studio.agentHistory(...)` and messages spanning revisions, plus `argTypes`
  toggles so these states are reachable from the controls panel:
  - manager with a published-only history,
  - manager with a pending draft (header hint visible),
  - non-manager (no indicators),
  - history empty / not loaded.

**i18n**
- New keys under the `agent:history.*` namespace (en + fr) for the badge aria-label,
  the tooltip line, and the draft-pending hint. Reuse `status:draft` /
  `status:published` rather than adding duplicates.

## Completion criteria

- `npm run biome:check`, `npm run typecheck` pass.
- `npm run test` passes for `apps/api`; `npm run check:boundaries` passes (no new
  TypeORM relation cycle expected — the `AgentMessage` → `AgentSettings` relation
  already exists).
