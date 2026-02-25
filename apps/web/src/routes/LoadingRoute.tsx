import { Item, ItemHeader, ItemTitle } from "@caseai-connect/ui/shad/item"
import { Loader2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { FullPageCenterLayout } from "@/components/layouts/FullPageCenterLayout"

export function LoadingRoute() {
  const { t } = useTranslation("common")
  return (
    <FullPageCenterLayout>
      <Item variant="outline" className="w-fit">
        <ItemHeader>
          <ItemTitle className="w-fit text-primary">
            <Loader2Icon className="size-5 animate-spin " /> {t("loading", { cfl: true })}
          </ItemTitle>
        </ItemHeader>
      </Item>
    </FullPageCenterLayout>
  )
}
