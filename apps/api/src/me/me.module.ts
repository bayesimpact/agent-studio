import { Module } from "@nestjs/common"
import { OrganizationsModule } from "../organizations/organizations.module"
import { UsersModule } from "../users/users.module"
import { MeController } from "./me.controller"

@Module({
  imports: [UsersModule, OrganizationsModule],
  controllers: [MeController],
})
export class MeModule {}
