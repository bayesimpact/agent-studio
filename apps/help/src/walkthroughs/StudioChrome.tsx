// POC (issue #568) — v2 walkthroughs. SHARED Studio chrome + workspace overview,
// transcribed faithfully from the real apps/web render tree
// (StudioLayout → SidebarLayout → SidebarInset → LayoutHeader → DotsBackground → Wrap).
// Reused by every feature walkthrough (Documents, Web sources, Resource libraries).
import { LayoutHeader } from "@caseai-connect/ui/components/layouts/header"
import { Badge } from "@caseai-connect/ui/shad/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList } from "@caseai-connect/ui/shad/breadcrumb"
import { Button } from "@caseai-connect/ui/shad/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSeparator,
} from "@caseai-connect/ui/shad/sidebar"
import {
  ArrowRight,
  BarChart3,
  BotMessageSquare,
  ChevronRight,
  ChevronsUpDown,
  DatabaseZap,
  File,
  FileImage,
  FileText,
  Form,
  Globe,
  LibraryBig,
  ListChecks,
  Megaphone,
  Plus,
  PlusCircle,
  ScanText,
  Send,
  Server,
  Settings2,
  Trash2,
  Users,
} from "lucide-react"
import type { CSSProperties, ReactNode } from "react"
import { Anchor } from "./Anchor"
import { makeT } from "./locales"

export type Lang = "en" | "fr"
export type SourceKey = "documents" | "webSources" | "resourceLibraries" | null
export const ico = { width: "1rem", height: "1rem" } as const
export const ico5 = { width: "1.25rem", height: "1.25rem" } as const

// CHROME labels resolve from the REAL apps/web locales (auto-sync — see locales.ts);
// illustrative sample DATA (org/agent/user names, category badges, relative time) is
// authored here and kept domain-neutral. A few Overview backdrop descriptions are kept
// authored to honor the help-center "workspace" terminology rule where the app locale
// still says "project".
function chrome(lang: Lang) {
  const t = makeT(lang)
  const isFr = lang === "fr"
  return {
    // sample data
    org: "Bayes Impact Demo",
    studio: "Studio",
    agent1: "Bayes Assistant",
    conversationAgent: "Conversation Agent",
    extractionAgent: "Extraction Agent",
    formAgent: "Form Agent",
    catConversation: "Conversation",
    catExtraction: "Extraction",
    catForm: isFr ? "Formulaire" : "Form",
    settingsName: "Demo",
    userName: "Alex Martin",
    userEmail: "alex.martin@example.com",
    timeAgo: isFr ? "il y a environ 1 heure" : "about 1 hour ago",
    newAgent: isFr ? "Nouvel agent" : "New Agent",
    newAgentDesc: isFr
      ? "Un agent peut effectuer des tâches spécifiques en fonction de son type et de sa configuration."
      : "An agent can perform specific tasks based on its type and configuration.",
    // help-center terminology: app locale says "project" here → keep authored "workspace".
    membersDesc: isFr
      ? "Invitez des membres à rejoindre votre espace de travail pour collaborer ensemble."
      : "Invite admins to join your workspace to collaborate together.",
    analyticsDesc: isFr
      ? "Affiche les analyses de votre espace de travail, y compris les conversations, les questions moyennes par session, et plus encore."
      : "View analytics for your workspace, including conversations, average questions per session, and more.",
    // real UI labels (auto-synced from apps/web locales)
    agents: t("agent:agents"),
    settings: t("project:settings"),
    workspace: t("project:project"),
    evaluations: t("evaluation:evaluations"),
    analytics: t("analytics:analytics"),
    sources: t("document:sources"),
    mcpServers: t("mcpServers:title"),
    documents: t("document:documents"),
    webSources: t("document:filter.webSources"),
    resourceLibraries: t("resourceLibrary:title"),
    members: t("projectMembership:members"),
    admin: t("projectAdmin:navLabel"),
    newChat: isFr ? "Nouvelle discussion" : "New Chat",
    edit: t("actions:edit"),
    create: t("actions:create"),
    documentsDesc: t("document:list.description"),
    webSourcesDesc: t("document:webSources.description"),
    reviewCampaigns: t("reviewCampaigns:title"),
    reviewDesc: t("reviewCampaigns:subtitle"),
  }
}

