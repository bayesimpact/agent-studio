import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { UsersModule } from "@/users/users.module"
import { Organization } from "./organization.entity"
import { OrganizationsService } from "./organizations.service"
import { UserBootstrapService } from "./user-bootstrap.service"
import { UserMembership } from "./user-membership.entity"

@Module({
  imports: [TypeOrmModule.forFeature([Organization, UserMembership]), UsersModule],
  providers: [OrganizationsService, UserBootstrapService],
  exports: [OrganizationsService, UserBootstrapService],
})
export class OrganizationsModule {}
