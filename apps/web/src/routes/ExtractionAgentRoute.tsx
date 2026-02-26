import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@caseai-connect/ui/shad/dialog"
import { Input } from "@caseai-connect/ui/shad/input"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemTitle,
} from "@caseai-connect/ui/shad/item"
import { Label } from "@caseai-connect/ui/shad/label"
import { Textarea } from "@caseai-connect/ui/shad/textarea"
import { CheckCircle2Icon, DownloadIcon, ExternalLinkIcon, PlusIcon } from "lucide-react"
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Navigate, useParams } from "react-router-dom"
import { ListHeader } from "@/components/layouts/ListHeader"
import type { AgentExtractionRunSummary } from "@/features/agent-extraction-runs/agent-extraction-runs.models"
import { selectAgentExtractionRunsFromAgentId } from "@/features/agent-extraction-runs/agent-extraction-runs.selectors"
import {
  executeAgentExtractionRun,
  getAgentExtractionRun,
  listAgentExtractionRuns,
} from "@/features/agent-extraction-runs/agent-extraction-runs.thunks"
import type { Agent } from "@/features/agents/agents.models"
import { selectAgentDataFromAgentId } from "@/features/agents/agents.selectors"
import { getDocumentTemporaryUrl, uploadDocument } from "@/features/documents/documents.thunks"
import { selectCurrentOrganizationId } from "@/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/features/projects/projects.selectors"
import { useAbility } from "@/hooks/use-ability"
import { useBuildPath } from "@/hooks/use-build-path"
import { ADS } from "@/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { buildDate } from "@/utils/build-date"
import { ErrorRoute } from "./ErrorRoute"
import { LoadingRoute } from "./LoadingRoute"

export function ExtractionAgentRoute() {
  const { agentId: urlAgentId } = useParams()
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)
  const agent = useAppSelector(selectAgentDataFromAgentId(urlAgentId))

  if (ADS.isError(agent) || !organizationId || !projectId) {
    return <ErrorRoute error={agent.error || "Unknown error"} />
  }

  if (!ADS.isFulfilled(agent)) return <LoadingRoute />

  return <WithData organizationId={organizationId} projectId={projectId} agent={agent.value} />
}

