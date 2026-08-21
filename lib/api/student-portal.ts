import { z } from "zod"
import { apiFetch, apiFetchBlob, safeValidate } from "./client"
import {
  StudentDashboardSchema,
  StudentGradesResponseSchema,
  StudentAttendanceResponseSchema,
  type StudentDashboard,
  type StudentGradesResponse,
  type StudentFeesResponse,
  type StudentBulletin,
  type StudentAttendanceResponse,
} from "@/lib/contracts/student-portal"
import {
  TimetableSlotSchema,
  type TimetableSlot,
} from "@/lib/contracts/timetable"

const TimetableSlotArraySchema = z.array(TimetableSlotSchema)

// Le BE /student/bulletins renvoie {items:[{id, trimester:number, average,
// rank, mention, class_name, academic_year_name, file_url, generated_at}],
// total}. On valide cette forme réelle avant de la normaliser vers le
// contrat consommé par l'UI.
const StudentBulletinRawSchema = z.object({
  id: z.number(),
  trimester: z.number(),
  average: z.coerce.number().nullable(),
  rank: z.number().nullable(),
  mention: z.string().nullable(),
  class_name: z.string(),
  academic_year_name: z.string(),
  file_url: z.string().nullable(),
  generated_at: z.string().nullable(),
})
const StudentBulletinsRawSchema = z.object({
  items: z.array(StudentBulletinRawSchema),
  total: z.number(),
})

// Le BE /student/fees renvoie {total_due, total_paid, balance, fees:[{id,
// fee_category_name, amount, status: paid|partial|pending, payments}]}. On
// valide cette forme réelle puis on la normalise vers le contrat consommé par
// l'UI (total_expected/total_remaining/category_name/paye|partiel|impaye).
const FeePaymentRawSchema = z.object({ amount: z.coerce.number() }).passthrough()
const StudentFeeRawSchema = z.object({
  id: z.number(),
  fee_category_name: z.string(),
  amount: z.coerce.number(),
  status: z.string(),
  payments: z.array(FeePaymentRawSchema).default([]),
})
const StudentFeesRawSchema = z.object({
  total_due: z.coerce.number(),
  total_paid: z.coerce.number(),
  balance: z.coerce.number(),
  fees: z.array(StudentFeeRawSchema).default([]),
})

export function mapFeeStatus(status: string): "paye" | "partiel" | "impaye" {
  if (status === "paid" || status === "paye") return "paye"
  if (status === "partial" || status === "partiel") return "partiel"
  return "impaye"
}

// Extrait l'item de la réponse API, qu'elle soit { data: T } ou T directement
function unwrapResponse<T>(res: unknown): T {
  if (res !== null && typeof res === "object" && "data" in res && (res as Record<string, unknown>).data !== undefined) {
    return (res as Record<string, unknown>).data as T
  }
  return res as T
}

