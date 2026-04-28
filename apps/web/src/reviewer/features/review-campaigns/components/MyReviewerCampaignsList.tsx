import type { ListMyReviewCampaignsResponseDto } from "@caseai-connect/api-contracts"
import { Button } from "@caseai-connect/ui/shad/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@caseai-connect/ui/shad/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@caseai-connect/ui/shad/empty"
import { ClipboardCheckIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

type Campaign = ListMyReviewCampaignsResponseDto["reviewCampaigns"][number]

type Props = {
  campaigns: Campaign[]
  onOpen: (campaign: Campaign) => void
}

export function MyReviewerCampaignsList({ campaigns, onOpen }: Props) {
  const { t } = useTranslation()
  if (campaigns.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ClipboardCheckIcon />
          </EmptyMedia>
          <EmptyTitle>{t("reviewerCampaigns:myCampaigns.empty.title")}</EmptyTitle>
          <EmptyDescription>
            {t("reviewerCampaigns:myCampaigns.empty.description")}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {campaigns.map((campaign) => (
        <Card key={campaign.id} className="flex flex-col">
          <CardHeader>
            <CardTitle>{campaign.name}</CardTitle>
            {campaign.description && <CardDescription>{campaign.description}</CardDescription>}
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm flex-1">
            {t("reviewerCampaigns:myCampaigns.card.description")}
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={() => onOpen(campaign)}>
              {t("reviewerCampaigns:myCampaigns.card.open")}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
