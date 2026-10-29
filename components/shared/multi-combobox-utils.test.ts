import { describe, expect, it } from "vitest"
import { matchesSearch } from "./multi-combobox-utils"

describe("teacher name lookup", () => {
  it("matches names in any order", () => {
    expect(matchesSearch("YAPI ACHI PACOME", "PACOME YAPI")).toBe(true)
    expect(matchesSearch("NANA JACQUES", "jacques nana")).toBe(true)
  })

  it("ignores accents, punctuation and repeated spaces", () => {
    expect(matchesSearch("KOUAMÉ ÉVARISTE YAO", "  yao   kouame  ")).toBe(true)
    expect(matchesSearch("N'GUESSAN MARCEL", "marcel nguessan")).toBe(true)
  })

  it("requires every search token to match", () => {
    expect(matchesSearch("NANA JACQUES", "jacques kouame")).toBe(false)
  })

  it("matches partial tokens", () => {
    expect(matchesSearch("KOUAME EVARISTE YAO", "eva kou")).toBe(true)
  })
})
