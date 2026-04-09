import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { Activity } from "./activity.entity"

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async createActivity(params: {
    organizationId: string
    projectId: string | null
    userId: string
    action: string
    entityId: string | null
    entityType: string | null
  }): Promise<Activity> {
    const activity = this.activityRepository.create(params)
    return this.activityRepository.save(activity)
  }
}
