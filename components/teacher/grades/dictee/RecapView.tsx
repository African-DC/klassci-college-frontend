"use client"

import { AlertTriangle, Check, ChevronLeft, Loader2, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { entryToneClass, formatEntry, type EntryValue } from "./types"

interface RecapStudent {
  student_id: number
  student_name: string
}

interface RecapViewProps {
  grades: RecapStudent[]
  entries: Map<number, EntryValue>
  evaluationTitle?: string
  onModify: (idx: number) => void
  onSubmit: () => void
  onCancel: () => void
  isSubmitting: boolean
}

/** Écran récap — revue finale avant enregistrement batch. */
export function RecapView({
  grades,
  entries,
  evaluationTitle,
  onModify,
  onSubmit,
  onCancel,
  isSubmitting,
}: RecapViewProps) {
  const filled = grades.filter((g) => entries.get(g.student_id) !== undefined).length
  const absent = grades.filter((g) => entries.get(g.student_id) === null).length
  const missing = grades.length - filled

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-10 w-10 text-white/80 hover:bg-white/10 hover:text-white"
          aria-label="Retour à la dictée"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="font-serif text-xl tracking-tight">Récapitulatif</h2>
          {evaluationTitle && <p className="text-xs text-white/60">{evaluationTitle}</p>}
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-2xl grid-cols-3 gap-2 px-4 py-3">
        <RecapTile label="Saisies" value={filled - absent} tone="ok" />
        <RecapTile label="Absents" value={absent} tone="warn" />
        <RecapTile label="Manquants" value={missing} tone={missing > 0 ? "danger" : "neutral"} />
      </div>

      <div className="mx-auto min-h-0 w-full max-w-2xl flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        {grades.map((g, idx) => {
          const v = entries.get(g.student_id)
          const isMissing = v === undefined
          return (
            <button
              type="button"
              key={g.student_id}
              onClick={() => onModify(idx)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
                "border-white/10 bg-white/[0.02] hover:bg-white/10",
                isMissing && "border-rose-400/30 bg-rose-400/5",
              )}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs tabular-nums">
                {idx + 1}
              </span>
              <span className="flex-1 truncate text-sm">{g.student_name}</span>
              <span className={cn("text-base font-semibold tabular-nums", entryToneClass(v))}>
                {formatEntry(v)}
              </span>
              <Pencil className="h-4 w-4 text-white/40" />
            </button>
          )
        })}
      </div>

      <div className="mx-auto w-full max-w-2xl space-y-2 border-t border-white/10 px-4 py-4">
        {missing > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              {missing} élève{missing > 1 ? "s" : ""} sans note. Vous pourrez les
              compléter plus tard.
            </span>
          </div>
        )}
        <Button
          size="lg"
          onClick={onSubmit}
          disabled={isSubmitting || filled === 0}
          className="h-14 w-full bg-emerald-500 text-white hover:bg-emerald-600"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Check className="mr-2 h-5 w-5" />
              Enregistrer {filled} note{filled > 1 ? "s" : ""}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function RecapTile({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "ok" | "warn" | "danger" | "neutral"
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wider text-white/50">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          tone === "ok" && "text-emerald-300",
          tone === "warn" && "text-amber-300",
          tone === "danger" && "text-rose-300",
          tone === "neutral" && "text-white",
        )}
      >
        {value}
      </p>
    </div>
  )
}
