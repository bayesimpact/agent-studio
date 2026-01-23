"use client"

import { Button } from "@caseai-connect/ui/shad/button"
import { CardContent, CardFooter } from "@caseai-connect/ui/shad/card"
import { Input } from "@caseai-connect/ui/shad/input"
import { Label } from "@caseai-connect/ui/shad/label"
import { Textarea } from "@caseai-connect/ui/shad/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

const chatBotSchema = z.object({
  name: z.string().min(3, "ChatBot name must be at least 3 characters"),
  defaultPrompt: z.string().min(1, "Default prompt is required"),
})

type ChatBotFormData = z.infer<typeof chatBotSchema>

interface ChatBotFormProps {
  defaultName?: string
  defaultPrompt?: string
  isLoading: boolean
  error: string | null
  onSubmit: (values: ChatBotFormData) => Promise<void> | void
  submitLabelIdle: string
  submitLabelLoading: string
}

export function ChatBotForm({
  defaultName,
  defaultPrompt,
  isLoading,
  error,
  onSubmit,
  submitLabelIdle,
  submitLabelLoading,
}: ChatBotFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChatBotFormData>({
    resolver: zodResolver(chatBotSchema),
    defaultValues: {
      name: defaultName ?? "",
      defaultPrompt: defaultPrompt ?? "",
    },
  })

  const handleFormSubmit = async (data: ChatBotFormData) => {
    await onSubmit(data)
    reset({ name: data.name, defaultPrompt: data.defaultPrompt })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <CardContent className="space-y-4 mt-2 px-0">
        <div className="space-y-2">
          <Label htmlFor="name">ChatBot Name</Label>
          <Input
            id="name"
            placeholder="Enter chat bot name"
            {...register("name")}
            disabled={isLoading}
            aria-invalid={errors.name ? "true" : "false"}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="defaultPrompt">Default Prompt</Label>
          <Textarea
            id="defaultPrompt"
            placeholder="Enter the default prompt for this chat bot"
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
