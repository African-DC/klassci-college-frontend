import { z } from "zod"

/**
 * Miroir de `app/schemas/upload_handoff.py`.
 *
 * Deux faces, un seul contrat : l'ordinateur ouvre la session et la sonde
 * (`Handoff*`), le téléphone lit la page et dépose (`PublicHandoff*`). Ce
 * fichier les tient ensemble parce qu'ils décrivent la même session — un état
 * qui dérive d'un côté se verrait immédiatement de l'autre.
 *
 * Ce qu'aucun de ces schémas ne porte : le jeton, et l'état civil. Le jeton ne
 * vit que dans l'URL du code QR — l'ordinateur pilote par l'identifiant, le
 * téléphone dépose par le jeton, et l'un ne se déduit pas de l'autre. Le
 * `label` vaut « Kouadio A. », prénom et initiale : assez pour cadrer la bonne
 * personne, pas assez pour identifier un mineur à partir d'un code qu'on a
 * photographié dans un couloir.
 */

/** Les cibles du registre serveur (`upload_handoff_service.TARGETS`). */
export const HandoffTargetKindSchema = z.enum([
  "student_photo",
  "teacher_photo",
  "staff_photo",
  "profile_photo",
  "school_logo",
  "school_signature",
  "student_document",
])

/**
 * `open` : le code attend un téléphone. `receiving` : un téléphone a pris la
 * main et envoie. `proposed` : les octets sont dans le sas, sous les yeux de
 * l'opérateur. `done` : la fiche est écrite.
 */
export const HandoffStateSchema = z.enum(["open", "receiving", "proposed", "done"])

/**
 * `finalise` : le destinataire existe, le serveur écrit la colonne à la
 * confirmation. `stage-only` : la fiche n'existe pas encore (l'inscription
 * prend la photo avant de créer l'élève), l'écran récupère les octets et les
 * rend au formulaire.
 */
export const HandoffModeSchema = z.enum(["finalise", "stage-only"])

export const HandoffSessionSchema = z.object({
  id: z.string(),
  state: HandoffStateSchema,
  mode: HandoffModeSchema,
  label: z.string(),
  metier: z.string(),
  expires_at: z.string(),
  retakes_left: z.number(),
  staged_mime: z.string().nullable().default(null),
})

export const HandoffOpenedSchema = HandoffSessionSchema.extend({
  url: z.string(),
  qr_svg: z.string(),
  accepts: z.array(z.string()).default([]),
  max_bytes: z.number(),
  /**
   * Ce qui empêchera le téléphone d'arriver au bout : une adresse publique qui
   * ne sort pas du réseau de l'école, un site en HTTP. Vide en configuration
   * saine — et à afficher tel quel, sinon l'opérateur reste devant un code qui
   * ne mène nulle part sans savoir pourquoi.
   */
  warnings: z.array(z.string()).default([]),
})

export const HandoffConfirmedSchema = z.object({
  state: z.literal("done"),
  url: z.string(),
})

export const HandoffRetakenSchema = z.object({
  state: z.literal("open"),
  retakes_left: z.number(),
})

// ---------------------------------------------------------------------------
// Côté téléphone
// ---------------------------------------------------------------------------
//
// Ces deux schémas sortent d'une route ouverte sans session, atteinte en
// scannant un code que n'importe qui peut photographier. Tout ce qui y figure
// est donc à la portée de n'importe qui.

export const PublicHandoffViewSchema = z.object({
  school_name: z.string(),
  label: z.string(),
  kind: z.string(),
  metier: z.string(),
  accepts: z.array(z.string()).default([]),
  max_bytes: z.number(),
  state: HandoffStateSchema,
  expires_at: z.string(),
})

export const PublicHandoffReceivedSchema = z.object({
  state: z.literal("proposed"),
})

export type HandoffTargetKind = z.infer<typeof HandoffTargetKindSchema>
export type HandoffState = z.infer<typeof HandoffStateSchema>
export type HandoffMode = z.infer<typeof HandoffModeSchema>
export type HandoffSession = z.infer<typeof HandoffSessionSchema>
export type HandoffOpened = z.infer<typeof HandoffOpenedSchema>
export type HandoffConfirmed = z.infer<typeof HandoffConfirmedSchema>
export type HandoffRetaken = z.infer<typeof HandoffRetakenSchema>
export type PublicHandoffView = z.infer<typeof PublicHandoffViewSchema>
