import { BullMQAdapter } from "@bull-board/api/bullMQAdapter"
import { BullBoardModule } from "@bull-board/nestjs"
import { BullModule } from "@nestjs/bullmq"
import { Module } from "@nestjs/common"
import { isBullBoardEnabled } from "@/common/bull-board/bull-board-env"
import { BullMqDocumentEmbeddingsBatchService } from "./bull-mq-document-embeddings-batch.service"
import { DOCUMENT_EMBEDDINGS_QUEUE_NAME } from "./document-embeddings.constants"
import { DOCUMENT_EMBEDDINGS_BATCH_SERVICE } from "./document-embeddings-batch.interface"

@Module({
  imports: [
    BullModule.registerQueue({
      name: DOCUMENT_EMBEDDINGS_QUEUE_NAME,
    }),
    ...(isBullBoardEnabled()
      ? [
          BullBoardModule.forFeature({
            name: DOCUMENT_EMBEDDINGS_QUEUE_NAME,
            adapter: BullMQAdapter,
          }),
        ]
      : []),
  ],
  providers: [
    BullMqDocumentEmbeddingsBatchService,
    {
      provide: DOCUMENT_EMBEDDINGS_BATCH_SERVICE,
      useExisting: BullMqDocumentEmbeddingsBatchService,
    },
  ],
  exports: [DOCUMENT_EMBEDDINGS_BATCH_SERVICE],
})
export class DocumentEmbeddingsBatchModule {}
