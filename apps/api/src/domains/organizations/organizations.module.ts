import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AuthModule } from "@/domains/auth/auth.module"
import { FeatureFlag } from "@/domains/feature-flags/feature-flag.entity"
import { User } from "@/domains/users/user.entity"
import { UsersModule } from "@/domains/users/users.module"
import { Organization } from "./organization.entity"
import { OrganizationsController } from "./organizations.controller"
import { OrganizationsService } from "./organizations.service"
import { OrganizationsPolicyGuard } from "./organizations-policy.guard"
import { FirstUserProvisioningService } from "./provisioning/first-user-provisioning.service"
import { OrganizationAccountProvisioningService } from "./provisioning/organization-account-provisioning.service"
import { UserMembership } from "./user-membership.entity"
import { UserMembershipService } from "./user-membership.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, UserMembership, User, FeatureFlag]),
    UsersModule,
    AuthModule,
  ],
  providers: [
    OrganizationsService,
    UserMembershipService,
    OrganizationsPolicyGuard,
    OrganizationAccountProvisioningService,
    FirstUserProvisioningService,
  ],
  controllers: [OrganizationsController],
  exports: [
    OrganizationsService,
    UserMembershipService,
    OrganizationAccountProvisioningService,
    FirstUserProvisioningService,
  ],
})
export class OrganizationsModule {}
