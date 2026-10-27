import { describe, expect, it } from "vitest"
import {
  firstFreeSeriesSlot,
  instancesOfSubject,
  isLevelAssignable,
  isSeriesSlotTaken,
} from "./subject-assignment"

describe("subject assignment occupancy", () => {
  it("blocks a level without series once any instance exists", () => {
    expect(isLevelAssignable([], [])).toBe(true)
    expect(isLevelAssignable([{ name: "Maths", level_id: 1, series_id: null }], [])).toBe(false)
  })

  it("keeps a series level open while a slot is still free", () => {
    const series = [{ id: 10 }, { id: 11 }]
    const takenA = [{ name: "Maths", level_id: 2, series_id: 10 }]

    expect(isLevelAssignable(takenA, series)).toBe(true)
    expect(isSeriesSlotTaken(takenA, 10)).toBe(true)
    expect(isSeriesSlotTaken(takenA, 11)).toBe(false)
    expect(isSeriesSlotTaken(takenA, null)).toBe(false)
    expect(firstFreeSeriesSlot(takenA, series)).toBe(null)
  })

  it("blocks a series level only when every slot is taken", () => {
    const series = [{ id: 10 }, { id: 11 }]
    const full = [
      { name: "Maths", level_id: 2, series_id: null },
      { name: "Maths", level_id: 2, series_id: 10 },
      { name: "Maths", level_id: 2, series_id: 11 },
    ]

    expect(isLevelAssignable(full, series)).toBe(false)
    expect(firstFreeSeriesSlot(full, series)).toBeUndefined()
  })

  it("picks the first free series when Toutes series is taken", () => {
    const series = [{ id: 10 }, { id: 11 }]
    const takenAll = [{ name: "Maths", level_id: 2, series_id: null }]
    expect(firstFreeSeriesSlot(takenAll, series)).toBe(10)
  })

  it("ne regarde que la matière assignée, pas ses voisines du niveau", () => {
    const instances = [
      { name: "Maths", level_id: 1, series_id: null },
      { name: "Français", level_id: 2, series_id: null },
    ]
    expect(instancesOfSubject(instances, "Français")).toEqual([instances[1]])
    // Le cas Rostan : la 6ème porte déjà les Maths, le Français y reste libre.
    expect(isLevelAssignable(instancesOfSubject(instances, "Français").filter((i) => i.level_id === 1), [])).toBe(true)
  })
})
