import "dotenv/config"
export function getTraceUrl(traceId: string): string {
  return `${process.env.LANGFUSE_BASE_URL}/trace/${traceId}`
}
