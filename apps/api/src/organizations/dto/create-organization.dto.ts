import { IsString, MinLength } from "class-validator"

export class CreateOrganizationDto {
  @IsString()
  @MinLength(3, { message: "Organization name must be at least 3 characters long" })
  name!: string
}
