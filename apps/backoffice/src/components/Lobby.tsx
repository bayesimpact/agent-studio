import type { User } from "@caseai-connect/ui/components/layouts/sidebar/types"
import { Button } from "@caseai-connect/ui/shad/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@caseai-connect/ui/shad/card"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { LoginButton } from "@/components/LoginButton"
import LogoutButton from "@/components/LogoutButton"
import { FullPageCenterLayout } from "@/components/layouts/FullPageCenterLayout"
import { getHello } from "@/features/test/test.thunks"
import { useAppDispatch } from "@/store/hooks"

export function Lobby({ user, isAuthenticated }: { user?: User; isAuthenticated: boolean }) {
  const dispatch = useAppDispatch()

  const showAsyncNotification = async () => {
    toast.promise(
      dispatch(getHello())
        .unwrap()
        .then((result: { data: string }) => result.data),
      {
        loading: "Loading...",
        success: (data: string) => data,
        error: (error: { statusCode?: number; message?: string }) => (
          <div className="flex flex-col">
            <span className="font-medium">{`Error: ${error.statusCode || "Unknown"}`}</span>
            <span className="text-muted-foreground font-normal whitespace-break-spaces">
              {error.message || "Unknown error occurred."}
            </span>
          </div>
        ),
      },
    )
  }

  return (
    <FullPageCenterLayout>
      <Card className="w-1/2">
        <CardHeader>
          <CardTitle>
            {user?.name ? (
              <>
                Welcome, <span className="capitalize">{user.name}</span>
              </>
            ) : (
              "Welcome Stranger"
            )}
            !
          </CardTitle>
          <CardDescription>
            {user ? user.email : `I don't know who you are. Tell me about yourself.`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" onClick={showAsyncNotification}>
              Test to call a protected API endpoint
            </Button>

            <div>
              <Button asChild variant="outline">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            </div>

            <Button variant="outline" asChild>
              <Link to="/guest">Browse as a guest</Link>
            </Button>
          </div>
        </CardContent>
        <CardFooter>{!isAuthenticated ? <LoginButton /> : <LogoutButton />}</CardFooter>
      </Card>
    </FullPageCenterLayout>
  )
}
