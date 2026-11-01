import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { UpcomingEnrollmentCard } from "./UpcomingEnrollmentCard"
import { formatFcfa } from "@/lib/utils/money"

const upcoming = {
  academic_year_name: "2026-2027",
  class_name: "5ème A",
  total_due: 35000,
  total_paid: 0,
  remaining: 35000,
}

describe("UpcomingEnrollmentCard", () => {
  it("names the year, the class and what is left to pay", () => {
    render(<UpcomingEnrollmentCard upcoming={upcoming} />)

    expect(screen.getByText("Réinscription 2026-2027")).toBeTruthy()
    expect(screen.getByText(/5ème A/)).toBeTruthy()
    expect(screen.getByText(`${formatFcfa(35000)} à payer`)).toBeTruthy()
    expect(screen.queryByText(/déjà versés/)).toBeNull()
  })

  it("shows what was already paid on a partial re-enrollment", () => {
    render(<UpcomingEnrollmentCard upcoming={{ ...upcoming, total_paid: 10000, remaining: 25000 }} />)

    expect(screen.getByText(`${formatFcfa(25000)} à payer`)).toBeTruthy()
    expect(screen.getByText(new RegExp(`${formatFcfa(10000)} déjà versés`))).toBeTruthy()
  })

  it("says when the re-enrollment is settled", () => {
    render(<UpcomingEnrollmentCard upcoming={{ ...upcoming, total_paid: 35000, remaining: 0 }} />)

    expect(screen.getByText("Réglé")).toBeTruthy()
  })
})
