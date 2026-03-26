"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CouncilDeliberationTable } from "./CouncilDeliberationTable"
import { useCouncilMinutes } from "@/lib/hooks/useCouncil"

// TODO: remplacer par useClasses() après merge de PR #42 (feature/36-admin-crud-pages)
const DEMO_CLASSES = [
  { id: 1, name: "6ème A" },
  { id: 2, name: "6ème B" },
  { id: 3, name: "5ème A" },
  { id: 4, name: "5ème B" },
  { id: 5, name: "4ème A" },
  { id: 6, name: "3ème A" },
]

export function CouncilPageClient() {
  const [classId, setClassId] = useState<number | undefined>(undefined)
  const [trimester, setTrimester] = useState<string | undefined>(undefined)

  const filtersReady = !!classId && !!trimester
  const { data: minutes, isLoading, isError } = useCouncilMinutes(classId, trimester)

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="font-serif text-2xl tracking-tight">Conseil de classe</h1>
        <p className="text-sm text-muted-foreground">
          Procès-verbaux de délibération — décisions de passage par élève
        </p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
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
          onValueChange={(v) => setTrimester(v)}
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
          <Badge variant={minutes.status === "valide" ? "default" : "secondary"}>
            {minutes.status === "valide" ? "Validé" : "Brouillon"}
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
      ) : isError ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Impossible de charger le procès-verbal. Vérifiez que les bulletins ont été générés.
        </div>
      ) : minutes ? (
        <CouncilDeliberationTable minutes={minutes} />
      ) : (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Aucun procès-verbal trouvé. Générez d&apos;abord les bulletins depuis la page Bulletins.
        </div>
      )}
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
