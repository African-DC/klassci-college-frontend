import { describe, expect, it } from "vitest"
import {
  ScheduleOverviewResponseSchema,
  scheduleSourceLabelForRow,
  scheduleStatusLabel,
} from "./installment-overview"

describe("schedule overview contract", () => {
  it("accepts a consolidated snapshot with an unplanned remainder", () => {
    const payload = {
      items: [{
        enrollment_id: 11,
        student_name: "Awa Koné",
        matricule: "C001",
        class_id: 9,
        class_name: "6e A",
        source: "standard",
        state: "partial_schedule",
        total_due: 125000,
        total_paid: 20000,
        remaining: 105000,
        due_so_far: 37000,
        late_amount: 17000,
        unscheduled_amount: 2000,
        next_due_date: "2027-01-31",
        next_due_amount: 20000,
      }],
      total: 1,
      page: 1,
      size: 20,
      totals: {
        enrollments: 1,
        late_enrollments: 1,
        total_due: 125000,
        total_paid: 20000,
        total_remaining: 105000,
        total_late: 17000,
      },
    }
    expect(ScheduleOverviewResponseSchema.parse(payload).items[0].late_amount).toBe(17000)
  })

  it("rejects an unknown schedule status, not silently guessing", () => {
    const parsed = ScheduleOverviewResponseSchema.safeParse({
      items: [{
        enrollment_id: 1, student_name: "A", matricule: null,
        class_id: 1, class_name: "6e A", source: "standard",
        state: "mystery", total_due: 0, total_paid: 0, remaining: 0,
        due_so_far: 0, late_amount: 0, unscheduled_amount: 0,
        next_due_date: null, next_due_amount: null,
      }],
      total: 1, page: 1, size: 20,
      totals: {
        enrollments: 1, late_enrollments: 0, total_due: 0,
        total_paid: 0, total_remaining: 0, total_late: 0,
      },
    })
    expect(parsed.success).toBe(false)
  })

  it("labels both individual agreements and school grids", () => {
    expect(scheduleSourceLabelForRow("negotiated")).toBe("Accord individuel")
    expect(scheduleSourceLabelForRow("standard")).toBe("Grille établissement")
    expect(scheduleStatusLabel("settled")).toBe("Soldé")
    expect(scheduleStatusLabel("partial_schedule")).toBe("Partiellement planifié")
    expect(scheduleStatusLabel("late")).toBe("En retard")
  })
})
