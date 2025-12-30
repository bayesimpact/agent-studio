import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/shad/card";
import { SidebarLayout } from "./layouts/SidebarLayout";
import type { User } from "./sidebar/types";

export function Dashboard({ user }: {
  user: User
}) {

  return <SidebarLayout user={user}>
    <div className="flex gap-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex gap-2 items-center">
              Card A
            </div>
          </CardTitle>
          <CardDescription>
            This is Card A description.
          </CardDescription>
        </CardHeader>
        <CardContent>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex gap-2 items-center">
              Card B
            </div>
          </CardTitle>
          <CardDescription>
            This is Card B description.
          </CardDescription>
        </CardHeader>
        <CardContent>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </CardContent>
      </Card>
    </div>
  </SidebarLayout>
}
