import { organizationFactory } from "@/organizations/organization.factory"
import type { MembershipRole } from "@/organizations/user-membership.entity"
import { userMembershipFactory } from "@/organizations/user-membership.factory"
import { userFactory } from "@/users/user.factory"
import { projectFactory } from "./project.factory"
import { ProjectPolicy } from "./project.policy"

type Project = ReturnType<typeof projectFactory.build>

describe("ProjectPolicy", () => {
  const organization = organizationFactory.build()
  const otherOrganization = organizationFactory.build()
  const user = userFactory.build()

  const buildUserMembership = (role: MembershipRole) => {
    return userMembershipFactory.transient({ user, organization }).params({ role }).build()
  }

  const buildProject = (projectOrganization: typeof organization) => {
    return projectFactory.transient({ organization: projectOrganization }).build()
  }

  const buildResource = (
    resourceState: "matching" | "nonMatching" | "undefined",
  ): Project | undefined => {
    if (resourceState === "matching") {
      return buildProject(organization)
    }
    if (resourceState === "nonMatching") {
      return buildProject(otherOrganization)
    }
    return undefined
  }

  describe("canList", () => {
    describe.each<[MembershipRole, "matching" | "nonMatching" | "undefined"]>([
      ["owner", "matching"],
      ["owner", "nonMatching"],
      ["owner", "undefined"],
      ["admin", "matching"],
      ["admin", "nonMatching"],
      ["admin", "undefined"],
      ["member", "matching"],
      ["member", "nonMatching"],
      ["member", "undefined"],
    ])("when user is %s with %s resource", (role, resourceState) => {
      it("should always return true", () => {
        const policy = new ProjectPolicy(buildUserMembership(role), buildResource(resourceState))

        expect(policy.canList()).toBe(true)
      })
    })
  })

  describe("canCreate", () => {
    it("should return true when user is owner", () => {
      const policy = new ProjectPolicy(buildUserMembership("owner"))
      expect(policy.canCreate()).toBe(true)
    })

    it("should return true when user is admin", () => {
      const policy = new ProjectPolicy(buildUserMembership("admin"))
      expect(policy.canCreate()).toBe(true)
    })

    it("should return false when user is member", () => {
      const policy = new ProjectPolicy(buildUserMembership("member"))
      expect(policy.canCreate()).toBe(false)
    })
  })

  describe("canUpdate", () => {
    describe.each<[MembershipRole, "matching" | "nonMatching" | "undefined", boolean]>([
      ["owner", "matching", true],
      ["owner", "nonMatching", false],
      ["owner", "undefined", false],
      ["admin", "matching", true],
      ["admin", "nonMatching", false],
      ["admin", "undefined", false],
      ["member", "matching", false],
      ["member", "nonMatching", false],
      ["member", "undefined", false],
    ])("when user is %s with %s resource", (role, resourceState, expected) => {
      it(`should return ${expected}`, () => {
        const policy = new ProjectPolicy(buildUserMembership(role), buildResource(resourceState))

        expect(policy.canUpdate()).toBe(expected)
      })
    })
  })

  describe("canDelete", () => {
    describe.each<[MembershipRole, "matching" | "nonMatching" | "undefined", boolean]>([
      ["owner", "matching", true],
      ["owner", "nonMatching", false],
      ["owner", "undefined", false],
      ["admin", "matching", true],
      ["admin", "nonMatching", false],
      ["admin", "undefined", false],
      ["member", "matching", false],
      ["member", "nonMatching", false],
      ["member", "undefined", false],
    ])("when user is %s with %s resource", (role, resourceState, expected) => {
      it(`should return ${expected}`, () => {
        const policy = new ProjectPolicy(buildUserMembership(role), buildResource(resourceState))

        expect(policy.canDelete()).toBe(expected)
      })
    })
  })
})
