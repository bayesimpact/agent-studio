import type { EvaluationExtractionRunKeyMappingEntryDto } from "@caseai-connect/api-contracts"
import { Button } from "@caseai-connect/ui/shad/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@caseai-connect/ui/shad/dialog"
import { Label } from "@caseai-connect/ui/shad/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@caseai-connect/ui/shad/select"
import { PlayIcon } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Loader } from "@/common/components/Loader"
import { RunScopeSelector } from "@/common/components/shared/RunScopeSelector"
import type { AgentSettings } from "@/common/features/agents/agent-settings/agent-settings.models"
import { selectAgentSettingsDataByAgentId } from "@/common/features/agents/agent-settings/agent-settings.selectors"
import type { Agent } from "@/common/features/agents/agents.models"
import { selectAgentsData } from "@/common/features/agents/agents.selectors"
import { useValue } from "@/common/hooks/use-value"
import { ADS } from "@/common/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import type {
  EvaluationExtractionDataset,
  EvaluationExtractionDatasetSchemaColumn,
} from "@/eval/features/evaluation-extraction-datasets/evaluation-extraction-datasets.models"
import { selectIsExecuting } from "@/eval/features/evaluation-extraction-runs/evaluation-extraction-runs.selectors"
import { evaluationExtractionRunsActions } from "@/eval/features/evaluation-extraction-runs/evaluation-extraction-runs.slice"
import { useEvaluationExtractionRunPath } from "@/eval/hooks/use-evaluation-extraction-run-path"

type KeyMappingEntry = {
  agentOutputKey: string
  datasetColumnId: string
  mode: "scored" | "fyi"
}

function getAgentOutputKeys(agentSettings: AgentSettings): string[] {
  const properties = agentSettings.outputJsonSchema?.properties as
    | Record<string, unknown>
    | undefined
  if (!properties) return []
  return Object.keys(properties)
}

function buildDefaultKeyMapping({
  agentSettings,
  targetColumns,
}: {
  agentSettings: AgentSettings
  targetColumns: EvaluationExtractionDatasetSchemaColumn[]
}): KeyMappingEntry[] {
  // Auto-map by matching names
  return getAgentOutputKeys(agentSettings).map((outputKey) => {
    const matchingColumn = targetColumns.find(
      (column) => column.finalName.toLowerCase() === outputKey.toLowerCase(),
    )
    return {
      agentOutputKey: outputKey,
      datasetColumnId: matchingColumn?.id ?? "",
      mode: "scored" as const,
    }
  })
}

