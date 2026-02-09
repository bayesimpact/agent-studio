import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { PassportModule } from "@nestjs/passport"
import { Auth0UserInfoService } from "./auth0-userinfo.service"
import { JwtStrategy } from "./jwt.strategy"

@Module({
  imports: [ConfigModule, PassportModule.register({ defaultStrategy: "jwt" })],
  providers: [JwtStrategy, Auth0UserInfoService],
  exports: [PassportModule, Auth0UserInfoService],
})
export class AuthModule {}
