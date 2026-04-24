"use client"

import type {
  CampaignAggregatesDto,
  ReviewCampaignMembershipDto,
  ReviewCampaignMembershipRole,
  ReviewCampaignQuestionDto,
  ReviewCampaignStatus,
} from "@caseai-connect/api-contracts"
import { Button } from "@caseai-connect/ui/shad/button"
import { Field, FieldGroup, FieldLabel } from "@caseai-connect/ui/shad/field"
import { Input } from "@caseai-connect/ui/shad/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@caseai-connect/ui/shad/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@caseai-connect/ui/shad/tabs"
import { Textarea } from "@caseai-connect/ui/shad/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { RocketIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { CampaignStatusBadge } from "./CampaignStatusBadge"
import { CampaignSummaryPanel } from "./CampaignSummaryPanel"
import { FeedbackPreview } from "./FeedbackPreview"
import { ParticipantsList } from "./ParticipantsList"
import { QuestionListEditor } from "./QuestionListEditor"

export type CampaignFormValues = {
  name: string
  description: string | null
  agentId: string
  testerPerSessionQuestions: ReviewCampaignQuestionDto[]
  testerEndOfPhaseQuestions: ReviewCampaignQuestionDto[]
  reviewerQuestions: ReviewCampaignQuestionDto[]
}

export type CampaignFormAgentOption = {
  id: string
  name: string
}

type Props = {
  mode: "create" | "edit"
  status: ReviewCampaignStatus
  agents: CampaignFormAgentOption[]
  defaultValues?: Partial<CampaignFormValues>
  memberships?: ReviewCampaignMembershipDto[]
  aggregates?: CampaignAggregatesDto | null
  onSubmit: (values: CampaignFormValues) => void
  onActivate?: () => void
  onClose?: () => void
  onDelete?: () => void
  onInviteMember?: (role: ReviewCampaignMembershipRole, emails: string[]) => void
  onRevokeMember?: (membershipId: string) => void
}

const schema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().nullable(),
  agentId: z.string().min(1, "Agent is required"),
  testerPerSessionQuestions: z.array(z.any()),
  testerEndOfPhaseQuestions: z.array(z.any()),
  reviewerQuestions: z.array(z.any()),
})

export function CampaignForm({
  mode,
  status,
  agents,
  defaultValues,
  memberships = [],
  aggregates = null,
  onSubmit,
  onActivate,
  onClose,
  onDelete,
  onInviteMember,
  onRevokeMember,
}: Props) {
  const isDraft = status === "draft"
  const isActive = status === "active"
  const isClosed = status === "closed"
  const configLocked = !isDraft

  type TabValue = "summary" | "general" | "questions" | "participants" | "preview"
  const [tab, setTab] = useState<TabValue>(isClosed ? "summary" : "general")

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      agentId: defaultValues?.agentId ?? "",
      testerPerSessionQuestions: defaultValues?.testerPerSessionQuestions ?? [],
      testerEndOfPhaseQuestions: defaultValues?.testerEndOfPhaseQuestions ?? [],
      reviewerQuestions: defaultValues?.reviewerQuestions ?? [],
    },
  })

  const perSessionQuestions = watch("testerPerSessionQuestions")
  const endOfPhaseQuestions = watch("testerEndOfPhaseQuestions")
  const reviewerQuestions = watch("reviewerQuestions")

  const submitHandler = handleSubmit((values) => {
    onSubmit({
      ...values,
      description: values.description?.trim() === "" ? null : values.description,
    })
  })

  return (
    <form onSubmit={submitHandler} className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">
            {mode === "create" ? "New review campaign" : "Edit review campaign"}
          </h2>
          <div>
            <CampaignStatusBadge status={status} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isDraft && onDelete && (
            <Button type="button" variant="ghost" onClick={onDelete}>
              <Trash2Icon /> Delete
            </Button>
          )}
          <div className="ml-auto flex items-center gap-2">
            {isDraft && onActivate && (
              <Button type="button" variant="outline" onClick={onActivate}>
                <RocketIcon /> Activate
              </Button>
            )}
            {isActive && onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
            {!isClosed && (
              <Button type="submit">{mode === "create" ? "Create campaign" : "Save"}</Button>
            )}
          </div>
        </div>
      </header>

      <Tabs value={tab} onValueChange={(value) => setTab(value as TabValue)}>
        <TabsList>
          {isClosed && <TabsTrigger value="summary">Summary</TabsTrigger>}
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {isClosed && (
          <TabsContent value="summary" className="pt-4">
            <CampaignSummaryPanel aggregates={aggregates} />
          </TabsContent>
        )}

        <TabsContent value="general" className="pt-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                disabled={configLocked}
                placeholder="e.g. Support agent — Q2 review"
                {...register("name")}
                aria-invalid={errors.name ? "true" : "false"}
              />
              {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                rows={3}
                disabled={configLocked}
                placeholder="What are we evaluating?"
                {...register("description")}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="agentId">Target agent</FieldLabel>
              <Controller
                name="agentId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    disabled={configLocked}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="agentId">
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.agentId && (
                <p className="text-destructive text-sm">{errors.agentId.message}</p>
              )}
            </Field>
          </FieldGroup>
        </TabsContent>

        <TabsContent value="questions" className="flex flex-col gap-6 pt-4">
          <QuestionListEditor
            label="Tester — per-session questions"
            description="Asked after every session the tester completes."
            questions={perSessionQuestions}
            disabled={configLocked}
            showFactualToggle
            onChange={(next) => setValue("testerPerSessionQuestions", next, { shouldDirty: true })}
          />
          <QuestionListEditor
            label="Tester — end-of-phase questions"
            description="Asked once when the tester finishes participating."
            questions={endOfPhaseQuestions}
            disabled={configLocked}
            onChange={(next) => setValue("testerEndOfPhaseQuestions", next, { shouldDirty: true })}
          />
          <QuestionListEditor
            label="Reviewer questions"
            description="Shown to reviewers while reviewing a session."
            questions={reviewerQuestions}
            disabled={configLocked}
            onChange={(next) => setValue("reviewerQuestions", next, { shouldDirty: true })}
          />
        </TabsContent>

        <TabsContent value="participants" className="pt-4">
          <ParticipantsList
            memberships={memberships}
            disabled={isClosed}
            onInvite={(role, emails) => onInviteMember?.(role, emails)}
            onRevoke={(membershipId) => onRevokeMember?.(membershipId)}
          />
        </TabsContent>

        <TabsContent value="preview" className="pt-4">
          <FeedbackPreview
            perSessionQuestions={perSessionQuestions}
            endOfPhaseQuestions={endOfPhaseQuestions}
          />
        </TabsContent>
      </Tabs>
    </form>
  )
}
