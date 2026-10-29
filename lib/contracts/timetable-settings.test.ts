import { describe, expect, it } from "vitest"
import { TimetableSettingsUpdateSchema } from "./settings"

describe("tenant timetable settings", () => {
  const valid = { day_start_hour: 7, day_end_hour: 17, slot_duration_minutes: 45 }
  it("accepts school-specific hours", () => {
    expect(TimetableSettingsUpdateSchema.parse(valid)).toEqual(valid)
  })
  it("rejects inverted working hours and invalid slot lengths", () => {
    expect(TimetableSettingsUpdateSchema.safeParse({ ...valid, day_end_hour: 6 }).success).toBe(false)
    expect(TimetableSettingsUpdateSchema.safeParse({ ...valid, slot_duration_minutes: 0 }).success).toBe(false)
  })
})
