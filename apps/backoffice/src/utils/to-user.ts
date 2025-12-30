import type { User } from "@/components/sidebar/types";
import type { User as UserDTO } from "@auth0/auth0-react";

export function toUser(user: UserDTO): User {
  return {
    name: user.nickname || user.name || "Unknown name",
    email: user.email || "Unknown email",
    avatar: user.picture,
  }
}
