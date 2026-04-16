import { ExpressAdapter } from "@bull-board/express"
import { BullBoardModule } from "@bull-board/nestjs"
import { type DynamicModule, Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"

import { isBullBoardEnabled } from "./bull-board-env"
import { buildBullBoardAccessMiddleware } from "./bull-board-openid-config"

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
            const route = configService.get<string>("BULL_BOARD_ROUTE") ?? "internal/bull-board"
            return {
              route,
              adapter: ExpressAdapter,
              middleware: buildBullBoardAccessMiddleware(),
            }
          },
        }),
      ],
    }
  }
}
