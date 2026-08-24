"use client"

import { useCallback, useRef, useState } from "react"
import { FileSignature, Loader2, Scale } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PageHero } from "@/components/shared/PageHero"
import { CouncilDeliberationTable } from "./CouncilDeliberationTable"
import { ReportsNav } from "../ReportsNav"
import { useCouncilMinutes, useGenerateCouncil } from "@/lib/hooks/useCouncil"
import { useClasses } from "@/lib/hooks/useClasses"
import { useAcademicYears } from "@/lib/hooks/useAcademicYears"

export function CouncilPageClient() {
  const { data: classesData } = useClasses()
  const classes = classesData?.items ?? []
  const { data: yearsData } = useAcademicYears()
  const years = yearsData?.items ?? []
  const currentYear = years.find((y) => y.is_current) ?? years[0]
  const ayId = currentYear?.id
  const [classId, setClassId] = useState<number | undefined>(undefined)
  const [trimester, setTrimester] = useState<string | undefined>(undefined)

  // Suivi des modifications non enregistrées (remonté depuis CouncilDeliberationTable)
  const isDirtyRef = useRef(false)
  const handleDirtyChange = useCallback((dirty: boolean) => {
    isDirtyRef.current = dirty
  }, [])

  // Dialog de confirmation quand on change de filtre avec des modifications en cours
  const [pendingFilter, setPendingFilter] = useState<
    { type: "class"; value: number } | { type: "trimester"; value: string } | null
  >(null)

  function handleClassChange(value: string) {
    const id = Number(value)
    if (isDirtyRef.current) {
      setPendingFilter({ type: "class", value: id })
    } else {
      setClassId(id)
    }
  }

  function handleTrimesterChange(value: string) {
    if (isDirtyRef.current) {
      setPendingFilter({ type: "trimester", value })
    } else {
      setTrimester(value)
    }
  }

  function confirmFilterChange() {
    if (!pendingFilter) return
    if (pendingFilter.type === "class") {
      setClassId(pendingFilter.value)
    } else {
      setTrimester(pendingFilter.value)
    }
    isDirtyRef.current = false
    setPendingFilter(null)
  }

  const filtersReady = !!classId && !!trimester && !!ayId
  const { data: minutes, isLoading } = useCouncilMinutes(classId, trimester, ayId)
  const { mutate: generate, isPending: isGenerating } = useGenerateCouncil(
    classId ?? 0,
    trimester ?? "",
    ayId ?? 0,
  )

  function handleGenerate() {
    if (!classId || !trimester || !ayId) return
    generate({ class_id: classId, trimester: Number(trimester), academic_year_id: ayId })
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <PageHero
        icon={Scale}
        title="Conseil de classe"
        subtitle="Procès-verbaux de délibération, décisions de passage par élève"
      />

      <ReportsNav current="council" />

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={classId?.toString() ?? ""}
          onValueChange={handleClassChange}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Classe" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={trimester ?? ""}
          onValueChange={handleTrimesterChange}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Trimestre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1er trimestre</SelectItem>
            <SelectItem value="2">2ème trimestre</SelectItem>
            <SelectItem value="3">3ème trimestre</SelectItem>
          </SelectContent>
        </Select>

        {minutes && (
          <Badge variant={minutes.is_published ? "default" : "secondary"}>
            {minutes.is_published ? "Validé" : "Brouillon"}
          </Badge>
        )}
      </div>

      {/* Contenu */}
      {!filtersReady ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Sélectionnez une classe et un trimestre pour afficher le procès-verbal.
          </p>
        </div>
      ) : isLoading ? (
        <CouncilSkeleton />
      ) : minutes ? (
        <CouncilDeliberationTable
          minutes={minutes}
          classId={classId as number}
          trimester={trimester as string}
          onDirtyChange={handleDirtyChange}
        />
      ) : (
        <div className="rounded-xl border border-dashed py-14 text-center">
          <FileSignature className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium">
            Aucun procès-verbal pour cette classe et ce trimestre.
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
            Générez le procès-verbal à partir des bulletins du trimestre : la décision de
            chaque élève (passage, redoublement, exclusion) est pré-calculée, vous pourrez
            l&apos;ajuster avant de valider.
          </p>
          <Button className="mt-4" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <FileSignature className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            Générer le procès-verbal
          </Button>
        </div>
      )}

      {/* Dialog de confirmation perte de modifications */}
      <Dialog open={pendingFilter !== null} onOpenChange={() => setPendingFilter(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Modifications non enregistrées</DialogTitle>
            <DialogDescription>
              Vous avez des décisions modifiées non enregistrées. Changer de filtre perdra ces modifications.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPendingFilter(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmFilterChange}>
              Abandonner les modifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CouncilSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
      <div className="rounded-lg border">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b p-4 last:border-0">
            <div className="grid grid-cols-7 gap-4">
              {Array.from({ length: 7 }).map((_, j) => (
                <Skeleton key={j} className="h-4" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
