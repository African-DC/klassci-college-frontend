import type { ClassAttendanceStats } from "@/lib/api/attendance"
import type { SchoolSettings } from "@/lib/contracts/settings"
import type { ExportPayload } from "@/lib/export"
import { brandingFromSettings } from "@/lib/export/branding"

interface AttendanceExportArgs {
  stats: ClassAttendanceStats
  settings: SchoolSettings | undefined
  /** Nom de la classe pour l'entête du document. */
  className?: string
}

/**
 * Construit la charge utile d'export des statistiques de présence par élève
 * telles qu'affichées (tri par taux croissant). Colonnes calquées sur le
 * tableau : élève, sessions, présent, absent, retard, excusé, taux.
 */
export function buildAttendanceExportPayload({
  stats,
  settings,
  className,
}: AttendanceExportArgs): ExportPayload {
  const sorted = [...stats.students].sort((a, b) => a.attendance_rate - b.attendance_rate)
  return {
    branding: brandingFromSettings(settings),
    meta: {
      title: "Statistiques de présence",
      subtitle: className
        ? `Classe ${className} · ${stats.total_sessions} session(s)`
        : `${stats.total_sessions} session(s)`,
      date: new Date().toLocaleDateString("fr-FR"),
    },
    columns: [
      { key: "eleve", header: "Élève" },
      { key: "sessions", header: "Sessions", format: "number" },
      { key: "present", header: "Présent", format: "number" },
      { key: "absent", header: "Absent", format: "number" },
      { key: "retard", header: "Retard", format: "number" },
      { key: "excuse", header: "Excusé", format: "number" },
      { key: "taux", header: "Taux (%)", format: "number" },
    ],
    rows: sorted.map((s) => ({
      eleve: `${s.first_name} ${s.last_name}`.trim(),
      sessions: stats.total_sessions,
      present: s.present_count,
      absent: s.absent_count,
      retard: s.late_count,
      excuse: s.excused_count,
      taux: s.attendance_rate,
    })),
  }
}
