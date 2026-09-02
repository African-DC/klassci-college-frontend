"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ClipboardList } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog"
import { ClassSelect } from "@/components/shared/ClassSelect"
import { DataError } from "@/components/shared/DataError"
import { StudentBatchCard } from "@/components/admin/enrollments/batch/StudentBatchCard"
import { ligneComplete } from "@/lib/contracts/in-kind-roster"
import { useClassChoice } from "@/lib/hooks/useClassChoice"
import { useCurrentAcademicYearId } from "@/lib/hooks/useCurrentAcademicYear"
import {
  useInKindRoster,
  useSetEnrollmentProfile,
  useToggleInKindDeposit,
} from "@/lib/hooks/useInKindRoster"

/** La derniere classe ouverte, pour reprendre ou on s'est arrete. */
const DERNIERE_CLASSE = "klassci.saisie-classe.derniere"

/**
 * Par ou reprendre : le lien s'il porte une classe, sinon la derniere ouverte.
 *
 * Rend `undefined` quand rien n'est exploitable — navigation privee, stockage
 * bloque, valeur abimee — et l'ecran repart alors sur la premiere classe.
 */
export function reprendreOu(depuisLien: string | null): number | undefined {
  const duLien = Number(depuisLien)
  if (Number.isFinite(duLien) && duLien > 0) return duLien
  if (typeof window === "undefined") return undefined
  try {
    const retenue = Number(window.localStorage.getItem(DERNIERE_CLASSE))
    return Number.isFinite(retenue) && retenue > 0 ? retenue : undefined
  } catch {
    return undefined
  }
}

/** Le dépôt en attente de confirmation, le temps de la boîte. */
interface DepotEnAttente {
  enrollmentId: number
  feeId: number
  eleve: string
  article: string
}

/**
 * Saisie en lot du profil et des dépôts, une classe à la fois.
 *
 * Les éducateurs repassent derrière soixante-dix-huit inscriptions pour dire
 * qui est nouveau et qui a déposé son paquet de rames. Fiche par fiche, en
 * ouvrant chaque dossier et en changeant d'onglet, le travail ne se fait pas
 * jusqu'au bout. Ici, la classe tient dans une liste et chaque geste se sauve
 * seul.
 *
 * **Enregistrement au fil de l'eau, jamais un bouton final.** Sur une
 * connexion qui coupe, un formulaire de quarante lignes perdu est un travail
 * qui ne sera pas refait.
 *
 * **Une seule confirmation pour les dépôts, pas quarante.** Marquer un article
 * déposé retire la ligne du dû ; on le dit une fois, à la première case de la
 * session. Ensuite chaque dépôt part directement, parce qu'il est réversible :
 * l'annulation existe désormais et se trouve sur la ligne même.
 */
