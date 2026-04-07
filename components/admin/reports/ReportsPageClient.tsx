"use client"

import { useState } from "react"
import { FileText } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { BulletinList } from "./BulletinList"
import { BulletinGenerateButton } from "./BulletinGenerateButton"
import { useClasses } from "@/lib/hooks/useClasses"
import { useAcademicYears } from "@/lib/hooks/useAcademicYears"
import type { BulletinListParams } from "@/lib/contracts/bulletin"

export function ReportsPageClient() {
  const [classId, setClassId] = useState<number | undefined>(undefined)
  const [trimester, setTrimester] = useState<number | undefined>(undefined)
  const [academicYearId, setAcademicYearId] = useState<number | undefined>(undefined)
  const [isPublished, setIsPublished] = useState<boolean | undefined>(undefined)
  const [page, setPage] = useState(1)

  const { data: classesData, isLoading: classesLoading } = useClasses()
  const classes = classesData?.items
  const { data: academicYearsData, isLoading: yearsLoading } = useAcademicYears()
  const academicYears = academicYearsData?.items

  const activeYearId = academicYearId ?? academicYears?.[0]?.id

  const params: BulletinListParams = {
    ...(classId && { class_id: classId }),
    ...(trimester && { trimester }),
    ...(activeYearId && { academic_year_id: activeYearId }),
    ...(isPublished !== undefined && { is_published: isPublished }),
    page,
  }

  const filtersReady = !!classId && !!trimester

  function handlePageChange(newPage: number) {
    setPage(newPage)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl tracking-tight">Bulletins scolaires</h1>
            <p className="text-sm text-muted-foreground">
              Génération et consultation des bulletins par classe et trimestre
            </p>
          </div>
        </div>
        <BulletinGenerateButton
          classId={classId}
          trimester={trimester}
          academicYearId={activeYearId}
        />
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        {yearsLoading ? (
          <Skeleton className="h-10 w-40" />
        ) : (
          <Select
            value={activeYearId?.toString() ?? ""}
            onValueChange={(v) => { setAcademicYearId(Number(v)); setPage(1) }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              {academicYears?.map((y) => (
                <SelectItem key={y.id} value={y.id.toString()}>
                  {y.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {classesLoading ? (
          <Skeleton className="h-10 w-40" />
        ) : (
          <Select
            value={classId?.toString() ?? ""}
            onValueChange={(v) => { setClassId(Number(v)); setPage(1) }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Classe" />
            </SelectTrigger>
            <SelectContent>
              {classes?.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={trimester?.toString() ?? ""}
          onValueChange={(v) => { setTrimester(Number(v)); setPage(1) }}
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

        <Select
          value={isPublished === undefined ? "all" : isPublished ? "published" : "draft"}
          onValueChange={(v) => { setIsPublished(v === "all" ? undefined : v === "published"); setPage(1) }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="published">Publié</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste ou message */}
      {filtersReady ? (
        <BulletinList params={params} onPageChange={handlePageChange} />
      ) : (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Sélectionnez une classe et un trimestre pour afficher les bulletins.
          </p>
        </div>
      )}
    </div>
  )
}
