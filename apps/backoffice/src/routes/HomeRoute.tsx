import { FullPageCenterLayout } from "@/components/layouts/FullPageCenterLayout";
import { LoginButton } from "@/components/LoginButton";
import LogoutButton from "@/components/LogoutButton";
import { api } from "@/external/api";
import { useAsyncNotification } from "@/hooks/use-async-notification";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@repo/ui/shad/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/shad/card";
import { Link } from "react-router-dom";
import { LoadingRoute } from "./LoadingRoute";

export function HomeRoute() {
  const { user, isLoading, isAuthenticated } = useAuth0()

  if (isLoading) return <LoadingRoute />

  const { showAsyncNotification } = useAsyncNotification(api.test.getHello)

  return <FullPageCenterLayout>
    <Card className="w-1/2">
      <CardHeader>
        <CardTitle>{user?.nickname ? <>Welcome, <span className="capitalize">{user.nickname}</span></> : 'Welcome Stranger'}!</CardTitle>
        <CardDescription>{user ? <>{user.email}</> : `I don't know who you are. Tell me about yourself.`}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-4">
          <Button
            variant="outline"
            onClick={showAsyncNotification}
          >
            Test to call a protected API endpoint
          </Button>

          <div>
            <Button asChild variant='outline'>
              <Link to="/profile">Profile</Link>
            </Button>
          </div>


          <Button variant='outline' asChild>
            <Link to="/guest">Browse as a guest</Link>
          </Button>

        </div>
      </CardContent>
      <CardFooter >
        {!isAuthenticated ? <LoginButton /> : <LogoutButton />}
      </CardFooter>
    </Card>
  </FullPageCenterLayout>
}
