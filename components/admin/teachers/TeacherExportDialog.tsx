"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, FileSpreadsheet, FileText, Loader2, Search, Settings2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { PdfPreviewButton } from "@/components/shared/PdfPreviewButton"
import { triggerBlobDownload } from "@/components/admin/classes/detail/class-downloads"
import {
  teacherExportsApi, type TeacherExportColumn, type TeacherExportFormat,
  type TeacherExportGroup, type TeacherExportOrientation,
  type TeacherExportOptionsResponse, type TeacherExportPayload,
} from "@/lib/api/teacher-exports"

type Choice = { id: number; name: string }
const contractLabels = [
  ["permanent", "Permanent"], ["vacataire", "Vacataire"], ["fonctionnaire", "Fonctionnaire"],
] as const

function MultiPicker({
  label, choices, selected, onChange, disabled = false, hint,
}: {
  label: string
  choices: Choice[]
  selected: number[]
  onChange: (ids: number[]) => void
  disabled?: boolean
  hint?: string
}) {
  const [query, setQuery] = useState("")
  const matching = useMemo(() => choices.filter((item) =>
    item.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      .includes(query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())
  ), [choices, query])
  const toggle = (id: number, checked: boolean) =>
    onChange(checked ? [...new Set([...selected, id])] : selected.filter((x) => x !== id))

  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {selected.length ? selected.length + " choisi(s)" : "Tous"}
        </span>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search" placeholder={"Rechercher " + label.toLowerCase()}
          value={query} onChange={(event) => setQuery(event.target.value)}
          className="pl-9 h-10" disabled={disabled}
        />
      </div>
      <div className="max-h-36 overflow-y-auto rounded-lg border border-border/60 bg-muted/20 p-1 space-y-0.5">
        {matching.length === 0 &&
          <p className="p-3 text-xs text-muted-foreground">Aucun résultat</p>}
        {matching.map((item) => (
          <label key={item.id} className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-primary/5 cursor-pointer">
            <Checkbox
              checked={selected.includes(item.id)}
              onCheckedChange={(checked) => toggle(item.id, checked === true)}
              disabled={disabled}
              aria-label={item.name}
            />
            <span className="text-sm leading-snug">{item.name}</span>
          </label>
        ))}
      </div>
      {selected.length > 0 && (
        <button type="button" className="text-xs text-primary hover:underline" onClick={() => onChange([])}>
          Effacer cette sélection
        </button>
      )}
    </div>
  )
}

const initial: TeacherExportPayload = {
  academic_year_id: null,
  search: "",
  class_ids: [], level_ids: [], series_ids: [], subject_ids: [],
  teacher_ids: [], contract_types: [],
  columns: ["name", "subject", "class", "level"],
  group_by: "subject", orientation: "auto",
  include_unassigned: true, include_catalog: true,
}

const formats: { format: TeacherExportFormat; label: string; ext: string }[] = [
  { format: "pdf", label: "PDF", ext: "pdf" },
  { format: "word", label: "Word", ext: "docx" },
  { format: "excel", label: "Excel", ext: "xlsx" },
]

