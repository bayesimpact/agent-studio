import { BullModule } from "@nestjs/bullmq"
import { Module } from "@nestjs/common"
import { DOCUMENT_EMBEDDINGS_QUEUE_NAME } from "@/domains/documents/embeddings/document-embeddings.constants"
import { WorkersHealthController } from "./workers-health.controller"

@Module({
  imports: [
    BullModule.registerQueue({
      name: DOCUMENT_EMBEDDINGS_QUEUE_NAME,
    }),
  ],
  controllers: [WorkersHealthController],
})
export class WorkersHealthModule {}
