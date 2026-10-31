import { describe, expect, it } from "vitest"
import { ScheduleEventCreateSchema } from "./schedule-events"

describe("recurring school schedule events", () => {
  const schoolBreak = {
    academic_year_id: 7,
    class_id: null,
    title: "Récréation",
    category: "recess",
    day: "lundi",
    blocks_courses: true,
    start_time: "10:00",
    end_time: "10:15",
  }
  it("accepts exact minute-based breaks", () => {
    expect(ScheduleEventCreateSchema.safeParse(schoolBreak).success).toBe(true)
  })
  it("rejects inverted, invalid and zero-length times", () => {
    expect(ScheduleEventCreateSchema.safeParse({ ...schoolBreak, end_time: "09:59" }).success).toBe(false)
    expect(ScheduleEventCreateSchema.safeParse({ ...schoolBreak, end_time: "10:00" }).success).toBe(false)
    expect(ScheduleEventCreateSchema.safeParse({ ...schoolBreak, start_time: "25:00" }).success).toBe(false)
  })
  it("rejects missing academic year and empty labels", () => {
    expect(ScheduleEventCreateSchema.safeParse({ ...schoolBreak, academic_year_id: 0 }).success).toBe(false)
    expect(ScheduleEventCreateSchema.safeParse({ ...schoolBreak, title: "" }).success).toBe(false)
  })
})
