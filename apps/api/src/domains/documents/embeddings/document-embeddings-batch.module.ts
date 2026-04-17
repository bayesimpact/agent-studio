import { BullModule } from "@nestjs/bullmq"
import { Module } from "@nestjs/common"
import { BullMqDocumentEmbeddingsBatchService } from "./bull-mq-document-embeddings-batch.service"
import { DOCUMENT_EMBEDDINGS_QUEUE_NAME } from "./document-embeddings.constants"
import { DOCUMENT_EMBEDDINGS_BATCH_SERVICE } from "./document-embeddings-batch.interface"

@Module({
  imports: [
    BullModule.registerQueue({
      name: DOCUMENT_EMBEDDINGS_QUEUE_NAME,
    }),
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
