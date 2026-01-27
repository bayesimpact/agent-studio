import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import type { Auth0UserInfoResponse } from "@/auth/auth0-userinfo.service"
import { User } from "./user.entity"

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByAuth0Id(auth0Id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { auth0Id } })
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } })
  }

  async create(auth0UserInfo: Auth0UserInfoResponse): Promise<User> {
    // Ensure email is provided (required field)
    if (!auth0UserInfo.email) {
      throw new Error("Email is required from Auth0 token")
    }

    const user = this.userRepository.create({
      auth0Id: auth0UserInfo.sub,
      email: auth0UserInfo.email,
      name: auth0UserInfo.name || null,
      pictureUrl: auth0UserInfo.picture || null,
    })

    return this.userRepository.save(user)
  }
}
