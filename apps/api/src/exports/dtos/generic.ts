export type TimeType = number // milliseconds since midnight, January 1, 1970 UTC.

export type RequestPayload<T> = {
  payload: T
}

export type ResponseData<T> = {
  data: T
}

export type SuccessResponseDTO = { success: true }
