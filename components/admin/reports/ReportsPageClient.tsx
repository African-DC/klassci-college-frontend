"use client"

import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BulletinList } from "./BulletinList"
import { BulletinGenerateButton } from "./BulletinGenerateButton"
import type { BulletinListParams, Trimester, BulletinStatus } from "@/lib/contracts/bulletin"

// Données de démo — sera remplacé par l'API /classes et /academic-years
const DEMO_CLASSES = [
  { id: 1, name: "6ème A" },
  { id: 2, name: "6ème B" },
  { id: 3, name: "5ème A" },
  { id: 4, name: "5ème B" },
  { id: 5, name: "4ème A" },
  { id: 6, name: "3ème A" },
]

const DEMO_ACADEMIC_YEARS = [
  { id: 1, label: "2025-2026" },
  { id: 2, label: "2024-2025" },
]

export function ReportsPageClient() {
  const [classId, setClassId] = useState<number | undefined>(undefined)
  const [trimester, setTrimester] = useState<Trimester | undefined>(undefined)
  const [academicYearId, setAcademicYearId] = useState<number | undefined>(
    DEMO_ACADEMIC_YEARS[0].id,
  )
  const [status, setStatus] = useState<BulletinStatus | undefined>(undefined)

  const params: BulletinListParams = {
    ...(classId && { class_id: classId }),
    ...(trimester && { trimester }),
    ...(academicYearId && { academic_year_id: academicYearId }),
    ...(status && { status }),
  }

  const filtersReady = !!classId && !!trimester

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl tracking-tight">Bulletins scolaires</h1>
          <p className="text-sm text-muted-foreground">
            Génération et consultation des bulletins par classe et trimestre
          </p>
        </div>
        <BulletinGenerateButton
          classId={classId}
          trimester={trimester}
          academicYearId={academicYearId}
        />
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={academicYearId?.toString() ?? ""}
          onValueChange={(v) => setAcademicYearId(Number(v))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Année" />
          </SelectTrigger>
          <SelectContent>
            {DEMO_ACADEMIC_YEARS.map((y) => (
              <SelectItem key={y.id} value={y.id.toString()}>
                {y.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={classId?.toString() ?? ""}
          onValueChange={(v) => setClassId(Number(v))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Classe" />
          </SelectTrigger>
          <SelectContent>
            {DEMO_CLASSES.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={trimester ?? ""}
          onValueChange={(v) => setTrimester(v as Trimester)}
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
          value={status ?? "all"}
          onValueChange={(v) => setStatus(v === "all" ? undefined : (v as BulletinStatus))}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="brouillon">Brouillon</SelectItem>
            <SelectItem value="publie">Publié</SelectItem>
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
