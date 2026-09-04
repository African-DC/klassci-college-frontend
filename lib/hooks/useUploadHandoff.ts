"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { uploadHandoffApi } from "@/lib/api/upload-handoff"
import type {
  HandoffOpened,
  HandoffSession,
  HandoffTargetKind,
} from "@/lib/contracts/upload-handoff"

/**
 * L'ordinateur apprend qu'une photo est arrivée — par sondage, faute de mieux.
 *
 * Le projet n'a ni WebSocket ni SSE ; il a en revanche un motif de sondage
 * TanStack Query déjà en service sur deux écrans super-admin
 * (`super-admin/useLogs.ts`, 5 s ; `super-admin/useDiagnose.ts`, 30 s). On le
 * reprend tel quel plutôt que d'introduire un transport temps réel dans une
 * architecture qui n'en a aucun : dix minutes à deux secondes font trois cents
 * requêtes qui lisent un seul hash Redis.
 *
 * Trois choses arrêtent le sondage, et il faut les trois :
 *
 * 1. **La photo est là.** `proposed` ou `done` : il n'y a plus rien à
 *    attendre. C'est `pollDelay` qui le décide.
 * 2. **La session a expiré.** Au-delà de l'échéance le serveur ne rendra plus
 *    que des 404 : continuer à demander ne fait que les compter.
 * 3. **L'onglet passe en arrière-plan.** `refetchIntervalInBackground: false`
 *    — c'est le défaut de TanStack Query, et il est écrit ici parce qu'il
 *    porte une décision : une requête toutes les deux secondes sur la donnée
 *    mobile d'une école qui la paie, pour un écran que personne ne regarde,
 *    n'est pas un détail de configuration.
 *
 * Et la session est révoquée à la fermeture du dialogue comme au démontage :
 * sans cela, un code QR resterait valable dix minutes sur un écran de bureau
 * que plus personne ne regarde.
 */

export const uploadHandoffKeys = {
  session: (sessionId: string) => ["upload-handoff", sessionId] as const,
  /**
   * L'aperçu est indexé par le nombre de reprises restantes : chaque tentative
   * de dépôt en a un différent, donc une photo reprise ne peut pas resservir
   * l'image de la précédente depuis le cache.
   */
  preview: (sessionId: string, attempt: number) =>
    ["upload-handoff", sessionId, "preview", attempt] as const,
}

/** Deux secondes : le temps qu'un opérateur accepte d'attendre sans douter. */
export const HANDOFF_POLL_MS = 2_000

/**
 * Faut-il redemander, et dans combien de temps ?
 *
 * Fonction pure et exportée parce que c'est la règle que ce module doit
 * garantir, et que la seule façon de la garantir est de la tester : un sondage
 * qui ne s'arrête jamais ne se voit pas en recette, il se voit en production
 * comme une requête toutes les deux secondes pour toujours.
 */
export function pollDelay(session: HandoffSession | undefined, nowMs: number): number | false {
  if (!session) return false
  if (session.state !== "open" && session.state !== "receiving") return false
  const deadline = Date.parse(session.expires_at)
  // Une échéance illisible arrête le sondage plutôt que de le laisser courir :
  // l'écran dit alors « le code n'est plus valable », ce qui se corrige d'un
  // clic, là où un sondage perpétuel ne se voit jamais.
  if (Number.isNaN(deadline) || deadline <= nowMs) return false
  return HANDOFF_POLL_MS
}

/** Ce que « Confirmer » produit, selon que la fiche existe déjà ou non. */
export type HandoffOutcome =
  /** `finalise` : le serveur a écrit la colonne, voici l'URL publique. */
  | { kind: "saved"; url: string }
  /** `stage-only` : les octets reviennent en fichier, le formulaire les porte. */
  | { kind: "staged"; file: File }

export interface UseUploadHandoffOptions {
  targetKind: HandoffTargetKind
  subjectId?: number | null
  extras?: Record<string, string>
  /** Le dialogue est ouvert. À faux, la session est révoquée et le sondage cesse. */
  enabled: boolean
}

const EXTENSION_PAR_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
}

function nomDeFichier(mime: string): string {
  const extension = EXTENSION_PAR_MIME[mime] ?? "jpg"
  return `depot-${Date.now()}.${extension}`
}

function messageDErreur(cause: unknown, repli: string): string {
  return cause instanceof Error && cause.message ? cause.message : repli
}

