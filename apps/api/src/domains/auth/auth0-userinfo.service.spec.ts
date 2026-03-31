import { ConfigService } from "@nestjs/config"
import { Test, type TestingModule } from "@nestjs/testing"
import { Auth0UserInfoService } from "./auth0-userinfo.service"

// Mock fetch globally
global.fetch = jest.fn()

describe("Auth0UserInfoService", () => {
  let service: Auth0UserInfoService
  let _configService: ConfigService
  let module: TestingModule

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        Auth0UserInfoService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === "AUTH0_ISSUER_URL") {
                return "https://test-tenant.auth0.com/"
              }
              return undefined
            }),
          },
        },
      ],
    }).compile()

    service = module.get<Auth0UserInfoService>(Auth0UserInfoService)
    _configService = module.get<ConfigService>(ConfigService)
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe("getUserInfo", () => {
    it("should fetch user info from Auth0 UserInfo endpoint", async () => {
      // Arrange
      const accessToken = "test-access-token"
      const mockUserInfo = {
        sub: "auth0|123456",
        email: "test@example.com",
        name: "Test User",
        picture: "https://example.com/picture.jpg",
        email_verified: true,
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserInfo,
      })

      // Act
      const result = await service.getUserInfo(accessToken)

      // Assert
      expect(global.fetch).toHaveBeenCalledWith("https://test-tenant.auth0.com/userinfo", {
        method: "GET",
        headers: {
          Authorization: "Bearer test-access-token",
          "Content-Type": "application/json",
        },
      })
      expect(result).toEqual(mockUserInfo)
    })

    it("should handle Auth0 issuer URL with trailing slash", async () => {
      // Arrange
      const configServiceWithSlash = {
        get: jest.fn((key: string) => {
          if (key === "AUTH0_ISSUER_URL") {
            return "https://test-tenant.auth0.com/" // With trailing slash
          }
          return undefined
        }),
      }

      const moduleWithSlash = await Test.createTestingModule({
        providers: [
          Auth0UserInfoService,
          {
            provide: ConfigService,
            useValue: configServiceWithSlash,
          },
        ],
      }).compile()

      const serviceWithSlash = moduleWithSlash.get<Auth0UserInfoService>(Auth0UserInfoService)

      const accessToken = "test-token"
      const mockUserInfo = {
        sub: "auth0|123",
        email: "test@example.com",
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserInfo,
      })

      // Act
      await serviceWithSlash.getUserInfo(accessToken)

      // Assert - Should remove trailing slash
      expect(global.fetch).toHaveBeenCalledWith(
        "https://test-tenant.auth0.com/userinfo",
        expect.any(Object),
      )
    })

    it("should throw error when AUTH0_ISSUER_URL is not configured", async () => {
      // Arrange
      const moduleWithoutConfig = await Test.createTestingModule({
        providers: [
          Auth0UserInfoService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(() => undefined),
            },
          },
        ],
      }).compile()

      const serviceWithoutConfig =
        moduleWithoutConfig.get<Auth0UserInfoService>(Auth0UserInfoService)

      // Act & Assert
      await expect(serviceWithoutConfig.getUserInfo("token")).rejects.toThrow(
        "AUTH0_ISSUER_URL is not configured",
      )
    })

    it("should throw error when Auth0 API returns error status", async () => {
      // Arrange
      const accessToken = "invalid-token"
      const errorResponse = { error: "invalid_token", error_description: "Token expired" }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify(errorResponse),
      })

      // Act & Assert
      await expect(service.getUserInfo(accessToken)).rejects.toThrow(
        "Failed to fetch user info from Auth0: 401",
      )
    })

    it("should handle network errors", async () => {
      // Arrange
      const accessToken = "test-token"
      const networkError = new Error("Network request failed")

      ;(global.fetch as jest.Mock).mockRejectedValueOnce(networkError)

      // Act & Assert
      await expect(service.getUserInfo(accessToken)).rejects.toThrow(networkError)
    })

    it("should handle non-JSON error responses", async () => {
      // Arrange
      const accessToken = "test-token"

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      })

      // Act & Assert
      await expect(service.getUserInfo(accessToken)).rejects.toThrow(
        "Failed to fetch user info from Auth0: 500",
      )
    })

    it("should return user info with all optional fields", async () => {
      // Arrange
      const accessToken = "test-token"
      const mockUserInfo = {
        sub: "auth0|123456",
        email: "full@example.com",
        name: "Full User",
        picture: "https://example.com/picture.jpg",
        email_verified: true,
        nickname: "fulluser",
        given_name: "Full",
        family_name: "User",
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserInfo,
      })

      // Act
      const result = await service.getUserInfo(accessToken)

      // Assert
      expect(result).toEqual(mockUserInfo)
    })

    it("should return user info with minimal fields", async () => {
      // Arrange
      const accessToken = "test-token"
      const mockUserInfo = {
        sub: "auth0|minimal",
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserInfo,
      })

      // Act
      const result = await service.getUserInfo(accessToken)

      // Assert
      expect(result).toEqual(mockUserInfo)
      expect(result.email).toBeUndefined()
      expect(result.name).toBeUndefined()
    })
  })
})
