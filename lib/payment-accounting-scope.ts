import type { PaymentListParams } from "@/lib/contracts/payment"

export type PaymentScope = "current_year" | "today" | "date" | "week" | "all"

// The school cash day is fixed to Abidjan, not the cashier's browser timezone.
export function todayLocal(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Abidjan",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ""
  return [get("year"), get("month"), get("day")].join("-")
}

export function isValidAccountingDate(day: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false
  const parsed = new Date(day + "T12:00:00Z")
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day
}

export function buildAccountingScope(
  scope: PaymentScope,
  academicYearId: number | undefined,
  selectedDate: string,
): PaymentListParams {
  if (scope === "current_year") {
    return academicYearId == null ? {} : { academic_year_id: academicYearId, linked_year_only: true }
  }
  if (scope === "all") return {}
  if (!isValidAccountingDate(selectedDate)) return {}
  const start = new Date(selectedDate + "T12:00:00Z")
  if (scope === "week") {
    const monday = new Date(start)
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7))
    const sunday = new Date(monday)
    sunday.setUTCDate(sunday.getUTCDate() + 6)
    return {
      date_from: monday.toISOString().slice(0, 10) + "T00:00:00",
      date_to: sunday.toISOString().slice(0, 10) + "T23:59:59.999999",
    }
  }
  return {
    date_from: selectedDate + "T00:00:00",
    date_to: selectedDate + "T23:59:59.999999",
  }
}

export const scopeTitle: Record<PaymentScope, string> = {
  current_year: "Paiements de l'année scolaire sélectionnée",
  today: "Bordereau du jour, toutes années d'inscription confondues",
  date: "Paiements de la date sélectionnée, toutes années confondues",
  week: "Paiements de la semaine sélectionnée, toutes années confondues",
  all: "Tous les paiements, historique complet",
}
