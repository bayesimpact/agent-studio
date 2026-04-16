import { selectCurrentOrganizationId } from "@/common/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/common/features/projects/projects.selectors"
import { useAppSelector } from "@/common/store/hooks"
import { assert } from "@/common/utils/assert"
import { buildEvalPath, EvalRouteNames } from "../routes/helpers"

export function useEvaluationExtractionDatasetPath() {
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)

  const buildEvaluationExtractionDatasetPath = ({ datasetId }: { datasetId: string }): string => {
    assert(organizationId, "Organization ID is required to build dataset path")
    assert(projectId, "Project ID is required to build dataset path")

    return buildEvalPath(
      EvalRouteNames.EXTRACTION_DATASET.replace(":organizationId", organizationId)
        .replace(":projectId", projectId)
        .replace(":datasetId", datasetId),
    )
  }

  return { buildEvaluationExtractionDatasetPath }
}
