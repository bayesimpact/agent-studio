import type { Repository } from "typeorm"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { INVITATION_SENDER } from "@/domains/auth/invitation-sender.interface"
import {
  createOrganizationWithOwner,
  createOrganizationWithProject,
} from "@/domains/organizations/organization.factory"
import { createProjectMembership } from "./memberships/project-membership.factory"
import type { Project } from "./project.entity"
import { projectFactory } from "./project.factory"
import { ProjectsModule } from "./projects.module"
import { ProjectsService } from "./projects.service"

const mockInvitationSender = {
  sendInvitation: jest.fn().mockResolvedValue(undefined),
}

describe("ProjectsService", () => {
  let service: ProjectsService
  let projectRepository: Repository<Project>
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: ReturnType<
    Awaited<ReturnType<typeof setupTransactionalTestDatabase>>["getAllRepositories"]
  >

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [ProjectsModule],
      applyOverrides: (moduleBuilder) =>
        moduleBuilder.overrideProvider(INVITATION_SENDER).useValue(mockInvitationSender),
    })
    await clearTestDatabase(setup.dataSource)
    repositories = setup.getAllRepositories()
    projectRepository = repositories.projectRepository
    service = setup.module.get<ProjectsService>(ProjectsService)
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
  })

  afterEach(async () => {
    await clearTestDatabase(setup.dataSource)
  })

  describe("createProject", () => {
    it("should create a project", async () => {
      // Arrange
      const { organization } = await createOrganizationWithOwner(repositories)

      // Act
      const result = await service.createProject(organization.id, "New Project")

      // Assert
      expect(result.name).toBe("New Project")
      expect(result.organizationId).toBe(organization.id)
      expect(result.id).toBeDefined()

      const savedProject = await projectRepository.findOne({
        where: { id: result.id },
      })
      expect(savedProject).not.toBeNull()
      expect(savedProject?.name).toBe("New Project")
    })
  })

  describe("listProjects", () => {
    it("should return projects for an organization", async () => {
      const { organization, user } = await createOrganizationWithOwner(repositories)

      const project1 = projectFactory.transient({ organization }).build({
        name: "Project 1",
      })
      const project2 = projectFactory.transient({ organization }).build({
        name: "Project 2",
      })
      await projectRepository.save([project1, project2])

      await createProjectMembership({ repositories, project: project1, user })
      await createProjectMembership({ repositories, project: project2, user })

      const result = await service.listProjects({
        organizationId: organization.id,
        userId: user.id,
      })

      expect(result).toHaveLength(2)
      expect(result.map((project) => project.name)).toContain("Project 1")
      expect(result.map((project) => project.name)).toContain("Project 2")
    })

    it("should return empty array when user has no project membership", async () => {
      const { organization, user } = await createOrganizationWithOwner(repositories)
      const project = projectFactory.transient({ organization }).build()
      await projectRepository.save(project)
      const result = await service.listProjects({
        organizationId: organization.id,
        userId: user.id,
      })
      expect(result).toEqual([])
    })
  })

  describe("deleteProject", () => {
    it("should delete a project", async () => {
      const { project } = await createOrganizationWithProject(repositories)

      // Act
      await service.deleteProject(project)

      // Assert
      const deletedProject = await projectRepository.findOne({
        where: { id: project.id },
      })
      expect(deletedProject).toBeNull()
    })
  })
})
