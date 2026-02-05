import { Uploader } from "@/components/FileUploader"
import { selectCurrentOrganizationId } from "@/features/organizations/organizations.selectors"
import { selectCurrentProjectId } from "@/features/projects/projects.selectors"
import { uploadResource } from "@/features/resources/resources.thunks"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { NotFoundRoute } from "../NotFoundRoute"

export function ResourcesRoute() {
  const dispatch = useAppDispatch()
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const projectId = useAppSelector(selectCurrentProjectId)
  if (!organizationId || !projectId) return <NotFoundRoute />

  const onSuccess = (params: { projectId: string; resourceId: string }) => {
    console.warn("AJ: onSuccess", params)
  }
  const handleProcessFile = async ({ file }: { file: File }) => {
    dispatch(uploadResource({ organizationId, projectId, file, onSuccess }))
  }
  return (
    <div>
      list resources here
      <Uploader
        organizationId={organizationId}
        projectId={projectId}
        processFile={handleProcessFile}
      />
    </div>
  )
}
