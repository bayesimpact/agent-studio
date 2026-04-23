"use client"

import { useAppDispatch } from "@/common/store/hooks"
import { createReviewCampaign } from "../review-campaigns.thunks"
import { CampaignForm, type CampaignFormAgentOption, type CampaignFormValues } from "./CampaignForm"

type Props = {
  agents: CampaignFormAgentOption[]
  onSuccess?: () => void
}

export function CreateCampaignForm({ agents, onSuccess }: Props) {
  const dispatch = useAppDispatch()

  const handleSubmit = async (values: CampaignFormValues) => {
    await dispatch(
      createReviewCampaign({
        fields: {
          agentId: values.agentId,
          name: values.name,
          description: values.description,
          testerPerSessionQuestions: values.testerPerSessionQuestions,
          testerEndOfPhaseQuestions: values.testerEndOfPhaseQuestions,
          reviewerQuestions: values.reviewerQuestions,
        },
      }),
    ).unwrap()
    onSuccess?.()
  }

  return (
    <CampaignForm
      mode="create"
      status="draft"
      agents={agents}
      memberships={[]}
      onSubmit={handleSubmit}
    />
  )
}
