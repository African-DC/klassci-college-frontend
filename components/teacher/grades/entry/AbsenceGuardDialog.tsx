"use client"

import Link from "next/link"
import type { Route } from "next"
import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
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

/**
 * Les deux gestes autour de la case « Abs. » qui ne se rattrapent pas.
 *
 * `lift-blocked` : décocher un zéro d'office déjà enregistré. La règle métier
 * veut que seule une autorisation de reprise le lève. Autant le dire au moment
 * du geste plutôt que de laisser le backend refuser en silence.
 *
 * `overwrite` : cocher « Abs. » sur un élève déjà noté. La note est remplacée
 * par un zéro et rien ne permet de la retrouver ensuite.
 */
export type AbsenceGuard =
  | { kind: "lift-blocked"; studentName: string }
  | { kind: "overwrite"; studentName: string; value: number }

/**
 * La règle, dite d'une seule façon. Le bandeau de la feuille de saisie, cette
 * boîte de dialogue et le message affiché quand le backend refuse la levée
 * lisent tous cette phrase : trois formulations différentes pour une même
 * règle, ce serait trois occasions de la contredire.
 */
export const ABSENCE_LIFT_RULE =
  "Pour lever un zéro d'office, l'administration délivre une autorisation de reprise."

interface AbsenceGuardDialogProps {
  guard: AbsenceGuard | null
  /** Écran des autorisations de reprise, quand le portail y donne accès. */
  retakesHref?: string
  onCancel: () => void
  onConfirm: () => void
}

function formatGrade(value: number): string {
  return String(value).replace(".", ",")
}

export function AbsenceGuardDialog({
  guard,
  retakesHref,
  onCancel,
  onConfirm,
}: AbsenceGuardDialogProps) {
  const isBlocked = guard?.kind === "lift-blocked"

  return (
    <AlertDialog open={guard !== null} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isBlocked
              ? "Ce zéro d'office ne se lève pas ici"
              : "Remplacer la note par un zéro d'office ?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {guard === null ? null : guard.kind === "lift-blocked" ? (
              <>
                {guard.studentName} est enregistré absent à cette épreuve. Le zéro compte
                dans la moyenne tant que l&apos;administration n&apos;a pas délivré une
                autorisation de reprise. Une fois le billet délivré, la case se libère et
                vous saisissez la note de rattrapage.
              </>
            ) : (
              <>
                {guard.studentName} a déjà {formatGrade(guard.value)}/20 sur cette épreuve.
                La cocher absente remplace cette note par un zéro d&apos;office, et la note
                d&apos;origine ne sera plus consultable nulle part.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {isBlocked ? (
            <>
              {retakesHref && (
                <Button variant="outline" asChild className="h-11 gap-2 sm:h-10">
                  <Link href={retakesHref as Route}>
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Voir les autorisations de reprise
                  </Link>
                </Button>
              )}
              <AlertDialogAction onClick={onCancel} className="h-11 sm:h-10">
                J&apos;ai compris
              </AlertDialogAction>
            </>
          ) : (
            <>
              <AlertDialogCancel onClick={onCancel} className="h-11 sm:h-10">
                Garder la note
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={onConfirm}
                className="h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:h-10"
              >
                Remplacer par un zéro
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
