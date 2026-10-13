"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, Eye, FileSpreadsheet, FileText, Loader2, Settings2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { teacherExportsApi, type FilterOption, type TeacherExportOptions, type TeacherExportFormat, type TeacherExportRequest } from "@/lib/api/teacher-exports"

const base: TeacherExportRequest = {
  mode: "directory", academic_year_id: null,
  class_ids: [], level_ids: [], series_ids: [], subject_ids: [],
  columns: ["name", "speciality", "contract", "phone"], group: "none", orientation: "auto",
}

const dimensions = [
  { key: "level_ids", options: "levels", title: "Niveaux (6e, 5e, 4e, 3e, seconde, première, terminale)" },
  { key: "series_ids", options: "series", title: "Séries (lycée)" },
  { key: "class_ids", options: "classes", title: "Classes" },
  { key: "subject_ids", options: "subjects", title: "Matières" },
] as const

type IdsKey = typeof dimensions[number]["key"]

export function TeachersExportDialog() {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<TeacherExportOptions | null>(null)
  const [request, setRequest] = useState<TeacherExportRequest>(base)
  const [busy, setBusy] = useState<string | null>(null)
  const [lookups, setLookups] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open || options) return
    let active = true
    teacherExportsApi.options().then((data) => {
      if (!active) return
      setOptions(data)
      setRequest((old) => ({
        ...old,
        academic_year_id: data.years.find((year) => year.current)?.id ?? data.years[0]?.id ?? null,
      }))
    }).catch((error) => toast.error(error instanceof Error ? error.message : "Filtres indisponibles"))
    return () => { active = false }
  }, [open, options])

  const visible = useMemo(() => {
    if (!options) return null
    const f = (kind: typeof dimensions[number]["options"]) => (options[kind] as FilterOption[]).filter(item => {
      if (kind !== "levels" && request.level_ids.length && item.level_id && !request.level_ids.includes(item.level_id)) return false
      if (kind === "classes" && request.series_ids.length && !request.series_ids.includes(item.series_id ?? -1)) return false
      if (kind === "subjects" && request.series_ids.length && item.series_id && !request.series_ids.includes(item.series_id)) return false
      const q = (lookups[kind] ?? "").toLocaleLowerCase("fr").trim()
      return !q || item.name.toLocaleLowerCase("fr").includes(q)
    })
    return { levels: f("levels"), series: f("series"), classes: f("classes"), subjects: f("subjects") }
  }, [options, request.level_ids, request.series_ids, lookups])

  function chooseMode(mode: TeacherExportRequest["mode"]) {
    setRequest(old => ({ ...old, mode, group: mode === "directory" ? "none" : "subject",
      columns: mode === "directory" ? ["name", "speciality", "contract", "phone"] : ["name"],
      class_ids: [], level_ids: [], series_ids: [], subject_ids: [] }))
  }

  function toggle(key: IdsKey, id: number, yes: boolean) {
    setRequest(old => ({ ...old, [key]: yes
      ? [...new Set([...old[key], id])]
      : old[key].filter(x => x !== id) }))
  }

  async function run(format: TeacherExportFormat, preview = false) {
    if (!request.columns.length) { toast.error("Choisissez au moins une colonne."); return }
    if (request.mode === "assignments" && !request.academic_year_id) {
      toast.error("Sélectionnez une année scolaire."); return
    }
    const choice = preview ? "preview" : format
    setBusy(choice)
    const previewWindow = preview ? window.open("", "_blank") : null
    if (previewWindow) previewWindow.document.title = "Préparation de l’aperçu PDF..."
    try {
      const blob = await teacherExportsApi.generate(request, format, preview)
      const url = URL.createObjectURL(blob)
      if (preview) {
        if (!previewWindow) throw new Error("Autorisez les fenêtres contextuelles pour l'aperçu.")
        previewWindow.location.href = url
        window.setTimeout(() => URL.revokeObjectURL(url), 120_000)
      } else {
        const link = document.createElement("a")
        link.href = url
        link.download = `liste-enseignants.${format}`
        document.body.append(link)
        link.click()
        link.remove()
        window.setTimeout(() => URL.revokeObjectURL(url), 3000)
        toast.success("Document téléchargé")
      }
    } catch (error) {
      previewWindow?.close()
      toast.error(error instanceof Error ? error.message : "L'export a échoué")
    } finally {
      setBusy(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Exporter les enseignants</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Composer la liste des enseignants</DialogTitle>
          <DialogDescription>Sélectionnez le contenu et la présentation. Le logo et les couleurs du document proviennent des paramètres de votre établissement.</DialogDescription>
        </DialogHeader>
        {!options || !visible ? <p className="py-8 text-sm text-muted-foreground">Chargement des options…</p> : (
          <div className="space-y-5">
            <section className="space-y-2">
              <p className="text-sm font-semibold">Type de document</p>
              <div className="grid grid-cols-2 gap-2">
                {([{ mode: "directory", title: "Annuaire", hint: "Fiches de tous les enseignants" }, { mode: "assignments", title: "Par affectation", hint: "Classes et matières enseignées" }] as const).map(choice => (
                  <button key={choice.mode} type="button" onClick={() => chooseMode(choice.mode)}
                    className={`rounded-xl border px-4 py-3 text-left transition-colors ${request.mode === choice.mode ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}>
                    <span className="block font-semibold text-sm">{choice.title}</span>
                    <span className="text-xs text-muted-foreground">{choice.hint}</span>
                  </button>
                ))}
              </div>
            </section>
            {request.mode === "assignments" && (
              <section className="space-y-3">
                <label className="block text-sm font-semibold" htmlFor="teacher-export-year">Année scolaire</label>
                <select id="teacher-export-year" className="h-10 w-full rounded-lg border bg-background px-3 text-sm" value={request.academic_year_id ?? ""}
                  onChange={e => setRequest(old => ({ ...old, academic_year_id: e.target.value ? Number(e.target.value) : null }))}>
                  <option value="">Choisir une année</option>
                  {options.years.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {dimensions.map(dim => (
                    <fieldset key={dim.key} className="rounded-xl border p-3 min-w-0">
                      <legend className="px-1 text-xs font-semibold">{dim.title}</legend>
                      <input type="search" aria-label={`Rechercher dans ${dim.title}`} placeholder="Rechercher…" value={lookups[dim.options] ?? ""}
                        onChange={e => setLookups(o => ({ ...o, [dim.options]: e.target.value }))}
                        className="mb-2 h-9 w-full rounded-lg border bg-background px-3 text-sm" />
                      <div className="max-h-32 overflow-y-auto space-y-2">
                        {visible[dim.options].map(item => (
                          <label key={item.id} className="flex gap-2 items-center text-xs cursor-pointer">
                            <Checkbox checked={request[dim.key].includes(item.id)}
                              onCheckedChange={checked => toggle(dim.key, item.id, checked === true)} />
                            <span>{item.name}</span>
                          </label>
                        ))}
                        {!visible[dim.options].length && <p className="text-xs text-muted-foreground">Aucun résultat</p>}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2">{request[dim.key].length ? `${request[dim.key].length} sélection(s)` : "Toutes / tous"}</p>
                      {request[dim.key].length > 0 && <button type="button" className="text-xs text-primary" onClick={() => setRequest(o => ({...o, [dim.key]: []}))}>Effacer</button>}
                    </fieldset>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Les choix s'additionnent dans un filtre et se croisent entre filtres. Les affectations proviennent de l'emploi du temps de l'année choisie ; la fiche matière complète les enseignants sans créneau, sans inventer de classe.</p>
              </section>
            )}
            <section className="space-y-2">
              <p className="text-sm font-semibold">Colonnes à afficher</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Object.entries(options.columns).filter(([key]) => request.mode === "assignments" || !["subject", "class", "level", "series", "source"].includes(key)).map(([key, title]) => (
                  <label key={key} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs cursor-pointer">
                    <Checkbox checked={request.columns.includes(key)}
                      onCheckedChange={yes => setRequest(old => ({ ...old, columns: yes
                        ? [...old.columns, key] : old.columns.filter(c => c !== key) }))} />
                    {title}
                  </label>
                ))}
              </div>
            </section>
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold">Classification
                <select className="mt-2 h-10 w-full rounded-lg border bg-background px-3 text-sm" value={request.group}
                  onChange={e => setRequest(old => ({ ...old, group: e.target.value }))}>
                  {Object.entries(options.groups).filter(([id]) => request.mode === "assignments" || ["none", "speciality", "contract"].includes(id))
                    .map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">Orientation
                <select className="mt-2 h-10 w-full rounded-lg border bg-background px-3 text-sm" value={request.orientation}
                  onChange={e => setRequest(old => ({ ...old, orientation: e.target.value as TeacherExportRequest["orientation"] }))}>
                  <option value="auto">Automatique · privilégier portrait</option>
                  <option value="portrait">Portrait A4</option>
                  <option value="landscape">Paysage A4</option>
                </select>
              </label>
            </section>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 border-t pt-4">
              {([{ format: "pdf", preview: true, text: "Aperçu PDF", Icon: Eye }, { format: "pdf", preview: false, text: "PDF", Icon: FileText },
                { format: "docx", preview: false, text: "Word", Icon: FileText }, { format: "xlsx", preview: false, text: "Excel", Icon: FileSpreadsheet }] as const).map(action => {
                const key = action.preview ? "preview" : action.format
                return <Button key={key} type="button" variant={action.preview ? "default" : "outline"}
                  disabled={busy !== null} onClick={() => void run(action.format, action.preview)} className="gap-2">
                  {busy === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <action.Icon className="h-4 w-4" />}
                  {action.text}
                </Button>
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
