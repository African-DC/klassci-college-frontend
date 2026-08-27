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

interface AlerteDoublonProps {
  matches: Match[]
  /** Une vérification en cours ne doit pas ressembler à « aucun doublon ». */
  enCours?: boolean
  /** Ni une vérification impossible : le silence serait pris pour un feu vert. */
  echec?: boolean
  /** Le serveur a arrêté sa recherche avant la fin. */
  truncated?: boolean
  /** Le libellé de l'action en cours, pour que le message reste concret. */
  action?: string
  className?: string
}

function nomComplet(c: Match) {
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
function EtatSansCorrespondance({
  echec,
  enCours,
  truncated,
  className,
}: {
  echec: boolean
  enCours: boolean
  truncated: boolean
  className?: string
}) {
  const message = echec
    ? "Vérification des doublons impossible. Contrôlez le matricule avant de continuer."
    : enCours
      ? "Vérification des doublons…"
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
export function AlerteDoublon({
  matches,
  action,
  className,
  enCours = false,
  echec = false,
  truncated = false,
}: AlerteDoublonProps) {
  if (matches.length === 0) {
    return <EtatSansCorrespondance echec={echec} enCours={enCours} truncated={truncated} className={className} />
  }

  // Derive du reason plutot que recu a part : un booleen expedie a cote de sa
  // propre source peut diverger d'elle.
  const certain = matches.some((c) => c.reason === "enrollment_number")
  const dejaInscrit = matches.find((c) => c.current_year_enrollment)

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
                ? "Un élève déjà enregistré ressemble à cette saisie."
                : `${matches.length} élèves déjà enregistrés ressemblent à cette saisie.`}
          </p>

          {dejaInscrit?.current_year_enrollment && (
            <p className="text-muted-foreground">
              {/* Le libellé est celui d'un badge : « Dossier ouvert », « Inscrit ».
                  Le couler dans la phrase donnait « a déjà une inscription dossier
                  ouvert en 3eme 2 ». Entre parenthèses, il redevient lisible quel
                  que soit le statut. */}
              {nomComplet(dejaInscrit)} a déjà un dossier pour cette année
              {dejaInscrit.current_year_enrollment.class_name
                ? ` en ${dejaInscrit.current_year_enrollment.class_name}`
                : ""}{" "}
              (statut :{" "}
              {enrollmentStatusView(
                dejaInscrit.current_year_enrollment.status,
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
                  {nomComplet(c)}
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

          {echec && (
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
