import { Injectable } from "@nestjs/common"
import type { Auth0ProvisionedUser } from "@/domains/auth/auth0-user-provisioning.service"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { Auth0UserProvisioningService } from "@/domains/auth/auth0-user-provisioning.service"
import type { ProvisionOrganizationAccountResult } from "./organization-account-provisioning.service"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { OrganizationAccountProvisioningService } from "./organization-account-provisioning.service"

export type FirstUserProvisioningInput = {
  email: string
  organizationName: string
  fullName?: string | null
}

export type FirstUserProvisioningResult = {
  status: ProvisionOrganizationAccountResult["status"]
  email: string
  organizationName: string
  message: string
  organizationId?: string
  userId?: string
  auth0UserId?: string
}

@Injectable()
export class FirstUserProvisioningService {
  constructor(
    private readonly auth0UserProvisioningService: Auth0UserProvisioningService,
    private readonly organizationAccountProvisioningService: OrganizationAccountProvisioningService,
  ) {}

  async provisionFirstUser(
    input: FirstUserProvisioningInput,
  ): Promise<FirstUserProvisioningResult> {
    const normalizedEmail = input.email.trim().toLowerCase()
    const normalizedOrganizationName = input.organizationName.trim()
    const fullName = input.fullName?.trim() || null

    const auth0User = await this.auth0UserProvisioningService.findOrCreateUserByEmail({
      email: normalizedEmail,
      fullName,
    })

    await this.auth0UserProvisioningService.ensureUserInDefaultOrganization(auth0User.userId)

    const localProvisioningResult =
      await this.organizationAccountProvisioningService.provisionOrganizationAccount({
        auth0UserId: auth0User.userId,
        email: normalizedEmail,
        fullName,
        organizationName: normalizedOrganizationName,
      })

    await this.auth0UserProvisioningService.sendPasswordResetEmail(auth0User.email)

    return this.toResult({
      localProvisioningResult,
      auth0User,
      email: normalizedEmail,
      organizationName: normalizedOrganizationName,
    })
  }

  async previewProvisioning(input: FirstUserProvisioningInput): Promise<{
    email: string
    organizationName: string
    status: "would_create" | "would_skip_duplicate"
  }> {
    const normalizedEmail = input.email.trim().toLowerCase()
    const normalizedOrganizationName = input.organizationName.trim()

    const auth0User = await this.auth0UserProvisioningService.findOrCreateUserByEmail({
      email: normalizedEmail,
      fullName: input.fullName?.trim() || null,
    })

    const alreadyProvisioned =
      await this.organizationAccountProvisioningService.isAlreadyProvisioned({
        auth0UserId: auth0User.userId,
        email: normalizedEmail,
        organizationName: normalizedOrganizationName,
      })

    return {
      email: normalizedEmail,
      organizationName: normalizedOrganizationName,
      status: alreadyProvisioned ? "would_skip_duplicate" : "would_create",
    }
  }

  private toResult(params: {
    localProvisioningResult: ProvisionOrganizationAccountResult
    auth0User: Auth0ProvisionedUser
    email: string
    organizationName: string
  }): FirstUserProvisioningResult {
    if (params.localProvisioningResult.status === "skipped_duplicate") {
      return {
        status: "skipped_duplicate",
        email: params.email,
        organizationName: params.organizationName,
        organizationId: params.localProvisioningResult.organizationId,
        userId: params.localProvisioningResult.userId,
        auth0UserId: params.auth0User.userId,
        message: "Local account already provisioned. Password reset email sent.",
      }
    }

    return {
      status: "created",
      email: params.email,
      organizationName: params.organizationName,
      organizationId: params.localProvisioningResult.organizationId,
      userId: params.localProvisioningResult.userId,
      auth0UserId: params.auth0User.userId,
      message: "Created local account and sent password reset email.",
    }
  }
}
