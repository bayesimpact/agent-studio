import { ForbiddenException, NotFoundException } from "@nestjs/common"
import type { Repository } from "typeorm"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { Organization } from "@/organizations/organization.entity"
import {
  createOrganizationWithOwner,
  organizationFactory,
} from "@/organizations/organization.factory"
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
    setup = await setupTransactionalTestDatabase({
      featureEntities: [Project, Organization, UserMembership, User],
      additionalImports: [ProjectsModule],
    })
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
    it("should create a project", async () => {
      // Arrange
      const { organization } = await createOrganizationWithOwner(setup.getAllRepositories())

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
      // Arrange
      const { organization } = await createOrganizationWithOwner(setup.getAllRepositories())

      const project1 = projectFactory.transient({ organization }).build({
        name: "Project 1",
      })
      const project2 = projectFactory.transient({ organization }).build({
        name: "Project 2",
      })
      await projectRepository.save([project1, project2])

      // Act
      const result = await service.listProjects(organization.id)

      // Assert
      expect(result).toHaveLength(2)
      expect(result.map((project) => project.name)).toContain("Project 1")
      expect(result.map((project) => project.name)).toContain("Project 2")
    })

    it("should return empty array when organization has no projects", async () => {
      // Arrange
      const { organization } = await createOrganizationWithOwner(setup.getAllRepositories())

      // Act
      const result = await service.listProjects(organization.id)

      // Assert
      expect(result).toEqual([])
    })

    it("should return projects ordered by createdAt DESC", async () => {
      // Arrange
      const { organization } = await createOrganizationWithOwner(setup.getAllRepositories())

      const project1 = projectFactory.transient({ organization }).build({
        name: "First Project",
        createdAt: new Date("2024-01-01"),
      })
      const project2 = projectFactory.transient({ organization }).build({
        name: "Second Project",
        createdAt: new Date("2024-01-02"),
      })
      await projectRepository.save([project1, project2])

      // Act
      const result = await service.listProjects(organization.id)

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

      const project = projectFactory.transient({ organization: savedOrg }).build({
        name: "Project to Delete",
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

      const project = projectFactory.transient({ organization: savedOrg }).build({
        name: "Admin Project to Delete",
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

      const project = projectFactory.transient({ organization: savedOrg }).build({
        name: "Should Not Delete",
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

      const project = projectFactory.transient({ organization: savedOrg }).build({
        name: "Other Project",
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
