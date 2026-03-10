import { Test, type TestingModule } from "@nestjs/testing"
import { Auth0UserProvisioningService } from "@/domains/auth/auth0-user-provisioning.service"
import { FirstUserProvisioningService } from "./first-user-provisioning.service"
import { OrganizationAccountProvisioningService } from "./organization-account-provisioning.service"

describe("FirstUserProvisioningService", () => {
  let service: FirstUserProvisioningService
  let auth0UserProvisioningService: {
    findOrCreateUserByEmail: jest.Mock
    ensureUserInDefaultOrganization: jest.Mock
    sendPasswordResetEmail: jest.Mock
  }
  let organizationAccountProvisioningService: {
    provisionOrganizationAccount: jest.Mock
    isAlreadyProvisioned: jest.Mock
  }

  beforeEach(async () => {
    auth0UserProvisioningService = {
      findOrCreateUserByEmail: jest.fn(),
      ensureUserInDefaultOrganization: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
    }
    organizationAccountProvisioningService = {
      provisionOrganizationAccount: jest.fn(),
      isAlreadyProvisioned: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirstUserProvisioningService,
        {
          provide: Auth0UserProvisioningService,
          useValue: auth0UserProvisioningService,
        },
        {
          provide: OrganizationAccountProvisioningService,
          useValue: organizationAccountProvisioningService,
        },
      ],
    }).compile()

    service = module.get<FirstUserProvisioningService>(FirstUserProvisioningService)
  })

  it("should provision a first user and send reset email", async () => {
    auth0UserProvisioningService.findOrCreateUserByEmail.mockResolvedValue({
      userId: "auth0|123",
      email: "user@example.com",
    })
    organizationAccountProvisioningService.provisionOrganizationAccount.mockResolvedValue({
      status: "created",
      organizationId: "org1",
      userId: "user1",
    })

    const result = await service.provisionFirstUser({
      email: "user@example.com",
      organizationName: "Demo Org",
      fullName: "Demo User",
    })

    expect(auth0UserProvisioningService.ensureUserInDefaultOrganization).toHaveBeenCalledWith(
      "auth0|123",
    )
    expect(auth0UserProvisioningService.sendPasswordResetEmail).toHaveBeenCalledWith(
      "user@example.com",
    )
    expect(result.status).toBe("created")
  })

  it("should still send reset email when duplicate is skipped", async () => {
    auth0UserProvisioningService.findOrCreateUserByEmail.mockResolvedValue({
      userId: "auth0|123",
      email: "duplicate@example.com",
    })
    organizationAccountProvisioningService.provisionOrganizationAccount.mockResolvedValue({
      status: "skipped_duplicate",
      organizationId: "org_existing",
      userId: "user_existing",
    })

    const result = await service.provisionFirstUser({
      email: "duplicate@example.com",
      organizationName: "Demo Org",
    })

    expect(auth0UserProvisioningService.sendPasswordResetEmail).toHaveBeenCalledWith(
      "duplicate@example.com",
    )
    expect(result.status).toBe("skipped_duplicate")
  })

  it("should return preview status from duplicate check", async () => {
    auth0UserProvisioningService.findOrCreateUserByEmail.mockResolvedValue({
      userId: "auth0|123",
      email: "preview@example.com",
    })
    organizationAccountProvisioningService.isAlreadyProvisioned.mockResolvedValue(true)

    const preview = await service.previewProvisioning({
      email: "preview@example.com",
      organizationName: "Preview Org",
    })

    expect(preview).toEqual({
      email: "preview@example.com",
      organizationName: "Preview Org",
      status: "would_skip_duplicate",
    })
  })
})
