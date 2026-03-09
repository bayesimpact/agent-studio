import { ShieldCheckIcon } from "lucide-react"
import { useAbility } from "@/hooks/use-ability"

export function BreadcrumbAdmin() {
  const { isAdminInterface } = useAbility()
  if (!isAdminInterface) return null
  return (
    <div className="flex items-center gap-1.5 text-primary font-semibold select-none">
      <ShieldCheckIcon className="size-4.5" />
      <span>ADMIN</span>
    </div>
  )
}
