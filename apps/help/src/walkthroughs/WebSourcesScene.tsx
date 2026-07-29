// POC (issue #568) — v2 Web sources walkthrough. Same STORYBOARD (steps + captions +
// sample data) as the hand-built WebSourcesWalkthrough.astro; only the VISUAL changes —
// real imported @caseai-connect/ui components, assembly transcribed from apps/web.
import { Badge } from "@caseai-connect/ui/shad/badge"
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
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  EllipsisVertical,
  ExternalLink,
  Globe,
  Info,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Tags,
  Trash2,
} from "lucide-react"
import type { CSSProperties, ReactNode } from "react"
import { Anchor } from "./Anchor"
import { makeT } from "./locales"
import { ico, type Lang, Overview, StudioChrome } from "./StudioChrome"
import { type Step, WalkthroughPlayer } from "./WalkthroughPlayer"

// CHROME labels are resolved from the REAL apps/web locales (auto-sync — see locales.ts);
// illustrative sample DATA (source name, page count, tag names, relative time) is authored
// here and kept domain-neutral.
function strings(lang: Lang) {
  const t = makeT(lang)
  const sourceName = lang === "fr" ? "Site de documentation" : "Documentation site"
  return {
    // sample data
    sourceName,
    pages: "42",
    tagPublic: "public-documents",
    tagPrivate: "private-documents",
    urlPlaceholder: "https://example.com",
    updatedAgo: lang === "fr" ? "il y a moins d'une minute" : "less than a minute ago",
    // real UI labels
    title: t("document:webSources.title"),
    desc: t("document:webSources.description"),
    crawlWebsite: t("document:crawl.button"),
    tagsBtn: t("documentTag:sheet.button"),
    create: t("actions:create"),
    emptyTitle: t("document:webSources.empty.title"),
    emptyDesc: t("document:webSources.empty.description"),
    crawlTitle: t("document:crawl.title"),
    crawlDesc: t("document:crawl.description"),
    urlLabel: t("document:crawl.urlLabel"),
    nameLabel: t("document:crawl.nameLabel"),
    namePlaceholder: t("document:crawl.namePlaceholder"),
    startCrawling: t("document:crawl.submit"),
    colTitle: t("document:props.title"),
    colPages: t("document:props.pages"),
    colTags: t("document:props.tags"),
    colStatus: t("document:props.embeddingStatus"),
    colUpdated: t("document:props.updatedAt"),
    statusCrawling: t("document:props.embeddingStatuses.crawling"),
    statusReady: t("document:props.embeddingStatuses.ready"),
    view: t("actions:view"),
    edit: t("actions:edit"),
    recrawl: t("document:recrawl"),
    del: t("actions:delete"),
    editSourceTitle: t("document:update.title", { documentTitle: sourceName }),
    tTitle: t("document:props.title"),
    tags: t("document:props.tags"),
    addTag: t("documentTag:addTag"),
    update: t("actions:update"),
    searchTags: t("documentTag:searchPlaceholder"),
    createTag: t("documentTag:create.button"),
    publicDesc: t("documentTag:publicDescription"),
    createTagTitle: t("documentTag:create.title"),
    tagNameLabel: t("documentTag:props.name"),
    tagNamePlaceholder: t("documentTag:props.placeholders.name"),
    descLabel: t("documentTag:props.description"),
    descPlaceholder: t("documentTag:props.placeholders.description"),
  }
}
type WS = ReturnType<typeof strings>
const th: CSSProperties = { background: "var(--muted)", fontWeight: 500 }
const fieldLabel: CSSProperties = { fontSize: "0.82rem", fontWeight: 500, margin: "0 0 0.3rem" }
const URLS = [
  "https://example.com/",
  "https://example.com/about",
  "https://example.com/pricing",
  "https://example.com/docs",
  "https://example.com/docs/getting-started",
  "https://example.com/contact",
]

