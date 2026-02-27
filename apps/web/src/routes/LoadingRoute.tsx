import { Loader } from "@/components/Loader"
import { FullPageCenterLayout } from "@/components/layouts/FullPageCenterLayout"

export function LoadingRoute() {
  return (
    <FullPageCenterLayout>
      <Loader />
    </FullPageCenterLayout>
  )
}
