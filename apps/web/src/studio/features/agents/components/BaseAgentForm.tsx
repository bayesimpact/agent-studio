"use client"

import {
  AgentLocale,
  AgentModel,
  AgentModelToAgentProvider,
  AgentProvider,
  createAgentSchema,
  DocumentsRagMode,
  outputJsonSchemaSchema,
  updateAgentSchema,
} from "@caseai-connect/api-contracts"
import { Badge } from "@caseai-connect/ui/shad/badge"
import { Button } from "@caseai-connect/ui/shad/button"
import { Field, FieldGroup, FieldLabel, FieldSet } from "@caseai-connect/ui/shad/field"
import { Input } from "@caseai-connect/ui/shad/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@caseai-connect/ui/shad/select"
import { Textarea } from "@caseai-connect/ui/shad/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { XIcon } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { z } from "zod"
import type { Agent } from "@/common/features/agents/agents.models"
import { type HasFeature, useFeatureFlags } from "@/common/hooks/use-feature-flags"
import { getTagNameById } from "@/studio/features/document-tags/document-tags.helpers"
import type { DocumentTag } from "@/studio/features/document-tags/document-tags.models"
import { DocumentTagPicker } from "@/studio/features/documents/components/DocumentTagPicker"
import { type AgentFormData, getDefaultFormValues } from "./agent-form.shared"

function extractModelListFromAgentType(
  agentType: "conversation" | "extraction" | "form",
  hasFeature: HasFeature,
) {
  const defaultModels = Object.entries(AgentModel).filter(
    ([_key, value]) => AgentModelToAgentProvider[value] === AgentProvider.Vertex,
  )
  if (hasFeature("gemma") && agentType === "extraction") {
    const _medGemmaModels = Object.entries(AgentModel).filter(
      ([_key, value]) => AgentModelToAgentProvider[value] === AgentProvider.MedGemma,
    )
    return [...defaultModels, ..._medGemmaModels]
  }
  return defaultModels
}

