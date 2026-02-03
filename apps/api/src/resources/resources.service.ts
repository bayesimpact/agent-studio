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
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(UserMembership)
    private readonly membershipRepository: Repository<UserMembership>,
  ) {}
}
