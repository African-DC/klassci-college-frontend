"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Download, Loader2, Users } from "lucide-react"
import type { Route } from "next"
import type { Student } from "@/lib/contracts/student"
import { useStudents } from "@/lib/hooks/useStudents"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataError } from "@/components/shared/DataError"
import { MobileEntityListItem } from "@/components/shared/MobileEntityListItem"
import { SectionCard, EmptyState, InitialsAvatar } from "@/components/admin/students/tabs/_primitives"
import { getUploadUrl } from "@/lib/utils"
import { PdfPreviewButton } from "@/components/shared/PdfPreviewButton"
import { fetchClassRoster, fileSafeName, triggerBlobDownload } from "./class-downloads"

interface StudentsTabProps {
  classId: number
  className: string
}

function fullName(s: Student): string {
  return `${s.last_name} ${s.first_name}`.trim()
}

function GenreMark({ genre }: { genre?: string | null }) {
  if (genre !== "M" && genre !== "F") return null
  return (
    <span
      className="ml-1.5 text-sm text-muted-foreground"
      aria-label={genre === "F" ? "Fille" : "Garçon"}
      title={genre === "F" ? "Fille" : "Garçon"}
    >
      {genre === "F" ? "♀" : "♂"}
    </span>
  )
}

function StudentAvatar({ student, size = "md" }: { student: Student; size?: "sm" | "md" }) {
  const src = getUploadUrl(student.photo_url)
  const dim = size === "sm" ? "h-9 w-9" : "h-10 w-10"
  return (
    <Avatar className={dim}>
      {src ? <AvatarImage src={src} alt={fullName(student)} /> : null}
      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
        {`${student.last_name?.[0] ?? ""}${student.first_name?.[0] ?? ""}`.toUpperCase() || "?"}
      </AvatarFallback>
    </Avatar>
  )
}

export function StudentsTab({ classId, className }: StudentsTabProps) {
  const { data, isLoading, isError, error, refetch } = useStudents({
    class_id: classId,
    page: 1,
    size: 100,
  })
  const [downloading, setDownloading] = useState(false)

  const students = data?.items ?? []

  async function handleRoster() {
    setDownloading(true)
    try {
      const blob = await fetchClassRoster(classId)
      triggerBlobDownload(blob, `liste-classe-${fileSafeName(className)}.pdf`)
    } catch (err) {
      toast.error("Téléchargement impossible", {
        description: err instanceof Error ? err.message : "Erreur lors de la génération du PDF",
      })
    } finally {
      setDownloading(false)
    }
  }

  const downloadBtn = (
    <div className="flex items-center gap-2">
      <PdfPreviewButton
        fetchBlob={() => fetchClassRoster(classId)}
        label={`la liste de la classe ${className}`}
        disabled={students.length === 0}
        size="sm"
        className="h-11 sm:h-9"
      />
      <Button
        onClick={handleRoster}
        disabled={downloading || students.length === 0}
        size="sm"
        aria-label={`Télécharger la liste de la classe ${className}`}
        className="h-11 bg-accent text-accent-foreground shadow-sm hover:bg-accent/90 sm:h-9"
      >
        {downloading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="mr-2 h-4 w-4" aria-hidden="true" />
        )}
        Liste (PDF)
      </Button>
    </div>
  )

  return (
    <SectionCard
      icon={<Users className="h-4 w-4" />}
      title="Élèves inscrits"
      description={
        isLoading ? undefined : `${students.length} élève${students.length > 1 ? "s" : ""} dans cette classe`
      }
      action={downloadBtn}
    >
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <DataError message={error?.message ?? "Erreur de chargement"} error={error} onRetry={refetch} />
      ) : students.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="Aucun élève inscrit"
          message="Aucun élève n'est inscrit dans cette classe pour l'année en cours."
        />
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Élève</TableHead>
                  <TableHead>Matricule</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <a
                        href={`/admin/students/${s.id}`}
                        className="flex items-center gap-3 hover:underline"
                      >
                        <StudentAvatar student={s} size="sm" />
                        <span className="font-medium">
                          {fullName(s)}
                          <GenreMark genre={s.genre} />
                        </span>
                      </a>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {s.enrollment_number ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile */}
          <div className="space-y-2 md:hidden">
            {students.map((s) => (
              <MobileEntityListItem
                key={s.id}
                href={`/admin/students/${s.id}` as Route}
                avatar={
                  getUploadUrl(s.photo_url) ? (
                    <StudentAvatar student={s} size="sm" />
                  ) : (
                    <InitialsAvatar first={s.first_name} last={s.last_name} size="sm" />
                  )
                }
                primary={
                  <>
                    {fullName(s)}
                    <GenreMark genre={s.genre} />
                  </>
                }
                secondary={s.enrollment_number ? `Matricule ${s.enrollment_number}` : "Sans matricule"}
              />
            ))}
          </div>
        </>
      )}
    </SectionCard>
  )
}
