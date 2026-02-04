import type { TestingModuleBuilder } from "@nestjs/testing"
import { Auth0UserInfoService } from "@/auth/auth0-userinfo.service"
import { JwtAuthGuard } from "@/auth/jwt-auth.guard"

const mockAuth0UserInfoService = {
  getUserInfo: jest.fn().mockResolvedValue({
    sub: "auth0|123",
    email: "test@example.com",
    name: "Test User",
    picture: "http://picture.url",
  }),
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
}
