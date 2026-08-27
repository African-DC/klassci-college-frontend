"use client"

import Link from "next/link"
import type { Route } from "next"
import { AlertTriangle, ArrowRight, Info } from "lucide-react"
import type { Correspondance } from "@/lib/contracts/duplicates"
// Le vocabulaire des statuts a un seul propriétaire : en garder une copie
// ici, c'est ce qui a fait afficher « en attente de validation » pour un
// dossier simplement ouvert.
import { enrollmentStatusView } from "@/lib/enrollment/status"
import { cn } from "@/lib/utils"

interface AlerteDoublonProps {
  correspondances: Correspondance[]
  /** Le libellé de l'action en cours, pour que le message reste concret. */
  action?: string
  className?: string
}


function nomComplet(c: Correspondance) {
  return [c.last_name, c.first_name].filter(Boolean).join(" ")
}

/**
 * Ce que le guichet doit voir avant de créer une fiche de plus.
 *
 * Le ton change avec la certitude, parce qu'un avertissement qui crie pareil
 * dans tous les cas finit par être cliqué sans être lu. Un matricule identique
 * est une certitude et se dit comme telle. Une ressemblance est une question,
 * et se pose comme une question.
 */
export function AlerteDoublon({ correspondances, action, className }: AlerteDoublonProps) {
  if (correspondances.length === 0) return null

  // Derive du motif plutot que recu a part : un booleen expedie a cote de sa
  // propre source peut diverger d elle.
  const certain = correspondances.some((c) => c.motif === "matricule")
  const dejaInscrit = correspondances.find((c) => c.inscription_annee_courante)

  return (
    <div
      role={certain ? "alert" : "status"}
      aria-live={certain ? "assertive" : "polite"}
      className={cn(
        "rounded-lg border p-3 text-sm",
        certain
          ? "border-destructive/40 bg-destructive/5"
          : "border-amber-500/40 bg-amber-50 dark:bg-amber-950/20",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        {certain ? (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
        ) : (
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-medium">
            {certain
              ? "Ce matricule appartient déjà à un élève."
              : correspondances.length === 1
                ? "Un élève déjà enregistré ressemble à cette saisie."
                : `${correspondances.length} élèves déjà enregistrés ressemblent à cette saisie.`}
          </p>

          {dejaInscrit?.inscription_annee_courante && (
            <p className="text-muted-foreground">
              {nomComplet(dejaInscrit)} a déjà une inscription{" "}
              {enrollmentStatusView(dejaInscrit.inscription_annee_courante.status).label.toLowerCase()}
              {dejaInscrit.inscription_annee_courante.class_name
                ? ` en ${dejaInscrit.inscription_annee_courante.class_name}`
                : ""}{" "}
              pour cette année. {action ? `${action} en créerait une seconde.` : ""}
            </p>
          )}

          <ul className="space-y-1.5">
            {correspondances.slice(0, 4).map((c) => (
              <li key={c.student_id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <Link
                  href={`/admin/students/${c.student_id}` as Route}
                  className="inline-flex h-11 items-center gap-1 font-medium underline underline-offset-2 sm:h-auto"
                >
                  {nomComplet(c)}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                {c.enrollment_number && (
                  <span className="font-mono text-xs text-muted-foreground">
                    {c.enrollment_number}
                  </span>
                )}
                {c.motif === "ressemblance" && c.score !== null && (
                  <span className="text-xs text-muted-foreground">
                    {Math.round(c.score * 100)} % de ressemblance
                    {/* Dire sur quoi le score porte : « 96 % » calculé sur le
                        seul nom et prénom n'engage pas autant que « 96 % »
                        calculé sur l'état civil complet, et les fiches reprises
                        de l'ancien système sont toutes dans le premier cas. */}
                    {c.juge_sur_peu ? ", sur le nom et le prénom seuls" : ""}
                  </span>
                )}
              </li>
            ))}
          </ul>

          {correspondances.length > 4 && (
            <p className="text-xs text-muted-foreground">
              et {correspondances.length - 4} autre{correspondances.length - 4 > 1 ? "s" : ""}.
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            {certain
              ? "Ouvrez la fiche existante plutôt que d'en créer une seconde : la scolarité et les versements y sont déjà."
              : "Vérifiez avant de continuer. Si c'est bien un autre élève, poursuivez."}
          </p>
        </div>
      </div>
    </div>
  )
}
