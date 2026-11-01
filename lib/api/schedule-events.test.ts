import { describe, expect, it } from "vitest"
import { normalizeScheduleEvent } from "./schedule-events"

describe("normalisation d'une pause venue du serveur", () => {
  it("traduit le jour en français et coupe les secondes des heures", () => {
    const event = normalizeScheduleEvent({
      id: 4,
      academic_year_id: 1,
      class_id: null,
      title: "Récréation",
      category: "recess",
      blocks_courses: true,
      day: "monday",
      start_time: "10:00:00",
      end_time: "10:15:00",
    })
    expect(event.day).toBe("lundi")
    expect(event.start_time).toBe("10:00")
    expect(event.end_time).toBe("10:15")
  })
})
