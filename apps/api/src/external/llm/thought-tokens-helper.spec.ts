import { findLeakedToolCallNames, ThoughtTokensHelper } from "./thought-tokens-helper"

// The exact leak observed in production (gemini-3.5-flash-lite verbalizing
// its tool call as pseudo-XML in the user-visible text instead of emitting a
// functionCall part).
const LEAKED_PSEUDO_CALL =
  '<call:default_api:mandatory_tool xmlns:default_api="default_api" categoryNames:[greetings,QA],suggestedTitle:Règles de Warmachine et pays de pays/>'

describe("ThoughtTokensHelper - hallucinated tool-call XML", () => {
  it("removes the production pseudo-call tag from a complete text", () => {
    const text = `C'est noté, tu habites en France !\n\n${LEAKED_PSEUDO_CALL}`
    const cleaned = ThoughtTokensHelper.removeThoughtTokens(text)

    expect(cleaned).not.toContain("default_api")
    expect(cleaned).not.toContain("<call:")
    expect(cleaned).toContain("C'est noté, tu habites en France !")
  })

  it("removes variants of the default_api family", () => {
    const cleaned = ThoughtTokensHelper.removeThoughtTokens(
      'a <default_api:mandatory_tool args="x"/> b </default_api:call> c',
    )
    expect(cleaned).toBe("a  b  c")
  })

  it("keeps legitimate text with angle brackets and comparisons", () => {
    const text = "En maths, 2 < 3 et 5 > 4. Le tag <b>gras</b> reste, tout comme a < b."
    expect(ThoughtTokensHelper.removeThoughtTokens(text)).toBe(text)
  })

  it("strips the pseudo-call even when split across many stream deltas", () => {
    const stripper = ThoughtTokensHelper.createStripper()
    const full = `Voici ma réponse complète pour toi, avec assez de texte pour dépasser la retenue du stripper.\n\n${LEAKED_PSEUDO_CALL}`
    let out = ""
    // 7-char deltas: the tag is split mid-emission many times over.
    for (let i = 0; i < full.length; i += 7) {
      out += stripper.feed(full.slice(i, i + 7))
    }
    out += stripper.flush()

    expect(out).not.toContain("default_api")
    expect(out).not.toContain("<call:")
    expect(out).toContain("Voici ma réponse complète")
  })

  it("does not stall the stream on a never-closed lookalike", () => {
    const stripper = ThoughtTokensHelper.createStripper()
    const full = `Début. <call:jamais fermé ${"x".repeat(700)} fin du texte.`
    let out = ""
    for (let i = 0; i < full.length; i += 20) {
      out += stripper.feed(full.slice(i, i + 20))
    }
    out += stripper.flush()

    // The giant lookalike is not a real tag (never closed): the stream must
    // still deliver the surrounding text once the hold-back cap is passed.
    expect(out).toContain("Début.")
    expect(out).toContain("fin du texte.")
  })
})

describe("findLeakedToolCallNames", () => {
  it("extracts the tool name from a leaked safety-alert call (production case)", () => {
    // Real production leak: the alert never reached the MCP server.
    const text =
      "Prenez soin de vous.\n\n<call:default_api:report_danger{category:self_harm," +
      "severity:critical,summary:L'utilisateur exprime l'intention de mourir.," +
      "verbatim:je veux mourrir}/>"

    expect(findLeakedToolCallNames(text)).toEqual(["report_danger"])
  })

  it("extracts the tool name from the attribute-style variant", () => {
    expect(findLeakedToolCallNames(LEAKED_PSEUDO_CALL)).toEqual(["mandatory_tool"])
  })

  it("returns nothing for legitimate text, including angle brackets and markup", () => {
    expect(findLeakedToolCallNames("2 < 3 and <b>bold</b> and a call: to action")).toEqual([])
    expect(findLeakedToolCallNames("Voici ma réponse, sans balise.")).toEqual([])
  })

  it("deduplicates repeated leaks of the same tool", () => {
    const text = `${LEAKED_PSEUDO_CALL} then again ${LEAKED_PSEUDO_CALL}`
    expect(findLeakedToolCallNames(text)).toEqual(["mandatory_tool"])
  })
})
