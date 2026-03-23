import type { OrganizationMembershipRole } from "@/domains/organizations/memberships/organization-membership.entity"
import { organizationMembershipFactory } from "@/domains/organizations/memberships/organization-membership.factory"
import { organizationFactory } from "@/domains/organizations/organization.factory"
import { userFactory } from "@/domains/users/user.factory"
import type { Project } from "../project.entity"
import { projectFactory } from "../project.factory"
import { projectMembershipFactory } from "./project-membership.factory"
import { ProjectMembershipPolicy } from "./project-membership.policy"

type MembershipState = "sameProject" | "differentProject" | "noMembership"

describe("ProjectMembershipPolicy", () => {
  const organization = organizationFactory.build()
  const otherOrganization = organizationFactory.build()
  const user = userFactory.build()
  const invitedUser = userFactory.build()

  const project = projectFactory.transient({ organization }).build()
  const otherProject = projectFactory.transient({ organization: otherOrganization }).build()

  const buildOrganizationMembership = (role: OrganizationMembershipRole) => {
    return organizationMembershipFactory.transient({ user, organization }).params({ role }).build()
  }

  const buildMembership = (membershipState: MembershipState) => {
    if (membershipState === "sameProject") {
      return projectMembershipFactory.transient({ project, user: invitedUser }).build()
    }
    if (membershipState === "differentProject") {
      return projectMembershipFactory
        .transient({ project: otherProject, user: invitedUser })
        .build()
    }
    return undefined
  }

  const buildPolicyContext = (
    role: OrganizationMembershipRole,
    project: Project,
    membershipState?: MembershipState,
  ) => {
    return {
      organizationMembership: buildOrganizationMembership(role),
      projectMembership: membershipState ? buildMembership(membershipState) : undefined,
      project: project,
    }
  }

  describe("canList", () => {
    it("should return true when user is owner", () => {
      const policy = new ProjectMembershipPolicy(buildPolicyContext("owner", project))
      expect(policy.canList()).toBe(true)
    })

    it("should return true when user is admin", () => {
      const policy = new ProjectMembershipPolicy(buildPolicyContext("admin", project))
      expect(policy.canList()).toBe(true)
    })

    it("should return false when user is member", () => {
      const policy = new ProjectMembershipPolicy(buildPolicyContext("member", project))
      expect(policy.canList()).toBe(false)
    })

    it("should return false when user is member of the project", () => {
      const policy = new ProjectMembershipPolicy(
        buildPolicyContext("member", project, "sameProject"),
      )
      expect(policy.canList()).toBe(false)
    })
  })

  describe("canCreate", () => {
    it("should return true when user is owner", () => {
      const policy = new ProjectMembershipPolicy(buildPolicyContext("owner", project))
      expect(policy.canCreate()).toBe(true)
    })

    it("should return true when user is admin", () => {
      const policy = new ProjectMembershipPolicy(buildPolicyContext("admin", project))
      expect(policy.canCreate()).toBe(true)
    })

    it("should return false when user is member", () => {
      const policy = new ProjectMembershipPolicy(buildPolicyContext("member", project))
      expect(policy.canCreate()).toBe(false)
    })

    it("should return false when user is member of the project", () => {
      const policy = new ProjectMembershipPolicy(
        buildPolicyContext("member", project, "sameProject"),
      )
      expect(policy.canCreate()).toBe(false)
    })
  })

  describe("canDelete", () => {
    it("should return true when user is owner", () => {
      const policy = new ProjectMembershipPolicy(buildPolicyContext("owner", project))
      expect(policy.canDelete()).toBe(true)
    })

    it("should return true when user is admin", () => {
      const policy = new ProjectMembershipPolicy(buildPolicyContext("admin", project))
      expect(policy.canDelete()).toBe(true)
    })

    it("should return false when user is member", () => {
      const policy = new ProjectMembershipPolicy(buildPolicyContext("member", project))
      expect(policy.canDelete()).toBe(false)
    })

    it("should return false when user is member of the project", () => {
      const policy = new ProjectMembershipPolicy(
        buildPolicyContext("member", project, "sameProject"),
      )
      expect(policy.canDelete()).toBe(false)
    })
  })
})
