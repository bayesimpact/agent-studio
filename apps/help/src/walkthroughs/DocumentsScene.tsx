// POC (issue #568) — v2 Documents walkthrough. Uses the SHARED StudioChrome + Overview +
// WalkthroughPlayer (same as Web sources / Resource libraries); only the Documents page
// content is bespoke. CHROME + labels auto-sync from the real apps/web locales (locales.ts);
// illustrative sample DATA (file names, tag, relative time) is authored and domain-neutral.
import { Badge } from "@caseai-connect/ui/shad/badge"
import { Button } from "@caseai-connect/ui/shad/button"
import { Checkbox } from "@caseai-connect/ui/shad/checkbox"
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
  EllipsisVertical,
  FileDown,
  Info,
  Loader2,
  Pencil,
  Plus,
  Tag,
  Tags,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react"
import type { CSSProperties, ReactNode } from "react"
import { Anchor } from "./Anchor"
import { makeT } from "./locales"
import { ico, ico5, type Lang, Overview, StudioChrome } from "./StudioChrome"
import { type Step, WalkthroughPlayer } from "./WalkthroughPlayer"

function strings(lang: Lang) {
  const t = makeT(lang)
  const isFr = lang === "fr"
  return {
    // sample data
    doc1: isFr ? "guide.pdf" : "handbook.pdf",
    doc2: "faq.pdf",
    doc3: isFr ? "politique.pdf" : "policy.pdf",
    tagName: "private-documents",
    updatedAgo: isFr ? "il y a moins d'une minute" : "less than a minute ago",
    // real UI labels (auto-synced from apps/web locales)
    documents: t("document:documents"),
    documentsDesc: t("document:list.description"),
    dragUpload: t("actions:dragOrUploadFile"),
    tagsBtn: t("documentTag:sheet.button"),
    tags: t("document:props.tags"),
    addTag: t("documentTag:addTag"),
    removeTag: t("document:bulk.removeTag.cta"),
    cancel: t("actions:cancel"),
    uploadTitle: t("document:upload.tagDialog.title"),
    uploadDesc: t("document:upload.tagDialog.description"),
    fileCount: t("document:upload.tagDialog.fileCountSentence", { count: 1 }),
    uploadConfirm: t("document:upload.tagDialog.confirm"),
    colTitle: t("document:props.title"),
    colTags: t("document:props.tags"),
    colStatus: t("document:props.embeddingStatus"),
    colUpdated: t("document:props.updatedAt"),
    statusProcessing: t("document:props.embeddingStatuses.processing"),
    statusReady: t("document:props.embeddingStatuses.ready"),
    download: t("actions:downloadDocument"),
    view: t("actions:view"),
    editDoc: t("actions:edit"),
    del: t("actions:delete"),
    selected2: t("document:bulk.selected", { count: 2 }),
    selected3: t("document:bulk.selected", { count: 3 }),
  }
}
type S = ReturnType<typeof strings>

export function DocumentsScene({ step, lang }: { step: number; lang: Lang }) {
  const l = lang as Lang
  const s = strings(l)
  const showOverview = step <= 1
  const sourcesOpen = step >= 1
  const docsActive = step >= 2
  return (
    <StudioChrome
      lang={l}
      sourcesOpen={sourcesOpen}
      active={docsActive ? "documents" : null}
      breadcrumb={docsActive ? s.documents : ""}
      overlay={step === 5 ? <RowMenu s={s} /> : undefined}
      modal={step === 3 ? <UploadDialog s={s} /> : undefined}
    >
      {showOverview ? <Overview lang={l} /> : <DocumentsPage s={s} step={step} />}
    </StudioChrome>
  )
}

