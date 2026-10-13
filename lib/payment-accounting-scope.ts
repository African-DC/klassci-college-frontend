import type { PaymentListParams } from "@/lib/contracts/payment"

export type PaymentScope = "current_year" | "today" | "date" | "week" | "all"

function localDate(date: Date): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-")
}

export function todayLocal(): string {
  return localDate(new Date())
}

export function buildAccountingScope(
  scope: PaymentScope,
  academicYearId: number | undefined,
  selectedDate: string,
): PaymentListParams {
  if (scope === "current_year") {
    return academicYearId == null ? {} : { academic_year_id: academicYearId }
  }
  if (scope === "all") return {}
  if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) return {}
  const start = new Date(selectedDate + "T12:00:00")
  if (Number.isNaN(start.getTime()) || localDate(start) !== selectedDate) return {}
  if (scope === "week") {
    const monday = new Date(start)
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 6)
    return {
      date_from: localDate(monday) + "T00:00:00",
      date_to: localDate(sunday) + "T23:59:59.999999",
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
