import { Module } from "@nestjs/common"
import { AuthModule } from "../auth/auth.module"
import { OrganizationsModule } from "../organizations/organizations.module"
import { UsersModule } from "../users/users.module"
import { MeController } from "./me.controller"

@Module({
  imports: [UsersModule, OrganizationsModule, AuthModule],
  controllers: [MeController],
})
export class MeModule {}
