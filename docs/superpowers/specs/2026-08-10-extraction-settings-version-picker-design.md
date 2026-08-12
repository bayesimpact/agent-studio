# Studio extraction: choose which settings version to run

Follows [the playground settings version picker](./2026-08-10-playground-settings-version-picker-design.md).

## Problem

The Studio playground now lets you pick which settings version new messages run with. Studio
extraction does not. `ExtractionAgentSessionsController.executeOne` and
`AgentCsvExtractionRunsController.createOne` both resolve settings with
`agentSettingsService.getLast({ connectScope, agentId })`, which returns the published version and
ignores anything the client might want.

So testing a draft against a document requires publishing it, which defeats the point of a draft,
and leaves the two Studio surfaces behaving differently for the same agent.

## Goal

Let the user pick which settings version an extraction runs with, from both forks of the New
Extraction screen: single documents and CSV batches. The choice applies to runs started after it,
and each run keeps showing the version that actually produced it.

## Decisions

| Question | Decision |
|---|---|
| Which entry points | Single-document extraction and CSV batch. Eval extraction runs stay out |
| Where the picker sits | Next to each run action: the New Extraction header, and the CsvExtractor header |
| Default | Draft first in the picker, matching the playground: `explicit choice ?? draft ?? published`. Server-side, draft-first applies to single-document runs only (see below) |
| CSV retry | Reuses the run's pinned `agentSettingsId` instead of re-resolving latest published |
| What the request carries | `agentSettingsRevision?: number` |

`agentSettingsRevision` rather than an id, for the reason the playground design gives: the agent is
already a path parameter, so a revision number cannot address another agent's settings and needs no
ownership check. It also matches the `v{revision}` badge the run list already renders.

Archived versions stay out. `AgentSettingsController.getAll` omits them, so the picker and the
version history show the same list with no new API flag.

## Architecture

Both flows already persist the settings they resolved (`ExtractionAgentSession.agentSettingsId`,
`AgentCsvExtractionRun.agentSettingsId`) and their async workers read from that, so the version is
captured at creation. The only thing missing is a way for the client to say which version to
capture. Nothing about job payloads or worker resolution changes.

### API contract

Two payloads gain one optional field each, additive on both sides so older clients keep working.

`packages/api-contracts/src/agents/extraction-agent-sessions/extraction-agent-sessions.routes.ts`:

```ts
executeOne: defineRoute<
  ResponseData<ExtractionAgentSessionResultDto>,
  Request<Pick<ExtractionAgentSessionSummaryDto, "documentId"> & { agentSettingsRevision?: number }>
>({ method: "post", path: `${prefix}/execute` })
```

`packages/api-contracts/src/agents/agent-csv-extraction-runs/agent-csv-extraction-runs.dto.ts`, on
`CreateAgentCsvExtractionRunRequestDto`:

```ts
agentSettingsRevision?: number
```

### Backend resolution: single-document extraction

`executeOne` already carries `type: playground | live`, and `BaseAgentSessionGuard` checks it against
`BaseAgentSessionPolicy.canCreate()`, which requires project admin or owner for anything non-live.
That is a real gate rather than a client claim, so the resolution branches on session type exactly
as `StreamingController.stream` does:

| `payload.type` | Revision sent | Runs with |
|---|---|---|
| `playground` | yes | `get({ connectScope, agentId, revision })`. `NotFoundException` when the revision does not exist, `UnprocessableEntityException` when it is archived |
| `playground` | no | `getLast({ connectScope, agentId, includesDraft: true })` |
| `live` | yes | `ForbiddenException` |
| `live` | no | `getLast({ connectScope, agentId })`, unchanged |

Unlike the streaming controller, these are plain POST handlers. Nest returns the exceptions as real
HTTP statuses, so there is no SSE error frame to unpack and no `try` block to narrow. The existing
`ApiError` handling on the client surfaces them.

The playground default including the draft matters for the same reason it did in the playground
itself. The extraction screen does not gate rendering on the settings history fetch, so there is a
window where the user can start a run before the client knows which revisions exist. Defaulting that
window to published would run a version the picker does not claim. Defaulting it to latest-including-draft
makes the client's explicit revision a narrowing of an already-correct default.

A revision on a live session is rejected rather than ignored, so that no caller can believe it ran a
draft in Desk.

### Backend resolution: CSV

CSV runs have no session type and no live/playground distinction on the entity, so `createOne` needs
its own gate. It rejects an explicit `agentSettingsRevision` with `ForbiddenException` unless
`request.projectMembership?.role` is `admin` or `owner`, the same bar
`AgentSettingsController.getAll` already enforces through `policy.canUpdate()`. That is exactly the
set of people who can list the versions in the first place, so the gate adds no new concept.

With a revision and the right role, `createOne` resolves through
`agentSettingsService.get({ connectScope, agentId, revision })` with the same 404 and 422 cases as
above. With no revision it keeps calling `getLast` and behaviour is unchanged.

