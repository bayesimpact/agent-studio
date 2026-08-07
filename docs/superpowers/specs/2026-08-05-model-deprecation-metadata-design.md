# Model deprecation metadata and migration banner

Date: 2026-08-05
Issue: #550

## Problem

`gemini-2.5-flash` and `gemini-2.5-pro` are retired by the provider on 2026-09-30. Agents
running them will break. Today nothing in the product tells an agent author that their model is
going away, and new agents are still created on `gemini-2.5-flash`.

This will happen again with other models, so the mechanism has to be data-driven: declaring a
future deprecation should be one entry in a map, not a new code path.

## Decisions

| Question | Decision |
| --- | --- |
| Where the metadata lives | An exhaustive constant in `api-contracts`, shared by API and web. No endpoint, no fetch — it is a static catalog, not per-tenant data. |
| `vertex-3` feature flag | Removed entirely. All Gemini 3.x models become selectable everywhere. |
| Deprecation date | 2026-09-30 for both 2.5 models. |
| Banner dismissible | No. It is a required migration. |
| Deprecated models still selectable | Yes, labelled `gemini-2.5-flash (deprecated)`. Authors need to keep running them while they compare against the replacement. |
| Recommended replacements | `gemini-2.5-flash` → `gemini-3.5-flash-lite`; `gemini-2.5-pro` → `gemini-3.5-flash`. |
| Default model for new agents | `gemini-3.5-flash-lite`. |

## Contract layer

`packages/api-contracts/src/agents/agents.dto.ts`, next to the existing
`AgentModelToAgentProvider`:

```ts
export type AgentModelDeprecation = {
  /** ISO date (YYYY-MM-DD) on which the provider retires the model. */
  deprecatedOn: string
  recommendedReplacement: AgentModel
}

export type AgentModelMetadata = {
  deprecation?: AgentModelDeprecation
  /** Set when the model is only served outside the EU region (no EU data-processing guarantee). */
  servedOutsideEu?: boolean
}

export const AgentModelMetadataMap: Record<AgentModel, AgentModelMetadata> = {
  [AgentModel.Gemini25Flash]: {
    deprecation: {
      deprecatedOn: "2026-09-30",
      recommendedReplacement: AgentModel.Gemini35FlashLite,
    },
  },
  [AgentModel.Gemini25Pro]: {
    deprecation: {
      deprecatedOn: "2026-09-30",
      recommendedReplacement: AgentModel.Gemini35Flash,
    },
  },
  [AgentModel.Gemini31FlashLite]: {},
  [AgentModel.Gemini35FlashLite]: {},
  [AgentModel.Gemini35Flash]: {},
  [AgentModel.Gemini36Flash]: { servedOutsideEu: true },
  [AgentModel.MedGemma10_27B]: {},
  [AgentModel.Gemma4_26B]: {},
  [AgentModel.MistralSmall31_24B]: {},
  [AgentModel._Mock]: {},
}

export const DEFAULT_AGENT_MODEL = AgentModel.Gemini35FlashLite

// `model` is typed `string`, not `AgentModel`, on purpose: `agent_settings.model` is an
// unconstrained varchar, so a stored value can fall outside the enum (most concretely once the
// 2.5 members are deleted after the retirement date). Both readers index through a
// `Partial<Record<string, AgentModelMetadata>>` view so an unknown model reads as "not
// deprecated" rather than throwing mid-render.
export function getAgentModelDeprecation(model: string): AgentModelDeprecation | undefined
export function isAgentModelServedOutsideEu(model: string): boolean
```

Two properties matter here:

- The map is `Record<AgentModel, …>`, not `Partial<Record<…>>`, so adding a model to the enum
  fails to compile until it has an entry. Every model carries metadata; the *fields* are what is
  optional.
- `deprecatedOn` and `recommendedReplacement` are grouped in one optional object, which makes
  "deprecated implies a replacement" a type invariant. No consumer has to render a deprecated
  model with nowhere to migrate to. If a model is ever sunset with no successor, that becomes a
  deliberate one-line type change rather than a silent gap.

`getAgentModelDeprecation` is the single read path. It drives both the dropdown label and the
banner, so a future deprecation is one map entry and nothing else.

`DEFAULT_AGENT_MODEL` lives beside the catalog so the default and the deprecation data cannot
drift apart.

### Backend

The backend imports the same constant, satisfying the requirement that every model carries
deprecation metadata on the server. No behaviour changes: a deprecated model still runs. We
surface the deprecation, we do not enforce it.

## Frontend

### Model option helpers

New `apps/web/src/common/features/agents/agent-model.helpers.ts`:

