import { describe, expect, it } from "vitest"
import { classCapacity, classCapacityLabel } from "./classCapacity"

describe("classCapacity", () => {
  it("shows remaining seats from max minus enrolled", () => {
    expect(classCapacity({ enrolled_count: 32, max_students: 40 })).toEqual({
      enrolled: 32,
      max: 40,
      available: 8,
      full: false,
    })
  })

  it("treats a class as full when enrolled reaches max", () => {
    expect(classCapacity({ enrolled_count: 40, max_students: 40 }).full).toBe(true)
    expect(classCapacityLabel("6e A", classCapacity({ enrolled_count: 40, max_students: 40 }))).toBe(
      "6e A \u00b7 compl\u00e8te (40/40)",
    )
  })

  it("keeps the class name only when capacity is unknown", () => {
    expect(classCapacityLabel("6e A", classCapacity({ enrolled_count: 12, max_students: null }))).toBe("6e A")
  })
})
