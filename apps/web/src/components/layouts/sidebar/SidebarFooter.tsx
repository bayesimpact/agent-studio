import { RestrictedFeature } from "@/components/RestrictedFeature"
import { NavDocuments } from "@/components/sidebar/nav/NavDocuments"
import { NavEvaluation } from "@/components/sidebar/nav/NavEvaluation"
import { NavProjectMemberships } from "@/components/sidebar/nav/NavProjectMemberships"
import type { Project } from "@/features/projects/projects.models"

export function SidebarFooter({ project }: { project: Project }) {
  return (
    <>
      <RestrictedFeature feature="evaluation">
        <NavEvaluation organizationId={project.organizationId} projectId={project.id} />
      </RestrictedFeature>
      <NavDocuments organizationId={project.organizationId} projectId={project.id} />
      <NavProjectMemberships organizationId={project.organizationId} projectId={project.id} />
    </>
  )
}
