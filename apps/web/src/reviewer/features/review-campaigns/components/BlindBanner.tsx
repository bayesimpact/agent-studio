import { InfoIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

export function BlindBanner() {
  const { t } = useTranslation()
  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900">
      <InfoIcon className="mt-0.5 size-4 shrink-0" />
      <p className="text-sm">{t("reviewerCampaigns:blindBanner.message")}</p>
    </div>
  )
}
