import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { Repository } from "typeorm"
import type { OrganizationMembership } from "@/domains/organizations/memberships/organization-membership.entity"
import { organizationMembershipFactory } from "@/domains/organizations/memberships/organization-membership.factory"
import type { Organization } from "@/domains/organizations/organization.entity"
import type { User } from "@/domains/users/user.entity"
import { userFactory } from "@/domains/users/user.factory"
import type { Project } from "../project.entity"
import type { ProjectMembership, ProjectMembershipStatus } from "./project-membership.entity"
import { PLACEHOLDER_AUTH0_ID_PREFIX } from "./project-memberships.service"

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

export const createProjectMembership = async ({
  repositories,
  organization,
  project,
  user,
  role,
}: {
  repositories: {
    userRepository: Repository<User>
    membershipRepository: Repository<OrganizationMembership>
    projectMembershipRepository: Repository<ProjectMembership>
  }
  organization?: Organization
  project: Project
  user?: Partial<User>
  role?: "owner" | "member" | "admin"
}) => {
  user = user ?? {
    email: "invited@example.com",
    name: "Invited User",
    auth0Id: `${PLACEHOLDER_AUTH0_ID_PREFIX}-test`,
  }
  const invitedUser = userFactory.build(user)
  await repositories.userRepository.save(invitedUser)

  if (organization) {
    await repositories.membershipRepository.save(
      role
        ? organizationMembershipFactory
            .transient({ user: invitedUser, organization })
            .build({ role })
        : organizationMembershipFactory.transient({ user: invitedUser, organization }).build(),
    )
  }

  const membership = projectMembershipFactory.transient({ project, user: invitedUser }).build()
  await repositories.projectMembershipRepository.save(membership)

  return { membership, invitedUser }
}