export function StudioChrome({
  lang,
  sourcesOpen,
  active,
  breadcrumb,
  children,
  overlay,
  modal,
  agentActive = false,
  activeSettings = null,
}: {
  lang: Lang
  sourcesOpen: boolean
  active: SourceKey
  breadcrumb: string
  children: ReactNode
  overlay?: ReactNode
  modal?: ReactNode
  agentActive?: boolean
  activeSettings?: "members" | "admin" | null
}) {
  const s = chrome(lang)
  return (
    <div
      className="wt-scope"
      style={{
        position: "relative",
        height: "100%",
        display: "flex",
        overflow: "hidden",
        background: "var(--sidebar)",
      }}
    >
      <SidebarProvider
        defaultOpen
        style={
          {
            minHeight: 0,
            height: "100%",
            width: "100%",
            display: "flex",
            "--sidebar-width": "18rem",
            "--header-height": "3rem",
          } as CSSProperties
        }
      >
        <Sidebar collapsible="none" style={{ height: "100%", background: "var(--sidebar)" }}>
          <SidebarHeader>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.35rem 0.25rem",
              }}
            >
              <span
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  display: "inline-flex",
                  flexShrink: 0,
                  padding: "0.25rem",
                }}
                aria-hidden
              >
                <svg viewBox="0 0 410.85 405.35" width="100%" height="100%" aria-hidden>
                  <title>Logo</title>
                  <path
                    fill="var(--brand-primary, #f18c6e)"
                    d="M366.77,161.43H247V41.61a41.37,41.37,0,1,0-82.74,0V161.43H44.39a41.37,41.37,0,0,0,0,82.74H164.21V364A41.37,41.37,0,1,0,247,364V244.17H366.77a41.37,41.37,0,1,0,0-82.74Z"
                  />
                  <circle fill="#010101" cx="205.58" cy="364.27" r="41.05" />
                  <circle fill="#010101" cx="369.79" cy="202.64" r="41.05" />
                  <circle fill="#010101" cx="41.05" cy="202.64" r="41.05" />
                  <circle fill="#010101" cx="205.58" cy="41.05" r="41.05" />
                  <circle fill="#010101" cx="205.58" cy="202.64" r="41.05" />
                </svg>
              </span>
              <span
                style={{ display: "flex", flexDirection: "column", lineHeight: 1.1, minWidth: 0 }}
              >
                <span
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.org}
                </span>
                <span style={{ fontSize: "1rem", color: "var(--primary)" }}>{s.studio}</span>
              </span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel style={{ textTransform: "uppercase" }}>
                {s.agents}
              </SidebarGroupLabel>
              <SidebarGroupAction title={s.newAgent}>
                <Plus style={ico} />
              </SidebarGroupAction>
              <SidebarMenu>
                {[
                  { name: s.agent1, Icon: BotMessageSquare },
                  { name: s.conversationAgent, Icon: BotMessageSquare },
                  { name: s.extractionAgent, Icon: ScanText },
                  { name: s.formAgent, Icon: Form },
                ].map((a, i) => (
                  <SidebarMenuItem key={a.name}>
                    {i === 0 ? (
                      <>
                        <Anchor name="navAgent1">
                          <SidebarMenuButton isActive={agentActive}>
                            <a.Icon style={ico} /> <span>{a.name}</span>
                          </SidebarMenuButton>
                        </Anchor>
                        {agentActive && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.4rem",
                              padding: "0.3rem 0.5rem 0.3rem 2rem",
                              fontSize: "0.78rem",
                              color: "var(--muted-foreground)",
                            }}
                          >
                            <Plus style={ico} /> <span>{s.newChat}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <SidebarMenuButton>
                        <a.Icon style={ico} /> <span>{a.name}</span>
                      </SidebarMenuButton>
                    )}
                    <div
                      style={{ marginRight: "1rem", marginTop: "0.25rem", marginBottom: "0.5rem" }}
                    >
                      <SidebarSeparator />
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup style={{ marginTop: "auto" }}>
              <div
                style={{
                  padding: "0.35rem 0.5rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  lineHeight: 1.2,
                  marginBottom: "0.75rem",
                }}
              >
                <span style={{ fontSize: "0.875rem", fontWeight: 700 }}>{s.settingsName}</span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    color: "color-mix(in oklab, var(--sidebar-foreground) 70%, transparent)",
                  }}
                >
                  {s.settings}
                </span>
              </div>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <ListChecks style={ico} /> <span>{s.evaluations}</span>
                    <ChevronRight style={{ ...ico, marginLeft: "auto" }} />
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <BarChart3 style={ico} /> <span>{s.analytics}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Anchor name="navSources">
                    <SidebarMenuButton isActive={active === null && !sourcesOpen}>
                      <DatabaseZap style={ico} /> <span>{s.sources}</span>
                      <ChevronRight
                        style={{
                          ...ico,
                          marginLeft: "auto",
                          transform: sourcesOpen ? "rotate(90deg)" : undefined,
                          transition: "transform .2s",
                        }}
                      />
                    </SidebarMenuButton>
                  </Anchor>
                  {sourcesOpen && (
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <Anchor name="navDocuments">
                          <SidebarMenuSubButton isActive={active === "documents"}>
                            <File style={ico} /> <span>{s.documents}</span>
                          </SidebarMenuSubButton>
                        </Anchor>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Anchor name="navWebSources">
                          <SidebarMenuSubButton isActive={active === "webSources"}>
                            <Globe style={ico} /> <span>{s.webSources}</span>
                          </SidebarMenuSubButton>
                        </Anchor>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Anchor name="navResourceLibraries">
                          <SidebarMenuSubButton isActive={active === "resourceLibraries"}>
                            <LibraryBig style={ico} /> <span>{s.resourceLibraries}</span>
                          </SidebarMenuSubButton>
                        </Anchor>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Server style={ico} /> <span>{s.mcpServers}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Anchor name="navMembers">
                    <SidebarMenuButton isActive={activeSettings === "members"}>
                      <Users style={ico} /> <span>{s.members}</span>
                    </SidebarMenuButton>
                  </Anchor>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Anchor name="navAdmin">
                    <SidebarMenuButton isActive={activeSettings === "admin"}>
                      <Settings2 style={ico} /> <span>{s.admin}</span>
                    </SidebarMenuButton>
                  </Anchor>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.55rem",
                padding: "0.4rem 0.5rem",
              }}
            >
              <span
                style={{
                  width: "2rem",
                  height: "2rem",
                  borderRadius: 8,
                  background: "var(--muted)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "var(--muted-foreground)",
                }}
              >
                AM
              </span>
              <span
                style={{ display: "flex", flexDirection: "column", lineHeight: 1.15, minWidth: 0 }}
              >
                <span style={{ fontSize: "0.8rem", fontWeight: 500, textTransform: "capitalize" }}>
                  {s.userName}
                </span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--muted-foreground)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.userEmail}
                </span>
              </span>
              <ChevronsUpDown style={{ ...ico, marginLeft: "auto" }} />
            </div>
          </SidebarFooter>
        </Sidebar>

        <main
          style={{
            position: "relative",
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            background: "var(--background)",
            color: "var(--foreground)",
            overflow: "hidden",
            margin: "0.5rem 0.5rem 0.5rem 0",
            borderRadius: "0.75rem",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <LayoutHeader
            title={
              breadcrumb ? (
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>{breadcrumb}</BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              ) : (
                ""
              )
            }
          />
          <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0.1,
                backgroundImage: "radial-gradient(circle at 1px 1px, black 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
              aria-hidden
            />
            <div
              style={{
                position: "absolute",
                inset: "1.25rem 2.5rem",
                border: "1px solid var(--border)",
                borderRadius: "1rem",
                overflow: "hidden",
                background: "var(--background)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ overflow: "auto", flex: 1, minHeight: 0 }}>{children}</div>
              {overlay}
            </div>
            <button
              type="button"
              aria-label="Open chat"
              style={{
                position: "absolute",
                right: "1.5rem",
                bottom: "1.5rem",
                width: "3.5rem",
                height: "3.5rem",
                borderRadius: "50%",
                background: "var(--brand-primary, #2563eb)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                border: 0,
                cursor: "pointer",
                zIndex: 9,
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <title>Chat</title>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          </div>
        </main>
      </SidebarProvider>
      {/* Dialogs/sheets: scrim + content live at the ROOT so the veil covers the WHOLE
          simulated window (sidebar + main), exactly like the app's fixed inset-0 overlay. */}
      {modal}
    </div>
  )
}

/* ---------------- Workspace overview (AgentList) — nav-step backdrop ---------------- */
type Card =
  | { kind: "agent"; badge: string; title: string; Icon: typeof BotMessageSquare }
  | { kind: "new" }
  | {
      kind: "feature"
      title: string
      desc: string
      footer: "documents" | "web" | "members" | "review" | "analytics"
    }

export function Overview({ lang }: { lang: Lang }) {
  const s = chrome(lang)
  const cards: Card[] = [
    { kind: "agent", badge: s.catConversation, title: s.agent1, Icon: BotMessageSquare },
    { kind: "agent", badge: s.catConversation, title: s.conversationAgent, Icon: BotMessageSquare },
    { kind: "agent", badge: s.catExtraction, title: s.extractionAgent, Icon: ScanText },
    { kind: "agent", badge: s.catForm, title: s.formAgent, Icon: Form },
    { kind: "new" },
    { kind: "feature", title: s.documents, desc: s.documentsDesc, footer: "documents" },
    { kind: "feature", title: s.webSources, desc: s.webSourcesDesc, footer: "web" },
    { kind: "feature", title: s.members, desc: s.membersDesc, footer: "members" },
    { kind: "feature", title: s.reviewCampaigns, desc: s.reviewDesc, footer: "review" },
    { kind: "feature", title: s.analytics, desc: s.analyticsDesc, footer: "analytics" },
  ]
  const cols = 3
  const lastRow = Math.floor((cards.length - 1) / cols)
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.6rem",
          borderBottom: "1px solid var(--border)",
          padding: "1.25rem 1.5rem",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 600, lineHeight: 1.15 }}>
            {s.settingsName}
          </div>
          <div
            style={{ fontSize: "1.25rem", color: "var(--muted-foreground)", marginTop: "0.15rem" }}
          >
            {s.workspace}
          </div>
        </div>
        <Button variant="outline">
          <Settings2 style={ico} /> {s.edit}
        </Button>
        <Button variant="outline" size="icon" aria-label="Delete">
          <Trash2 style={ico} />
        </Button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
        {cards.map((c, i) => {
          const col = i % cols
          const row = Math.floor(i / cols)
          const cell: CSSProperties = {
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            minHeight: 140,
            borderRight: col < cols - 1 ? "1px solid var(--border)" : undefined,
            borderBottom: row < lastRow ? "1px solid var(--border)" : undefined,
            background:
              c.kind === "new"
                ? "color-mix(in oklab, var(--muted) 35%, transparent)"
                : c.kind === "feature"
                  ? "var(--card)"
                  : undefined,
          }
          if (c.kind === "agent") {
            return (
              <div key={c.title} style={cell}>
                <Badge variant="secondary">{c.badge}</Badge>
                <b
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    marginTop: "0.35rem",
                  }}
                >
                  <c.Icon style={ico5} />
                  {c.title}
                </b>
                <p
                  style={{
                    fontSize: "1rem",
                    color: "var(--muted-foreground)",
                    margin: "0.25rem 0 1rem",
                  }}
                >
                  {s.timeAgo}
                </p>
                <GoBtn />
              </div>
            )
          }
          if (c.kind === "new") {
            return (
              <div key="new-agent" style={cell}>
                <b style={{ fontSize: "1.25rem", fontWeight: 500 }}>{s.newAgent}</b>
                <p
                  style={{
                    fontSize: "1rem",
                    color: "var(--muted-foreground)",
                    margin: "0.25rem 0 1rem",
                  }}
                >
                  {s.newAgentDesc}
                </p>
                <Button size="lg" style={{ fontSize: "1rem" }}>
                  {s.create} <PlusCircle style={{ ...ico5, marginLeft: "0.25rem" }} />
                </Button>
              </div>
            )
          }
          return (
            <div key={c.title} style={cell}>
              <b style={{ fontSize: "1.25rem", fontWeight: 500 }}>{c.title}</b>
              <p
                style={{
                  fontSize: "1rem",
                  color: "var(--muted-foreground)",
                  margin: "0.25rem 0 1rem",
                }}
              >
                {c.desc}
              </p>
              <GoBtn />
              <FeatureFooter kind={c.footer} />
            </div>
          )
        })}
      </div>
    </>
  )
}
export function GoBtn() {
  return (
    <Button
      variant="outline"
      size="icon"
      style={{ borderRadius: 999, marginTop: "auto", alignSelf: "flex-start" }}
    >
      <ArrowRight style={ico} />
    </Button>
  )
}
function barCell(): ReactNode {
  return <span style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--muted)" }} />
}
function FeatureFooter({
  kind,
}: {
  kind: "documents" | "web" | "members" | "review" | "analytics"
}) {
  const box: CSSProperties = {
    marginTop: "auto",
    width: "100%",
    border: "1px solid var(--border)",
    borderBottom: 0,
    borderRadius: "8px 8px 0 0",
    padding: "0.5rem 0.6rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.45rem",
  }
  if (kind === "analytics") {
    return (
      <div style={{ ...box, flexDirection: "row", alignItems: "flex-end", gap: 3, height: "3rem" }}>
        {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 68].map((h) => (
          <span
            key={`bar-${h}`}
            style={{ flex: 1, height: `${h}%`, background: "var(--primary)", borderRadius: 2 }}
          />
        ))}
      </div>
    )
  }
  if (kind === "members") {
    const sq = (bg: string, icon: ReactNode) => (
      <span
        style={{
          width: "1.4rem",
          height: "1.4rem",
          borderRadius: 6,
          background: bg,
          color: "#fff",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
    )
    return (
      <div style={box}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {barCell()}
          {sq("var(--primary)", <Send style={{ width: ".8rem", height: ".8rem" }} />)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {barCell()}
          {sq("var(--muted-foreground)", <Trash2 style={{ width: ".8rem", height: ".8rem" }} />)}
        </div>
      </div>
    )
  }
  const icons: ReactNode[] =
    kind === "documents"
      ? [<FileText key="a" style={ico} />, <FileImage key="b" style={ico} />]
      : kind === "web"
        ? [<Globe key="a" style={ico} />, <Globe key="b" style={ico} />]
        : [
            <Megaphone key="a" style={{ ...ico, color: "var(--primary)" }} />,
            <Users key="b" style={{ ...ico, color: "var(--primary)" }} />,
          ]
  return (
    <div style={box}>
      {icons.map((icon, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static 2-item decorative footer row, never reordered
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            color: "var(--muted-foreground)",
          }}
        >
          {icon}
          {barCell()}
          {barCell()}
        </div>
      ))}
    </div>
  )
}
