import type { MembershipRole } from "@/domains/organizations/memberships/organization-membership.entity"
import { userMembershipFactory } from "@/domains/organizations/memberships/organization-membership.factory"
import { organizationFactory } from "@/domains/organizations/organization.factory"
import { userFactory } from "@/domains/users/user.factory"
import { projectFactory } from "./project.factory"
import { ProjectPolicy } from "./project.policy"

type Project = ReturnType<typeof projectFactory.build>
type DocumentState = "sameOrganization" | "differentOrganization" | "noDocument"

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

  const buildDocument = (documentState: DocumentState): Project | undefined => {
    if (documentState === "sameOrganization") {
      return buildProject(organization)
    }
    if (documentState === "differentOrganization") {
      return buildProject(otherOrganization)
    }
    return undefined
  }

  describe("canList", () => {
    describe.each<[MembershipRole, DocumentState]>([
      ["owner", "sameOrganization"],
      ["owner", "differentOrganization"],
      ["owner", "noDocument"],
      ["admin", "sameOrganization"],
      ["admin", "differentOrganization"],
      ["admin", "noDocument"],
      ["member", "sameOrganization"],
      ["member", "differentOrganization"],
      ["member", "noDocument"],
    ])("when user is %s with %s document", (role, documentState) => {
      it("should always return true", () => {
        const policy = new ProjectPolicy(buildUserMembership(role), buildDocument(documentState))

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
    describe.each<[MembershipRole, DocumentState, boolean]>([
      ["owner", "sameOrganization", true],
      ["owner", "differentOrganization", false],
      ["owner", "noDocument", false],
      ["admin", "sameOrganization", true],
      ["admin", "differentOrganization", false],
      ["admin", "noDocument", false],
      ["member", "sameOrganization", false],
      ["member", "differentOrganization", false],
      ["member", "noDocument", false],
    ])("when user is %s with %s document", (role, documentState, expected) => {
      it(`should return ${expected}`, () => {
        const policy = new ProjectPolicy(buildUserMembership(role), buildDocument(documentState))

        expect(policy.canUpdate()).toBe(expected)
      })
    })
  })

  describe("canDelete", () => {
    describe.each<[MembershipRole, DocumentState, boolean]>([
      ["owner", "sameOrganization", true],
      ["owner", "differentOrganization", false],
      ["owner", "noDocument", false],
      ["admin", "sameOrganization", true],
      ["admin", "differentOrganization", false],
      ["admin", "noDocument", false],
      ["member", "sameOrganization", false],
      ["member", "differentOrganization", false],
      ["member", "noDocument", false],
    ])("when user is %s with %s document", (role, documentState, expected) => {
      it(`should return ${expected}`, () => {
        const policy = new ProjectPolicy(buildUserMembership(role), buildDocument(documentState))

        expect(policy.canDelete()).toBe(expected)
      })
    })
  })
})
