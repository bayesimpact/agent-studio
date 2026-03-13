import { organizationFactory } from "@/domains/organizations/organization.factory"
import type { MembershipRole } from "@/domains/organizations/user-membership.entity"
import { userMembershipFactory } from "@/domains/organizations/user-membership.factory"
import { userFactory } from "@/domains/users/user.factory"
import { projectFactory } from "../projects/project.factory"
import type { Document } from "./document.entity"
import { documentFactory } from "./document.factory"
import { DocumentPolicy } from "./document.policy"

type DocumentState = "sameOrganization" | "differentOrganization" | "noDocument"

describe("DocumentPolicy", () => {
  const organization = organizationFactory.build()
  const otherOrganization = organizationFactory.build()
  const user = userFactory.build()

  const buildUserMembership = (role: MembershipRole) => {
    return userMembershipFactory.transient({ user, organization }).params({ role }).build()
  }

  const buildProject = (projectOrganization: typeof organization) => {
    return projectFactory.transient({ organization: projectOrganization }).build()
  }

  const buildDocument = (documentState: DocumentState): Document | undefined => {
    if (documentState === "sameOrganization") {
      return documentFactory
        .transient({ organization, project: buildProject(organization) })
        .build()
    }
    if (documentState === "differentOrganization") {
      return documentFactory
        .transient({ organization: otherOrganization, project: buildProject(otherOrganization) })
        .build()
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
        const policy = new DocumentPolicy(
          { userMembership: buildUserMembership(role), project: buildProject(organization) },
          buildDocument(documentState),
        )

        expect(policy.canList()).toBe(role === "owner" || role === "admin")
      })
    })
  })

  describe("canCreate", () => {
    it("allows members for non-project source types", () => {
      const defaultPolicy = new DocumentPolicy({
        userMembership: buildUserMembership("member"),
        project: buildProject(organization),
      })
      const agentSessionPolicy = new DocumentPolicy(
        { userMembership: buildUserMembership("member"), project: buildProject(organization) },
        undefined,
        "agentSessionMessage",
      )
      const extractionPolicy = new DocumentPolicy(
        { userMembership: buildUserMembership("member"), project: buildProject(organization) },
        undefined,
        "extraction",
      )

      expect(defaultPolicy.canCreate()).toBe(true)
      expect(agentSessionPolicy.canCreate()).toBe(true)
      expect(extractionPolicy.canCreate()).toBe(true)
    })

    it("forbids members for project source type", () => {
      const policy = new DocumentPolicy(
        { userMembership: buildUserMembership("member"), project: buildProject(organization) },
        undefined,
        "project",
      )
      expect(policy.canCreate()).toBe(false)
    })

    it("allows owners and admins for project source type", () => {
      const ownerPolicy = new DocumentPolicy(
        { userMembership: buildUserMembership("owner"), project: buildProject(organization) },
        undefined,
        "project",
      )
      const adminPolicy = new DocumentPolicy(
        { userMembership: buildUserMembership("admin"), project: buildProject(organization) },
        undefined,
        "project",
      )
      expect(ownerPolicy.canCreate()).toBe(true)
      expect(adminPolicy.canCreate()).toBe(true)
    })
  })

  describe("canUpdate", () => {
    describe.each<[MembershipRole, boolean]>([
      ["owner", true],
      ["admin", true],
      ["member", false],
    ])("when user is %s", (role, expected) => {
      it(`should return ${expected}`, () => {
        const policy = new DocumentPolicy({
          userMembership: buildUserMembership(role),
          project: buildProject(organization),
        })

        expect(policy.canUpdate()).toBe(expected)
      })
    })
  })

  describe("canDelete", () => {
    describe.each<[MembershipRole, boolean]>([
      ["owner", true],
      ["admin", true],
      ["member", false],
    ])("when user is %s", (role, expected) => {
      it(`should return ${expected}`, () => {
        const policy = new DocumentPolicy({
          userMembership: buildUserMembership(role),
          project: buildProject(organization),
        })

        expect(policy.canDelete()).toBe(expected)
      })
    })
  })
})
