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
import { MegaphoneIcon } from "lucide-react"

type Campaign = ListMyReviewCampaignsResponseDto["reviewCampaigns"][number]

type Props = {
  campaigns: Campaign[]
  onOpen: (campaign: Campaign) => void
}

export function MyCampaignsList({ campaigns, onOpen }: Props) {
  if (campaigns.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MegaphoneIcon />
          </EmptyMedia>
          <EmptyTitle>No active review campaigns</EmptyTitle>
          <EmptyDescription>
            When someone invites you to test an agent, the campaign will appear here.
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
            Invited to evaluate this agent.
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={() => onOpen(campaign)}>Open</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
