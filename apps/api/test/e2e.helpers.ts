import type { TestingModuleBuilder } from "@nestjs/testing"
import { Auth0UserInfoService } from "@/domains/auth/auth0-userinfo.service"
import { INVITATION_SENDER } from "@/domains/auth/invitation-sender.interface"
import { JwtAuthGuard } from "@/domains/auth/jwt-auth.guard"

const mockAuth0UserInfoService = {
  getUserInfo: jest.fn().mockResolvedValue({
    sub: "auth0|123",
    email: "test@example.com",
    name: "Test User",
    picture: "http://picture.url",
  }),
}

let mockTicketCounter = 0
export const mockInvitationSender = {
  sendInvitation: jest.fn().mockImplementation(() => {
    mockTicketCounter += 1
    return Promise.resolve({ ticketId: `ticket_${mockTicketCounter}` })
  }),
  resetTicketCounter: () => {
    mockTicketCounter = 0
  },
}

export const setupUserGuardForTesting = (
  moduleBuilder: TestingModuleBuilder,
  buildAuth0Id: () => string,
): TestingModuleBuilder => {
  return moduleBuilder
    .overrideGuard(JwtAuthGuard)
    .useValue({
      // biome-ignore lint/suspicious/noExplicitAny: for test only
      canActivate: (context: any) => {
        const request = context.switchToHttp().getRequest()
        request.user = { sub: buildAuth0Id() }
        return true
      },
    })
    .overrideProvider(Auth0UserInfoService)
    .useValue(mockAuth0UserInfoService)
    .overrideProvider(INVITATION_SENDER)
    .useValue(mockInvitationSender)
}