// Scrim'd dialogs/sheets (full-window veil, rendered at the chrome ROOT).
function modalFor(step: number, s: WS): ReactNode {
  if (step === 3) return <CrawlDialog s={s} />
  if (step === 7) return <EditDialog s={s} withDropdown={false} />
  if (step === 8) return <EditDialog s={s} withDropdown />
  if (step === 10) return <TagsSheet s={s} second={false} />
  if (step === 11)
    return (
      <>
        <TagsSheet s={s} second={false} />
        <CreateTagDialog s={s} />
      </>
    )
  if (step === 12) return <TagsSheet s={s} second />
  return undefined
}

export function WebSourcesScene({ step, lang }: { step: number; lang: Lang }) {
  const l = lang as Lang
  const s = strings(l)
  const sourcesOpen = step >= 1
  const onPage = step >= 2
  return (
    <StudioChrome
      lang={l}
      sourcesOpen={sourcesOpen}
      active={onPage ? "webSources" : null}
      breadcrumb={onPage ? s.title : ""}
      overlay={step === 5 ? <RowMenu s={s} /> : undefined}
      modal={modalFor(step, s)}
    >
      {onPage ? <Page s={s} step={step} /> : <Overview lang={l} />}
    </StudioChrome>
  )
}

function Page({ s, step }: { s: WS; step: number }) {
  const hasSites = step >= 4
  const crawling = step === 4
  const expanded = step === 6
  const tagged = step >= 9
  const showTagsBtn = step === 2 || step >= 9
  return (
    <>
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
          <div style={{ fontSize: "1.5rem", fontWeight: 600, lineHeight: 1.15 }}>{s.title}</div>
          <div
            style={{ fontSize: "1.05rem", color: "var(--muted-foreground)", marginTop: "0.15rem" }}
          >
            {s.desc}
          </div>
        </div>
        <div
          style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}
        >
          {step === 2 ? (
            <Anchor name="btnCrawl">
              <Button variant="outline" size="sm">
                <Globe style={ico} /> {s.crawlWebsite}
              </Button>
            </Anchor>
          ) : (
            <Button variant="outline" size="sm">
              <Globe style={ico} /> {s.crawlWebsite}
            </Button>
          )}
          {showTagsBtn &&
            (step >= 9 ? (
              <Anchor name="btnTags">
                <Button variant="outline" size="sm">
                  <Tags style={ico} /> {s.tagsBtn}
                </Button>
              </Anchor>
            ) : (
              <Button variant="outline" size="sm">
                <Tags style={ico} /> {s.tagsBtn}
              </Button>
            ))}
        </div>
      </div>

      <div style={{ padding: hasSites ? "1.5rem" : 0 }}>
        {!hasSites ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              gap: "0.5rem",
              padding: "3.5rem 1rem",
            }}
          >
            <Globe
              style={{ width: "1.75rem", height: "1.75rem", color: "var(--muted-foreground)" }}
            />
            <b style={{ fontSize: "1rem" }}>{s.emptyTitle}</b>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--muted-foreground)",
                maxWidth: 360,
                margin: 0,
              }}
            >
              {s.emptyDesc}
            </p>
            <Button variant="outline" size="sm" style={{ marginTop: "0.4rem" }}>
              <Globe style={ico} /> {s.crawlWebsite}
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ ...th, borderTopLeftRadius: 8 }}>{s.colTitle}</TableHead>
                <TableHead style={th}>{s.colPages}</TableHead>
                <TableHead style={th}>{s.colTags}</TableHead>
                <TableHead style={th}>{s.colStatus}</TableHead>
                <TableHead style={th}>{s.colUpdated}</TableHead>
                <TableHead style={{ ...th, width: "2.5rem", borderTopRightRadius: 8 }} />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    {expanded ? (
                      <Anchor name="rowChevron">
                        <Button
                          variant="ghost"
                          size="icon"
                          style={{ width: "1.5rem", height: "1.5rem", flexShrink: 0 }}
                        >
                          <ChevronDown style={ico} />
                        </Button>
                      </Anchor>
                    ) : step >= 5 ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        style={{ width: "1.5rem", height: "1.5rem", flexShrink: 0 }}
                      >
                        <ChevronRight style={ico} />
                      </Button>
                    ) : null}
                    <Globe style={{ ...ico, color: "var(--muted-foreground)", flexShrink: 0 }} />
                    <span>{s.sourceName}</span>
                  </span>
                </TableCell>
                <TableCell style={{ color: "var(--muted-foreground)" }}>
                  {crawling ? "—" : s.pages}
                </TableCell>
                <TableCell>
                  {tagged ? (
                    <Anchor name="obsTagCell">
                      <Badge variant="secondary">{s.tagPublic}</Badge>
                    </Anchor>
                  ) : null}
                </TableCell>
                <TableCell>
                  {crawling ? (
                    <Anchor name="obsStatus">
                      <Badge variant="outline" style={{ gap: "0.375rem" }}>
                        <Loader2
                          style={{
                            width: "0.75rem",
                            height: "0.75rem",
                            animation: "dsn-spin 1s linear infinite",
                          }}
                        />{" "}
                        {s.statusCrawling}
                      </Badge>
                    </Anchor>
                  ) : (
                    <Badge variant="success">{s.statusReady}</Badge>
                  )}
                </TableCell>
                <TableCell style={{ color: "var(--muted-foreground)" }}>{s.updatedAgo}</TableCell>
                <TableCell style={{ textAlign: "right" }}>
                  {step === 5 ? (
                    <Anchor name="rowDots">
                      <Button variant="ghost" size="icon" style={{ width: "2rem", height: "2rem" }}>
                        <EllipsisVertical style={ico} />
                      </Button>
                    </Anchor>
                  ) : (
                    <Button variant="ghost" size="icon" style={{ width: "2rem", height: "2rem" }}>
                      <EllipsisVertical style={ico} />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
              {expanded && (
                <TableRow
                  style={{ background: "color-mix(in oklab, var(--muted) 30%, transparent)" }}
                >
                  <TableCell colSpan={5} style={{ paddingLeft: "4rem" }}>
                    <Anchor name="obsUrls">
                      <span style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        {URLS.map((u) => (
                          <span
                            key={u}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.4rem",
                              color: "var(--muted-foreground)",
                              fontSize: "0.82rem",
                            }}
                          >
                            <ExternalLink style={{ width: "0.85rem", height: "0.85rem" }} /> {u}
                          </span>
                        ))}
                      </span>
                    </Anchor>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  )
}

