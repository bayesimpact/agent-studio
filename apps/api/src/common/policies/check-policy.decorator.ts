import { SetMetadata } from "@nestjs/common"
import type { BasePolicy } from "./base-policy"

export type PolicyHandler = <T>(policy: BasePolicy<T>) => boolean
export const CHECK_POLICY_KEY = "check_policy"
export const CheckPolicy = (handler: PolicyHandler) => SetMetadata(CHECK_POLICY_KEY, handler)
