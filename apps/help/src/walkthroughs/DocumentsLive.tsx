// LIVE Documents walkthrough (v3) — the `documents` guide's animation. The real studioRoutes app
// is mounted ONCE (shared engine: one store + one memory router); the per-step director NAVIGATES
// and EVOLVES state via Redux dispatch in place (never remounting) through the canonical 8-step
// flow: overview → Sources → Documents → upload dialog → Ready → ⋮ menu → bulk → select-all.
// Real components + real labels → no drift. See `liveWalkthrough.tsx` (engine) + apps/help/CLAUDE.md.
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
import { documentsActions } from "../../../web/src/studio/features/documents/documents.slice"
import { listDocuments } from "../../../web/src/studio/features/documents/documents.thunks"
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
  navOf,
  sidebarOf,
  toolbarOf,
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
  // one tag so the real upload dialog opens (it only prompts for tags when some exist)
  const tag = documentTagFactory.transient({ project }).build({ name: "private-documents" })
  const now = Date.now()
  const handbook = documentFactory.transient({ project }).build({
    title: "handbook.pdf",
    embeddingStatus: "completed",
    updatedAt: now,
    tagIds: [tag.id],
  })
  const policy = documentFactory
    .transient({ project })
    .build({ title: "policy.pdf", embeddingStatus: "completed", updatedAt: now })
  const faq = documentFactory
    .transient({ project })
    .build({ title: "faq.pdf", embeddingStatus: "processing", updatedAt: now })
  return { organization, project, user, agents, tag, handbook, policy, faq }
}

