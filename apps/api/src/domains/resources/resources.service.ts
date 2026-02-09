import type { ResourceDto } from "@caseai-connect/api-contracts"
import { Injectable, NotFoundException } from "@nestjs/common"
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

  async findById(resourceId: string): Promise<Resource | null> {
    const resource = await this.resourceRepository.findOne({
      where: { id: resourceId },
    })
    if (!resource) {
      throw new NotFoundException(`Resource with id ${resourceId} not found`)
    }
    return resource
  }

  async deleteResource({ resourceId }: { resourceId: string }): Promise<true> {
    const isUpdated = await this.resourceRepository.softDelete({ id: resourceId })
    if (isUpdated.affected === 0) {
      throw new NotFoundException(`Resource with id ${resourceId} not found`)
    }
    return true
  }
}
