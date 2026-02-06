import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import { EmptyResources } from "@/components/resources/EmptyResources"
import { UploadResourceButton } from "@/components/resources/UploadResourceButton"
import type { Project } from "@/features/projects/projects.models"
import { selectCurrentProjectId, selectProjectData } from "@/features/projects/projects.selectors"
import type { Resource } from "@/features/resources/resources.models"
import { selectResourcesFromProjectId } from "@/features/resources/resources.selectors"
import { useAbility } from "@/hooks/use-ability"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { ResourceItem } from "../../components/resources/ResourceItem"
import { LoadingRoute } from "../LoadingRoute"
import { NotFoundRoute } from "../NotFoundRoute"

export function ResourcesRoute() {
  const projectId = useAppSelector(selectCurrentProjectId)
  const project = useAppSelector(selectProjectData)
  const resourcesData = useAppSelector(selectResourcesFromProjectId(projectId))
  if (!projectId) return <NotFoundRoute />

  if (ADS.isError(resourcesData) || ADS.isError(project)) return <NotFoundRoute />

  if (ADS.isFulfilled(resourcesData) && ADS.isFulfilled(project))
    return <WithData project={project.value} resources={resourcesData.value} />

  return <LoadingRoute />
}

function WithData({ resources, project }: { resources: Resource[]; project: Project }) {
  useHandleHeader({ project })
  return (
    <div className="p-6 grid grid-cols-1 gap-4">
      {resources.length === 0 ? (
        <EmptyResources project={project} />
      ) : (
        resources.map((resource) => <ResourceItem key={resource.id} resource={resource} />)
      )}
    </div>
  )
}

function useHandleHeader({ project }: { project: Project }) {
  const { t } = useTranslation("resources", { keyPrefix: "header" })
  const { isAdminInterface } = useAbility()
  const { setHeaderTitle, setHeaderRightSlot } = useSidebarLayout()
  const headerTitle = t("title", { projectName: project.name })

  useEffect(() => {
    setHeaderTitle(headerTitle)
    if (isAdminInterface)
      setHeaderRightSlot(
        <UploadResourceButton organizationId={project.organizationId} project={project} />,
      )
    return () => {
      setHeaderTitle("")
      setHeaderRightSlot(undefined)
    }
  }, [headerTitle, setHeaderTitle, setHeaderRightSlot, isAdminInterface, project])
}
