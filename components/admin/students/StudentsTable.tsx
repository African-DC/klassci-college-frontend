"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { useDeleteStudent, useStudentFilters, useStudents } from "@/lib/hooks/useStudents"
import type { Student } from "@/lib/contracts/student"
import { Badge } from "@/components/ui/badge"
import { CrudTable } from "@/components/shared/CrudTable"
import { MobileEntityListItem } from "@/components/shared/MobileEntityListItem"
import { getUploadUrl, cn } from "@/lib/utils"
import { StudentEditModal } from "./StudentEditModal"
import { useDebounce } from "@/lib/hooks/useDebounce"

// Mini-icône genre inline à côté du nom (KEEP IN DATA pour DREN/bulletin compliance,
// mais hidden de la colonne dédiée).
function GenderIcon({ genre }: { genre: "M" | "F" | null | undefined }) {
  if (!genre) return null
  const label = genre === "M" ? "Masculin" : "Féminin"
  const symbol = genre === "M" ? "♂" : "♀"
  const tone = genre === "M" ? "text-blue-600" : "text-rose-600"
  return (
    <span className={cn("text-sm font-semibold", tone)} aria-label={label} title={label}>
      {symbol}
    </span>
  )
}

// Avatar avec photo si disponible, fallback initiales propre (pas cropé).
function StudentAvatar({ student, size = "md" }: { student: Student; size?: "sm" | "md" }) {
  const initials = `${student.first_name?.[0] ?? ""}${student.last_name?.[0] ?? ""}`.toUpperCase()
  const photoSrc = getUploadUrl(student.photo_url)
  const sizeClass = size === "sm" ? "h-9 w-9" : "h-10 w-10"
  if (photoSrc) {
    return (
      <img
        src={photoSrc}
        alt={`${student.first_name} ${student.last_name}`}
        className={cn(sizeClass, "shrink-0 rounded-lg object-cover border border-border")}
      />
    )
  }
  return (
    <div
      className={cn(
        sizeClass,
        "flex shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-border",
      )}
    >
      <span className="text-xs font-semibold text-primary">{initials}</span>
    </div>
  )
}

// Badge "À inscrire" actionable — tap → ouvre le formulaire d'inscription
// pré-rempli avec ce student_id (Wave-style : chaque info = 1 tap vers action).
function ToInscribeBadge({ studentId }: { studentId: number }) {
  return (
    <Link
      href={`/admin/enrollments?action=create&student_id=${studentId}`}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex h-6 items-center rounded-full border border-amber-300 bg-amber-50 px-2.5 text-[11px] font-medium text-amber-800 hover:bg-amber-100"
    >
      À inscrire
    </Link>
  )
}

// Chip de filtre cohorte. Click = (dé)sélectionne. La chip active reçoit le
// fond primaire ; les inactives un fond muted (lisible plein soleil Itel S661).
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

type ChipKey = "all" | `class:${number}` | "unenrolled"

export interface StudentsTableProps {
  initialUnenrolledOnly?: boolean
  onChipsConsumed?: () => void
}

