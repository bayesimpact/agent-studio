"use client"

import { AgentLocale, AgentModel } from "@caseai-connect/api-contracts"
import { Button } from "@caseai-connect/ui/shad/button"
import { CardContent, CardFooter } from "@caseai-connect/ui/shad/card"
import { Input } from "@caseai-connect/ui/shad/input"
import { Label } from "@caseai-connect/ui/shad/label"
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
import type { z } from "zod"
import {
  type AgentFormBaseProps,
  type AgentFormData,
  buildAgentSchema,
  getDefaultFormValues,
} from "./agent-form.shared"

export function ConversationAgentForm({
  defaultValues = getDefaultFormValues("conversation"),
  isLoading,
  error,
  onSubmit,
  submitLabelIdle,
  submitLabelLoading,
}: AgentFormBaseProps) {
  const { t } = useTranslation("agent", { keyPrefix: "form" })
  const agentSchema = buildAgentSchema(t)
  type FormValues = z.infer<typeof agentSchema>

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(agentSchema),
    defaultValues: defaultValues as FormValues,
  })

  const handleFormSubmit = async (data: FormValues) => {
    await onSubmit(data as AgentFormData)
    reset(data)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <CardContent className="space-y-4 mt-2 px-0">
        <div className="space-y-2">
          <Label htmlFor="name">{t("labelName")}</Label>
          <Input
            id="name"
            placeholder={t("placeholderName")}
            {...register("name")}
            disabled={isLoading}
            aria-invalid={errors.name ? "true" : "false"}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultPrompt">{t("labelPrompt")}</Label>
          <Textarea
            id="defaultPrompt"
            placeholder={t("placeholderPrompt")}
            rows={8}
            className="min-h-40"
            {...register("defaultPrompt")}
            disabled={isLoading}
            aria-invalid={errors.defaultPrompt ? "true" : "false"}
          />
          {errors.defaultPrompt && (
            <p className="text-sm text-destructive">{errors.defaultPrompt.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">{t("labelModel")}</Label>
          <Controller
            control={control}
            name="model"
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}
              >
                <SelectTrigger id="model" aria-invalid={errors.model ? "true" : "false"}>
                  <SelectValue placeholder={t("placeholderModel")} />
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="temperature">{t("labelTemperature")}</Label>
          <Input
            id="temperature"
            type="number"
            step="0.01"
            min="0"
            max="2"
            placeholder={t("placeholderTemperature")}
            {...register("temperature", { valueAsNumber: true })}
            disabled={isLoading}
            aria-invalid={errors.temperature ? "true" : "false"}
          />
          {errors.temperature && (
            <p className="text-sm text-destructive">{errors.temperature.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="locale">{t("labelLocale")}</Label>
          <Controller
            control={control}
            name="locale"
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}
              >
                <SelectTrigger id="locale" aria-invalid={errors.locale ? "true" : "false"}>
                  <SelectValue placeholder={t("placeholderLocale")} />
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
        </div>
      </CardContent>
      <CardFooter className="mt-4 px-0">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? submitLabelLoading : submitLabelIdle}
        </Button>
      </CardFooter>
    </form>
  )
}
