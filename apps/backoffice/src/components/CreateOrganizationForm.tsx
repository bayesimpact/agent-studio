import { Button } from "@caseai-connect/ui/shad/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@caseai-connect/ui/shad/card"
import { Input } from "@caseai-connect/ui/shad/input"
import { Label } from "@caseai-connect/ui/shad/label"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { z } from "zod"
import { fetchMe } from "@/features/me/me.thunks"
import {
  selectOrganizationsError,
  selectOrganizationsStatus,
} from "@/features/organizations/organizations.selectors"
import { createOrganization } from "@/features/organizations/organizations.thunks"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { FullPageCenterLayout } from "./layouts/FullPageCenterLayout"

const createOrganizationSchema = z.object({
  name: z.string().min(3, "Organization name must be at least 3 characters long"),
})

type CreateOrganizationFormData = z.infer<typeof createOrganizationSchema>

export function CreateOrganizationForm() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const status = useAppSelector(selectOrganizationsStatus)
  const error = useAppSelector(selectOrganizationsError)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateOrganizationFormData>({
    resolver: zodResolver(createOrganizationSchema),
  })

  const onSubmit = async (data: CreateOrganizationFormData) => {
    try {
      await dispatch(createOrganization({ name: data.name })).unwrap()
      // Refresh user data to get updated organizations list (Option A)
      await dispatch(fetchMe()).unwrap()
      toast.success("Organization created successfully!")
      // Redirect to dashboard
      navigate("/dashboard", { replace: true })
    } catch (err) {
      const errorMessage = (err as { message?: string })?.message || "Failed to create organization"
      toast.error(errorMessage)
    }
  }

  const isLoading = status === "loading"

  return (
    <FullPageCenterLayout>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Your Organization</CardTitle>
          <CardDescription>
            Get started by creating your first organization. You can add more later.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                placeholder="Enter organization name"
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
              {isLoading ? "Creating..." : "Create Organization"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </FullPageCenterLayout>
  )
}
