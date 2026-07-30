import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AuthModule } from "@/domains/auth/auth.module"
import { RbacModule } from "@/domains/rbac/rbac.module"
import { UsersModule } from "@/domains/users/users.module"
import { TermsAcceptance } from "./terms-acceptance.entity"
import { TermsComplianceController } from "./terms-compliance.controller"
import { TermsComplianceService } from "./terms-compliance.service"
import { TermsDocument } from "./terms-document.entity"

@Module({
  imports: [
    TypeOrmModule.forFeature([TermsDocument, TermsAcceptance]),
    AuthModule,
    UsersModule,
    RbacModule,
  ],
  controllers: [TermsComplianceController],
  providers: [TermsComplianceService],
  exports: [TermsComplianceService],
})
export class TermsComplianceModule {}
