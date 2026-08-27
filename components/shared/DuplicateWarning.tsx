"use client"

import Link from "next/link"
import type { Route } from "next"
import { AlertTriangle, ArrowRight, Info } from "lucide-react"
import type { Match } from "@/lib/contracts/duplicates"
// Le vocabulaire des statuts a un seul propriétaire : en garder une copie
// ici, c'est ce qui a fait afficher « en attente de validation » pour un
// dossier simplement ouvert.
import { enrollmentStatusView } from "@/lib/enrollment/status"
import { cn } from "@/lib/utils"

interface DuplicateWarningProps {
  matches: Match[]
  /** Une vérification en cours ne doit pas ressembler à « aucun doublon ». */
  pending?: boolean
  /** Ni une vérification impossible : le silence serait pris pour un feu vert. */
  failed?: boolean
  /** Le serveur a arrêté sa recherche avant la fin. */
  truncated?: boolean
  /** Le libellé de l'action en cours, pour que le message reste concret. */
  action?: string
  className?: string
}

function fullName(c: Match) {
  return [c.last_name, c.first_name].filter(Boolean).join(" ")
}

/**
 * Pourquoi il n'y a rien à montrer.
 *
 * Une liste vide a quatre sens : vérifié et propre, en cours, échoué, ou
 * interrompu avant la fin. Les rendre tous identiques revient à annoncer un
 * feu vert dans trois cas sur quatre. Les réunir ici garde la question
 * visible : le jour où une cinquième raison apparaît, elle se pose ici.
 *
 * `truncated` avait justement été oublié : le serveur levait le drapeau, la
 * documentation des deux côtés expliquait pourquoi il ne fallait pas se taire,
 * et l'écran se taisait.
 */
function NoMatchState({
  failed,
  pending,
  truncated,
  className,
}: {
  failed: boolean
  pending: boolean
  truncated: boolean
  className?: string
}) {
  const message = failed
    ? "Vérification des duplicates impossible. Contrôlez le matricule avant de continuer."
    : pending
      ? "Vérification des duplicates…"
      : truncated
        ? "Recherche interrompue avant la fin : rien trouvé parmi les premières fiches examinées. Contrôlez le matricule avant de continuer."
        : null

  if (message === null) return null
  return (
    <p role="status" className={cn("text-sm text-muted-foreground", className)}>
      {message}
    </p>
  )
}
/**
 * Ce que le guichet doit voir avant de créer une fiche de plus.
 *
 * Le ton change avec la certitude, parce qu'un avertissement qui crie pareil
 * dans tous les cas finit par être cliqué sans être lu. Un matricule identique
 * est une certitude et se dit comme telle. Une ressemblance est une question,
 * et se pose comme une question.
 */
export function DuplicateWarning({
  matches,
  action,
  className,
  pending = false,
  failed = false,
  truncated = false,
}: DuplicateWarningProps) {
  if (matches.length === 0) {
    return <NoMatchState failed={failed} pending={pending} truncated={truncated} className={className} />
  }

  // Dérivé du motif plutôt que reçu à part : un booleen expedie a cote de sa
  // propre source peut diverger d'elle.
  const certain = matches.some((c) => c.reason === "enrollment_number")
  const alreadyEnrolled = matches.find((c) => c.current_year_enrollment)

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
              : matches.length === 1
                ? "Un élève déjà enregistré ressemble à cette typed."
                : `${matches.length} élèves déjà enregistrés ressemblent à cette typed.`}
          </p>

          {alreadyEnrolled?.current_year_enrollment && (
            <p className="text-muted-foreground">
              {/* Le libellé est celui d'un badge : « Dossier ouvert », « Inscrit ».
                  Le couler dans la phrase donnait « a déjà une inscription dossier
                  ouvert en 3eme 2 ». Entre parenthèses, il redevient lisible quel
                  que soit le statut. */}
              {fullName(alreadyEnrolled)} a déjà un dossier pour cette année
              {alreadyEnrolled.current_year_enrollment.class_name
                ? ` en ${alreadyEnrolled.current_year_enrollment.class_name}`
                : ""}{" "}
              (statut :{" "}
              {enrollmentStatusView(
                alreadyEnrolled.current_year_enrollment.status,
              ).label.toLowerCase()}
              ).{action ? ` ${action} en créerait un second.` : ""}
            </p>
          )}

          <ul className="space-y-1.5">
            {matches.slice(0, 4).map((c) => (
              <li key={c.student_id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <Link
                  href={`/admin/students/${c.student_id}` as Route}
                  className="inline-flex h-11 items-center gap-1 font-medium underline underline-offset-2 sm:h-auto"
                >
                  {fullName(c)}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                {c.enrollment_number && (
                  <span className="font-mono text-xs text-muted-foreground">
                    {c.enrollment_number}
                  </span>
                )}
                {c.birth_date && (
                  <span className="text-xs text-muted-foreground">
                    né(e) le {new Date(c.birth_date).toLocaleDateString("fr-FR")}
                  </span>
                )}
                {c.reason === "similarity" && c.score !== null && (
                  <span className="text-xs text-muted-foreground">
                    {Math.round(c.score * 100)} % de ressemblance
                    {/* Dire sur quoi le score porte : « 96 % » calculé sur le
                        seul nom et prénom n'engage pas autant que « 96 % »
                        calculé sur l'état civil complet, et les fiches reprises
                        de l'ancien système sont toutes dans le premier cas. */}
                    {c.partial_identity ? ", état civil incomplet" : ""}
                  </span>
                )}
              </li>
            ))}
          </ul>

          {matches.length > 4 && (
            <p className="text-xs text-muted-foreground">
              et {matches.length - 4} autre{matches.length - 4 > 1 ? "s" : ""}.
            </p>
          )}

          {failed && (
            <p className="text-xs text-muted-foreground">
              La dernière vérification a échoué : cette liste peut être périmée.
            </p>
          )}

          {truncated && (
            <p className="text-xs text-muted-foreground">
              La recherche s'est arrêtée avant la fin : d'autres fiches peuvent
              correspondre.
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
