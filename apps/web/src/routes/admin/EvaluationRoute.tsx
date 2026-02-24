import { Button } from "@caseai-connect/ui/shad/button"
import { Item, ItemContent, ItemFooter, ItemHeader, ItemTitle } from "@caseai-connect/ui/shad/item"
import { Label } from "@caseai-connect/ui/shad/label"
import { isEqual } from "date-fns"
import { PenLineIcon, Trash2Icon } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import type z from "zod"
import { EmptyEvaluation } from "@/components/evaluation/EmptyEvaluation"
import { EvaluationCreator } from "@/components/evaluation/EvaluationCreator"
import { EvaluationRunner } from "@/components/evaluation/EvaluationRunner"
import { EvaluationsTable } from "@/components/evaluation/table/EvaluationsTable"
import type { schema } from "@/components/evaluation/table/schema"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import type { Agent } from "@/features/agents/agents.models"
import { selectAgentsFromProjectId } from "@/features/agents/agents.selectors"
import type { Evaluation } from "@/features/evaluations/evaluations.models"
import { selectCurrentEvaluationsData } from "@/features/evaluations/evaluations.selectors"
import { createEvaluation, deleteEvaluation } from "@/features/evaluations/evaluations.thunks"
import {
  selectCurrentProjectData,
  selectCurrentProjectId,
} from "@/features/projects/projects.selectors"
import { ADS } from "@/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { buildDate } from "@/utils/build-date"
import { ErrorRoute } from "../ErrorRoute"
import { LoadingRoute } from "../LoadingRoute"

export function EvaluationRoute() {
  const projectId = useAppSelector(selectCurrentProjectId)
  const project = useAppSelector(selectCurrentProjectData)
  const evaluations = useAppSelector(selectCurrentEvaluationsData)
  const agents = useAppSelector(selectAgentsFromProjectId(project.value?.id))
  if (!projectId) return <ErrorRoute error="Missing valid project ID" />

  if (ADS.isError(evaluations) || ADS.isError(project) || ADS.isError(agents))
    return (
      <ErrorRoute error={evaluations.error || project.error || agents.error || "Unknown error"} />
    )

  if (ADS.isFulfilled(evaluations) && ADS.isFulfilled(project) && ADS.isFulfilled(agents))
    return <WithData agents={agents.value} evaluations={evaluations.value} />

  return <LoadingRoute />
}

function WithData({ agents, evaluations }: { agents: Agent[]; evaluations: Evaluation[] }) {
  useHandleHeader({ evaluations, agents })
  return (
    <>
      {evaluations.length === 0 ? (
        <EmptyEvaluation />
      ) : (
        <div className="p-6 grid xl:grid-cols-2 gap-4">
          {evaluations.map((evaluation) => (
            <EvaluationItem key={evaluation.id} evaluation={evaluation} agents={agents} />
          ))}
        </div>
      )}
    </>
  )
}

function useHandleHeader({ evaluations, agents }: { evaluations: Evaluation[]; agents: Agent[] }) {
  const dispatch = useAppDispatch()
  const { t } = useTranslation("evaluation")
  const [idsToRun, setIdsToRun] = useState<string[]>([])
  const { setHeaderRightSlot } = useSidebarLayout()
  const handleCreate = useCallback(
    (fields: Pick<Evaluation, "input" | "expectedOutput">) => {
      dispatch(createEvaluation({ fields }))
    },
    [dispatch],
  )

  const header = (
    <>
      <EvaluationCreator onSubmit={handleCreate} />
      <Button
        variant="default"
        disabled={evaluations.length === 0}
        onClick={() => setIdsToRun(evaluations.map((e) => e.id))}
      >
        {t("table.buttons.runAll")}
      </Button>
      <EvaluationRunner
        ids={idsToRun}
        agents={agents}
        modalHandler={{
          open: idsToRun.length > 0,
          setOpen: (open) => {
            if (!open) setIdsToRun([])
          },
        }}
      />
    </>
  )

  useEffect(() => {
    setHeaderRightSlot(header)
    return () => {
      setHeaderRightSlot(undefined)
    }
  }, [setHeaderRightSlot, header])
}

function EvaluationItem({ evaluation, agents }: { evaluation: Evaluation; agents: Agent[] }) {
  const { t } = useTranslation("evaluation")
  const { t: tcommon } = useTranslation("common")
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)
  const handleDelete = () => {
    dispatch(deleteEvaluation({ evaluationId: evaluation.id }))
  }
  const handleEdit = () => {
    // TODO: open edit modal
    console.warn("AJ: edit", evaluation.id)
  }
  const handleRun = () => {
    setOpen(true)
  }

  const data = [] satisfies z.infer<typeof schema>[]
  return (
    <Item variant="outline">
      <ItemHeader>
        <ItemTitle>
          <div className="flex gap-4 text-muted-foreground text-xs">
            <div className="flex gap-1">
              <span>
                {tcommon("createdAt")} {buildDate(evaluation.createdAt)}
              </span>
            </div>
            {!isEqual(evaluation.createdAt, evaluation.updatedAt) && (
              <div className="flex gap-1">
                <span>
                  {tcommon("updatedAt")} {buildDate(evaluation.updatedAt)}
                </span>
              </div>
            )}
          </div>
        </ItemTitle>

        <div className="flex gap-2 items-center">
          <Button onClick={handleRun}>{t("table.buttons.run")}</Button>
          <EvaluationRunner
            ids={[evaluation.id]}
            agents={agents}
            modalHandler={{ open, setOpen }}
          />
          <Button variant="ghost" size="icon" onClick={handleEdit}>
            <PenLineIcon className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDelete}>
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </ItemHeader>

      <ItemContent className="gap-4">
        <div className="flex flex-col gap-1">
          <Label className="font-semibold">{t("form.labelInput")}</Label>
          <p className="text-muted-foreground">{evaluation.input}</p>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="font-semibold">{t("form.labelExpectedOutput")}</Label>
          <p className="text-muted-foreground">{evaluation.expectedOutput}</p>
        </div>
      </ItemContent>

      <ItemFooter>
        <EvaluationsTable key={data.length} data={data} />
      </ItemFooter>
    </Item>
  )
}
