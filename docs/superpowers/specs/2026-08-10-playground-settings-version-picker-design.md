# Studio playground: choose which settings version to run

Issue: [#622](https://github.com/bayesimpact/bayes-platform/issues/622)

## Problem

Drafts and named versions shipped (#612 and the publish/archive work). The Studio playground shows
which published version new messages run with, and each agent reply carries a version badge. But the
playground always runs the published version: `StreamingController.stream` resolves settings with
`agentSettingsService.getLast({ includesDraft: false })` and ignores anything the client might want.

Testing a draft therefore requires publishing it, which defeats the point of a draft.

## Goal

Let the user pick which settings version the playground runs, defaulting to the draft when one
exists. The choice applies to new messages only, so a single session can mix versions and each
reply keeps showing what actually produced it.

## Decisions

Four points the issue left open, settled before design:

| Question | Decision |
|---|---|
| Where the choice lives | Redux, keyed by `agentSessionId`, reset on page reload |
| Archived versions selectable | No. Draft plus non-archived published only |
| What the request carries | `agentSettingsRevision: number` |
| Sharing with the eval dialog | Copy the wording, no refactor of `RunEvaluationConversationDialog` |

`agentSettingsRevision` rather than the `agentSettingsId` named in the issue: the agent is already a
path parameter, so a revision number cannot address another agent's settings and needs no ownership
check. It also matches the `v{revision}` badge and the value evaluations already send
(`createEvaluationConversationRunSchema.agentSettingsRevision`).

Archived versions stay out because `AgentSettingsController.getAll` already omits them (it passes
`includesDraft: true` but no `includesArchived`), so the picker and the version history show the same
list with no new API flag. Reproducing an old behaviour remains the job of restore.

## Architecture

### API contract

`packages/api-contracts/src/agents/shared/agent-session-messages/agent-session-messages.routes.ts`,
the `stream` route payload gains one optional field:

```ts
stream: defineRoute<
  ResponseData<AgentSessionStreamResponse>,
  RequestPayload<{ content: string; attachmentDocumentId?: string; agentSettingsRevision?: number }>
>({ method: "post", path: `${basePath}/stream` })
```

The route is invoked as a GET with the payload JSON-encoded in `?q=`, so this is additive on both
sides and older clients keep working.

### Backend resolution

`StreamingController.stream` replaces its single `getLast` call with a resolution that depends on the
session type and on whether a revision was sent:

| `agentSession.type` | Revision sent | Runs with |
|---|---|---|
| `playground` | yes | `agentSettingsService.get({ connectScope, agentId, revision })`. `NotFoundException` when the revision does not exist, `UnprocessableEntityException` when it is archived |
| `playground` | no | `getLast({ connectScope, agentId, includesDraft: true })` |
| `live` | yes | `ForbiddenException` |
| `live` | no | `getLast({ connectScope, agentId })`, unchanged |

Every one of those exceptions reaches the client as an SSE frame, not an HTTP status. Nest's
`RouterResponseController.sse` catches whatever the handler throws and writes
`event: error\ndata: <err.message>`, with the response status still 200. Verified by probing the
running stack, not assumed: the existing "empty content" test already asserts 200 plus
`event: error`. So tests assert on the error frame's `data:` line, and the web client surfaces these
through the `onError` handler `streamChatResponse` already has.

That in turn requires narrowing the controller's `try` block. Today it wraps the whole handler and
rewrites every failure as `Invalid query format`, which would flatten "revision 9 not found" and
"version selection is playground-only" into the same unhelpful message. The `try` shrinks to cover
only `JSON.parse`.

Two things that look like details but are not:

**The playground's no-revision default includes the draft.** `StudioAgentRoute` deliberately does not
gate rendering on the settings history fetch (its own comment says the playground shows immediately
and the indicators appear once the fetch lands). So there is a window where the user can send a
message before the client knows which revisions exist. Defaulting that window to published would
silently run the wrong version while the header claims Draft. Defaulting it to the latest including
draft makes the client's explicit revision a narrowing of an already-correct default rather than the
only thing standing between the user and a wrong run.

**A revision on a live session is rejected, not ignored.** Silently dropping it would let a caller
believe it ran a draft in production. The playground policy path already restricts these sessions to
project admins and owners (`BaseAgentSessionPolicy.canList` requires `isProjectAdminOrOwner` for any
non-live session), so no new permission is needed, only the session-type gate.

Sub-agents are out of scope. `sub-agent-tools.ts` resolves each child agent's settings with its own
`getLast`, so a parent running a draft still delegates to published children. Worth recording on the
issue, not worth changing here.

### Frontend state

`agent-settings.slice.ts` gains one field and one action:

```ts
interface State {
  history: DataType
  playgroundRevisionBySessionId: Record<string, number>
}
```

with `selectPlaygroundRevision({ agentSessionId, revision })`. The map is keyed by session, so
switching between sessions in the SPA preserves each one's choice, and a reload starts over from the
default.

A selector resolves the effective revision as `explicit choice ?? draft ?? published`, returning
`undefined` while the history is still loading. Computing the default rather than dispatching it on
mount keeps the "no choice yet" state honest: nothing to reset, and a newly created draft becomes the
default immediately without a second effect.

`sendMessage` reads that selector and threads `agentSettingsRevision` through `streamChatResponse`
into the query payload.

### UI

The playground header currently renders a static `AgentRevisionBadge` for the published version. It
becomes `AgentSettingsVersionSelect`, a new component in
`apps/web/src/studio/features/agents/agent-settings/components/`, listing the same versions as the
history sheet.

Wording is copied from the eval dialog's `evaluationConversationRun:version.*` into new
`agentSettings:version.*` keys in the shared agent-settings locales, so the two places read the same
without coupling the eval form to a studio component.

Draft is rendered distinctly: outline styling in amber and the literal word Draft, not just `v7`.
This is the issue's "visible enough that nobody demos a draft to a client by accident" requirement,
and a number alone does not carry it. The select is disabled while a stream is in flight, since
switching mid-answer would misattribute the reply, and when the list holds nothing to switch to.
There is no loading state to render: the route reads the history through `useValue`, which does not
return until the data is fulfilled.

The select sits behind the same `canManageAgent` check that gates the current badge. A user without
it sees no picker and no revision indicators, and their messages run the playground's server-side
default.

Two adjacent reads in `StudioAgentSessionRoute` follow the selection instead of the published
version:

- `resolveMessageRevision` falls back to `findPublishedVersion(versions)` for the optimistic message
  built client-side during streaming. That fallback becomes an explicit `fallbackRevision` parameter
  fed by the effective revision, otherwise an in-flight draft answer is labelled with the published
  number until the refetch lands.
- `formResultSchema` reads `selectAgentSettingsDataByAgentId({ agentId })`, which resolves to the
  published revision. It reads the selected version's settings instead, or the fillForm panel renders
  a stale schema whenever the draft changed it.

## Testing

API, extending
`apps/api/src/domains/agents/shared/agent-session-messages/streaming/e2e-tests/stream.spec.ts`:

- playground session with an explicit draft revision runs the draft
- playground session with an explicit published revision runs that revision
- playground session with no revision runs the draft when one exists
- playground session with an unknown revision returns 404
- playground session with an archived revision returns 422
- live session with a revision returns 403
- live session with no revision runs published, guarding the existing behaviour

Web:

- unit tests on the effective-revision selector: explicit choice wins, draft wins over published,
  published when no draft, `undefined` while the history is loading
- unit tests on `resolveMessageRevision` with an explicit fallback revision, extending
  `agent-settings.functions.spec.ts`
- `AgentSessionRoute.stories.tsx` already carries a `withPendingDraft` arg and a `WithPendingDraft`
  story, so both header states are reachable already. What changes is the story's doc comment, which
  currently promises "the header badge stays on the older running revision" and stops being true the
  moment the draft becomes the default.

## Out of scope

- Persisting the choice across reloads
- Selecting archived versions
- Sub-agent version selection
- Refactoring `RunEvaluationConversationDialog` onto a shared picker
