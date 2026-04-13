import { ExpressAdapter } from "@bull-board/express"
import { BullBoardModule } from "@bull-board/nestjs"
import { type DynamicModule, Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import basicAuth from "express-basic-auth"

import { isBullBoardEnabled } from "./bull-board-env"

@Module({})
// biome-ignore lint/complexity/noStaticOnlyClass: NestJS dynamic module pattern (`registerWhenEnabled`)
export class BullBoardAdminModule {
  static registerWhenEnabled(): DynamicModule {
    if (!isBullBoardEnabled()) {
      return {
        module: BullBoardAdminModule,
      }
    }

    return {
      module: BullBoardAdminModule,
      imports: [
        BullBoardModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const user = configService.get<string>("BULL_BOARD_USER")
            const password = configService.get<string>("BULL_BOARD_PASSWORD")
            if (!user || !password) {
              throw new Error(
                "When BULL_BOARD_ENABLED=true, set BULL_BOARD_USER and BULL_BOARD_PASSWORD for the Bull Board dashboard.",
              )
            }
            const route = configService.get<string>("BULL_BOARD_ROUTE") ?? "internal/bull-board"
            return {
              route,
              adapter: ExpressAdapter,
              middleware: basicAuth({
                challenge: true,
                users: { [user]: password },
              }),
            }
          },
        }),
      ],
    }
  }
}
