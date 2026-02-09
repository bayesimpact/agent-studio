import type { Repository } from "typeorm"
import {
  buildEndpointRequestWithOrganization,
  buildEndpointRequestWithOrganizationAndProject,
} from "@/common/test/request.factory"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import type { Organization } from "@/domains/organizations/organization.entity"
import { createOrganizationWithOwner } from "@/domains/organizations/organization.factory"
import type { UserMembership } from "@/domains/organizations/user-membership.entity"
import type { User } from "@/domains/users/user.entity"
import { Project } from "./project.entity"
import { ProjectsController } from "./projects.controller"
import { ProjectsModule } from "./projects.module"

describe("ProjectsController", () => {
  let controller: ProjectsController
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let projectRepository: Repository<Project>
  let defaultRepositories: {
    userRepository: Repository<User>
    organizationRepository: Repository<Organization>
    membershipRepository: Repository<UserMembership>
  }

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [ProjectsModule],
    })
    await clearTestDatabase(setup.dataSource)
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
  })

  beforeEach(async () => {
    await setup.startTransaction()
    controller = setup.module.get<ProjectsController>(ProjectsController)
    projectRepository = setup.getRepository(Project)
    defaultRepositories = setup.getAllRepositories()
  })

  afterEach(async () => {
    await setup.rollbackTransaction()
    await clearTestDatabase(setup.dataSource)
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  describe("createProject", () => {
    it("should create a project when user is owner", async () => {
      const { organization, user } = await createOrganizationWithOwner(defaultRepositories)

      const body = {
        payload: { name: "New Project" },
      }

      // Act
      const { data: result } = await controller.createProject(
        buildEndpointRequestWithOrganization(organization, user),
        body,
      )

      // Assert
      expect(result.id).toBeDefined()
      expect(result.name).toBe("New Project")
      expect(result.organizationId).toBe(organization.id)

      const project = await projectRepository.findOne({
        where: { id: result.id },
      })
      expect(project).not.toBeNull()
      expect(project?.name).toBe("New Project")
    })
  })

  describe("listProjects", () => {
    it("should return projects for an organization", async () => {
      const { organization, user } = await createOrganizationWithOwner(defaultRepositories, {
        membership: { role: "member" },
      })

      // Create projects
      await projectRepository.save({ name: "Project 1", organizationId: organization.id })
      await projectRepository.save({ name: "Project 2", organizationId: organization.id })

      // Act
      const { data: result } = await controller.listProjects(
        buildEndpointRequestWithOrganization(organization, user),
      )

      // Assert
      expect(result.projects).toHaveLength(2)
      expect(result.projects.map((p) => p.name)).toContain("Project 1")
      expect(result.projects.map((p) => p.name)).toContain("Project 2")
      expect(result.projects[0]).toHaveProperty("id")
      expect(result.projects[0]).toHaveProperty("createdAt")
      expect(result.projects[0]).toHaveProperty("updatedAt")
    })

    it("should return empty array when organization has no projects", async () => {
      const { organization, user } = await createOrganizationWithOwner(defaultRepositories)

      // Act
      const { data: result } = await controller.listProjects(
        buildEndpointRequestWithOrganization(organization, user),
      )

      // Assert
      expect(result.projects).toEqual([])
    })
  })

  describe("deleteProject", () => {
    it("should delete a project", async () => {
      const { organization, user } = await createOrganizationWithOwner(defaultRepositories)

      const project = await projectRepository.save({
        name: "Project to Delete",
        organizationId: organization.id,
      })

      // Act
      const { data: result } = await controller.deleteProject(
        buildEndpointRequestWithOrganizationAndProject(organization, user, project),
      )

      // Assert
      expect(result.success).toBe(true)

      const deletedProject = await projectRepository.findOne({ where: { id: project.id } })
      expect(deletedProject).toBeNull()
    })
  })
})
