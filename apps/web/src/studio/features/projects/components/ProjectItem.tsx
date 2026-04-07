import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import type { Project } from "@/features/projects/projects.models"
import { GridItem } from "@/studio/components/grid/Grid"
import { useBuildStudioPath } from "@/studio/hooks/use-studio-build-path"
import { buildSince } from "@/utils/build-date"

export function ProjectItem({
  project,
  organizationId,
  index,
}: {
  index: number
  project: Project
  organizationId: string
}) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { buildStudioPath } = useBuildStudioPath()
  const handleClick = () => {
    const path = buildStudioPath("project", { organizationId, projectId: project.id })
    navigate(path)
  }
  const description = buildSince(project.updatedAt) // FIXME: show number of agents instead of last updated time

  // TODO: footer show agent icons based on type
  return (
    <GridItem
      index={index}
      badge={t("project:project")}
      onClick={handleClick}
      title={project.name}
      description={description}
    />
  )
}
