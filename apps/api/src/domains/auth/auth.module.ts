import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { PassportModule } from "@nestjs/passport"
import { Auth0InvitationSenderService } from "./auth0-invitation-sender.service"
import { Auth0UserProvisioningService } from "./auth0-user-provisioning.service"
import { Auth0UserInfoService } from "./auth0-userinfo.service"
import { INVITATION_SENDER } from "./invitation-sender.interface"
import { JwtStrategy } from "./jwt.strategy"

@Module({
  imports: [ConfigModule, PassportModule.register({ defaultStrategy: "jwt" })],
  providers: [
    JwtStrategy,
    Auth0UserInfoService,
    Auth0UserProvisioningService,
    {
      provide: INVITATION_SENDER,
      useClass: Auth0InvitationSenderService,
    },
  ],
  exports: [PassportModule, Auth0UserInfoService, Auth0UserProvisioningService, INVITATION_SENDER],
})
export class AuthModule {}
