import { ApiError } from "@/lib/api/client"
import { ProfileBatchError } from "@/lib/api/enrollment-profile"

/** Ce que l'écran dit d'un enregistrement en lot refusé, et les lignes à corriger. */
export interface BatchFailure {
  title: string
  description: string
  /** Inscriptions que le serveur désigne comme fautives. */
  faultyIds: number[]
}

/** Les identifiants qu'un `detail` FastAPI désigne, sous ses formes usuelles. */
function idsFromDetail(detail: unknown, chunkIds: number[]): number[] {
  const found: number[] = []
  const visit = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(visit)
    if (value === null || typeof value !== "object") return
    const obj = value as Record<string, unknown>
    if (typeof obj.enrollment_id === "number") found.push(obj.enrollment_id)
    if (Array.isArray(obj.enrollment_ids)) visit(obj.enrollment_ids.map((id) => ({ enrollment_id: id })))
    // 422 de validation : `loc` = ["body", "items", 3, "lv2"] désigne la 4e ligne du lot.
    if (Array.isArray(obj.loc)) {
      const at = obj.loc.indexOf("items")
      const index = at >= 0 ? obj.loc[at + 1] : undefined
      if (typeof index === "number" && chunkIds[index] !== undefined) found.push(chunkIds[index])
    }
    Object.values(obj).forEach((v) => (typeof v === "object" ? visit(v) : undefined))
  }
  visit(detail)
  return found
}

/**
 * Les inscriptions fautives d'un lot refusé.
 *
 * Le serveur nomme l'inscription en cause, soit dans un `detail` structuré,
 * soit dans sa phrase (« inscription 42 : LV2 interdite en 6ème »). On ne
 * retient que les nombres qui sont bien des inscriptions du lot envoyé :
 * un « 6 » de « 6ème » ne désigne personne.
 */
export function faultyEnrollmentIds(error: ProfileBatchError): number[] {
  const chunkIds = error.chunk.map((item) => item.enrollment_id)
  const detail = error.reason instanceof ApiError ? error.reason.detail : undefined
  const fromMessage = (error.message.match(/\d+/g) ?? []).map(Number)
  const ids = [...idsFromDetail(detail, chunkIds), ...fromMessage]
  return Array.from(new Set(ids.filter((id) => chunkIds.includes(id))))
}

/** Remplace dans la phrase du serveur chaque identifiant par le nom de l'élève. */
function withNames(message: string, ids: number[], nameOf: (id: number) => string): string {
  return ids.reduce((text, id) => text.replace(new RegExp(`\\b${id}\\b`, "g"), nameOf(id)), message)
}

export function describeBatchFailure(
  error: unknown,
  nameOf: (enrollmentId: number) => string,
): BatchFailure {
  if (!(error instanceof ProfileBatchError)) {
    return {
      title: "Aucune modification enregistrée",
      description: error instanceof Error ? error.message : "Réessayez dans un instant.",
      faultyIds: [],
    }
  }
  const faultyIds = faultyEnrollmentIds(error)
  const names = faultyIds.map(nameOf)
  const cause = withNames(error.message, faultyIds, nameOf)
  const description = names.length > 0 ? `À corriger : ${names.join(", ")}. ${cause}` : cause
  if (error.updated === 0) return { title: "Aucune modification enregistrée", description, faultyIds }
  const first = nameOf(error.chunk[0].enrollment_id)
  const n = error.updated
  return {
    title: `${n} élève${n > 1 ? "s" : ""} enregistré${n > 1 ? "s" : ""}, échec à partir de ${first}`,
    description,
    faultyIds,
  }
}
