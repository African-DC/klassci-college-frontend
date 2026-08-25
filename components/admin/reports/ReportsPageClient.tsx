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
import { PageHero } from "@/components/shared/PageHero"
import { BulletinList } from "./BulletinList"
import { BulletinGenerateButton } from "./BulletinGenerateButton"
import { ReportsNav } from "./ReportsNav"
import { useClasses } from "@/lib/hooks/useClasses"
import { useCurrentAcademicYearId } from "@/lib/hooks/useCurrentAcademicYear"
import type { BulletinListParams } from "@/lib/contracts/bulletin"

export function ReportsPageClient() {
  const [classId, setClassId] = useState<number | undefined>(undefined)
  const [trimester, setTrimester] = useState<number | undefined>(undefined)
  const [academicYearId, setAcademicYearId] = useState<number | undefined>(undefined)
  const [isPublished, setIsPublished] = useState<boolean | undefined>(undefined)

  const { data: classesData, isLoading: classesLoading } = useClasses()
  const classes = classesData?.items
  const {
    academicYearId: activeYearId,
    years: academicYears,
    isLoading: yearsLoading,
  } = useCurrentAcademicYearId(academicYearId)

  const params: BulletinListParams = {
    ...(classId && { class_id: classId }),
    ...(trimester && { trimester }),
    ...(activeYearId && { academic_year_id: activeYearId }),
    ...(isPublished !== undefined && { is_published: isPublished }),
  }

  const filtersReady = !!classId && !!trimester


  return (
    <div className="space-y-6">
      <PageHero
        icon={FileText}
        title="Bulletins scolaires"
        subtitle="Génération et consultation des bulletins par classe et trimestre"
        actions={
          <BulletinGenerateButton
            classId={classId}
            trimester={trimester}
            academicYearId={activeYearId}
          />
        }
      />

      <ReportsNav current="bulletins" />

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        {yearsLoading ? (
          <Skeleton className="h-10 w-40" />
        ) : (
          <Select
            value={activeYearId?.toString() ?? ""}
            onValueChange={(v) => { setAcademicYearId(Number(v)) }}
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
            onValueChange={(v) => { setClassId(Number(v)) }}
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
          onValueChange={(v) => { setTrimester(Number(v)) }}
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
          onValueChange={(v) => { setIsPublished(v === "all" ? undefined : v === "published") }}
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
        <BulletinList params={params} />
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
