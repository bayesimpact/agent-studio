import { Card, CardDescription, CardHeader, CardTitle } from "@caseai-connect/ui/shad/card"
import { Loader2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { FullPageCenterLayout } from "@/components/layouts/FullPageCenterLayout"

export function LoadingRoute() {
  const { t } = useTranslation("common")
  return (
    <FullPageCenterLayout>
      <Card className="w-96">
        <CardHeader>
          <CardTitle>
            <div className="flex gap-2 items-center">
              <Loader2Icon className="size-5 animate-spin" /> {t("loading")}
            </div>
          </CardTitle>
          <CardDescription>{t("loadingDescription")}</CardDescription>
        </CardHeader>
      </Card>
    </FullPageCenterLayout>
  )
}
