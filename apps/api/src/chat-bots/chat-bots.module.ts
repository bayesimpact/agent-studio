import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AuthModule } from "@/auth/auth.module"
import { OrganizationsModule } from "@/organizations/organizations.module"
import { UserMembership } from "@/organizations/user-membership.entity"
import { Project } from "@/projects/project.entity"
import { UsersModule } from "@/users/users.module"
import { ChatBot } from "./chat-bot.entity"
import { ChatBotsController } from "./chat-bots.controller"
import { ChatBotsService } from "./chat-bots.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatBot, Project, UserMembership]),
    OrganizationsModule,
    UsersModule,
    AuthModule,
  ],
  providers: [ChatBotsService],
  controllers: [ChatBotsController],
  exports: [ChatBotsService],
})
export class ChatBotsModule {}
