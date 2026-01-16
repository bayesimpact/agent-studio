import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { User } from "./user.entity"

export interface Auth0UserInfo {
  sub: string
  email?: string
  name?: string
  picture?: string
}

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

  async create(auth0UserInfo: Auth0UserInfo): Promise<User> {
    const user = this.userRepository.create({
      auth0Id: auth0UserInfo.sub,
      email: auth0UserInfo.email || "",
      name: auth0UserInfo.name || null,
      pictureUrl: auth0UserInfo.picture || null,
    })

    return this.userRepository.save(user)
  }

  async findOrCreate(auth0UserInfo: Auth0UserInfo): Promise<User> {
    const existingUser = await this.findByAuth0Id(auth0UserInfo.sub)
    if (existingUser) {
      // Update user info in case it changed in Auth0
      if (
        auth0UserInfo.email !== existingUser.email ||
        auth0UserInfo.name !== existingUser.name ||
        auth0UserInfo.picture !== existingUser.pictureUrl
      ) {
        existingUser.email = auth0UserInfo.email || existingUser.email
        existingUser.name = auth0UserInfo.name || existingUser.name
        existingUser.pictureUrl = auth0UserInfo.picture || existingUser.pictureUrl
        return this.userRepository.save(existingUser)
      }
      return existingUser
    }

    return this.create(auth0UserInfo)
  }
}
