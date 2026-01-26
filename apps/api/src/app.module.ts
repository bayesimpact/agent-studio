import { Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"

import { AuthModule } from "./auth/auth.module"
import { ChatBotsModule } from "./chat-bots/chat-bots.module"
import typeorm from "./config/typeorm"
import { MeModule } from "./me/me.module"
import { OrganizationsModule } from "./organizations/organizations.module"
import { ProjectsModule } from "./projects/projects.module"
import { ProtectedModule } from "./protected/protected.module"
import { UsersModule } from "./users/users.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeorm],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => configService.get("typeorm")(),
    }),
    AuthModule,
    ProtectedModule,
    UsersModule,
    OrganizationsModule,
    ProjectsModule,
    ChatBotsModule,
    MeModule,
  ],
})
export class AppModule {}
