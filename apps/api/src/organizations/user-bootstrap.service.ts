import { Injectable } from "@nestjs/common"
import type { Auth0UserInfo, UsersService } from "@/users/users.service"

@Injectable()
export class UserBootstrapService {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Ensures a user exists locally.
   * This is idempotent and safe to call multiple times.
   */
  async ensureUser(
    auth0UserInfo: Auth0UserInfo,
  ): Promise<Awaited<ReturnType<UsersService["findOrCreate"]>>> {
    // Find or create user
    return this.usersService.findOrCreate(auth0UserInfo)
  }
}
