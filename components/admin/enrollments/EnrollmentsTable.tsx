"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { Route } from "next"
import { Check } from "lucide-react"
import {
  useBulkValidateEnrollments,
  useDeleteEnrollment,
  useInfiniteEnrollments,
  useValidateEnrollment,
} from "@/lib/hooks/useEnrollments"
import { enrollmentStatusView } from "@/lib/enrollment/status"
import { STATUTS_VALIDABLES, selectionVisible } from "@/lib/enrollment/selection"
import { BulkValidateBar } from "@/components/admin/enrollments/BulkValidateBar"
import { StudentInitialsAvatar, colonnesInscriptions } from "@/components/admin/enrollments/enrollment-columns"
import type { Enrollment } from "@/lib/contracts/enrollment"
import { Badge } from "@/components/ui/badge"
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
import { CrudTable } from "@/components/shared/CrudTable"
import { DirectoryFiltersBar } from "@/components/shared/list/DirectoryFiltersBar"
import { MobileEntityListItem } from "@/components/shared/MobileEntityListItem"
import { AssignmentStatusBadge } from "@/components/shared/AssignmentStatusBadge"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { useCurrentAcademicYearId } from "@/lib/hooks/useCurrentAcademicYear"
import { useClasses } from "@/lib/hooks/useClasses"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Cohorte « À valider » = prospect + en_validation. La sémantique queue : c'est
// ce que l'admin doit traiter activement à la rentrée.
/** Reexporte pour les filtres locaux ; la source est `lib/enrollment/selection`. */
const TO_VALIDATE_STATUSES = STATUTS_VALIDABLES


const PAGE_SIZE = 20

// Avatar inline avec initiales — pas de photo (les enrollments n'en exposent
// pas, l'admin verra la photo dans la fiche élève).

