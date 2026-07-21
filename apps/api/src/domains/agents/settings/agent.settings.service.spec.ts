import { afterAll, expect } from "@jest/globals"
import {
  type AllRepositories,
  clearTestDatabase,
  setupE2eTestDatabase,
  teardownE2eTestDatabase,
} from "@/common/test/test-database"
import { AgentsModule } from "@/domains/agents/agents.module"
import { AgentsService } from "@/domains/agents/agents.service"
import { agentSettingsFactory } from "@/domains/agents/settings/agent.settings.factory"
import {
  agentSettingsValuesRev1,
  agentSettingsValuesRev2Archived,
  agentSettingsValuesRev3Draft,
  assertOnSettings,
} from "@/domains/agents/settings/agent.settings.spec.helper"
import { AgentSettings } from "@/domains/agents/settings/agent-settings.entity"
import {
  createOrganizationWithAgent,
  createOrganizationWithProject,
} from "@/domains/organizations/organization.factory"
import { sdk } from "@/external/llm/open-telemetry-init"
import { AgentSettingsService } from "./agent-settings.service"

async function createAgentWithSettings(
  setup: Awaited<ReturnType<typeof setupE2eTestDatabase>>,
  repositories: AllRepositories,
  onlyRev1?: true,
) {
  const { organization, project, agent } = await createOrganizationWithAgent(repositories, {
    agentSettings: {
      ...agentSettingsValuesRev1,
      revisionName: "FirstRev",
      revisionDesc: "The first revision",
    },
  })
  if (!onlyRev1) {
    const agentSettings2 = agentSettingsFactory
      .transient({ organization: organization, project, agent })
      .build({ ...agentSettingsValuesRev2Archived, revision: 2, isArchived: true })

    const agentSettings3 = agentSettingsFactory
      .transient({ organization: organization, project, agent })
      .build({ ...agentSettingsValuesRev3Draft, revision: 3, isDraft: true })

    await setup.getRepository(AgentSettings).save([agentSettings2, agentSettings3])
  }

  return { organization, project, agent }
}

