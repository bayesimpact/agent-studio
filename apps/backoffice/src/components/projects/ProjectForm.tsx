"use client"

import { Button } from "@caseai-connect/ui/shad/button"
import { CardContent, CardFooter } from "@caseai-connect/ui/shad/card"
import { Input } from "@caseai-connect/ui/shad/input"
import { Label } from "@caseai-connect/ui/shad/label"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
})

type ProjectFormData = z.infer<typeof projectSchema>

interface ProjectFormProps {
  defaultName?: string
  isLoading: boolean
  error: string | null
  onSubmit: (values: ProjectFormData) => Promise<void> | void
  submitLabelIdle: string
  submitLabelLoading: string
}

export function ProjectForm({
  defaultName,
  isLoading,
  error,
  onSubmit,
  submitLabelIdle,
  submitLabelLoading,
}: ProjectFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: defaultName ?? "",
    },
  })

  const handleFormSubmit = async (data: ProjectFormData) => {
    await onSubmit(data)
    reset({ name: data.name })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <CardContent className="space-y-4 mt-2 px-0">
        <div className="space-y-2">
          <Label htmlFor="name">Project Name</Label>
          <Input
            id="name"
            placeholder="Enter project name"
            {...register("name")}
            disabled={isLoading}
            aria-invalid={errors.name ? "true" : "false"}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          {error && !errors.name && <p className="text-sm text-destructive">{error}</p>}
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
