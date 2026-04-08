import { Loader } from "@/common/components/Loader"
import { FullPageCenterLayout } from "@/common/components/layouts/FullPageCenterLayout"

export function LoadingRoute() {
  return (
    <FullPageCenterLayout className="min-h-screen">
      <Loader />
    </FullPageCenterLayout>
  )
}
