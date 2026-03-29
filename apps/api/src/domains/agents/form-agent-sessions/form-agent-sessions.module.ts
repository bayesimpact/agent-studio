import { forwardRef, Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import {
  moduleFeatures,
  moduleImports,
  moduleProviders,
} from "../base-agent-sessions/base-agent-sessions-module.helpers"
import { StreamingModule } from "../shared/agent-session-messages/streaming/streaming.module"
import { FormAgentSessionsController } from "./form-agent-sessions.controller"
import { FormAgentSessionsService } from "./form-agent-sessions.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([...moduleFeatures]),
    ...moduleImports,
    forwardRef(() => StreamingModule),
  ],
  providers: [...moduleProviders, FormAgentSessionsService],
  controllers: [FormAgentSessionsController],
  exports: [FormAgentSessionsService],
})
export class FormAgentSessionsModule {}