describe("AgentSettings", () => {
  let service: AgentSettingsService
  let agentService: AgentsService
  let setup: Awaited<ReturnType<typeof setupE2eTestDatabase>>
  let repositories: AllRepositories

  beforeAll(async () => {
    setup = await setupE2eTestDatabase({
      additionalImports: [AgentsModule],
    })
    service = setup.module.get<AgentSettingsService>(AgentSettingsService)
    agentService = setup.module.get<AgentsService>(AgentsService)
    repositories = setup.getAllRepositories()
  })

  afterAll(async () => {
    await teardownE2eTestDatabase(setup)
    await sdk.shutdown()
  })

  beforeEach(async () => {
    await clearTestDatabase(setup.dataSource)
  })

  describe("AgentSettingsService", () => {
    it("getLast should return settings from Agent - last revision - no draft", async () => {
      const { organization, project, agent } = await createAgentWithSettings(setup, repositories)
      const settings = await service.getLast({
        connectScope: { organizationId: organization.id, projectId: project.id },
        agentId: agent.id,
      })
      assertOnSettings(agentSettingsValuesRev1, settings)
    })
    it("getLast should return settings from Agent - last revision - draft", async () => {
      const { organization, project, agent } = await createAgentWithSettings(setup, repositories)

      const settings = await service.getLast({
        connectScope: { organizationId: organization.id, projectId: project.id },
        agentId: agent.id,
        includesDraft: true,
      })
      assertOnSettings(agentSettingsValuesRev3Draft, settings)
    })
    it("get should return settings from Agent - specified revision", async () => {
      const { organization, project, agent } = await createAgentWithSettings(setup, repositories)

      const settings = await service.get({
        connectScope: { organizationId: organization.id, projectId: project.id },
        agentId: agent.id,
        revision: 1,
      })
      assertOnSettings(agentSettingsValuesRev1, settings)
    })
    it("getAll should return all settings for Agent - no draft - no archived", async () => {
      const { organization, project, agent } = await createAgentWithSettings(setup, repositories)

      const settings = await service.getAll({
        connectScope: { organizationId: organization.id, projectId: project.id },
        agentId: agent.id,
      })
      expect(settings.length).toBe(1)
      assertOnSettings(agentSettingsValuesRev1, settings[0])
    })

    it("getAll should return all settings for Agent - draft - no archived", async () => {
      const { organization, project, agent } = await createAgentWithSettings(setup, repositories)
      const settings = await service.getAll({
        connectScope: { organizationId: organization.id, projectId: project.id },
        agentId: agent.id,
        includesDraft: true,
      })
      expect(settings.length).toBe(2)
      assertOnSettings(agentSettingsValuesRev3Draft, settings[0])
      expect(settings[0]?.isDraft).toBeTruthy()
      assertOnSettings(agentSettingsValuesRev1, settings[1])
    })
    it("getAll should return all settings for Agent - draft - archived", async () => {
      const { organization, project, agent } = await createAgentWithSettings(setup, repositories)
      const settings = await service.getAll({
        connectScope: { organizationId: organization.id, projectId: project.id },
        agentId: agent.id,
        includesDraft: true,
        includesArchived: true,
      })
      expect(settings.length).toBe(3)
      assertOnSettings(agentSettingsValuesRev3Draft, settings[0])
      expect(settings[0]?.isDraft).toBeTruthy()
      assertOnSettings(agentSettingsValuesRev2Archived, settings[1])
      expect(settings[1]?.isArchived).toBeTruthy()
      assertOnSettings(agentSettingsValuesRev1, settings[2])
    })
    it("archive should works - not draft", async () => {
      const { organization, project, agent } = await createAgentWithSettings(
        setup,
        repositories,
        true,
      )
      const { success } = await service.archive({
        connectScope: { organizationId: organization.id, projectId: project.id },
        agentId: agent.id,
        revision: 1,
      })
      expect(success).toBeTruthy()
      const settings = await service.getAll({
        connectScope: { organizationId: organization.id, projectId: project.id },
        agentId: agent.id,
        includesDraft: true,
        includesArchived: true,
      })
      expect(settings.length).toBe(1)
      assertOnSettings(agentSettingsValuesRev1, settings[0])
      expect(settings[0]?.isArchived).toBeTruthy()
    })
    it("archive should NOT works - draft", async () => {
      const { organization, project, agent } = await createAgentWithSettings(setup, repositories)
      const { success } = await service.archive({
        connectScope: { organizationId: organization.id, projectId: project.id },
        agentId: agent.id,
        revision: 3,
      })
      expect(success).toBeFalsy()
      const settings = await service.getAll({
        connectScope: { organizationId: organization.id, projectId: project.id },
        agentId: agent.id,
        includesDraft: true,
        includesArchived: true,
      })
      expect(settings.length).toBe(3)
      assertOnSettings(agentSettingsValuesRev3Draft, settings[0])
      expect(settings[0]?.isArchived).toBeFalsy()
    })

    it("publish should works - draft", async () => {
      const { organization, project, agent } = await createAgentWithSettings(setup, repositories)
      const published = await service.publish({
        connectScope: { organizationId: organization.id, projectId: project.id },
        agentId: agent.id,
        revision: 3,
        revisionName: "publishName",
        revisionDesc: "publishDesc",
      })
      expect(published).toBeDefined()
      const settings = await service.getAll({
        connectScope: { organizationId: organization.id, projectId: project.id },
        agentId: agent.id,
        includesDraft: true,
        includesArchived: true,
      })
      expect(settings.length).toBe(3)
      assertOnSettings(agentSettingsValuesRev3Draft, settings[0])
      expect(settings[0]?.isDraft).toBeFalsy()
      expect(settings[0]?.revisionName).toBe("publishName")
      expect(settings[0]?.revisionDesc).toBe("publishDesc")
    })
    it("publish should works and update name / desc - not draft", async () => {
      const { organization, project, agent } = await createAgentWithSettings(
        setup,
        repositories,
        true,
      )
      const published = await service.publish({
        connectScope: { organizationId: organization.id, projectId: project.id },
        agentId: agent.id,
        revision: 1,
        revisionName: "updated revisionName",
        revisionDesc: "updated revisionDesc",
      })
      expect(published).toBeDefined()
      const settings = await service.getAll({
        connectScope: { organizationId: organization.id, projectId: project.id },
        agentId: agent.id,
      })
      expect(settings.length).toBe(1)
      expect(settings[0]?.isDraft).toBeFalsy()
      expect(settings[0]?.revision).toBe(1)
      expect(settings[0]?.revisionName).toBe("updated revisionName")
      expect(settings[0]?.revisionDesc).toBe("updated revisionDesc")
    })

    it("publish should fail - archived", async () => {
      const { organization, project, agent } = await createAgentWithSettings(setup, repositories)
      const published = await service.publish({
        connectScope: { organizationId: organization.id, projectId: project.id },
        agentId: agent.id,
        revision: 2,
        revisionName: "publishName",
        revisionDesc: "publishDesc",
      })
      expect(published).toBeUndefined()
    })
  })

  describe("AgentService extension", () => {
    it("createAgent should also create draft settings with revision = 1", async () => {
      const { organization, project, user } = await createOrganizationWithProject(repositories)
      const { agent, agentSettings } = await agentService.createAgent({
        connectScope: {
          organizationId: organization.id,
          projectId: project.id,
        },
        fields: {
          ...agentSettingsValuesRev1,
          instructions: agentSettingsValuesRev1.instructions,
          type: "conversation",
          name: "My Template",
        },
        userId: user.id,
      })

      assertOnSettings(agentSettingsValuesRev1, agentSettings)

      const savedSettings = await service.getLast({
        connectScope: {
          organizationId: organization.id,
          projectId: project.id,
        },
        agentId: agent.id,
        includesDraft: true,
      })
      assertOnSettings(agentSettingsValuesRev1, savedSettings)
      expect(savedSettings?.isDraft).toBeTruthy()
      expect(savedSettings?.revision).toBe(1)
    })
    it("updateAgent should also create draft settings with revision = last revision +1 - no existing draft", async () => {
      const { organization, project, agent } = await createAgentWithSettings(
        setup,
        repositories,
        true,
      )

      let savedSettings = await service.getAll({
        connectScope: {
          organizationId: organization.id,
          projectId: project.id,
        },
        agentId: agent.id,
        includesDraft: true,
        includesArchived: true,
      })
      expect(savedSettings.length).toBe(1)

      const updatedFields = {
        ...agentSettingsValuesRev1,
        instructions: "My new instructions",
        name: "My new agent name",
      }

      const { agentSettings: updatedAgentSettings } = await agentService.updateAgent({
        connectScope: {
          organizationId: organization.id,
          projectId: project.id,
        },
        fieldsToUpdate: updatedFields,
        agentId: agent.id,
      })
      assertOnSettings(updatedFields, updatedAgentSettings)

      savedSettings = await service.getAll({
        connectScope: {
          organizationId: organization.id,
          projectId: project.id,
        },
        agentId: agent.id,
        includesDraft: true,
        includesArchived: true,
      })
      expect(savedSettings.length).toBe(2)
      assertOnSettings(updatedFields, savedSettings[0])
      expect(savedSettings[0]?.revision).toBe(2)
      expect(savedSettings[0]?.isDraft).toBeTruthy()
    })

    it("updateAgent should update existing draft settings - existing draft", async () => {
      const { organization, project, agent } = await createAgentWithSettings(setup, repositories)

      const savedSettings = await service.getLast({
        connectScope: {
          organizationId: organization.id,
          projectId: project.id,
        },
        agentId: agent.id,
        includesDraft: true,
      })
      expect(savedSettings.revision).toBe(3)
      expect(savedSettings.isDraft).toBeTruthy()

      const updatedFields = {
        ...agentSettingsValuesRev3Draft,
        instructions: "My updated instructions",
        name: "My updated agent name",
      }

      const { agentSettings: updatedAgentSettings } = await agentService.updateAgent({
        connectScope: {
          organizationId: organization.id,
          projectId: project.id,
        },
        fieldsToUpdate: updatedFields,
        agentId: agent.id,
      })
      assertOnSettings(updatedFields, updatedAgentSettings)

      const allSavedSettings = await service.getAll({
        connectScope: {
          organizationId: organization.id,
          projectId: project.id,
        },
        agentId: agent.id,
        includesDraft: true,
      })
      expect(allSavedSettings.length).toBe(2)
      assertOnSettings(updatedFields, allSavedSettings[0])
      expect(allSavedSettings[0]?.revision).toBe(savedSettings.revision)
      expect(allSavedSettings[0]?.isDraft).toBeTruthy()
    })
    it("deleteAgent should also delete settings", async () => {
      const { organization, project, agent } = await createAgentWithSettings(setup, repositories)

      let savedSettings = await service.getAll({
        connectScope: {
          organizationId: organization.id,
          projectId: project.id,
        },
        agentId: agent.id,
        includesDraft: true,
        includesArchived: true,
      })
      expect(savedSettings.length).toBe(3)

      await agentService.deleteAgent(agent)

      savedSettings = await service.getAll({
        connectScope: {
          organizationId: organization.id,
          projectId: project.id,
        },
        agentId: agent.id,
        includesDraft: true,
        includesArchived: true,
      })
      expect(savedSettings.length).toBe(0)
    })
  })
})
