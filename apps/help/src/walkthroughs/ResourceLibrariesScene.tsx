// POC (issue #568) — v2 Resource libraries walkthrough. Same STORYBOARD (steps + captions +
// sample data) as the hand-built ResourceLibrariesWalkthrough.astro; only the VISUAL changes —
// real imported @caseai-connect/ui components, assembly transcribed from apps/web.
import { Button } from "@caseai-connect/ui/shad/button"
import { Input } from "@caseai-connect/ui/shad/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@caseai-connect/ui/shad/table"
import { Textarea } from "@caseai-connect/ui/shad/textarea"
import {
  ArrowLeft,
  ArrowRight,
  Ellipsis,
  ExternalLink,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import type { CSSProperties, ReactNode } from "react"
import { Anchor } from "./Anchor"
import { makeT } from "./locales"
import { ico, type Lang, Overview, StudioChrome } from "./StudioChrome"
import { type Step, WalkthroughPlayer } from "./WalkthroughPlayer"

// CHROME labels are resolved from the REAL apps/web locales (auto-sync — see locales.ts);
// illustrative sample DATA (agent/library/resource names, descriptions, chat lines) is
// authored here and kept domain-neutral.
function strings(lang: Lang) {
  const t = makeT(lang)
  const isFr = lang === "fr"
  const libName = isFr ? "Pour commencer" : "Getting started"
  const resName = isFr ? "Guide de démarrage" : "Quick start guide"
  const descVal = isFr
    ? "Les bases pour prendre l'application en main."
    : "The basics to get up and running."
  const fileName = isFr ? "guide-demarrage.pdf" : "quickstart.pdf"
  return {
    // sample data
    agent1: "Bayes Assistant",
    conversation: "Conversation",
    newChat: isFr ? "Nouvelle discussion" : "New Chat",
    newChatDesc: isFr
      ? "Démarrez une discussion avec votre agent."
      : "Start a chat with your agent.",
    analytics: isFr ? "Analytique" : "Analytics",
    analyticsDesc: isFr
      ? "Indicateurs de conversation pour cet agent."
      : "Conversation metrics for this agent.",
    feedback: isFr ? "Retours utilisateurs" : "Feedback",
    feedbackDesc: isFr
      ? "Gérez les retours sur les messages de l'agent."
      : "Manage feedback on agent messages.",
    libName,
    resName,
    descVal,
    fileName,
    resLink: fileName,
    userMsg: isFr ? "Comment je commence ?" : "How do I get started?",
    aiMsg: isFr
      ? "Bien sûr ! Voici une ressource qui devrait vous aider à démarrer :"
      : "Sure! Here's a resource that should help you get going:",
    // help-center terminology override: the app locale string says "project" here, but
    // guides must always say "workspace" / "espace de travail" (help-center terminology rule).
    empty: isFr
      ? "Aucune bibliothèque de ressources pour le moment. Créez-en une pour permettre aux agents de cet espace de travail de proposer des ressources."
      : "No resource libraries yet. Create one to let this workspace's agents surface resources.",
    // real UI labels (auto-synced from apps/web locales)
    evaluation: t("actions:goToEval"),
    app: t("actions:goToApp"),
    members: isFr ? "Membres" : "Members",
    edit: t("actions:edit"),
    create: t("actions:create"),
    rlTitle: t("resourceLibrary:title"),
    rlDesc: t("resourceLibrary:description"),
    newLibrary: t("resourceLibrary:actions.newLibrary"),
    newResourceLibrary: t("resourceLibrary:create.title"),
    title: t("resourceLibrary:form.titleLabel"),
    count0: t("resourceLibrary:resourceCount", { count: 0 }),
    save: t("actions:save"),
    add: t("actions:add"),
    resources: t("resourceLibrary:form.resources"),
    noResources: t("resourceLibrary:form.noResources"),
    newResource: t("resourceLibrary:resourceForm.createTitle"),
    description: t("resourceLibrary:resourceForm.descriptionLabel"),
    matchingHintsLabel: t("resourceLibrary:resourceForm.matchingHintsLabel"),
    hintsPlaceholder: t("resourceLibrary:resourceForm.matchingHintsPlaceholder"),
    url: t("resourceLibrary:link.url"),
    uploadedFile: t("resourceLibrary:link.file"),
    dragUpload: t("actions:dragOrUploadFile"),
    cancel: t("actions:cancel"),
    charsTitle: t("resourceLibrary:resourceForm.charactersUsed", {
      count: resName.length,
      max: 200,
    }),
    charsDesc: t("resourceLibrary:resourceForm.charactersUsed", {
      count: descVal.length,
      max: 2000,
    }),
    charsHints: t("resourceLibrary:resourceForm.charactersUsed", { count: 0, max: 1000 }),
    colTitle: t("resourceLibrary:table.title"),
    colDesc: t("resourceLibrary:table.description"),
    colLink: t("resourceLibrary:table.link"),
    tabGeneral: t("agent:tabs.general"),
    tabModel: t("agent:tabs.model"),
    tabOutput: t("agent:tabs.output"),
    tabSources: t("agent:tabs.sources"),
    tabResources: t("agent:tabs.resourceLibraries"),
    tabCategories: t("agent:tabs.categories"),
    tabEmbed: t("agent:tabs.embed"),
    rlFieldLabel: t("resourceLibrary:agentTab.label"),
    manage: t("resourceLibrary:manage"),
    agentTabDesc: t("resourceLibrary:agentTab.description"),
    addLibrary: t("resourceLibrary:picker.addLibrary"),
  }
}
type RL = ReturnType<typeof strings>
const th: CSSProperties = { background: "var(--muted)", fontWeight: 500 }
const fieldLabel: CSSProperties = { fontSize: "0.82rem", fontWeight: 500, margin: "0 0 0.3rem" }
const counter: CSSProperties = {
  textAlign: "right",
  fontSize: "0.7rem",
  color: "var(--muted-foreground)",
  marginTop: "0.2rem",
}

export function ResourceLibrariesScene({ step, lang }: { step: number; lang: Lang }) {
  const l = lang as Lang
  const s = strings(l)
  const onAgent = step >= 8
  const sourcesOpen = step >= 1 && step <= 7
  const active = step >= 2 && step <= 7 ? "resourceLibraries" : null
  return (
    <StudioChrome
      lang={l}
      sourcesOpen={sourcesOpen}
      active={active}
      agentActive={onAgent}
      breadcrumb={onAgent ? s.agent1 : ""}
      overlay={undefined}
    >
      {step <= 1 && <Overview lang={l} />}
      {step === 2 && <LibrariesEmpty s={s} />}
      {step === 3 && <NewLibrary s={s} />}
      {step === 4 && <LibrariesList s={s} />}
      {step === 5 && <LibraryDetail s={s} withTable={false} />}
      {step === 6 && <NewResource s={s} />}
      {step === 7 && <LibraryDetail s={s} withTable />}
      {step === 8 && <AgentEditor s={s} />}
      {step === 9 && <Chat s={s} />}
    </StudioChrome>
  )
}

function PageHeader({
  title,
  desc,
  subtitle,
  action,
}: {
  title: ReactNode
  desc?: string
  subtitle?: ReactNode
  action?: ReactNode
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.5rem",
        borderBottom: "1px solid var(--border)",
        padding: "1.25rem 1.5rem",
      }}
    >
      <Button
        variant="secondary"
        size="icon"
        style={{ borderRadius: 999, marginRight: "0.5rem", flexShrink: 0 }}
      >
        <ArrowLeft style={ico} />
      </Button>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "1.5rem", fontWeight: 600, lineHeight: 1.15 }}>{title}</div>
        {subtitle && (
          <div
            style={{
              fontSize: "1rem",
              color: "var(--muted-foreground)",
              marginTop: "0.15rem",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            {subtitle}
          </div>
        )}
        {desc && (
          <div
            style={{ fontSize: "1.05rem", color: "var(--muted-foreground)", marginTop: "0.15rem" }}
          >
            {desc}
          </div>
        )}
      </div>
      {action}
    </div>
  )
}

