import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { Auth0UserInfoService } from "@/auth/auth0-userinfo.service"
import { getAccessToken } from "@/common/utils/get-access-token"
import type { EndpointRequest, JwtPayload } from "@/request.interface"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { UsersService } from "@/users/users.service"

@Injectable()
export class UserGuard implements CanActivate {
  constructor(
    private readonly usersService: UsersService,
    private readonly auth0UserInfoService: Auth0UserInfoService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    const accessToken = getAccessToken(request.headers.authorization)
    if (!accessToken) {
      throw new UnauthorizedException("Access token not found")
    }

    const jwtPayload: JwtPayload = request.user

    if (!jwtPayload || !jwtPayload.sub) {
      throw new UnauthorizedException("Sub not found in request")
    }

    try {
      const user = await this.usersService.findOrCreate({
        sub: jwtPayload.sub,
        getUserInfo: () => this.auth0UserInfoService.getUserInfo(accessToken),
      })

      request.user = {
        ...jwtPayload,
        ...user,
        createdAt: user.createdAt.getTime(),
        updatedAt: user.updatedAt.getTime(),
      } as EndpointRequest["user"]
      return true
    } catch (error) {
      throw new UnauthorizedException("Could not ensure user exists", error as Error)
    }
  }
}
