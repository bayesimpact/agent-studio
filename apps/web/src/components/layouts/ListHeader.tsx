import { HeaderButton } from "@caseai-connect/ui/components/layouts/sidebar/Header"
import { selectCurrentOrganization } from "@/features/organizations/organizations.selectors"
import { useAbility } from "@/hooks/use-ability"
import { useGetPath } from "@/hooks/use-build-path"
import { InterfaceToggle } from "@/routes/DashboardRoute"
import { useAppSelector } from "@/store/hooks"
import { Logo } from "../themes/Logo"
import { FullPageCenterLayout } from "./FullPageCenterLayout"

export function ListHeader({
  title,
  withInterfaceToggle = false,
  path,
  children,
}: {
  title: string
  path?: string
  withInterfaceToggle?: boolean
  children?: React.ReactNode
}) {
  const { isAdminInterface, isAdmin } = useAbility()
  const { getPath } = useGetPath()
  const organization = useAppSelector(selectCurrentOrganization)
  if (!organization) return null
  return (
    <FullPageCenterLayout>
      <div className="flex flex-col gap-4 min-w-96">
        <div className="flex items-center gap-1 mb-2 border-b-4 pb-6 border-muted">
          <HeaderButton
            className="flex flex-1 gap-2 items-center"
            to={path ?? getPath("organization")}
            name={organization.name}
            subname={isAdminInterface ? "Admin" : undefined}
            subnameClassName="text-primary"
          >
            <div className="size-10 contain-content p-1">
              <Logo />
            </div>
          </HeaderButton>

          {withInterfaceToggle && (
            <InterfaceToggle isAdmin={isAdmin} isAdminInterface={isAdminInterface} />
          )}
        </div>

        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight capitalize-first">
          {title}
        </h4>

        {children}
      </div>
    </FullPageCenterLayout>
  )
}