function buildWalkthrough(lang: Lang) {
  const e = buildEntities()
  const ids = { organizationId: e.organization.id, projectId: e.project.id }
  const overviewPath = StudioRoutes.project.build(ids)
  const documentsPath = StudioRoutes.documents.build(ids)

  // Per-step document lists as STABLE references, so change-detection is a cheap `===`.
  const faqReady: Document = { ...e.faq, embeddingStatus: "completed" }
  const BASE = [e.handbook, e.policy]
  const WITH_FAQ_PROCESSING = [e.faq, e.handbook, e.policy]
  const WITH_FAQ_READY = [faqReady, e.handbook, e.policy]

  // Mount the real app once; the engine gives us navigate/dispatch/resetTransient (no remount).
  const { Mount, dispatch, navigate, resetTransient } = createLiveWalkthrough({
    lang,
    routes: studioRoutes,
    initialPath: overviewPath,
    seed: mergeSeeds(
      seed.me(e.user),
      seed.organizations([e.organization], { currentId: e.organization.id }),
      seed.projects([e.project], { currentId: e.project.id }),
      seed.agents(e.agents),
      seed.studio.documents(BASE),
      seed.studio.documentTags([e.tag]),
    ),
  })

  // ---- state evolution (dispatch, no remount) — only when the list actually changes ----
  let currentDocs: Document[] = BASE // matches the seed above
  const setDocs = (list: Document[]) => {
    if (list === currentDocs) return // no change → no dispatch, no table re-render/flash
    currentDocs = list
    dispatch(documentsActions.reset())
    dispatch(listDocuments.fulfilled(list, "wt", undefined))
  }

  const t = makeT(lang)
  const SOURCES = t("document:sources")
  const DOCUMENTS = t("document:documents")
  const sourcesTrigger = (win: HTMLElement) => findControl(navOf(win), SOURCES, true)
  const openSources = async (win: HTMLElement) => {
    const sb = sidebarOf(win)
    if (sb.querySelector('[data-slot="sidebar-menu-sub"]')) return // already open (persists)
    const trigger = sourcesTrigger(win)
    if (trigger) fireOpen(trigger)
    await waitFor(sb, '[data-slot="sidebar-menu-sub"]', 2500)
  }
  // Step 0 shows Sources still CLOSED ("open the Sources section"); collapse it if a later
  // step (or backward navigation) left it open — single instance keeps the state otherwise.
  const closeSources = async (win: HTMLElement) => {
    const sb = sidebarOf(win)
    if (!sb.querySelector('[data-slot="sidebar-menu-sub"]')) return // already closed
    const trigger = sourcesTrigger(win)
    if (trigger) fireOpen(trigger)
    await nextFrame()
  }
  const documentsNavItem = (win: HTMLElement) => {
    const sub = sidebarOf(win).querySelector<HTMLElement>('[data-slot="sidebar-menu-sub"]')
    return sub ? findControl(sub, DOCUMENTS, true) : null
  }
  // Common prelude: clean up, navigate, set the visible document list.
  const prep = async (win: HTMLElement, path: string, docs: Document[]) => {
    await resetTransient(win)
    await navigate(path)
    setDocs(docs)
    await nextFrame()
  }

  const steps: LiveStep[] = [
    {
      caption: {
        en: "Open the Sources section in the left menu.",
        fr: "Ouvrez la section Sources dans le menu de gauche.",
      },
      drive: async (win) => {
        await prep(win, overviewPath, BASE)
        await closeSources(win)
        return { spot: sourcesTrigger(win) }
      },
    },
    {
      caption: { en: "Select Documents.", fr: "Sélectionnez Documents." },
      drive: async (win) => {
        await prep(win, overviewPath, BASE)
        await openSources(win)
        return { spot: documentsNavItem(win) }
      },
    },
    {
      caption: {
        en: "Click Drag or upload a file to add a document.",
        fr: "Cliquez sur Glissez ou téléchargez un fichier pour ajouter un document.",
      },
      drive: async (win) => {
        await prep(win, documentsPath, BASE)
        await openSources(win)
        await waitFor(win, "table tbody tr", 5000)
        return { spot: findControl(insetOf(win), t("actions:dragOrUploadFile"), true) }
      },
    },
    {
      caption: {
        en: "Optionally add tags, then upload.",
        fr: "Ajoutez éventuellement des étiquettes, puis téléversez.",
      },
      drive: async (win) => {
        await prep(win, documentsPath, BASE)
        await openSources(win)
        await waitFor(win, "table tbody tr", 5000)
        const input = win.querySelector<HTMLInputElement>('input[type="file"]')
        if (input) {
          const dt = new DataTransfer()
          // Upload the doc that then appears (processing → ready) in the next steps — NOT one of the
          // already-listed docs, so we never "upload" something the list already shows.
          dt.items.add(new File(["%PDF-1.4 demo"], "faq.pdf", { type: "application/pdf" }))
          Object.defineProperty(input, "files", { value: dt.files, configurable: true })
          input.dispatchEvent(new Event("change", { bubbles: true }))
        }
        const dlg = await waitFor(win, '[data-slot="dialog-content"]', 4000)
        const confirm =
          dlg?.querySelector<HTMLElement>('[data-slot="dialog-footer"] button:last-of-type') ?? null
        return { spot: confirm, observe: dlg }
      },
    },
    {
      caption: {
        en: "Wait for the Embedding Status to become “Ready”.",
        fr: "Attendez que le statut des embeddings passe à « Prêt ».",
      },
      drive: async (win) => {
        await prep(win, documentsPath, WITH_FAQ_PROCESSING)
        await openSources(win)
        await waitFor(win, "table tbody tr", 5000)
        const cell =
          win.querySelector<HTMLElement>('table tbody tr [data-slot="table-cell"]:nth-child(4)') ??
          win.querySelector<HTMLElement>("table tbody tr td:nth-child(4)")
        return { observe: cell }
      },
    },
    {
      caption: {
        en: "Download, View, Edit or Delete a document from the ⋮ menu.",
        fr: "Télécharger, Voir, Modifier ou Supprimer un document depuis le menu ⋮.",
      },
      drive: async (win) => {
        await prep(win, documentsPath, WITH_FAQ_READY)
        await openSources(win)
        const trigger = await waitFor(win, 'table [data-slot="dropdown-menu-trigger"]', 5000)
        if (trigger) fireOpen(trigger)
        const menu = await waitFor(win, '[data-slot="dropdown-menu-content"]', 4000)
        return { spot: trigger, observe: menu }
      },
    },
    {
      caption: {
        en: "Select documents to manage them together: Add tag, Remove tag or Delete.",
        fr: "Sélectionnez des documents pour les gérer ensemble : Ajouter une étiquette, Retirer un tag ou Supprimer.",
      },
      drive: async (win) => {
        await prep(win, documentsPath, WITH_FAQ_READY)
        await openSources(win)
        await waitFor(win, "table tbody tr", 5000)
        const boxes = win.querySelectorAll<HTMLElement>('table tbody [data-slot="checkbox"]')
        if (boxes[0]) fireOpen(boxes[0])
        if (boxes[1]) fireOpen(boxes[1])
        await nextFrame()
        return { observe: toolbarOf(win) }
      },
    },
    {
      caption: {
        en: "Tick the box next to Title to select all documents.",
        fr: "Cochez la case à côté de Titre pour tout sélectionner.",
      },
      drive: async (win) => {
        await prep(win, documentsPath, WITH_FAQ_READY)
        await openSources(win)
        await waitFor(win, "table tbody tr", 5000)
        const head = win.querySelector<HTMLElement>('table thead [data-slot="checkbox"]')
        if (head) fireOpen(head)
        await nextFrame()
        return { spot: head, observe: toolbarOf(win) }
      },
    },
  ]

  return { Mount, steps }
}

export default function DocumentsLive({ lang = "en" }: { lang?: Lang }) {
  const { Mount, steps } = useMemo(() => buildWalkthrough(lang), [lang])
  return <LiveWalkthroughPlayer Mount={Mount} steps={steps} lang={lang} />
}
