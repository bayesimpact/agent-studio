"use client"

import { Button } from "@caseai-connect/ui/shad/button"
import { CardContent, CardFooter } from "@caseai-connect/ui/shad/card"
import { Input } from "@caseai-connect/ui/shad/input"
import { Label } from "@caseai-connect/ui/shad/label"
import { Textarea } from "@caseai-connect/ui/shad/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

interface ChatBotFormProps {
  defaultValues?: {
    name: string
    defaultPrompt: string
  }
  isLoading: boolean
  error: string | null
  onSubmit: (values: ChatBotFormData) => Promise<void> | void
  submitLabelIdle: string
  submitLabelLoading: string
}

type ChatBotFormData = {
  name: string
  defaultPrompt: string
}

export function ChatBotForm({
  defaultValues = { name: "", defaultPrompt: "" },
  isLoading,
  error,
  onSubmit,
  submitLabelIdle,
  submitLabelLoading,
}: ChatBotFormProps) {
  const { t } = useTranslation("chatBot", { keyPrefix: "form" })

  const chatBotSchema = z.object({
    name: z.string().min(3, t("validation.nameMinLength")),
    defaultPrompt: z.string().min(1, t("validation.promptRequired")),
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChatBotFormData>({
    resolver: zodResolver(chatBotSchema),
    defaultValues,
  })

  const handleFormSubmit = async (data: ChatBotFormData) => {
    await onSubmit(data)
    reset({ name: data.name, defaultPrompt: data.defaultPrompt })
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
            {...register("defaultPrompt")}
            disabled={isLoading}
            aria-invalid={errors.defaultPrompt ? "true" : "false"}
          />
          {errors.defaultPrompt && (
            <p className="text-sm text-destructive">{errors.defaultPrompt.message}</p>
          )}
          {error && !errors.name && !errors.defaultPrompt && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="mt-4 px-0">
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? submitLabelLoading : submitLabelIdle}
        </Button>
      </CardFooter>
    </form>
  )
}
