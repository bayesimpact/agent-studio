import type { MulterFile } from "@/common/types"

export interface IFileStorage {
  save(p: { extension: string; file: MulterFile; pathPrefix: string }): Promise<{
    fileId: string
    storageRelativePath: string
  }>
  getTemporaryUrl(storageRelativePath: string): Promise<string>
}

// We use an "Injection Token" for dependency injection
export const FILE_STORAGE_SERVICE = "FileStorageService"
