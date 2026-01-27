import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AuthModule } from "@/auth/auth.module"
import { User } from "@/users/user.entity"
import { UsersModule } from "@/users/users.module"
import { Organization } from "./organization.entity"
import { OrganizationsController } from "./organizations.controller"
import { OrganizationsService } from "./organizations.service"
import { UserMembership } from "./user-membership.entity"

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, UserMembership, User]),
    UsersModule,
    AuthModule,
  ],
  providers: [OrganizationsService],
  controllers: [OrganizationsController],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
