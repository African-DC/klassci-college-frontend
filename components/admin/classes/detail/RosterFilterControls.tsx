"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { RosterFilters } from "./roster-filters"

interface Props { value: RosterFilters; onChange: (value: RosterFilters) => void }

/** Groupe compact, volontairement indépendant du layout des cartes existantes. */
export function RosterFilterControls({ value, onChange }: Props) {
  const [nationalities, setNationalities] = useState((value.nationalities ?? []).join(", "))
  const [open, setOpen] = useState(false)
  const change = (part: Partial<RosterFilters>) => onChange({ ...value, ...part })
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? "Masquer les filtres" : "Filtrer la liste / les exports"}
        </Button>
        {Object.values(value).some(v => Array.isArray(v) ? v.length > 0 : v !== undefined) && (
          <Button type="button" variant="ghost" size="sm" onClick={() => { setNationalities(""); onChange({}) }}>Réinitialiser</Button>
        )}
      </div>
      {open && (
        <div className="grid min-w-0 grid-cols-1 gap-3 rounded-lg border border-border/60 p-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1 text-xs font-medium">Sexe
            <select aria-label="Sexe" value={value.genre ?? ""} onChange={e => change({ genre: e.target.value || undefined })} className="h-10 w-full rounded-md border bg-background px-2 text-sm">
              <option value="">Tous</option><option value="M">Garçons</option><option value="F">Filles</option>
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium">Âge minimum
            <Input aria-label="Âge minimum" type="number" min={0} max={120} value={value.age_min ?? ""} onChange={e => change({ age_min: e.target.value === "" ? undefined : Number(e.target.value) })} />
          </label>
          <label className="space-y-1 text-xs font-medium">Âge maximum
            <Input aria-label="Âge maximum" type="number" min={0} max={120} value={value.age_max ?? ""} onChange={e => change({ age_max: e.target.value === "" ? undefined : Number(e.target.value) })} />
          </label>
          <label className="space-y-1 text-xs font-medium">Nationalités (séparées par des virgules)
            <Input aria-label="Nationalités" placeholder="Ivoirienne, Malienne…" value={nationalities}
              onChange={e => { setNationalities(e.target.value); change({ nationalities: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }) }} />
          </label>
          <label className="space-y-1 text-xs font-medium">Affectation
            <select aria-label="Affectation" value={value.assignments?.join(",") ?? ""} onChange={e => change({ assignments: e.target.value ? e.target.value.split(",") : [] })} className="h-10 w-full rounded-md border bg-background px-2 text-sm">
              <option value="">Tous</option><option value="affecte">Affectés</option><option value="reaffecte">Réaffectés</option><option value="affecte,reaffecte">Affectés et réaffectés</option><option value="non_affecte">Non affectés</option><option value="inconnu">Non renseigné</option>
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium">Redoublement
            <select aria-label="Redoublement" value={value.repeaters === undefined ? "" : String(value.repeaters)}
              onChange={e => change({ repeaters: e.target.value === "" ? undefined : e.target.value === "true" })} className="h-10 w-full rounded-md border bg-background px-2 text-sm">
              <option value="">Tous</option><option value="true">Redoublants</option><option value="false">Non-redoublants</option>
            </select>
          </label>
        </div>
      )}
    </div>
  )
}
