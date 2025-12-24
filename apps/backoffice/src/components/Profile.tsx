import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@repo/ui/shad/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/shad/card";
import { Link } from "react-router-dom";
import { FullPageCenterLayout } from "./layouts/FullPageCenterLayout";
import LogoutButton from "./LogoutButton";

const Profile = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <div className="loading-text">Loading profile...</div>;
  }

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
            <LogoutButton />
            <Button asChild><Link to='/'>Home</Link></Button>
          </CardFooter>
        </Card>
      </FullPageCenterLayout>
    ) : null
  );
};

export default Profile;
