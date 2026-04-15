import { selectCurrentOrganizationId } from "@/common/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/common/features/projects/projects.selectors"
import { useAppSelector } from "@/common/store/hooks"
import { assert } from "@/common/utils/assert"
import { buildEvalPath, EvalRouteNames } from "../routes/helpers"

export function useExtractionPath() {
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)

  const buildExtractionPath = (): string => {
    assert(organizationId, "Organization ID is required to build extraction path")
    assert(projectId, "Project ID is required to build extraction path")

    return buildEvalPath(
      EvalRouteNames.EXTRACTION.replace(":organizationId", organizationId).replace(
        ":projectId",
        projectId,
      ),
    )
  }

  return { buildExtractionPath }
}
