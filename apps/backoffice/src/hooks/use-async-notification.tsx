import { toast } from "sonner"

export function useAsyncNotification(asyncFunction: () => Promise<string>) {
  const showAsyncNotification = async () => {
    toast.promise<string>(
      async () => {
        const response = await asyncFunction()
        return response
      },
      {
        loading: "Loading...",
        success: (data: string) => data,
        error: (error: {
          response?: { data?: { statusCode?: number; message?: string } }
          message?: string
        }) => (
          <div className="flex flex-col">
            <span className="font-medium">{`Error: ${error.response?.data?.statusCode || "Unknown"}`}</span>
            <span className="text-muted-foreground font-normal whitespace-break-spaces">
              {error.response?.data?.message || error.message || "Unknown error occurred."}
            </span>
          </div>
        ),
      },
    )
  }

  return { showAsyncNotification }
}
