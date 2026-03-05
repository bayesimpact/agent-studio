import { BullModule } from "@nestjs/bullmq"
import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { BullMqDocumentEmbeddingsBatchService } from "./bull-mq-document-embeddings-batch.service"
import { DOCUMENT_EMBEDDINGS_QUEUE_NAME } from "./document-embeddings.constants"
import { DOCUMENT_EMBEDDINGS_BATCH_SERVICE } from "./document-embeddings-batch.interface"
import { getDocumentEmbeddingsBullMqConnection } from "./document-embeddings-bullmq.config"

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        connection: getDocumentEmbeddingsBullMqConnection(),
      }),
    }),
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
