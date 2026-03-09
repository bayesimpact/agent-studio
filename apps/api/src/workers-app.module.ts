import { Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"
import typeorm from "./config/typeorm"
import { DocumentEmbeddingsWorkersModule } from "./domains/documents/embeddings/document-embeddings-workers.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeorm],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => configService.get("typeorm")(),
    }),
    DocumentEmbeddingsWorkersModule,
  ],
})
export class WorkersAppModule {}