/** L'ouverture porte de quoi peindre le code QR ; le sondage n'en relit que l'état. */
function sessionDeLOuverture(opened: HandoffOpened): HandoffSession {
  return {
    id: opened.id,
    state: opened.state,
    mode: opened.mode,
    label: opened.label,
    metier: opened.metier,
    expires_at: opened.expires_at,
    retakes_left: opened.retakes_left,
    staged_mime: opened.staged_mime,
  }
}

export function useUploadHandoff({
  targetKind,
  subjectId = null,
  extras,
  enabled,
}: UseUploadHandoffOptions) {
  const queryClient = useQueryClient()
  const [opened, setOpened] = useState<HandoffOpened | null>(null)
  const [openError, setOpenError] = useState<string | null>(null)
  const [opening, setOpening] = useState(false)
  const [maintenant, setMaintenant] = useState(() => Date.now())
  const sessionIdRef = useRef<string | null>(null)

  // Les paramètres d'ouverture vivent dans un ref : un appelant qui reconstruit
  // son objet `extras` à chaque rendu ne doit pas rouvrir une session — et donc
  // afficher un nouveau code QR — sous les yeux de la personne qui scanne.
  const paramsRef = useRef({ targetKind, subjectId, extras })
  paramsRef.current = { targetKind, subjectId, extras }
  const signature = `${targetKind}:${subjectId ?? ""}:${JSON.stringify(extras ?? {})}`

  useEffect(() => {
    if (!enabled) return
    let vivant = true

    void (async () => {
      setOpening(true)
      setOpenError(null)
      try {
        const ouverte = await uploadHandoffApi.open(paramsRef.current)
        if (!vivant) {
          // Le dialogue s'est refermé pendant l'ouverture : la session existe
          // côté serveur et personne ne la fermera. On la ferme ici.
          void uploadHandoffApi.revoke(ouverte.id).catch(() => undefined)
          return
        }
        sessionIdRef.current = ouverte.id
        queryClient.setQueryData(
          uploadHandoffKeys.session(ouverte.id),
          sessionDeLOuverture(ouverte),
        )
        setOpened(ouverte)
      } catch (cause) {
        if (vivant)
          setOpenError(messageDErreur(cause, "Impossible d'ouvrir le dépôt par téléphone."))
      } finally {
        if (vivant) setOpening(false)
      }
    })()

    return () => {
      vivant = false
      const id = sessionIdRef.current
      sessionIdRef.current = null
      setOpened(null)
      setOpening(false)
      if (!id) return
      // Retirer la requête AVANT de révoquer : c'est elle qui porte le
      // `refetchInterval`, et une session révoquée répondrait 404 en boucle.
      queryClient.removeQueries({ queryKey: uploadHandoffKeys.session(id) })
      // Sans `await` : au démontage il n'y a plus personne pour attendre. Si le
      // navigateur se ferme avant que le DELETE parte, l'échéance de dix
      // minutes et le balayage du sas s'en chargent.
      void uploadHandoffApi.revoke(id).catch(() => undefined)
    }
  }, [enabled, signature, queryClient])

  const sessionId = opened?.id ?? null

  const sondage = useQuery({
    queryKey: uploadHandoffKeys.session(sessionId ?? ""),
    queryFn: () => uploadHandoffApi.get(sessionId as string),
    enabled: Boolean(sessionId),
    // Réévalué après chaque réponse : l'arrivée de la photo comme le passage
    // de l'échéance coupent le sondage au tour suivant, soit deux secondes.
    refetchInterval: (query) => pollDelay(query.state.data, Date.now()),
    refetchIntervalInBackground: false,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })

  const session = sondage.data ?? null
  const state = session?.state ?? null
  // Mémorisé sur la CHAÎNE, pas sur la session : chaque réponse du sondage rend
  // un objet neuf, et une `Date` neuve toutes les deux secondes relancerait le
  // battement du compte à rebours à chaque tour.
  const expiresAt = session?.expires_at ?? null
  const echeance = useMemo(() => (expiresAt ? new Date(expiresAt) : null), [expiresAt])
  const expired = echeance !== null && echeance.getTime() <= maintenant

  // Un battement par seconde, uniquement tant qu'une échéance court : il ne
  // sert qu'au compte à rebours affiché et à faire basculer `expired` sans
  // attendre la réponse suivante. Aucune requête n'en dépend.
  useEffect(() => {
    if (!echeance) return
    if (echeance.getTime() <= Date.now()) {
      setMaintenant(Date.now())
      return
    }
    const battement = window.setInterval(() => setMaintenant(Date.now()), 1_000)
    return () => window.clearInterval(battement)
  }, [echeance])

  const tentative = session?.retakes_left ?? 0
  const apercu = useQuery({
    queryKey: uploadHandoffKeys.preview(sessionId ?? "", tentative),
    queryFn: () => uploadHandoffApi.previewBlob(sessionId as string),
    enabled: Boolean(sessionId) && state === "proposed",
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  })

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const blob = apercu.data
  useEffect(() => {
    if (!blob) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(blob)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [blob])

  const oublier = useCallback(
    (id: string) => {
      sessionIdRef.current = null
      queryClient.removeQueries({ queryKey: uploadHandoffKeys.session(id) })
      setOpened(null)
    },
    [queryClient],
  )

  const confirmation = useMutation<HandoffOutcome, Error>({
    mutationFn: async () => {
      const id = sessionIdRef.current
      if (!id) throw new Error("Aucune session de dépôt n'est ouverte.")
      if (session?.mode === "stage-only") {
        // Pas de fiche à écrire : on redescend les octets, on en refait un
        // fichier, et le formulaire d'inscription suit son cours inchangé.
        const octets = await queryClient.fetchQuery({
          queryKey: uploadHandoffKeys.preview(id, tentative),
          queryFn: () => uploadHandoffApi.previewBlob(id),
          staleTime: Infinity,
          gcTime: 0,
        })
        const mime = session.staged_mime ?? octets.type ?? "image/jpeg"
        const fichier = new File([octets], nomDeFichier(mime), { type: mime })
        // Les octets sont désormais dans le navigateur : le sas n'a plus à les
        // garder, et le code QR n'a plus à ouvrir quoi que ce soit.
        await uploadHandoffApi.revoke(id).catch(() => undefined)
        oublier(id)
        return { kind: "staged", file: fichier }
      }
      const ecrite = await uploadHandoffApi.confirm(id)
      oublier(id)
      return { kind: "saved", url: ecrite.url }
    },
  })

  const reprise = useMutation<number, Error>({
    mutationFn: async () => {
      const id = sessionIdRef.current
      if (!id) throw new Error("Aucune session de dépôt n'est ouverte.")
      const rouverte = await uploadHandoffApi.retake(id)
      // Remettre l'état localement relance le sondage sans attendre le tour
      // suivant : la personne au téléphone peut renvoyer tout de suite.
      queryClient.setQueryData<HandoffSession>(uploadHandoffKeys.session(id), (precedente) =>
        precedente
          ? {
              ...precedente,
              state: "open",
              retakes_left: rouverte.retakes_left,
              staged_mime: null,
            }
          : precedente,
      )
      return rouverte.retakes_left
    },
  })

  /** Fermeture explicite (« Annuler ») : la même chose que le démontage. */
  const revoke = useCallback(async () => {
    const id = sessionIdRef.current
    if (!id) return
    oublier(id)
    await uploadHandoffApi.revoke(id).catch(() => undefined)
  }, [oublier])

  const secondsLeft = echeance
    ? Math.max(0, Math.round((echeance.getTime() - maintenant) / 1000))
    : null

  return {
    /** L'ouverture est en cours : ni code QR ni état à montrer encore. */
    opening,
    /** L'ouverture a échoué — droit manquant, Redis absent, adresse publique refusée. */
    openError,
    session,
    state,
    mode: session?.mode ?? null,
    label: session?.label ?? opened?.label ?? "",
    metier: session?.metier ?? opened?.metier ?? "",
    qrSvg: opened?.qr_svg ?? null,
    url: opened?.url ?? null,
    accepts: opened?.accepts ?? [],
    maxBytes: opened?.max_bytes ?? null,
    warnings: opened?.warnings ?? [],
    expiresAt: echeance,
    secondsLeft,
    expired,
    retakesLeft: session?.retakes_left ?? null,
    /** Le sondage tourne-t-il vraiment ? Utile à l'écran comme au test. */
    polling: pollDelay(session ?? undefined, maintenant) !== false,
    /** La session a disparu du serveur (404) : code périmé, ou déjà révoquée. */
    lost: sondage.isError,
    previewUrl,
    previewLoading: apercu.isFetching,
    previewError: apercu.isError,
    confirm: confirmation.mutateAsync,
    confirming: confirmation.isPending,
    confirmError: confirmation.error?.message ?? null,
    retake: reprise.mutateAsync,
    retaking: reprise.isPending,
    retakeError: reprise.error?.message ?? null,
    revoke,
  }
}
