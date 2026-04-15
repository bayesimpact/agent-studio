import { type ChildProcess, spawn } from "node:child_process"

type RunCommandResult = {
  exitCode: number
  signal: NodeJS.Signals | null
}

let activeChildProcess: ChildProcess | null = null
let receivedTerminationSignal = false

function runCommand(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
): Promise<RunCommandResult> {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, args, {
      stdio: "inherit",
      env,
      shell: process.platform === "win32",
    })
    activeChildProcess = childProcess

    childProcess.on("error", (error) => {
      reject(error)
    })

    childProcess.on("close", (exitCode, signal) => {
      if (activeChildProcess === childProcess) {
        activeChildProcess = null
      }
      resolve({
        exitCode: exitCode ?? 1,
        signal,
      })
    })
  })
}

function forwardSignalToActiveChild(signal: NodeJS.Signals): void {
  receivedTerminationSignal = true
  if (activeChildProcess?.pid) {
    activeChildProcess.kill(signal)
  }
}

async function main(): Promise<void> {
  process.env.TEST_USE_WORKER_DATABASE = "true"
  process.env.TEST_MAX_WORKERS ??= "50%"

  process.on("SIGINT", () => forwardSignalToActiveChild("SIGINT"))
  process.on("SIGTERM", () => forwardSignalToActiveChild("SIGTERM"))

  const scriptEnvironment = { ...process.env }
  const jestAdditionalArguments = process.argv.slice(2)
  let prepareExitCode = 0
  let jestExitCode = 0
  let cleanupExitCode = 0

  try {
    const prepareResult = await runCommand(
      "npm",
      ["run", "test:workers:prepare"],
      scriptEnvironment,
    )
    prepareExitCode = prepareResult.exitCode

    if (prepareExitCode === 0) {
      const jestResult = await runCommand(
        process.execPath,
        [
          "--experimental-vm-modules",
          "../../node_modules/jest/bin/jest.js",
          "--colors",
          `--maxWorkers=${scriptEnvironment.TEST_MAX_WORKERS ?? "50%"}`,
          ...jestAdditionalArguments,
        ],
        scriptEnvironment,
      )
      jestExitCode = jestResult.exitCode
    }
  } finally {
    const cleanupResult = await runCommand(
      "npm",
      ["run", "test:workers:cleanup"],
      scriptEnvironment,
    )
    cleanupExitCode = cleanupResult.exitCode
  }

  if (cleanupExitCode !== 0) {
    process.exit(cleanupExitCode)
  }

  if (receivedTerminationSignal && jestExitCode === 0) {
    process.exit(130)
  }

  if (prepareExitCode !== 0) {
    process.exit(prepareExitCode)
  }

  process.exit(jestExitCode)
}

main().catch((error) => {
  console.error("Failed to run parallel tests:", error)
  process.exit(1)
})
