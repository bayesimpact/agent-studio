import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@caseai-connect/ui/shad/sidebar"
import {
  BarChart3Icon,
  CloudAlertIcon,
  DatabaseZapIcon,
  ListChecksIcon,
  Loader2Icon,
  UsersIcon,
} from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router-dom"
import { RestrictedFeature } from "@/common/components/RestrictedFeature"
import type { Project } from "@/common/features/projects/projects.models"
import { useAppSelector } from "@/common/store/hooks"
import { selectUploaderState } from "../features/documents/documents.selectors"
import {
  buildAnalyticsPath,
  buildDocumentsPath,
  buildEvaluationPath,
  buildProjectMembershipsPath,
} from "./helpers"

export function SidebarFooterChildren({ project }: { project: Project }) {
  const { t } = useTranslation()
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex-col items-start mb-3">
        <span className="font-bold text-sm">{project.name}</span>
        <span className="uppercase">{t("project:settings")}</span>
      </SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu>
          <RestrictedFeature feature="evaluation">
            <NavEvaluation organizationId={project.organizationId} projectId={project.id} />
          </RestrictedFeature>

          <NavDocuments organizationId={project.organizationId} projectId={project.id} />

          <RestrictedFeature feature="project-analytics">
            <NavAnalytics organizationId={project.organizationId} projectId={project.id} />
          </RestrictedFeature>

          <NavProjectMemberships organizationId={project.organizationId} projectId={project.id} />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function NavProjectMemberships({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) {
  const { t } = useTranslation()
  const isActive = useIsProjectMembershipsActive(projectId)
  const path = buildProjectMembershipsPath({ organizationId, projectId })
  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={isActive} asChild>
        <Link to={path}>
          <UsersIcon />
          <span>{t("projectMembership:members")}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function useIsProjectMembershipsActive(projectId: string) {
  const location = useLocation()
  return useMemo(() => location.pathname.endsWith(`/p/${projectId}/members`), [location, projectId])
}

function NavAnalytics({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) {
  const { t } = useTranslation("analytics")
  const isActive = useIsAnalyticsActive(projectId)
  const path = buildAnalyticsPath({ organizationId, projectId })
  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={isActive} asChild>
        <Link to={path}>
          <BarChart3Icon className="size-4" />
          <span className="capitalize-first">{t("analytics")}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function useIsAnalyticsActive(projectId: string) {
  const location = useLocation()
  return useMemo(
    () => location.pathname.endsWith(`/p/${projectId}/analytics`),
    [location.pathname, projectId],
  )
}

function NavDocuments({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) {
  const { t } = useTranslation()
  const isActive = useIsDocumentsActive(projectId)

  const path = buildDocumentsPath({ organizationId, projectId })
  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={isActive} asChild>
        <Link to={path}>
          <div className="flex flex-1 gap-2 items-center">
            <DatabaseZapIcon className="size-4" />
            <span className="capitalize-first">{t("document:documents")}</span>
          </div>
          <UploaderState />
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function UploaderState() {
  const uploaderState = useAppSelector(selectUploaderState)
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm">
      {uploaderState.status === "uploading" && (
        <>
          <Loader2Icon className="animate-spin size-4" />
          <span className="text-xs text-muted-foreground">
            {uploaderState.processed}/{uploaderState.total}
          </span>
        </>
      )}

      {uploaderState.errors && uploaderState.errors.length > 0 && (
        <CloudAlertIcon className="text-destructive size-5 animate-pulse" />
      )}
    </div>
  )
}

function useIsDocumentsActive(projectId: string) {
  const location = useLocation()
  return useMemo(() => location.pathname.endsWith(`/p/${projectId}/d`), [location, projectId])
}

export function NavEvaluation({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) {
  const { t } = useTranslation()
  const isActive = useIsEvaluationActive(projectId)
  const path = buildEvaluationPath({ organizationId, projectId })
  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={isActive} asChild>
        <Link to={path}>
          <ListChecksIcon />
          <span>{t("evaluation:evaluations")}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function useIsEvaluationActive(projectId: string) {
  const location = useLocation()
  return useMemo(() => location.pathname.endsWith(`/p/${projectId}/eval`), [location, projectId])
}