function LibrariesEmpty({ s }: { s: RL }) {
  return (
    <>
      <PageHeader
        title={s.rlTitle}
        desc={s.rlDesc}
        action={
          <Anchor name="btnNewLibrary">
            <Button size="sm">
              <Plus style={ico} /> {s.newLibrary}
            </Button>
          </Anchor>
        }
      />
      <div style={{ padding: "1.5rem" }}>
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 12,
            background: "var(--card)",
            padding: "1rem",
            fontSize: "0.9rem",
            color: "var(--muted-foreground)",
          }}
        >
          {s.empty}
        </div>
      </div>
    </>
  )
}

function NewLibrary({ s }: { s: RL }) {
  return (
    <>
      <PageHeader title={s.newResourceLibrary} desc={s.rlDesc} />
      <div style={{ padding: "1.5rem" }}>
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 12,
            background: "var(--card)",
            padding: "1rem",
            maxWidth: 620,
          }}
        >
          <p style={fieldLabel}>{s.title}</p>
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "stretch" }}>
            <Anchor name="obsLibTitle">
              <span style={{ flex: 1, display: "block" }}>
                <Input defaultValue={s.libName} readOnly />
              </span>
            </Anchor>
            <Anchor name="btnCreateLibrary">
              <Button variant="outline">{s.create}</Button>
            </Anchor>
          </div>
        </div>
      </div>
    </>
  )
}