/* ---------------- Documents page (DocumentList) — steps 2-7 ---------------- */
function DocumentsPage({ s, step }: { s: S; step: number }) {
  const showToolbar = step === 6 || step === 7
  const uploaded = step >= 4
  const rows = [
    ...(uploaded ? [{ name: s.doc2, tagged: false, processing: step === 4, faq: true }] : []),
    { name: s.doc1, tagged: true, processing: false, faq: false },
    { name: s.doc3, tagged: false, processing: false, faq: false },
  ].map((row, i) => ({ ...row, checked: step === 7 ? true : step === 6 ? i < 2 : false }))
  const th: CSSProperties = { background: "var(--muted)", fontWeight: 500 }

  return (
    <>
      {/* GridHeader (full-bleed) */}
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
          <div style={{ fontSize: "1.5rem", fontWeight: 600, lineHeight: 1.15 }}>{s.documents}</div>
          <div
            style={{ fontSize: "1.05rem", color: "var(--muted-foreground)", marginTop: "0.15rem" }}
          >
            {s.documentsDesc}
          </div>
        </div>
        <div
          style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}
        >
          <Anchor name="btnUpload">
            <Button>
              <UploadCloud style={ico5} /> {s.dragUpload}
            </Button>
          </Anchor>
          <Button variant="outline">
            <Tags style={ico} /> {s.tagsBtn}
          </Button>
        </div>
      </div>

      {/* body */}
      <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {showToolbar && (
          <Anchor name="toolbar">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "color-mix(in oklab, var(--muted) 50%, transparent)",
                padding: "0.5rem 0.75rem",
              }}
            >
              <Button variant="ghost" size="icon" style={{ width: "2rem", height: "2rem" }}>
                <X style={ico} />
              </Button>
              <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                {step === 7 ? s.selected3 : s.selected2}
              </span>
              <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto" }}>
                <Button variant="outline" size="sm">
                  <Tag style={ico} /> {s.addTag}
                </Button>
                <Button variant="outline" size="sm">
                  <Tag style={ico} /> {s.removeTag}
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 style={ico} /> {s.del}
                </Button>
              </div>
            </div>
          </Anchor>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ ...th, width: "2.5rem", borderTopLeftRadius: 8 }}>
                <Anchor name="headCheck">
                  <Checkbox checked={step === 7 ? true : step === 6 ? "indeterminate" : false} />
                </Anchor>
              </TableHead>
              <TableHead style={th}>{s.colTitle}</TableHead>
              <TableHead style={th}>{s.colTags}</TableHead>
              <TableHead style={th}>{s.colStatus}</TableHead>
              <TableHead style={th}>{s.colUpdated}</TableHead>
              <TableHead style={{ ...th, width: "2.5rem", borderTopRightRadius: 8 }} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={row.name} data-state={row.checked ? "selected" : undefined}>
                <TableCell>
                  <Checkbox checked={row.checked} />
                </TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>
                  {row.tagged ? (
                    <Badge variant="secondary" style={{ fontSize: "0.75rem" }}>
                      {s.tagName}
                    </Badge>
                  ) : null}
                </TableCell>
                <TableCell>
                  {row.faq && step === 4 ? (
                    <Anchor name="status">
                      <StatusBadge s={s} processing />
                    </Anchor>
                  ) : (
                    <StatusBadge s={s} processing={row.processing} />
                  )}
                </TableCell>
                <TableCell style={{ color: "var(--muted-foreground)" }}>{s.updatedAgo}</TableCell>
                <TableCell style={{ textAlign: "right" }}>
                  {i === 0 && step === 5 ? (
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
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

function StatusBadge({ s, processing }: { s: S; processing?: boolean }) {
  if (processing) {
    return (
      <Badge variant="outline" style={{ gap: "0.375rem" }}>
        <Loader2
          style={{ width: "0.75rem", height: "0.75rem", animation: "dsn-spin 1s linear infinite" }}
        />{" "}
        {s.statusProcessing}
      </Badge>
    )
  }
  return <Badge variant="success">{s.statusReady}</Badge>
}

/* ---------------- Transient overlays ---------------- */
function RowMenu({ s }: { s: S }) {
  return (
    <Anchor name="rowMenu">
      <div
        style={{
          position: "absolute",
          top: "8.5rem",
          right: "2.5rem",
          width: 214,
          background: "var(--popover)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          boxShadow: "0 12px 32px rgba(0,0,0,0.14)",
          padding: "0.3rem",
          zIndex: 8,
          fontSize: "0.82rem",
        }}
      >
        <MenuItem icon={<FileDown style={ico} />} label={s.download} />
        <MenuItem icon={<Info style={ico} />} label={s.view} />
        <MenuItem icon={<Pencil style={ico} />} label={s.editDoc} />
        <div style={{ height: 1, background: "var(--border)", margin: "0.3rem 0.25rem" }} />
        <MenuItem icon={<Trash2 style={ico} />} label={s.del} danger />
      </div>
    </Anchor>
  )
}
function MenuItem({ icon, label, danger }: { icon: ReactNode; label: string; danger?: boolean }) {
  return (
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
}
function UploadDialog({ s }: { s: S }) {
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }} />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: "min(420px, 84%)",
          background: "var(--popover)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "1.25rem",
          boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
          zIndex: 41,
        }}
      >
        <b style={{ fontSize: "1.05rem", fontWeight: 600 }}>{s.uploadTitle}</b>
        <p
          style={{
            fontSize: "0.82rem",
            color: "var(--muted-foreground)",
            margin: "0.35rem 0 0.75rem",
          }}
        >
          {s.uploadDesc}
        </p>
        <p style={{ fontSize: "0.85rem", fontWeight: 500, margin: "0 0 0.75rem" }}>{s.fileCount}</p>
        <p style={{ fontSize: "0.8rem", fontWeight: 500, margin: "0 0 0.35rem" }}>{s.tags}</p>
        <Anchor name="dlgAddTag">
          <Button variant="outline" size="sm">
            <Plus style={{ width: "0.75rem", height: "0.75rem" }} /> {s.addTag}
          </Button>
        </Anchor>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
            marginTop: "1.25rem",
          }}
        >
          <Button variant="outline">{s.cancel}</Button>
          <Anchor name="dlgUpload">
            <Button>{s.uploadConfirm}</Button>
          </Anchor>
        </div>
      </div>
    </>
  )
}

