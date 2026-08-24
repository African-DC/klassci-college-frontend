"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { Route } from "next"
import type { ColumnDef } from "@tanstack/react-table"
import { Check } from "lucide-react"
import {
  useBulkValidateEnrollments,
  useDeleteEnrollment,
  useEnrollments,
  useValidateEnrollment,
} from "@/lib/hooks/useEnrollments"
import { Checkbox } from "@/components/ui/checkbox"
import { enrollmentStatusView } from "@/lib/enrollment/status"
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
import { MobileEntityListItem } from "@/components/shared/MobileEntityListItem"
import { AssignmentStatusBadge } from "@/components/shared/AssignmentStatusBadge"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { cn } from "@/lib/utils"

// Cohorte « À valider » = prospect + en_validation. La sémantique queue : c'est
// ce que l'admin doit traiter activement à la rentrée.
const TO_VALIDATE_STATUSES = new Set<Enrollment["status"]>(["prospect", "en_validation"])


const PAGE_SIZE = 20

// Avatar inline avec initiales — pas de photo (les enrollments n'en exposent
// pas, l'admin verra la photo dans la fiche élève).
function StudentInitialsAvatar({
  firstName,
  lastName,
  size = "md",
}: {
  firstName: string | null | undefined
  lastName: string | null | undefined
  size?: "sm" | "md"
}) {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?"
  const sizeClass = size === "sm" ? "h-9 w-9" : "h-8 w-8"
  return (
    <div
      className={cn(
        sizeClass,
        "flex shrink-0 items-center justify-center rounded-lg border border-border bg-primary/10",
      )}
    >
      <span className="text-xs font-semibold text-primary">{initials}</span>
    </div>
  )
}

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

