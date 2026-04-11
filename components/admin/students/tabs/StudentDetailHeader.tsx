"use client"

import { RefObject } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Camera,
  Clock,
  Pencil,
  Printer,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getUploadUrl } from "@/lib/utils"

interface StudentDetailHeaderProps {
  student: {
    first_name: string
    last_name: string
    genre?: string | null
    enrollment_number?: string | null
    photo_url?: string | null
  }
  fullData?: {
    current_class_name?: string | null
    current_academic_year?: string | null
    current_enrollment_status?: string | null
    current_enrollment_id?: number | null
  } | null
  onEdit: () => void
  onDelete: () => void
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  uploading: boolean
  fileInputRef: RefObject<HTMLInputElement | null>
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  valide: {
    label: "Valid\u00e9",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  en_validation: {
    label: "En validation",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  prospect: {
    label: "Prospect",
    className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  },
  rejete: {
    label: "Rejet\u00e9",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  },
  annule: {
    label: "Annul\u00e9",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  },
}

export function StudentDetailHeader({
  student,
  fullData,
  onEdit,
  onDelete,
  onPhotoUpload,
  uploading,
  fileInputRef,
}: StudentDetailHeaderProps) {
  const initials =
    `${student.first_name?.[0] ?? ""}${student.last_name?.[0] ?? ""}`.toUpperCase()
  const fullName = `${student.last_name} ${student.first_name}`

  const enrollmentStatus = fullData?.current_enrollment_status ?? null
  const statusCfg = enrollmentStatus
    ? STATUS_CONFIG[enrollmentStatus] ?? { label: enrollmentStatus, className: "" }
    : null

  const needsValidation =
    enrollmentStatus && enrollmentStatus !== "valide" && enrollmentStatus !== "rejete" && enrollmentStatus !== "annule"

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/admin/students"
            aria-label="Retour \u00e0 la liste des \u00e9l\u00e8ves"
            className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          {/* Avatar with photo upload */}
          <div
            className="relative group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Avatar className="h-20 w-20 text-2xl">
              {student.photo_url ? (
                <AvatarImage src={getUploadUrl(student.photo_url) ?? ""} alt={fullName} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <Clock className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPhotoUpload}
            />
          </div>

          {/* Name + subtitle + badges */}
          <div className="min-w-0">
            <h1 className="font-serif text-2xl tracking-tight">{fullName}</h1>

            {/* Subtitle: Classe — Annee */}
            {(fullData?.current_class_name || fullData?.current_academic_year) && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {fullData.current_class_name && (
                  <>Classe {fullData.current_class_name}</>
                )}
                {fullData.current_class_name && fullData.current_academic_year && " \u2014 "}
                {fullData.current_academic_year}
              </p>
            )}

            {/* Badges row */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {student.enrollment_number && (
                <Badge variant="outline" className="font-mono text-[10px]">
                  {student.enrollment_number}
                </Badge>
              )}
              {fullData?.current_academic_year && (
                <Badge variant="secondary" className="text-[10px]">
                  {fullData.current_academic_year}
                </Badge>
              )}
              {statusCfg && (
                <Badge variant="outline" className={`text-[10px] border-0 ${statusCfg.className}`}>
                  {statusCfg.label}
                </Badge>
              )}
              {student.genre && (
                <Badge variant="outline" className="text-[10px]">
                  {student.genre === "M" ? "Masculin" : "F\u00e9minin"}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Imprimer
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Modifier
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Enrollment validation banner */}
      {needsValidation && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            L&apos;inscription de cet \u00e9l\u00e8ve n&apos;est pas encore valid\u00e9e.
          </p>
          {fullData?.current_enrollment_id && (
            <Link
              href={`/admin/enrollments/${fullData.current_enrollment_id}`}
              className="ml-auto shrink-0"
            >
              <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950">
                Valider l&apos;inscription
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
