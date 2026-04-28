import { Tabs, TabsContent, TabsList, TabsTrigger } from "@caseai-connect/ui/shad/tabs"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  selectBackofficeOrganizations,
  selectBackofficeUsers,
} from "@/backoffice/features/backoffice/backoffice.selectors"
import { GridHeader } from "@/common/components/grid/Grid"
import { AsyncRoute } from "@/common/routes/AsyncRoute"
import { RouteNames } from "@/common/routes/helpers"
import { useAppDispatch, useAppSelector } from "@/common/store/hooks"
import type {
  BackofficeOrganization,
  BackofficeUser,
} from "../features/backoffice/backoffice.models"
import { backofficeActions } from "../features/backoffice/backoffice.slice"
import { OrganizationsPanel } from "../features/backoffice/components/OrganizationsPanel"
import { UsersPanel } from "../features/backoffice/components/UsersPanel"

export function BackofficeRoute() {
  const dispatch = useAppDispatch()
  const organizations = useAppSelector(selectBackofficeOrganizations)
  const users = useAppSelector(selectBackofficeUsers)

  useEffect(() => {
    dispatch(backofficeActions.mount())
    return () => {
      dispatch(backofficeActions.unmount())
    }
  }, [dispatch])

  return (
    <AsyncRoute data={[organizations, users]}>
      {([organizationsValue, usersValue]) => (
        <WithData organizations={organizationsValue} users={usersValue} />
      )}
    </AsyncRoute>
  )
}

function WithData({
  organizations,
  users,
}: {
  organizations: BackofficeOrganization[]
  users: BackofficeUser[]
}) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<"organizations" | "users">("organizations")

  return (
    <div className="w-4/5 lg:w-3/4 mx-auto my-10 relative border rounded-2xl overflow-hidden">
      <GridHeader
        onBack={() => navigate(RouteNames.ONBOARDING)}
        title="Backoffice"
        description="Manage organizations, projects, feature flags, and users"
      />
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as typeof activeTab)}
        className="gap-0"
      >
        <div className="p-4 border-b">
          <TabsList>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="organizations">
          <OrganizationsPanel organizations={organizations} />
        </TabsContent>
        <TabsContent value="users">
          <UsersPanel users={users} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