export function RunEvaluationExtractionDialog({
  dataset,
}: {
  dataset: EvaluationExtractionDataset
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlayIcon className="size-4" />
          {t("evaluationExtractionRun:run")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("evaluationExtractionRun:selectAgent")}</DialogTitle>
          <DialogDescription>
            {t("evaluationExtractionRun:selectAgentDescription")}
          </DialogDescription>
        </DialogHeader>

        <RunEvaluationExtractionForm dataset={dataset} onRan={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

function RunEvaluationExtractionForm({
  dataset,
  onRan,
}: {
  dataset: EvaluationExtractionDataset
  onRan: () => void
}) {
  const { t } = useTranslation()
  const agentsData = useValue(selectAgentsData)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)

  const extractionAgents = useMemo(() => {
    return agentsData.filter((agent) => agent.type === "extraction")
  }, [agentsData])

  return (
    <div className="flex flex-col gap-4">
      <AgentSelector
        agents={extractionAgents}
        selectedAgentId={selectedAgentId}
        onAgentChange={setSelectedAgentId}
      />

      {selectedAgentId ? (
        // Remounted on agent change so the run settings are rebuilt from the new agent's schema.
        <AgentRunSettings
          key={selectedAgentId}
          selectedAgentId={selectedAgentId}
          dataset={dataset}
          onRan={onRan}
        />
      ) : (
        <DialogFooter>
          <Button disabled>{t("evaluationExtractionRun:run")}</Button>
        </DialogFooter>
      )}
    </div>
  )
}

/**
 * Gate: the agent settings are fetched per agent, so they can still be loading (or missing)
 * when an agent is picked. Only render the run settings once they are available.
 */
function AgentRunSettings({
  selectedAgentId,
  dataset,
  onRan,
}: {
  selectedAgentId: string | null
  dataset: EvaluationExtractionDataset
  onRan: () => void
}) {
  const { t } = useTranslation()
  const agentSettingsData = useAppSelector(
    selectAgentSettingsDataByAgentId({ agentId: selectedAgentId ?? "", includeDraft: true }),
  )

  if (ADS.isError(agentSettingsData)) {
    return (
      <p className="text-sm text-destructive">
        {t("evaluationExtractionRun:agentSettingsUnavailable")}
      </p>
    )
  }

  if (!ADS.isFulfilled(agentSettingsData)) return <Loader />

  return <AgentRunSettingsForm selectedAgentId={selectedAgentId} dataset={dataset} onRan={onRan} />
}

function AgentRunSettingsForm({
  selectedAgentId,
  dataset,
  onRan,
}: {
  selectedAgentId: string | null
  dataset: EvaluationExtractionDataset
  onRan: () => void
}) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { buildRunPath } = useEvaluationExtractionRunPath()
  const isExecuting = useAppSelector(selectIsExecuting)

  const agentSettings = useValue(
    selectAgentSettingsDataByAgentId({ agentId: selectedAgentId ?? "", includeDraft: true }),
  )

  const targetColumns = useMemo(
    () =>
      Object.values(dataset.schemaMapping)
        .filter((column) => column.role === "target")
        .sort((columnA, columnB) => columnA.index - columnB.index),
    [dataset.schemaMapping],
  )

  const [keyMapping, setKeyMapping] = useState<KeyMappingEntry[]>(() =>
    buildDefaultKeyMapping({ agentSettings, targetColumns }),
  )
  const [recordLimit, setRecordLimit] = useState<number | null>(null)

  const agentOutputKeys = useMemo(() => getAgentOutputKeys(agentSettings), [agentSettings])

  const handleColumnChange = useCallback((agentOutputKey: string, datasetColumnId: string) => {
    setKeyMapping((previous) =>
      previous.map((entry) =>
        entry.agentOutputKey === agentOutputKey ? { ...entry, datasetColumnId } : entry,
      ),
    )
  }, [])

  const handleModeChange = useCallback((agentOutputKey: string, mode: "scored" | "fyi") => {
    setKeyMapping((previous) =>
      previous.map((entry) =>
        entry.agentOutputKey === agentOutputKey ? { ...entry, mode } : entry,
      ),
    )
  }, [])

  const isValid = useMemo(() => {
    if (!selectedAgentId) return false
    if (keyMapping.length === 0) return false
    return keyMapping.every((entry) => entry.mode === "fyi" || entry.datasetColumnId !== "")
  }, [selectedAgentId, keyMapping])

  const handleRun = async () => {
    if (!selectedAgentId || !isValid) return
    const validMapping: EvaluationExtractionRunKeyMappingEntryDto[] = keyMapping.map((entry) => ({
      agentOutputKey: entry.agentOutputKey,
      datasetColumnId: entry.datasetColumnId,
      mode: entry.mode,
    }))

    const result = await dispatch(
      evaluationExtractionRunsActions.createAndExecute({
        evaluationExtractionDatasetId: dataset.id,
        agentId: selectedAgentId,
        keyMapping: validMapping,
        recordLimit,
      }),
    ).unwrap()

    onRan()
    navigate(buildRunPath({ runId: result.id }))
  }

  return (
    <>
      {agentOutputKeys.length > 0 ? (
        <KeyMappingEditor
          agentOutputKeys={agentOutputKeys}
          targetColumns={targetColumns}
          keyMapping={keyMapping}
          onColumnChange={handleColumnChange}
          onModeChange={handleModeChange}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("evaluationExtractionRun:keyMapping.noOutputSchema")}
        </p>
      )}

      <RunScopeField recordCount={dataset.recordCount} onRecordLimitChange={setRecordLimit} />

      <DialogFooter>
        <Button onClick={handleRun} disabled={!isValid || isExecuting}>
          {isExecuting ? t("evaluationExtractionRun:running") : t("evaluationExtractionRun:run")}
        </Button>
      </DialogFooter>
    </>
  )
}

