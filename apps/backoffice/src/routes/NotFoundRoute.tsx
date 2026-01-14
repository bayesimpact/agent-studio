import { Button } from "@repo/ui/shad/button"
import { Link } from "react-router-dom"

export function NotFoundRoute() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-4">404 - Not Found</h1>
      <p className="text-lg text-center mb-8">
        The page you are looking for does not exist. Please check the URL or return to the home
        page.
      </p>
      <Button asChild>
        <Link to="/">Home</Link>
      </Button>
    </div>
  )
}
