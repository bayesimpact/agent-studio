import { FullPageCenterLayout } from "@/components/layouts/FullPageCenterLayout";
import { LoginButton } from "@/components/LoginButton";
import LogoutButton from "@/components/LogoutButton";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@repo/ui/shad/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/shad/card";
import { cn } from "@repo/ui/utils";
import { Link } from "react-router-dom";

export function HomeRoute() {
  const { user, accessToken, isLoading, isAuthenticated } = useAuth();
  return <FullPageCenterLayout>
    <Card className="w-1/2">
      <CardHeader>
        <CardTitle>Welcome, {user?.name}!</CardTitle>
        <CardDescription>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <Button asChild variant={isAuthenticated ? 'default' : 'secondary'}>
            <Link to="/profile">Profile <span className={cn(isAuthenticated && 'hidden')}>*</span></Link>
          </Button>
          {!isAuthenticated ? <LoginButton /> : <LogoutButton />}
          <Button variant='outline' asChild>
            <Link to="/guest">Browse as a guest</Link>
          </Button>
        </div>
        <p className={cn("mt-0.5 text-xs text-muted-foreground", isAuthenticated && 'hidden')}>* Requires authentication.{' '}</p>
      </CardContent>


      <CardFooter className="flex flex-col items-start gap-4">
        <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-md w-full">
          {isLoading ? (
            <p>Loading authentication details...</p>
          ) : accessToken ? (
            <div className="overflow-hidden">
              <p className="font-semibold pb-1">Access Token:</p>
              <pre className="text-xs italic whitespace-pre-wrap">{accessToken}</pre>
            </div>
          ) : (
            <p>No access token available.</p>
          )}
        </div>
      </CardFooter>
    </Card>
  </FullPageCenterLayout>
}
