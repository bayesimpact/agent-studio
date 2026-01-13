import { Module } from "@nestjs/common"
import { AIModule } from "../ai/ai.module"
import { PrendresoinController } from "./prendresoin.controller"
import { PrendresoinService } from "./prendresoin.service"

@Module({
  imports: [AIModule],
  controllers: [PrendresoinController],
  providers: [PrendresoinService],
})
export class PrendresoinModule {}
