# ADR 0009: Sub-Route Data Loading with useMount + Middleware + AsyncRoute

* **Status**: Accepted
* **Date**: 2026-04-30
* **Deciders**: Jérémie, Alexis
* **Scope**: Frontend data loading architecture for feature routes in `apps/web`.

---

## 1. Context and Problem Statement

Feature routes (eval, tester, reviewer) need to load data from the API when the user navigates to them. The data depends on URL parameters (organization, project, campaign, session, etc.) that are extracted via React Router's `useParams`.

**The problem**: React fires `useEffect` hooks bottom-up — child effects run before parent effects. When a parent component sets URL-driven IDs to Redux (via `useSetCurrentIds`) and a child component dispatches a `mount()` action that reads those IDs from Redux, the child's effect fires first, reading stale/null IDs. A page refresh works because the `initDone` gate in the root route creates a two-phase rendering cycle.

This caused blank pages on SPA navigation in the tester and reviewer flows.

## 2. Decision

Adopt a three-layer route data loading pattern, first implemented in the eval feature, for all feature routes.

### Layer 1 — Root route: inject slices + set IDs

A single component calls both `useInitStore` (to inject dynamic Redux slices) and a local `useSetCurrentIds` (to sync ALL URL params to Redux). The `initDone` gate creates two-phase rendering:

- **Phase 1**: component renders `<LoadingRoute />`, effects fire — slices are injected and IDs are dispatched to Redux.
- **Phase 2**: `initDone` becomes `true`, children mount — by this time, all IDs are in Redux.

```
TesterRoute / ProjectRouteHandler (eval)
├── useInitStore()       → injects slices, gates on initDone
├── useSetCurrentIds()   → sets ALL IDs (org, project, campaign, session, etc.)
└── if (!initDone) return <LoadingRoute />
```

**Critical**: `useSetCurrentIds` MUST be at the same level as `useInitStore`. Placing it in a child component re-introduces the race condition.

### Layer 2+ — Sub-route wrappers: useMount + AsyncRoute

Each nested route level that needs its own data has a wrapper component that:

1. Reads its condition from a **Redux selector** (e.g. `selectCurrentReviewCampaignId`), not from `useParams` — the IDs were set by the root route.
2. Calls `useMount({ actions, condition: !!id })` — dispatches a `mount` marker action when the condition is met.
3. Returns `<LoadingRoute />` if the ID is not yet set.
4. Returns `<AsyncRoute data={[...]}>{() => <Outlet />}</AsyncRoute>` to block children until data loads.

```
TesterCampaignRoute / EvaluationExtractionDatasetsRoute (eval)
├── useAppSelector(selectCurrentXxxId)
├── useMount({ actions, condition: !!id })
├── if (!id) return <LoadingRoute />
└── <AsyncRoute data={[data]}> → <Outlet />
```

### Middleware: one listener per mount action

Each `mount` action has a dedicated middleware listener that reads current IDs from Redux and dispatches the appropriate loaders.

```ts
listenerMiddleware.startListening({
  actionCreator: featureActions.mount,
  effect: async (_, listenerApi) => {
    const id = selectCurrentXxxId(listenerApi.getState())
    if (!id) return
    listenerApi.dispatch(loadXxx(id))
  },
})
```

When a feature has multiple sub-route levels (e.g. campaign + session), each level gets its own `mount`/`unmount` action pair and its own middleware listener.

### Leaf page components

Leaf components (the actual pages) do NOT dispatch any data loading. They assume all data is available because the route wrappers block rendering until it is.

## 3. Concrete Example: Tester Routes

```
ProtectedRoute
└── TesterRoute                    [useInitStore + useSetCurrentIds + initDone gate]
    └── /tester → TesterMyCampaignsPage   [useMount for campaign list]
    └── TesterCampaignRoute        [useMount(condition: !!campaignId) + AsyncRoute(context)]
        ├── /tester/o/.../campaign → TesterCampaignLandingPage
        ├── /tester/o/.../survey   → TesterEndOfPhaseSurveyPage
        └── TesterSessionRoute     [useMount(condition: !!sessionId) + AsyncRoute(messages)]
            └── /tester/o/.../session → TesterAgentSessionPage
```

**`TesterRoute`** sets `organizationId`, `projectId`, `reviewCampaignId`, `agentSessionId` to Redux.

**`TesterCampaignRoute`** reads `reviewCampaignId` from Redux, dispatches `mount()` → middleware loads campaign context, sessions, survey. Blocks on `testerContext`.

**`TesterSessionRoute`** reads `agentSessionId` from Redux, dispatches `sessionMount()` → middleware loads messages. Blocks on `messagesData`.

**`TesterAgentSessionPage`** renders the conversation UI — no data loading, no `useEffect`, no `useMount`.

## 4. Why Not Alternatives?

### Direct `useEffect` with thunk dispatch in page components

Silent failure mode: different entry points miss fetchers, or multiple components duplicate the same fetch. Violates single-responsibility — pages become coupled to data loading concerns.

### URL-change predicate listeners only

Scope-bound middleware (registered via `injectXxxSlices`) misses the initial `null → id` transition on hard reload — `useSetCurrentIds` in `ProtectedRoute` dispatches before the feature middleware is registered.

### `useSetCurrentIds` in child route wrappers (not root)

Creates a race condition on SPA navigation: the child's `useMount` fires before the parent's `useSetCurrentIds` (React effect ordering is bottom-up). The `initDone` gate in the root route solves this by deferring child mounting.

### Single `mount` action for all sub-route levels

Navigating between sub-routes within the same parent wrapper doesn't re-trigger `useMount` (deps are stable). Each sub-route level needs its own `mount`/`unmount` pair so the middleware can load level-specific data when that wrapper mounts.

## 5. Consequences

- **Positive**: data loading is centralized in route wrappers + middleware. Leaf components are pure presentational. No race conditions on SPA navigation. Consistent pattern across eval, tester, reviewer.
- **Negative**: more boilerplate per feature (route wrappers, mount actions, middleware listeners). Worth it for correctness.
- **Migration**: existing features (studio, desk) that use different patterns should adopt this when refactored. New features MUST use this pattern.
