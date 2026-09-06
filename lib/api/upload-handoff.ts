import {
  HandoffConfirmedSchema,
  HandoffOpenedSchema,
  HandoffRetakenSchema,
  HandoffSessionSchema,
  type HandoffConfirmed,
  type HandoffOpened,
  type HandoffRetaken,
  type HandoffSession,
  type HandoffTargetKind,
} from "@/lib/contracts/upload-handoff"
import { apiFetch, apiFetchBlob, safeValidate } from "./client"

/**
 * Le côté ordinateur de la reprise par code QR.
 *
 * Six gestes, tous authentifiés : ouvrir une session, la sonder, regarder ce
 * qui est arrivé, confirmer, reprendre, révoquer. Le téléphone, lui, passe par
 * `lib/api/public-handoff.ts` — sans session, sans en-tête, sans ce module.
 *
 * Tout part par `apiFetch` / `apiFetchBlob` : en-tête `Authorization`, contrat
 * 401 partagé et lecture du `detail` du backend sont hérités, jamais réécrits.
 * Un module d'upload qui refait ce contrat de son côté finit par en avoir un
 * autre — c'est déjà arrivé trois fois dans ce dépôt.
 */

const RACINE = "/admin/upload-handoff"

export interface OpenHandoffInput {
  targetKind: HandoffTargetKind
  /**
   * Absent à l'inscription : la photo est prise avant que la fiche existe. Le
   * serveur bascule alors la session en `stage-only` et n'écrit aucune colonne.
   */
  subjectId?: number | null
  /**
   * Ce que la cible réclame en plus — le type d'une pièce jointe, par exemple.
   * Refusé à l'ouverture s'il manque, jamais à la confirmation : découvrir le
   * manque une fois la photo prise reviendrait à la refuser, l'élève reparti.
   */
  extras?: Record<string, string>
}

export const uploadHandoffApi = {
  open: async ({
    targetKind,
    subjectId = null,
    extras,
  }: OpenHandoffInput): Promise<HandoffOpened> => {
    const json = await apiFetch<unknown>(RACINE, {
      method: "POST",
      body: JSON.stringify({
        target_kind: targetKind,
        subject_id: subjectId,
        extras: extras ?? {},
        // L'adresse que le navigateur a sous les yeux : c'est elle que le
        // téléphone doit atteindre, et elle seule le sait.
        //
        // Le serveur tourne derrière un proxy : il ne voit ni le schéma ni le
        // domaine du dehors, et devait donc les lire dans une variable. Celle-ci
        // portait un domaine d'établissement en valeur par défaut — toute
        // installation qui l'oubliait envoyait ses téléphones chez le voisin,
        // avec un jeton qui n'y existe pas, et un code QR d'apparence parfaite.
        //
        // Le serveur confronte cette origine à son allowlist : on l'annonce,
        // il ne la croit pas sur parole.
        origin: typeof window === "undefined" ? null : window.location.origin,
      }),
    })
    return safeValidate(HandoffOpenedSchema, json, `POST ${RACINE}`)
  },

  /** Le sondage. 404 quand la session a expiré : c'est la réponse normale. */
  get: async (sessionId: string): Promise<HandoffSession> => {
    const json = await apiFetch<unknown>(`${RACINE}/${encodeURIComponent(sessionId)}`)
    return safeValidate(HandoffSessionSchema, json, `GET ${RACINE}/{id}`)
  },

  /**
   * Les octets du dépôt, diffusés par le serveur.
   *
   * Le sas n'est monté par aucun `StaticFiles` : il n'y a pas d'URL à deviner,
   * et c'est le seul chemin de lecture. La réponse porte `no-store` — une photo
   * que personne n'a encore validée n'a pas à s'écrire sur le disque du poste.
   */
  previewBlob: (sessionId: string): Promise<Blob> =>
    apiFetchBlob(`${RACINE}/${encodeURIComponent(sessionId)}/preview`),

  confirm: async (sessionId: string): Promise<HandoffConfirmed> => {
    const json = await apiFetch<unknown>(`${RACINE}/${encodeURIComponent(sessionId)}/confirm`, {
      method: "POST",
    })
    return safeValidate(HandoffConfirmedSchema, json, `POST ${RACINE}/{id}/confirm`)
  },

  /** Le dépôt est jeté, le même code redevient valable — l'échéance ne bouge pas. */
  retake: async (sessionId: string): Promise<HandoffRetaken> => {
    const json = await apiFetch<unknown>(`${RACINE}/${encodeURIComponent(sessionId)}/retake`, {
      method: "POST",
    })
    return safeValidate(HandoffRetakenSchema, json, `POST ${RACINE}/{id}/retake`)
  },

  /** Ferme la session : le jeton n'ouvre plus rien et le fichier du sas part. */
  revoke: async (sessionId: string): Promise<void> => {
    await apiFetch<void>(`${RACINE}/${encodeURIComponent(sessionId)}`, {
      method: "DELETE",
    })
  },
}
