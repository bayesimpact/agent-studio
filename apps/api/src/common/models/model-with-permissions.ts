/**
 * Base class for domain models that carry the current user's effective
 * permissions on the resource they represent.
 *
 * Permissions are set once at construction time (strong boundary):
 * instances are always fully initialized, there is no setter.
 * The constructor is the single place where the untyped permission keys
 * coming from the RBAC layer (`string[]`) are narrowed to `TPermission`.
 */
export abstract class ModelWithPermissions<TPermission extends string = string> {
  readonly permissions: TPermission[]

  protected constructor(permissions: readonly string[]) {
    this.permissions = [...permissions] as TPermission[]
  }

  hasPermission(permission: TPermission): boolean {
    return this.permissions.includes(permission)
  }
}
