"use client"

import { AlertTriangle } from "lucide-react"
import { useNewStudentSuggestion } from "@/lib/hooks/useEnrollments"
import { formatFcfa } from "@/lib/utils/money"

interface PriorArrearsNoticeProps {
  /** Absent quand l'élève est créé par ce formulaire : rien à interroger. */
  studentId?: number
  academicYearId?: number
}

/**
 * Ce que l'élève doit encore sur les AUTRES exercices, dit là où l'on réinscrit.
 *
 * C'est le dernier écran où quelqu'un regarde le dossier avant que la
 * réinscription ne fasse basculer les portails et la fiche élève sur la
 * nouvelle année : une dette qu'on ne voit pas ici ne se reverra plus nulle
 * part. Elle ne fait pas partie du total des frais affiché juste au-dessus, et
 * la phrase le dit, sans quoi la secrétaire croirait la somme déjà comptée.
 *
 * Le montant arrive **déjà masqué** par le serveur, selon `payments:read` et
 * `payments:status:read`. L'écran lit ce qu'il reçoit et ne refait jamais ce
 * raisonnement : deux vérités valent moins qu'une, et la version d'ici serait
 * la fausse le jour où une école redistribue ces droits.
 *
 * Un montant à `null` s'affiche en tiret, jamais en zéro : un zéro se lirait
 * « cette famille ne doit rien », ce qui est un mensonge. Quand le serveur ne
 * rend que le booléen, l'alerte est dite sans chiffre.
 *
 * La requête est celle de la suggestion « nouvel élève », déjà lancée par le
 * même écran avec les mêmes clés : elle ne coûte pas un appel de plus.
 */
export function PriorArrearsNotice({ studentId, academicYearId }: PriorArrearsNoticeProps) {
  const { data } = useNewStudentSuggestion(studentId, academicYearId)
  if (!data) return null

  const montant = data.fees_arrears_other_years
  const signale = data.has_arrears_other_years

  // Rien à dire de deux façons : la famille ne doit rien ailleurs, ou ce
  // lecteur n'a droit ni au montant ni à l'état. Inventer une alerte sur un
  // silence serait pire que se taire.
  if (montant !== null && montant <= 0) return null
  if (montant === null && signale !== true) return null

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 dark:border-amber-700/60 dark:bg-amber-950/30"
    >
      <AlertTriangle
        aria-hidden
        className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400"
      />
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-foreground">
          Cet élève a des arriérés d&apos;un exercice antérieur.
        </p>
        <p className="text-sm text-muted-foreground">
          Reste dû sur les autres années :{" "}
          <span className="font-semibold text-foreground">
            {montant === null ? "—" : formatFcfa(montant)}
          </span>
          {montant === null ? " (le montant ne vous est pas communiqué)." : "."}
        </p>
        <p className="text-xs text-muted-foreground">
          Cette somme ne fait pas partie des frais de cette inscription : elle porte sur des années
          précédentes et reste due après la réinscription.
        </p>
      </div>
    </div>
  )
}
