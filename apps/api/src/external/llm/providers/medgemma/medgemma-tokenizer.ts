import {
  type CustomUnigramSPMModel,
  loadCustomUnigramSPM,
} from "@/external/llm/providers/medgemma/custom-unigram-spm"

export class MedgemmaTokenizer {
  private model: CustomUnigramSPMModel
  private vocab: Map<string, number>

  constructor(buffer: Uint8Array) {
    this.model = loadCustomUnigramSPM(buffer)
    this.vocab = new Map(this.model.tokens.map((t) => [t.piece, t.id]))
  }

  countTokensEstimatedGoogleModel(text: string): number {
    return Math.ceil(this.countTokensSPM(text) / 4.28) // DOO: estimated ratio (based on SPM model and non-stream response tokens) because real Google tokenizer model is not public
  }

  private countTokensSPM(text: string): number {
    return this.encode(text).length
  }

  private encode(text: string): number[] {
    const tokens: number[] = []

    let i = 0
    while (i < text.length) {
      let matched = false

      for (let len = Math.min(16, text.length - i); len > 0; len--) {
        const sub = text.slice(i, i + len)

        if (this.vocab.has(sub)) {
          tokens.push(this.vocab.get(sub)!)
          i += len
          matched = true
          break
        }
      }

      if (!matched) {
        const byte = text.charCodeAt(i)
        const piece = `<0x${byte.toString(16).padStart(2, "0")}>`

        if (this.vocab.has(piece)) {
          tokens.push(this.vocab.get(piece)!)
        } else {
          tokens.push(byte + 256)
        }

        i++
      }
    }

    return tokens
  }
}
