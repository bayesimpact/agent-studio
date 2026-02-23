import { organizationFactory } from "@/domains/organizations/organization.factory"
import type { MembershipRole } from "@/domains/organizations/user-membership.entity"
import { userMembershipFactory } from "@/domains/organizations/user-membership.factory"
import { projectFactory } from "@/domains/projects/project.factory"
import { userFactory } from "@/domains/users/user.factory"
import type { AgentExtractionRun } from "./agent-extraction-run.entity"
import { AgentExtractionRunPolicy } from "./agent-extraction-run.policy"

type RunState = "sameOrganization" | "differentOrganization" | "noRun"

describe("AgentExtractionRunPolicy", () => {
  const organization = organizationFactory.build()
  const otherOrganization = organizationFactory.build()
  const user = userFactory.build()

  const buildUserMembership = (role: MembershipRole) => {
    return userMembershipFactory.transient({ user, organization }).params({ role }).build()
  }

  const buildProject = (projectOrganization: typeof organization) => {
    return projectFactory.transient({ organization: projectOrganization }).build()
  }

  const buildRun = (runState: RunState): AgentExtractionRun | undefined => {
    if (runState === "sameOrganization") {
      const project = buildProject(organization)
      return { projectId: project.id } as AgentExtractionRun
    }
    if (runState === "differentOrganization") {
      const project = buildProject(otherOrganization)
      return { projectId: project.id } as AgentExtractionRun
    }
    return undefined
  }

  describe("canList", () => {
    describe.each<[MembershipRole, RunState, boolean]>([
      ["owner", "sameOrganization", true],
      ["owner", "differentOrganization", true],
      ["owner", "noRun", true],
      ["admin", "sameOrganization", true],
      ["admin", "differentOrganization", true],
      ["admin", "noRun", true],
      ["member", "sameOrganization", false],
      ["member", "differentOrganization", false],
      ["member", "noRun", false],
    ])("when user is %s with %s run", (role, runState, expected) => {
      it(`should return ${expected}`, () => {
        const policy = new AgentExtractionRunPolicy(
          {
            userMembership: buildUserMembership(role),
            project: buildProject(organization),
          },
          buildRun(runState),
        )
        expect(policy.canList()).toBe(expected)
      })
    })
  })
})
