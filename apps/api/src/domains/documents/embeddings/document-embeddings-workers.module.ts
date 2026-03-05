import { BullModule } from "@nestjs/bullmq"
import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { DOCUMENT_EMBEDDINGS_QUEUE_NAME } from "./document-embeddings.constants"
import { DocumentEmbeddingsWorker } from "./document-embeddings.worker"
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
  providers: [DocumentEmbeddingsWorker],
})
export class DocumentEmbeddingsWorkersModule {}
