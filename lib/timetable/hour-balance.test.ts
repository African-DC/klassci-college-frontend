import { describe, expect, it } from "vitest"
import type { TimetableSlot } from "@/lib/contracts/timetable"
import { projectedSubjectMinutes, formatWeeklyMinutes } from "./hour-balance"

const slots = [
  { id: 11, subject_id: 4, academic_year_id: 3, start_time: "08:00", end_time: "09:50" },
  { id: 12, subject_id: 4, academic_year_id: 3, start_time: "10:10", end_time: "11:05" },
  { id: 13, subject_id: 4, academic_year_id: 2, start_time: "08:00", end_time: "09:00" },
] as TimetableSlot[]

describe("weekly subject volume", () => {
  it("counts real minutes only in the selected academic year", () => {
    expect(projectedSubjectMinutes(slots, {
      subject_id: 4, academic_year_id: 3, start_time: "13:00", end_time: "14:00",
    })).toBe(225)
  })
  it("excludes the edited slot so it cannot double count", () => {
    expect(projectedSubjectMinutes(slots, {
      subject_id: 4, academic_year_id: 3, start_time: "10:10", end_time: "11:10",
    }, 12)).toBe(170)
  })
  it("formats minutes accurately", () => {
    expect(formatWeeklyMinutes(165)).toBe("2 h 45")
  })
})
