import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"

import { ChatModule } from "./chat/chat.module"
import { PrendresoinModule } from "./prendresoin/prendresoin.module"

@Module({
  imports: [ConfigModule.forRoot(), ChatModule, PrendresoinModule],
})
export class AppModule {}