function WithData({
  organizationId,
  projectId,
  agent,
}: {
  organizationId: string
  projectId: string
  agent: Agent
}) {
  const dispatch = useAppDispatch()
  const { isAdminInterface } = useAbility()
  const { buildPath } = useBuildPath()
  const { t } = useTranslation("agent", { keyPrefix: "extraction" })
  const extractionRunType = isAdminInterface ? "playground" : "live"
  const runsData = useAppSelector(
    selectAgentExtractionRunsFromAgentId({ agentId: agent.id, type: extractionRunType }),
  )
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmittingRun, setIsSubmittingRun] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [runResultsById, setRunResultsById] = useState<Record<string, Record<string, unknown>>>({})
  const [loadingRunResultById, setLoadingRunResultById] = useState<Record<string, boolean>>({})
  const [runError, setRunError] = useState<string | null>(null)

  useEffect(() => {
    dispatch(
      listAgentExtractionRuns({
        organizationId,
        projectId,
        agentId: agent.id,
        type: extractionRunType,
      }),
    )
  }, [agent.id, dispatch, extractionRunType, organizationId, projectId])

  if (agent.type !== "extraction") {
    return (
      <Navigate
        to={buildPath("agent", {
          organizationId,
          projectId,
          agentId: agent.id,
        })}
        replace
      />
    )
  }

  if (ADS.isError(runsData)) {
    return <ErrorRoute error={runsData.error || "Unknown error"} />
  }

  if (!ADS.isFulfilled(runsData)) {
    return <LoadingRoute />
  }

  const runs = runsData.value
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
  }
  const handleFormOpenChange = (nextOpen: boolean) => {
    setIsFormOpen(nextOpen)
    if (!nextOpen) {
      setSelectedFile(null)
      setRunError(null)
    }
  }
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedFile || isSubmittingRun) return

    if (!SUPPORTED_EXTRACTION_MIME_TYPES.includes(selectedFile.type)) {
      setRunError(t("invalidFileType"))
      return
    }

    setIsSubmittingRun(true)
    setRunError(null)
    try {
      const uploadedDocument = await dispatch(
        uploadDocument({
          organizationId,
          projectId,
          file: selectedFile,
          sourceType: "extraction",
        }),
      ).unwrap()

      const executeResponse = await dispatch(
        executeAgentExtractionRun({
          organizationId,
          projectId,
          agentId: agent.id,
          documentId: uploadedDocument.id,
          type: extractionRunType,
        }),
      ).unwrap()

      setRunResultsById((currentResultsById) => ({
        ...currentResultsById,
        [executeResponse.runId]: executeResponse.result,
      }))
      setSelectedFile(null)
      setIsFormOpen(false)
      await dispatch(
        listAgentExtractionRuns({
          organizationId,
          projectId,
          agentId: agent.id,
          type: extractionRunType,
        }),
      )
    } catch (error) {
      setRunError(error instanceof Error ? error.message : t("runCreationFailed"))
    } finally {
      setIsSubmittingRun(false)
    }
  }
  const getRunResult = async (runId: string): Promise<Record<string, unknown> | null> => {
    const cachedRunResult = runResultsById[runId]
    if (cachedRunResult) {
      return cachedRunResult
    }

    setLoadingRunResultById((currentLoadingState) => ({ ...currentLoadingState, [runId]: true }))
    try {
      const runDetails = await dispatch(
        getAgentExtractionRun({
          organizationId,
          projectId,
          agentId: agent.id,
          runId,
          type: extractionRunType,
        }),
      ).unwrap()
      if (!runDetails.result) {
        return null
      }
      setRunResultsById((currentResultsById) => ({
        ...currentResultsById,
        [runId]: runDetails.result as Record<string, unknown>,
      }))
      return runDetails.result as Record<string, unknown>
    } finally {
      setLoadingRunResultById((currentLoadingState) => ({ ...currentLoadingState, [runId]: false }))
    }
  }

  return (
    <ListHeader path={buildPath("project", { organizationId, projectId })} title={t("runsTitle")}>
      <Button onClick={() => setIsFormOpen(true)} disabled={isSubmittingRun}>
        <PlusIcon />
        <span>{t("newRunButton")}</span>
      </Button>
      <Dialog open={isFormOpen} onOpenChange={handleFormOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("newRunTitle")}</DialogTitle>
            <DialogDescription>{t("newRunDescription")}</DialogDescription>
          </DialogHeader>
          <form className="w-full" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-3">
              <div className="space-y-2">
                <Label htmlFor="extraction-document">{t("documentLabel")}</Label>
                <Input
                  id="extraction-document"
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  onChange={handleFileChange}
                  disabled={isSubmittingRun}
                  required
                />
                <p className="text-xs text-muted-foreground">{t("documentHint")}</p>
              </div>
              {runError ? <p className="text-sm text-destructive">{runError}</p> : null}
              <Button type="submit" disabled={isSubmittingRun || !selectedFile}>
                {isSubmittingRun ? t("running") : t("submitRun")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {runs.length === 0 ? (
        <Item variant="outline" className="w-[28rem]">
          <ItemHeader className="flex-col items-start justify-start">
            <ItemTitle>{t("emptyTitle")}</ItemTitle>
            <ItemDescription>{t("emptyDescription")}</ItemDescription>
          </ItemHeader>
        </Item>
      ) : (
        runs.map((run) => (
          <ExtractionRunItem
            key={run.id}
            run={run}
            runResult={runResultsById[run.id] ?? null}
            isLoadingRunResult={loadingRunResultById[run.id] ?? false}
            onRequestRunResult={getRunResult}
            organizationId={organizationId}
            projectId={projectId}
          />
        ))
      )}
    </ListHeader>
  )
}

function ExtractionRunItem({
  run,
  runResult,
  isLoadingRunResult,
  onRequestRunResult,
  organizationId,
  projectId,
}: {
  run: AgentExtractionRunSummary
  runResult: Record<string, unknown> | null
  isLoadingRunResult: boolean
  onRequestRunResult: (runId: string) => Promise<Record<string, unknown> | null>
  organizationId: string
  projectId: string
}) {
  const { t } = useTranslation("agent", { keyPrefix: "extraction" })
  return (
    <Item variant="outline" className="w-[28rem]">
      <ItemHeader>
        <ItemTitle className="flex items-center gap-2">
          <span>{buildDate(run.createdAt)}</span>
          {run.traceUrl ? (
            <Button asChild variant="ghost" size="sm">
              <a href={run.traceUrl} className="cursor-pointer" target="_blank" rel="noreferrer">
                {t("traceUrl")}
                <ExternalLinkIcon className="size-4" />
              </a>
            </Button>
          ) : null}
        </ItemTitle>
        <ItemDescription className="flex items-center gap-2">
          {run.status === "success" ? (
            <CheckCircle2Icon className="size-4 text-emerald-600" />
          ) : null}
          <span>{t(`status.${run.status}`)}</span>
        </ItemDescription>
      </ItemHeader>
      <ItemContent className="min-w-0 space-y-1">
        <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <div className="min-w-0 flex-1 truncate">{run.documentFileName ?? run.documentId}</div>
          <ExtractionRunDownloadButton
            organizationId={organizationId}
            projectId={projectId}
            documentId={run.documentId}
            fileName={run.documentFileName ?? run.documentId}
          />
        </div>
        {run.status === "success" ? (
          <div className="flex items-center gap-2 pt-2">
            <ExtractionRunResultDialogButton
              runId={run.id}
              result={runResult}
              isLoading={isLoadingRunResult}
              onRequestRunResult={onRequestRunResult}
            />
            <ExtractionRunResultDownloadButton
              result={runResult}
              runId={run.id}
              isLoading={isLoadingRunResult}
              onRequestRunResult={onRequestRunResult}
              fileName={buildRunResultFileName(run.documentFileName, run.id)}
            />
          </div>
        ) : null}
      </ItemContent>
    </Item>
  )
}