const scrim: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  zIndex: 40,
}
const modal: CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%,-50%)",
  width: "min(440px, 84%)",
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "1.25rem",
  boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
  zIndex: 41,
}

function CrawlDialog({ s }: { s: WS }) {
  return (
    <>
      <div style={scrim} />
      <div style={modal}>
        <b style={{ fontSize: "1.05rem", fontWeight: 600 }}>{s.crawlTitle}</b>
        <p
          style={{
            fontSize: "0.82rem",
            color: "var(--muted-foreground)",
            margin: "0.35rem 0 1rem",
          }}
        >
          {s.crawlDesc}
        </p>
        <Anchor name="obsCrawlFields">
          <span style={{ display: "block" }}>
            <p style={fieldLabel}>{s.urlLabel}</p>
            <Input type="url" placeholder={s.urlPlaceholder} readOnly />
            <p style={{ ...fieldLabel, marginTop: "0.75rem" }}>{s.nameLabel}</p>
            <Input type="text" placeholder={s.namePlaceholder} readOnly />
          </span>
        </Anchor>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
          <Anchor name="btnStartCrawl">
            <Button>{s.startCrawling}</Button>
          </Anchor>
        </div>
      </div>
    </>
  )
}

function EditDialog({ s, withDropdown }: { s: WS; withDropdown: boolean }) {
  return (
    <>
      <div style={scrim} />
      <div style={modal}>
        <b style={{ fontSize: "1.05rem", fontWeight: 600 }}>{s.editSourceTitle}</b>
        <p style={{ ...fieldLabel, marginTop: "1rem" }}>{s.tTitle}</p>
        <Input defaultValue={s.sourceName} readOnly />
        <p style={{ ...fieldLabel, marginTop: "0.75rem" }}>{s.tags}</p>
        <div>
          {withDropdown ? (
            <Button variant="outline" size="sm">
              <Plus style={ico} /> {s.addTag}
            </Button>
          ) : (
            <Anchor name="btnAddTag">
              <Button variant="outline" size="sm">
                <Plus style={ico} /> {s.addTag}
              </Button>
            </Anchor>
          )}
        </div>
        {withDropdown && (
          <Anchor name="obsTagDrop">
            <div
              style={{
                marginTop: "0.5rem",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "0.4rem",
                boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  color: "var(--muted-foreground)",
                  fontSize: "0.82rem",
                  padding: "0.35rem 0.4rem",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <Search style={{ width: "0.85rem", height: "0.85rem" }} /> {s.searchTags}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.4rem",
                  fontSize: "0.82rem",
                }}
              >
                <Tag style={ico} /> {s.tagPublic}
              </div>
            </div>
          </Anchor>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
          {withDropdown ? (
            <Anchor name="btnUpdate">
              <Button>{s.update}</Button>
            </Anchor>
          ) : (
            <Button>{s.update}</Button>
          )}
        </div>
      </div>
    </>
  )
}

function RowMenu({ s }: { s: WS }) {
  const item = (icon: ReactNode, label: string, danger?: boolean) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.4rem 0.5rem",
        borderRadius: 7,
        color: danger ? "var(--destructive)" : undefined,
      }}
    >
      {icon} {label}
    </div>
  )
  return (
    <Anchor name="obsMenu">
      <div
        style={{
          position: "absolute",
          top: "8.5rem",
          right: "2.5rem",
          width: 220,
          background: "var(--popover)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          boxShadow: "0 12px 32px rgba(0,0,0,0.14)",
          padding: "0.3rem",
          zIndex: 8,
          fontSize: "0.82rem",
        }}
      >
        {item(<Info style={ico} />, s.view)}
        {item(<Pencil style={ico} />, s.edit)}
        {item(<RefreshCw style={ico} />, s.recrawl)}
        <div style={{ height: 1, background: "var(--border)", margin: "0.3rem 0.25rem" }} />
        {item(<Trash2 style={ico} />, s.del, true)}
      </div>
    </Anchor>
  )
}

