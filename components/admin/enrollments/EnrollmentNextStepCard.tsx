"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { Route } from "next"
import { Wallet, UserCheck } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EnrollmentNextAction } from "@/components/admin/enrollments/EnrollmentNextAction"
import { EnrollmentCheckoutDialog } from "@/components/admin/payments/checkout/EnrollmentCheckoutDialog"
import { checkoutTarget } from "@/components/admin/payments/checkout/checkout-target"
import { prochaineEtape } from "@/lib/enrollment/selection"
import { useValidateEnrollment } from "@/lib/hooks/useEnrollments"
import { usePermissions } from "@/lib/hooks/usePermissions"
import type { Enrollment } from "@/lib/contracts/enrollment"

const TEXTE = {
  encaisser: {
    Icon: Wallet,
    titre: "Prochaine étape : encaisser le premier versement",
    detail: "L'inscription se valide une fois un versement reçu.",
  },
  valider: {
    Icon: UserCheck,
    titre: "Versement reçu : l'inscription peut être validée",
    detail: "Validez-la pour que l'élève figure dans les effectifs de la classe.",
  },
} as const

/**
 * Ce qu'attend ce dossier, en tête de fiche, et le bouton pour le faire.
 *
 * C'est aussi là qu'aboutissent les notifications : « Versement attendu »
 * mène à `?action=encaisser`, « Inscription à valider » à `?action=valider`.
 * Ces liens ouvraient la fiche sans rien faire ; ils ouvrent désormais
 * l'action, si la personne en a le droit et si le dossier l'attend encore.
 */
export function EnrollmentNextStepCard({ enrollment }: { enrollment: Enrollment }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { has, isLoading } = usePermissions()
  const valider = useValidateEnrollment()
  const [encaisser, setEncaisser] = useState(false)
  const [confirmer, setConfirmer] = useState(false)
  const lienTraite = useRef(false)

  const etape = prochaineEtape(enrollment)
  const peutEncaisser = has("payments:create")
  const peutValider = has("enrollments:validate")

  useEffect(() => {
    if (lienTraite.current || isLoading) return
    const action = params.get("action")
    if (!action) return
    lienTraite.current = true
    if (action === "encaisser" && etape === "encaisser" && peutEncaisser) setEncaisser(true)
    if (action === "valider" && etape === "valider" && peutValider) setConfirmer(true)
    // L'action est consommée : un rechargement de la page ne la rejoue pas.
    router.replace(pathname as Route, { scroll: false })
  }, [params, isLoading, etape, peutEncaisser, peutValider, router, pathname])

  if (!etape || isLoading) return null
  const { Icon, titre, detail } = TEXTE[etape]

  return (
    <>
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#f5821f] to-[#f9a826] text-white shadow-sm">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <div className="text-sm">
            <p className="font-medium">{titre}</p>
            <p className="text-muted-foreground">{detail}</p>
          </div>
        </div>
        <div className="sm:w-auto">
          <EnrollmentNextAction
            enrollment={enrollment}
            peutEncaisser={peutEncaisser}
            peutValider={peutValider}
            onEncaisser={() => setEncaisser(true)}
            onValider={() => setConfirmer(true)}
            wide
          />
        </div>
      </div>

      <EnrollmentCheckoutDialog
        target={encaisser ? checkoutTarget(enrollment) : null}
        onClose={() => setEncaisser(false)}
      />

      <AlertDialog open={confirmer} onOpenChange={setConfirmer}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Valider l&apos;inscription ?</AlertDialogTitle>
            <AlertDialogDescription>
              {checkoutTarget(enrollment).studentName} passera au statut « validé » en{" "}
              {checkoutTarget(enrollment).contexte}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11 sm:h-10">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="h-11 bg-emerald-600 text-white hover:bg-emerald-700 sm:h-10"
              disabled={valider.isPending}
              onClick={() => valider.mutate(enrollment.id)}
            >
              Valider
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
