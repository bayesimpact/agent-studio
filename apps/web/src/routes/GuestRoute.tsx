import { Button } from "@caseai-connect/ui/shad/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@caseai-connect/ui/shad/card"
import { Link } from "react-router-dom"
import { FullPageCenterLayout } from "@/components/layouts/FullPageCenterLayout"

export function GuestRoute() {
  return (
    <FullPageCenterLayout>
      <Card className="min-w-1/3">
        <CardHeader>
          <CardTitle>Welcome, Guest!</CardTitle>
          <CardDescription>
            This page is public and does not require authentication.
          </CardDescription>
        </CardHeader>

        <CardFooter>
          <Button asChild>
            <Link to="/">Back</Link>
          </Button>
        </CardFooter>
      </Card>
    </FullPageCenterLayout>
  )
}
