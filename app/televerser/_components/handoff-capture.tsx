"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Camera,
  FileText,
  ImagePlus,
  Loader2,
  RotateCcw,
  Send,
  SwitchCamera,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { depositHandoffFile } from "@/lib/api/public-handoff"
import type { PublicHandoffView } from "@/lib/contracts/upload-handoff"
import { useLiveCamera } from "@/lib/hooks/useLiveCamera"
import { ALLOWED_PHOTO_TYPES, downscaleImageFile } from "@/lib/photo/camera"
import { HandoffNotice } from "./handoff-notice"

/**
 * Prendre ou choisir, revoir, envoyer. Trois écrans, et rien d'autre.
 *
 * Ce que cette page dit, et ce qu'elle tait
 * ========================================
 *
 * Elle annonce l'établissement, la nature du geste (« Photo d'élève ») et un
 * libellé volontairement pauvre — prénom et initiale. Pas de matricule, pas de
 * classe, pas de date de naissance : un code QR se photographie dans un
 * couloir, et ce qui s'affiche ici est à la portée de qui le ramasse. Elle dit
 * aussi, en toutes lettres, que rien ne sera enregistré tant que la personne
 * devant l'ordinateur n'aura pas confirmé — c'est la vérité du dispositif, et
 * c'est ce qui rassure celui qui envoie la photo d'un enfant.
 *
 * Sur une 3G qui coupe
 * ====================
 *
 * Le fichier reste en mémoire après un échec, et la session serveur redevient
 * disponible d'elle-même : « Réessayer » renvoie les mêmes octets sans qu'on
 * ait à rescanner quoi que ce soit, ni à faire reposer l'élève. C'est la seule
 * raison pour laquelle l'aperçu passe par `URL.createObjectURL` et non par le
 * serveur : zéro octet de réseau pour revoir sa photo.
 *
 * Et l'image est réduite AVANT d'être validée, jamais après : un JPEG sorti de
 * la galerie d'un téléphone récent pèse quatre à six mégaoctets — refusé tel
 * quel, et interminable en 3G. Réduit, il en fait quelques dizaines de milliers.
 */

type Phase = "choix" | "camera" | "revue" | "envoi" | "envoye"

interface EchecEnvoi {
  message: string
  /** Le même fichier peut repartir : pas besoin de refaire la photo. */
  retryable: boolean
}

const NOM_DES_FORMATS: Record<string, string> = {
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "application/pdf": "PDF",
}

function formatsLisibles(accepts: string[]): string {
  const noms = accepts.map((type) => NOM_DES_FORMATS[type] ?? type)
  return noms.length > 0 ? noms.join(", ") : "JPEG, PNG, WebP"
}

function megaoctets(octets: number): string {
  return `${Math.round(octets / (1024 * 1024))} Mo`
}

/** Les bornes de la CIBLE, pas une table globale : une pièce jointe accepte le PDF, une photo non. */
function refusPourCe(file: File, accepts: string[], maxBytes: number): string | null {
  if (accepts.length > 0 && !accepts.includes(file.type)) {
    return `Ce fichier n'est pas d'un format accepté. Utilisez : ${formatsLisibles(accepts)}.`
  }
  if (file.size > maxBytes) {
    return `Ce fichier dépasse ${megaoctets(maxBytes)}. Reprenez la photo de plus loin.`
  }
  return null
}

function compteARebours(secondes: number): string {
  const minutes = Math.floor(secondes / 60)
  const reste = secondes % 60
  return `${minutes}:${String(reste).padStart(2, "0")}`
}

/** Un dépôt déjà posé : la page rouvre alors sur son écran de fin, pas sur la prise de vue. */
function phaseInitiale(etat: PublicHandoffView["state"]): Phase {
  return etat === "proposed" || etat === "done" ? "envoye" : "choix"
}

