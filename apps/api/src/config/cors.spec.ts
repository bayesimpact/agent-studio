import type { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface"
import { buildCorsOptionsDelegate, parseFrontendOrigins } from "./cors"

const matches = (origins: (string | RegExp)[], origin: string): boolean =>
  origins.some((allowed) =>
    typeof allowed === "string" ? allowed === origin : allowed.test(origin),
  )

describe("parseFrontendOrigins", () => {
  it.each([
    "https://connect.localhost:5173",
    "https://connect.localhost:5174",
    "https://connect.localhost:5273",
    "https://connect.localhost:5274",
  ])("allows the local dev origin %s when unset outside production", (origin) => {
    expect(matches(parseFrontendOrigins(undefined, false), origin)).toBe(true)
  })

  it.each([
    "https://evil.example",
    "https://connect.localhost.evil.example:5173",
    "https://connect.localhost:5173.evil.example",
  ])("rejects %s when unset outside production", (origin) => {
    expect(matches(parseFrontendOrigins(undefined, false), origin)).toBe(false)
  })

  it("falls back to the local dev origins when blank outside production", () => {
    expect(matches(parseFrontendOrigins(" , ", false), "https://connect.localhost:5273")).toBe(true)
  })

  it("throws when unset in production", () => {
    expect(() => parseFrontendOrigins(undefined, true)).toThrow(/FRONTEND_URL must be set/)
  })

  it("throws when blank in production", () => {
    expect(() => parseFrontendOrigins(" , ", true)).toThrow(/FRONTEND_URL must be set/)
  })

  it("splits a comma-separated list and trims entries", () => {
    expect(parseFrontendOrigins(" https://a.example , https://b.example ", true)).toEqual([
      "https://a.example",
      "https://b.example",
    ])
  })

  it("normalizes scheme-less entries to https", () => {
    expect(parseFrontendOrigins("app.example,http://local.example", true)).toEqual([
      "https://app.example",
      "http://local.example",
    ])
  })

  it("ignores the local fallback when FRONTEND_URL is set", () => {
    expect(
      matches(parseFrontendOrigins("https://a.example", false), "https://connect.localhost:5273"),
    ).toBe(false)
  })
})

describe("buildCorsOptionsDelegate", () => {
  const frontendOrigins = ["https://app.example"]

  const optionsFor = (url: string | undefined): CorsOptions => {
    let received: CorsOptions | undefined
    buildCorsOptionsDelegate(frontendOrigins)({ url }, (error, options) => {
      expect(error).toBeNull()
      received = options as CorsOptions
    })
    if (!received) {
      throw new Error("delegate did not call back synchronously")
    }
    return received
  }

  it("reflects the origin on public embed endpoints", () => {
    expect(optionsFor("/public/agents/token123/config").origin).toBe(true)
  })

  it("pins origins to the frontend origins everywhere else", () => {
    expect(optionsFor("/organizations/1/projects").origin).toEqual(frontendOrigins)
  })

  it("pins origins when the URL is missing", () => {
    expect(optionsFor(undefined).origin).toEqual(frontendOrigins)
  })

  it('does not match paths that merely start with "public"', () => {
    expect(optionsFor("/publications").origin).toEqual(frontendOrigins)
  })

  it("never enables credentialed CORS", () => {
    expect(optionsFor("/public/agents/token123/config").credentials).toBeUndefined()
    expect(optionsFor("/organizations/1/projects").credentials).toBeUndefined()
  })
})
