import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { DocumentEmbeddingsWorkersModule } from "./domains/documents/embeddings/document-embeddings-workers.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DocumentEmbeddingsWorkersModule,
  ],
})
export class WorkersAppModule {}
