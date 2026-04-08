import { ProjectPolicy } from "@/domains/projects/project.policy"

export class ProjectsAnalyticsPolicy extends ProjectPolicy {
  /**
   * Analytics are sensitive: only `admin` role can access.
   * `owner` is explicitly not allowed.
   */
  canList(): boolean {
    return this.canAccessProject() && this.isProjectAdminOrOwner()
  }
}
