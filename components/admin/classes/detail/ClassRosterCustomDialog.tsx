"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Download, FileSpreadsheet, FileText, Loader2, SlidersHorizontal } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PdfPreviewButton } from "@/components/shared/PdfPreviewButton"
import { fetchClassRosterData, rosterFilterQuery } from "@/lib/api/class-roster"
import type { AssignmentStatus, ClassRosterFilters } from "@/lib/contracts/class-roster"
import { exportToExcel } from "@/lib/export/excel"
import { useSettings } from "@/lib/hooks/useSettings"
import { buildClassRosterExcel } from "./class-roster-excel"
import { fetchClassRoster, fetchClassRosterWord, fileSafeName, triggerBlobDownload } from "./class-downloads"

const statuses: { value: AssignmentStatus; label: string }[] = [
  { value: "affecte", label: "Affectés" }, { value: "reaffecte", label: "Réaffectés" },
  { value: "non_affecte", label: "Non affectés" },
]
const booleanValue = (v?: boolean) => v === undefined ? "all" : String(v)
const asBoolean = (v: string) => v === "all" ? undefined : v === "true"
function asAge(v: string) {
  if (!v.trim()) return undefined
  const n = Number(v)
  return Number.isInteger(n) ? Math.min(120, Math.max(0, n)) : undefined
}
function labelForFilters(f: ClassRosterFilters): string {
  const parts = []
  if (f.genre) parts.push(f.genre === "M" ? "Garçons" : "Filles")
  if (f.age_min !== undefined) parts.push(`Âge min. ${f.age_min}`)
  if (f.age_max !== undefined) parts.push(`Âge max. ${f.age_max}`)
  if (f.nationalities?.length) parts.push(`Nationalités : ${f.nationalities.join(", ")}`)
  if (f.assignment_statuses?.length) parts.push(`Affectation : ${f.assignment_statuses.map(s => statuses.find(o => o.value === s)?.label ?? s).join(", ")}`)
  if (f.is_repeater !== undefined) parts.push(f.is_repeater ? "Redoublants" : "Non-redoublants")
  if (f.is_new_student !== undefined) parts.push(f.is_new_student ? "Nouveaux" : "Anciens")
  return parts.join(" · ")
}

interface Props { classId: number; className: string; buttonClassName?: string }

