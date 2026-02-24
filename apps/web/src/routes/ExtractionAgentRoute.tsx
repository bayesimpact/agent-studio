import { Button } from "@caseai-connect/ui/shad/button"
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
import { PlusIcon } from "lucide-react"
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Navigate, useParams } from "react-router-dom"
import { ListHeader } from "@/components/layouts/ListHeader"
import type { AgentExtractionRunSummary } from "@/features/agent-extraction-runs/agent-extraction-runs.models"
import { selectAgentExtractionRunsFromAgentId } from "@/features/agent-extraction-runs/agent-extraction-runs.selectors"
import {
  executeAgentExtractionRun,
  listAgentExtractionRuns,
} from "@/features/agent-extraction-runs/agent-extraction-runs.thunks"
import type { Agent } from "@/features/agents/agents.models"
import { selectAgentDataFromAgentId } from "@/features/agents/agents.selectors"
import { uploadDocument } from "@/features/documents/documents.thunks"
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
  const { t } = useTranslation("agentExtractionRun")
  const extractionRunType = isAdminInterface ? "playground" : "live"
  const runsData = useAppSelector(
    selectAgentExtractionRunsFromAgentId({ agentId: agent.id, type: extractionRunType }),
  )
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmittingRun, setIsSubmittingRun] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [resultOutput, setResultOutput] = useState<Record<string, unknown> | null>(null)
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
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedFile || isSubmittingRun) return

    if (!SUPPORTED_EXTRACTION_MIME_TYPES.includes(selectedFile.type)) {
      setRunError(t("invalidFileType"))
      return
    }

    setIsSubmittingRun(true)
    setRunError(null)
    setResultOutput(null)
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

      setResultOutput(executeResponse.result)
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

  return (
    <ListHeader path={buildPath("project", { organizationId, projectId })} title={t("list.title")}>
      <Button
        onClick={() => setIsFormOpen((currentValue) => !currentValue)}
        disabled={isSubmittingRun}
      >
        <PlusIcon />
        <span>{t("newRunButton")}</span>
      </Button>
      {isFormOpen ? (
        <Item variant="outline" className="min-w-96 w-fit">
          <form className="w-full" onSubmit={handleSubmit}>
            <ItemHeader>
              <ItemTitle>{t("newRunTitle")}</ItemTitle>
              <ItemDescription>{t("newRunDescription")}</ItemDescription>
            </ItemHeader>
            <ItemContent className="flex flex-col gap-3">
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
            </ItemContent>
          </form>
        </Item>
      ) : null}
      {runs.length === 0 ? (
        <Item variant="outline" className="min-w-96 w-fit">
          <ItemHeader>
            <ItemTitle>{t("list.empty.title")}</ItemTitle>
            <ItemDescription>{t("list.empty.description")}</ItemDescription>
          </ItemHeader>
        </Item>
      ) : (
        runs.map((run) => <ExtractionRunItem key={run.id} run={run} />)
      )}
      {resultOutput ? (
        <Item variant="outline" className="min-w-96 w-fit">
          <ItemHeader>
            <ItemTitle>{t("resultTitle")}</ItemTitle>
          </ItemHeader>
          <ItemContent>
            <Textarea
              value={JSON.stringify(resultOutput, null, 2)}
              readOnly
              className="font-mono min-h-56"
            />
          </ItemContent>
        </Item>
      ) : null}
    </ListHeader>
  )
}

function ExtractionRunItem({ run }: { run: AgentExtractionRunSummary }) {
  const { t } = useTranslation("agentExtractionRun")
  return (
    <Item variant="outline" className="min-w-96 w-fit">
      <ItemHeader>
        <ItemTitle>{buildDate(run.createdAt)}</ItemTitle>
        <ItemDescription>{t(`status.${run.status}`)}</ItemDescription>
      </ItemHeader>
      <ItemContent>{run.id}</ItemContent>
    </Item>
  )
}

const SUPPORTED_EXTRACTION_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg"]