function ExtractionRunResultDialogButton({
  runId,
  result,
  isLoading,
  onRequestRunResult,
}: {
  runId: string
  result: Record<string, unknown> | null
  isLoading: boolean
  onRequestRunResult: (runId: string) => Promise<Record<string, unknown> | null>
}) {
  const { t } = useTranslation("agent", { keyPrefix: "extraction" })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogResult, setDialogResult] = useState<Record<string, unknown> | null>(result)

  useEffect(() => {
    setDialogResult(result)
  }, [result])

  const handleOpenChange = (nextOpen: boolean) => {
    setIsDialogOpen(nextOpen)
  }

  const handleViewJsonClick = async () => {
    setIsDialogOpen(true)
    if (dialogResult || isLoading) {
      return
    }

    const loadedResult = await onRequestRunResult(runId)
    setDialogResult(loadedResult)
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <Button variant="outline" size="sm" onClick={handleViewJsonClick} disabled={isLoading}>
        {t("viewResultButton")}
      </Button>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("resultTitle")}</DialogTitle>
        </DialogHeader>
        {dialogResult ? (
          <Textarea
            value={JSON.stringify(dialogResult, null, 2)}
            readOnly
            className="font-mono min-h-56"
          />
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">{t("loadingResult")}</p>
        ) : (
          <p className="text-sm text-muted-foreground">{t("resultUnavailable")}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ExtractionRunResultDownloadButton({
  runId,
  result,
  isLoading,
  onRequestRunResult,
  fileName,
}: {
  runId: string
  result: Record<string, unknown> | null
  isLoading: boolean
  onRequestRunResult: (runId: string) => Promise<Record<string, unknown> | null>
  fileName: string
}) {
  const { t } = useTranslation("agent", { keyPrefix: "extraction" })
  const handleDownload = async () => {
    if (isLoading) {
      return
    }
    const currentRunResult = result ?? (await onRequestRunResult(runId))
    if (!currentRunResult) {
      return
    }
    const serializedResult = JSON.stringify(currentRunResult, null, 2)
    const blob = new Blob([serializedResult], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const linkElement = document.createElement("a")
    linkElement.href = url
    linkElement.download = fileName
    linkElement.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={isLoading}>
      {t("downloadResultButton")}
    </Button>
  )
}

function ExtractionRunDownloadButton({
  organizationId,
  projectId,
  documentId,
  fileName,
}: {
  organizationId: string
  projectId: string
  documentId: string
  fileName: string
}) {
  const dispatch = useAppDispatch()
  const { t } = useTranslation("common")
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (isDownloading) return

    setIsDownloading(true)
    try {
      const response = await dispatch(
        getDocumentTemporaryUrl({
          organizationId,
          projectId,
          documentId,
        }),
      ).unwrap()

      const linkElement = document.createElement("a")
      linkElement.href = response.url
      linkElement.target = "_blank"
      linkElement.rel = "noopener noreferrer"
      linkElement.download = fileName
      linkElement.click()
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="shrink-0"
      onClick={handleDownload}
      disabled={isDownloading}
    >
      <DownloadIcon className="size-4" />
      <span className="sr-only">{t("download")}</span>
    </Button>
  )
}

const SUPPORTED_EXTRACTION_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg"]

function buildRunResultFileName(documentFileName: string | null, runId: string): string {
  if (!documentFileName) {
    return `extraction-result-${runId}.json`
  }

  const lastDotIndex = documentFileName.lastIndexOf(".")
  const baseFileName = lastDotIndex > 0 ? documentFileName.slice(0, lastDotIndex) : documentFileName
  return `${baseFileName}-extraction-result.json`
}
