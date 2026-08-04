import type { EntityManager } from "typeorm"
import { AGENT_ROLES } from "./rbac.constants"
import { Role } from "./role.entity"

export async function resolveAgentRoleId(
  manager: EntityManager,
  role: keyof typeof AGENT_ROLES,
): Promise<string | null> {
  const roleKey = AGENT_ROLES[role]
  const rbacRole = await manager.getRepository(Role).findOne({ where: { key: roleKey } })
  return rbacRole?.id ?? null
}
