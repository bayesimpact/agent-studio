import { BullModule } from "@nestjs/bullmq"
import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ALL_ENTITIES } from "@/common/all-entities"
import { DocumentsService } from "../documents.service"
import { StorageModule } from "../storage/storage.module"
import { DocumentTagsService } from "../tags/document-tags.service"
import { DocumentEmbeddingStatusNotifierService } from "./document-embedding-status-notifier.service"
import { DOCUMENT_EMBEDDINGS_QUEUE_NAME } from "./document-embeddings.constants"
import { DocumentEmbeddingsWorker } from "./document-embeddings.worker"
import { getDocumentEmbeddingsBullMqConnection } from "./document-embeddings-bullmq.config"
import { DocumentEmbeddingsProcessorService } from "./document-embeddings-processor.service"
import { DocumentTextExtractorService } from "./document-text-extractor.service"

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
    TypeOrmModule.forFeature(ALL_ENTITIES),
    StorageModule,
  ],
  providers: [
    DocumentEmbeddingsWorker,
    DocumentEmbeddingsProcessorService,
    DocumentEmbeddingStatusNotifierService,
    DocumentTextExtractorService,
    DocumentsService,
    DocumentTagsService,
  ],
})
export class DocumentEmbeddingsWorkersModule {}
