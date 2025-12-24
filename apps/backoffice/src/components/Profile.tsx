import { LoadingRoute } from "@/routes/LoadingRoute";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@repo/ui/shad/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/shad/card";
import { Link } from "react-router-dom";
import { FullPageCenterLayout } from "./layouts/FullPageCenterLayout";

const Profile = () => {
  const { user, isAuthenticated, isLoading } = useAuth0()

  if (isLoading) return <LoadingRoute />

  return (
    isAuthenticated && user ? (
      <FullPageCenterLayout>
        <Card>
          <CardHeader>
            <CardTitle className="capitalize">
              Welcome {user.nickname}!
            </CardTitle>
            <CardDescription>
              {user.email}
            </CardDescription>
          </CardHeader>

          <CardContent>
            You have successfully logged in to the Backoffice application.
          </CardContent>

          <CardFooter className=" justify-between">
            <Button asChild><Link to='/'>Home</Link></Button>
          </CardFooter>
        </Card>
      </FullPageCenterLayout>
    ) : null
  )
}

export default Profile;