function LibrariesList({ s }: { s: RL }) {
  return (
    <>
      <PageHeader
        title={s.rlTitle}
        desc={s.rlDesc}
        action={
          <Button size="sm">
            <Plus style={ico} /> {s.newLibrary}
          </Button>
        }
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            position: "relative",
            border: "1px solid var(--border)",
            borderRadius: 12,
            background: "var(--card)",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.3rem",
            minHeight: 120,
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            style={{
              position: "absolute",
              top: "0.5rem",
              right: "0.5rem",
              width: "1.75rem",
              height: "1.75rem",
              color: "var(--muted-foreground)",
            }}
            aria-label="Delete"
          >
            <Trash2 style={{ width: "0.875rem", height: "0.875rem" }} />
          </Button>
          <b style={{ fontSize: "1.25rem", fontWeight: 500 }}>{s.libName}</b>
          <small style={{ color: "var(--muted-foreground)", fontSize: "0.85rem" }}>
            {s.count0}
          </small>
          <Anchor name="cardArrow">
            <Button
              variant="outline"
              size="icon"
              style={{ borderRadius: 999, marginTop: "auto", alignSelf: "flex-start" }}
            >
              <ArrowRight style={ico} />
            </Button>
          </Anchor>
        </div>
      </div>
    </>
  )
}

function LibraryDetail({ s, withTable }: { s: RL; withTable: boolean }) {
  return (
    <>
      <PageHeader
        title={s.libName}
        desc={s.rlDesc}
        action={
          withTable ? (
            <Button>
              <Plus style={ico} /> {s.add}
            </Button>
          ) : (
            <Anchor name="btnAdd">
              <Button>
                <Plus style={ico} /> {s.add}
              </Button>
            </Anchor>
          )
        }
      />
      <div style={{ padding: "1.5rem" }}>
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 12,
            background: "var(--card)",
            padding: "1rem",
          }}
        >
          <p style={fieldLabel}>{s.title}</p>
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "stretch" }}>
            <Input defaultValue={s.libName} readOnly style={{ flex: 1 }} />
            <Button variant="outline">{s.save}</Button>
          </div>
          <p style={{ ...fieldLabel, marginTop: "1rem" }}>{s.resources}</p>
          {!withTable ? (
            <div style={{ fontSize: "0.85rem", color: "var(--muted-foreground)" }}>
              {s.noResources}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ ...th, borderTopLeftRadius: 8 }}>{s.colTitle}</TableHead>
                  <TableHead style={th}>{s.colDesc}</TableHead>
                  <TableHead style={th}>{s.colLink}</TableHead>
                  <TableHead style={{ ...th, width: "2.5rem", borderTopRightRadius: 8 }} />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell style={{ fontWeight: 500 }}>{s.resName}</TableCell>
                  <TableCell style={{ color: "var(--muted-foreground)" }}>{s.descVal}</TableCell>
                  <TableCell style={{ color: "var(--muted-foreground)" }}>{s.resLink}</TableCell>
                  <TableCell style={{ textAlign: "right" }}>
                    <Anchor name="rowDots">
                      <Button variant="ghost" size="icon" style={{ width: "2rem", height: "2rem" }}>
                        <Ellipsis style={ico} />
                      </Button>
                    </Anchor>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </>
  )
}

