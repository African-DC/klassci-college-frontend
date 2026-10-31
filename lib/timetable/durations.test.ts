import { describe, expect, it } from "vitest"
import { durationLabel, durationMinutes, orderedTimetableEntries } from "./durations"

describe("minute-exact school schedule display", () => {
  it("shows fifteen-minute recess and off-hour lessons", () => {
    expect(durationLabel("10:00", "10:15")).toBe("15 min")
    expect(durationLabel("10:15", "11:15")).toBe("1 h")
    expect(durationLabel("09:25", "10:55")).toBe("1 h 30")
    expect(durationMinutes("10:10", "10:25")).toBe(15)
  })
  it("sorts courses and breaks chronologically", () => {
    const items = orderedTimetableEntries(
      [{ id: 2, start_time: "10:15", end_time: "11:15" }],
      [{ id: 1, start_time: "10:00", end_time: "10:15" }],
    )
    expect(items.map(item => item.kind)).toEqual(["event", "course"])
  })
})
