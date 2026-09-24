"use client"

import { useMemo } from "react"
import { CreditCard } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EnrollmentCheckout } from "@/components/admin/payments/checkout/EnrollmentCheckout"
import { checkoutTarget } from "@/components/admin/payments/checkout/checkout-target"
import { useEnrollment } from "@/lib/hooks/useEnrollments"
import { useStudentFees } from "@/lib/hooks/useStudents"

interface StudentPaymentModalProps {
  studentId: number
  studentName?: string
  open: boolean
  onClose: () => void
}

/**
 * Encaisser depuis la fiche élève.
 *
 * La fiche élève ne sait pas quelle inscription encaisser : on prend celle
 * dont les frais restent dus, faute de quoi la première, et on l'affiche avec
 * sa classe et son année. Tout le reste, la
 * saisie, la clé d'envoi, le reçu et la validation, est le parcours commun
 * d'`EnrollmentCheckout` : une seconde copie du formulaire avait fini par ne
 * plus se comporter comme la première.
 */
export function StudentPaymentModal({
  studentId,
  studentName,
  open,
  onClose,
}: StudentPaymentModalProps) {
  const { data: fees, isLoading: feesLoading } = useStudentFees(studentId)

  const { enrollmentId, totalRemaining } = useMemo(() => {
    const list = fees ?? []
    const due = list.find((f) => f.remaining > 0)
    const choisie = due?.enrollment_id ?? list[0]?.enrollment_id ?? null
    return {
      enrollmentId: choisie,
      // Le reste de CETTE inscription : additionner toutes les années ferait
      // annoncer une dette que ce versement ne peut pas régler ici.
      totalRemaining: list
        .filter((f) => f.enrollment_id === choisie)
        .reduce((acc, f) => acc + (f.remaining ?? 0), 0),
    }
  }, [fees])
  // L'inscription elle-même, pour dire sa classe et son année : ce peut être
  // un reliquat de l'an dernier, et la caissière doit le voir.
  const {
    data: inscription,
    isLoading: inscriptionLoading,
    isError: inscriptionEnErreur,
    refetch,
  } = useEnrollment(enrollmentId ?? 0)
  const isLoading = feesLoading || (enrollmentId !== null && inscriptionLoading)

  return (
    <Dialog open={open} onOpenChange={(ouvert) => !ouvert && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <CreditCard className="h-5 w-5 text-primary" aria-hidden />
            Nouveau versement
          </DialogTitle>
          <DialogDescription>
            Par défaut, le montant va aux frais impayés par priorité (Inscription, Trimestres,
            COGES, Tenue). Vous pouvez aussi le répartir vous-même, frais par frais.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : enrollmentId === null ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aucun frais configuré pour cette inscription. Configurez d&apos;abord les frais scolaires
            avant d&apos;enregistrer un versement.
          </p>
        ) : totalRemaining <= 0 ? (
          <p className="py-6 text-center text-sm text-emerald-700 dark:text-emerald-400">
            Tous les frais sont soldés pour cette inscription.
          </p>
        ) : inscriptionEnErreur ? (
          <div className="space-y-3 py-4 text-center">
            <p className="text-sm text-muted-foreground">
              Impossible de charger l&apos;inscription à encaisser.
            </p>
            <Button type="button" variant="outline" onClick={() => refetch()} className="h-11">
              Réessayer
            </Button>
          </div>
        ) : open && inscription ? (
          <EnrollmentCheckout
            key={enrollmentId}
            {...checkoutTarget(inscription)}
            studentName={studentName ?? checkoutTarget(inscription).studentName}
            onDone={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
