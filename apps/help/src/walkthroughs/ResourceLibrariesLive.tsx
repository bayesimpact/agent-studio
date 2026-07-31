// LIVE Resource libraries walkthrough (v3) — the `resource-libraries` guide's animation. Drives the
// REAL resource-libraries feature (one Redux slice; resources are nested inside each library).
// Exercises the "nested routes + create" pattern: manager list → New library (/new) → open a library
// (/:id) → Add resource (/resources/new) → the row ⋯ menu + Preview dialog. Seed only (thunks off);
// nothing is really created. See `liveWalkthrough.tsx` (engine) + apps/help/CLAUDE.md.
import { useMemo } from "react"
import { agentFactory } from "../../../web/src/common/features/agents/agent.factory"
import {
  agentMembershipFactory,
  organizationMembershipFactory,
  projectMembershipFactory,
  userFactory,
} from "../../../web/src/common/features/me/me.factory"
import { organizationFactory } from "../../../web/src/common/features/organizations/organization.factory"
import { projectFactory } from "../../../web/src/common/features/projects/projects.factory"
import type { Project } from "../../../web/src/common/features/projects/projects.models"
import { mergeSeeds, seed } from "../../../web/src/stories/seed"
import {
  buildResource,
  resourceLibraryFactory,
} from "../../../web/src/studio/features/resource-libraries/resource-libraries.factory"
import type { ResourceLibrary } from "../../../web/src/studio/features/resource-libraries/resource-libraries.models"
import { listResourceLibraries } from "../../../web/src/studio/features/resource-libraries/resource-libraries.thunks"
import { StudioRoutes } from "../../../web/src/studio/routes/helpers"
import { studioRoutes } from "../../../web/src/studio/routes/StudioRoutes"
import {
  fireOpen,
  type LiveStep,
  LiveWalkthroughPlayer,
  nextFrame,
  waitFor,
} from "./LiveWalkthroughPlayer"
import {
  createLiveWalkthrough,
  findControl,
  insetOf,
  type Lang,
  leaf,
  navOf,
  sidebarOf,
  typeInto,
} from "./liveWalkthrough"
import { makeT } from "./locales"

// ---- Deterministic, brand-neutral entities (built ONCE) ----
function buildEntities() {
  const organization = organizationFactory.build({ name: "Bayes Impact Demo" })
  const organizationMemberships = [
    organizationMembershipFactory.transient({ organization }).build({ role: "owner" }),
  ]
  const featureFlags: Project["featureFlags"] = [
    "web-sources",
    "project-analytics",
    "agent-mcp",
    "evaluation",
    "agent-orchestration",
    "agent-embed",
  ]
  const project = {
    ...projectFactory.transient({ organization }).build({ name: "Demo" }),
    featureFlags,
  }
  const projectMemberships = [
    projectMembershipFactory.transient({ project }).build({ role: "owner" }),
  ]
  const agents = [
    agentFactory.transient({ project }).build({ name: "Helpful Assistant", type: "conversation" }),
    agentFactory.transient({ project }).build({ name: "Support Agent", type: "conversation" }),
    agentFactory.transient({ project }).build({ name: "Summary Bot", type: "extraction" }),
    agentFactory.transient({ project }).build({ name: "Drafting Helper", type: "form" }),
  ]
  const agentMemberships = agents.map((agent) =>
    agentMembershipFactory.transient({ agent }).build({ role: "owner" }),
  )
  const user = userFactory
    .transient({ organizationMemberships, projectMemberships, agentMemberships })
    .build({ name: "Alex Martin", email: "alex.martin@example.com" })
  // One library WITH resources (drives the detail page: table, ⋮ menu, preview) + a second so the
  // manager list reads as a real collection.
  // "Getting started" ends with exactly the ONE resource the walkthrough adds (step 7 types this
  // same title), so the manage steps never show a resource we didn't add.
  const library = resourceLibraryFactory.transient({ project }).build({
    title: "Getting started",
    resources: [
      buildResource({
        title: "Onboarding checklist",
        description: "Steps to get set up on the platform.",
        linkType: "url",
        url: "https://example.com/onboarding",
      }),
    ],
  })
  const library2 = resourceLibraryFactory.transient({ project }).build({
    title: "Product FAQ",
    resources: [
      buildResource({
        title: "Refund policy",
        description: "How refunds work.",
        linkType: "url",
        url: "https://example.com/refunds",
      }),
    ],
  })
  // Same library id, resources not yet added — used for the "just created, still empty" steps so we
  // never show a resource before the walkthrough adds it.
  const libraryEmpty: ResourceLibrary = { ...library, resources: [] }
  return { organization, project, user, agents, library, libraryEmpty, library2 }
}

