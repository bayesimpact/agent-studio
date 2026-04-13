export interface CustomUnigramSPMToken {
  piece: string
  score: number
  id: number
}

export interface CustomUnigramSPMModel {
  tokens: CustomUnigramSPMToken[]
}

export function loadCustomUnigramSPM(buffer: Uint8Array): CustomUnigramSPMModel {
  const tokens: CustomUnigramSPMToken[] = []

  let i = 0
  let id = 0

  while (i < buffer.length) {
    const tag = buffer[i++]
    if (tag === 0x12) {
      // field 2: pieces
      const len: number = buffer[i++] ?? 0
      const end = i + len

      let piece = ""
      let score = 0

      while (i < end) {
        const subTag = buffer[i++]
        if (subTag === 0x0a) {
          // piece string
          const l: number = buffer[i++] ?? 0
          piece = new TextDecoder().decode(buffer.slice(i, i + l))
          i += l
        } else if (subTag === 0x15) {
          // score float32
          const view = new DataView(buffer.buffer, buffer.byteOffset + i, 4)
          score = view.getFloat32(0, true)
          i += 4
        } else {
          break
        }
      }

      tokens.push({ piece, score, id: id++ })
    } else {
      // skip unknown field
      const len = buffer[i++] ?? 0
      i += len
    }
  }

  return { tokens }
}
