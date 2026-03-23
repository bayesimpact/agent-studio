import type { MembershipRole } from "@/domains/organizations/memberships/organization-membership.entity"
import { organizationMembershipFactory } from "@/domains/organizations/memberships/organization-membership.factory"
import { organizationFactory } from "@/domains/organizations/organization.factory"
import { userFactory } from "@/domains/users/user.factory"
import { projectFactory } from "../projects/project.factory"
import { ProjectPolicy } from "../projects/project.policy"

type Project = ReturnType<typeof projectFactory.build>
type EvaluationState = "sameOrganization" | "differentOrganization" | "noDocument"

describe("EvaluationPolicy", () => {
  const organization = organizationFactory.build()
  const otherOrganization = organizationFactory.build()
  const user = userFactory.build()

  const buildOrganizationMembership = (role: MembershipRole) => {
    return organizationMembershipFactory.transient({ user, organization }).params({ role }).build()
  }

  const buildProject = (projectOrganization: typeof organization) => {
    return projectFactory.transient({ organization: projectOrganization }).build()
  }

  const buildEvaluation = (evaluationState: EvaluationState): Project | undefined => {
    if (evaluationState === "sameOrganization") {
      return buildProject(organization)
    }
    if (evaluationState === "differentOrganization") {
      return buildProject(otherOrganization)
    }
    return undefined
  }

  describe("canList", () => {
    describe.each<[MembershipRole, EvaluationState]>([
      ["owner", "sameOrganization"],
      ["owner", "differentOrganization"],
      ["owner", "noDocument"],
      ["admin", "sameOrganization"],
      ["admin", "differentOrganization"],
      ["admin", "noDocument"],
      ["member", "sameOrganization"],
      ["member", "differentOrganization"],
      ["member", "noDocument"],
    ])("when user is %s with %s evaluation", (role, evaluationState) => {
      it("should always return true", () => {
        const policy = new ProjectPolicy(
          buildOrganizationMembership(role),
          buildEvaluation(evaluationState),
        )

        expect(policy.canList()).toBe(true)
      })
    })
  })

  describe("canCreate", () => {
    it("should return true when user is owner", () => {
      const policy = new ProjectPolicy(buildOrganizationMembership("owner"))
      expect(policy.canCreate()).toBe(true)
    })

    it("should return true when user is admin", () => {
      const policy = new ProjectPolicy(buildOrganizationMembership("admin"))
      expect(policy.canCreate()).toBe(true)
    })

    it("should return false when user is member", () => {
      const policy = new ProjectPolicy(buildOrganizationMembership("member"))
      expect(policy.canCreate()).toBe(false)
    })
  })

  describe("canUpdate", () => {
    describe.each<[MembershipRole, EvaluationState, boolean]>([
      ["owner", "sameOrganization", true],
      ["owner", "differentOrganization", false],
      ["owner", "noDocument", false],
      ["admin", "sameOrganization", true],
      ["admin", "differentOrganization", false],
      ["admin", "noDocument", false],
      ["member", "sameOrganization", false],
      ["member", "differentOrganization", false],
      ["member", "noDocument", false],
    ])("when user is %s with %s evaluation", (role, evaluationState, expected) => {
      it(`should return ${expected}`, () => {
        const policy = new ProjectPolicy(
          buildOrganizationMembership(role),
          buildEvaluation(evaluationState),
        )

        expect(policy.canUpdate()).toBe(expected)
      })
    })
  })

  describe("canDelete", () => {
    describe.each<[MembershipRole, EvaluationState, boolean]>([
      ["owner", "sameOrganization", true],
      ["owner", "differentOrganization", false],
      ["owner", "noDocument", false],
      ["admin", "sameOrganization", true],
      ["admin", "differentOrganization", false],
      ["admin", "noDocument", false],
      ["member", "sameOrganization", false],
      ["member", "differentOrganization", false],
      ["member", "noDocument", false],
    ])("when user is %s with %s evaluation", (role, evaluationState, expected) => {
      it(`should return ${expected}`, () => {
        const policy = new ProjectPolicy(
          buildOrganizationMembership(role),
          buildEvaluation(evaluationState),
        )

        expect(policy.canDelete()).toBe(expected)
      })
    })
  })
})
