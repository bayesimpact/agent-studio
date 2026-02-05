import type { ResourceDto } from "@caseai-connect/api-contracts"
import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { Organization } from "@/organizations/organization.entity"
import { UserMembership } from "@/organizations/user-membership.entity"
import { Resource } from "./resource.entity"

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource) private readonly resourceRepository: Repository<Resource>,
    @InjectRepository(Organization) readonly _organizationRepository: Repository<Organization>,
    @InjectRepository(UserMembership) readonly _membershipRepository: Repository<UserMembership>,
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
}
