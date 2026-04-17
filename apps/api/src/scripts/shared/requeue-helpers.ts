export type BaseRequeueOptions = {
  dryRun: boolean
  limit?: number
  batchSize: number
  organizationId?: string
  projectId?: string
}

export function parseBaseRequeueOptions(argv: string[]): BaseRequeueOptions {
  const limitArg = getOptionalArgValue(argv, "--limit")
  const batchSizeArg = getOptionalArgValue(argv, "--batch-size")

  return {
    dryRun: argv.includes("--dry-run"),
    limit: limitArg ? Number.parseInt(limitArg, 10) : undefined,
    batchSize: batchSizeArg ? Number.parseInt(batchSizeArg, 10) : 200,
    organizationId: getOptionalArgValue(argv, "--organization-id"),
    projectId: getOptionalArgValue(argv, "--project-id"),
  }
}

export function getOptionalArgValue(argv: string[], argName: string): string | undefined {
  const argIndex = argv.indexOf(argName)
  return argIndex >= 0 ? argv[argIndex + 1] : undefined
}

export function validateBaseRequeueOptions(options: BaseRequeueOptions): void {
  if (options.limit !== undefined && (Number.isNaN(options.limit) || options.limit <= 0)) {
    throw new Error("Invalid --limit value. It must be a positive integer.")
  }

  if (Number.isNaN(options.batchSize) || options.batchSize <= 0) {
    throw new Error("Invalid --batch-size value. It must be a positive integer.")
  }
}

export function chunk<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = []
  for (let index = 0; index < items.length; index += batchSize) {
    batches.push(items.slice(index, index + batchSize))
  }
  return batches
}