function RunScopeField({
  recordCount,
  onRecordLimitChange,
}: {
  recordCount: number
  onRecordLimitChange: (recordLimit: number | null) => void
}) {
  const [runScope, setRunScope] = useState<"all" | "limited">("all")
  const [limitedCount, setLimitedCount] = useState(1)

  const handleRunScopeChange = (scope: "all" | "limited") => {
    setRunScope(scope)
    onRecordLimitChange(scope === "limited" ? limitedCount : null)
  }

  const handleLimitedCountChange = (value: string) => {
    const parsed = Number.parseInt(value, 10)
    if (Number.isNaN(parsed)) return
    const clampedCount = Math.min(Math.max(1, parsed), recordCount)
    setLimitedCount(clampedCount)
    onRecordLimitChange(clampedCount)
  }

  return (
    <RunScopeSelector
      recordCount={recordCount}
      runScope={runScope}
      limitedCount={limitedCount}
      onRunScopeChange={handleRunScopeChange}
      onLimitedCountChange={handleLimitedCountChange}
    />
  )
}

function AgentSelector({
  agents,
  selectedAgentId,
  onAgentChange,
}: {
  agents: Agent[]
  selectedAgentId: string | null
  onAgentChange: (agentId: string) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-2">
      <Label>{t("evaluationExtractionRun:agent")}</Label>
      <Select value={selectedAgentId ?? undefined} onValueChange={onAgentChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t("evaluationExtractionRun:agentPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {agents.map((agent) => (
            <SelectItem key={agent.id} value={agent.id}>
              {agent.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function KeyMappingEditor({
  agentOutputKeys,
  targetColumns,
  keyMapping,
  onColumnChange,
  onModeChange,
}: {
  agentOutputKeys: string[]
  targetColumns: EvaluationExtractionDatasetSchemaColumn[]
  keyMapping: KeyMappingEntry[]
  onColumnChange: (agentOutputKey: string, datasetColumnId: string) => void
  onModeChange: (agentOutputKey: string, mode: "scored" | "fyi") => void
}) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Label>{t("evaluationExtractionRun:keyMapping.title")}</Label>
        <p className="text-sm text-muted-foreground">
          {t("evaluationExtractionRun:keyMapping.description")}
        </p>
      </div>

      <div className="rounded-lg border">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
          <span>{t("evaluationExtractionRun:keyMapping.agentOutputKey")}</span>
          {<span>{t("evaluationExtractionRun:keyMapping.datasetColumn")}</span>}
          <span>{t("evaluationExtractionRun:keyMapping.mode")}</span>
        </div>
        {agentOutputKeys.map((outputKey) => {
          const entry = keyMapping.find((mappingEntry) => mappingEntry.agentOutputKey === outputKey)
          return (
            <div
              key={outputKey}
              className="grid grid-cols-[1fr_1fr_auto] gap-2 border-t px-3 py-2 items-center"
            >
              <span className="text-sm font-mono">{outputKey}</span>
              {entry?.mode === "fyi" ? (
                <div />
              ) : (
                <Select
                  value={entry?.datasetColumnId || undefined}
                  onValueChange={(value) => onColumnChange(outputKey, value)}
                >
                  <SelectTrigger className="w-full" size="sm">
                    <SelectValue
                      placeholder={t("evaluationExtractionRun:keyMapping.columnPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {targetColumns.map((column) => (
                      <SelectItem key={column.id} value={column.id}>
                        {column.finalName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select
                value={entry?.mode ?? "scored"}
                onValueChange={(value) => onModeChange(outputKey, value as "scored" | "fyi")}
              >
                <SelectTrigger className="w-[100px]" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scored">
                    {t("evaluationExtractionRun:keyMapping.scored")}
                  </SelectItem>
                  <SelectItem value="fyi">{t("evaluationExtractionRun:keyMapping.fyi")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )
        })}
      </div>
    </div>
  )
}
