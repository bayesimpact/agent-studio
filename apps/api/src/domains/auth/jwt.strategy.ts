import { Injectable } from "@nestjs/common"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { ConfigService } from "@nestjs/config"
import { PassportStrategy } from "@nestjs/passport"
import { passportJwtSecret } from "jwks-rsa"
import { ExtractJwt, Strategy } from "passport-jwt"

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${configService.get<string>("AUTH0_ISSUER_URL")}.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: configService.get<string>("AUTH0_AUDIENCE"),
      issuer: configService.get<string>("AUTH0_ISSUER_URL"),
      algorithms: ["RS256"],
    })
  }

  validate(payload: unknown): unknown {
    return payload
  }
}