export function StudentsTable({
  initialUnenrolledOnly = false,
  onChipsConsumed,
}: StudentsTableProps) {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [activeChip, setActiveChip] = useState<ChipKey>("all")
  const debouncedSearch = useDebounce(search)

  // Quand le subtitle envoie initialUnenrolledOnly=true, on bascule la chip.
  useEffect(() => {
    if (initialUnenrolledOnly) {
      setActiveChip("unenrolled")
      onChipsConsumed?.()
    }
  }, [initialUnenrolledOnly, onChipsConsumed])

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setPage(1)
  }, [])

  const params = useMemo(() => {
    const p: Record<string, unknown> = { page }
    if (debouncedSearch) p.search = debouncedSearch
    if (activeChip.startsWith("class:")) {
      p.class_id = Number(activeChip.split(":")[1])
    } else if (activeChip === "unenrolled") {
      p.unenrolled_only = true
    }
    return p
  }, [page, debouncedSearch, activeChip])

  const { data, isLoading, isError, error, refetch } = useStudents(params)
  const { data: filters } = useStudentFilters()
  const deleteMutation = useDeleteStudent()

  const handleChipClick = useCallback((key: ChipKey) => {
    setActiveChip(key)
    setPage(1)
  }, [])

  const columns: ColumnDef<Student>[] = useMemo(
    () => [
      {
        accessorKey: "last_name",
        header: "Élève",
        cell: ({ row }) => {
          const s = row.original
          return (
            <div className="flex items-center gap-3">
              <StudentAvatar student={s} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-medium">
                    {s.last_name} {s.first_name}
                  </p>
                  <GenderIcon genre={s.genre} />
                </div>
                {s.enrollment_number && (
                  <p className="truncate font-mono text-[10px] text-muted-foreground">
                    {s.enrollment_number}
                  </p>
                )}
              </div>
            </div>
          )
        },
      },
      {
        id: "current_class",
        header: "Classe",
        cell: ({ row }) => {
          const ce = row.original.current_enrollment
          if (ce) {
            return (
              <Badge variant="outline" className="text-xs font-medium">
                {ce.class_name}
              </Badge>
            )
          }
          return <ToInscribeBadge studentId={row.original.id} />
        },
      },
      {
        id: "current_status",
        header: "Statut",
        cell: ({ row }) => {
          const ce = row.original.current_enrollment
          if (!ce) {
            return <span className="text-xs text-muted-foreground">—</span>
          }
          return (
            <Badge variant="secondary" className="text-xs capitalize">
              {ce.status}
            </Badge>
          )
        },
      },
    ],
    [],
  )

  const items = data?.items ?? []

  return (
    <div className="space-y-4">
      {/* Barre de filtre-chips. Horizontal-scroll sur mobile (Itel S661 320px ne
          tient pas 14 chips wrap), wrap sur desktop. Le persona est mobile, on
          design pour mobile d'abord. */}
      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-x-visible">
        <FilterChip
          label="Tous"
          count={filters?.total ?? data?.total ?? 0}
          isActive={activeChip === "all"}
          onClick={() => handleChipClick("all")}
        />
        {(filters?.no_current_enrollment_count ?? 0) > 0 && (
          <FilterChip
            label="À inscrire"
            count={filters!.no_current_enrollment_count}
            isActive={activeChip === "unenrolled"}
            onClick={() => handleChipClick("unenrolled")}
            tone="warning"
          />
        )}
        {(filters?.by_class ?? []).map((c) => (
          <FilterChip
            key={c.class_id}
            label={c.class_name}
            count={c.count}
            isActive={activeChip === `class:${c.class_id}`}
            onClick={() => handleChipClick(`class:${c.class_id}`)}
          />
        ))}
      </div>

      {/* Desktop : table dense via CrudTable. Mobile : liste minimale via
          MobileEntityListItem. Tailwind hidden classes = display:none, zero JS,
          un seul layout visible à la fois. */}
      <div className="hidden md:block">
        <CrudTable<Student>
          data={data}
          columns={columns}
          isLoading={isLoading}
          isError={isError}
          error={error}
          refetch={refetch}
          deleteMutation={deleteMutation}
          onRowClick={(item) => router.push(`/admin/students/${item.id}`)}
          renderEditModal={({ itemId, open, onClose }) => (
            <StudentEditModal studentId={itemId} open={open} onClose={onClose} />
          )}
          getItemLabel={(s) => `${s.last_name} ${s.first_name}`}
          emptyMessage="Aucun élève trouvé"
          errorMessage="Impossible de charger les élèves"
          deleteDescription="Cette action est irréversible. L'élève sera définitivement supprimé."
          page={page}
          onPageChange={setPage}
          searchPlaceholder="Rechercher un élève..."
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
        {!isLoading && items.length === 0 && (
          <p className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Aucun élève trouvé
          </p>
        )}
        {items.map((s) => (
          <MobileEntityListItem
            key={s.id}
            href={`/admin/students/${s.id}`}
            avatar={<StudentAvatar student={s} size="sm" />}
            primary={
              <span className="flex items-center gap-1.5">
                {s.last_name} {s.first_name}
                <GenderIcon genre={s.genre} />
              </span>
            }
            secondary={
              s.current_enrollment ? (
                s.current_enrollment.class_name
              ) : (
                <span className="text-amber-700">À inscrire</span>
              )
            }
            status={
              s.current_enrollment ? (
                <Badge variant="secondary" className="text-[10px] capitalize">
                  {s.current_enrollment.status}
                </Badge>
              ) : null
            }
          />
        ))}
      </div>
    </div>
  )
}