export function TeacherExportDialog() {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<TeacherExportOptionsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState<TeacherExportFormat | null>(null)
  const [selection, setSelection] = useState<TeacherExportPayload>(initial)

  useEffect(() => {
    if (!open) return
    let active = true
    setLoading(true)
    teacherExportsApi.options()
      .then((result) => {
        if (!active) return
        setOptions(result)
        setSelection((previous) => ({
          ...previous,
          academic_year_id: previous.academic_year_id ?? result.years.find((year) => year.is_current)?.id ?? null,
        }))
      })
      .catch((error: unknown) => {
        if (active) toast.error(error instanceof Error ? error.message : "Impossible de charger les options.")
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [open])

  function assign<K extends keyof TeacherExportPayload>(key: K, value: TeacherExportPayload[K]) {
    setSelection((previous) => ({ ...previous, [key]: value }))
  }

  const classes = useMemo(() => (options?.classes ?? []).filter((klass) =>
    (!selection.level_ids.length || selection.level_ids.includes(klass.level_id)) &&
    (!selection.series_ids.length || (klass.series_id != null && selection.series_ids.includes(klass.series_id)))
  ), [options?.classes, selection.level_ids, selection.series_ids])

  const series = useMemo(() => (options?.series ?? []).filter((item) =>
    !selection.level_ids.length || selection.level_ids.includes(item.level_id)
  ), [options?.series, selection.level_ids])

  const subjects = useMemo(() => (options?.subjects ?? []).filter((item) =>
    (!selection.level_ids.length || item.level_id === null || selection.level_ids.includes(item.level_id)) &&
    (!selection.series_ids.length || item.series_id === null || selection.series_ids.includes(item.series_id))
  ), [options?.subjects, selection.level_ids, selection.series_ids])

  // Une sélection de niveau/série incompatible n'est pas envoyée silencieusement.
  function chooseLevels(ids: number[]) {
    setSelection((prev) => ({
      ...prev, level_ids: ids,
      series_ids: prev.series_ids.filter((id) => options?.series.some((s) => s.id === id && (!ids.length || ids.includes(s.level_id)))),
      class_ids: prev.class_ids.filter((id) => options?.classes.some((c) => c.id === id && (!ids.length || ids.includes(c.level_id)))),
      subject_ids: prev.subject_ids.filter((id) => options?.subjects.some((s) => s.id === id && (!ids.length || s.level_id == null || ids.includes(s.level_id)))),
    }))
  }

  function chooseSeries(ids: number[]) {
    setSelection((prev) => ({
      ...prev, series_ids: ids,
      class_ids: prev.class_ids.filter((id) => options?.classes.some((c) => c.id === id && (!ids.length || (c.series_id != null && ids.includes(c.series_id))))),
      subject_ids: prev.subject_ids.filter((id) => options?.subjects.some((s) => s.id === id && (!ids.length || s.series_id == null || ids.includes(s.series_id)))),
    }))
  }

  function validate(): boolean {
    if (!selection.columns.length) {
      toast.error("Choisissez au moins une colonne.")
      return false
    }
    const estimatedWidths: Record<TeacherExportColumn, number> = {
      name: 58, speciality: 42, subject: 44, class: 31, level: 27, series: 20,
      contract: 25, gender: 14, phone: 35, email: 48, source: 40, cnps: 35, authorization: 42,
    }
    const mm = selection.columns.reduce((sum, col) => sum + estimatedWidths[col], 0)
    if (mm > 265 || (mm > 180 && selection.orientation === "portrait")) {
      toast.error("Trop de colonnes pour cette orientation A4. Réduisez les colonnes ou choisissez Paysage.")
      return false
    }
    return true
  }

  async function generate(format: TeacherExportFormat): Promise<Blob> {
    if (!validate()) throw new Error("Corrigez la composition du document avant de continuer.")
    setBusy(format)
    try {
      return await teacherExportsApi.generate(format, selection)
    } finally {
      setBusy(null)
    }
  }

  async function download(format: TeacherExportFormat, ext: string) {
    if (!validate()) return
    try {
      const file = await generate(format)
      triggerBlobDownload(file, "liste-enseignants." + ext)
    } catch (error) {
      toast.error("Export impossible", {
        description: error instanceof Error ? error.message : "Vérifiez les filtres et réessayez.",
      })
    }
  }

  const selectedCount = selection.class_ids.length + selection.level_ids.length
    + selection.series_ids.length + selection.subject_ids.length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="h-10 gap-2 border-primary/20">
          <Settings2 className="h-4 w-4" /> Exporter les enseignants
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="border-b bg-muted/20 p-5 sm:p-6">
          <DialogTitle className="text-xl">Composer la liste des enseignants</DialogTitle>
          <DialogDescription>
            Même sélection pour l&apos;aperçu PDF, le document Word modifiable et Excel.
            Identité officielle, logo et couleurs depuis les paramètres de l&apos;établissement.
          </DialogDescription>
        </DialogHeader>

        {loading || !options ? (
          <div className="flex items-center justify-center min-h-52 gap-3 p-6 text-sm text-muted-foreground">
            {loading && <Loader2 className="h-5 w-5 animate-spin" />}
            {loading ? "Chargement des données de l’établissement…" : "Options indisponibles, fermez et réessayez."}
          </div>
        ) : (
          <div className="p-5 sm:p-6 space-y-6">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-primary">1. Définir le périmètre</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Année scolaire</label>
                  <Select
                    value={selection.academic_year_id == null ? "current" : String(selection.academic_year_id)}
                    onValueChange={(value) => assign("academic_year_id", value === "current" ? null : Number(value))}
                  >
                    <SelectTrigger className="h-11"><SelectValue placeholder="Année scolaire" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Année courante</SelectItem>
                      {options.years.map((year) => (
                        <SelectItem key={year.id} value={String(year.id)}>
                          {year.name}{year.is_current ? " (courante)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="teacher-export-search" className="text-sm font-medium">Recherche par nom ou spécialité</label>
                  <Input id="teacher-export-search" className="h-11" value={selection.search}
                    onChange={(event) => assign("search", event.target.value)} placeholder="Filtrer les enseignants…" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <MultiPicker label="Niveaux" choices={options.levels} selected={selection.level_ids} onChange={chooseLevels} />
                <MultiPicker label="Séries (lycée)" choices={series} selected={selection.series_ids} onChange={chooseSeries}
                  hint="Sans sélection : toutes les séries." />
                <MultiPicker label="Classes" choices={classes} selected={selection.class_ids}
                  onChange={(ids) => assign("class_ids", ids)} />
                <MultiPicker label="Matières" choices={subjects} selected={selection.subject_ids}
                  onChange={(ids) => assign("subject_ids", ids)} hint="Des matières homonymes restent distinctes par leur identifiant." />
              </div>
              <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border px-3 py-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={selection.include_catalog}
                    onCheckedChange={(checked) => assign("include_catalog", checked === true)} />
                  Inclure les affectations du référentiel
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={selection.include_unassigned}
                    onCheckedChange={(checked) => assign("include_unassigned", checked === true)} />
                  Inclure les enseignants sans affectation
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Plusieurs choix dans un critère s&apos;additionnent ; classes, niveaux, séries et matières se croisent.
                Sans filtre pédagogique : répertoire global. Les matières du référentiel ne sont pas assimilées à des classes réellement programmées.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-primary">2. Composer le document</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="text-sm font-medium">Classer les enseignants par</span>
                  <Select value={selection.group_by} onValueChange={(value) => assign("group_by", value as TeacherExportGroup)}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(options.groups).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <span className="text-sm font-medium">Orientation des documents</span>
                  <Select value={selection.orientation}
                    onValueChange={(value) => assign("orientation", value as TeacherExportOrientation)}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Automatique (portrait si possible)</SelectItem>
                      <SelectItem value="portrait">Portrait A4</SelectItem>
                      <SelectItem value="landscape">Paysage A4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Colonnes à afficher · {selection.columns.length} sélectionnée(s)</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(options.columns).map(([key, label]) => {
                    const column = key as TeacherExportColumn
                    return (
                      <label key={key}
                        className={"flex items-center gap-2 rounded-lg border p-2.5 text-xs cursor-pointer " +
                          (selection.columns.includes(column) ? "border-primary/40 bg-primary/5" : "border-border")}>
                        <Checkbox checked={selection.columns.includes(column)}
                          onCheckedChange={(checked) => assign("columns", checked === true
                            ? [...selection.columns, column] : selection.columns.filter((x) => x !== column))} />
                        <span>{label}</span>
                      </label>
                    )
                  })}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  La rubrique remplace une colonne répétitive. Une liste contenant seulement le nom pourra être imprimée en portrait.
                </p>
              </div>
            </section>
          </div>
        )}
        <DialogFooter className="sticky bottom-0 flex-col gap-2 border-t bg-background p-4 sm:flex-row sm:justify-between">
          <span className="text-xs text-muted-foreground self-center">
            {selectedCount ? selectedCount + " filtre(s) pédagogique(s)" : "Tous les enseignants"}
          </span>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <PdfPreviewButton
              label="de la liste des enseignants"
              fetchBlob={() => generate("preview-pdf")}
              disabled={!options || loading || busy !== null}
            />
            {formats.map(({ format, ext, label }) => (
              <Button type="button" key={format} onClick={() => void download(format, ext)}
                disabled={!options || loading || busy !== null} className="gap-2"
                variant={format === "pdf" ? "default" : "outline"}>
                {busy === format ? <Loader2 className="h-4 w-4 animate-spin" />
                  : format === "excel" ? <FileSpreadsheet className="h-4 w-4" />
                  : format === "word" ? <FileText className="h-4 w-4" />
                  : <Download className="h-4 w-4" />}
                {label}
              </Button>
            ))}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
