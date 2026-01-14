import { Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"

import { AuthModule } from "./auth/auth.module"
import { ChatModule } from "./chat/chat.module"
import typeorm from "./config/typeorm"
import { PrendresoinModule } from "./prendresoin/prendresoin.module"
import { ProtectedModule } from "./protected/protected.module"

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
    ChatModule,
    PrendresoinModule,
    ProtectedModule,
  ],
})
export class AppModule {}
