import type { BaseAgentSessionTypeDto } from "@caseai-connect/api-contracts"
import type { MembershipRole } from "@/domains/organizations/memberships/organization-membership.entity"
import { organizationMembershipFactory } from "@/domains/organizations/memberships/organization-membership.factory"
import { organizationFactory } from "@/domains/organizations/organization.factory"
import { projectMembershipFactory } from "@/domains/projects/memberships/project-membership.factory"
import { projectFactory } from "@/domains/projects/project.factory"
import { userFactory } from "@/domains/users/user.factory"
import { BaseAgentSessionPolicy } from "./base-agent-session.policy"

type ProjectMembershipState = "sameProject" | "differentProject" | "noProjectMembership"

describe("BaseAgentSessionPolicy", () => {
  const organization = organizationFactory.build()
  const user = userFactory.build()

  const project = projectFactory.transient({ organization }).build()
  const otherProject = projectFactory.transient({ organization }).build()

  const buildOrganizationMembership = (role: MembershipRole) => {
    return organizationMembershipFactory.transient({ user, organization }).params({ role }).build()
  }

  const buildProjectMembership = (projectMembershipState: ProjectMembershipState) => {
    if (projectMembershipState === "sameProject") {
      return projectMembershipFactory.transient({ project, user }).build()
    }
    if (projectMembershipState === "differentProject") {
      return projectMembershipFactory.transient({ project: otherProject, user }).build()
    }
    return undefined
  }

  const buildPolicy = (
    role: MembershipRole,
    projectMembershipState: ProjectMembershipState,
    type: BaseAgentSessionTypeDto,
  ) => {
    return new BaseAgentSessionPolicy(
      {
        organizationMembership: buildOrganizationMembership(role),
        projectMembership: buildProjectMembership(projectMembershipState),
        project,
      },
      type,
    )
  }

  describe('type: "live"', () => {
    const type = "live"
    describe("canList", () => {
      it("should return true for owner", () => {
        const policy = buildPolicy("owner", "noProjectMembership", type)
        expect(policy.canList()).toBe(true)
      })

      it("should return true for admin", () => {
        const policy = buildPolicy("admin", "noProjectMembership", type)
        expect(policy.canList()).toBe(true)
      })

      it("should return true for member of the same project", () => {
        const policy = buildPolicy("member", "sameProject", type)
        expect(policy.canList()).toBe(true)
      })

      it("should return false for member without project membership", () => {
        const policy = buildPolicy("member", "noProjectMembership", type)
        expect(policy.canList()).toBe(false)
      })

      it("should return false for member of another project", () => {
        const policy = buildPolicy("member", "differentProject", type)
        expect(policy.canList()).toBe(false)
      })
    })

    describe("canCreate", () => {
      it("should return true for owner", () => {
        const policy = buildPolicy("owner", "noProjectMembership", type)
        expect(policy.canCreate()).toBe(true)
      })

      it("should return true for admin", () => {
        const policy = buildPolicy("admin", "noProjectMembership", type)
        expect(policy.canCreate()).toBe(true)
      })

      it("should return true for member of the same project", () => {
        const policy = buildPolicy("member", "sameProject", type)
        expect(policy.canCreate()).toBe(true)
      })

      it("should return false for member without project membership", () => {
        const policy = buildPolicy("member", "noProjectMembership", type)
        expect(policy.canCreate()).toBe(false)
      })

      it("should return false for member of another project", () => {
        const policy = buildPolicy("member", "differentProject", type)
        expect(policy.canCreate()).toBe(false)
      })
    })
  })
  describe('type: "playground"', () => {
    const type = "playground"
    describe("canList", () => {
      it("should return true for owner", () => {
        const policy = buildPolicy("owner", "noProjectMembership", type)
        expect(policy.canList()).toBe(true)
      })

      it("should return true for admin", () => {
        const policy = buildPolicy("admin", "noProjectMembership", type)
        expect(policy.canList()).toBe(true)
      })

      it("should return false for member of the same project", () => {
        const policy = buildPolicy("member", "sameProject", type)
        expect(policy.canList()).toBe(false)
      })

      it("should return false for member without project membership", () => {
        const policy = buildPolicy("member", "noProjectMembership", type)
        expect(policy.canList()).toBe(false)
      })

      it("should return false for member of another project", () => {
        const policy = buildPolicy("member", "differentProject", type)
        expect(policy.canList()).toBe(false)
      })
    })

    describe("canCreate", () => {
      it("should return true for owner", () => {
        const policy = buildPolicy("owner", "noProjectMembership", type)
        expect(policy.canCreate()).toBe(true)
      })

      it("should return true for admin", () => {
        const policy = buildPolicy("admin", "noProjectMembership", type)
        expect(policy.canCreate()).toBe(true)
      })

      it("should return false for member of the same project", () => {
        const policy = buildPolicy("member", "sameProject", type)
        expect(policy.canCreate()).toBe(false)
      })

      it("should return false for member without project membership", () => {
        const policy = buildPolicy("member", "noProjectMembership", type)
        expect(policy.canCreate()).toBe(false)
      })

      it("should return false for member of another project", () => {
        const policy = buildPolicy("member", "differentProject", type)
        expect(policy.canCreate()).toBe(false)
      })
    })
  })
})
