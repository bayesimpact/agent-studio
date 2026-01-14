import { Button } from "@repo/ui/shad/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/shad/card"
import { Link } from "react-router-dom"
import { LoginButton } from "@/components/LoginButton"
import LogoutButton from "@/components/LogoutButton"
import { FullPageCenterLayout } from "@/components/layouts/FullPageCenterLayout"
import { useAsyncNotification } from "@/hooks/use-async-notification"
import { api } from "@/services/api"
import type { User } from "./sidebar/types"

export function Lobby({ user, isAuthenticated }: { user?: User; isAuthenticated: boolean }) {
  const { showAsyncNotification } = useAsyncNotification(api.test.getHello)

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
