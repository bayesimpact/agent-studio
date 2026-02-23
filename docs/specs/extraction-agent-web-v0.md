# Feature Specification: Extraction Agent Frontend (v0, First Tasks)

## Overview

This document defines the first frontend slice for extraction agents:

1. Allow creating an agent by choosing its type first (`conversation` or `extraction`)
2. List extraction agents in the UI (no extraction execution flow yet)

This spec is intentionally scoped and does not include extraction run UI.

---

## Scope (This Iteration)

### In Scope

- A first-step type selector shown when clicking "Create Agent"
- Create flow supports both:
  - conversation agent
  - extraction agent
- Agents remain in the same sidebar block with type-specific icon rendering
- Reuse existing Redux/services architecture

### Out of Scope

- Running extraction from frontend
- Viewing extraction runs/history
- Editing extraction-specific configuration UX beyond minimal create support
- Full information architecture redesign of sidebar

---

## Existing Architecture Constraints

- API calls must go through Redux thunks and `services`
- Feature follows `agents.models.ts` + `agents.spi.ts` + `external/agents.api.ts`
- Existing create flow:
  - `CreateAgentDialog` opens a bottom sheet with `CreateAgentForm`
  - `createAgent` thunk dispatches to `services.agents.createOne(...)`
  - success currently navigates to `agent` route

This implementation must keep those patterns.

---

## Functional Requirements

### FR1 - Create Agent Type Selection

When user clicks "Create Agent":

- Open a lightweight type-selection dialog first
- User must select one of:
  - `conversation`
  - `extraction`
- Default selected type is `conversation`
- After selection, continue with the create form flow

### FR2 - Create Form Behavior by Type

Create form payload must include `type`.

For `conversation`:

- keep existing fields and defaults
- existing UX remains valid

For `extraction`:

- must provide required backend fields:
  - `instructionPrompt`
  - `outputJsonSchema`
- `outputJsonSchema` is entered via a raw JSON textarea in v0
- minimal UX is acceptable for this phase, as long as API contract is respected

### FR3 - Sidebar Listing and Icon

Frontend should keep using the current sidebar agent block, and:

- ensure extraction agents are listed there
- render extraction agents with a dedicated icon different from conversation agents
- keep no extraction run/execution actions in this phase

### FR4 - Post-create Navigation

After creating an extraction agent, navigate to an empty placeholder page.

- This placeholder will become the extraction run form in the next step.
- Conversation agents can keep the existing navigation behavior.

---

## Data Model Updates (Web)

Update `features/agents/agents.models.ts`:

- include `type: "conversation" | "extraction"`
- include optional/nullable extraction config:
  - `instructionPrompt?: string`
  - `outputJsonSchema?: Record<string, unknown>`

This must match the updated API contracts.

---

## Service and Redux Changes

### `features/agents/external/agents.api.ts`

- map `type`, `instructionPrompt`, `outputJsonSchema` in `fromDto`
- include `type` in create payload
- include extraction fields in create payload when provided

### `features/agents/agents.thunks.ts`

- extend `createAgent` field type to include new agent fields:
  - `type`
  - `instructionPrompt?`
  - `outputJsonSchema?`

No new thunk is required for this iteration.

### Selectors

Add selector(s) for extraction list, for example:

- `selectExtractionAgentsFromProjectId(projectId)` returning filtered agents by `type`

---

## UI Components (Planned)

## 1) Create Type Selector

New component (example):

- `components/agents/CreateAgentTypeDialog.tsx`

Behavior:

- opens first from create trigger
- allows selecting `conversation` or `extraction`
- forwards selection into create form component

## 2) Create Agent Dialog/Form

Update current create flow:

- `CreateAgentDialog.tsx`
- `CreateAgentForm.tsx`
- `AgentForm.tsx` (or split into specialized forms if needed)

Recommended approach:

- keep `CreateAgentForm` as create-only
- either:
  - make `AgentForm` accept `selectedType`, conditionally render extraction fields, or
  - split into create-specific presentational subforms if clearer

## 3) Extraction Agent List

Add/adjust list rendering in the existing agent sidebar block:

- keep a single list block
- choose icon by `agent.type`
  - conversation icon (existing)
  - extraction icon (new)

---

## i18n

Add translation keys for:

- type selector title/description/options
- extraction form labels/placeholders/help text

Files:

- `apps/web/src/locales/en.json`
- `apps/web/src/locales/fr.json`

---

## Acceptance Criteria

1. Clicking create agent first prompts for type
2. Type selector defaults to `conversation`
3. User can create:
   - a conversation agent
   - an extraction agent (with required extraction fields)
4. Extraction schema is entered via raw JSON textarea
5. Sidebar remains a single block and extraction agents show a distinct icon
6. Creating an extraction agent navigates to an empty placeholder page
7. No extraction execution UI appears
8. Web checks pass:
   - `npm run biome:check`
   - `npm run typecheck`

---

## Resolved Product Decisions

1. Type selector defaults to `conversation`.
2. Agents stay in the same sidebar block.
3. Extraction agents use a different icon.
4. `outputJsonSchema` is entered via raw JSON textarea.
5. Creating an extraction agent navigates to an empty placeholder page for now.