```ts
export type AgentModelLabelSuffixes = { deprecated: string; nonEu: string }

export function buildAgentModelOptions(hasFeature: HasFeature): AgentModel[]
export function formatAgentModelLabel(
  model: AgentModel,
  suffixes: AgentModelLabelSuffixes,
): string
```

`formatAgentModelLabel` returns `gemini-2.5-flash (deprecated)` for a deprecated model and
`gemini-3.6-flash (non-EU)` for one served outside the EU, the bare id otherwise. A model that is
both gets both suffixes, which is why the strings arrive as one object rather than a growing
positional list. It takes the already-translated strings (i18n keys
`agent:model.deprecatedSuffix` and `agent:model.nonEuSuffix`) rather than a `TFunction`, so it
stays pure and testable without a cast.

`buildAgentModelOptions` is the single source of truth for which models a project may pick:
Vertex and Vertex3 always, the `medgemma` / `gemma` / `mistral` provider groups behind their
existing flags, `_Mock` never. Vertex3 is deliberately ungated — it holds the recommended
replacements, so hiding it would leave a project unable to migrate.

### Data residency

Ungating Vertex3 has a consequence the migration itself does not need: `gemini-3.6-flash` is not
served on Vertex's EU endpoint, so `AISDKVertex3Provider` routes it through the `global` location,
which carries no EU data-processing guarantee. Every other model stays on `eu`. Before this change,
selecting it required an administrator to enable a project flag; now any project member with
manage-agent rights can.

Rather than re-gate it, the difference is surfaced with the same labelling mechanism as
deprecation — hence `servedOutsideEu` in the catalog and the `(non-EU)` / `(hors UE)` suffix.

The provider's `GLOBAL_ONLY_MODELS` **derives** from that catalog field rather than restating the
list. Two hand-maintained lists of non-EU models would drift, and the drift would be silent and
compliance-relevant.

### Dropdowns

