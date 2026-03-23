import type { MembershipRole } from "@/domains/organizations/memberships/organization-membership.entity"
import { userMembershipFactory } from "@/domains/organizations/memberships/organization-membership.factory"
import { organizationFactory } from "@/domains/organizations/organization.factory"
import { userFactory } from "@/domains/users/user.factory"
import { projectFactory } from "../projects/project.factory"
import { ProjectPolicy } from "../projects/project.policy"

type Project = ReturnType<typeof projectFactory.build>
type AgentState = "sameOrganization" | "differentOrganization" | "noAgent"

describe("AgentPolicy", () => {
  const organization = organizationFactory.build()
  const otherOrganization = organizationFactory.build()
  const user = userFactory.build()

  const buildUserMembership = (role: MembershipRole) => {
    return userMembershipFactory.transient({ user, organization }).params({ role }).build()
  }

  const buildProject = (projectOrganization: typeof organization) => {
    return projectFactory.transient({ organization: projectOrganization }).build()
  }

  const buildAgent = (agentState: AgentState): Project | undefined => {
    if (agentState === "sameOrganization") {
      return buildProject(organization)
    }
    if (agentState === "differentOrganization") {
      return buildProject(otherOrganization)
    }
    return undefined
  }

  describe("canList", () => {
    describe.each<[MembershipRole, AgentState]>([
      ["owner", "sameOrganization"],
      ["owner", "differentOrganization"],
      ["owner", "noAgent"],
      ["admin", "sameOrganization"],
      ["admin", "differentOrganization"],
      ["admin", "noAgent"],
      ["member", "sameOrganization"],
      ["member", "differentOrganization"],
      ["member", "noAgent"],
    ])("when user is %s with %s agent", (role, agentState) => {
      it("should always return true", () => {
        const policy = new ProjectPolicy(buildUserMembership(role), buildAgent(agentState))

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
    describe.each<[MembershipRole, AgentState, boolean]>([
      ["owner", "sameOrganization", true],
      ["owner", "differentOrganization", false],
      ["owner", "noAgent", false],
      ["admin", "sameOrganization", true],
      ["admin", "differentOrganization", false],
      ["admin", "noAgent", false],
      ["member", "sameOrganization", false],
      ["member", "differentOrganization", false],
      ["member", "noAgent", false],
    ])("when user is %s with %s agent", (role, agentState, expected) => {
      it(`should return ${expected}`, () => {
        const policy = new ProjectPolicy(buildUserMembership(role), buildAgent(agentState))

        expect(policy.canUpdate()).toBe(expected)
      })
    })
  })

  describe("canDelete", () => {
    describe.each<[MembershipRole, AgentState, boolean]>([
      ["owner", "sameOrganization", true],
      ["owner", "differentOrganization", false],
      ["owner", "noAgent", false],
      ["admin", "sameOrganization", true],
      ["admin", "differentOrganization", false],
      ["admin", "noAgent", false],
      ["member", "sameOrganization", false],
      ["member", "differentOrganization", false],
      ["member", "noAgent", false],
    ])("when user is %s with %s agent", (role, agentState, expected) => {
      it(`should return ${expected}`, () => {
        const policy = new ProjectPolicy(buildUserMembership(role), buildAgent(agentState))

        expect(policy.canDelete()).toBe(expected)
      })
    })
  })
})
