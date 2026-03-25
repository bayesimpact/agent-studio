import {
  type ResourceState,
  testPolicyScopedByProject,
} from "@/common/test/test-project-scoped-policy.helpers"
import type { Organization } from "../organizations/organization.entity"
import type { ProjectMembershipRole } from "../projects/memberships/project-membership.entity"
import type { Project } from "../projects/project.entity"
import { agentFactory } from "./agent.factory"
import { AgentPolicy } from "./agent.policy"

describe("AgentPolicy", () => {
  const { buildPolicy } = testPolicyScopedByProject({
    buildResource: (params: { organization: Organization; project: Project }) => {
      return agentFactory.transient(params).build()
    },
    ResourcePolicy: AgentPolicy,
  })

  describe("canList", () => {
    describe.each<[ProjectMembershipRole, ResourceState, boolean]>([
      ["owner", "sameOrganization", true],
      ["owner", "differentOrganization", false],
      ["owner", "noResource", true],
      ["admin", "sameOrganization", true],
      ["admin", "differentOrganization", false],
      ["admin", "noResource", true],
      ["member", "sameOrganization", true],
      ["member", "differentOrganization", false],
      ["member", "noResource", true],
    ])("when user is %s with %s agent", (projectRole, resourceState, expected) => {
      it(`should return ${expected}`, () => {
        const policy = buildPolicy({ resourceState, projectRole })

        expect(policy.canList()).toBe(expected)
      })
    })
  })

  describe("canCreate", () => {
    describe.each<[ProjectMembershipRole, ResourceState, boolean]>([
      ["owner", "sameOrganization", true],
      ["owner", "differentOrganization", false],
      ["owner", "noResource", true],
      ["admin", "sameOrganization", true],
      ["admin", "differentOrganization", false],
      ["admin", "noResource", true],
      ["member", "sameOrganization", false],
      ["member", "differentOrganization", false],
      ["member", "noResource", false],
    ])("when user is %s with %s agent", (projectRole, resourceState, expected) => {
      it(`should return ${expected}`, () => {
        const policy = buildPolicy({ resourceState, projectRole })
        expect(policy.canCreate()).toBe(expected)
      })
    })
  })

  describe("canUpdate", () => {
    describe.each<[ProjectMembershipRole, ResourceState, boolean]>([
      ["owner", "sameOrganization", true],
      ["owner", "differentOrganization", false],
      ["owner", "noResource", false],
      ["admin", "sameOrganization", true],
      ["admin", "differentOrganization", false],
      ["admin", "noResource", false],
      ["member", "sameOrganization", false],
      ["member", "differentOrganization", false],
      ["member", "noResource", false],
    ])("when user is %s with %s agent", (projectRole, resourceState, expected) => {
      it(`should return ${expected}`, () => {
        const policy = buildPolicy({ resourceState, projectRole })

        expect(policy.canUpdate()).toBe(expected)
      })
    })
  })

  describe("canDelete", () => {
    describe.each<[ProjectMembershipRole, ResourceState, boolean]>([
      ["owner", "sameOrganization", true],
      ["owner", "differentOrganization", false],
      ["owner", "noResource", false],
      ["admin", "sameOrganization", true],
      ["admin", "differentOrganization", false],
      ["admin", "noResource", false],
      ["member", "sameOrganization", false],
      ["member", "differentOrganization", false],
      ["member", "noResource", false],
    ])("when user is %s with %s agent", (projectRole, resourceState, expected) => {
      it(`should return ${expected}`, () => {
        const policy = buildPolicy({ resourceState, projectRole })

        expect(policy.canDelete()).toBe(expected)
      })
    })
  })
})