Two components list models, and today each carries its own near-identical copy of the
provider-gating logic (the second with a comment reading "Mirrors
AgentModelTab.extractModelList"):

- `apps/web/src/studio/features/agents/components/AgentModelTab.tsx`
- `apps/web/src/eval/features/evaluation-conversation-runs/components/RunEvaluationConversationDialog.tsx`

Both drop their private builder and call `buildAgentModelOptions` instead, which is what removes
the `vertex-3` gate. Option labels go through `formatAgentModelLabel`. Deprecated models remain in
the list and remain selectable.

The shared function returns `AgentModel[]` rather than the current `[string, AgentModel][]` — the
tuple's first element was the enum key used only as a React `key`, and model ids are already
unique.

### Banner

New `apps/web/src/common/features/agents/components/DeprecatedModelBanner.tsx`:

```tsx
export function DeprecatedModelBanner({ model }: { model: AgentModel }) {
  const deprecation = getAgentModelDeprecation(model)
  if (!deprecation) return null
  // Alert variant="destructive" + TriangleAlert icon
}
```

- Takes a **model**, not an agent, and self-suppresses when the model is healthy. Any surface
  that knows a model can mount it unconditionally, and a future deprecation lights it up with
  no code change.
- Built on `Alert` / `AlertTitle` / `AlertDescription` from `@caseai-connect/ui/shad/alert`,
  `variant="destructive"`, with a lucide `TriangleAlert` icon.
- Non-dismissible.
- Copy explains that the model is retired on the given date, that the agent should be updated
  and re-tested, and names the recommended replacement. The date is formatted with the existing
  `date-fns` locale helper (`apps/web/src/common/utils/get-locale.ts`) so it reads correctly in
  both locales.
- All strings are i18n keys under `agent:model.deprecation.*`, interpolating `model`,
  `replacement` and `date`.

### Mount point

Mounted on the two surfaces the requirement named, and deliberately not on a third:

- `ConversationAgentSessionList` and `ExtractionAgentSessionList` in
  `apps/web/src/studio/features/agents/components/AgentSessionList.tsx` — the agent view.
- `apps/web/src/studio/routes/AgentEditorRoute.tsx`, inside the `Grid` between `GridHeader` and
  `AgentEditor` — the editor view.

These are mutually exclusive rendering paths, so there is no double render: both list components
short-circuit with `if (outlet) return outlet`, so when the editor route is active the list
contributes nothing and only `AgentEditorRoute` mounts the banner.

**Not** mounted in `StudioAgentRoute`, the obvious-looking single mount point. It is the route
element for `StudioRoutes.agent` and therefore wraps *every* nested agent route, including the
playground chat at `StudioRoutes.agentSession`. That chat pins its own height to
`md:h-[calc(100dvh-17rem)]` (`AgentSessionMessages.tsx:73`), where `17rem` encodes exactly how
much chrome sits above it. The height is viewport-relative, so anything inserted above simply
overflows: the banner would push the message composer below the fold, on precisely the agents the
banner exists to warn about. Re-tuning that constant was rejected — `AgentSessionMessages` is
shared with the desk, tester and reviewer surfaces.

The consequence is that the playground chat shows no banner. That is the accepted trade: the chat
is reached from the agent view, which does show it.

## New-agent default

- `getDefaultFormValues` in `apps/web/src/studio/features/agents/components/agent-form.shared.ts`
  uses `DEFAULT_AGENT_MODEL`.
- The eval judge default (`defaultRunFormValues.judgeModel` in `RunEvaluationConversationDialog`,
  plus `evaluation-conversation-runs.factory.ts` on web and
  `evaluation-conversation-run.factory.ts` on the API) also moves to `DEFAULT_AGENT_MODEL`.
  This is beyond the literal "new agents" requirement, and deliberate: defaulting judge runs to
  a model that is retired in September recreates the same problem in the eval surface.
- `apps/web/src/common/features/agents/agent.factory.ts` uses the constant.
- Stories that need to exercise the banner override `model` explicitly to
  `AgentModel.Gemini25Flash` rather than relying on the factory default.

API test fixtures that pass `AgentModel.Gemini25Flash` explicitly are left alone
(`agent.settings.spec.helper.ts`, `agents.service.spec.ts`, the agents e2e specs). They are
self-consistent — the payload they send is the value they assert — so they exercise a valid model
rather than seeding a default. Rewriting them is churn with no behavioural benefit.

## Feature flag removal

Delete the `vertex-3` entry from `packages/api-contracts/src/feature-flags/feature-flags.dto.ts`
and its two call sites (the two dropdowns above). Nothing else in the codebase reads it. Project
rows that still carry the string in their `featureFlags` array become inert — no migration
needed.

## Testing

`packages/api-contracts` has no test runner configured, so the catalog invariants are tested
from `apps/web` (vitest), which consumes both the catalog and the helper.

**`apps/web/src/common/features/agents/agent-model.helpers.spec.ts`** (vitest):

- every `AgentModel` has an entry in `AgentModelMetadataMap` — guards exhaustiveness at runtime
  as well as at compile time;
- no `recommendedReplacement` points at a model that is itself deprecated. This catches the
  future mistake of aiming a migration at a model that is also being sunset;
- `DEFAULT_AGENT_MODEL` is not deprecated;
- `formatAgentModelLabel` appends the deprecation suffix for a deprecated model and not otherwise,
  the residency suffix for `Gemini36Flash` and not for the other Vertex3 models, and both when a
  model is deprecated and non-EU;
- `getAgentModelDeprecation` returns `undefined` for an off-enum model string instead of throwing;
- `buildAgentModelOptions` offers Vertex and Vertex3 with no flags enabled, always includes every
  `recommendedReplacement`, adds a flagged provider's models only when its flag is on, and never
  offers `_Mock`.

**Storybook** carries the rendering coverage — `apps/web` has no component render tests, only
pure-logic vitest specs, and per ADR 0010 every route keeps a story:

- `apps/web/src/stories/routes/studio/agent/AgentRoute.stories.tsx` and
  `apps/web/src/stories/routes/studio/AgentEditorRoute.stories.tsx` each gain a
  `withDeprecatedModel` arg toggle seeding the agent with `AgentModel.Gemini25Flash`, so the
  banner-present and banner-absent states are both reachable from the controls panel.
- The `(deprecated)` dropdown label is covered by the same `AgentEditorRoute` stories: that route
  renders `AgentModelTab`, so the selected option shows the suffix in the deprecated variant and
  not in the default one.

Existing API provider spec files filter on `AgentModelToAgentProvider`, which is untouched.

## Out of scope

- Blocking or auto-migrating agents that run a deprecated model. Authors migrate deliberately
  after re-testing.
- Any backend enforcement, warning log, or telemetry on deprecated-model usage.
- A studio-wide "N agents need migration" overview. The banner is per-agent.
- The `judge_model` column default (`"gemini-2.5-flash"` in
  `evaluation-conversation-run.entity.ts:55`). `EvaluationConversationRunsService.createOne`
  requires `judgeModel`, validates it, and always writes it, so the column default is never
  exercised. Changing it would mean a migration against the shared database for dead
  configuration. The stale doc comment at `evaluation-conversation-run-grader.service.ts:11`
  ("defaulting to Gemini 2.5 Flash") is corrected, since that costs nothing.
- Embedding models. Issue #550 also lists "gemini 1 vs 2 on embeddings", but embedding models
  are env-driven strings (`DOCUMENT_EMBEDDING_MODELS`, resolved in
  `apps/api/src/domains/documents/embeddings/document-embeddings.config.ts`) and are not part of
  the `AgentModel` enum. They need their own migration and do not fit this catalog.
