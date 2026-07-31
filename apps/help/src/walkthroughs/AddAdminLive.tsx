// LIVE walkthrough (v3) for the `add-an-admin` guide (workspace Members / project memberships),
// built on the shared engine. Faithful to the guide's 8 steps (open Members → Invite an admin →
// Add email → Send → Pending → member detail page → remove member → cancel pending invitation),
// driven on the REAL studioRoutes app (real components + labels → no drift). See
// `liveWalkthrough.tsx` (engine) + apps/help/CLAUDE.md.
import { useMemo } from "react"
import { agentFactory } from "../../../web/src/common/features/agents/agent.factory"
import { agentMembershipFactory, organizationMembershipFactory, projectMembershipFactory, userFactory } from "../../../web/src/common/features/me/me.factory"
import { organizationFactory } from "../../../web/src/common/features/organizations/organization.factory"
import { projectFactory } from "../../../web/src/common/features/projects/projects.factory"
import type { Project } from "../../../web/src/common/features/projects/projects.models"
import { mergeSeeds, seed } from "../../../web/src/stories/seed"
import { pendingInvitationFactory } from "../../../web/src/studio/features/invitations/invitations.factory"
import type { PendingInvitationItem } from "../../../web/src/studio/features/invitations/invitations.models"
import { listInvitationsForTarget } from "../../../web/src/studio/features/invitations/invitations.thunks"
import { projectMemberAgentFactory, projectMembershipFactory as studioMembershipFactory } from "../../../web/src/studio/features/project-memberships/project-memberships.factory"
import { StudioRoutes } from "../../../web/src/studio/routes/helpers"
import { studioRoutes } from "../../../web/src/studio/routes/StudioRoutes"
import { makeT } from "./locales"
import { createLiveWalkthrough, findControl, insetOf, type Lang, leaf, navOf, typeInto } from "./liveWalkthrough"
import { fireOpen, type LiveStep, LiveWalkthroughPlayer, nextFrame, waitFor } from "./LiveWalkthroughPlayer"

// ---- Deterministic, brand-neutral entities (built ONCE) ----
function buildEntities() {
  const organization = organizationFactory.build({ name: "Bayes Impact Demo" })
  const organizationMemberships = [organizationMembershipFactory.transient({ organization }).build({ role: "owner" })]
  const featureFlags: Project["featureFlags"] = ["web-sources", "project-analytics", "agent-mcp", "evaluation", "agent-orchestration", "agent-embed"]
  const project = { ...projectFactory.transient({ organization }).build({ name: "Demo" }), featureFlags }
  const projectMemberships = [projectMembershipFactory.transient({ project }).build({ role: "owner" })]
  const agents = [
    agentFactory.transient({ project }).build({ name: "Helpful Assistant", type: "conversation" }),
    agentFactory.transient({ project }).build({ name: "Support Agent", type: "conversation" }),
    agentFactory.transient({ project }).build({ name: "Summary Bot", type: "extraction" }),
    agentFactory.transient({ project }).build({ name: "Drafting Helper", type: "form" }),
  ]
  const agentMemberships = agents.map((agent) => agentMembershipFactory.transient({ agent }).build({ role: "owner" }))
  const user = userFactory
    .transient({ organizationMemberships, projectMemberships, agentMemberships })
    .build({ name: "Alex Martin", email: "alex.martin@example.com" })
  // Displayed member cards — Owner (me) + two invited Admins (matches the guide's framing).
  const meMember = studioMembershipFactory.transient({ project }).build({ role: "owner", userId: user.id, userName: "Alex Martin", userEmail: "alex.martin@example.com" })
  const jordan = studioMembershipFactory.transient({ project }).build({ role: "admin", userName: "Jordan Lee", userEmail: "jordan.lee@example.com" })
  const sam = studioMembershipFactory.transient({ project }).build({ role: "admin", userName: "Sam Rivera", userEmail: "sam.rivera@example.com" })
  const invite = pendingInvitationFactory.transient({ project }).build({ role: "admin", invitedEmail: "newcomer@example.com" })
  // Jordan's per-agent access, for the member detail page (step 6).
  const memberAgents = agents.map((agent, index) =>
    projectMemberAgentFactory.transient({ agent, membership: jordan }).build({ role: index === 2 ? null : index === 0 ? "admin" : "member" }),
  )
  return { organization, project, user, agents, meMember, jordan, sam, invite, memberAgents }
}

