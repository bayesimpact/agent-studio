import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { ActivateCampaignDialog } from "@/studio/features/review-campaigns/components/ActivateCampaignDialog"
import { CloseCampaignDialog } from "@/studio/features/review-campaigns/components/CloseCampaignDialog"
import { DeleteCampaignDialog } from "@/studio/features/review-campaigns/components/DeleteCampaignDialog"
import { mockActiveCampaign, mockDraftCampaign } from "./fixtures"

const meta = {
  title: "review-campaigns/CampaignLifecycleDialogs",
  parameters: { layout: "centered" },
} satisfies Meta

export default meta
type Story = StoryObj

export const Activate: Story = {
  render: () => (
    <ActivateCampaignDialog
      open
      campaignName={mockDraftCampaign.name}
      onConfirm={fn()}
      onCancel={fn()}
    />
  ),
}

export const Close: Story = {
  render: () => (
    <CloseCampaignDialog
      open
      campaignName={mockActiveCampaign.name}
      onConfirm={fn()}
      onCancel={fn()}
    />
  ),
}

export const Delete: Story = {
  render: () => (
    <DeleteCampaignDialog
      open
      campaignName={mockDraftCampaign.name}
      onConfirm={fn()}
      onCancel={fn()}
    />
  ),
}
