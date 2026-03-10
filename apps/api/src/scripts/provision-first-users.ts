import { readFileSync } from "node:fs"
import { NestFactory } from "@nestjs/core"
import { AppModule } from "@/app.module"
import {
  type FirstUserProvisioningResult,
  FirstUserProvisioningService,
} from "@/domains/organizations/provisioning/first-user-provisioning.service"

type CliOptions = {
  csvFilePath: string
  dryRun: boolean
}

type CsvRow = {
  email: string
  organizationName: string
  fullName?: string
}

type CliRowResult =
  | FirstUserProvisioningResult
  | {
      status: "failed"
      email: string
      organizationName: string
      message: string
    }
  | {
      status: "would_create" | "would_skip_duplicate"
      email: string
      organizationName: string
      message: string
    }

export function parseCliOptions(argv: string[]): CliOptions {
  const csvFilePathIndex = argv.indexOf("--file")
  if (csvFilePathIndex < 0 || !argv[csvFilePathIndex + 1]) {
    throw new Error("Missing required argument: --file <path-to-csv>")
  }

  return {
    csvFilePath: argv[csvFilePathIndex + 1]!,
    dryRun: argv.includes("--dry-run"),
  }
}

export function parseProvisioningCsv(csvContent: string): CsvRow[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length < 2) {
    return []
  }

  const headerColumns = parseCsvLine(lines[0]!)
  const emailIndex = headerColumns.indexOf("email")
  const organizationNameIndex = headerColumns.indexOf("organizationName")
  const fullNameIndex = headerColumns.indexOf("fullName")

  if (emailIndex < 0 || organizationNameIndex < 0) {
    throw new Error("CSV must include required headers: email, organizationName")
  }

  return lines.slice(1).map((line, lineIndex) => {
    const values = parseCsvLine(line)
    const email = values[emailIndex]?.trim() ?? ""
    const organizationName = values[organizationNameIndex]?.trim() ?? ""
    const fullName = fullNameIndex >= 0 ? values[fullNameIndex]?.trim() : undefined

    if (!email || !organizationName) {
      throw new Error(
        `Invalid CSV row at line ${lineIndex + 2}: email and organizationName are required`,
      )
    }

    return {
      email,
      organizationName,
      ...(fullName ? { fullName } : {}),
    }
  })
}

export async function runProvisioningBatch(params: {
  rows: CsvRow[]
  dryRun: boolean
  provisioningService: FirstUserProvisioningService
}): Promise<CliRowResult[]> {
  const results: CliRowResult[] = []

  for (const row of params.rows) {
    try {
      if (params.dryRun) {
        const preview = await params.provisioningService.previewProvisioning({
          email: row.email,
          organizationName: row.organizationName,
          fullName: row.fullName,
        })
        results.push({
          status: preview.status,
          email: preview.email,
          organizationName: preview.organizationName,
          message:
            preview.status === "would_create"
              ? "Would create account and send password reset email."
              : "Would skip duplicate local account and still send password reset email.",
        })
        continue
      }

      const rowResult = await params.provisioningService.provisionFirstUser({
        email: row.email,
        organizationName: row.organizationName,
        fullName: row.fullName,
      })
      results.push(rowResult)
    } catch (error) {
      results.push({
        status: "failed",
        email: row.email.trim().toLowerCase(),
        organizationName: row.organizationName.trim(),
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  return results
}

function printSummary(results: CliRowResult[]): void {
  const createdCount = results.filter((result) => result.status === "created").length
  const skippedCount = results.filter((result) =>
    ["skipped_duplicate", "would_skip_duplicate"].includes(result.status),
  ).length
  const failedCount = results.filter((result) => result.status === "failed").length
  const wouldCreateCount = results.filter((result) => result.status === "would_create").length

  for (const result of results) {
    console.log(
      `[${result.status}] email=${result.email} organization=${result.organizationName} message=${result.message}`,
    )
  }

  console.log("-----")
  console.log(
    `Summary: total=${results.length} created=${createdCount} skipped=${skippedCount} failed=${failedCount} would_create=${wouldCreateCount}`,
  )
}

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let currentValue = ""
  let insideQuotes = false

  for (const character of line) {
    if (character === '"') {
      insideQuotes = !insideQuotes
      continue
    }

    if (character === "," && !insideQuotes) {
      values.push(currentValue)
      currentValue = ""
      continue
    }

    currentValue += character
  }

  values.push(currentValue)
  return values
}

async function bootstrapCli(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2))
  const csvContent = readFileSync(options.csvFilePath, "utf-8")
  const rows = parseProvisioningCsv(csvContent)
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn", "log"],
  })

  try {
    const provisioningService = app.get(FirstUserProvisioningService)
    const results = await runProvisioningBatch({
      rows,
      dryRun: options.dryRun,
      provisioningService,
    })
    printSummary(results)
  } finally {
    await app.close()
  }
}

if (require.main === module) {
  void bootstrapCli()
}
