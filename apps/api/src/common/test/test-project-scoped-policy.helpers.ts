import type { OrganizationMembershipRole } from "@/domains/organizations/memberships/organization-membership.entity"
import { organizationMembershipFactory } from "@/domains/organizations/memberships/organization-membership.factory"
import type { Organization } from "@/domains/organizations/organization.entity"
import { organizationFactory } from "@/domains/organizations/organization.factory"
import type { ProjectMembershipRole } from "@/domains/projects/memberships/project-membership.entity"
import { projectMembershipFactory } from "@/domains/projects/memberships/project-membership.factory"
import type { Project } from "@/domains/projects/project.entity"
import { projectFactory } from "@/domains/projects/project.factory"
import { userFactory } from "@/domains/users/user.factory"

export type ResourceState = "sameOrganization" | "differentOrganization" | "noResource"

export function testPolicyScopedByProject<Policy, ResourceEntity>({
  buildResource,
  ResourcePolicy,
}: {
  buildResource: ({
    organization,
    project,
  }: {
    organization: Organization
    project: Project
  }) => ResourceEntity
  ResourcePolicy: new (
    // biome-ignore lint/suspicious/noExplicitAny: test prupose
    ...args: any[]
  ) => Policy
}) {
  const organization = organizationFactory.build()
  const otherOrganization = organizationFactory.build()
  const user = userFactory.build()

  const buildOrganizationMembership = (role: OrganizationMembershipRole) => {
    return organizationMembershipFactory.transient({ user, organization }).params({ role }).build()
  }

  const buildProjectMembership = ({
    role,
    project,
  }: {
    role: ProjectMembershipRole
    project: Project
  }) => {
    return projectMembershipFactory.transient({ user, project }).params({ role }).build()
  }

  const buildProject = (resourceState: ResourceState): Project => {
    if (resourceState === "differentOrganization") {
      return projectFactory.transient({ organization: otherOrganization }).build()
    }
    return projectFactory.transient({ organization }).build()
  }

  const buildPolicy = ({
    projectRole,
    resourceState,
    options,
  }: {
    projectRole?: ProjectMembershipRole
    resourceState: ResourceState
    options?: ConstructorParameters<typeof ResourcePolicy>[2]
  }) => {
    const project = buildProject(resourceState)

    const resource =
      resourceState === "noResource" ? undefined : buildResource({ organization, project })

    const projectMembership = projectRole
      ? buildProjectMembership({ role: projectRole, project })
      : undefined

    const organizationMembership = buildOrganizationMembership("member")

    return new ResourcePolicy(
      { organizationMembership, projectMembership, project },
      resource,
      options,
    )
  }

  return { buildPolicy }
}
