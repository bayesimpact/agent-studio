import type { Repository } from "typeorm"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { Organization } from "@/organizations/organization.entity"
import { organizationFactory } from "@/organizations/organization.factory"
import { UserMembership } from "@/organizations/user-membership.entity"
import { User } from "@/users/user.entity"
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

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase(
      [User, Organization, UserMembership, Project],
      [],
      [ProjectsModule],
    )
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
  })

  afterEach(async () => {
    await setup.rollbackTransaction()
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  describe("createProject", () => {
    it("should create a project when user is owner", async () => {
      // Arrange
      const auth0Sub = "auth0|project-owner"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "owner@example.com",
          name: "Owner User",
        },
      }
      const org = organizationFactory.build({ name: "Owner Org" })
      const savedOrg = await organizationRepository.save(org)

      // Create user and membership
      const user = await userRepository.save({
        auth0Id: auth0Sub,
        email: "owner@example.com",
        name: "Owner User",
      })
      await membershipRepository.save({
        userId: user.id,
        organizationId: savedOrg.id,
        role: "owner",
      })

      const body = {
        payload: {
          name: "New Project",
          organizationId: savedOrg.id,
        },
      }

      // Act
      const { data: result } = await controller.createProject(mockRequest, body)

      // Assert
      expect(result.id).toBeDefined()
      expect(result.name).toBe("New Project")
      expect(result.organizationId).toBe(savedOrg.id)

      const project = await projectRepository.findOne({
        where: { id: result.id },
      })
      expect(project).not.toBeNull()
      expect(project?.name).toBe("New Project")
    })

    it("should create a project when user is admin", async () => {
      // Arrange
      const auth0Sub = "auth0|project-admin"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "admin@example.com",
        },
      }
      const org = organizationFactory.build({ name: "Admin Org" })
      const savedOrg = await organizationRepository.save(org)

      const user = await userRepository.save({
        auth0Id: auth0Sub,
        email: "admin@example.com",
      })
      await membershipRepository.save({
        userId: user.id,
        organizationId: savedOrg.id,
        role: "admin",
      })

      const body = {
        payload: {
          name: "Admin Project",
          organizationId: savedOrg.id,
        },
      }

      // Act
      const { data: result } = await controller.createProject(mockRequest, body)

      // Assert
      expect(result.name).toBe("Admin Project")
      expect(result.organizationId).toBe(savedOrg.id)
    })

    it("should throw ForbiddenException when user is member", async () => {
      // Arrange
      const auth0Sub = "auth0|project-member"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "member@example.com",
        },
      }
      const org = organizationFactory.build({ name: "Member Org" })
      const savedOrg = await organizationRepository.save(org)

      const user = await userRepository.save({
        auth0Id: auth0Sub,
        email: "member@example.com",
      })
      await membershipRepository.save({
        userId: user.id,
        organizationId: savedOrg.id,
        role: "member",
      })

      const body = {
        payload: {
          name: "Should Fail",
          organizationId: savedOrg.id,
        },
      }

      // Act & Assert
      await expect(controller.createProject(mockRequest, body)).rejects.toThrow(
        "User must be an owner or admin",
      )
    })
  })

  describe("listProjects", () => {
    it("should return projects for an organization", async () => {
      // Arrange
      const auth0Sub = "auth0|project-list"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "list@example.com",
        },
      }
      const org = organizationFactory.build({ name: "List Org" })
      const savedOrg = await organizationRepository.save(org)

      const user = await userRepository.save({
        auth0Id: auth0Sub,
        email: "list@example.com",
      })
      await membershipRepository.save({
        userId: user.id,
        organizationId: savedOrg.id,
        role: "member",
      })

      // Create projects
      const _project1 = await projectRepository.save({
        name: "Project 1",
        organizationId: savedOrg.id,
      })
      const _project2 = await projectRepository.save({
        name: "Project 2",
        organizationId: savedOrg.id,
      })

      // Act
      const { data: result } = await controller.listProjects(mockRequest, savedOrg.id)

      // Assert
      expect(result.projects).toHaveLength(2)
      expect(result.projects.map((p) => p.name)).toContain("Project 1")
      expect(result.projects.map((p) => p.name)).toContain("Project 2")
      expect(result.projects[0]).toHaveProperty("id")
      expect(result.projects[0]).toHaveProperty("createdAt")
      expect(result.projects[0]).toHaveProperty("updatedAt")
    })

    it("should return empty array when organization has no projects", async () => {
      // Arrange
      const auth0Sub = "auth0|project-empty"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "empty@example.com",
        },
      }
      const org = organizationFactory.build({ name: "Empty Org" })
      const savedOrg = await organizationRepository.save(org)

      const user = await userRepository.save({
        auth0Id: auth0Sub,
        email: "empty@example.com",
      })
      await membershipRepository.save({
        userId: user.id,
        organizationId: savedOrg.id,
        role: "member",
      })

      // Act
      const { data: result } = await controller.listProjects(mockRequest, savedOrg.id)

      // Assert
      expect(result.projects).toEqual([])
    })

    it("should throw ForbiddenException when user is not a member", async () => {
      // Arrange
      const auth0Sub = "auth0|project-nonmember"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "nonmember@example.com",
        },
      }
      const org = organizationFactory.build({ name: "Other Org" })
      const savedOrg = await organizationRepository.save(org)

      await userRepository.save({
        auth0Id: auth0Sub,
        email: "nonmember@example.com",
      })
      // No membership created

      // Act & Assert
      await expect(controller.listProjects(mockRequest, savedOrg.id)).rejects.toThrow(
        "User does not have access to organization",
      )
    })
  })

  describe("deleteProject", () => {
    it("should delete a project when user is owner", async () => {
      // Arrange
      const auth0Sub = "auth0|delete-owner"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "owner@example.com",
          name: "Owner User",
        },
      }
      const org = organizationFactory.build({ name: "Delete Org" })
      const savedOrg = await organizationRepository.save(org)

      const user = await userRepository.save({
        auth0Id: auth0Sub,
        email: "owner@example.com",
        name: "Owner User",
      })
      await membershipRepository.save({
        userId: user.id,
        organizationId: savedOrg.id,
        role: "owner",
      })

      const project = await projectRepository.save({
        name: "Project to Delete",
        organizationId: savedOrg.id,
      })

      // Act
      const { data: result } = await controller.deleteProject(mockRequest, project.id)

      // Assert
      expect(result.success).toBe(true)

      const deletedProject = await projectRepository.findOne({
        where: { id: project.id },
      })
      expect(deletedProject).toBeNull()
    })

    it("should delete a project when user is admin", async () => {
      // Arrange
      const auth0Sub = "auth0|delete-admin"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "admin@example.com",
        },
      }
      const org = organizationFactory.build({ name: "Admin Delete Org" })
      const savedOrg = await organizationRepository.save(org)

      const user = await userRepository.save({
        auth0Id: auth0Sub,
        email: "admin@example.com",
      })
      await membershipRepository.save({
        userId: user.id,
        organizationId: savedOrg.id,
        role: "admin",
      })

      const project = await projectRepository.save({
        name: "Admin Project to Delete",
        organizationId: savedOrg.id,
      })

      // Act
      const { data: result } = await controller.deleteProject(mockRequest, project.id)

      // Assert
      expect(result.success).toBe(true)

      const deletedProject = await projectRepository.findOne({
        where: { id: project.id },
      })
      expect(deletedProject).toBeNull()
    })

    it("should throw ForbiddenException when user is member", async () => {
      // Arrange
      const auth0Sub = "auth0|delete-member"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "member@example.com",
        },
      }
      const org = organizationFactory.build({ name: "Member Delete Org" })
      const savedOrg = await organizationRepository.save(org)

      const user = await userRepository.save({
        auth0Id: auth0Sub,
        email: "member@example.com",
      })
      await membershipRepository.save({
        userId: user.id,
        organizationId: savedOrg.id,
        role: "member",
      })

      const project = await projectRepository.save({
        name: "Should Not Delete",
        organizationId: savedOrg.id,
      })

      // Act & Assert
      await expect(controller.deleteProject(mockRequest, project.id)).rejects.toThrow(
        "User must be an owner or admin",
      )

      // Verify project still exists
      const existingProject = await projectRepository.findOne({
        where: { id: project.id },
      })
      expect(existingProject).not.toBeNull()
    })

    it("should throw NotFoundException when project does not exist", async () => {
      // Arrange
      const auth0Sub = "auth0|delete-notfound"
      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "user@example.com",
        },
      }
      const nonExistentProjectId = "00000000-0000-0000-0000-000000000000"

      // Act & Assert
      await expect(controller.deleteProject(mockRequest, nonExistentProjectId)).rejects.toThrow(
        "Project with id",
      )
    })
  })
})
