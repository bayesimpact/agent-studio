"use client"

import { AgentLocale, AgentModel } from "@caseai-connect/api-contracts"
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
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import type { Agent } from "@/features/agents/agents.models"
import {
  type AgentFormData,
  buildAgentSchema,
  getDefaultFormValues,
  isValidJsonObject,
} from "./agent-form.shared"

export function BaseAgentForm({
  editableAgent,
  onSubmit,
  agentType,
}: {
  agentType: Agent["type"]
  editableAgent?: Agent
  onSubmit: (values: AgentFormData) => Promise<void> | void
}) {
  const { t, i18n } = useTranslation()
  const baseAgentSchema = buildAgentSchema((key) => t(`agent:props.${key}`))

  const hasOutputJsonSchema = agentType !== "conversation"

  type FormValues = z.infer<typeof baseAgentSchema> &
    (typeof hasOutputJsonSchema extends true ? { outputJsonSchemaText: string } : object)

  const agentSchema = hasOutputJsonSchema
    ? baseAgentSchema.extend({
        outputJsonSchemaText: z
          .string()
          .min(1, t("agent:props.validation.outputJsonSchemaRequired"))
          .refine(isValidJsonObject, t("agent:props.validation.outputJsonSchemaInvalid")),
      })
    : baseAgentSchema

  const defaultValues = (function buildDefaultValues() {
    if (editableAgent) {
      return {
        ...editableAgent,
        ...(hasOutputJsonSchema && {
          outputJsonSchemaText: editableAgent.outputJsonSchema
            ? JSON.stringify(editableAgent.outputJsonSchema, null, 2)
            : "",
        }),
      } as FormValues
    }
    const language = i18n.language.startsWith("fr") ? AgentLocale.FR : AgentLocale.EN
    return {
      ...getDefaultFormValues({ agentType, language }),
      ...(hasOutputJsonSchema && { outputJsonSchemaText: "" }),
    } as FormValues
  })()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(agentSchema),
    defaultValues,
  })

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
                <FieldLabel htmlFor="outputJsonSchemaText">
                  {t("agent:props.outputJsonSchema")}
                </FieldLabel>
                <Textarea
                  id="outputJsonSchemaText"
                  placeholder={t("agent:props.placeholders.outputJsonSchema")}
                  rows={10}
                  className="font-mono min-h-56"
                  // @ts-expect-error
                  {...register("outputJsonSchemaText")}
                  // @ts-expect-error
                  aria-invalid={errors.outputJsonSchemaText ? "true" : "false"}
                />
                {
                  // @ts-expect-error
                  errors.outputJsonSchemaText && (
                    <p className="text-sm text-destructive">
                      {
                        // @ts-expect-error
                        errors.outputJsonSchemaText.message
                      }
                    </p>
                  )
                }
              </Field>
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
                      {Object.entries(AgentModel)
                        .filter(([key]) => !key.startsWith("_Mock"))
                        .map(([key, value]) => (
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