const STEPS: Step[] = [
  { spot: "navSources", observe: [] },
  { spot: "navDocuments", observe: [] },
  { spot: "btnUpload", observe: [] },
  { spot: "dlgUpload", observe: ["dlgAddTag"] },
  { spot: null, observe: ["status"] },
  { spot: "rowDots", observe: ["rowMenu"] },
  { spot: null, observe: ["toolbar"] },
  { spot: "headCheck", observe: ["toolbar"] },
]
const CAPTIONS = {
  en: [
    "Open the Sources section in the left menu.",
    "Select Documents.",
    "Click Drag or upload a file to add a document.",
    "Optionally add tags, then upload.",
    "Wait for the Embedding Status to become “Ready”.",
    "Download, View, Edit or Delete a document from the ⋮ menu.",
    "Select documents to manage them together: Add tag, Remove tag or Delete.",
    "Tick the box next to Title to select all documents.",
  ],
  fr: [
    "Ouvrez la section Sources dans le menu de gauche.",
    "Sélectionnez Documents.",
    "Cliquez sur Glissez ou téléchargez un fichier pour ajouter un document.",
    "Ajoutez éventuellement des étiquettes, puis téléversez.",
    "Attendez que le statut des embeddings passe à « Prêt ».",
    "Télécharger, Voir, Modifier ou Supprimer un document depuis le menu ⋮.",
    "Sélectionnez des documents pour les gérer ensemble : Ajouter une étiquette, Retirer un tag ou Supprimer.",
    "Cochez la case à côté de Titre pour tout sélectionner.",
  ],
} as const

export default function DocumentsWalkthrough({ lang = "en" }: { lang?: Lang }) {
  return <WalkthroughPlayer Scene={DocumentsScene} steps={STEPS} captions={CAPTIONS} lang={lang} />
}
