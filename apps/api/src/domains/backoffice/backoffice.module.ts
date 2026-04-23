import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AuthModule } from "@/domains/auth/auth.module"
import { FeatureFlag } from "@/domains/feature-flags/feature-flag.entity"
import { Organization } from "@/domains/organizations/organization.entity"
import { Project } from "@/domains/projects/project.entity"
import { User } from "@/domains/users/user.entity"
import { UsersModule } from "@/domains/users/users.module"
import { BackofficeController } from "./backoffice.controller"
import { BackofficeGuard } from "./backoffice.guard"
import { BackofficeService } from "./backoffice.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, Project, FeatureFlag, User]),
    UsersModule,
    AuthModule,
  ],
  controllers: [BackofficeController],
  providers: [BackofficeService, BackofficeGuard],
})
export class BackofficeModule {}
