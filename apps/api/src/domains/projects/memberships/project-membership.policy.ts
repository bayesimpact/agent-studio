import { ProjectScopedPolicy } from "@/common/policies/project-scoped-policy"
import type { ProjectMembership } from "./project-membership.entity"

export class ProjectMembershipPolicy extends ProjectScopedPolicy<ProjectMembership> {
  // the default project-scoped policy is enough
}
