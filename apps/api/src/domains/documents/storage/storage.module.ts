import { Logger, Module, type Provider } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { isEmpty } from "lodash"
import { FILE_STORAGE_SERVICE } from "./file-storage.interface"
import { GcsStorageService } from "./gcs-storage.service"
import { LocalStorageService } from "./local-storage.service"

const storageProvider: Provider = {
  provide: FILE_STORAGE_SERVICE,
  useFactory: (configService: ConfigService) => {
    const storageBucketName = configService.get<string>("GCS_STORAGE_BUCKET_NAME")

    if (isEmpty(storageBucketName)) {
      Logger.log("Use LocalStorageService for file storage.", "StorageModule")
      return new LocalStorageService(configService)
    } else {
      Logger.log("Use GcsStorageService for file storage.", "StorageModule")
      return new GcsStorageService(configService)
    }
  },
  inject: [ConfigService],
}

@Module({
  imports: [ConfigModule],
  providers: [storageProvider],
  exports: [storageProvider],
})
export class StorageModule {}
