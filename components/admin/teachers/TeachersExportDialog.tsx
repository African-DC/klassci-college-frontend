"use client"
import { useEffect, useState } from "react"
import { Download, Eye, FileText, FileSpreadsheet, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { apiFetch, apiFetchBlob } from "@/lib/api/client"
import { downloadBlob } from "@/lib/utils"

type Choice = { id: number; name: string }
type FilterKey = "classes" | "levels" | "series" | "subjects"
type Catalog = Record<FilterKey, Choice[]> & { years: Choice[] }
type DocType = "pdf" | "docx" | "xlsx"
type View = "directory" | "assignments"
const names: Record<string, string> = {
  name: "Nom et prénoms", speciality: "Spécialité déclarée", subject: "Matière",
  class: "Classe", level: "Niveau", series: "Série", contract: "Contrat",
  phone: "Téléphone", email: "Email", genre: "Genre", source: "Origine de l'affectation",
}
const categories: { key: FilterKey; name: string; param: string }[] = [
  { key: "levels", name: "Niveaux", param: "level_ids" },
  { key: "series", name: "Séries", param: "series_ids" },
  { key: "classes", name: "Classes", param: "class_ids" },
  { key: "subjects", name: "Matières", param: "subject_ids" },
]
const groupNames: Record<string, string> = {
  speciality: "Spécialité", subject: "Matière", class: "Classe",
  level: "Niveau", series: "Série", contract: "Contrat", none: "Sans regroupement",
}
const defaultCols: Record<View, string[]> = {
  directory: ["name", "speciality", "contract", "phone"],
  assignments: ["name", "subject", "class", "level"],
}
const blank = (): Record<FilterKey, number[]> => ({ classes: [], levels: [], series: [], subjects: [] })

export function TeachersExportDialog({ search = "" }: { search?: string }) {
  const [open, setOpen] = useState(false)
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [view, setView] = useState<View>("directory")
  const [columns, setColumns] = useState<string[]>(defaultCols.directory)
  const [group, setGroup] = useState("speciality")
  const [orientation, setOrientation] = useState("auto")
  const [ids, setIds] = useState<Record<FilterKey, number[]>>(blank)
  const [year, setYear] = useState("")
  const [loading, setLoading] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || catalog) return
    let active = true
    apiFetch<Catalog>("/admin/teachers/export/options")
      .then(data => { if (active) setCatalog(data) })
      .catch(() => { if (active) setError("Impossible de charger les filtres.") })
    return () => { active = false }
  }, [open, catalog])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  function setMode(next: View) {
    setView(next)
    setGroup(next === "directory" ? "speciality" : "subject")
    setColumns([...defaultCols[next]])
    setIds(blank())
    setError(null)
  }
  function toggle(key: FilterKey, id: number) {
    setIds(previous => ({
      ...previous,
      [key]: previous[key].includes(id) ? previous[key].filter(v => v !== id) : [...previous[key], id],
    }))
  }
  function makeQuery(): string {
    if (!columns.length) throw new Error("Choisissez au moins une colonne.")
    if (view === "assignments" && !year) throw new Error("Choisissez l'année scolaire pour lire les affectations.")
    const p = new URLSearchParams({ view, grouping: group, orientation })
    if (year) p.set("academic_year_id", year)
    if (search.trim()) p.set("search", search.trim())
    columns.forEach(key => p.append("columns", key))
    if (view === "assignments") categories.forEach(({ key, param }) => ids[key].forEach(id => p.append(param, String(id))))
    return p.toString()
  }
  async function perform(kind: DocType | "preview") {
    let params: string
    try { params = makeQuery() } catch (err) { setError((err as Error).message); return }
    setLoading(kind)
    setError(null)
    const ext = kind === "preview" ? "pdf" : kind
    try {
      const blob = await apiFetchBlob("/admin/teachers/export/" + ext + "?" + params +
        "&download=" + (kind !== "preview"))
      if (kind === "preview") setPreview(URL.createObjectURL(blob))
      else { downloadBlob(blob, "enseignants-college." + ext); toast.success("Export " + ext.toUpperCase() + " prêt") }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Échec de l'export."
      setError(msg)
      toast.error(msg)
    } finally { setLoading(null) }
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
      <Button variant="outline" className="h-11 md:h-9"><Download className="h-4 w-4" /> Exporter les enseignants</Button>
    </DialogTrigger>
    <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Composer le document des enseignants</DialogTitle>
        <DialogDescription>Logo, entête et couleurs issus des paramètres de votre établissement.</DialogDescription>
      </DialogHeader>
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {([["directory", "Répertoire", "Fiches et spécialités déclarées"],
             ["assignments", "Affectations", "Matières réellement enseignées dans les classes"]] as const).map(([id, title, hint]) =>
            <button key={id} type="button" aria-pressed={view === id} onClick={() => setMode(id)}
              className={"rounded-xl border p-3 text-left " + (view === id ? "border-primary bg-primary/5" : "")}>
              <span className="block text-sm font-semibold">{title}</span>
              <span className="text-xs text-muted-foreground">{hint}</span>
            </button>)}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm">Année scolaire
            <select className="mt-1 block h-10 w-full rounded-lg border bg-background px-2"
              value={year} onChange={e => setYear(e.target.value)}>
              <option value="">Sélectionner une année</option>
              {(catalog?.years ?? []).map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>
          <label className="text-sm">Regroupement
            <select className="mt-1 block h-10 w-full rounded-lg border bg-background px-2"
              value={group} onChange={e => setGroup(e.target.value)}>
              {Object.entries(groupNames).filter(([key]) => view === "assignments" ||
                !["subject", "class", "level", "series"].includes(key))
                .map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </label>
        </div>
        {view === "assignments" && <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Filtrer les affectations</legend>
          <p className="text-xs text-muted-foreground">Sélection multiple, filtres croisés. Aucun choix = tout le périmètre de l'année.</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {categories.map(({ key, name }) => <details key={key} className="rounded-lg border p-3">
              <summary className="cursor-pointer text-sm font-medium">{name} ({ids[key].length || "Tous"})</summary>
              <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                {(catalog?.[key] ?? []).map(item => <label key={item.id} className="flex gap-2 py-1 text-sm">
                  <input type="checkbox" checked={ids[key].includes(item.id)} onChange={() => toggle(key, item.id)} />
                  {item.name}
                </label>)}
              </div>
            </details>)}
          </div>
        </fieldset>}
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Colonnes à afficher</legend>
          <p className="text-xs text-muted-foreground">Gardez seulement le nom pour une liste épurée classée par matière, niveau ou spécialité.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Object.entries(names).map(([key, label]) =>
              <label key={key} className="flex items-center gap-2 rounded-lg border p-2 text-xs">
                <input type="checkbox" checked={columns.includes(key)}
                  onChange={e => setColumns(old => e.target.checked ?
                    [...old, key] : old.filter(c => c !== key))} />{label}
              </label>)}
          </div>
        </fieldset>
        <fieldset className="flex flex-wrap gap-4 text-sm">
          <legend className="mb-2 font-semibold">Orientation de la page</legend>
          {([["auto", "Automatique"], ["portrait", "Portrait"], ["landscape", "Paysage"]] as const)
            .map(([key, label]) => <label key={key} className="flex gap-2">
              <input type="radio" checked={orientation === key} onChange={() => setOrientation(key)} />{label}
            </label>)}
        </fieldset>
        {error && <p role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-2 border-t pt-4">
          {([["preview", "Aperçu PDF", Eye], ["pdf", "PDF", FileText],
            ["docx", "Word", FileText], ["xlsx", "Excel", FileSpreadsheet]] as const).map(([type, label, Icon]) =>
            <Button key={type} type="button" disabled={!catalog || !!loading}
              variant={type === "preview" ? "default" : "outline"} onClick={() => void perform(type)}>
              {loading === type ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}{label}
            </Button>)}
        </div>
        {preview && <section aria-label="Aperçu PDF">
          <div className="mb-2 flex justify-between text-sm font-medium">
            Aperçu du document <button className="text-primary underline" onClick={() => setPreview(null)}>Fermer</button>
          </div>
          <iframe title="Aperçu PDF enseignants" src={preview} className="h-[52vh] w-full rounded-lg border" />
        </section>}
      </div>
    </DialogContent>
  </Dialog>
}