function TagRow({ name, desc, actions }: { name: string; desc?: string; actions?: boolean }) {
  return (
    <div style={{ borderBottom: "1px solid var(--border)", padding: "0.7rem 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "0.85rem",
          fontWeight: 500,
        }}
      >
        <Tag style={ico} /> {name}
        {actions && (
          <span
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: "0.35rem",
              color: "var(--muted-foreground)",
            }}
          >
            <Button variant="outline" size="icon" style={{ width: "1.9rem", height: "1.9rem" }}>
              <Pencil style={{ width: "0.85rem", height: "0.85rem" }} />
            </Button>
            <Button variant="outline" size="icon" style={{ width: "1.9rem", height: "1.9rem" }}>
              <Trash2 style={{ width: "0.85rem", height: "0.85rem" }} />
            </Button>
          </span>
        )}
      </div>
      {desc && (
        <p style={{ fontSize: "0.78rem", color: "var(--muted-foreground)", margin: "0.3rem 0 0" }}>
          {desc}
        </p>
      )}
    </div>
  )
}

function TagsSheet({ s, second }: { s: WS; second: boolean }) {
  return (
    <>
      <div style={scrim} />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(360px, 80%)",
          background: "var(--popover)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.14)",
          zIndex: 41,
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <b style={{ fontSize: "1.05rem", fontWeight: 600 }}>{s.tagsBtn}</b>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          {second ? (
            <Button variant="outline" size="sm">
              <Plus style={ico} /> {s.createTag}
            </Button>
          ) : (
            <Anchor name="btnCreateTag">
              <Button variant="outline" size="sm">
                <Plus style={ico} /> {s.createTag}
              </Button>
            </Anchor>
          )}
        </div>
        {second ? (
          <>
            <Anchor name="obsTagActions">
              <span style={{ display: "block" }}>
                <TagRow name={s.tagPrivate} actions />
              </span>
            </Anchor>
            <TagRow name={s.tagPublic} desc={s.publicDesc} />
          </>
        ) : (
          <TagRow name={s.tagPublic} desc={s.publicDesc} />
        )}
      </div>
    </>
  )
}