export function BaseAgentForm({
  editableAgent,
  onSubmit,
  agentType,
  documentTags,
}: {
  documentTags: DocumentTag[]
  agentType: Agent["type"]
  editableAgent?: Agent
  onSubmit: (values: AgentFormData) => Promise<void> | void
}) {
  const { hasFeature } = useFeatureFlags()
  const { t, i18n } = useTranslation()

  const hasOutputJsonSchema = agentType !== "conversation"

  const agentSchema = editableAgent ? updateAgentSchema : createAgentSchema
  type FormValues = z.infer<typeof agentSchema>

  const defaultValues = (function buildDefaultValues() {
    if (editableAgent) {
      // Edition
      return {
        ...editableAgent,
        tagsToAdd: [],
        tagsToRemove: [],
      } as FormValues
    }

    // Creation
    const language = i18n.language.startsWith("fr") ? AgentLocale.FR : AgentLocale.EN
    return getDefaultFormValues({ agentType, language })
  })()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(agentSchema),
    defaultValues,
  })
  const documentsRagMode = watch("documentsRagMode")
  const documentTagErrorMessage = (() => {
    if (editableAgent && "documentTagIds" in errors) {
      return errors.documentTagIds?.message
    }
    if (!editableAgent && "tagsToAdd" in errors) {
      return errors.tagsToAdd?.message
    }
    return undefined
  })()

  const handleFormSubmit = async (data: FormValues) => {
    await onSubmit(data as AgentFormData)
    reset(data)
  }
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <FieldGroup>
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">{t("agent:props.name")}</FieldLabel>
              <Input
                id="name"
                placeholder={t("agent:props.placeholders.name")}
                {...register("name")}
                aria-invalid={errors.name ? "true" : "false"}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </Field>

            <Field>
              <FieldLabel htmlFor="defaultPrompt">{t("agent:props.defaultPrompt")}</FieldLabel>
              <Textarea
                id="defaultPrompt"
                placeholder={t("agent:props.placeholders.defaultPrompt")}
                rows={8}
                className="min-h-40"
                {...register("defaultPrompt")}
                aria-invalid={errors.defaultPrompt ? "true" : "false"}
              />
              {errors.defaultPrompt && (
                <p className="text-sm text-destructive">{errors.defaultPrompt.message}</p>
              )}
            </Field>

            {hasOutputJsonSchema && (
              <Field>
                <FieldLabel htmlFor="outputJsonSchema">
                  {t("agent:props.outputJsonSchema")}
                </FieldLabel>
                <Controller
                  control={control}
                  name="outputJsonSchema"
                  render={({ field }) => (
                    <Textarea
                      id="outputJsonSchema"
                      placeholder={t("agent:props.placeholders.outputJsonSchema")}
                      rows={10}
                      className="font-mono min-h-56"
                      defaultValue={!field.value ? "" : JSON.stringify(field.value, null, 2)}
                      onChange={async (e) => {
                        const raw = e.target.value
                        try {
                          const parsed = JSON.parse(raw)
                          const validationResult = outputJsonSchemaSchema.safeParse(parsed)
                          if (validationResult.success) {
                            field.onChange(parsed)
                          } else {
                            // @ts-expect-error - We know there is at least one error because validation failed
                            const firstError = validationResult.error.errors[0]
                            field.onChange(raw, { errors: [{ message: firstError.message }] })
                          }
                        } catch {
                          field.onChange(raw, { errors: [{ message: "Invalid JSON" }] })
                        }
                      }}
                      aria-invalid={errors.outputJsonSchema ? "true" : "false"}
                    />
                  )}
                />
                {errors.outputJsonSchema && (
                  <p className="text-sm text-destructive">{errors.outputJsonSchema.message}</p>
                )}
              </Field>
            )}

            {agentType === "conversation" && (
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="documentsRagMode">
                    {t("agent:props.documentsRagMode")}
                  </FieldLabel>
                  <Controller
                    control={control}
                    name="documentsRagMode"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger
                          id="documentsRagMode"
                          aria-invalid={errors.documentsRagMode ? "true" : "false"}
                        >
                          <SelectValue
                            placeholder={t("agent:props.placeholders.documentsRagMode")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={DocumentsRagMode.None}>
                            {t("agent:props.documentsRagModeOptions.none")}
                          </SelectItem>
                          <SelectItem value={DocumentsRagMode.All}>
                            {t("agent:props.documentsRagModeOptions.all")}
                          </SelectItem>
                          <SelectItem value={DocumentsRagMode.Tags}>
                            {t("agent:props.documentsRagModeOptions.tags")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.documentsRagMode && (
                    <p className="text-sm text-destructive">{errors.documentsRagMode.message}</p>
                  )}
                </Field>

                {documentsRagMode === DocumentsRagMode.Tags && documentTags.length > 0 && (
                  <Field>
                    <FieldLabel>{t("agent:props.documentTags")}</FieldLabel>
                    <Controller
                      control={control}
                      name={"documentTagIds" in agentSchema.shape ? "documentTagIds" : "tagsToAdd"}
                      render={({ field }) => {
                        return (
                          <div className="flex flex-wrap gap-2 items-center">
                            {field.value.map((tagId) => (
                              <Badge key={tagId} variant="secondary" className="gap-1">
                                {getTagNameById(documentTags, tagId)}
                                <button
                                  type="button"
                                  onClick={() =>
                                    field.onChange(field.value.filter((id) => id !== tagId))
                                  }
                                  className="opacity-60 hover:opacity-100"
                                >
                                  <XIcon className="size-3" />
                                </button>
                              </Badge>
                            ))}
                            <DocumentTagPicker
                              documentTags={documentTags}
                              attachedTagIds={field.value}
                              onAdd={(tagId) => field.onChange([...field.value, tagId])}
                            />
                          </div>
                        )
                      }}
                    />
                    {documentTagErrorMessage && (
                      <p className="text-sm text-destructive">{documentTagErrorMessage}</p>
                    )}
                  </Field>
                )}
              </div>
            )}

            <Field>
              <FieldLabel htmlFor="model">{t("agent:props.model")}</FieldLabel>
              <Controller
                control={control}
                name="model"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="model" aria-invalid={errors.model ? "true" : "false"}>
                      <SelectValue placeholder={t("agent:props.placeholders.model")} />
                    </SelectTrigger>
                    <SelectContent>
                      {extractModelListFromAgentType(agentType, hasFeature).map(([key, value]) => (
                        <SelectItem key={key} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.model && <p className="text-sm text-destructive">{errors.model.message}</p>}
            </Field>

            <Field>
              <FieldLabel htmlFor="temperature">{t("agent:props.temperature")}</FieldLabel>
              <Input
                id="temperature"
                type="number"
                step="0.01"
                min="0"
                max="2"
                placeholder={t("agent:props.placeholders.temperature")}
                {...register("temperature", { valueAsNumber: true })}
                aria-invalid={errors.temperature ? "true" : "false"}
              />
              {errors.temperature && (
                <p className="text-sm text-destructive">{errors.temperature.message}</p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="locale">{t("agent:props.locale")}</FieldLabel>
              <Controller
                control={control}
                name="locale"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="locale" aria-invalid={errors.locale ? "true" : "false"}>
                      <SelectValue placeholder={t("agent:props.placeholders.locale")} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(AgentLocale).map(([key, value]) => (
                        <SelectItem key={key} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.locale && <p className="text-sm text-destructive">{errors.locale.message}</p>}
            </Field>

            <Field orientation="horizontal" className="justify-end">
              <Button type="submit" className="w-fit">
                {editableAgent ? t("actions:update") : t("actions:create")}
              </Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </form>
  )
}