type ChipKey = "a_valider" | "validees"

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
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [activeChip, setActiveChip] = useState<ChipKey>("a_valider")
  const [assignmentChip, setAssignmentChip] = useState<AssignmentChipKey>("tous")
  const [validateTarget, setValidateTarget] = useState<Enrollment | null>(null)
  const debouncedSearch = useDebounce(search)

  // On charge tout d'un coup (size=100, max BE actuel) pour dériver les
  // counts client-side sans endpoint /filters dédié. Acceptable ≤100
  // enrollments par tenant — au delà, on ajoutera GET /admin/enrollments/filters
  // (déféré). 100 est la limite Pydantic `Query(20, le=100)` côté BE.
  const params = useMemo(
    () => ({
      size: 100,
      page: 1,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
    [debouncedSearch],
  )

  const { data, isLoading, isError, error, refetch } = useEnrollments(params)
  const deleteMutation = useDeleteEnrollment()
  const validateMutation = useValidateEnrollment()
  const bulkValidate = useBulkValidateEnrollments()
  // La selection ne survit pas a un changement de page : on ne valide que
  // ce qu'on a sous les yeux, sinon on signe pour des dossiers qu'on n'a
  // pas relus.
  const [selection, setSelection] = useState<Set<number>>(new Set())

  const allItems = data?.items ?? []

  const counts = useMemo(() => {
    let aValider = 0
    let validees = 0
    for (const e of allItems) {
      if (TO_VALIDATE_STATUSES.has(e.status)) aValider += 1
      else if (e.status === "valide") validees += 1
    }
    return { aValider, validees }
  }, [allItems])

  // Cohorte de statut d'abord : les compteurs d'affectation doivent refléter
  // la liste qu'on regarde, pas tout le tenant.
  const statusFilteredItems = useMemo(() => {
    if (activeChip === "a_valider") {
      return allItems.filter((e) => TO_VALIDATE_STATUSES.has(e.status))
    }
    return allItems.filter((e) => e.status === "valide")
  }, [allItems, activeChip])

  const assignmentCounts = useMemo(() => {
    let affectes = 0
    let nonAffectes = 0
    let nonRenseigne = 0
    for (const e of statusFilteredItems) {
      if (matchesAssignmentChip(e, "affectes")) affectes += 1
      else if (matchesAssignmentChip(e, "non_affectes")) nonAffectes += 1
      else nonRenseigne += 1
    }
    return { tous: statusFilteredItems.length, affectes, nonAffectes, nonRenseigne }
  }, [statusFilteredItems])

  const filteredItems = useMemo(
    () => statusFilteredItems.filter((e) => matchesAssignmentChip(e, assignmentChip)),
    [statusFilteredItems, assignmentChip],
  )

  const paginatedItems = useMemo(
    () => filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredItems, page],
  )

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setPage(1)
  }, [])

  const handleChipClick = useCallback((key: ChipKey) => {
    setActiveChip(key)
    setPage(1)
  }, [])

  const handleAssignmentChipClick = useCallback((key: AssignmentChipKey) => {
    setAssignmentChip(key)
    setPage(1)
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
    () => paginatedItems.filter((e) => TO_VALIDATE_STATUSES.has(e.status)),
    [paginatedItems],
  )
  const toutSelectionne = validables.length > 0 && validables.every((e) => selection.has(e.id))

  const basculer = useCallback((id: number) => {
    setSelection((prec) => {
      const suivant = new Set(prec)
      if (suivant.has(id)) suivant.delete(id)
      else suivant.add(id)
      return suivant
    })
  }, [])

  const columns: ColumnDef<Enrollment>[] = useMemo(
    () => [
      {
        id: "selection",
        header: () => (
          <Checkbox
            checked={toutSelectionne}
            onCheckedChange={(v: boolean | "indeterminate") =>
              setSelection(v ? new Set(validables.map((e) => e.id)) : new Set())
            }
            aria-label="Tout sélectionner"
            disabled={validables.length === 0}
          />
        ),
        cell: ({ row }) => {
          // Une inscription deja validee n'a rien a offrir au lot : la case
          // absente dit pourquoi mieux qu'une case grisee.
          if (!TO_VALIDATE_STATUSES.has(row.original.status)) return null
          return (
            <Checkbox
              checked={selection.has(row.original.id)}
              onCheckedChange={() => basculer(row.original.id)}
              onClick={(ev: React.MouseEvent) => ev.stopPropagation()}
              aria-label={`Sélectionner ${row.original.student_last_name ?? ""}`}
            />
          )
        },
      },
      {
        accessorKey: "student_id",
        header: "Élève",
        cell: ({ row }) => {
          const e = row.original
          return (
            <div className="flex items-center gap-3">
              <StudentInitialsAvatar
                firstName={e.student_first_name}
                lastName={e.student_last_name}
              />
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {e.student_first_name} {e.student_last_name}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  #{e.id} · {e.academic_year_name}
                </p>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "class_id",
        header: "Classe",
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs font-medium">
            {row.original.class_name ?? `#${row.original.class_id}`}
          </Badge>
        ),
      },
      {
        accessorKey: "assignment_status",
        header: "Affectation",
        cell: ({ row }) => <AssignmentStatusBadge status={row.original.assignment_status} />,
      },
      {
        accessorKey: "status",
        header: "Statut",
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-xs">
            {enrollmentStatusView(row.original.status).label}
          </Badge>
        ),
      },
      {
        id: "validate-action",
        header: "",
        cell: ({ row }) => {
          const e = row.original
          if (!isToValidate(e)) return null
          return (
            <Button
              type="button"
              size="sm"
              className="h-9 bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={(ev) => {
                ev.stopPropagation()
                setValidateTarget(e)
              }}
            >
              <Check className="mr-1 h-4 w-4" />
              Valider
            </Button>
          )
        },
      },
    ],
    // Sans ces dependances, cocher une case ne redessine pas les cellules :
    // l etat change, l ecran ne bouge pas.
    [basculer, selection, toutSelectionne, validables],
  )

  return (
    <div className="space-y-4">
      {/* Chips bar — pipeline de validation. « À valider » sélectionnée par
          défaut car c'est la queue d'action de l'admin. */}
      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-x-visible">
        <FilterChip
          label="À valider"
          count={counts.aValider}
          isActive={activeChip === "a_valider"}
          onClick={() => handleChipClick("a_valider")}
          tone="warning"
        />
        <FilterChip
          label="Validées"
          count={counts.validees}
          isActive={activeChip === "validees"}
          onClick={() => handleChipClick("validees")}
        />
      </div>

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
      {selection.size > 0 && (
        <div className="hidden items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-2.5 md:flex">
          <p className="text-sm">
            <span className="font-semibold">{selection.size}</span>{" "}
            {selection.size === 1 ? "inscription sélectionnée" : "inscriptions sélectionnées"}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelection(new Set())}>
              Annuler
            </Button>
            <Button
              size="sm"
              disabled={bulkValidate.isPending}
              onClick={() =>
                bulkValidate.mutate([...selection], {
                  // On vide apres coup : les statuts ont change, garder la
                  // selection proposerait de valider ce qui vient de l'etre.
                  onSuccess: () => setSelection(new Set()),
                })
              }
            >
              {bulkValidate.isPending ? "Validation…" : "Valider la sélection"}
            </Button>
          </div>
        </div>
      )}

      {/* Desktop : table dense via CrudTable. Mobile : liste minimaliste +
          bouton Valider distinct (Wave-style — la zone tap-to-drill n'avale
          pas l'action). */}
      <div className="hidden md:block">
        <CrudTable<Enrollment>
          data={{
            items: paginatedItems,
            total: filteredItems.length,
            page,
            size: PAGE_SIZE,
            total_pages: Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE)),
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
          page={page}
          onPageChange={setPage}
          searchPlaceholder="Rechercher une inscription..."
          searchValue={search}
          onSearchChange={handleSearchChange}
        />
      </div>

      <div className="space-y-2 md:hidden">
        {isLoading && (
          <p className="rounded-lg border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            Chargement…
          </p>
        )}
        {!isLoading && paginatedItems.length === 0 && (
          <p className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        )}
        {paginatedItems.map((e) => (
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
