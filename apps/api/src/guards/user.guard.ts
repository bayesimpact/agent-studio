import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common"
import { normalizeAuth0Name } from "@/auth/auth0-userinfo.helper"
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
      // TODO: const user = await this.userBootstrapService.ensureUserExists(jwtPayload, accessToken)
      let user = await this.usersService.findByAuth0Id(jwtPayload.sub)
      if (!user) {
        const auth0UserInfo = await this.auth0UserInfoService.getUserInfo(accessToken)
        user = await this.usersService.create({
          sub: auth0UserInfo.sub,
          email: auth0UserInfo.email,
          name: normalizeAuth0Name(auth0UserInfo.name, auth0UserInfo.email),
          picture: auth0UserInfo.picture,
        })
      }

      request.user = {
        ...jwtPayload,
        ...user,
        createdAt: user.createdAt.getTime(),
        updatedAt: user.updatedAt.getTime(),
      } as EndpointRequest["user"]
      return true
    } catch (_error) {
      throw new UnauthorizedException("Could not ensure user exists")
    }
  }
}
