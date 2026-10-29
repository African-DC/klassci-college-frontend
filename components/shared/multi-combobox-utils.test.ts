import { describe, expect, it } from "vitest"
import { matchesSearch, normaliseSearch, searchScore } from "./multi-combobox-utils"

describe("teacher name search", () => {
  it("ignores accents, case, punctuation and extra spaces", () => {
    expect(normaliseSearch("  YAO—Évariste  KOUAMÉ ")).toBe("yao evariste kouame")
    expect(matchesSearch("KOUAMÉ Évariste Yao", "yao kouame")).toBe(true)
  })
  it("finds reversed names and any-order fragments", () => {
    expect(matchesSearch("PACOME YAPI ACHI", "achi pacome")).toBe(true)
    expect(matchesSearch("JACQUES NANA", "nana jac")).toBe(true)
  })
  it("allows small typing mistakes only on longer words", () => {
    expect(matchesSearch("KOUAME EVARISTE", "kouam evariste")).toBe(true)
    expect(matchesSearch("YAPI ACHI PACOME", "yapi achi pacom")).toBe(true)
  })
  it("does not invent unrelated results", () => {
    expect(matchesSearch("KOUAME Evariste", "nana jacques")).toBe(false)
    expect(matchesSearch("YAO YAPI", "qq")).toBe(false)
    expect(searchScore("NANA JACQUES", "NANA JACQUES")).toBeGreaterThan(searchScore("JACQUES NANA", "nan jacq"))
  })
})
