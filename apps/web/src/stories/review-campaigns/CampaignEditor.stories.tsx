import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { CampaignForm } from "@/studio/features/review-campaigns/components/CampaignForm"
import {
  mockActiveCampaign,
  mockAgents,
  mockClosedCampaign,
  mockDraftCampaign,
  mockMemberships,
} from "./fixtures"

const meta = {
  title: "review-campaigns/CampaignEditor",
  component: CampaignForm,
  parameters: { layout: "padded" },
  args: {
    agents: mockAgents,
    onSubmit: fn(),
    onActivate: fn(),
    onClose: fn(),
    onDelete: fn(),
    onInviteMember: fn(),
    onRevokeMember: fn(),
  },
} satisfies Meta<typeof CampaignForm>

export default meta
type Story = StoryObj<typeof meta>

export const DraftEditable: Story = {
  args: {
    mode: "edit",
    status: "draft",
    defaultValues: {
      name: mockDraftCampaign.name,
      description: mockDraftCampaign.description,
      agentId: mockDraftCampaign.agentId,
      testerPerSessionQuestions: mockDraftCampaign.testerPerSessionQuestions,
      testerEndOfPhaseQuestions: mockDraftCampaign.testerEndOfPhaseQuestions,
      reviewerQuestions: mockDraftCampaign.reviewerQuestions,
    },
    memberships: [],
  },
}

export const CreateBlank: Story = {
  args: {
    mode: "create",
    status: "draft",
    defaultValues: undefined,
    memberships: [],
  },
}

export const ActiveLocked: Story = {
  args: {
    mode: "edit",
    status: "active",
    defaultValues: {
      name: mockActiveCampaign.name,
      description: mockActiveCampaign.description,
      agentId: mockActiveCampaign.agentId,
      testerPerSessionQuestions: mockActiveCampaign.testerPerSessionQuestions,
      testerEndOfPhaseQuestions: mockActiveCampaign.testerEndOfPhaseQuestions,
      reviewerQuestions: mockActiveCampaign.reviewerQuestions,
    },
    memberships: mockMemberships,
  },
}

export const ClosedReadOnly: Story = {
  args: {
    mode: "edit",
    status: "closed",
    defaultValues: {
      name: mockClosedCampaign.name,
      description: mockClosedCampaign.description,
      agentId: mockClosedCampaign.agentId,
      testerPerSessionQuestions: mockClosedCampaign.testerPerSessionQuestions,
      testerEndOfPhaseQuestions: mockClosedCampaign.testerEndOfPhaseQuestions,
      reviewerQuestions: mockClosedCampaign.reviewerQuestions,
    },
    memberships: mockMemberships,
  },
}