function NewResource({ s }: { s: RL }) {
  return (
    <>
      <PageHeader title={s.newResource} />
      <div style={{ padding: "1.5rem" }}>
        <Anchor name="obsResourceFields">
          <div
            style={{
              display: "block",
              border: "1px solid var(--border)",
              borderRadius: 12,
              background: "var(--card)",
              padding: "1rem",
              maxWidth: 620,
            }}
          >
            <p style={fieldLabel}>{s.title}</p>
            <Input defaultValue={s.resName} readOnly />
            <div style={counter}>{s.charsTitle}</div>
            <p style={{ ...fieldLabel, marginTop: "0.75rem" }}>{s.description}</p>
            <Textarea defaultValue={s.descVal} readOnly rows={2} />
            <div style={counter}>{s.charsDesc}</div>
            <p style={{ ...fieldLabel, marginTop: "0.75rem" }}>{s.matchingHintsLabel}</p>
            <Textarea placeholder={s.hintsPlaceholder} readOnly rows={2} />
            <div style={counter}>{s.charsHints}</div>
            <div style={{ display: "flex", gap: "1.25rem", marginTop: "0.7rem" }}>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.85rem",
                }}
              >
                <span
                  style={{
                    width: "0.95rem",
                    height: "0.95rem",
                    borderRadius: 999,
                    border: "4px solid var(--primary)",
                    background: "var(--background)",
                  }}
                />{" "}
                {s.url}
              </span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.85rem",
                  color: "var(--muted-foreground)",
                }}
              >
                <span
                  style={{
                    width: "0.95rem",
                    height: "0.95rem",
                    borderRadius: 999,
                    border: "1px solid var(--border)",
                  }}
                />{" "}
                {s.uploadedFile}
              </span>
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "0.5rem" }}
            >
              <span
                style={{
                  border: "1px dashed var(--primary)",
                  color: "var(--primary)",
                  borderRadius: 8,
                  padding: "0.4rem 0.7rem",
                  fontSize: "0.8rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <Upload style={ico} /> {s.dragUpload}
              </span>
              <span style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>
                {s.fileName}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.5rem",
                marginTop: "1rem",
              }}
            >
              <Button variant="ghost">{s.cancel}</Button>
              <Anchor name="btnCreateResource">
                <Button>{s.create}</Button>
              </Anchor>
            </div>
          </div>
        </Anchor>
      </div>
    </>
  )
}

function AgentEditor({ s }: { s: RL }) {
  const tabs = [
    s.tabGeneral,
    s.tabModel,
    s.tabOutput,
    s.tabSources,
    s.tabResources,
    s.tabCategories,
    s.tabEmbed,
  ]
  return (
    <>
      <div style={{ padding: "1.25rem 1.5rem 0" }}>
        <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>{s.agent1}</div>
      </div>
      <div
        style={{
          display: "flex",
          gap: "0.1rem",
          borderBottom: "1px solid var(--border)",
          margin: "0.75rem 1.5rem 0",
          flexWrap: "wrap",
        }}
      >
        {tabs.map((t) => (
          <span
            key={t}
            style={{
              fontSize: "0.85rem",
              padding: "0.5rem 0.6rem",
              color: t === s.tabResources ? "var(--foreground)" : "var(--muted-foreground)",
              borderBottom:
                t === s.tabResources ? "2px solid var(--primary)" : "2px solid transparent",
              marginBottom: -1,
              fontWeight: t === s.tabResources ? 600 : 400,
            }}
          >
            {t}
          </span>
        ))}
      </div>
      <div style={{ padding: "1.5rem" }}>
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 12,
            background: "var(--card)",
            padding: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.35rem",
            }}
          >
            <span style={fieldLabel}>{s.rlFieldLabel}</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                fontSize: "0.8rem",
                color: "var(--muted-foreground)",
              }}
            >
              {s.manage} <ExternalLink style={ico} />
            </span>
          </div>
          <p
            style={{ fontSize: "0.85rem", color: "var(--muted-foreground)", margin: "0 0 0.75rem" }}
          >
            {s.agentTabDesc}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <Anchor name="obsTag">
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  background: "var(--secondary)",
                  color: "var(--secondary-foreground)",
                  borderRadius: 999,
                  padding: "0.22rem 0.6rem",
                  fontSize: "0.8rem",
                }}
              >
                {s.libName}{" "}
                <X
                  style={{ width: "0.85rem", height: "0.85rem", color: "var(--muted-foreground)" }}
                />
              </span>
            </Anchor>
            <Anchor name="btnAddLibrary">
              <Button variant="outline" size="sm">
                <Plus style={ico} /> {s.addLibrary}
              </Button>
            </Anchor>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.1rem" }}>
            <Button>{s.save}</Button>
          </div>
        </div>
      </div>
    </>
  )
}

