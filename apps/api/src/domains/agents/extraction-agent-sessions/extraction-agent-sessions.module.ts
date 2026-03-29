import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import {
  moduleFeatures,
  moduleImports,
  moduleProviders,
} from "../base-agent-sessions/base-agent-sessions-module.helpers"
import { ExtractionAgentSessionsController } from "./extraction-agent-sessions.controller"
import { ExtractionAgentSessionsService } from "./extraction-agent-sessions.service"

@Module({
  imports: [TypeOrmModule.forFeature([...moduleFeatures]), ...moduleImports],
  providers: [...moduleProviders, ExtractionAgentSessionsService],
  controllers: [ExtractionAgentSessionsController],
  exports: [ExtractionAgentSessionsService],
})
export class ExtractionAgentSessionsModule {}
