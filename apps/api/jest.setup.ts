// This file runs before each test file

import { resolve } from "node:path"
import { config as dotenvConfig } from "dotenv"

// Explicitly load .env.test to ensure it takes precedence
dotenvConfig({ path: resolve(__dirname, ".env.test"), override: true })

//fixme: @Did: I comment this lines (Olivier)
// // Mock langfuse-v2 and langfuse-core to avoid dynamic import issues
// // These modules use dynamic imports that require --experimental-vm-modules
// jest.mock("langfuse-v2", () => ({
//   Langfuse: jest.fn().mockImplementation(() => ({
//     trace: jest.fn(),
//     span: jest.fn().mockReturnValue({ getTraceUrl: jest.fn() }),
//     generation: jest.fn(),
//     flushAsync: jest.fn().mockResolvedValue(undefined),
//     shutdownAsync: jest.fn().mockResolvedValue(undefined),
//     debug: jest.fn(),
//   })),
// }))
//
// jest.mock("langfuse", () => ({
//   Langfuse: jest.fn().mockImplementation(() => ({
//     trace: jest.fn(),
//     span: jest.fn().mockReturnValue({ getTraceUrl: jest.fn() }),
//     generation: jest.fn(),
//     flushAsync: jest.fn().mockResolvedValue(undefined),
//     shutdownAsync: jest.fn().mockResolvedValue(undefined),
//     debug: jest.fn(),
//   })),
// }))