function Chat({ s }: { s: RL }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.7rem",
        maxWidth: 620,
        margin: "0 auto",
        padding: "1.5rem 1rem",
      }}
    >
      <div
        style={{
          alignSelf: "flex-end",
          background: "var(--primary)",
          color: "var(--primary-foreground)",
          padding: "0.55rem 0.8rem",
          borderRadius: "14px 14px 4px 14px",
          fontSize: "0.9rem",
          maxWidth: "80%",
        }}
      >
        {s.userMsg}
      </div>
      <div
        style={{ alignSelf: "flex-start", fontSize: "0.92rem", maxWidth: "88%", lineHeight: 1.5 }}
      >
        {s.aiMsg}
      </div>
      <Anchor name="obsCard">
        <span
          style={{
            alignSelf: "flex-start",
            display: "block",
            maxWidth: "28rem",
            overflow: "hidden",
            border: "1px solid var(--border)",
            borderRadius: 12,
            background: "var(--background)",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "0.75rem",
              padding: "0.75rem",
            }}
          >
            <span>
              <span style={{ display: "block", fontSize: "0.9rem", fontWeight: 500 }}>
                {s.resName}
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  color: "var(--muted-foreground)",
                  marginTop: "0.1rem",
                }}
              >
                {s.descVal}
              </span>
            </span>
            <ExternalLink style={{ ...ico, color: "var(--muted-foreground)", flexShrink: 0 }} />
          </span>
        </span>
      </Anchor>
    </div>
  )
}

const STEPS: Step[] = [
  { spot: "navSources", observe: [] },
  { spot: "navResourceLibraries", observe: [] },
  { spot: "btnNewLibrary", observe: [] },
  { spot: "btnCreateLibrary", observe: ["obsLibTitle"] },
  { spot: "cardArrow", observe: [] },
  { spot: "btnAdd", observe: [] },
  { spot: "btnCreateResource", observe: ["obsResourceFields"] },
  { spot: "rowDots", observe: [] },
  { spot: "btnAddLibrary", observe: ["obsTag"] },
  { spot: null, observe: ["obsCard"] },
]
const CAPTIONS = {
  en: [
    "Open the Sources section from the left menu.",
    "Select Resource libraries.",
    "Click New library.",
    "Title your library, then click Create.",
    "Click the arrow to open your library.",
    "Click Add to create a resource.",
    "Fill Title, Description, Matching hints and a URL or file, then click Create.",
    "Preview, Edit or Delete a resource from the ⋯ menu. Add as many as you like.",
    "Attach the library to an agent: open the Resource libraries tab → Add library, then Save.",
    "When a message matches, the assistant surfaces the resource as a card.",
  ],
  fr: [
    "Ouvrez la section Sources dans le menu de gauche.",
    "Sélectionnez Bibliothèques de ressources.",
    "Cliquez sur Nouvelle bibliothèque.",
    "Donnez un titre à votre bibliothèque, puis cliquez sur Créer.",
    "Cliquez sur la flèche pour ouvrir votre bibliothèque.",
    "Cliquez sur Ajouter pour créer une ressource.",
    "Remplissez Titre, Description, Indices de correspondance et une URL ou un fichier, puis cliquez sur Créer.",
    "Prévisualisez, modifiez ou supprimez une ressource depuis le menu ⋯. Ajoutez-en autant que vous voulez.",
    "Rattachez la bibliothèque à un agent : onglet Bibliothèques de ressources → Ajouter une bibliothèque, puis Enregistrer.",
    "Quand un message correspond, l'assistant propose la ressource sous forme de carte.",
  ],
} as const

export default function ResourceLibrariesWalkthrough({ lang = "en" }: { lang?: Lang }) {
  return (
    <WalkthroughPlayer
      Scene={ResourceLibrariesScene}
      steps={STEPS}
      captions={CAPTIONS}
      lang={lang}
    />
  )
}
