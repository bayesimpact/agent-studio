import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@caseai-connect/ui/shad/table"
import { CheckIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { useMount } from "@/common/hooks/use-mount"
import { useValue } from "@/common/hooks/use-value"
import { AsyncRoute } from "@/common/routes/AsyncRoute"
import { useAppSelector } from "@/common/store/hooks"
import type { BackofficeRbacCatalog, BackofficeRbacRole } from "../backoffice.models"
import { selectBackofficeRbacCatalog } from "../backoffice.selectors"
import { backofficeActions } from "../backoffice.slice"
import { SearchField } from "./BackofficeTable"

const SCOPE_ORDER = ["global", "organization", "project", "agent"] as const
const SCOPE_LABELS: Record<(typeof SCOPE_ORDER)[number], string> = {
  global: "Global roles",
  organization: "Organization roles",
  project: "Project roles",
  agent: "Agent roles",
}

export function PermissionsPanel() {
  const catalog = useAppSelector(selectBackofficeRbacCatalog)

  useMount({
    actions: {
      mount: backofficeActions.rbacCatalogMount,
      unmount: backofficeActions.rbacCatalogUnmount,
    },
  })

  return (
    <AsyncRoute data={[catalog]}>
      <WithData />
    </AsyncRoute>
  )
}

function WithData() {
  const catalog = useValue(selectBackofficeRbacCatalog)
  const [search, setSearch] = useState("")

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Permissions</h2>
        <p className="text-sm text-muted-foreground">
          Role grants from the live RBAC catalog. Review campaigns are not on RBAC yet.
        </p>
        <SearchField value={search} onChange={setSearch} placeholder="Search permissions…" />
      </div>
      {SCOPE_ORDER.map((scopeType) => (
        <ScopeMatrix
          key={scopeType}
          title={SCOPE_LABELS[scopeType]}
          catalog={catalog}
          scopeType={scopeType}
          search={search}
        />
      ))}
    </div>
  )
}

function ScopeMatrix({
  title,
  catalog,
  scopeType,
  search,
}: {
  title: string
  catalog: BackofficeRbacCatalog
  scopeType: (typeof SCOPE_ORDER)[number]
  search: string
}) {
  const scopeRoles = useMemo(
    () => catalog.roles.filter((role) => role.scopeType === scopeType),
    [catalog.roles, scopeType],
  )

  const descriptionByKey = useMemo(() => {
    const descriptions = new Map<string, string>()
    for (const permission of catalog.permissions) {
      descriptions.set(permission.key, permission.description)
    }
    return descriptions
  }, [catalog.permissions])

  const permissionKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const role of scopeRoles) {
      for (const permissionKey of role.permissions) {
        keys.add(permissionKey)
      }
    }
    const normalizedSearch = search.trim().toLowerCase()
    return [...keys]
      .filter((permissionKey) => {
        if (!normalizedSearch) return true
        const description = descriptionByKey.get(permissionKey) ?? ""
        return (
          permissionKey.toLowerCase().includes(normalizedSearch) ||
          description.toLowerCase().includes(normalizedSearch)
        )
      })
      .sort((left, right) => left.localeCompare(right))
  }, [scopeRoles, search, descriptionByKey])

  if (scopeRoles.length === 0 || permissionKeys.length === 0) return null

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="min-w-64">Permission</TableHead>
              {scopeRoles.map((role) => (
                <TableHead key={role.key} className="text-center whitespace-nowrap">
                  <div className="flex flex-col items-center gap-0.5">
                    <span>{role.name}</span>
                    <span className="font-mono text-[10px] font-normal text-muted-foreground">
                      {role.key}
                    </span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissionKeys.map((permissionKey) => (
              <TableRow key={permissionKey}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-mono text-xs">{permissionKey}</span>
                    {descriptionByKey.get(permissionKey) && (
                      <span className="text-xs text-muted-foreground">
                        {descriptionByKey.get(permissionKey)}
                      </span>
                    )}
                  </div>
                </TableCell>
                {scopeRoles.map((role) => (
                  <TableCell key={role.key} className="text-center">
                    <GrantMark role={role} permissionKey={permissionKey} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}

function GrantMark({ role, permissionKey }: { role: BackofficeRbacRole; permissionKey: string }) {
  if (!role.permissions.includes(permissionKey)) {
    return <span className="text-muted-foreground">—</span>
  }
  return <CheckIcon className="size-4 text-foreground inline" aria-label="Granted" />
}