export function InKindBatchClient() {
  const { academicYearId } = useCurrentAcademicYearId()
  // D'ou reprendre : le lien d'abord, sinon la derniere classe ouverte.
  // L'educateur en enchaine trente ; le renvoyer a la premiere a chaque retour
  // lui coute un geste a chaque fois. Le chargement, le tri et le repli sur la
  // premiere classe vivent dans `useClassChoice`, partages avec l'ecran des
  // soldes : deux ecrans qui listeraient la meme ecole dans deux ordres
  // differents, c'est une 6e B introuvable la ou on la cherche.
  const params = useSearchParams()
  const {
    classes,
    classId: classeChoisie,
    setClassId,
    isLoading: classesLoading,
    isError: classesEnErreur,
  } = useClassChoice(reprendreOu(params.get("class")))

  useEffect(() => {
    if (!classeChoisie) return
    try {
      window.localStorage.setItem(DERNIERE_CLASSE, String(classeChoisie))
    } catch {
      // Rien a faire : se souvenir est un confort, pas une garantie.
    }
  }, [classeChoisie])

  const { data, isLoading, isError, refetch } = useInKindRoster(classeChoisie, academicYearId)
  const lignes = data?.items ?? []

  const [profilEnCours, setProfilEnCours] = useState<number | null>(null)
  const [feeEnCours, setFeeEnCours] = useState<number | null>(null)
  const [depotsExpliques, setDepotsExpliques] = useState(false)
  const [enAttente, setEnAttente] = useState<DepotEnAttente | null>(null)

  const updateProfil = useSetEnrollmentProfile(classeChoisie, academicYearId)
  const toggleDepot = useToggleInKindDeposit(classeChoisie, academicYearId)

  const restants = lignes.filter((l) => !ligneComplete(l)).length

  function poserProfil(enrollmentId: number, valeur: boolean | null) {
    setProfilEnCours(enrollmentId)
    updateProfil.mutate(
      { enrollmentId, value: valeur },
      { onSettled: () => setProfilEnCours(null) },
    )
  }

  function envoyerDepot(enrollmentId: number, feeId: number, deposer: boolean) {
    setFeeEnCours(feeId)
    toggleDepot.mutate(
      { enrollmentId, feeId, deposer },
      { onSettled: () => setFeeEnCours(null) },
    )
  }

  function demanderDepot(row: (typeof lignes)[number], feeId: number, deposer: boolean) {
    // Annuler n'a pas besoin d'être confirmé : le geste répare, il ne détruit
    // rien. C'est poser le dépôt qui retire une ligne du dû.
    if (!deposer || depotsExpliques) {
      envoyerDepot(row.enrollment_id, feeId, deposer)
      return
    }
    const article = row.fees.find((f) => f.fee_id === feeId)?.category_name ?? "cet article"
    setEnAttente({
      enrollmentId: row.enrollment_id,
      feeId,
      eleve: `${row.last_name} ${row.first_name}`,
      article,
    })
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-start gap-2.5">
        <ClipboardList aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <h1 className="text-lg font-semibold leading-tight">Saisie par classe</h1>
          <p className="text-sm text-muted-foreground">
            Qui est nouveau, et qui a déposé son article. Chaque réponse est enregistrée tout de
            suite, vous pouvez vous arrêter et reprendre.
          </p>
        </div>
      </div>

      <ClassSelect
        id="classe-saisie"
        classes={classes}
        value={classeChoisie}
        onChange={setClassId}
        isLoading={classesLoading}
        isError={classesEnErreur}
      />

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <DataError message="Impossible de charger cette classe." onRetry={() => refetch()} />
      ) : lignes.length === 0 ? (
        <p className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Aucune inscription à renseigner dans cette classe.
        </p>
      ) : (
        <>
          <p
            className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
            aria-live="polite"
          >
            {restants === 0
              ? `Les ${lignes.length} élèves de cette classe sont renseignés.`
              : `${restants} élève${restants > 1 ? "s" : ""} sur ${lignes.length} reste${
                  restants > 1 ? "nt" : ""
                } à renseigner.`}
          </p>

          <ul className="space-y-3">
            {lignes.map((row) => (
              <StudentBatchCard
                key={row.enrollment_id}
                row={row}
                profilEnCours={profilEnCours === row.enrollment_id}
                feeEnCours={feeEnCours}
                onProfil={(valeur) => poserProfil(row.enrollment_id, valeur)}
                onDepot={(feeId, deposer) => demanderDepot(row, feeId, deposer)}
              />
            ))}
          </ul>
        </>
      )}

      <ConfirmActionDialog
        open={enAttente !== null}
        onOpenChange={(ouvert) => {
          if (!ouvert) setEnAttente(null)
        }}
        title="Marquer un article déposé"
        description="Marquer un article déposé retire son montant de ce que la famille doit. Vous pourrez annuler un dépôt posé par erreur : le bouton apparaît sur la ligne."
        details={
          enAttente ? (
            <span>
              Premier dépôt de cette session : <strong>{enAttente.article}</strong> pour{" "}
              <strong>{enAttente.eleve}</strong>. Les suivants seront enregistrés sans redemander.
            </span>
          ) : undefined
        }
        confirmLabel="Marquer déposé"
        pendingLabel="Enregistrement..."
        tone="warning"
        onConfirm={() => {
          if (!enAttente) return
          setDepotsExpliques(true)
          envoyerDepot(enAttente.enrollmentId, enAttente.feeId, true)
          setEnAttente(null)
        }}
      />
    </div>
  )
}
