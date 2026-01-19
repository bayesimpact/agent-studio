import type { ProjectDto } from "@caseai-connect/api-contracts"
import { Button } from "@caseai-connect/ui/shad/button"
import { CardContent, CardFooter } from "@caseai-connect/ui/shad/card"
import { Input } from "@caseai-connect/ui/shad/input"
import { Label } from "@caseai-connect/ui/shad/label"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { selectProjectsError, selectProjectsStatus } from "@/features/projects/projects.selectors"
import { createProject, updateProject } from "@/features/projects/projects.thunks"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
})

type ProjectFormData = z.infer<typeof projectSchema>

interface CreateProjectFormProps {
  organizationId: string
  project?: ProjectDto
  onSuccess?: () => void
}

export function CreateProjectForm({ organizationId, project, onSuccess }: CreateProjectFormProps) {
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectProjectsStatus)
  const error = useAppSelector(selectProjectsError)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name || "",
    },
  })

  const onSubmit = async (data: ProjectFormData) => {
    try {
      if (project) {
        await dispatch(
          updateProject({ projectId: project.id, payload: { name: data.name } }),
        ).unwrap()
        toast.success("Project updated successfully!")
      } else {
        await dispatch(createProject({ name: data.name, organizationId })).unwrap()
        toast.success("Project created successfully!")
      }
      reset()
      onSuccess?.()
    } catch (err) {
      const errorMessage =
        (err as { message?: string })?.message ||
        (project ? "Failed to update project" : "Failed to create project")
      toast.error(errorMessage)
    }
  }

  const isLoading = status === "loading"

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <CardContent className="space-y-4 pt-6">
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
      <CardFooter>
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading
            ? project
              ? "Updating..."
              : "Creating..."
            : project
              ? "Update Project"
              : "Create Project"}
        </Button>
      </CardFooter>
    </form>
  )
}
