import { organizationFactory } from "@/domains/organizations/organization.factory"
import type { MembershipRole } from "@/domains/organizations/user-membership.entity"
import { userMembershipFactory } from "@/domains/organizations/user-membership.factory"
import { userFactory } from "@/domains/users/user.factory"
import { projectFactory } from "./project.factory"
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

  const buildUserMembership = (role: MembershipRole) => {
    return userMembershipFactory.transient({ user, organization }).params({ role }).build()
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

  describe("canList", () => {
    it("should return true when user is owner", () => {
      const policy = new ProjectMembershipPolicy(buildUserMembership("owner"), project)
      expect(policy.canList()).toBe(true)
    })

    it("should return true when user is admin", () => {
      const policy = new ProjectMembershipPolicy(buildUserMembership("admin"), project)
      expect(policy.canList()).toBe(true)
    })

    it("should return false when user is member", () => {
      const policy = new ProjectMembershipPolicy(buildUserMembership("member"), project)
      expect(policy.canList()).toBe(false)
    })
  })

  describe("canCreate", () => {
    it("should return true when user is owner", () => {
      const policy = new ProjectMembershipPolicy(buildUserMembership("owner"), project)
      expect(policy.canCreate()).toBe(true)
    })

    it("should return true when user is admin", () => {
      const policy = new ProjectMembershipPolicy(buildUserMembership("admin"), project)
      expect(policy.canCreate()).toBe(true)
    })

    it("should return false when user is member", () => {
      const policy = new ProjectMembershipPolicy(buildUserMembership("member"), project)
      expect(policy.canCreate()).toBe(false)
    })
  })

  describe("canDelete", () => {
    describe.each<[MembershipRole, MembershipState, boolean]>([
      ["owner", "sameProject", true],
      ["owner", "differentProject", false],
      ["owner", "noMembership", false],
      ["admin", "sameProject", true],
      ["admin", "differentProject", false],
      ["admin", "noMembership", false],
      ["member", "sameProject", false],
      ["member", "differentProject", false],
      ["member", "noMembership", false],
    ])("when user is %s with %s membership", (role, membershipState, expected) => {
      it(`should return ${expected}`, () => {
        const policy = new ProjectMembershipPolicy(
          buildUserMembership(role),
          project,
          buildMembership(membershipState),
        )
        expect(policy.canDelete()).toBe(expected)
      })
    })
  })
})