function buildWalkthrough(lang: Lang) {
  const e = buildEntities()
  const ids = { organizationId: e.organization.id, projectId: e.project.id }
  const overviewPath = StudioRoutes.project.build(ids)
  const membersPath = StudioRoutes.projectMemberships.build(ids)
  const jordanDetailPath = StudioRoutes.projectMembership.build({ ...ids, membershipId: e.jordan.id })

  const PENDING_NONE: PendingInvitationItem[] = []
  const PENDING_ONE: PendingInvitationItem[] = [e.invite]

  const { Mount, dispatch, navigate, resetTransient } = createLiveWalkthrough({
    lang,
    routes: studioRoutes,
    initialPath: overviewPath,
    // Deep id the walkthrough opens (member detail); the engine seeds it into currentIds.
    currentIds: { membershipId: e.jordan.id },
    seed: mergeSeeds(
      seed.me(e.user),
      seed.organizations([e.organization], { currentId: e.organization.id }),
      seed.projects([e.project], { currentId: e.project.id }),
      seed.agents(e.agents),
      seed.studio.projectMemberships([e.meMember, e.jordan, e.sam]),
      seed.studio.projectMemberAgents(e.memberAgents),
      seed.studio.pendingInvitations(PENDING_NONE),
    ),
  })

  // The pending invitation appears after "Send"; overwrite cleanly, skip if unchanged.
  let currentPending = PENDING_NONE
  const setPending = (list: PendingInvitationItem[]) => {
    if (list === currentPending) return
    currentPending = list
    dispatch(listInvitationsForTarget.fulfilled(list, "wt", { targetType: "project", targetId: e.project.id }))
  }

  const t = makeT(lang)
  const MEMBERS_LABEL = t("projectMembership:members")
  const INVITE = t("actions:invite")
  const ADD = t("actions:add")
  const membersNavItem = (win: HTMLElement) => findControl(navOf(win), MEMBERS_LABEL, true)
  const inviteButton = (win: HTMLElement) => findControl(insetOf(win), INVITE, true)
  const confirmButton = (dlg: HTMLElement | null) => dlg?.querySelector<HTMLElement>('[data-slot="dialog-footer"] button:last-of-type') ?? null

  // Open the Invite dialog and get it to the "email added as a chip" state (idempotent).
  const ensureInviteWithEmail = async (win: HTMLElement) => {
    let dlg = win.querySelector<HTMLElement>('[data-slot="dialog-content"]')
    if (!dlg) {
      const invite = inviteButton(win)
      if (invite) fireOpen(invite)
      dlg = await waitFor(win, '[data-slot="dialog-content"]', 4000)
    }
    if (!dlg) return null
    if (!leaf(dlg, e.invite.invitedEmail)) {
      // no chip yet → type the email and Add it
      const email = dlg.querySelector<HTMLInputElement>('input[type="email"]')
      if (email) {
        typeInto(email, e.invite.invitedEmail)
        await nextFrame()
      }
      const addBtn = findControl(dlg, ADD, true)
      if (addBtn) {
        fireOpen(addBtn)
        await nextFrame()
      }
    }
    return dlg
  }

  const prep = async (win: HTMLElement, path: string, pending: PendingInvitationItem[], keepOverlay = false) => {
    if (!keepOverlay) await resetTransient(win)
    await navigate(path)
    setPending(pending)
    await nextFrame()
  }

  const steps: LiveStep[] = [
    {
      caption: { en: "Open Members from the Settings section of the left menu.", fr: "Ouvrez Members depuis la section Paramètres du menu de gauche." },
      drive: async (win) => {
        await prep(win, overviewPath, PENDING_NONE)
        return { spot: membersNavItem(win) }
      },
    },
    {
      caption: { en: "Find the “Invite an admin” card and click Invite.", fr: "Trouvez la carte « Invite an admin » et cliquez sur Invite." },
      drive: async (win) => {
        await prep(win, membersPath, PENDING_NONE)
        await waitFor(win, '[data-slot="grid-content"]', 5000)
        return { spot: inviteButton(win), observe: win.querySelector<HTMLElement>('[data-slot="grid-content"]') }
      },
    },
    {
      caption: { en: "Type the person's Email address, then click Add — it appears as a chip.", fr: "Saisissez l'e-mail de la personne, puis cliquez sur Add — il apparaît en puce." },
      drive: async (win) => {
        await prep(win, membersPath, PENDING_NONE)
        const dlg = await ensureInviteWithEmail(win)
        return { spot: dlg ? findControl(dlg, ADD, true) : null, observe: dlg }
      },
    },
    {
      caption: { en: "Click Send — each added address is invited to the workspace.", fr: "Cliquez sur Send — chaque adresse ajoutée est invitée dans l'espace de travail." },
      drive: async (win) => {
        await prep(win, membersPath, PENDING_NONE, true) // keep the dialog from the previous step
        const dlg = await ensureInviteWithEmail(win)
        return { spot: dlg?.querySelector<HTMLElement>('button[type="submit"]') ?? null, observe: dlg }
      },
    },
    {
      caption: { en: "A sent invitation stays under Pending invitations until it's accepted.", fr: "Une invitation envoyée reste sous Pending invitations jusqu'à son acceptation." },
      drive: async (win) => {
        await prep(win, membersPath, PENDING_ONE)
        const emailLeaf = leaf(insetOf(win), e.invite.invitedEmail)
        return { observe: emailLeaf?.closest<HTMLElement>("section") ?? emailLeaf?.parentElement ?? null }
      },
    },
    {
      caption: { en: "Open a member's card to see which agents they can access, and their role.", fr: "Ouvrez la carte d'un membre pour voir à quels agents il accède, et son rôle." },
      drive: async (win) => {
        await prep(win, jordanDetailPath, PENDING_ONE)
        const table = await waitFor(win, "table", 5000)
        return { observe: table }
      },
    },
    {
      caption: { en: "Remove a member with the trash icon on their card, then confirm.", fr: "Retirez un membre via l'icône corbeille de sa carte, puis confirmez." },
      drive: async (win) => {
        await prep(win, membersPath, PENDING_ONE)
        const card = leaf(insetOf(win), "Jordan Lee", true)?.closest<HTMLElement>('[data-slot="card"]')
        const trash = card?.querySelector<HTMLElement>('[data-slot="button"]')
        if (trash) fireOpen(trash)
        const dlg = await waitFor(win, '[data-slot="dialog-content"]', 4000)
        return { spot: confirmButton(dlg), observe: dlg }
      },
    },
    {
      caption: { en: "Cancel a pending invitation with the trash icon on its row, then confirm.", fr: "Annulez une invitation en attente via la corbeille de sa ligne, puis confirmez." },
      drive: async (win) => {
        await prep(win, membersPath, PENDING_ONE)
        const card = leaf(insetOf(win), e.invite.invitedEmail)?.closest<HTMLElement>(".rounded-xl")
        const trash = card?.querySelector<HTMLElement>("button")
        if (trash) fireOpen(trash)
        const dlg = await waitFor(win, '[data-slot="dialog-content"]', 4000)
        return { spot: confirmButton(dlg), observe: dlg }
      },
    },
  ]

  return { Mount, steps }
}

export default function AddAdminLive({ lang = "en" }: { lang?: Lang }) {
  const { Mount, steps } = useMemo(() => buildWalkthrough(lang), [lang])
  return <LiveWalkthroughPlayer Mount={Mount} steps={steps} lang={lang} />
}
