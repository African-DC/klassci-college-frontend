import { describe, expect, it } from "vitest"
import { orderedTimetableEntries } from "./entries"

describe("timetable entries order", () => {
  it("sorts courses and breaks chronologically", () => {
    const items = orderedTimetableEntries(
      [{ id: 2, start_time: "10:15", end_time: "11:15" }],
      [{ id: 1, start_time: "10:00", end_time: "10:15" }],
    )
    expect(items.map(item => item.kind)).toEqual(["event", "course"])
  })
})