/** Modal responsive intégré aux zones d'export existantes, sans modifier leur layout. */
export function ClassRosterCustomDialog({ classId, className, buttonClassName }: Props) {
  const [open, setOpen] = useState(false)
  const [filters, setFilters] = useState<ClassRosterFilters>({})
  const [search, setSearch] = useState("")
  const [busy, setBusy] = useState(false)
  const { data: settings } = useSettings()
  const allQuery = useQuery({ queryKey: ["class-roster", classId, ""],
    queryFn: () => fetchClassRosterData(classId), enabled: open, staleTime: 30_000 })
  const query = rosterFilterQuery(filters)
  const selectedQuery = useQuery({ queryKey: ["class-roster", classId, query],
    queryFn: () => fetchClassRosterData(classId, filters), enabled: open, staleTime: 30_000 })
  const nationalities = useMemo(() => [...new Set(
    allQuery.data?.students.map(s => s.nationality?.trim()).filter((n): n is string => Boolean(n)) ?? [],
  )].sort((a, b) => a.localeCompare(b, "fr")), [allQuery.data])
  const norm = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr")
  const visibleNationalities = nationalities.filter(n => norm(n).includes(norm(search)))
  const validAge = filters.age_min === undefined || filters.age_max === undefined || filters.age_min <= filters.age_max
  const canExport = validAge && !busy && !selectedQuery.isFetching && (selectedQuery.data?.total ?? 0) > 0

  function setFilter<K extends keyof ClassRosterFilters>(key: K, value: ClassRosterFilters[K]) {
    setFilters(old => ({ ...old, [key]: value }))
  }
  function toggle(key: "nationalities" | "assignment_statuses", value: string, checked: boolean) {
    setFilters(old => {
      const current = (old[key] ?? []) as string[]
      return { ...old, [key]: checked ? [...current, value] : current.filter(x => x !== value) }
    })
  }
  async function download(format: "pdf" | "word" | "excel") {
    if (!canExport) return
    setBusy(true)
    try {
      const filename = `liste-classe-${fileSafeName(className)}-personnalisee`
      if (format === "pdf") triggerBlobDownload(await fetchClassRoster(classId, filters), `${filename}.pdf`)
      if (format === "word") triggerBlobDownload(await fetchClassRosterWord(classId, filters), `${filename}.docx`)
      if (format === "excel") {
        const roster = await fetchClassRosterData(classId, filters)
        await exportToExcel(buildClassRosterExcel(roster, settings, labelForFilters(filters) || `Classe ${className}`), filename)
      }
      toast.success("Liste personnalisée téléchargée")
    } catch (error) {
      toast.error("Téléchargement impossible", { description: error instanceof Error ? error.message : "Réessayez." })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className={buttonClassName ?? "h-11 sm:h-9"}>
          <SlidersHorizontal className="mr-2 h-4 w-4" /> Liste personnalisée
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Liste de classe personnalisée</DialogTitle>
          <DialogDescription>{className} · Combinez les critères. Uniquement les inscriptions validées de l'année courante.</DialogDescription>
        </DialogHeader>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <div className="min-w-0 space-y-1.5">
            <Label>Sexe</Label>
            <Select value={filters.genre ?? "all"} onValueChange={v => setFilter("genre", v === "all" ? undefined : v as "M" | "F")}>
              <SelectTrigger className="h-11 sm:h-9" aria-label="Filtrer par sexe"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="M">Garçons uniquement</SelectItem>
                <SelectItem value="F">Filles uniquement</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label>Âge au jour de l'export</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" min={0} max={120} placeholder="Min." aria-label="Âge minimum" className="h-11 sm:h-9"
                value={filters.age_min ?? ""} onChange={e => setFilter("age_min", asAge(e.target.value))} />
              <Input type="number" min={0} max={120} placeholder="Max." aria-label="Âge maximum" className="h-11 sm:h-9"
                value={filters.age_max ?? ""} onChange={e => setFilter("age_max", asAge(e.target.value))} />
            </div>
            {!validAge && <p className="text-xs text-destructive">Minimum supérieur au maximum.</p>}
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label>Redoublement</Label>
            <Select value={booleanValue(filters.is_repeater)} onValueChange={v => setFilter("is_repeater", asBoolean(v))}>
              <SelectTrigger aria-label="Filtrer le redoublement" className="h-11 sm:h-9"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Tous</SelectItem><SelectItem value="true">Redoublants</SelectItem><SelectItem value="false">Non-redoublants</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label>Profil d'inscription</Label>
            <Select value={booleanValue(filters.is_new_student)} onValueChange={v => setFilter("is_new_student", asBoolean(v))}>
              <SelectTrigger aria-label="Filtrer le profil" className="h-11 sm:h-9"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Tous</SelectItem><SelectItem value="true">Nouveaux élèves</SelectItem><SelectItem value="false">Anciens élèves</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-2">
            <Label>Nationalités (choix multiples)</Label>
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" aria-label="Rechercher une nationalité" className="h-11 sm:h-9" />
            <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border p-2">
              {visibleNationalities.length ? visibleNationalities.map(n => (
                <label key={n} className="flex min-h-9 cursor-pointer items-center gap-2 rounded px-1 text-sm hover:bg-muted">
                  <Checkbox checked={filters.nationalities?.includes(n) ?? false} onCheckedChange={c => toggle("nationalities", n, c === true)} />
                  <span className="min-w-0 break-words">{n}</span>
                </label>
              )) : <p className="text-xs text-muted-foreground">{allQuery.isLoading ? "Chargement…" : "Aucune nationalité trouvée."}</p>}
            </div>
            {!!filters.nationalities?.length && <p className="text-xs text-muted-foreground">{filters.nationalities.length} sélectionnée(s)</p>}
          </div>
          <div className="min-w-0 space-y-2">
            <Label>Affectation (choix multiples)</Label>
            <div className="space-y-1 rounded-md border p-2">
              {statuses.map(({ value, label }) => (
                <label key={value} className="flex min-h-9 cursor-pointer items-center gap-2 rounded px-1 text-sm hover:bg-muted">
                  <Checkbox checked={filters.assignment_statuses?.includes(value) ?? false} onCheckedChange={c => toggle("assignment_statuses", value, c === true)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Pour tous les affectés, cochez « Affectés » et « Réaffectés ».</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <p className="text-sm font-medium" role="status" aria-live="polite">
            {selectedQuery.isError ? "Erreur de chargement" : selectedQuery.isFetching ? "Calcul de l'effectif…" :
              `${selectedQuery.data?.total ?? 0} élève(s) sélectionné(s)`}
          </p>
          <Button type="button" variant="ghost" className="h-11 sm:h-9" onClick={() => { setFilters({}); setSearch("") }}>Effacer les filtres</Button>
        </div>
        {selectedQuery.isError && <p className="text-xs text-destructive">{selectedQuery.error.message}</p>}
        {selectedQuery.data?.total === 0 && <p className="text-xs text-muted-foreground">Aucun élève correspondant. Modifiez votre sélection.</p>}
        <DialogFooter className="gap-2 sm:space-x-0">
          <PdfPreviewButton fetchBlob={() => fetchClassRoster(classId, filters)} label="de la liste personnalisée"
            disabled={!canExport} className="h-11 w-full sm:h-10 sm:w-auto" />
          <Button type="button" variant="outline" className="h-11 w-full sm:h-10 sm:w-auto" disabled={!canExport} onClick={() => void download("word")}><FileText className="mr-2 h-4 w-4" />Word</Button>
          <Button type="button" variant="outline" className="h-11 w-full sm:h-10 sm:w-auto" disabled={!canExport} onClick={() => void download("excel")}><FileSpreadsheet className="mr-2 h-4 w-4" />Excel</Button>
          <Button type="button" className="h-11 w-full bg-accent text-accent-foreground hover:bg-accent/90 sm:h-10 sm:w-auto" disabled={!canExport}
            onClick={() => void download("pdf")}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
