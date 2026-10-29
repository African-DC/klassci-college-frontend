import { describe, expect, it } from "vitest"
import { visibleTimeLabels } from "./time-labels"

describe("timetable time axis", () => {
  it("avoids conflicting labels around whole hours", () => {
    expect(visibleTimeLabels([590, 610, 665], 7, 18, 60)).toEqual([])
  })
  it("keeps clear special times and sorts input", () => {
    expect(visibleTimeLabels([675, 570, 510], 7, 18, 60)).toEqual([510, 570, 675])
  })
})