export const studentPortalApi = {
  // Dashboard — KPIs et prochain cours
  getDashboard: async (): Promise<StudentDashboard> => {
    const res = await apiFetch<unknown>("/student/dashboard")
    return safeValidate(StudentDashboardSchema, unwrapResponse(res), "GET /student/dashboard")
  },

  // Notes par matière et trimestre
  getGrades: async (trimester?: string): Promise<StudentGradesResponse> => {
    const query = trimester ? `?${new URLSearchParams({ trimester })}` : ""
    const res = await apiFetch<unknown>(`/student/grades${query}`)
    return safeValidate(StudentGradesResponseSchema, unwrapResponse(res), "GET /student/grades")
  },

  // Emploi du temps de la classe de l'élève. Le BE renvoie une enveloppe
  // {class_name, slots: [...]} dont chaque slot omet certains champs
  // (subject_id/teacher_id/class_id/academic_year_id). On normalise ici
  // vers le contrat `TimetableSlot` partagé pour réutiliser le rendu existant.
  getTimetable: async (): Promise<TimetableSlot[]> => {
    const res = await apiFetch<unknown>("/student/timetable")
    let rawSlots: unknown[]
    if (Array.isArray(res)) {
      rawSlots = res
    } else if (res !== null && typeof res === "object" && Array.isArray((res as Record<string, unknown>).slots)) {
      rawSlots = (res as { slots: unknown[] }).slots
    } else {
      rawSlots = []
    }
    const EN_TO_FR: Record<string, string> = {
      monday: "lundi", tuesday: "mardi", wednesday: "mercredi",
      thursday: "jeudi", friday: "vendredi", saturday: "samedi",
    }
    const mapped = rawSlots.map((raw) => {
      const s = raw as Record<string, unknown>
      const start = String(s.start_time ?? "").slice(0, 5)
      const end = String(s.end_time ?? "").slice(0, 5)
      const id = Number(s.id ?? 0)
      const day = String(s.day ?? "")
      return {
        id,
        class_id: Number(s.class_id ?? 0),
        class_name: String(s.class_name ?? ""),
        teacher_id: Number(s.teacher_id ?? 0),
        teacher_name: String(s.teacher_name ?? ""),
        subject_id: Number(s.subject_id ?? id),
        subject_name: String(s.subject_name ?? ""),
        subject_color: (s.subject_color as string | null | undefined) ?? null,
        academic_year_id: Number(s.academic_year_id ?? 0),
        day: EN_TO_FR[day] ?? day,
        start_time: start,
        end_time: end,
        room: ((s.room ?? s.room_name) as string | null | undefined) ?? null,
      }
    })
    return safeValidate(TimetableSlotArraySchema, mapped, "GET /student/timetable")
  },

  // Frais et paiements — normalise la réponse BE vers le contrat UI.
  getFees: async (): Promise<StudentFeesResponse> => {
    const res = await apiFetch<unknown>("/student/fees")
    const raw = safeValidate(StudentFeesRawSchema, unwrapResponse(res), "GET /student/fees")
    return {
      academic_year: "",
      total_expected: raw.total_due,
      total_paid: raw.total_paid,
      total_remaining: raw.balance,
      fees: (raw.fees ?? []).map((f) => {
        const paid = (f.payments ?? []).reduce((sum, p) => sum + p.amount, 0)
        return {
          id: f.id,
          category_name: f.fee_category_name,
          total_amount: f.amount,
          paid_amount: paid,
          remaining: Math.max(0, f.amount - paid),
          status: mapFeeStatus(f.status),
          last_payment_date: null,
        }
      }),
    }
  },

  // Bulletins publiés — normalise l'enveloppe BE vers le contrat UI.
  getBulletins: async (): Promise<StudentBulletin[]> => {
    const res = await apiFetch<unknown>("/student/bulletins")
    const raw = safeValidate(StudentBulletinsRawSchema, res, "GET /student/bulletins")
    return raw.items.map((b) => ({
      id: b.id,
      trimester: `Trimestre ${b.trimester}`,
      academic_year: b.academic_year_name,
      general_average: b.average,
      rank: b.rank,
      // L'effectif de la classe n'est pas porté par cette réponse : le rang
      // s'affiche seul plutôt que suivi d'un dénominateur inventé.
      total_students: null,
      // L'endpoint ne rend que les bulletins publiés.
      status: "publie" as const,
      published_at: b.generated_at,
    }))
  },

  /**
   * Télécharger son bulletin en PDF.
   *
   * Route du portail, pas `/reports/bulletins/{id}/pdf` : cette dernière est
   * gardée par `reports:read`, un droit qui ouvre les bulletins de toute
   * l'école et qu'un élève n'a pas. Ici la garde est l'appartenance.
   */
  downloadBulletin: async (bulletinId: number): Promise<Blob> => {
    return apiFetchBlob(`/student/bulletins/${bulletinId}/pdf`)
  },

  // Historique de présence
  getAttendance: async (params?: { status?: string; page?: number }): Promise<StudentAttendanceResponse> => {
    const query = new URLSearchParams()
    if (params?.status) query.set("status", params.status)
    if (params?.page) query.set("page", String(params.page))
    const qs = query.toString()
    const res = await apiFetch<unknown>(`/student/attendance${qs ? `?${qs}` : ""}`)
    return safeValidate(StudentAttendanceResponseSchema, unwrapResponse(res), "GET /student/attendance")
  },
}
