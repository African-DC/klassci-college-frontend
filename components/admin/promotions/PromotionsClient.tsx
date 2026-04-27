"use client"

import { useMemo, useState } from "react"
import { ArrowRight, ArrowUpFromLine, Check, RotateCcw, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useAcademicYears } from "@/lib/hooks/useAcademicYears"
import { useClasses } from "@/lib/hooks/useClasses"
import { usePromotionExecute, usePromotionPreview } from "@/lib/hooks/usePromotions"
import type {
  PromotionExecuteResponse,
  PromotionPreviewResponse,
} from "@/lib/contracts/promotion"
import { cn } from "@/lib/utils"

type WizardStep = "mapping" | "preview"

export function PromotionsClient() {
  const [sourceAyId, setSourceAyId] = useState<number | null>(null)
  const [targetAyId, setTargetAyId] = useState<number | null>(null)
  const [mapping, setMapping] = useState<Record<number, number>>({})
  const [step, setStep] = useState<WizardStep>("mapping")
  const [preview, setPreview] = useState<PromotionPreviewResponse | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [result, setResult] = useState<PromotionExecuteResponse | null>(null)

  const { data: yearsData } = useAcademicYears({ size: 50, page: 1 })
  const years = yearsData?.items ?? []

  const { data: sourceClassesData } = useClasses(
    sourceAyId ? { academic_year_id: sourceAyId, size: 100, page: 1 } : { size: 1, page: 1 },
  )
  const sourceClasses = useMemo(
    () =>
      sourceAyId
        ? (sourceClassesData?.items ?? []).filter((c) => c.academic_year_id === sourceAyId)
        : [],
    [sourceAyId, sourceClassesData],
  )

  const { data: targetClassesData } = useClasses(
    targetAyId ? { academic_year_id: targetAyId, size: 100, page: 1 } : { size: 1, page: 1 },
  )
  const targetClasses = useMemo(
    () =>
      targetAyId
        ? (targetClassesData?.items ?? []).filter((c) => c.academic_year_id === targetAyId)
        : [],
    [targetAyId, targetClassesData],
  )

  const previewMutation = usePromotionPreview()
  const executeMutation = usePromotionExecute()

  const filledMappingCount = Object.values(mapping).filter((v) => v > 0).length
  const canPreview =
    sourceAyId !== null &&
    targetAyId !== null &&
    sourceAyId !== targetAyId &&
    filledMappingCount > 0

  const stringMapping = useMemo(() => {
    const out: Record<string, number> = {}
    for (const [k, v] of Object.entries(mapping)) {
      if (v > 0) out[k] = v
    }
    return out
  }, [mapping])

  const handlePreview = () => {
    if (!sourceAyId || !targetAyId) return
    previewMutation.mutate(
      { source_ay_id: sourceAyId, target_ay_id: targetAyId, class_mapping: stringMapping },
      {
        onSuccess: (data) => {
          setPreview(data)
          setStep("preview")
        },
      },
    )
  }

  const handleExecute = () => {
    if (!sourceAyId || !targetAyId) return
    executeMutation.mutate(
      { source_ay_id: sourceAyId, target_ay_id: targetAyId, class_mapping: stringMapping },
      {
        onSuccess: (data) => {
          setResult(data)
          setConfirmOpen(false)
        },
      },
    )
  }

  const reset = () => {
    setStep("mapping")
    setPreview(null)
    setResult(null)
    setMapping({})
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <ArrowUpFromLine className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-xl tracking-tight sm:text-2xl">Promotions</h1>
            <p className="text-sm text-muted-foreground">
              Promotion en masse pour préparer la rentrée
            </p>
          </div>
        </div>
        {step === "preview" && (
          <Button variant="outline" onClick={reset} className="h-10 gap-2">
            <RotateCcw className="h-4 w-4" />
            Recommencer
          </Button>
        )}
      </div>

      {step === "mapping" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Étape 1 — Mapping des classes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="source-ay" className="text-sm font-medium">
                  Année source
                </label>
                <Select
                  value={sourceAyId?.toString() ?? ""}
                  onValueChange={(v) => {
                    setSourceAyId(Number(v))
                    setMapping({})
                  }}
                >
                  <SelectTrigger id="source-ay" className="h-11">
                    <SelectValue placeholder="Choisir l'année source" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y.id} value={y.id.toString()}>
                        {y.name}
                        {y.is_current ? " · courante" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="target-ay" className="text-sm font-medium">
                  Année cible
                </label>
                <Select
                  value={targetAyId?.toString() ?? ""}
                  onValueChange={(v) => setTargetAyId(Number(v))}
                >
                  <SelectTrigger id="target-ay" className="h-11">
                    <SelectValue placeholder="Choisir l'année cible" />
                  </SelectTrigger>
                  <SelectContent>
                    {years
                      .filter((y) => y.id !== sourceAyId)
                      .map((y) => (
                        <SelectItem key={y.id} value={y.id.toString()}>
                          {y.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {sourceAyId !== null && targetAyId !== null && sourceAyId === targetAyId && (
              <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                L&apos;année source et l&apos;année cible doivent être différentes.
              </p>
            )}

            {sourceAyId !== null && targetAyId !== null && sourceAyId !== targetAyId && (
              <ClassMappingTable
                sourceClasses={sourceClasses}
                targetClasses={targetClasses}
                mapping={mapping}
                onMappingChange={setMapping}
              />
            )}

            <div className="flex justify-end gap-2">
              <Button
                onClick={handlePreview}
                disabled={!canPreview || previewMutation.isPending}
                className="h-11 gap-2"
              >
                {previewMutation.isPending ? "Calcul…" : "Aperçu de la promotion"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "preview" && preview && (
        <PromotionPreview
          preview={preview}
          targetYearName={
            years.find((y) => y.id === targetAyId)?.name ?? `année #${targetAyId}`
          }
          onExecute={() => setConfirmOpen(true)}
          isExecuting={executeMutation.isPending}
        />
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la promotion ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de promouvoir {preview?.promotable_count ?? 0} élève
              {(preview?.promotable_count ?? 0) > 1 ? "s" : ""} vers{" "}
              {years.find((y) => y.id === targetAyId)?.name ?? "l'année cible"}. Les inscriptions
              seront créées en statut « Prospect » et apparaîtront dans la queue des inscriptions à
              valider. Action ré-exécutable : les élèves déjà promus seront ignorés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={executeMutation.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecute}
              disabled={executeMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {executeMutation.isPending ? "Promotion…" : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {result && <PromotionResultsModal result={result} onClose={reset} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 1 — Class mapping
// ---------------------------------------------------------------------------

interface ClassRow {
  id: number
  name: string
  academic_year_id: number
  max_students?: number | null | undefined
  enrolled_count?: number | undefined
}

function ClassMappingTable({
  sourceClasses,
  targetClasses,
  mapping,
  onMappingChange,
}: {
  sourceClasses: ClassRow[]
  targetClasses: ClassRow[]
  mapping: Record<number, number>
  onMappingChange: (m: Record<number, number>) => void
}) {
  if (sourceClasses.length === 0) {
    return (
      <p className="rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
        Aucune classe trouvée pour cette année source.
      </p>
    )
  }

  if (targetClasses.length === 0) {
    return (
      <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
        Aucune classe créée dans l&apos;année cible. Créez d&apos;abord les classes destination
        depuis « Classes » avant de lancer la promotion.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Pour chaque classe source, choisissez la classe destination. Laissez vide pour exclure une
        classe (les élèves de cette classe ne seront pas promus).
      </p>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full">
          <thead className="bg-muted/40">
            <tr className="text-left text-xs font-medium text-muted-foreground">
              <th className="px-3 py-2">Classe source</th>
              <th className="px-3 py-2">Classe destination</th>
            </tr>
          </thead>
          <tbody>
            {sourceClasses.map((sc) => (
              <tr key={sc.id} className="border-t">
                <td className="px-3 py-2">
                  <span className="font-medium">{sc.name}</span>
                </td>
                <td className="px-3 py-2">
                  <Select
                    value={mapping[sc.id]?.toString() ?? "none"}
                    onValueChange={(v) => {
                      const next = { ...mapping }
                      if (v === "none") {
                        delete next[sc.id]
                      } else {
                        next[sc.id] = Number(v)
                      }
                      onMappingChange(next)
                    }}
                  >
                    <SelectTrigger className="h-10 w-full sm:w-64">
                      <SelectValue placeholder="Choisir…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Ne pas promouvoir —</SelectItem>
                      {targetClasses.map((tc) => (
                        <SelectItem key={tc.id} value={tc.id.toString()}>
                          {tc.name}
                          {tc.max_students ? ` (max ${tc.max_students})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 2 — Preview + execute
// ---------------------------------------------------------------------------

function PromotionPreview({
  preview,
  targetYearName,
  onExecute,
  isExecuting,
}: {
  preview: PromotionPreviewResponse
  targetYearName: string
  onExecute: () => void
  isExecuting: boolean
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Étape 2 — Aperçu de la promotion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-primary/5 p-4">
            <p className="text-sm text-muted-foreground">Total à promouvoir</p>
            <p className="font-serif text-3xl font-semibold text-primary">
              {preview.promotable_count} élève{preview.promotable_count > 1 ? "s" : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              vers <strong>{targetYearName}</strong>
            </p>
          </div>

          {preview.capacity_warnings.length > 0 && (
            <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3">
              <div className="flex items-center gap-2">
                <TriangleAlert className="h-4 w-4 text-amber-700" />
                <p className="text-sm font-medium text-amber-900">
                  Capacité dépassée sur {preview.capacity_warnings.length} classe
                  {preview.capacity_warnings.length > 1 ? "s" : ""}
                </p>
              </div>
              <ul className="space-y-1 pl-6 text-xs text-amber-900">
                {preview.capacity_warnings.map((w) => (
                  <li key={w.target_class_id}>
                    <strong>{w.target_class_name}</strong> : {w.requested} demandés, {w.available}{" "}
                    disponibles ({w.overflow} en surnombre)
                  </li>
                ))}
              </ul>
              <p className="text-xs text-amber-900">
                Les élèves en surnombre apparaîtront dans les erreurs après l&apos;exécution.
              </p>
            </div>
          )}

          <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead className="bg-muted/40">
                <tr className="text-left text-xs font-medium text-muted-foreground">
                  <th className="px-3 py-2">Classe destination</th>
                  <th className="px-3 py-2 text-right">Élèves</th>
                  <th className="px-3 py-2 text-right">Capacité</th>
                  <th className="px-3 py-2 text-right">Restant</th>
                </tr>
              </thead>
              <tbody>
                {preview.source_classes.map((sc) => (
                  <tr key={sc.source_class_id} className="border-t">
                    <td className="px-3 py-2">
                      <span className="font-medium">{sc.target_class_name}</span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {sc.students_to_promote}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                      {sc.target_capacity}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2 text-right tabular-nums",
                        sc.target_remaining < sc.students_to_promote
                          ? "font-medium text-amber-700"
                          : "text-muted-foreground",
                      )}
                    >
                      {sc.target_remaining}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={onExecute}
              disabled={isExecuting || preview.promotable_count === 0}
              className="h-11 gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Check className="h-4 w-4" />
              Confirmer la promotion ({preview.promotable_count})
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Result modal — partial-success reporting
// ---------------------------------------------------------------------------

function PromotionResultsModal({
  result,
  onClose,
}: {
  result: PromotionExecuteResponse
  onClose: () => void
}) {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Résultat de la promotion</DialogTitle>
          <DialogDescription>
            Récapitulatif détaillé. Vous pouvez ajuster les inscriptions individuelles depuis la
            queue Inscriptions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-emerald-50 p-3">
              <p className="text-xs text-emerald-700">Promues</p>
              <p className="font-serif text-2xl font-semibold text-emerald-900">
                {result.promoted_count}
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Ignorées</p>
              <p className="font-serif text-2xl font-semibold">{result.skipped_count}</p>
              <p className="text-[10px] text-muted-foreground">déjà promues</p>
            </div>
            <div
              className={cn(
                "rounded-lg p-3",
                result.error_count > 0 ? "bg-rose-50" : "bg-muted/40",
              )}
            >
              <p
                className={cn(
                  "text-xs",
                  result.error_count > 0 ? "text-rose-700" : "text-muted-foreground",
                )}
              >
                Erreurs
              </p>
              <p
                className={cn(
                  "font-serif text-2xl font-semibold",
                  result.error_count > 0 ? "text-rose-900" : "",
                )}
              >
                {result.error_count}
              </p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="space-y-2 rounded-lg border border-rose-200 bg-rose-50/50 p-3">
              <p className="text-sm font-medium text-rose-900">
                Détail des erreurs ({result.errors.length})
              </p>
              <ul className="space-y-1 pl-2 text-xs text-rose-900">
                {result.errors.map((e) => (
                  <li key={e.source_enrollment_id} className="flex items-start gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      Élève #{e.student_id}
                    </Badge>
                    <span>{e.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="h-10">
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
