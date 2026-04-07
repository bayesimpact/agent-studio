import { FullPageCenterLayout } from "@/common/components/layouts/FullPageCenterLayout"
import { Loader } from "@/components/Loader"

export function LoadingRoute() {
  return (
    <FullPageCenterLayout className="min-h-screen">
      <Loader />
    </FullPageCenterLayout>
  )
}
