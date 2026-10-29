export function formatIncidentDate(input: string): string {
  const date = new Date(input)
  return Number.isNaN(date.getTime()) ? "Date indisponible" :
    new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date)
}