export function HandoffCapture({
  tenant,
  token,
  view,
}: {
  tenant: string
  token: string
  view: PublicHandoffView
}) {
  const galerieRef = useRef<HTMLInputElement>(null)
  const appareilRef = useRef<HTMLInputElement>(null)
  // Garde anti-course : un envoi abandonné ne doit pas écraser l'écran d'un
  // envoi plus récent. Même motif que la vérification de fichier publique.
  const envoiRef = useRef(0)

  const [phase, setPhase] = useState<Phase>(() => phaseInitiale(view.state))
  const [fichier, setFichier] = useState<File | null>(null)
  const [apercu, setApercu] = useState<string | null>(null)
  const [refus, setRefus] = useState<string | null>(null)
  const [echec, setEchec] = useState<EchecEnvoi | null>(null)
  const [preparation, setPreparation] = useState(false)
  const [monte, setMonte] = useState(false)
  const [maintenant, setMaintenant] = useState(() => Date.now())

  const camera = useLiveCamera({ facing: "environment" })
  // `canUseLiveCamera()` répond faux sur le serveur et vrai dans le navigateur :
  // on n'affiche donc le chemin caméra qu'après le montage, sinon l'hydratation
  // rend un écran et en trouve un autre.
  useEffect(() => setMonte(true), [])

  useEffect(() => {
    if (!fichier) {
      setApercu(null)
      return
    }
    // La MEME liste que l'envoi, pas « tout image/* ».
    //
    // `image/svg+xml` commence par `image/` : le garde large laissait donc
    // afficher un SVG la ou une photo d'eleve est attendue — que le serveur
    // aurait de toute facon refuse. Un apercu plus permissif que l'envoi
    // montre a l'operateur quelque chose qui ne partira jamais.
    if (!ALLOWED_PHOTO_TYPES.has(fichier.type)) {
      setApercu(null)
      return
    }
    const url = URL.createObjectURL(fichier)
    // `createObjectURL` rend toujours un `blob:`. On le VERIFIE quand meme,
    // parce que cette chaine part dans l'attribut `src` d'une image : le jour
    // ou l'apercu viendrait d'ailleurs — d'une reponse serveur, d'un parametre
    // d'adresse — un `javascript:` y passerait sans que rien ne l'arrete.
    // L'invariant est ecrit la ou il nait, pas suppose au rendu.
    if (!url.startsWith("blob:")) {
      URL.revokeObjectURL(url)
      setApercu(null)
      return
    }
    setApercu(url)
    return () => URL.revokeObjectURL(url)
  }, [fichier])

  // Le compte à rebours se lit sur l'échéance, jamais sur un compteur qu'on
  // décrémente : un téléphone qui met la page en veille fige le second et le
  // rendrait faux au réveil, précisément au moment où il faut savoir s'il reste
  // du temps. Le battement s'arrête de lui-même à l'échéance.
  const echeance = useMemo(() => Date.parse(view.expires_at), [view.expires_at])
  useEffect(() => {
    if (Number.isNaN(echeance)) return
    const battement = window.setInterval(() => {
      const instant = Date.now()
      setMaintenant(instant)
      if (instant >= echeance) window.clearInterval(battement)
    }, 1_000)
    return () => window.clearInterval(battement)
  }, [echeance])

  const secondes = Number.isNaN(echeance)
    ? null
    : Math.max(0, Math.round((echeance - maintenant) / 1000))
  const expire = secondes !== null && secondes <= 0
  const envoiBloque = Boolean(echec && !echec.retryable)

  async function retenir(choisi: File | null) {
    setEchec(null)
    if (!choisi) {
      setRefus(null)
      setFichier(null)
      setPhase("choix")
      return
    }
    setPreparation(true)
    try {
      // Un PDF ne passe pas par le canvas : il n'y a rien à redessiner, et le
      // faire le détruirait. Seules les images sont réduites.
      const prepare = choisi.type.startsWith("image/") ? await downscaleImageFile(choisi) : choisi
      const probleme = refusPourCe(prepare, view.accepts, view.max_bytes)
      if (probleme) {
        setRefus(probleme)
        setFichier(null)
        setPhase("choix")
        return
      }
      setRefus(null)
      setFichier(prepare)
      setPhase("revue")
    } finally {
      setPreparation(false)
    }
  }

  async function prendreALaCamera() {
    const pris = await camera.capture()
    if (!pris) return
    await retenir(pris)
  }

  async function envoyer() {
    if (!fichier) return
    const envoi = ++envoiRef.current
    setPhase("envoi")
    setEchec(null)
    const issue = await depositHandoffFile(tenant, token, fichier)
    if (envoi !== envoiRef.current) return
    if (issue.status === "sent") {
      setPhase("envoye")
      return
    }
    setEchec({ message: issue.message, retryable: issue.retryable })
    setPhase("revue")
  }

  function ouvrirLaCamera() {
    setEchec(null)
    setRefus(null)
    setPhase("camera")
    void camera.start("environment")
  }

  function fermerLaCamera() {
    camera.stop()
    setPhase(fichier ? "revue" : "choix")
  }

  // ---------------------------------------------------------------------
  // Les écrans terminaux
  // ---------------------------------------------------------------------

  if (phase === "envoye") {
    return (
      <HandoffNotice
        tone="success"
        title="Photo envoyée"
        message="Revenez à l'ordinateur : la photo s'y affiche, et c'est là qu'elle sera confirmée ou reprise. Vous pouvez fermer cette page."
      >
        {/*
          Ce bouton RECHARGE, il ne revient pas en arrière.

          Une fois la photo envoyée, la session est « proposée » côté serveur,
          et un nouvel envoi part en 409 tant que l'opérateur n'a pas cliqué
          « Reprendre » sur l'ordinateur. Renvoyer simplement l'écran de prise
          de vue offrait donc un geste dont on savait qu'il échouerait.

          Cette page reçoit un instantané et n'interroge pas le serveur : elle
          ne peut pas apprendre seule que la session a rouvert. Recharger est
          le seul moyen honnête de le découvrir — et si elle a rouvert,
          l'écran de prise de vue revient de lui-même.
        */}
        <Button
          type="button"
          variant="outline"
          className="mt-2 h-12 w-full max-w-xs text-base"
          onClick={() => window.location.reload()}
        >
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
          Reprendre depuis l&apos;ordinateur
        </Button>
        <p className="mt-2 max-w-xs text-center text-sm text-muted-foreground">
          Pour envoyer une autre photo, demandez « Reprendre » sur l&apos;ordinateur, puis touchez
          ce bouton.
        </p>
      </HandoffNotice>
    )
  }

  if (expire) {
    return (
      <HandoffNotice
        tone="neutral"
        title="Ce code a expiré"
        message="Un code d'envoi ne vit que quelques minutes. Demandez-en un nouveau sur l'ordinateur, puis scannez-le à nouveau."
      />
    )
  }

  if (view.state === "receiving" && phase === "choix" && !fichier) {
    return (
      <HandoffNotice
        tone="warning"
        title="Un envoi est déjà en cours"
        message="Un autre téléphone a pris ce code en main. Attendez qu'il ait fini, ou demandez un nouveau code sur l'ordinateur."
      />
    )
  }

  // ---------------------------------------------------------------------
  // La page de travail
  // ---------------------------------------------------------------------

  return (
    <div className="flex flex-1 flex-col gap-5">
      <header className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{view.school_name}</p>
        <h1 className="text-2xl font-semibold leading-tight">{view.metier}</h1>
        {view.label ? <p className="text-lg font-medium">Pour {view.label}</p> : null}
        <p className="text-sm leading-relaxed text-foreground/80">
          Cette photo part vers l&apos;ordinateur qui affiche le code. Elle ne sera enregistrée que
          si la personne devant cet ordinateur la confirme.
        </p>
        {secondes !== null ? (
          <p className="text-sm text-foreground/80">
            Code valable encore{" "}
            <span className="font-semibold tabular-nums text-foreground">
              {compteARebours(secondes)}
            </span>
          </p>
        ) : null}
      </header>

      {phase === "camera" ? (
        <section className="flex flex-1 flex-col gap-3" aria-label="Prise de vue">
          <div className="overflow-hidden rounded-xl bg-zinc-950">
            <video
              ref={camera.videoRef}
              autoPlay
              muted
              playsInline
              className="aspect-[3/4] h-auto w-full object-cover"
            />
          </div>
          {camera.error ? (
            <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive">
              {camera.error.message}
            </p>
          ) : null}
          <div className="mt-auto space-y-3">
            <Button
              type="button"
              className="h-14 w-full text-base"
              disabled={camera.status !== "live"}
              onClick={() => void prendreALaCamera()}
            >
              <Camera className="h-5 w-5" aria-hidden="true" />
              Prendre la photo
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-12 flex-1 text-base"
                onClick={() => void camera.flip()}
              >
                <SwitchCamera className="h-5 w-5" aria-hidden="true" />
                Objectif
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 flex-1 text-base"
                onClick={fermerLaCamera}
              >
                <X className="h-5 w-5" aria-hidden="true" />
                Annuler
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {phase !== "camera" && fichier ? (
        <section className="flex flex-1 flex-col gap-3" aria-label="Aperçu de la photo">
          {apercu?.startsWith("blob:") ? (
            <div className="overflow-hidden rounded-xl border bg-muted">
              {/* Un blob local : `next/image` ne peut pas l'optimiser, et il n'y
                  a rien à optimiser — l'image ne vient pas du réseau. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={apercu}
                alt="Aperçu de la photo à envoyer"
                className="aspect-[3/4] w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border bg-muted/40 px-4 py-5">
              <FileText className="h-8 w-8 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0">
                <p className="truncate text-base font-medium">{fichier.name}</p>
                <p className="text-sm text-muted-foreground">
                  {Math.round(fichier.size / 1024)} Ko
                </p>
              </div>
            </div>
          )}

          <div className="mt-auto space-y-3">
            {/* Quand le serveur a refusé ce fichier-là, renvoyer les mêmes
                octets ne peut que refuser à nouveau : l'action principale passe
                alors à « Reprendre », et l'envoi se ferme. */}
            <Button
              type="button"
              className={envoiBloque ? "h-12 w-full text-base" : "h-14 w-full text-base"}
              variant={envoiBloque ? "outline" : "default"}
              disabled={phase === "envoi" || envoiBloque}
              onClick={() => void envoyer()}
            >
              {phase === "envoi" ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-5 w-5" aria-hidden="true" />
              )}
              {phase === "envoi" ? "Envoi en cours…" : echec ? "Réessayer l'envoi" : "Envoyer"}
            </Button>
            <Button
              type="button"
              variant={envoiBloque ? "default" : "outline"}
              className={envoiBloque ? "h-14 w-full text-base" : "h-12 w-full text-base"}
              disabled={phase === "envoi"}
              onClick={() => void retenir(null)}
            >
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
              Reprendre la photo
            </Button>
          </div>
        </section>
      ) : null}

      {phase === "choix" && !fichier ? (
        <section className="flex flex-1 flex-col gap-3" aria-label="Choisir une photo">
          <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed bg-muted/30 px-4 py-10 text-center">
            <p className="text-base text-foreground/80">
              Prenez la photo, ou choisissez-en une déjà enregistrée.
            </p>
          </div>
          <div className="mt-auto space-y-3">
            {monte && camera.available ? (
              <Button
                type="button"
                className="h-14 w-full text-base"
                disabled={preparation}
                onClick={ouvrirLaCamera}
              >
                <Camera className="h-5 w-5" aria-hidden="true" />
                Prendre la photo
              </Button>
            ) : (
              <Button
                type="button"
                className="h-14 w-full text-base"
                disabled={preparation}
                onClick={() => appareilRef.current?.click()}
              >
                <Camera className="h-5 w-5" aria-hidden="true" />
                Ouvrir l&apos;appareil photo
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full text-base"
              disabled={preparation}
              onClick={() => galerieRef.current?.click()}
            >
              <ImagePlus className="h-5 w-5" aria-hidden="true" />
              Choisir un fichier
            </Button>
          </div>
        </section>
      ) : null}

      {/* Une seule région annoncée, toujours montée : la préparation, le refus
          d'un fichier et l'échec d'un envoi y passent tous, et rien n'est porté
          par la seule couleur. */}
      <div aria-live="polite" className="space-y-2 empty:hidden">
        {preparation ? (
          <p className="text-sm text-foreground/80">Préparation de la photo…</p>
        ) : null}
        {phase === "envoi" ? (
          <p className="text-sm text-foreground/80">Envoi en cours, ne fermez pas cette page…</p>
        ) : null}
        {refus ? (
          <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive">
            {refus}
          </p>
        ) : null}
        {echec ? (
          <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive">
            {echec.message}
          </p>
        ) : null}
        {monte && !camera.available && camera.unavailableReason && phase === "choix" ? (
          <p className="text-sm text-foreground/80">{camera.unavailableReason.message}</p>
        ) : null}
      </div>

      <input
        ref={appareilRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(evenement) => {
          void retenir(evenement.target.files?.[0] ?? null)
          evenement.target.value = ""
        }}
      />
      <input
        ref={galerieRef}
        type="file"
        accept={view.accepts.join(",")}
        className="hidden"
        onChange={(evenement) => {
          void retenir(evenement.target.files?.[0] ?? null)
          evenement.target.value = ""
        }}
      />
    </div>
  )
}
