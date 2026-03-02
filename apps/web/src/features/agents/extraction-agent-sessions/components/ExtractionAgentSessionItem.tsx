import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@caseai-connect/ui/shad/dialog"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemHeader,
  ItemTitle,
} from "@caseai-connect/ui/shad/item"
import { Textarea } from "@caseai-connect/ui/shad/textarea"
import { AlertCircleIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { DocumentOpener } from "@/components/document/DocumentOpener"
import { Loader } from "@/components/Loader"
import { TraceUrlOpener } from "@/components/TraceUrlOpener"
import type { ExtractionAgentSessionSummary } from "@/features/agents/extraction-agent-sessions/extraction-agent-sessions.models"
import { useAppDispatch } from "@/store/hooks"
import { buildDate } from "@/utils/build-date"
import { getExtractionAgentSession } from "../extraction-agent-sessions.thunks"

export function ExtractionSessionItem({ run }: { run: ExtractionAgentSessionSummary }) {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [runResult, setRunResult] = useState<Record<string, unknown>>()

  const handleGetRunResult = async (runId: string): Promise<Record<string, unknown> | null> => {
    if (runResult) return runResult // cache

    setIsLoading(true)
    try {
      const runDetails = await dispatch(getExtractionAgentSession({ runId })).unwrap()
      if (!runDetails.result) {
        return null
      }
      setRunResult(runDetails.result)
      return runDetails.result as Record<string, unknown>
    } finally {
      setIsLoading(false)
    }
  }

  const isSuccess = run.status === "success"
  return (
    <Item variant="outline">
      <ItemHeader>
        <ItemTitle>{buildDate(run.createdAt)}</ItemTitle>

        {!isSuccess && (
          <ItemDescription className="flex items-center gap-2">
            <AlertCircleIcon className="size-4 text-red-500" />
            <span>{t(`status:${run.status}`)}</span>
          </ItemDescription>
        )}
      </ItemHeader>

      <ItemContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{run.documentFileName ?? run.documentId}</span>
        </div>
      </ItemContent>

      <ItemFooter>
        <ItemActions className="flex-wrap">
          {isSuccess && (
            <>
              <JsonViewer
                runId={run.id}
                result={runResult}
                isLoading={isLoading}
                onRequestRunResult={handleGetRunResult}
              />

              <JsonDownloader
                result={runResult}
                runId={run.id}
                isLoading={isLoading}
                onRequestRunResult={handleGetRunResult}
                fileName={buildRunResultFileName(run.documentFileName, run.id)}
              />
            </>
          )}

          <DocumentOpener noIcon buttonProps={{ size: "sm" }} documentId={run.documentId} />

          <TraceUrlOpener
            traceUrl={run.traceUrl}
            buttonProps={{ size: "sm", variant: "outline" }}
          />
        </ItemActions>
      </ItemFooter>
    </Item>
  )
}

function JsonViewer({
  runId,
  result,
  isLoading,
  onRequestRunResult,
}: {
  runId: string
  result?: Record<string, unknown>
  isLoading: boolean
  onRequestRunResult: (runId: string) => Promise<Record<string, unknown> | null>
}) {
  const { t } = useTranslation("extractionAgentSession", { keyPrefix: "result.view" })
  const [open, setOpen] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && !result && !isLoading) {
      onRequestRunResult(runId)
    }
    setOpen(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={isLoading}>
          {t("button")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        {result ? (
          <Textarea
            value={JSON.stringify(result, null, 2)}
            readOnly
            className="font-mono min-h-56"
          />
        ) : isLoading ? (
          <Loader />
        ) : (
          <p className="text-sm text-muted-foreground">{t("error")}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

function JsonDownloader({
  runId,
  result,
  isLoading,
  onRequestRunResult,
  fileName,
}: {
  runId: string
  result?: Record<string, unknown>
  isLoading: boolean
  onRequestRunResult: (runId: string) => Promise<Record<string, unknown> | null>
  fileName: string
}) {
  const { t } = useTranslation("extractionAgentSession", { keyPrefix: "result.download" })
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
      {t("button")}
    </Button>
  )
}

function buildRunResultFileName(documentFileName: string | null, runId: string): string {
  if (!documentFileName) {
    return `extraction-result-${runId}.json`
  }

  const lastDotIndex = documentFileName.lastIndexOf(".")
  const baseFileName = lastDotIndex > 0 ? documentFileName.slice(0, lastDotIndex) : documentFileName
  return `${baseFileName}-extraction-result.json`
}