The two forks therefore have different server-side defaults, and that asymmetry is deliberate. The
single-document endpoint can default to the draft because `type` tells it the run is a playground
run. A CSV run carries no such discriminator, and the same screen serves Desk, so defaulting CSV to
`includesDraft: true` would make Desk users run drafts. Draft-first is a property of the picker on
both forks; server-side it is a property of the single-document endpoint alone. The window where
this shows is the moment before the settings history loads, when the picker has not rendered and the
client sends no revision: a CSV run started in that window uses published.

### Backend: CSV retry

`retryOne` currently calls `getLast` and enqueues records against latest-published, while the run row
keeps its original `agentSettingsId`. A retried run therefore advertises one revision and executes
another. Today that drift is invisible; with a picker it becomes "I ran the draft, retried, and got
published".

`retryOne` drops the `getLast` and loads the run's own `agentSettingsId` instead, so a retry always
matches the badge on the run.

### Frontend state

`agent-settings.slice.ts` gains one map and one action beside the playground's:

```ts
interface State {
  history: DataType
  playgroundRevisionBySessionId: Record<string, number>
  extractionRevisionByAgentId: Record<string, number>
}
```

with `setExtractionRevision({ agentId, revision })`. Keyed by agent rather than by session, because
no session exists at the moment of choosing. A reload starts over from the default, as the
playground does.

`selectExtractionRevision({ agentId })` reuses the existing
`resolveEffectiveRevision({ versions, chosenRevision })`, returning `explicit ?? draft ?? published`
and `undefined` while the history is still loading. Callers that get `undefined` send no revision and
let the API apply its own default.

`extractionAgentSessionsThunks.executeOne` and `agentCsvExtractionRunsThunks.createAndExecute` both
read that selector and thread `agentSettingsRevision` into their payloads.

No fetch to add. `AgentExtractionRoute` sits under `StudioAgentRoute`, which already mounts
`agentSettingsActions` conditioned on `canManageAgent`, so the history is loaded for exactly the
users who will see the picker.

### UI

`AgentSettingsVersionSelect` is generalised. It currently takes `agentSessionId`, reads
`selectStreaming`, and dispatches `setPlaygroundRevision` itself. Three things become props:
`revision`, an `onChange` callback, and a `disabled` flag. The playground passes its `isStreaming`
value through `disabled`; extraction passes nothing, since there is no in-flight stream to protect.
What the component keeps reading for itself stays put, because both call sites want the same answer:
the version list from `selectAgentSettingsHistoryDataByAgentId({ agentId, includeDraft: true })`, the
`canManageAgent` check, and the "fewer than two versions" early return. Everything visible stays too:
the amber outline and the literal word Draft, and version names under each item.

Two mount points, both beside the action that consumes the choice:

- `AgentExtractionRoute`'s `GridHeader` action, next to the file uploader, driving single-document runs
- `CsvExtractor`'s footer row, immediately left of Run, driving CSV runs. Its `GridHeader` carries
  only a title and a back button, so the header is not where that screen's run action lives

Both files live in `common/` and are shared with Desk, so the picker arrives through a
`renderVersionPicker` prop that Studio passes and Desk does not. This is the pattern
`renderRevisionBadge` already establishes in `StudioRoutes.tsx`, and it keeps Desk on published with
no extra gate to maintain. `CsvExtractor` is not a route, so `AgentExtractionRoute` receives the prop
and hands it down through the fork it already owns.

`CsvExtractor` already holds six `useState` hooks, over the repo's limit of two. The picker's state
lives in Redux, so the component gains none, and the pre-existing violation is left alone rather than
folded into this work.

## Testing

API e2e, mirroring the structure of
`apps/api/src/domains/agents/shared/agent-session-messages/streaming/e2e-tests/stream.spec.ts`:

- playground extraction with an explicit draft revision runs the draft
- playground extraction with an explicit published revision runs that revision
- playground extraction with no revision runs the draft when one exists
- playground extraction with an unknown revision returns 404
- playground extraction with an archived revision returns 422
- live extraction with a revision returns 403
- live extraction with no revision runs published, guarding existing behaviour
- CSV `createOne` with a revision as project admin pins that revision on the run
- CSV `createOne` with a revision as a plain project member returns 403
- CSV `createOne` with no revision pins published, guarding existing behaviour
- CSV `retryOne` enqueues against the run's pinned settings, not latest published

Web:

- unit tests on `selectExtractionRevision`: explicit choice wins, draft beats published, published
  when no draft exists, `undefined` while the history loads
- unit tests confirming both thunks omit `agentSettingsRevision` when the selector returns `undefined`
- stories covering both mount points with and without a pending draft, following the existing
  `withPendingDraft` arg

## Out of scope

- Eval extraction runs (`RunEvaluationExtractionDialog` has no picker today and does not gain one)
- Persisting the choice across reloads
- Selecting archived versions
- Sub-agent version selection, which still resolves its own `getLast`
- Reducing `CsvExtractor`'s `useState` count
