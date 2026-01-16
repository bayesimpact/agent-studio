import { Card, CardDescription, CardHeader, CardTitle } from "@caseai-connect/ui/shad/card"
import { Loader2Icon } from "lucide-react"
import { FullPageCenterLayout } from "@/components/layouts/FullPageCenterLayout"

export function LoadingRoute() {
  return (
    <FullPageCenterLayout>
      <Card className="w-1/2">
        <CardHeader>
          <CardTitle>
            <div className="flex gap-2 items-center">
              <Loader2Icon className="size-5 animate-spin" /> Loading...
            </div>
          </CardTitle>
          <CardDescription>Please wait while we load data.</CardDescription>
        </CardHeader>
      </Card>
    </FullPageCenterLayout>
  )
}
