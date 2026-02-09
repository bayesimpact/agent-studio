import { organizationFactory } from "@/domains/organizations/organization.factory"
import type { MembershipRole } from "@/domains/organizations/user-membership.entity"
import { userMembershipFactory } from "@/domains/organizations/user-membership.factory"
import { userFactory } from "@/domains/users/user.factory"
import { projectFactory } from "./project.factory"
import { ProjectPolicy } from "./project.policy"

type Project = ReturnType<typeof projectFactory.build>
type ResourceState = "sameOrganization" | "differentOrganization" | "noResource"

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

  const buildResource = (resourceState: ResourceState): Project | undefined => {
    if (resourceState === "sameOrganization") {
      return buildProject(organization)
    }
    if (resourceState === "differentOrganization") {
      return buildProject(otherOrganization)
    }
    return undefined
  }

  describe("canList", () => {
    describe.each<[MembershipRole, ResourceState]>([
      ["owner", "sameOrganization"],
      ["owner", "differentOrganization"],
      ["owner", "noResource"],
      ["admin", "sameOrganization"],
      ["admin", "differentOrganization"],
      ["admin", "noResource"],
      ["member", "sameOrganization"],
      ["member", "differentOrganization"],
      ["member", "noResource"],
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
    describe.each<[MembershipRole, ResourceState, boolean]>([
      ["owner", "sameOrganization", true],
      ["owner", "differentOrganization", false],
      ["owner", "noResource", false],
      ["admin", "sameOrganization", true],
      ["admin", "differentOrganization", false],
      ["admin", "noResource", false],
      ["member", "sameOrganization", false],
      ["member", "differentOrganization", false],
      ["member", "noResource", false],
    ])("when user is %s with %s resource", (role, resourceState, expected) => {
      it(`should return ${expected}`, () => {
        const policy = new ProjectPolicy(buildUserMembership(role), buildResource(resourceState))

        expect(policy.canUpdate()).toBe(expected)
      })
    })
  })

  describe("canDelete", () => {
    describe.each<[MembershipRole, ResourceState, boolean]>([
      ["owner", "sameOrganization", true],
      ["owner", "differentOrganization", false],
      ["owner", "noResource", false],
      ["admin", "sameOrganization", true],
      ["admin", "differentOrganization", false],
      ["admin", "noResource", false],
      ["member", "sameOrganization", false],
      ["member", "differentOrganization", false],
      ["member", "noResource", false],
    ])("when user is %s with %s resource", (role, resourceState, expected) => {
      it(`should return ${expected}`, () => {
        const policy = new ProjectPolicy(buildUserMembership(role), buildResource(resourceState))

        expect(policy.canDelete()).toBe(expected)
      })
    })
  })
})
