import { OrganizationSelector } from "../organization/OrganizationSelector"
import { FullPageCenterLayout } from "./FullPageCenterLayout"

export function ListHeader({
  title,
  children,
  className,
}: {
  title: string
  path?: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <FullPageCenterLayout className={className}>
      <div className="flex flex-col gap-4 min-w-96 max-w-2/3 2xl:max-w-1/2">
        <div className="mb-2 border-b-4 pb-4 border-muted">
          <OrganizationSelector />
        </div>

        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight capitalize-first">
          {title}
        </h4>

        {children}
      </div>
    </FullPageCenterLayout>
  )
}
