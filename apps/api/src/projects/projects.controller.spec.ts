import type { Repository } from "typeorm"
import { buildEndpointRequest } from "@/common/test/request.factory"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { Organization } from "@/organizations/organization.entity"
import { createOrganizationWithOwner } from "@/organizations/organization.factory"
import { UserMembership } from "@/organizations/user-membership.entity"
import { User } from "@/users/user.entity"
import { userFactory } from "@/users/user.factory"
import { Project } from "./project.entity"
import { ProjectsController } from "./projects.controller"
import { ProjectsModule } from "./projects.module"

describe("ProjectsController", () => {
  let controller: ProjectsController
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let userRepository: Repository<User>
  let organizationRepository: Repository<Organization>
  let membershipRepository: Repository<UserMembership>
  let projectRepository: Repository<Project>
  let defaultRepositories: {
    userRepository: Repository<User>
    organizationRepository: Repository<Organization>
    membershipRepository: Repository<UserMembership>
  }

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      featureEntities: [User, Organization, UserMembership, Project],
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
    userRepository = setup.getRepository(User)
    organizationRepository = setup.getRepository(Organization)
    membershipRepository = setup.getRepository(UserMembership)
    projectRepository = setup.getRepository(Project)
    defaultRepositories = { userRepository, organizationRepository, membershipRepository }
  })

  afterEach(async () => {
    await setup.rollbackTransaction()
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  describe("createProject", () => {
    it("should create a project when user is owner", async () => {
      const { organization, user } = await createOrganizationWithOwner(defaultRepositories)

      const body = {
        payload: { name: "New Project", organizationId: organization.id },
      }

      // Act
      const { data: result } = await controller.createProject(buildEndpointRequest(user), body)

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

    it("should create a project when user is admin", async () => {
      const { organization, user } = await createOrganizationWithOwner(defaultRepositories, {
        membership: { role: "admin" },
      })

      const body = { payload: { name: "Admin Project", organizationId: organization.id } }

      // Act
      const { data: result } = await controller.createProject(buildEndpointRequest(user), body)

      // Assert
      expect(result.name).toBe("Admin Project")
      expect(result.organizationId).toBe(organization.id)
    })

    it("should throw ForbiddenException when user is member", async () => {
      const { organization, user } = await createOrganizationWithOwner(defaultRepositories, {
        membership: { role: "member" },
      })

      const body = {
        payload: { name: "Should Fail", organizationId: organization.id },
      }

      // Act & Assert
      await expect(controller.createProject(buildEndpointRequest(user), body)).rejects.toThrow(
        "User must be an owner or admin",
      )
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
        buildEndpointRequest(user),
        organization.id,
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
      const { organization, user } = await createOrganizationWithOwner(defaultRepositories, {
        membership: { role: "member" },
      })

      // Act
      const { data: result } = await controller.listProjects(
        buildEndpointRequest(user),
        organization.id,
      )

      // Assert
      expect(result.projects).toEqual([])
    })

    it("should throw ForbiddenException when user is not a member", async () => {
      const { organization } = await createOrganizationWithOwner(defaultRepositories, {
        membership: { role: "member" },
      })

      const anotherUser = await userRepository.save(
        userFactory.build({
          email: "nonmember@example.com",
        }),
      )

      // Act & Assert
      await expect(
        controller.listProjects(buildEndpointRequest(anotherUser), organization.id),
      ).rejects.toThrow("User does not have access to organization")
    })
  })

  describe("deleteProject", () => {
    it("should delete a project when user is owner", async () => {
      const { organization, user } = await createOrganizationWithOwner(defaultRepositories)

      const project = await projectRepository.save({
        name: "Project to Delete",
        organizationId: organization.id,
      })

      // Act
      const { data: result } = await controller.deleteProject(
        buildEndpointRequest(user),
        project.id,
      )

      // Assert
      expect(result.success).toBe(true)

      const deletedProject = await projectRepository.findOne({ where: { id: project.id } })
      expect(deletedProject).toBeNull()
    })

    it("should delete a project when user is admin", async () => {
      const { organization, user } = await createOrganizationWithOwner(defaultRepositories, {
        membership: { role: "admin" },
      })

      const project = await projectRepository.save({
        name: "Admin Project to Delete",
        organizationId: organization.id,
      })

      // Act
      const { data: result } = await controller.deleteProject(
        buildEndpointRequest(user),
        project.id,
      )

      // Assert
      expect(result.success).toBe(true)

      const deletedProject = await projectRepository.findOne({ where: { id: project.id } })
      expect(deletedProject).toBeNull()
    })

    it("should throw ForbiddenException when user is member", async () => {
      const { organization, user } = await createOrganizationWithOwner(defaultRepositories, {
        membership: { role: "member" },
      })

      const project = await projectRepository.save({
        name: "Should Not Delete",
        organizationId: organization.id,
      })

      // Act & Assert
      await expect(
        controller.deleteProject(buildEndpointRequest(user), project.id),
      ).rejects.toThrow("User must be an owner or admin")

      // Verify project still exists
      const existingProject = await projectRepository.findOne({ where: { id: project.id } })
      expect(existingProject).not.toBeNull()
    })

    it("should throw NotFoundException when project does not exist", async () => {
      const { user } = await createOrganizationWithOwner(defaultRepositories)
      const nonExistentProjectId = "00000000-0000-0000-0000-000000000000"

      // Act & Assert
      await expect(
        controller.deleteProject(buildEndpointRequest(user), nonExistentProjectId),
      ).rejects.toThrow("Project with id")
    })
  })
})
