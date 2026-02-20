import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AuthModule } from "@/domains/auth/auth.module"
import { User } from "@/domains/users/user.entity"
import { UsersModule } from "@/domains/users/users.module"
import { Organization } from "./organization.entity"
import { OrganizationsController } from "./organizations.controller"
import { OrganizationsService } from "./organizations.service"
import { OrganizationsPolicyGuard } from "./organizations-policy.guard"
import { UserMembership } from "./user-membership.entity"
import { UserMembershipService } from "./user-membership.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, UserMembership, User]),
    UsersModule,
    AuthModule,
  ],
  providers: [OrganizationsService, UserMembershipService, OrganizationsPolicyGuard],
  controllers: [OrganizationsController],
  exports: [OrganizationsService, UserMembershipService],
})
export class OrganizationsModule {}