function CreateTagDialog({ s }: { s: WS }) {
  return (
    <div style={modal}>
      <b style={{ fontSize: "1.05rem", fontWeight: 600 }}>{s.createTagTitle}</b>
      <Anchor name="obsTagFields">
        <span style={{ display: "block", marginTop: "1rem" }}>
          <p style={fieldLabel}>{s.tagNameLabel}</p>
          <Input placeholder={s.tagNamePlaceholder} readOnly />
          <p style={{ ...fieldLabel, marginTop: "0.75rem" }}>{s.descLabel}</p>
          <Input placeholder={s.descPlaceholder} readOnly />
        </span>
      </Anchor>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
        <Anchor name="btnCreateTagConfirm">
          <Button>{s.create}</Button>
        </Anchor>
      </div>
    </div>
  )
}

const STEPS: Step[] = [
  { spot: "navSources", observe: [] },
  { spot: "navWebSources", observe: [] },
  { spot: "btnCrawl", observe: [] },
  { spot: "btnStartCrawl", observe: ["obsCrawlFields"] },
  { spot: null, observe: ["obsStatus"] },
  { spot: "rowDots", observe: ["obsMenu"] },
  { spot: "rowChevron", observe: ["obsUrls"] },
  { spot: "btnAddTag", observe: [] },
  { spot: "btnUpdate", observe: ["obsTagDrop"] },
  { spot: "btnTags", observe: ["obsTagCell"] },
  { spot: "btnCreateTag", observe: [] },
  { spot: "btnCreateTagConfirm", observe: ["obsTagFields"] },
  { spot: null, observe: ["obsTagActions"] },
]
const CAPTIONS = {
  en: [
    "Open the Sources section in the left menu.",
    "Click Web sources.",
    "To add a web source, click Crawl Website.",
    "Add the website URL, name your source, then click Start Crawling.",
    "Wait for the Embedding Status to become “Ready”.",
    "View, Edit, Recrawl or Delete a web source from the ⋮ menu.",
    "Click the arrow to show the crawled pages.",
    "Edit lets you tag your source.",
    "Click Add tag, pick a tag, then click Update.",
    "Create tags by clicking Tags.",
    "Click Create tag.",
    "Add a Name and a Description, then click Create.",
    "Edit or Delete your tags anytime.",
  ],
  fr: [
    "Ouvrez la section Sources dans le menu de gauche.",
    "Cliquez sur Sites web.",
    "Pour ajouter une source web, cliquez sur Explorer un site web.",
    "Saisissez l'URL du site, nommez la source, puis cliquez sur Lancer l'exploration.",
    "Attendez que le statut des embeddings passe à « Prêt ».",
    "Voir, Modifier, Ré-explorer ou Supprimer une source depuis le menu ⋮.",
    "Cliquez sur la flèche pour afficher les pages explorées.",
    "Modifier permet d'étiqueter votre source.",
    "Cliquez sur Ajouter une étiquette, choisissez-en une, puis Mettre à jour.",
    "Créez des étiquettes en cliquant sur Étiquettes.",
    "Cliquez sur Créer une étiquette.",
    "Saisissez un nom et une description, puis cliquez sur Créer.",
    "Modifiez ou supprimez vos étiquettes à tout moment.",
  ],
} as const

export default function WebSourcesWalkthrough({ lang = "en" }: { lang?: Lang }) {
  return <WalkthroughPlayer Scene={WebSourcesScene} steps={STEPS} captions={CAPTIONS} lang={lang} />
}
