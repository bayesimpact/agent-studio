import { type FindOptionsWhere, IsNull, type Repository } from "typeorm"
import type { Activity } from "@/domains/activities/activity.entity"

export async function expectActivityMatching(
  activityRepository: Repository<Activity>,
  where: FindOptionsWhere<Activity>,
): Promise<Activity> {
  const activity = await activityRepository.findOne({ where })
  expect(activity).not.toBeNull()
  return activity as Activity
}

export function whereOrganizationCreated(params: {
  userId: string
  organizationId: string
}): FindOptionsWhere<Activity> {
  return {
    action: "organization.create",
    userId: params.userId,
    organizationId: params.organizationId,
    projectId: IsNull(),
    entityId: params.organizationId,
    entityType: "organization",
  }
}
