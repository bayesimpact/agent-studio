// LIVE Web sources walkthrough (v3) — the `web-sources` guide's animation. Drives the REAL
// WebSourcesDocumentList (documents slice, sourceType "webCrawl"). Exercises the overlays newly
// wired for v3: the row ⋮ menu (DropdownMenu), the crawl Dialog, the details **Sheet** (View),
// the **Popover** tag-picker (Edit → Add tag) and the Tags **Sheet**. Seed only (thunks off);
// the crawl result is seeded, not really crawled. See `liveWalkthrough.tsx` + apps/help/CLAUDE.md.
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
import { documentTagFactory } from "../../../web/src/studio/features/document-tags/document-tags.factory"
import { documentFactory } from "../../../web/src/studio/features/documents/documents.factory"
import type { Document } from "../../../web/src/studio/features/documents/documents.models"
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
} from "./liveWalkthrough"
import { makeT } from "./locales"

const URLS = [
  "https://example.com/",
  "https://example.com/about",
  "https://example.com/pricing",
  "https://example.com/docs",
  "https://example.com/docs/getting-started",
  "https://example.com/contact",
]

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
  const tag = documentTagFactory.transient({ project }).build({ name: "public-documents" })
  const now = Date.now()
  // One existing web source, Ready, with crawled pages (so the ⋮ menu, expand, View, Edit work).
  // NOTE: documentFactory doesn't spread params, so it OMITS `pages` — add it after the build.
  const source: Document = {
    ...documentFactory.transient({ project }).build({
      title: "Documentation site",
      sourceType: "webCrawl",
      embeddingStatus: "completed",
      tagIds: [tag.id],
      updatedAt: now,
    }),
    pages: URLS.map((url) => ({ url })),
  }
  return { organization, project, user, agents, tag, source }
}

