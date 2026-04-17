import { selectCurrentOrganizationId } from "@/common/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/common/features/projects/projects.selectors"
import { useAppSelector } from "@/common/store/hooks"
import { assert } from "@/common/utils/assert"
import { selectCurrentDatasetId } from "../features/evaluation-extraction-datasets/evaluation-extraction-datasets.selectors"
import { buildEvalPath, EvalRouteNames } from "../routes/helpers"

export function useEvaluationExtractionRunPath() {
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)
  const datasetId = useAppSelector(selectCurrentDatasetId)

  const buildRunPath = ({ runId }: { runId: string }): string => {
    assert(organizationId, "Organization ID is required to build run path")
    assert(projectId, "Project ID is required to build run path")
    assert(datasetId, "Dataset ID is required to build run path")

    return buildEvalPath(
      EvalRouteNames.EVALUATION_RUN.replace(":organizationId", organizationId)
        .replace(":projectId", projectId)
        .replace(":datasetId", datasetId)
        .replace(":runId", runId),
    )
  }

  return { buildRunPath }
}
