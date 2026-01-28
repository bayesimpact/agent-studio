enum Status {
  UNINITIALIZED = "uninitialized",
  LOADING = "loading",
  FULFILLED = "fulfilled",
  ERROR = "error",
}

export type AsyncData<T> =
  | {
      status: Status.UNINITIALIZED
      error: null
      value: null
    }
  | {
      status: Status.LOADING
      error: null
      value: null
    }
  | {
      value: T
      status: Status.FULFILLED
      error: null
    }
  | {
      status: Status.ERROR
      error: string
      value: null
    }

// biome-ignore lint/suspicious/noExplicitAny: wanted
export const defaultAsyncData: AsyncData<any> = {
  status: Status.UNINITIALIZED,
  error: null,
  value: null,
}

export const ADS = Object.freeze({
  // Enum
  Error: Status.ERROR,
  Loading: Status.LOADING,
  Uninitialized: Status.UNINITIALIZED,
  Fulfilled: Status.FULFILLED,

  // Checkers
  isFulfilled<T>(
    data: AsyncData<T> | Status,
  ): data is { value: T; status: Status.FULFILLED; error: null } {
    if (typeof data === "string") {
      return data === this.Fulfilled
    }
    return data.status === this.Fulfilled
  },
  isLoading<T>(data: AsyncData<T> | Status): boolean {
    if (typeof data === "string") {
      return data === this.Loading
    }
    return data.status === this.Loading
  },
  isError<T>(data: AsyncData<T> | Status): boolean {
    if (typeof data === "string") {
      return data === this.Error
    }
    return data.status === this.Error
  },
  isUninitialized<T>(data: AsyncData<T> | Status): boolean {
    if (typeof data === "string") {
      return data === this.Uninitialized
    }
    return data.status === this.Uninitialized
  },
})
