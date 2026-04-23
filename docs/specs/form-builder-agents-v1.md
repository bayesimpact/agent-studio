# Feature Specification: Form-Builder Agents (v1)

## Overview

A **Form Agent** is a conversational agent that collects structured information from a user through natural dialogue and produces a JSON object matching a predefined schema. The agent type (`form`), the session entity (`FormAgentSession`), and a primitive JSON-schema field (`Agent.outputJsonSchema`) already exist. This spec closes the gap between what exists and what workspace admins actually need to build useful form agents — a first-class **form-builder** authoring experience and a **progress-aware** fill experience for users.

The feature is generic: no assumptions about the domain (intake forms, application forms, data collection, etc.).

---

## Scope (v1)

### In Scope

- **Structured schema editor** in the studio agent form (replaces the raw JSON textarea for form-type agents).
- **Richer schema expressivity**: string / number / boolean / date / single-choice (enum) / multi-choice, with per-field label, description, required flag, and lightweight constraints (min/max length, min/max value, regex).
- **Live schema preview** — a side panel showing the form as it will appear to the user being asked to fill it, updating as the admin edits.
- **Progress UI during session** — the user filling the form sees captured fields vs. remaining fields and an overall completion indicator.
- **Final review step** at session close — user reviews the captured object before submitting.
- **Agent prompt awareness of the schema** — the prompt includes field labels + descriptions so the agent naturally asks for each field.
- **Raw-JSON fallback** behind an "Advanced" toggle for power users and for round-tripping schemas the structured editor doesn't yet support.
- **Starter templates** — a small catalogue of generic schema starters (contact-info form, feedback form, registration form, etc.) seeded as a static asset in `apps/web`.

### Out of Scope (v1)

- **Conditional logic** (show field B only if field A has value X) — deferred to v2.
- **Multi-page forms / steppers** — v1 is single-pass.
- **Nested objects beyond one level** — current Zod schema limit (`outputJsonSchemaSchema` in `agents.dto.ts`) is retained.
- **Cross-field validation** (e.g. "end date after start date") — deferred.
- **Webhook/export integrations** — v1 writes results to `FormAgentSession.result` only; export is manual.
- **Versioned schemas / schema migrations for in-flight sessions** — see open questions.
- **Evaluation of form agents** — covered by ADR 0008 / the review-campaign specs (form agents will be evaluated with a "completeness" reviewer dimension).

---

## Core Product Decisions

1. **Schema is still the source of truth.** `Agent.outputJsonSchema` remains the one canonical representation. The structured editor reads and writes this field; no parallel structure is introduced.
2. **Additive schema expansion.** The Zod validator (`outputJsonSchemaSchema`) is extended to allow new property attributes (`label`, `enum`, `format`, `minLength`, `maxLength`, `minimum`, `maximum`, `pattern`) as optional fields. Existing schemas remain valid.
3. **Label vs. property key.** Property keys stay machine-readable (what ends up in `FormAgentSession.result`); a new `label` attribute carries the display name shown to the user. Property keys are auto-derived from the label (slugified) on create, then immutable from the UI to protect downstream consumers.
4. **Raw-JSON escape hatch stays.** The "Advanced: raw JSON" toggle always lets admins paste/edit the full schema; the structured editor is a convenience layer, not a constraint. If the raw JSON uses a feature the structured editor can't render, the editor shows a read-only placeholder for that field with a pointer to the raw-JSON view.
5. **Progress is computed, not stored.** Completion state in the user-facing session UI is derived live from `FormAgentSession.result` + the current schema. No new persistence.
6. **Final review is part of the session.** The user sees the captured object, can ask the agent to amend a field before submitting, and explicitly confirms — at which point the session moves to a terminal state.
7. **Templates are static.** Starter-schema templates live as a JSON asset in `apps/web`; no backend endpoint, no per-org customization in v1.

---

## Data Model Changes

### Entities

- **`Agent`** (existing) — no column changes. `outputJsonSchema` absorbs the richer attributes.
- **`FormAgentSession`** (existing) — no column changes. `result: Record<string, unknown> | null` continues to hold the captured object; final review transitions it from "partial" to "submitted" without schema changes (the distinction is UI-derived from a lifecycle column that already exists on base-agent-sessions, or added there if not — to confirm during implementation).

### Schema validator extension

In `packages/api-contracts/src/agents/agents.dto.ts`:

- Extend `outputJsonSchemaSchema` properties to additionally accept (all optional):
  - `label?: string` — display name
  - `required` — (already at root level, unchanged)
  - `enum?: string[]` — for `single-choice` / `multi-choice`
  - `format?: "date" | "email" | "url"` — string hints
  - `minLength?`, `maxLength?`, `minimum?`, `maximum?`, `pattern?` — lightweight constraints
- Root-level unchanged (`type: "object"`, `required`, `properties`).

No migration needed (JSONB column).

---

## Routes

No new routes. Existing agent CRUD (`PATCH /agents/:id`, etc.) handles schema updates. Existing `form-agent-sessions` routes handle the user-facing session.

If the final-review "submit" action needs a dedicated endpoint (rather than an implicit state transition on the last message), it will be added as `POST /form-agent-sessions/:id/submit` — decision deferred to implementation, noted so the API contracts file gets it right on first pass.

---

## UI / UX

### Studio (admin) side

- In `apps/web/src/studio/features/agents/components/` — extend `BaseAgentForm` / the form-type-specific tab:
  - New **Schema** section when `agentType === "form"` (replacing today's raw textarea).
  - Field list with drag-to-reorder, inline edit, delete, duplicate.
  - Per-field inline form: label, type (select), required, description, type-specific constraints, enum values if applicable.
  - "Advanced: raw JSON" collapsible panel (kept — round-trips with the structured editor).
  - **Live preview panel** on the right-hand side (a recent PR, `#170`, already added scrolling to a form preview panel — extend that).
- Template picker dropdown at the top of the Schema section.

### User (filler) side

- In `apps/web/src/common/features/agents/agent-sessions/form/components/`:
  - Extend `FormResult.tsx` (or add a sibling component) to show captured/missing fields live during the conversation, not only at the end.
  - Progress bar / % complete based on required-field coverage.
  - Final-review UI: summary of captured fields, per-field edit-by-chat action, explicit submit button.

---

## Agent Behavior

- The agent's system prompt (built in the form-agent-sessions service) already receives the schema; this spec requires passing the **new label/description/constraints** through as well, so the agent can ask for each field by its human-readable label and respect constraints when soliciting values.
- Constraint enforcement remains server-side at submit time (not relied on mid-conversation).

---

## Testing

- **API**:
  - Zod validator: new optional attributes accepted; existing schemas still valid; invalid combinations (e.g. `enum` with non-string type) rejected.
  - E2E: create form agent with structured schema → start session → messages populate `result` → submit → result matches schema and constraints.
- **Web**:
  - Component tests for the schema editor: add/remove/reorder, label→key slugification, advanced-JSON round-trip.
  - Storybook entries for the new states.
- **Completion gates** (per CLAUDE.md): `npm run biome:check`, `npm run typecheck`, `npm run test` — all exit 0.

---

## Open Questions

1. **Schema changes on agents with historical sessions.** If an admin edits the schema after sessions exist, what happens to prior results that no longer match? Options: (a) freeze schema once a session has been created, (b) allow edits but mark old sessions as "schema-drifted", (c) store a schema snapshot per session. **Proposed: (c)** — store `schemaSnapshot` on `FormAgentSession` at session start. Low cost, future-proofs the eval story (ADR 0008) since reviewers judging "completeness" need to know which schema the session was run against.
2. **Property key immutability after first session.** Even with snapshots, renaming a property key in a live schema is disruptive for any downstream consumer. Proposed: lock keys once any session has been created against the current schema.
3. **Template source.** Static file in `apps/web` (simple, fast) or API-backed (org-customizable). Proposed: static in v1; promote to API if real usage demands org templates.
4. **Submit endpoint vs. implicit transition.** Whether to add `POST /form-agent-sessions/:id/submit` or reuse an existing finalization path. Defer to implementation after reading current `form-agent-sessions.service.ts`.

---

## Relationship to Other Work

- **ADR 0008 (Conversational Agent Human Evaluation Model)** — form agents evaluated in that model will use *completeness* as the primary reviewer dimension (§2.12 of the ADR). The schema snapshot from open question #1 directly supports that evaluation.
- **Existing `evaluations` domain (automated)** — unchanged. Automated eval of form agents against a golden set is a separate track.

---

## Milestones

1. Zod validator extension + migration-less API acceptance of new schema attributes.
2. Studio structured schema editor (with raw-JSON fallback).
3. Live schema preview panel.
4. User-side progress UI + final review.
5. Agent prompt enrichment with labels/descriptions/constraints.
6. Template catalogue (static).
7. Schema snapshot on session (supports OQ #1).

Ordering is not strict; 1 unblocks everything else, 2–4 can proceed in parallel behind feature-gated UI.
