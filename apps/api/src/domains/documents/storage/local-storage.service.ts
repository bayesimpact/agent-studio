import * as fs from "node:fs/promises"
import * as path from "node:path"
import { Injectable, Logger } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import { v4 as uuidv4 } from "uuid"
import type { MulterFile } from "@/common/types"
import type { IFileStorage } from "./file-storage.interface"

@Injectable()
export class LocalStorageService implements IFileStorage {
  private readonly logger = new Logger(LocalStorageService.name)
  private readonly dir = path.join(process.cwd(), "dontsave_documents")
  private readonly baseUrl: string

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      "SERVER_BASE_URL",
      `http://localhost:${process.env.PORT || "3001"}`,
    )
  }

  getTemporaryUrl(storageRelativePath: string): Promise<string> {
    return Promise.resolve(`${this.baseUrl}/documents/${storageRelativePath}`)
  }

  async save({
    extension,
    file,
    pathPrefix,
  }: {
    extension: string
    file: MulterFile
    pathPrefix: string
  }): Promise<{ fileId: string; storageRelativePath: string }> {
    try {
      const destinationDir = path.join(this.dir, pathPrefix)
      await fs.mkdir(destinationDir, { recursive: true })

      const fileId = uuidv4()
      const uniqueFileName = `${fileId}.${extension}`

      const destinationPath = path.join(destinationDir, uniqueFileName)

      await fs.writeFile(destinationPath, file.buffer)

      const storageRelativePath = `${pathPrefix.endsWith("/") ? pathPrefix : `${pathPrefix}/`}${uniqueFileName}`

      this.logger.log(`File saved locally: ${storageRelativePath}`)

      return { storageRelativePath, fileId }
    } catch (error) {
      this.logger.error("Error saving file locally", error)
      throw new Error("Unable to save file locally.")
    }
  }
}
