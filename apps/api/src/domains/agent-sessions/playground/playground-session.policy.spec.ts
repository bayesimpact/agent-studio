import { organizationFactory } from "@/domains/organizations/organization.factory"
import type { MembershipRole } from "@/domains/organizations/user-membership.entity"
import { userMembershipFactory } from "@/domains/organizations/user-membership.factory"
import { userFactory } from "@/domains/users/user.factory"
import { PlaygroundSessionPolicy } from "./playground-session.policy"

describe("PlaygroundSessionPolicy", () => {
  const organization = organizationFactory.build()
  const user = userFactory.build()

  const buildUserMembership = (role: MembershipRole) => {
    return userMembershipFactory.transient({ user, organization }).params({ role }).build()
  }

  describe("canList", () => {
    it("should return true for owner", () => {
      const policy = new PlaygroundSessionPolicy(buildUserMembership("owner"))
      expect(policy.canList()).toBe(true)
    })

    it("should return true for admin", () => {
      const policy = new PlaygroundSessionPolicy(buildUserMembership("admin"))
      expect(policy.canList()).toBe(true)
    })

    it("should return false for member", () => {
      const policy = new PlaygroundSessionPolicy(buildUserMembership("member"))
      expect(policy.canList()).toBe(false)
    })
  })

  describe("canCreate", () => {
    it("should return true for owner", () => {
      const policy = new PlaygroundSessionPolicy(buildUserMembership("owner"))
      expect(policy.canCreate()).toBe(true)
    })

    it("should return true for admin", () => {
      const policy = new PlaygroundSessionPolicy(buildUserMembership("admin"))
      expect(policy.canCreate()).toBe(true)
    })

    it("should return false for member", () => {
      const policy = new PlaygroundSessionPolicy(buildUserMembership("member"))
      expect(policy.canCreate()).toBe(false)
    })
  })
})
