"use client"

import { useMemo, useState } from "react"
import { Loader2, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useStudents } from "@/lib/hooks/useStudents"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { cn } from "@/lib/utils"
import type { Student } from "@/lib/contracts/student"

/** En dessous, la recherche renverrait la moitié de l'établissement. */
const MIN_SEARCH_LENGTH = 2

interface StudentPickerProps {
  onSelect: (student: Student) => void
  /**
   * Élève déjà retenu. Fourni, la recherche laisse la place à un rappel de
   * l'élève choisi, avec un bouton pour en changer.
   */
  selected?: Student | null
  onClear?: () => void
  inputId?: string
  autoFocus?: boolean
  placeholder?: string
  className?: string
}

function studentInitials(student: Student): string {
  return `${student.first_name[0] ?? ""}${student.last_name[0] ?? ""}`.toUpperCase()
}

function studentSubtitle(student: Student): string {
  const parts: string[] = [
    student.enrollment_number ? `Matricule : ${student.enrollment_number}` : "Pas de matricule",
  ]
  if (student.current_enrollment?.class_name) parts.push(student.current_enrollment.class_name)
  else if (student.genre) parts.push(student.genre === "M" ? "Garçon" : "Fille")
  return parts.join(" · ")
}

function StudentIdentity({ student }: { student: Student }) {
  return (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
        {studentInitials(student)}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate font-medium">
          {student.last_name} {student.first_name}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {studentSubtitle(student)}
        </span>
      </span>
    </>
  )
}

/**
 * Choix d'un élève par la recherche, jamais par une liste déroulante.
 *
 * Un collège de six cents élèves ne tient pas dans une page d'API : la liste
 * déroulante n'en montrait que les cent premiers, sans champ de recherche, à
 * faire défiler sur un téléphone d'entrée de gamme. Ici on tape deux lettres,
 * le nom ou le matricule, et on tape sur une carte.
 */
export function StudentPicker({
  onSelect,
  selected = null,
  onClear,
  inputId,
  autoFocus = false,
  placeholder = "Rechercher un élève (nom, prénom, matricule)…",
  className,
}: StudentPickerProps) {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useStudents(
    debouncedSearch.length >= MIN_SEARCH_LENGTH ? { search: debouncedSearch } : {},
  )
  const students = useMemo(() => data?.items ?? [], [data])
  const searching = debouncedSearch.length >= MIN_SEARCH_LENGTH

  if (selected) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border bg-muted/30 p-3",
          className,
        )}
      >
        <StudentIdentity student={selected} />
        {onClear && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("")
              onClear()
            }}
            className="h-11 shrink-0 sm:h-9"
          >
            Changer
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id={inputId}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={placeholder}
          className="h-11 pl-10 sm:h-10"
          autoFocus={autoFocus}
        />
      </div>

      {search.length > 0 && search.length < MIN_SEARCH_LENGTH && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Saisissez au moins {MIN_SEARCH_LENGTH} caractères pour rechercher
        </p>
      )}

      {isLoading && searching && (
        <div className="flex items-center justify-center py-8">
          <Loader2
            className="h-5 w-5 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
          <span className="sr-only">Recherche en cours</span>
        </div>
      )}

      {!isLoading && searching && students.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Aucun élève trouvé pour «&nbsp;{debouncedSearch}&nbsp;»
        </p>
      )}

      {!isLoading && !searching && students.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Aucun élève enregistré. Créez d&apos;abord une fiche élève.
        </p>
      )}

      {students.length > 0 && (
        <div className="max-h-[40vh] space-y-2 overflow-y-auto">
          {students.map((student) => (
            <button
              key={student.id}
              type="button"
              onClick={() => onSelect(student)}
              className="flex min-h-11 w-full items-center gap-3 rounded-lg border bg-card p-3 text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              <StudentIdentity student={student} />
              <User className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
