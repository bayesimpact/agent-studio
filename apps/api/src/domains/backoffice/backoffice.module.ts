import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AuthModule } from "@/domains/auth/auth.module"
import { UsersModule } from "@/domains/users/users.module"
import { FeatureFlag } from "../feature-flags/feature-flag.entity"
import { Organization } from "../organizations/organization.entity"
import { Project } from "../projects/project.entity"
import { User } from "../users/user.entity"
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
