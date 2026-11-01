import { describe, expect, it } from "vitest"
import { durationLabel, durationMinutes } from "./durations"

describe("minute-exact school schedule display", () => {
  it("shows fifteen-minute recess and off-hour lessons", () => {
    expect(durationLabel("10:00", "10:15")).toBe("15 min")
    expect(durationLabel("10:15", "11:15")).toBe("1 h")
    expect(durationLabel("09:25", "10:55")).toBe("1 h 30")
    expect(durationMinutes("10:10", "10:25")).toBe(15)
  })
  it("returns no duration for an unreadable time", () => {
    expect(durationLabel("10:xx", "11:00")).toBe("Durée indisponible")
  })
})
