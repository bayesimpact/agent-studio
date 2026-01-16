import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { User } from "@/users/user.entity"
import { UsersModule } from "@/users/users.module"
import { Organization } from "./organization.entity"
import { OrganizationsController } from "./organizations.controller"
import { OrganizationsService } from "./organizations.service"
import { UserBootstrapService } from "./user-bootstrap.service"
import { UserMembership } from "./user-membership.entity"

@Module({
  imports: [TypeOrmModule.forFeature([Organization, UserMembership, User]), UsersModule],
  providers: [OrganizationsService, UserBootstrapService],
  controllers: [OrganizationsController],
  exports: [OrganizationsService, UserBootstrapService],
})
export class OrganizationsModule {}