// Chip de filtre cohorte — duplication locale du pattern StudentsTable. À
// extraire dans `components/shared/FilterChip.tsx` au 3e consommateur (rule
// 3-strikes, redesign-premium.md §architecture).
function FilterChip({
  label,
  count,
  isActive,
  onClick,
  tone = "default",
}: {
  label: string
  count: number
  isActive: boolean
  onClick: () => void
  tone?: "default" | "warning"
}) {
  const baseClasses =
    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors"
  const activeClasses = isActive
    ? tone === "warning"
      ? "border-amber-500 bg-amber-100 text-amber-900"
      : "border-primary bg-primary text-primary-foreground"
    : "border-border bg-muted/40 text-foreground hover:bg-muted"
  return (
    <button type="button" onClick={onClick} className={cn(baseClasses, activeClasses)}>
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
          isActive
            ? tone === "warning"
              ? "bg-amber-200 text-amber-900"
              : "bg-primary-foreground/20 text-primary-foreground"
            : "bg-background text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  )
}

type AssignmentChipKey = "tous" | "affectes" | "non_affectes" | "non_renseigne"

// Affecté et réaffecté sont tous deux subventionnés par l'État : côté filtre
// ils forment une seule cohorte, celle dont l'école ne facture qu'une part.
function matchesAssignmentChip(enrollment: Enrollment, chip: AssignmentChipKey): boolean {
  switch (chip) {
    case "affectes":
      return enrollment.assignment_status === "affecte" || enrollment.assignment_status === "reaffecte"
    case "non_affectes":
      return enrollment.assignment_status === "non_affecte"
    case "non_renseigne":
      return !enrollment.assignment_status
    default:
      return true
  }
}

export function EnrollmentsTable() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>("a_valider")
  const [classId, setClassId] = useState<string>("")
  const [pickedYearId, setPickedYearId] = useState<number | undefined>(undefined)
  const [assignmentChip, setAssignmentChip] = useState<AssignmentChipKey>("tous")
  const [validateTarget, setValidateTarget] = useState<Enrollment | null>(null)
  const debouncedSearch = useDebounce(search)
  const { academicYearId, years } = useCurrentAcademicYearId(pickedYearId)
  const { data: classesData } = useClasses({ size: 100 })
  const classes = classesData?.items ?? []

  const params = useMemo(
    () => ({
      size: PAGE_SIZE,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(status ? { status } : {}),
      ...(classId ? { class_id: Number(classId) } : {}),
      ...(academicYearId != null ? { academic_year_id: academicYearId } : {}),
    }),
    [debouncedSearch, status, classId, academicYearId],
  )

  const { data, isLoading, isError, error, refetch, scrollInfini } = useInfiniteEnrollments(params)
  const deleteMutation = useDeleteEnrollment()
  const validateMutation = useValidateEnrollment()
  const bulkValidate = useBulkValidateEnrollments()
  // Les cases cochees. Ce qui part au serveur est `selectionVisible`, son
  // intersection avec la page affichee : voir plus bas.
  const [selection, setSelection] = useState<Set<number>>(new Set())

  const allItems = data?.items ?? []

  const assignmentCounts = useMemo(() => {
    let affectes = 0
    let nonAffectes = 0
    let nonRenseigne = 0
    for (const e of allItems) {
      if (matchesAssignmentChip(e, "affectes")) affectes += 1
      else if (matchesAssignmentChip(e, "non_affectes")) nonAffectes += 1
      else nonRenseigne += 1
    }
    return { tous: allItems.length, affectes, nonAffectes, nonRenseigne }
  }, [allItems])

  const filteredItems = useMemo(
    () => allItems.filter((e) => matchesAssignmentChip(e, assignmentChip)),
    [allItems, assignmentChip],
  )


  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
  }, [])

  const handleAssignmentChipClick = useCallback((key: AssignmentChipKey) => {
    setAssignmentChip(key)
  }, [])

  const handleValidate = useCallback(() => {
    if (!validateTarget) return
    validateMutation.mutate(validateTarget.id, {
      onSettled: () => setValidateTarget(null),
    })
  }, [validateMutation, validateTarget])

  const isToValidate = (e: Enrollment) => TO_VALIDATE_STATUSES.has(e.status)

  // Une liste vide à cause du filtre d'affectation n'est pas une absence de
  // données : sans cette nuance l'admin croit avoir perdu ses inscriptions.
  const emptyMessage =
    assignmentChip === "tous"
      ? "Aucune inscription trouvée"
      : "Aucune inscription ne correspond à cette affectation"

  /** Les lignes affichees qu'on a le droit de valider. */
  const validables = useMemo(
    () => filteredItems.filter((e) => TO_VALIDATE_STATUSES.has(e.status)),
    [filteredItems],
  )
  // Ce qui partira au serveur : voir `lib/enrollment/selection.ts`, ou le
  // calcul est teste.
  const aEnvoyer = useMemo(
    () => selectionVisible(filteredItems, selection),
    [filteredItems, selection],
  )
  const toutSelectionne = validables.length > 0 && validables.length === aEnvoyer.length

  const basculer = useCallback((id: number) => {
    setSelection((prec) => {
      const suivant = new Set(prec)
      if (suivant.has(id)) suivant.delete(id)
      else suivant.add(id)
      return suivant
    })
  }, [])

  const columns = useMemo(
    () =>
      colonnesInscriptions({
        selection,
        basculer,
        toutSelectionne,
        validables,
        onValider: setValidateTarget,
        onToutSelectionner: (tout: boolean) =>
          setSelection(tout ? new Set(validables.map((e) => e.id)) : new Set()),
      }),
    // Sans ces dependances, cocher une case ne redessine pas les cellules :
    // l'etat change, l'ecran ne bouge pas.
    [basculer, selection, toutSelectionne, validables],
  )

  const extraFilterCount = [status !== "a_valider", classId, pickedYearId != null].filter(Boolean).length

  return (
    <div className="space-y-4">
      <DirectoryFiltersBar
        search={search}
        onSearchChange={handleSearchChange}
        placeholder="Rechercher un élève..."
        activeCount={extraFilterCount}
        onReset={() => {
          setStatus("a_valider")
          setClassId("")
          setPickedYearId(undefined)
        }}
      >
        <Select
          value={status || "all"}
          onValueChange={(v) => setStatus(v === "all" ? "" : v)}
        >
          <SelectTrigger className="h-10 w-[170px]" aria-label="Filtrer par statut">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="a_valider">À valider</SelectItem>
            <SelectItem value="valide">Validées</SelectItem>
            <SelectItem value="prospect">Dossier ouvert</SelectItem>
            <SelectItem value="en_validation">En attente de validation</SelectItem>
            <SelectItem value="rejete">Rejetées</SelectItem>
            <SelectItem value="annule">Annulées</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={classId || "all"}
          onValueChange={(v) => setClassId(v === "all" ? "" : v)}
        >
          <SelectTrigger className="h-10 w-[160px]" aria-label="Filtrer par classe">
            <SelectValue placeholder="Classe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les classes</SelectItem>
            {classes.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={academicYearId ? String(academicYearId) : undefined}
          onValueChange={(v) => setPickedYearId(Number(v))}
        >
          <SelectTrigger className="h-10 w-[160px]" aria-label="Année scolaire">
            <SelectValue placeholder="Année scolaire" />
          </SelectTrigger>
          <SelectContent>
            {(years ?? []).map((y) => (
              <SelectItem key={y.id} value={String(y.id)}>
                {y.name}
                {y.is_current ? " (en cours)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DirectoryFiltersBar>

      {/* Second axe : l'affectation. Séparé du pipeline de validation parce
          qu'il répond à une autre question — non pas « que dois-je traiter »
          mais « qui l'État subventionne », ce que le comptable croise avec la
          grille tarifaire. */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-x-visible">
        <span className="shrink-0 text-xs font-medium text-muted-foreground">Affectation</span>
        <FilterChip
          label="Tous"
          count={assignmentCounts.tous}
          isActive={assignmentChip === "tous"}
          onClick={() => handleAssignmentChipClick("tous")}
        />
        <FilterChip
          label="Affectés"
          count={assignmentCounts.affectes}
          isActive={assignmentChip === "affectes"}
          onClick={() => handleAssignmentChipClick("affectes")}
        />
        <FilterChip
          label="Non affectés"
          count={assignmentCounts.nonAffectes}
          isActive={assignmentChip === "non_affectes"}
          onClick={() => handleAssignmentChipClick("non_affectes")}
        />
        <FilterChip
          label="Non renseigné"
          count={assignmentCounts.nonRenseigne}
          isActive={assignmentChip === "non_renseigne"}
          onClick={() => handleAssignmentChipClick("non_renseigne")}
        />
      </div>

      {/* La barre n'apparait qu'une fois quelque chose de selectionne : une
          barre vide en permanence occupe la hauteur d'une ligne pour ne rien
          dire, sur un ecran ou la liste est deja longue. */}
      <BulkValidateBar
        nombre={aEnvoyer.length}
        enCours={bulkValidate.isPending}
        onAnnuler={() => setSelection(new Set())}
        onValider={() =>
          bulkValidate.mutate(aEnvoyer.map((e) => e.id), {
            // On vide apres coup : les statuts ont change, garder la
            // selection proposerait de valider ce qui vient de l'etre.
            onSuccess: () => setSelection(new Set()),
          })
        }
      />

      {/* Desktop : table dense via CrudTable. Mobile : liste minimaliste +
          bouton Valider distinct (Wave-style — la zone tap-to-drill n'avale
          pas l'action). */}
      <div className="hidden md:block">
        <CrudTable<Enrollment>
          data={{
            items: filteredItems,
            // `total` vient du serveur : les puces retirent des lignes de
            // l'affichage, elles ne changent pas ce que la base contient.
            total: data?.total ?? filteredItems.length,
            size: data?.size ?? PAGE_SIZE,
            page: 1,
            total_pages: 1,
          }}
          columns={columns}
          isLoading={isLoading}
          isError={isError}
          error={error}
          refetch={refetch}
          deleteMutation={deleteMutation}
          onRowClick={(item) => router.push(`/admin/enrollments/${item.id}`)}
          renderEditModal={() => null}
          getItemLabel={(e) => `#${e.id}`}
          emptyMessage={emptyMessage}
          errorMessage="Impossible de charger les inscriptions"
          deleteTitle="Supprimer l'inscription"
          deleteDescription="Cette action est irréversible. L'inscription sera définitivement supprimée."
          scrollInfini={scrollInfini}
        />
      </div>

      <div className="space-y-2 md:hidden">
        {isLoading && (
          <p className="rounded-lg border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            Chargement…
          </p>
        )}
        {!isLoading && filteredItems.length === 0 && (
          <p className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        )}
        {filteredItems.map((e) => (
          <div key={e.id} className="space-y-2">
            <MobileEntityListItem
              href={`/admin/enrollments/${e.id}` as Route}
              avatar={
                <StudentInitialsAvatar
                  firstName={e.student_first_name}
                  lastName={e.student_last_name}
                  size="sm"
                />
              }
              primary={
                <span>
                  {e.student_first_name} {e.student_last_name}
                </span>
              }
              secondary={`${e.class_name ?? `#${e.class_id}`} · ${e.academic_year_name}`}
              status={
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {enrollmentStatusView(e.status).label}
                  </Badge>
                  <AssignmentStatusBadge status={e.assignment_status} className="text-[10px]" />
                </div>
              }
            />
            {isToValidate(e) && (
              <Button
                type="button"
                onClick={() => setValidateTarget(e)}
                className="h-11 w-full bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Check className="mr-1.5 h-4 w-4" />
                Valider l&apos;inscription
              </Button>
            )}
          </div>
        ))}
      </div>

      <AlertDialog
        open={validateTarget !== null}
        onOpenChange={(open) => !open && setValidateTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Valider l&apos;inscription ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de valider l&apos;inscription de{" "}
              <strong>
                {validateTarget?.student_first_name} {validateTarget?.student_last_name}
              </strong>{" "}
              en {validateTarget?.class_name ?? "—"} pour {validateTarget?.academic_year_name}. L&apos;inscription
              passera au statut « validé ».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={validateMutation.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleValidate}
              disabled={validateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-600"
            >
              {validateMutation.isPending ? "Validation…" : "Valider"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
