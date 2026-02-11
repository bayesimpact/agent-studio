import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { User } from "@/domains/users/user.entity"
import type { Project } from "../project.entity"
import type { ProjectMembership, ProjectMembershipStatus } from "./project-membership.entity"

type ProjectMembershipTransientParams = {
  project: Project
  user: User
}

export const projectMembershipFactory = Factory.define<
  ProjectMembership,
  ProjectMembershipTransientParams
>(({ params, transientParams }) => {
  if (!transientParams.project) {
    throw new Error("project transient is required")
  }
  if (!transientParams.user) {
    throw new Error("user transient is required")
  }

  const now = new Date()
  return {
    id: params.id || randomUUID(),
    projectId: transientParams.project.id,
    userId: transientParams.user.id,
    invitationToken: params.invitationToken || randomUUID(),
    status: (params.status || "sent") as ProjectMembershipStatus,
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
    project: transientParams.project,
    user: transientParams.user,
  } satisfies ProjectMembership
})
