import { Button } from "@caseai-connect/ui/shad/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@caseai-connect/ui/shad/item"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { buildDate, buildSince } from "@/common/utils/build-date"
import type { Project } from "@/features/projects/projects.models"
import { useBuildPath } from "@/hooks/use-build-path"
import { GridItem } from "@/studio/components/grid/Grid"

export function ProjectItem({
  project,
  organizationId,
}: {
  project: Project
  organizationId: string
}) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { buildPath } = useBuildPath()
  const handleClick = () => {
    const path = buildPath("project", { organizationId, projectId: project.id })
    navigate(path)
  }
  return (
    <Item variant="outline" className="min-w-96 w-fit">
      <ItemContent>
        <ItemTitle>{project.name}</ItemTitle>
        <ItemDescription>{buildDate(project.updatedAt)}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button onClick={handleClick}>{t("actions:open")}</Button>
      </ItemActions>
    </Item>
  )
}

export function ProjectItem2({
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
  const { buildPath } = useBuildPath()
  const handleClick = () => {
    const path = buildPath("project", { organizationId, projectId: project.id })
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
