import type { OrganizationDto } from "@caseai-connect/api-contracts"
import { buildEndpointRequest } from "@/common/test/request.factory"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  type AllRepositories,
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { userFactory } from "@/domains/users/user.factory"
import { createOrganizationWithOwner } from "./organization.factory"
import { OrganizationsController } from "./organizations.controller"
import { OrganizationsModule } from "./organizations.module"
import { OrganizationsService } from "./organizations.service"

describe("OrganizationsController", () => {
  let controller: OrganizationsController
  let service: OrganizationsService
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: AllRepositories

  beforeAll(async () => {
    // Use transactional setup with OrganizationsModule import
    setup = await setupTransactionalTestDatabase({
      additionalImports: [OrganizationsModule],
    })
    // Clear database once at the start to ensure clean state
    // Individual tests use transactions with rollback for isolation
    await clearTestDatabase(setup.dataSource)
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
  })

  beforeEach(async () => {
    // Start transaction - this creates a new module with transactional providers
    await setup.startTransaction()
    // Get controller and repositories from transactional module (important!)
    controller = setup.module.get<OrganizationsController>(OrganizationsController)
    service = setup.module.get<OrganizationsService>(OrganizationsService)
    repositories = setup.getAllRepositories()

    // FIXME: @Did: rollbackTransaction does not clear data as expected
    // so we manually clear relevant tables here before each test
    // Delete in order to respect foreign key constraints
    // Use query builder to delete all records (delete({}) doesn't work with empty criteria)
    await repositories.featureFlagRepository.createQueryBuilder().delete().execute()
    await repositories.organizationMembershipRepository.createQueryBuilder().delete().execute()
    await repositories.organizationRepository.createQueryBuilder().delete().execute()
    await repositories.userRepository.createQueryBuilder().delete().execute()
  })

  afterEach(async () => {
    // Rollback transaction - automatically cleans up all data
    await setup.rollbackTransaction()
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  describe("createOrganization", () => {
    it("should create organization and make user owner", async () => {
      const user = await repositories.userRepository.save(userFactory.build())
      const body = { payload: { name: "New Organization" } }

      const { data: result } = await controller.createOrganization(buildEndpointRequest(user), body)

      // Assert
      expect(result.id).toBeDefined()
      expect(result.name).toBe("New Organization")

      // Verify organization was created
      const organization = await repositories.organizationRepository.findOne({
        where: { id: result.id },
      })
      expect(organization).not.toBeNull()
      expect(organization?.name).toBe("New Organization")

      // Verify user was created and is owner
      const reloadedUser = await repositories.userRepository.findOne({
        where: { auth0Id: user.auth0Id },
      })
      expect(reloadedUser).not.toBeNull()

      if (!reloadedUser) return

      const membership = await repositories.organizationMembershipRepository.findOne({
        where: { userId: user.id, organizationId: result.id },
      })
      expect(membership).not.toBeNull()
      expect(membership?.role).toBe("owner")
    })

    it("should reuse existing user", async () => {
      const user = await repositories.userRepository.save(userFactory.build())
      const request = buildEndpointRequest(user)
      const body1 = { payload: { name: "First Org" } }
      const body2 = { payload: { name: "Second Org" } }

      const { data: result1 } = await controller.createOrganization(request, body1)
      const userId1 = await repositories.userRepository.findOne({
        where: { auth0Id: user.auth0Id },
      })

      const { data: result2 } = await controller.createOrganization(request, body2)
      const userId2 = await repositories.userRepository.findOne({
        where: { auth0Id: user.auth0Id },
      })

      // Assert - Same user ID (idempotent)
      expect(userId1?.id).toBe(userId2?.id)

      // Both organizations should exist
      expect(result1.id).toBeDefined()
      expect(result2.id).toBeDefined()
      expect(result1.id).not.toBe(result2.id)
    })

    it("should return organization in correct format", async () => {
      const user = await repositories.userRepository.save(userFactory.build())
      const request = buildEndpointRequest(user)
      const body = { payload: { name: "Format Test Org" } }

      const response = await controller.createOrganization(request, body)

      // Assert - Check format matches expected DTO structure
      expect(response.data).toEqual({
        id: expect.any(String),
        name: "Format Test Org",
        featureFlags: [],
      } satisfies OrganizationDto)
      expect(response.data).not.toHaveProperty("organization")
      expect(response.data).not.toHaveProperty("createdAt")
      expect(response.data).not.toHaveProperty("updatedAt")
    })

    it("should reject organization name shorter than 3 characters", async () => {
      const user = await repositories.userRepository.save(userFactory.build())
      const request = buildEndpointRequest(user)
      const body = { payload: { name: "AB" } }

      await expect(controller.createOrganization(request, body)).rejects.toThrow()
    })

    it("should reject empty organization name", async () => {
      const user = await repositories.userRepository.save(userFactory.build())
      const request = buildEndpointRequest(user)
      const body = { payload: { name: "" } }

      await expect(controller.createOrganization(request, body)).rejects.toThrow()
    })

    it("should accept organization name with exactly 3 characters", async () => {
      const user = await repositories.userRepository.save(userFactory.build())
      const request = buildEndpointRequest(user)
      const body = { payload: { name: "ABC" } }

      const { data: result } = await controller.createOrganization(request, body)

      // Assert
      expect(result.name).toBe("ABC")
      expect(result.id).toBeDefined()
    })

    it("should reject organization name with only whitespace", async () => {
      const user = await repositories.userRepository.save(userFactory.build())
      const request = buildEndpointRequest(user)
      const body = { payload: { name: "     " } } // Only whitespace (trimmed would be empty)

      // Note: MinLength validator doesn't trim, so this might pass validation
      // but fail in the service layer. For now, we test that it throws.
      await expect(controller.createOrganization(request, body)).rejects.toThrow()
    })
  })

  describe("hasFeature", () => {
    it("should return true when the organization has the feature flag enabled", async () => {
      const { organization } = await createOrganizationWithOwner(repositories)
      await repositories.featureFlagRepository.save(
        repositories.featureFlagRepository.create({
          organizationId: organization.id,
          featureFlagKey: "sources_tool",
          enabled: true,
        }),
      )

      const result = await service.hasFeature({
        connectScope: { organizationId: organization.id, projectId: "" },
        feature: "sources_tool",
      })

      expect(result).toBe(true)
    })

    it("should return false when the organization does not have the feature flag", async () => {
      const { organization } = await createOrganizationWithOwner(repositories)

      const result = await service.hasFeature({
        connectScope: { organizationId: organization.id, projectId: "" },
        feature: "evaluation",
      })

      expect(result).toBe(false)
    })
  })
})
