import type { ResourceDto } from "@caseai-connect/api-contracts"
import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { Resource } from "./resource.entity"

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource) private readonly resourceRepository: Repository<Resource>,
  ) {}

  async createResourceFromFile({
    resourceId,
    projectId,
    fields,
  }: {
    resourceId: string
    projectId: string
    fields: Pick<ResourceDto, "fileName" | "mimeType" | "size" | "storageRelativePath" | "title">
  }): Promise<Resource> {
    const resource = this.resourceRepository.create({
      id: resourceId,
      projectId,
      fileName: fields.fileName,
      mimeType: fields.mimeType,
      size: fields.size,
      storageRelativePath: fields.storageRelativePath,
      title: fields.title ?? fields.fileName,
    })
    return this.resourceRepository.save(resource)
  }

  async listResources({ projectId }: { projectId: string }): Promise<Resource[]> {
    return this.resourceRepository.find({
      where: { projectId },
      order: { createdAt: "DESC" },
    })
  }
}
