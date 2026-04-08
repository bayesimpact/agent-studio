import { ProjectPolicy } from "@/domains/projects/project.policy"

export class ProjectsAnalyticsPolicy extends ProjectPolicy {
  /**
   * Analytics are sensitive: only project `admin` and `owner` roles can access.
   */
  canList(): boolean {
    return this.canAccessProject() && this.isProjectAdminOrOwner()
  }
}
