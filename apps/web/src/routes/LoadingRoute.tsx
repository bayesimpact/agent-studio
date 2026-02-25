import { Item, ItemHeader, ItemTitle } from "@caseai-connect/ui/shad/item"
import { Loader2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { FullPageCenterLayout } from "@/components/layouts/FullPageCenterLayout"

export function LoadingRoute() {
  const { t } = useTranslation()
  return (
    <FullPageCenterLayout>
      <Item variant="outline" className="w-fit">
        <ItemHeader>
          <ItemTitle className="w-fit text-primary">
            <Loader2Icon className="size-5 animate-spin capitalize-first" /> {t("status:loading")}
          </ItemTitle>
        </ItemHeader>
      </Item>
    </FullPageCenterLayout>
  )
}
