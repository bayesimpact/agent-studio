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

export function ExtractionAgentForm({
  editableAgent,
  onSubmit,
}: {
  editableAgent?: Agent
  onSubmit: (values: AgentFormData) => Promise<void> | void
}) {
  const { t } = useTranslation()
  const agentSchema = buildAgentSchema((key) => t(`agent:props.${key}`)).extend({
    outputJsonSchemaText: z
      .string()
      .min(1, t("agent:props.validation.outputJsonSchemaRequired"))
      .refine(isValidJsonObject, t("agent:props.validation.outputJsonSchemaInvalid")),
  })
  type FormValues = z.infer<typeof agentSchema>

  const defaultValues = editableAgent
    ? ({
        ...editableAgent,
        outputJsonSchemaText: editableAgent.outputJsonSchema
          ? JSON.stringify(editableAgent.outputJsonSchema, null, 2)
          : "",
      } as FormValues)
    : ({
        ...getDefaultFormValues("extraction"),
        outputJsonSchemaText: "",
      } as FormValues)

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
    // data is already validated and coerced
    await onSubmit(data as AgentFormData)
    // Optional: reset to new values or keep form state.
    // If we want to reset to the *initial* defaults (clearing the form), use defaultValues.
    // If we want to update the "pristine" state to current values, use reset(data).
    // The previous code reset to defaultValues, which might be intended to "clear" the form or "reset to saved state".
    // For now I'll keep the previous behavior but fix the variable.
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

            <Field>
              <FieldLabel htmlFor="outputJsonSchemaText">
                {t("agent:props.outputJsonSchema")}
              </FieldLabel>
              <Textarea
                id="outputJsonSchemaText"
                placeholder={t("agent:props.placeholders.outputJsonSchema")}
                rows={10}
                className="font-mono min-h-56"
                {...register("outputJsonSchemaText")}
                aria-invalid={errors.outputJsonSchemaText ? "true" : "false"}
              />
              {errors.outputJsonSchemaText && (
                <p className="text-sm text-destructive">{errors.outputJsonSchemaText.message}</p>
              )}
            </Field>

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
                      {Object.entries(AgentModel).map(([key, value]) => (
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
