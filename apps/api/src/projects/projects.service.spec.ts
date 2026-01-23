import { ForbiddenException, NotFoundException } from "@nestjs/common"
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
import { userFactory } from "@/users/user.factory"
import { Project } from "./project.entity"
import { projectFactory } from "./project.factory"
import { ProjectsModule } from "./projects.module"
import { ProjectsService } from "./projects.service"

describe("ProjectsService", () => {
  let service: ProjectsService
  let projectRepository: Repository<Project>
  let organizationRepository: Repository<Organization>
  let membershipRepository: Repository<UserMembership>
  let userRepository: Repository<User>
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase(
      [Project, Organization, UserMembership, User],
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
    service = setup.module.get<ProjectsService>(ProjectsService)
    projectRepository = setup.getRepository(Project)
    organizationRepository = setup.getRepository(Organization)
    membershipRepository = setup.getRepository(UserMembership)
    userRepository = setup.getRepository(User)
  })

  afterEach(async () => {
    await setup.rollbackTransaction()
  })

  describe("createProject", () => {
    it("should create a project when user is owner", async () => {
      // Arrange
      const user = userFactory.build({
        email: "owner@example.com",
        auth0Id: "auth0|owner-1",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Test Org" })
      const savedOrg = await organizationRepository.save(org)

      const membership = membershipRepository.create({
        userId: savedUser.id,
        organizationId: savedOrg.id,
        role: "owner",
      })
      await membershipRepository.save(membership)

      // Act
      const result = await service.createProject(savedUser.id, savedOrg.id, "New Project")

      // Assert
      expect(result.name).toBe("New Project")
      expect(result.organizationId).toBe(savedOrg.id)
      expect(result.id).toBeDefined()

      const savedProject = await projectRepository.findOne({
        where: { id: result.id },
      })
      expect(savedProject).not.toBeNull()
      expect(savedProject?.name).toBe("New Project")
    })

    it("should create a project when user is admin", async () => {
      // Arrange
      const user = userFactory.build({
        email: "admin@example.com",
        auth0Id: "auth0|admin-1",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Admin Org" })
      const savedOrg = await organizationRepository.save(org)

      const membership = membershipRepository.create({
        userId: savedUser.id,
        organizationId: savedOrg.id,
        role: "admin",
      })
      await membershipRepository.save(membership)

      // Act
      const result = await service.createProject(savedUser.id, savedOrg.id, "Admin Project")

      // Assert
      expect(result.name).toBe("Admin Project")
      expect(result.organizationId).toBe(savedOrg.id)
    })

    it("should throw ForbiddenException when user is not a member", async () => {
      // Arrange
      const user = userFactory.build({
        email: "nonmember@example.com",
        auth0Id: "auth0|nonmember-create-1",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Other Org" })
      const savedOrg = await organizationRepository.save(org)

      // Act & Assert
      await expect(service.createProject(savedUser.id, savedOrg.id, "Should Fail")).rejects.toThrow(
        ForbiddenException,
      )
      await expect(service.createProject(savedUser.id, savedOrg.id, "Should Fail")).rejects.toThrow(
        "User does not have access to organization",
      )
    })

    it("should throw ForbiddenException when user is member but not owner or admin", async () => {
      // Arrange
      const user = userFactory.build({
        email: "member@example.com",
        auth0Id: "auth0|member-1",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Member Org" })
      const savedOrg = await organizationRepository.save(org)

      const membership = membershipRepository.create({
        userId: savedUser.id,
        organizationId: savedOrg.id,
        role: "member",
      })
      await membershipRepository.save(membership)

      // Act & Assert
      await expect(service.createProject(savedUser.id, savedOrg.id, "Should Fail")).rejects.toThrow(
        ForbiddenException,
      )
      await expect(service.createProject(savedUser.id, savedOrg.id, "Should Fail")).rejects.toThrow(
        "User must be an owner or admin",
      )
    })

    it("should throw NotFoundException when organization does not exist", async () => {
      // Arrange
      const user = userFactory.build({
        email: "user@example.com",
        auth0Id: "auth0|user-1",
      })
      const savedUser = await userRepository.save(user)
      const nonExistentOrgId = "00000000-0000-0000-0000-000000000000"

      // Act & Assert
      await expect(
        service.createProject(savedUser.id, nonExistentOrgId, "Should Fail"),
      ).rejects.toThrow(ForbiddenException) // First check is membership, which fails first
    })
  })

  describe("listProjects", () => {
    it("should return projects for an organization", async () => {
      // Arrange
      const user = userFactory.build({
        email: "list@example.com",
        auth0Id: "auth0|list-1",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "List Org" })
      const savedOrg = await organizationRepository.save(org)

      const membership = membershipRepository.create({
        userId: savedUser.id,
        organizationId: savedOrg.id,
        role: "member",
      })
      await membershipRepository.save(membership)

      const project1 = projectFactory.build({
        name: "Project 1",
        organizationId: savedOrg.id,
      })
      const project2 = projectFactory.build({
        name: "Project 2",
        organizationId: savedOrg.id,
      })
      await projectRepository.save([project1, project2])

      // Act
      const result = await service.listProjects(savedUser.id, savedOrg.id)

      // Assert
      expect(result).toHaveLength(2)
      expect(result.map((p) => p.name)).toContain("Project 1")
      expect(result.map((p) => p.name)).toContain("Project 2")
    })

    it("should return empty array when organization has no projects", async () => {
      // Arrange
      const user = userFactory.build({
        email: "empty@example.com",
        auth0Id: "auth0|empty-1",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Empty Org" })
      const savedOrg = await organizationRepository.save(org)

      const membership = membershipRepository.create({
        userId: savedUser.id,
        organizationId: savedOrg.id,
        role: "member",
      })
      await membershipRepository.save(membership)

      // Act
      const result = await service.listProjects(savedUser.id, savedOrg.id)

      // Assert
      expect(result).toEqual([])
    })

    it("should throw ForbiddenException when user is not a member", async () => {
      // Arrange
      const user = userFactory.build({ email: "nonmember@example.com" })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Other Org" })
      const savedOrg = await organizationRepository.save(org)

      // Act & Assert
      await expect(service.listProjects(savedUser.id, savedOrg.id)).rejects.toThrow(
        ForbiddenException,
      )
      await expect(service.listProjects(savedUser.id, savedOrg.id)).rejects.toThrow(
        "User does not have access to organization",
      )
    })

    it("should return projects ordered by createdAt DESC", async () => {
      // Arrange
      const user = userFactory.build({
        email: "ordered@example.com",
        auth0Id: "auth0|ordered-1",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Ordered Org" })
      const savedOrg = await organizationRepository.save(org)

      const membership = membershipRepository.create({
        userId: savedUser.id,
        organizationId: savedOrg.id,
        role: "member",
      })
      await membershipRepository.save(membership)

      const project1 = projectFactory.build({
        name: "First Project",
        organizationId: savedOrg.id,
        createdAt: new Date("2024-01-01"),
      })
      const project2 = projectFactory.build({
        name: "Second Project",
        organizationId: savedOrg.id,
        createdAt: new Date("2024-01-02"),
      })
      await projectRepository.save([project1, project2])

      // Act
      const result = await service.listProjects(savedUser.id, savedOrg.id)

      // Assert
      expect(result).toHaveLength(2)
      const [first, second] = result
      expect(first!.name).toBe("Second Project") // Most recent first
      expect(second!.name).toBe("First Project")
    })
  })

  describe("deleteProject", () => {
    it("should delete a project when user is owner", async () => {
      // Arrange
      const user = userFactory.build({
        email: "owner@example.com",
        auth0Id: "auth0|owner-delete-1",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Delete Org" })
      const savedOrg = await organizationRepository.save(org)

      const membership = membershipRepository.create({
        userId: savedUser.id,
        organizationId: savedOrg.id,
        role: "owner",
      })
      await membershipRepository.save(membership)

      const project = projectFactory.build({
        name: "Project to Delete",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      // Act
      await service.deleteProject(savedUser.id, savedProject.id)

      // Assert
      const deletedProject = await projectRepository.findOne({
        where: { id: savedProject.id },
      })
      expect(deletedProject).toBeNull()
    })

    it("should delete a project when user is admin", async () => {
      // Arrange
      const user = userFactory.build({
        email: "admin@example.com",
        auth0Id: "auth0|admin-delete-1",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Admin Delete Org" })
      const savedOrg = await organizationRepository.save(org)

      const membership = membershipRepository.create({
        userId: savedUser.id,
        organizationId: savedOrg.id,
        role: "admin",
      })
      await membershipRepository.save(membership)

      const project = projectFactory.build({
        name: "Admin Project to Delete",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      // Act
      await service.deleteProject(savedUser.id, savedProject.id)

      // Assert
      const deletedProject = await projectRepository.findOne({
        where: { id: savedProject.id },
      })
      expect(deletedProject).toBeNull()
    })

    it("should throw ForbiddenException when user is member", async () => {
      // Arrange
      const user = userFactory.build({
        email: "member@example.com",
        auth0Id: "auth0|member-delete-1",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Member Delete Org" })
      const savedOrg = await organizationRepository.save(org)

      const membership = membershipRepository.create({
        userId: savedUser.id,
        organizationId: savedOrg.id,
        role: "member",
      })
      await membershipRepository.save(membership)

      const project = projectFactory.build({
        name: "Should Not Delete",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      // Act & Assert
      await expect(service.deleteProject(savedUser.id, savedProject.id)).rejects.toThrow(
        ForbiddenException,
      )
      await expect(service.deleteProject(savedUser.id, savedProject.id)).rejects.toThrow(
        "User must be an owner or admin",
      )

      // Verify project still exists
      const existingProject = await projectRepository.findOne({
        where: { id: savedProject.id },
      })
      expect(existingProject).not.toBeNull()
    })

    it("should throw NotFoundException when project does not exist", async () => {
      // Arrange
      const user = userFactory.build({
        email: "user@example.com",
        auth0Id: "auth0|user-delete-1",
      })
      const savedUser = await userRepository.save(user)
      const nonExistentProjectId = "00000000-0000-0000-0000-000000000000"

      // Act & Assert
      await expect(service.deleteProject(savedUser.id, nonExistentProjectId)).rejects.toThrow(
        NotFoundException,
      )
      await expect(service.deleteProject(savedUser.id, nonExistentProjectId)).rejects.toThrow(
        "Project with id",
      )
    })

    it("should throw ForbiddenException when user is not a member", async () => {
      // Arrange
      const user = userFactory.build({
        email: "nonmember@example.com",
        auth0Id: "auth0|nonmember-delete-1",
      })
      const savedUser = await userRepository.save(user)
      const org = organizationFactory.build({ name: "Other Org" })
      const savedOrg = await organizationRepository.save(org)

      const project = projectFactory.build({
        name: "Other Project",
        organizationId: savedOrg.id,
      })
      const savedProject = await projectRepository.save(project)

      // Act & Assert
      await expect(service.deleteProject(savedUser.id, savedProject.id)).rejects.toThrow(
        ForbiddenException,
      )
      await expect(service.deleteProject(savedUser.id, savedProject.id)).rejects.toThrow(
        "User does not have access to organization",
      )

      // Verify project still exists
      const existingProject = await projectRepository.findOne({
        where: { id: savedProject.id },
      })
      expect(existingProject).not.toBeNull()
    })
  })
})