function buildWalkthrough(lang: Lang) {
  const e = buildEntities()
  const ids = { organizationId: e.organization.id, projectId: e.project.id }
  const overviewPath = StudioRoutes.project.build(ids)
  const webSourcesPath = StudioRoutes.webSources.build(ids)

  const { Mount, navigate, resetTransient } = createLiveWalkthrough({
    lang,
    routes: studioRoutes,
    initialPath: overviewPath,
    seed: mergeSeeds(
      seed.me(e.user),
      seed.organizations([e.organization], { currentId: e.organization.id }),
      seed.projects([e.project], { currentId: e.project.id }),
      seed.agents(e.agents),
      seed.studio.documents([e.source]),
      seed.studio.documentTags([e.tag]),
    ),
  })

  const t = makeT(lang)
  const SOURCES = t("document:sources")
  const CRAWL = t("document:crawl.button")
  const TAGS_BTN = t("documentTag:sheet.button")
  const CREATE_TAG = t("documentTag:create.button")
  const ADD_TAG = t("documentTag:addTag")
  const VIEW = t("actions:view")
  const EDIT = t("actions:edit")

  // Expand the Sources collapsible if not already open (persists once opened).
  const openSources = async (win: HTMLElement) => {
    const sb = sidebarOf(win)
    if (sb.querySelector('[data-slot="sidebar-menu-sub"]')) return
    const trigger = findControl(navOf(win), SOURCES, true)
    if (trigger) fireOpen(trigger)
    await waitFor(sb, '[data-slot="sidebar-menu-sub"]', 2500)
  }
  const webSourcesNavItem = (win: HTMLElement) =>
    sidebarOf(win).querySelector<HTMLElement>(
      '[data-slot="sidebar-menu-sub"] a[href*="/web-sources"]',
    )
  const openRowMenu = async (win: HTMLElement) => {
    const trigger = await waitFor(win, 'table [data-slot="dropdown-menu-trigger"]', 5000)
    if (trigger) fireOpen(trigger)
    return waitFor(win, '[data-slot="dropdown-menu-content"]', 4000)
  }
  const prep = async (win: HTMLElement, path: string) => {
    await resetTransient(win)
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
        await prep(win, overviewPath)
        return { spot: findControl(navOf(win), SOURCES, true) }
      },
    },
    {
      caption: { en: "Click Web sources.", fr: "Cliquez sur Sites web." },
      drive: async (win) => {
        await prep(win, overviewPath)
        await openSources(win)
        return { spot: webSourcesNavItem(win) }
      },
    },
    {
      caption: {
        en: "To add a web source, click Crawl Website.",
        fr: "Pour ajouter une source web, cliquez sur Explorer un site web.",
      },
      drive: async (win) => {
        await prep(win, webSourcesPath)
        await openSources(win)
        await waitFor(win, "table tbody tr", 5000)
        return {
          spot: findControl(insetOf(win), CRAWL, true),
          observe: win.querySelector<HTMLElement>("table"),
        }
      },
    },
    {
      caption: {
        en: "Enter the website URL, name it, then click Start Crawling.",
        fr: "Saisissez l'URL du site, nommez-la, puis cliquez sur Lancer l'exploration.",
      },
      drive: async (win) => {
        await prep(win, webSourcesPath)
        await openSources(win)
        const crawl = findControl(insetOf(win), CRAWL, true)
        if (crawl) fireOpen(crawl)
        const dlg = await waitFor(win, '[data-slot="dialog-content"]', 4000)
        return {
          spot: dlg?.querySelector<HTMLElement>('button[type="submit"]') ?? null,
          observe: dlg,
        }
      },
    },
    {
      caption: {
        en: "View, Edit, Recrawl or Delete a source from the ⋮ menu.",
        fr: "Voir, Modifier, Ré-explorer ou Supprimer une source depuis le menu ⋮.",
      },
      drive: async (win) => {
        await prep(win, webSourcesPath)
        await openSources(win)
        await waitFor(win, "table tbody tr", 5000)
        const trigger = win.querySelector<HTMLElement>('table [data-slot="dropdown-menu-trigger"]')
        const menu = await openRowMenu(win)
        return { spot: trigger, observe: menu }
      },
    },
    {
      caption: { en: "View opens the source details.", fr: "Voir ouvre les détails de la source." },
      drive: async (win) => {
        await prep(win, webSourcesPath)
        await openSources(win)
        await waitFor(win, "table tbody tr", 5000)
        const menu = await openRowMenu(win)
        const viewItem = menu ? findControl(menu, VIEW, true) : null
        if (viewItem) fireOpen(viewItem)
        const sheet = await waitFor(win, '[data-slot="sheet-content"]', 4000)
        return { observe: sheet }
      },
    },
    {
      caption: {
        en: "Click the arrow to show the crawled pages.",
        fr: "Cliquez sur la flèche pour afficher les pages explorées.",
      },
      drive: async (win) => {
        await prep(win, webSourcesPath)
        await openSources(win)
        await waitFor(win, "table tbody tr", 5000)
        // the row's expand toggle is the Radix Collapsible trigger (data-slot="collapsible-trigger")
        const chevron = win.querySelector<HTMLElement>(
          'table tbody tr [data-slot="collapsible-trigger"]',
        )
        if (chevron) fireOpen(chevron)
        await nextFrame()
        const pageLink = leaf(insetOf(win), "example.com/about")
        return { spot: chevron, observe: pageLink?.closest<HTMLElement>("tr") ?? pageLink }
      },
    },
    {
      caption: {
        en: "Tag a source: Edit → Add tag → pick a tag.",
        fr: "Étiquetez une source : Modifier → Add tag → choisir une étiquette.",
      },
      drive: async (win) => {
        await prep(win, webSourcesPath)
        await openSources(win)
        await waitFor(win, "table tbody tr", 5000)
        const menu = await openRowMenu(win)
        const editItem = menu ? findControl(menu, EDIT, true) : null
        if (editItem) fireOpen(editItem)
        const dlg = await waitFor(win, '[data-slot="dialog-content"]', 4000)
        const addTag = dlg ? findControl(dlg, ADD_TAG, true) : null
        if (addTag) fireOpen(addTag)
        const popover = await waitFor(win, '[data-slot="popover-content"]', 4000)
        return { spot: addTag, observe: popover ?? dlg }
      },
    },
    {
      caption: {
        en: "Manage tags from the Tags panel, and Create tag.",
        fr: "Gérez les étiquettes depuis le panneau Tags, et Create tag.",
      },
      drive: async (win) => {
        await prep(win, webSourcesPath)
        await openSources(win)
        await waitFor(win, "table tbody tr", 5000)
        const tagsBtn = findControl(insetOf(win), TAGS_BTN, true)
        if (tagsBtn) fireOpen(tagsBtn)
        const sheet = await waitFor(win, '[data-slot="sheet-content"]', 4000)
        return { spot: sheet ? findControl(sheet, CREATE_TAG, true) : null, observe: sheet }
      },
    },
  ]

  return { Mount, steps }
}

export default function WebSourcesLive({ lang = "en" }: { lang?: Lang }) {
  const { Mount, steps } = useMemo(() => buildWalkthrough(lang), [lang])
  return <LiveWalkthroughPlayer Mount={Mount} steps={steps} lang={lang} />
}
