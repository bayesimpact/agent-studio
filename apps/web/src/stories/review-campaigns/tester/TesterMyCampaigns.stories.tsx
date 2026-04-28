import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { MyCampaignsList } from "@/tester/features/review-campaigns/components/MyCampaignsList"
import { mockMyCampaigns } from "./fixtures"

const meta = {
  title: "review-campaigns/tester/MyCampaigns",
  component: MyCampaignsList,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    onOpen: fn(),
  },
} satisfies Meta<typeof MyCampaignsList>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {
    campaigns: [],
  },
}

export const WithMix: Story = {
  args: {
    campaigns: mockMyCampaigns,
  },
}
