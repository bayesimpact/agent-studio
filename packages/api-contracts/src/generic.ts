import { z } from "zod"

export const timeTypeSchema = z.number()
export type TimeType = z.infer<typeof timeTypeSchema> // milliseconds since midnight, January 1, 1970 UTC.

export type RequestPayload<T> = {
  payload: T
}

export type ResponseData<T> = {
  data: T
}

export type SuccessResponseDTO = { success: true }

export type ErrorResponseDTO = {
  message: string
  error: string
  statusCode: number
}
