import type { TestingModule } from "@nestjs/testing"
import type { AllRepositories } from "@/common/test/test-transaction-manager"
import { userMembershipFactory } from "@/domains/memberships/user-membership.factory"
import { PLATFORM_STAFF_ROLE } from "@/domains/rbac/rbac.constants"
import { RbacService } from "@/domains/rbac/rbac.service"
import type { User } from "@/domains/users/user.entity"

let rbacCatalogReady = false

/** Seeds the org + project RBAC catalogs once per test worker (roles are never cleared). */
export async function ensureRbacCatalog(module: TestingModule): Promise<void> {
  if (rbacCatalogReady) {
    return
  }

  const rbacService = module.get(RbacService)
  await rbacService.seedOrganizationRolesAndPermissions()
  await rbacService.seedProjectRolesAndPermissions()
  rbacCatalogReady = true
}

export async function assignPlatformStaffToUser({
  repositories,
  user,
}: {
  repositories: AllRepositories
  user: User
}): Promise<void> {
  const platformStaffRole = await repositories.roleRepository.findOneOrFail({
    where: { key: PLATFORM_STAFF_ROLE },
  })

  await repositories.userMembershipRepository.save(
    userMembershipFactory.build({
      userId: user.id,
      resourceType: "global",
      resourceId: null,
      role: "member",
      roleId: platformStaffRole.id,
    }),
  )
}
