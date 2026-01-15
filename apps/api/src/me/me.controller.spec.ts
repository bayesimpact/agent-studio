import { Test, type TestingModule } from "@nestjs/testing"
import { organizationFactory } from "../organizations/organization.factory"
import { OrganizationsService } from "../organizations/organizations.service"
import { UserBootstrapService } from "../organizations/user-bootstrap.service"
import { userMembershipFactory } from "../organizations/user-membership.factory"
import { userFactory } from "../users/user.factory"
import { MeController } from "./me.controller"

describe("MeController", () => {
  let controller: MeController
  let userBootstrapService: jest.Mocked<UserBootstrapService>
  let organizationsService: jest.Mocked<OrganizationsService>

  beforeEach(async () => {
    const mockUserBootstrapService = {
      ensureUser: jest.fn(),
    }

    const mockOrganizationsService = {
      getUserOrganizationsWithMemberships: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeController],
      providers: [
        {
          provide: UserBootstrapService,
          useValue: mockUserBootstrapService,
        },
        {
          provide: OrganizationsService,
          useValue: mockOrganizationsService,
        },
      ],
    }).compile()

    controller = module.get<MeController>(MeController)
    userBootstrapService = module.get(UserBootstrapService)
    organizationsService = module.get(OrganizationsService)
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  describe("getMe", () => {
    it("should return user and organizations", async () => {
      // Arrange
      const auth0Sub = "auth0|123456"
      const user = userFactory.build({
        auth0Id: auth0Sub,
        email: "test@example.com",
        name: "Test User",
      })

      const organization1 = organizationFactory.build({
        id: "org-1",
        name: "Organization 1",
      })
      const organization2 = organizationFactory.build({
        id: "org-2",
        name: "Organization 2",
      })

      const _membership1 = userMembershipFactory.build({
        userId: user.id,
        organizationId: organization1.id,
        role: "owner",
        organization: organization1,
      })
      const _membership2 = userMembershipFactory.build({
        userId: user.id,
        organizationId: organization2.id,
        role: "member",
        organization: organization2,
      })

      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "test@example.com",
          name: "Test User",
          picture: "https://example.com/picture.jpg",
        },
      }

      userBootstrapService.ensureUser.mockResolvedValue(user)
      organizationsService.getUserOrganizationsWithMemberships.mockResolvedValue([
        { organization: organization1, role: "owner" },
        { organization: organization2, role: "member" },
      ])

      // Act
      const result = await controller.getMe(mockRequest)

      // Assert
      expect(userBootstrapService.ensureUser).toHaveBeenCalledWith({
        sub: auth0Sub,
        email: "test@example.com",
        name: "Test User",
        picture: "https://example.com/picture.jpg",
      })
      expect(organizationsService.getUserOrganizationsWithMemberships).toHaveBeenCalledWith(user.id)
      expect(result).toEqual({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        organizations: [
          { id: organization1.id, name: organization1.name, role: "owner" },
          { id: organization2.id, name: organization2.name, role: "member" },
        ],
      })
    })

    it("should handle user with no organizations", async () => {
      // Arrange
      const auth0Sub = "auth0|123456"
      const user = userFactory.build({
        auth0Id: auth0Sub,
        email: "test@example.com",
        name: "Test User",
      })

      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "test@example.com",
        },
      }

      userBootstrapService.ensureUser.mockResolvedValue(user)
      organizationsService.getUserOrganizationsWithMemberships.mockResolvedValue([])

      // Act
      const result = await controller.getMe(mockRequest)

      // Assert
      expect(result).toEqual({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        organizations: [],
      })
    })

    it("should handle user with null name", async () => {
      // Arrange
      const auth0Sub = "auth0|123456"
      const user = userFactory.build({
        auth0Id: auth0Sub,
        email: "test@example.com",
        name: null,
      })

      const mockRequest = {
        user: {
          sub: auth0Sub,
          email: "test@example.com",
        },
      }

      userBootstrapService.ensureUser.mockResolvedValue(user)
      organizationsService.getUserOrganizationsWithMemberships.mockResolvedValue([])

      // Act
      const result = await controller.getMe(mockRequest)

      // Assert
      expect(result.user.name).toBeNull()
    })
  })
})