function buildWalkthrough(lang: Lang) {
  const e = buildEntities()
  const ids = { organizationId: e.organization.id, projectId: e.project.id }
  const overviewPath = StudioRoutes.project.build(ids)
  const listPath = StudioRoutes.resourceLibraries.build(ids)
  const newLibPath = StudioRoutes.resourceLibraryNew.build(ids)
  const libIds = { ...ids, resourceLibraryId: e.library.id }
  const detailPath = StudioRoutes.resourceLibrary.build(libIds)
  const newResourcePath = StudioRoutes.resourceNew.build(libIds)

  const { Mount, dispatch, navigate, resetTransient } = createLiveWalkthrough({
    lang,
    routes: studioRoutes,
    initialPath: overviewPath,
    // Detail/create-resource routes read currentIds.resourceLibraryId; seed it (see engine docs).
    currentIds: { resourceLibraryId: e.library.id },
    seed: mergeSeeds(
      seed.me(e.user),
      seed.organizations([e.organization], { currentId: e.organization.id }),
      seed.projects([e.project], { currentId: e.project.id }),
      seed.agents(e.agents),
      // Start with only the pre-existing sibling; the walkthrough "creates" Getting started later.
      seed.studio.resourceLibraries([e.library2]),
    ),
  })

  // State evolves with the narrative so nothing is shown before the walkthrough "creates" it:
  //  BEFORE        → only the pre-existing library (we're about to create "Getting started")
  //  CREATED_EMPTY → "Getting started" now exists but has no resources yet
  //  CREATED_FULL  → after "adding" a resource, it appears in the library
  const BEFORE: ResourceLibrary[] = [e.library2]
  const CREATED_EMPTY: ResourceLibrary[] = [e.library2, e.libraryEmpty]
  const CREATED_FULL: ResourceLibrary[] = [e.library2, e.library]
  let currentLibs: ResourceLibrary[] = BEFORE
  const setLibraries = (libs: ResourceLibrary[]) => {
    if (libs === currentLibs) return
    currentLibs = libs
    dispatch(listResourceLibraries.fulfilled(libs, "wt", undefined))
  }

  const t = makeT(lang)
  const SOURCES = t("document:sources")
  const NEW_LIB = t("resourceLibrary:actions.newLibrary")
  const CREATE = t("actions:create")
  const ADD = t("actions:add")
  const PREVIEW = t("actions:preview")

  // Expand the Sources collapsible if not already open (persists once opened).
  const openSources = async (win: HTMLElement) => {
    const sb = sidebarOf(win)
    if (sb.querySelector('[data-slot="sidebar-menu-sub"]')) return
    const trigger = findControl(navOf(win), SOURCES, true)
    if (trigger) fireOpen(trigger)
    await waitFor(sb, '[data-slot="sidebar-menu-sub"]', 2500)
  }
  const resLibNavItem = (win: HTMLElement) =>
    sidebarOf(win).querySelector<HTMLElement>(
      '[data-slot="sidebar-menu-sub"] a[href*="/resource-libraries"]',
    )
  const openRowMenu = async (win: HTMLElement) => {
    const trigger = await waitFor(win, 'table [data-slot="dropdown-menu-trigger"]', 5000)
    if (trigger) fireOpen(trigger)
    return waitFor(win, '[data-slot="dropdown-menu-content"]', 4000)
  }
  const prep = async (win: HTMLElement, path: string, libs: ResourceLibrary[]) => {
    await resetTransient(win)
    setLibraries(libs)
    await navigate(path)
    await nextFrame()
  }

  const steps: LiveStep[] = [
    {
      caption: {
        en: "Open the Sources section in the left menu.",
        fr: "Ouvrez la section Sources dans le menu de gauche.",
      },
      drive: async (win) => {
        await prep(win, overviewPath, BEFORE)
        return { spot: findControl(navOf(win), SOURCES, true) }
      },
    },
    {
      caption: { en: "Click Resource libraries.", fr: "Cliquez sur Bibliothèques de ressources." },
      drive: async (win) => {
        await prep(win, overviewPath, BEFORE)
        await openSources(win)
        return { spot: resLibNavItem(win) }
      },
    },
    {
      caption: {
        en: "To create a library, click New library.",
        fr: "Pour créer une bibliothèque, cliquez sur Nouvelle bibliothèque.",
      },
      drive: async (win) => {
        await prep(win, listPath, BEFORE)
        await openSources(win)
        await waitFor(win, '[data-slot="grid-content"]', 5000)
        return {
          spot: findControl(insetOf(win), NEW_LIB, true),
          observe: win.querySelector<HTMLElement>('[data-slot="grid-content"]'),
        }
      },
    },
    {
      caption: {
        en: "Enter a Title, then click Create.",
        fr: "Saisissez un Titre, puis cliquez sur Créer.",
      },
      drive: async (win) => {
        await prep(win, newLibPath, BEFORE)
        const input = await waitFor(win, "input", 5000)
        if (input instanceof HTMLInputElement) {
          typeInto(input, lang === "fr" ? "Pour commencer" : "Getting started")
          await nextFrame()
        }
        const create = findControl(insetOf(win), CREATE, true)
        return { spot: create, observe: input?.closest<HTMLElement>("form") ?? create }
      },
    },
    {
      caption: {
        en: "Open a library with the → arrow on its card.",
        fr: "Ouvrez une bibliothèque via la flèche → sur sa carte.",
      },
      drive: async (win) => {
        await prep(win, listPath, CREATED_EMPTY)
        await openSources(win)
        await waitFor(win, '[data-slot="grid-content"]', 5000)
        const card = leaf(insetOf(win), e.library.title, true)?.closest<HTMLElement>(
          '[data-slot="grid-card"]',
        )
        const go = card?.querySelector<HTMLElement>('[data-slot="grid-card-go-button"]')
        return { spot: go, observe: card }
      },
    },
    {
      caption: {
        en: "In the library, click Add to add a resource.",
        fr: "Dans la bibliothèque, cliquez sur Ajouter pour ajouter une ressource.",
      },
      drive: async (win) => {
        // The library was just "created" and is still empty — no resources table yet, just the
        // empty state and the Add button.
        await prep(win, detailPath, CREATED_EMPTY)
        await waitFor(win, '[data-slot="sidebar-inset"] button', 5000)
        return { spot: findControl(insetOf(win), ADD, true) }
      },
    },
    {
      caption: {
        en: "Fill in the resource fields, then click Create.",
        fr: "Remplissez les champs de la ressource, puis cliquez sur Créer.",
      },
      drive: async (win) => {
        await prep(win, newResourcePath, CREATED_EMPTY)
        const title = await waitFor(win, 'input[name="title"], input', 5000)
        if (title instanceof HTMLInputElement) {
          typeInto(title, "Onboarding checklist")
          await nextFrame()
        }
        const create = findControl(insetOf(win), CREATE, true)
        return { spot: create, observe: title?.closest<HTMLElement>("form") ?? insetOf(win) }
      },
    },
    {
      caption: {
        en: "Preview, Edit or Delete a resource from the ⋯ menu.",
        fr: "Aperçu, Modifier ou Supprimer une ressource depuis le menu ⋯.",
      },
      drive: async (win) => {
        await prep(win, detailPath, CREATED_FULL)
        await waitFor(win, "table tbody tr", 5000)
        const trigger = win.querySelector<HTMLElement>('table [data-slot="dropdown-menu-trigger"]')
        const menu = await openRowMenu(win)
        return { spot: trigger, observe: menu }
      },
    },
    {
      caption: {
        en: "Preview shows the card users see in a conversation.",
        fr: "L'aperçu montre la carte que voient les utilisateurs dans une conversation.",
      },
      drive: async (win) => {
        await prep(win, detailPath, CREATED_FULL)
        await waitFor(win, "table tbody tr", 5000)
        const menu = await openRowMenu(win)
        const previewItem = menu ? findControl(menu, PREVIEW, true) : null
        if (previewItem) fireOpen(previewItem)
        const dlg = await waitFor(win, '[data-slot="dialog-content"]', 4000)
        return { observe: dlg }
      },
    },
  ]

  return { Mount, steps }
}

export default function ResourceLibrariesLive({ lang = "en" }: { lang?: Lang }) {
  const { Mount, steps } = useMemo(() => buildWalkthrough(lang), [lang])
  return <LiveWalkthroughPlayer Mount={Mount} steps={steps} lang={lang} />
}
